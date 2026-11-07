-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  light text NOT NULL DEFAULT 'Bright indirect',
  water text NOT NULL DEFAULT 'Weekly',
  rating numeric(2,1) NOT NULL DEFAULT 4.8,
  reviews_count integer NOT NULL DEFAULT 0,
  tag text,
  image_position text NOT NULL DEFAULT '0%',
  stock integer NOT NULL DEFAULT 25,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- WISHLIST
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'United States',
  subtotal numeric(10,2) NOT NULL,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'card',
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL,
  image_position text NOT NULL DEFAULT '0%'
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- NEWSLETTER
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- SEED PRODUCTS
INSERT INTO public.products (slug, name, description, price, category, light, water, rating, reviews_count, tag, image_position, is_featured) VALUES
('monstera-deliciosa','Monstera Deliciosa','A statement plant with dramatic split leaves that thrives in bright, filtered light.',42,'Indoor Plants','Bright indirect','Weekly',4.9,128,'Best seller','0%',true),
('marble-queen-pothos','Marble Queen Pothos','Beautifully variegated, forgiving and fast growing — perfect for first-time plant parents.',28,'Indoor Plants','Low to bright','Biweekly',4.8,94,NULL,'33.333%',true),
('pink-princess-philodendron','Pink Princess Philodendron','A rare collector favourite with striking pink variegation on deep green leaves.',78,'Rare Collectors','Bright indirect','Weekly',5.0,61,'Rare find','66.666%',true),
('calathea-orbifolia','Calathea Orbifolia','Bold silver-striped foliage that loves humidity and consistently moist soil.',36,'Indoor Plants','Medium indirect','Keep moist',4.7,83,NULL,'100%',true),
('snake-plant-laurentii','Snake Plant Laurentii','Nearly indestructible, air-purifying and happy in the darkest corners of your home.',32,'Low Light Succulents','Low light','Monthly',4.9,212,'Easy care','0%',false),
('zz-plant','ZZ Plant','Glossy architectural leaves with an appetite for neglect — the ultimate low effort plant.',34,'Low Light Succulents','Low to medium','Monthly',4.8,167,NULL,'33.333%',false),
('fiddle-leaf-fig','Fiddle Leaf Fig','The designer''s darling. Tall, sculptural and stunning beside a sunny window.',68,'Indoor Plants','Bright indirect','Weekly',4.6,145,NULL,'66.666%',false),
('string-of-pearls','String of Pearls','Cascading strands of tiny green beads, made for a high shelf or hanging pot.',26,'Low Light Succulents','Bright light','Every 2 weeks',4.5,88,NULL,'100%',false),
('variegated-monstera-albo','Variegated Monstera Albo','An exceptional collector piece with creamy white variegation on every leaf.',185,'Rare Collectors','Bright indirect','Weekly',5.0,34,'Rare find','0%',false),
('anthurium-clarinervium','Anthurium Clarinervium','Velvet heart-shaped leaves with bright white veining — a true showpiece.',96,'Rare Collectors','Medium indirect','Keep moist',4.9,42,NULL,'33.333%',false),
('handmade-terracotta-pot','Handmade Terracotta Pot','Hand-thrown breathable terracotta with a matching drip tray, in three sizes.',24,'Decorative Ceramic Pots','—','—',4.8,76,NULL,'66.666%',false),
('speckled-stoneware-planter','Speckled Stoneware Planter','Matte speckled glaze stoneware planter that suits every interior palette.',38,'Decorative Ceramic Pots','—','—',4.7,59,'New','100%',false),
('olive-tree','Olive Tree','A sun-loving Mediterranean classic for balconies, patios and bright corners.',82,'Outdoor Plants','Full sun','Weekly',4.7,64,NULL,'0%',false),
('lavender-hidcote','Lavender Hidcote','Fragrant purple spikes that bees adore — beautiful in pots or borders.',22,'Outdoor Plants','Full sun','Weekly',4.6,103,NULL,'33.333%',false),
('boston-fern','Boston Fern','Lush feathery fronds that love a humid bathroom or shaded porch.',30,'Outdoor Plants','Partial shade','Keep moist',4.5,71,NULL,'66.666%',false),
('plant-care-kit','Complete Plant Care Kit','Organic feed, moisture meter, mister and pruning snips in one gift-ready box.',45,'Decorative Ceramic Pots','—','—',4.9,118,'Bundle','100%',false);
