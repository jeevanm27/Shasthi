import express from 'express';
import cors    from 'cors';
import { pool } from './db.js';
import healthRouter    from './routes/health.js';
import authRouter      from './routes/auth.js';
import productsRouter  from './routes/products.js';
import insightsRouter  from './routes/insights.js';

const app  = express();
const port = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.use('/health',        healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api/products',  productsRouter);
app.use('/api/insights',  insightsRouter);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected catalog service error' });
});

const seedProducts = [
  ['turmeric-powder', 'Turmeric Powder', 'Powders', 95,  '200 g', 'Everyday essential', true,  'Golden, aromatic turmeric for daily cooking.'],
  ['sambar-powder',   'Sambar Powder',   'Blends',  120, '200 g', 'Best seller',        true,  'A balanced South Indian spice blend.'],
  ['rasam-powder',    'Rasam Powder',    'Blends',  110, '150 g', 'Family favourite',   true,  'Peppery, fragrant blend for comforting rasam.'],
  ['idli-podi',       'Idli Podi',       'Podis',   135, '200 g', 'New',                true,  'Roasted lentil and chilli condiment powder.'],
  ['mango-thokku',    'Mango Thokku',    'Pickles', 150, '250 g', 'Seasonal',           false, 'Tangy mango relish made in small batches.'],
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
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
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
  // Migrate existing table: add google_id if not present, make password_hash nullable
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`).catch(() => {});
  await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`).catch(() => {});

  // Seed products
  for (const p of seedProducts) {
    await pool.query(
      `INSERT INTO products (id, name, category, price, weight, tag, available, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      p
    );
  }
}

initialiseDatabase()
  .then(() => app.listen(port, () => console.log(`catalog-service listening on ${port}`)))
  .catch(err => { console.error('Could not initialise database', err); process.exit(1); });
