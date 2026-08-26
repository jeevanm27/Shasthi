import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'catalog-service' });
  } catch {
    res.status(503).json({ status: 'unavailable', service: 'catalog-service' });
  }
});

export default router;
