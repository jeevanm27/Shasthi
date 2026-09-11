import express from 'express';
import cors    from 'cors';
import { pool }            from './db.js';
import { getRedisClient }  from './redis/client.js';
import { connectProducer, disconnectProducer } from './kafka/producer.js';

import healthRouter from './routes/health.js';
import authRouter   from './routes/auth.js';
import cartRouter   from './routes/cart.js';

const app  = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '32kb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/health',     healthRouter);
app.use('/api/users',  authRouter);
app.use('/api/cart',   cartRouter);

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[user-service] Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Database schema bootstrap ───────────────────────────────────────────────
async function initDatabase() {
  // Create user_role ENUM safely
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Users table with role column
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role          user_role NOT NULL DEFAULT 'CUSTOMER',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Migration: add role column to existing installs if missing
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'CUSTOMER'
  `).catch(() => {});

  console.log('[db] Schema ready');
}

// ─── Startup ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDatabase();

    // Warm up Redis connection
    getRedisClient();

    // Connect Kafka producer
    await connectProducer();

    const server = app.listen(port, () => {
      console.log(`[user-service] Listening on port ${port}`);
    });

    // ─── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`[user-service] ${signal} received — shutting down gracefully`);
      server.close(async () => {
        await disconnectProducer();
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('[user-service] Fatal startup error:', err);
    process.exit(1);
  }
}

start();
