import express from 'express';
import cors    from 'cors';
import { pool } from './db.js';
import healthRouter   from './routes/health.js';
import authRouter     from './routes/auth.js';
import productsRouter from './routes/products.js';
import insightsRouter from './routes/insights.js';
import paymentsRouter from './routes/payments.js';
import userRouter     from './routes/user.js';

const app  = express();
const port = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.use('/health',        healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api/products',  productsRouter);
app.use('/api/insights',  insightsRouter);
app.use('/api/payments',  paymentsRouter);
app.use('/api/user',      userRouter);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected catalog service error' });
});

// Seed data with Unsplash images for each product
const seedProducts = [
  [
    'turmeric-powder', 'Turmeric Powder', 'Powders', 95, '200 g', 'Everyday essential', true,
    'Golden, aromatic turmeric for daily cooking.',
    'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop',
  ],
  [
    'sambar-powder', 'Sambar Powder', 'Blends', 120, '200 g', 'Best seller', true,
    'A balanced South Indian spice blend.',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop',
  ],
  [
    'rasam-powder', 'Rasam Powder', 'Blends', 110, '150 g', 'Family favourite', true,
    'Peppery, fragrant blend for comforting rasam.',
    'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&auto=format&fit=crop',
  ],
  [
    'idli-podi', 'Idli Podi', 'Podis', 135, '200 g', 'New', true,
    'Roasted lentil and chilli condiment powder.',
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop',
  ],
  [
    'mango-thokku', 'Mango Thokku', 'Pickles', 150, '250 g', 'Seasonal', false,
    'Tangy mango relish made in small batches.',
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&auto=format&fit=crop',
  ],
];

async function initialiseDatabase() {
  // Products table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL,
      price       NUMERIC(10,2) NOT NULL CHECK (price > 0),
      weight      TEXT NOT NULL,
      tag         TEXT NOT NULL DEFAULT 'New',
      available   BOOLEAN NOT NULL DEFAULT TRUE,
      description TEXT NOT NULL DEFAULT '',
      image_url   TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Add image_url to existing products table if missing
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`).catch(() => {});

  // Users table (auth) — password_hash nullable for Google OAuth users
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      google_id     TEXT UNIQUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`).catch(() => {});
  await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`).catch(() => {});

  // Seed products — upsert so images are applied to existing rows too
  for (const [id, name, category, price, weight, tag, available, description, image_url] of seedProducts) {
    await pool.query(
      `INSERT INTO products (id, name, category, price, weight, tag, available, description, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url`,
      [id, name, category, price, weight, tag, available, description, image_url]
    );
  }
}

initialiseDatabase()
  .then(() => app.listen(port, () => console.log(`catalog-service listening on ${port}`)))
  .catch(err => { console.error('Could not initialise database', err); process.exit(1); });
