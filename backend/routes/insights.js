import { Router } from 'express';

const router = Router();

// POST /api/insights/cart
// Migrated from insights-service (Python/FastAPI) → catalog-service (Node.js)
router.post('/cart', (req, res) => {
  const { items = [] } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.json({ message: 'Add items to your cart to get personalised tips.', itemCount: 0 });
  }

  const categories = new Set(items.map(i => (i.category || '').toLowerCase()));
  const count      = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  let message;
  if (categories.has('blends') && !categories.has('powders')) {
    message = 'Pair your blend with turmeric powder for an easy everyday masala kit.';
  } else if (count >= 3) {
    message = 'Your pantry is well stocked — you qualify for free local delivery.';
  } else {
    message = 'Add two more jars to build a balanced spice shelf.';
  }

  res.json({ message, itemCount: count });
});

export default router;
