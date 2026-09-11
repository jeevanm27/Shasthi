-- ── order_status ENUM (guarded for repeated runs) ───────────────────────────
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── orders table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    TEXT UNIQUE NOT NULL,             -- Kafka eventId, prevents duplicate processing
  user_id     UUID NOT NULL,
  user_email  TEXT NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  status      order_status NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── order_items table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL,
  product_name   TEXT NOT NULL,
  quantity_grams INTEGER NOT NULL CHECK (quantity_grams > 0),
  price_locked   NUMERIC(10,4) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
