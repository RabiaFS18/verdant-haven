-- 0001 · Storefront in PKR, validated data, atomic checkout
-- Safe to run once on top of 0000. Review before applying to a database that holds real orders.

-- 1. Remove the US-dollar demo catalog that shipped with 0000 (order history keeps its own copy of
--    each item name and price, and order_items.product_id is ON DELETE SET NULL).
DELETE FROM public.products WHERE slug IN ('monstera-deliciosa','marble-queen-pothos','pink-princess-philodendron','calathea-orbifolia','snake-plant-laurentii','zz-plant','fiddle-leaf-fig','string-of-pearls','variegated-monstera-albo','anthurium-clarinervium','handmade-terracotta-pot','speckled-stoneware-planter','olive-tree','lavender-hidcote','boston-fern','plant-care-kit');

-- 2. Orders: Pakistan defaults, optional postal code, delivery notes, cash on delivery.
ALTER TABLE public.orders ALTER COLUMN country SET DEFAULT 'Pakistan';
ALTER TABLE public.orders ALTER COLUMN postal_code SET DEFAULT '';
ALTER TABLE public.orders ALTER COLUMN payment_method SET DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

-- 3. Guard rails the application relies on. NOT VALID checks new writes without rescanning old rows.
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check CHECK (category IN ('indoor','outdoor','both','seeds','bare','pots')) NOT VALID,
  ADD CONSTRAINT products_price_check CHECK (price >= 0) NOT VALID,
  ADD CONSTRAINT products_stock_check CHECK (stock >= 0) NOT VALID;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_total_check CHECK (total = subtotal + shipping) NOT VALID,
  ADD CONSTRAINT orders_status_check CHECK (status IN ('processing','confirmed','shipped','delivered','cancelled')) NOT VALID,
  ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending','paid','refunded','failed')) NOT VALID,
  ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cod','card')) NOT VALID;
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_quantity_check CHECK (quantity > 0) NOT VALID;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_email_check CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') NOT VALID;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);

-- 4. Atomic checkout. Prices come from this table, stock is decremented under row locks, and the
--    order plus its items are written in a single transaction. Only the server (service role) can call it.
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

    SELECT * INTO v_product FROM public.products WHERE slug = v_line.slug FOR UPDATE;
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

-- 5. Product catalog (generated from src/data/catalog.ts).
-- Generated by scripts/generate-catalog-sql.ts — do not edit by hand.
INSERT INTO public.products
  (slug, name, description, price, category, light, water, rating, reviews_count, tag, image_position, stock, is_featured)
VALUES
  ('dieffenbachia', 'Dieffenbachia', 'Bold variegated leaves that brighten any corner.', 11800, 'indoor', 'Bright indirect', 'Weekly', 4.9, 128, 'Best seller', 'center', 25, true),
  ('spider-plant', 'Spider Plant', 'Forgiving, fast-growing, and pet-friendly.', 7800, 'indoor', 'Low to bright', 'Biweekly', 4.8, 94, NULL, 'center', 25, true),
  ('croton-petra', 'Croton Petra', 'Fiery foliage in greens, yellows, and reds — happy indoors or on a sunny patio.', 13400, 'both', 'Bright light', 'Weekly', 5, 61, 'Colorful pick', 'center', 25, false),
  ('desert-rose', 'Desert Rose', 'A sculptural succulent with rose-pink blooms.', 10000, 'indoor', 'Bright and sunny', 'When dry', 4.7, 83, NULL, 'center', 25, false),
  ('areca-palm', 'Areca Palm', 'Feathery fronds that soften tall spaces.', 18000, 'indoor', 'Bright indirect', 'Weekly', 4.8, 112, 'Statement', 'center', 25, true),
  ('crown-of-thorns', 'Crown of Thorns', 'Cheerful pink blooms nearly all year round — thrives inside or out.', 9000, 'both', 'Full sun', 'When dry', 4.6, 58, NULL, 'center', 25, false),
  ('arabian-jasmine', 'Arabian Jasmine', 'Sweet-scented white blossoms for warm spots.', 10600, 'outdoor', 'Full to partial sun', 'Twice weekly', 4.9, 147, 'Fragrant', 'center', 25, true),
  ('periwinkle', 'Periwinkle Pink (Sadabahar)', 'A hardy ground cover of endless pink flowers.', 5000, 'outdoor', 'Full sun', 'Weekly', 4.7, 76, NULL, 'center', 25, false),
  ('sage-ceramic-pot', 'Sage Ceramic Pot', 'Hand-glazed stoneware in our signature sage.', 6700, 'pots', '—', '—', 4.8, 43, NULL, 'center 70%', 25, false),
  ('terracotta-classic', 'Terracotta Classic', 'Breathable clay that roots love.', 4500, 'pots', '—', '—', 4.9, 88, NULL, 'center 75%', 25, false),
  ('nursery-pot-set', 'Nursery Pot Set', 'A trio of sturdy pots for repotting day.', 3400, 'pots', '—', '—', 4.6, 35, NULL, 'center 80%', 25, false),
  ('organic-potting-mix', 'Organic Potting Mix', 'Peat-free blend with slow-release nutrients.', 3900, 'pots', '—', '—', 4.8, 102, NULL, 'center 80%', 25, false),
  ('baby-spider-plant-bare-root', 'Baby Spider Plant (Bare Root)', 'A young bare-root plantlet, ready for your own pot.', 3400, 'bare', 'Low to bright', 'Biweekly', 4.8, 41, 'Without pot', 'center', 25, false),
  ('desert-rose-cutting-bare-root', 'Desert Rose Cutting (Bare Root)', 'A rooted cutting sold without a pot — plant it your way.', 2800, 'bare', 'Bright and sunny', 'When dry', 4.6, 29, 'Without pot', 'center', 25, false),
  ('baby-dieffenbachia-bare-root', 'Baby Dieffenbachia (Bare Root)', 'A compact bare-root start of our best-selling dieffenbachia.', 4200, 'bare', 'Bright indirect', 'Weekly', 4.7, 22, 'Without pot', 'center', 25, false),
  ('arabian-jasmine-seeds', 'Arabian Jasmine Seeds', 'A pack of 20 fragrant jasmine seeds for patient growers.', 1700, 'seeds', 'Full to partial sun', 'Keep moist', 4.5, 64, 'Seeds', 'center', 25, false),
  ('periwinkle-seeds', 'Periwinkle Seeds', 'A pack of 50 seeds for a carpet of pink blooms.', 1400, 'seeds', 'Full sun', 'Keep moist', 4.6, 53, 'Seeds', 'center', 25, false),
  ('areca-palm-seeds', 'Areca Palm Seeds', 'Grow your own feathery palm from seed — pack of 10.', 2000, 'seeds', 'Bright indirect', 'Keep moist', 4.4, 31, 'Seeds', 'center', 25, false),
  ('snake-plant', 'Snake Plant', 'Upright, architectural leaves that thrive on neglect.', 6500, 'indoor', 'Low to bright', 'Every 2–3 weeks', 0, 0, 'Low maintenance', 'center', 25, false),
  ('money-plant', 'Money Plant (Golden Pothos)', 'A trailing classic that grows happily in a pot or a jar of water.', 3500, 'indoor', 'Low to bright indirect', 'Weekly', 0, 0, NULL, 'center', 25, false),
  ('zz-plant', 'ZZ Plant', 'Glossy, drought-tolerant leaves that cope with dim corners.', 9500, 'indoor', 'Low to medium', 'Every 2–3 weeks', 0, 0, NULL, 'center', 25, false),
  ('peace-lily', 'Peace Lily', 'Dark green foliage and elegant white blooms, even in shade.', 8500, 'indoor', 'Low to medium indirect', 'Weekly, keep lightly moist', 0, 0, NULL, 'center', 25, false),
  ('aglaonema', 'Aglaonema (Chinese Evergreen)', 'Patterned leaves in green and pink that tolerate low light.', 8000, 'indoor', 'Low to medium', 'Weekly', 0, 0, NULL, 'center', 25, false),
  ('rubber-plant', 'Rubber Plant', 'Bold, glossy leaves that make a quiet statement.', 12500, 'indoor', 'Bright indirect', 'Weekly', 0, 0, NULL, 'center', 25, false),
  ('aloe-vera', 'Aloe Vera', 'A sun-loving succulent that is as useful as it is handsome.', 4500, 'indoor', 'Bright sun', 'Every 2–3 weeks', 0, 0, NULL, 'center', 25, false),
  ('bougainvillea', 'Bougainvillea', 'Papery magenta bracts that flower generously in strong sun.', 9000, 'outdoor', 'Full sun', 'Twice weekly', 0, 0, 'Flowering', 'center', 25, false),
  ('hibiscus', 'Hibiscus', 'Large, vivid blooms for sunny gardens and balconies.', 8500, 'outdoor', 'Full sun', '2–3 times weekly', 0, 0, 'Flowering', 'center', 25, false),
  ('rose', 'Rose (Gulab)', 'Classic, fragrant garden roses for a sunny spot.', 7500, 'outdoor', 'Full sun, 6+ hours', 'Deeply, every few days', 0, 0, 'Fragrant', 'center', 25, false),
  ('marigold', 'Marigold (Genda)', 'Cheerful orange and gold flowers that keep blooming.', 3000, 'outdoor', 'Full sun', 'Every 2–3 days', 0, 0, NULL, 'center', 25, false),
  ('marigold-seeds', 'Marigold (Genda) Seeds', 'A pack of seeds for bright orange and gold blooms.', 1200, 'seeds', 'Full sun', 'Keep moist until sprouted', 0, 0, 'Seeds', 'center', 25, false),
  ('sunflower-seeds', 'Sunflower Seeds', 'Tall, cheerful sunflowers that love the summer heat.', 1300, 'seeds', 'Full sun', 'Water regularly', 0, 0, 'Seeds', 'center', 25, false),
  ('tulsi-seeds', 'Tulsi (Holy Basil) Seeds', 'A fragrant, easy herb for pots and kitchen windowsills.', 1000, 'seeds', 'Sun to partial sun', 'Keep evenly moist', 0, 0, 'Seeds', 'center', 25, false),
  ('cosmos-seeds', 'Cosmos Seeds', 'Light, airy flowers that attract bees and butterflies.', 1100, 'seeds', 'Full sun', 'Water moderately', 0, 0, 'Seeds', 'center', 25, false),
  ('coriander-seeds', 'Coriander (Dhaniya) Seeds', 'Sow, snip, and cook: fresh coriander from your own pot.', 900, 'seeds', 'Sun to partial sun', 'Keep evenly moist', 0, 0, 'Seeds', 'center', 25, false),
  ('frangipani-champa', 'Frangipani (Champa)', 'Sweetly scented, creamy blossoms on a sculptural, sun-loving tree.', 6500, 'outdoor', 'Full sun', 'Weekly, let soil dry between', 0, 0, 'Fragrant', 'center', 25, false),
  ('ixora', 'Ixora', 'Dense clusters of long-lasting pink-red blooms on glossy green foliage.', 4500, 'outdoor', 'Full to partial sun', '2–3 times weekly', 0, 0, 'Flowering', 'center', 25, false),
  ('raat-ki-rani', 'Raat Ki Rani (Night-Blooming Jasmine)', 'Small white flowers that release a rich perfume after dark.', 4000, 'outdoor', 'Full sun to partial shade', '2–3 times weekly', 0, 0, 'Fragrant at night', 'center', 25, false),
  ('mint-pudina', 'Mint (Pudina)', 'Fresh, fast-growing mint for chutneys, chai and summer drinks.', 1200, 'outdoor', 'Sun to partial sun', 'Keep soil moist', 0, 0, 'Kitchen herb', 'center', 25, false),
  ('curry-leaf-kari-patta', 'Curry Leaf (Kari Patta)', 'A fragrant kitchen plant: pick leaves fresh for tadka and curries.', 3500, 'outdoor', 'Full sun', 'Weekly', 0, 0, 'Kitchen herb', 'center', 25, false),
  ('lemon-plant-nimbu', 'Lemon Plant (Nimbu)', 'A compact citrus for pots and patios, with fragrant blossom and fruit.', 7500, 'outdoor', 'Full sun', 'Weekly, deeply', 0, 0, 'Fruiting', 'center', 25, false),
  ('baby-sun-rose', 'Baby Sun Rose', 'A trailing succulent with fresh variegated leaves and tiny magenta blooms.', 2500, 'outdoor', 'Full sun', 'Weekly, let soil dry between', 0, 0, 'Trailing flowers', 'center', 25, false),
  ('dracaena', 'Dracaena (Dragon Tree)', 'Slim, upright leaves edged in red, a sharp and easy statement for corners.', 6000, 'indoor', 'Low to bright indirect', 'Every 1–2 weeks', 0, 0, 'Architectural', 'center', 25, false),
  ('syngonium', 'Syngonium (Arrowhead Plant)', 'Soft, arrow-shaped leaves with pale veining, lovely in hanging pots.', 3500, 'indoor', 'Medium indirect', 'Weekly', 0, 0, 'Trailing', 'center', 25, false),
  ('jade-plant-bonsai', 'Jade Plant Bonsai', 'A sculpted miniature tree with a thick trunk and glossy, rounded leaves.', 8500, 'indoor', 'Bright sun', 'Every 2 weeks', 0, 0, 'Bonsai', 'center', 25, false),
  ('periwinkle-white', 'Periwinkle White (Sadabahar)', 'Crisp white blooms on glossy leaves, flowering almost all year in the sun.', 5000, 'outdoor', 'Full sun', 'Weekly', 0, 0, 'White blooms', 'center', 25, false),
  ('monstera-deliciosa', 'Monstera Deliciosa', 'Big, split leaves that turn any room into a jungle.', 9500, 'indoor', 'Bright indirect', 'Weekly', 0, 0, 'Statement leaves', 'center', 25, false),
  ('fan-palm', 'Fan Palm', 'Broad, pleated fronds that bring a calm, tropical look indoors.', 9000, 'indoor', 'Bright indirect', 'Weekly', 0, 0, 'Statement', 'center', 25, false),
  ('bamboo-palm', 'Bamboo Palm', 'Slender canes and feathery fronds, a graceful floor plant.', 12000, 'indoor', 'Bright indirect', 'Weekly', 0, 0, 'Floor plant', 'center', 25, false),
  ('ponytail-palm', 'Ponytail Palm', 'A swollen trunk with long, curling leaves; stores water, forgives forgetting.', 8000, 'indoor', 'Bright light', 'Every 2–3 weeks', 0, 0, 'Low maintenance', 'center', 25, false),
  ('weeping-fig-variegated', 'Weeping Fig (Variegated)', 'A small tree with cream-edged leaves and a light, airy shape.', 6500, 'indoor', 'Bright indirect', 'Weekly', 0, 0, 'Variegated', 'center', 25, false),
  ('calathea-peacock', 'Calathea (Peacock Plant)', 'Painted leaves in green and cream that fold up at night.', 6000, 'indoor', 'Medium indirect', 'Weekly, keep lightly moist', 0, 0, 'Patterned leaves', 'center', 25, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  light = EXCLUDED.light,
  water = EXCLUDED.water,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  tag = EXCLUDED.tag,
  image_position = EXCLUDED.image_position,
  is_featured = EXCLUDED.is_featured;
