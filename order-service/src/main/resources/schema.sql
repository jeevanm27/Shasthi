CREATE TABLE IF NOT EXISTS customer_orders (
  id VARCHAR(36) PRIMARY KEY, status VARCHAR(32) NOT NULL, customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL, total NUMERIC(10, 2) NOT NULL CHECK (total >= 0), created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY, order_id VARCHAR(36) NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_id VARCHAR(120) NOT NULL, name VARCHAR(200) NOT NULL, quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON customer_orders(created_at DESC);
