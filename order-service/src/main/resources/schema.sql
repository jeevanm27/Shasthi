-- ── orders table ─────────────────────────────────────────────────────────────
-- NOTE: Using TEXT + CHECK instead of a custom ENUM type.
-- Reason: Spring Boot ScriptUtils splits SQL on ';' and cannot handle
-- PostgreSQL dollar-quoting (DO $$ ... END $$) used for conditional CREATE TYPE.
CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    TEXT UNIQUE NOT NULL,
  user_id     UUID NOT NULL,
  user_email  TEXT NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
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
