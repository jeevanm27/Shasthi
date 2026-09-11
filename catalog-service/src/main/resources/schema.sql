-- ── Products table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  price_per_gram   NUMERIC(10,4) NOT NULL CHECK (price_per_gram > 0),
  stock_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url        TEXT,
  available        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed data (upsert so repeated restarts are idempotent) ───────────────────
INSERT INTO products (slug, name, category, description, price_per_gram, stock_quantity, image_url, available)
VALUES
  ('turmeric-powder',  'Turmeric Powder',  'Powders', 'Golden, aromatic turmeric for daily cooking.',           0.4750, 500, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop', TRUE),
  ('sambar-powder',    'Sambar Powder',    'Blends',  'A balanced South Indian spice blend.',                   0.6000, 300, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop', TRUE),
  ('rasam-powder',     'Rasam Powder',     'Blends',  'Peppery, fragrant blend for comforting rasam.',          0.7333, 200, 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&auto=format&fit=crop', TRUE),
  ('idli-podi',        'Idli Podi',        'Podis',   'Roasted lentil and chilli condiment powder.',            0.6750, 400, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop', TRUE),
  ('mango-thokku',     'Mango Thokku',     'Pickles', 'Tangy mango relish made in small batches.',              0.6000, 150, 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&auto=format&fit=crop', FALSE)
ON CONFLICT (slug) DO NOTHING;
