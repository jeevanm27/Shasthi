import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const ADMIN_KEY         = process.env.ADMIN_KEY         || 'shasthi-admin';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:8081';

// GET /api/user/orders
// Returns only the authenticated user's orders (email matched server-side from JWT)
router.get('/orders', requireAuth, async (req, res, next) => {
  try {
    const userEmail = req.user.email.toLowerCase();

    const upstream = await fetch(`${ORDER_SERVICE_URL}/api/orders`, {
      headers: { 'X-Admin-Key': ADMIN_KEY },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ message: 'Could not retrieve orders' });
    }

    const all     = await upstream.json();
    const mine    = all.filter(o => o.email?.toLowerCase() === userEmail);
    const sorted  = mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

export default router;
