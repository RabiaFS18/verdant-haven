-- 0002 · Admin panel: admin allowlist, product visibility, order management
-- After applying, make yourself an admin (see README, "Admin panel").

-- 1. Who may use /admin. No policies on purpose: only the server (service role) can read or write it.
CREATE TABLE public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM anon, authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- 2. Hide a product from the shop without deleting it, and track order changes.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';

-- 3. Checkout must not sell hidden products.
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer jsonb,
  p_items jsonb,
  p_user_id uuid DEFAULT NULL,
  p_free_delivery_threshold numeric DEFAULT 14000,
  p_delivery_fee numeric DEFAULT 350
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line record;
  v_product public.products%ROWTYPE;
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2);
  v_total numeric(10,2);
  v_order_id uuid;
  v_order_number text;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  -- Merge duplicate slugs and lock product rows in a stable order so concurrent orders cannot deadlock.
  FOR v_line IN
    SELECT i ->> 'slug' AS slug, sum((i ->> 'quantity')::integer) AS qty
    FROM jsonb_array_elements(p_items) AS i
    GROUP BY 1
    ORDER BY 1
  LOOP
    IF v_line.qty < 1 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY:%', v_line.slug;
    END IF;

    SELECT * INTO v_product FROM public.products WHERE slug = v_line.slug AND is_active FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'UNKNOWN_PRODUCT:%', v_line.slug;
    END IF;
    IF v_product.stock < v_line.qty THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%', v_line.slug;
    END IF;

    UPDATE public.products SET stock = stock - v_line.qty WHERE id = v_product.id;
    v_subtotal := v_subtotal + v_product.price * v_line.qty;
  END LOOP;

  v_shipping := CASE WHEN v_subtotal >= p_free_delivery_threshold THEN 0 ELSE p_delivery_fee END;
  v_total := v_subtotal + v_shipping;
  v_order_number := 'VH-' || to_char(now() AT TIME ZONE 'Asia/Karachi', 'YYMMDD') || '-'
                    || upper(substr(md5(gen_random_uuid()::text), 1, 5));

  INSERT INTO public.orders (
    order_number, user_id, email, full_name, phone, address, city, postal_code, country, notes,
    subtotal, shipping, total, payment_method, payment_status
  ) VALUES (
    v_order_number, p_user_id,
    p_customer ->> 'email', p_customer ->> 'fullName', p_customer ->> 'phone',
    p_customer ->> 'address', p_customer ->> 'city',
    coalesce(p_customer ->> 'postalCode', ''), 'Pakistan', coalesce(p_customer ->> 'notes', ''),
    v_subtotal, v_shipping, v_total, 'cod', 'pending'
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, name, unit_price, quantity, image_position)
  SELECT v_order_id, p.id, p.name, p.price, m.qty, p.image_position
  FROM (
    SELECT i ->> 'slug' AS slug, sum((i ->> 'quantity')::integer)::integer AS qty
    FROM jsonb_array_elements(p_items) AS i
    GROUP BY 1
  ) AS m
  JOIN public.products AS p ON p.slug = m.slug;

  RETURN jsonb_build_object(
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, uuid, numeric, numeric) TO service_role;

-- 4. Change an order's status. Cancelling puts the stock back; a cancelled order cannot be revived
--    (that would need the stock taken again), so the shop owner places a fresh order instead.
CREATE OR REPLACE FUNCTION public.admin_set_order_status(
  p_order_id uuid,
  p_status text,
  p_payment_status text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;
  IF p_status NOT IN ('processing','confirmed','shipped','delivered','cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;
  IF p_payment_status IS NOT NULL AND p_payment_status NOT IN ('pending','paid','refunded','failed') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATUS';
  END IF;
  IF v_order.status = 'cancelled' AND p_status <> 'cancelled' THEN
    RAISE EXCEPTION 'ORDER_CANCELLED';
  END IF;

  IF p_status = 'cancelled' AND v_order.status <> 'cancelled' THEN
    UPDATE public.products AS p
       SET stock = p.stock + oi.quantity
      FROM public.order_items AS oi
     WHERE oi.order_id = v_order.id AND oi.product_id = p.id;
  END IF;

  UPDATE public.orders
     SET status = p_status,
         payment_status = coalesce(p_payment_status, payment_status),
         admin_notes = coalesce(p_admin_notes, admin_notes),
         updated_at = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('id', p_order_id, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_order_status(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_order_status(uuid, text, text, text) TO service_role;
