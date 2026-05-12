CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gst_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  fulfillment_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  seller_id TEXT NOT NULL REFERENCES sellers(id),
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  warehouse_code TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

UPDATE products
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE orders
SET order_number = CONCAT('ZENVY-', EXTRACT(YEAR FROM NOW())::TEXT, '-', RIGHT(REPLACE(id, '-', ''), 8))
WHERE order_number IS NULL;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  client_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'silver',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  media_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  order_id TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS behavior_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  category_hint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, full_name, email, role)
VALUES
  ('usr_demo_1', 'Aarav Mehta', 'aarav@zenvy.dev', 'user'),
  ('usr_admin_1', 'Naina Kapoor', 'naina@zenvy.dev', 'admin'),
  ('usr_seller_1', 'Rohan Verma', 'rohan@zenvy.dev', 'seller')
ON CONFLICT (id) DO NOTHING;

UPDATE users
SET
  role = CASE WHEN role = 'customer' THEN 'user' ELSE role END,
  password_hash = CASE
    WHEN id = 'usr_demo_1' THEN 'scrypt$140b2c1ddf3e630716d748c2431b5e17$368b06430903cc9cd88a06f9e89ec3a8bbab688f4a100fde52c237cd9d4def4552c74af1819d1358c3399676f97acef36065c45bd24c28fe16e3e9efb5729800'
    WHEN id = 'usr_admin_1' THEN 'scrypt$56ae8ab66c6f2e7b375904151986ab08$fb6ad74779ac2788464913af6abdf4291acca0b720866b66dfd2521d604bd02bfcd444fd9a314f24f7b45f5acdcbef86df493063aed2aa8ccdc017b380e65689'
    WHEN id = 'usr_seller_1' THEN 'scrypt$acd8b0cd955b933d4bf8d61d13fb1978$ceb1906509c812ccb0a6f4b2e6ab0bcbe4c77f4021f527e9e382504a94d0177de4b2f4d7bde0fe365fea1158c806af092d041f920eb39c4ff71092491be7c68a'
    ELSE password_hash
  END
WHERE password_hash = '' OR role = 'customer' OR id IN ('usr_demo_1', 'usr_admin_1', 'usr_seller_1');

INSERT INTO sellers (id, name, gst_number, status, rating, fulfillment_score)
VALUES
  ('seller_techhub', 'TechHub Electronics', '27ABCDE1234F1Z5', 'active', 4.7, 96),
  ('seller_fitnessx', 'FitnessX Gear', '29PQRSX5678L1Z2', 'active', 4.5, 92),
  ('seller_sonicmart', 'SonicMart Audio', '07LMNOP4321Q1Z8', 'active', 4.6, 94)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, sku, slug, name, description, category, price_amount, currency, seller_id, tags)
VALUES
  (
    'prd_phone_1',
    'ZNV-SMART-001',
    'zenvy-nova-x',
    'Zenvy Nova X',
    'Flagship 5G smartphone with AI photography pipeline and AMOLED display.',
    'electronics',
    69999.00,
    'INR',
    'seller_techhub',
    ARRAY['smartphone', '5g', 'camera']
  ),
  (
    'prd_watch_1',
    'ZNV-WEAR-002',
    'pulsefit-pro',
    'PulseFit Pro',
    'Health-focused smartwatch with GPS, SpO2, and 10-day battery life.',
    'wearables',
    14999.00,
    'INR',
    'seller_fitnessx',
    ARRAY['watch', 'fitness', 'gps']
  ),
  (
    'prd_audio_1',
    'ZNV-AUDIO-003',
    'echobuds-air',
    'EchoBuds Air',
    'Noise-cancelling wireless earbuds with low-latency gaming mode.',
    'audio',
    4999.00,
    'INR',
    'seller_sonicmart',
    ARRAY['earbuds', 'audio', 'gaming']
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory (product_id, available_quantity, reserved_quantity, warehouse_code)
VALUES
  ('prd_phone_1', 120, 4, 'mum-a'),
  ('prd_watch_1', 80, 3, 'blr-b'),
  ('prd_audio_1', 200, 7, 'del-c')
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO carts (id, user_id)
VALUES
  ('cart_demo_1', 'usr_demo_1')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES
  ('cart_demo_1', 'prd_watch_1', 1)
ON CONFLICT (cart_id, product_id) DO NOTHING;

INSERT INTO reviews (id, product_id, user_id, rating, title, comment)
VALUES
  (
    'rev_demo_1',
    'prd_phone_1',
    'usr_demo_1',
    5,
    'Excellent flagship',
    'Camera quality and battery life are both impressive for daily use.'
  ),
  (
    'rev_demo_2',
    'prd_audio_1',
    'usr_admin_1',
    4,
    'Great value',
    'Comfortable fit and strong ANC for the price point.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO loyalty_accounts (user_id, points_balance, tier)
VALUES
  ('usr_demo_1', 240, 'silver'),
  ('usr_admin_1', 1200, 'gold')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO product_media (id, product_id, url, alt_text, media_order)
VALUES
  ('media_phone_1', 'prd_phone_1', 'https://cdn.zenvy.dev/products/nova-x/front.jpg', 'Nova X front view', 1),
  ('media_watch_1', 'prd_watch_1', 'https://cdn.zenvy.dev/products/pulsefit/front.jpg', 'PulseFit Pro hero image', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, channel, title, message, status)
VALUES
  ('notif_demo_1', 'usr_demo_1', 'push', 'Order update', 'Your Zenvy Nova X order is ready for payment.', 'unread')
ON CONFLICT (id) DO NOTHING;
