import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getRedisClient, CART_TTL_SECONDS } from '../redis/client.js';
import { sendOrderCreated } from '../kafka/producer.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All cart routes require authentication
router.use(requireAuth);

/**
 * Helper: cart hash key for a user
 */
const cartKey = (userId) => `cart:${userId}`;

/**
 * Parse cart items from Redis Hash (all values are stored as JSON strings)
 */
function parseCartItems(hash) {
  return Object.values(hash).map((v) => JSON.parse(v));
}

// GET /api/cart  — fetch entire cart
router.get('/', async (req, res, next) => {
  try {
    const redis = getRedisClient();
    const hash  = await redis.hgetall(cartKey(req.user.id));
    const items = hash ? parseCartItems(hash) : [];
    res.json({ items, count: items.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/items  — add or replace an item
router.post('/items', async (req, res, next) => {
  try {
    const { productId, productName, pricePerGram, quantityGrams, imageUrl } = req.body;
    if (!productId || !productName || !pricePerGram || !quantityGrams) {
      return res.status(400).json({ message: 'productId, productName, pricePerGram, quantityGrams are required' });
    }
    if (quantityGrams <= 0) {
      return res.status(400).json({ message: 'quantityGrams must be positive' });
    }

    const redis = getRedisClient();
    const key   = cartKey(req.user.id);
    const item  = { productId, productName, pricePerGram, quantityGrams, imageUrl: imageUrl || null };

    await redis.hset(key, productId, JSON.stringify(item));
    await redis.expire(key, CART_TTL_SECONDS);

    res.status(201).json({ message: 'Item added to cart', item });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cart/items/:productId  — update quantity of an existing item
router.put('/items/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantityGrams } = req.body;

    if (!quantityGrams || quantityGrams <= 0) {
      return res.status(400).json({ message: 'quantityGrams must be a positive number' });
    }

    const redis   = getRedisClient();
    const key     = cartKey(req.user.id);
    const raw     = await redis.hget(key, productId);

    if (!raw) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const item = { ...JSON.parse(raw), quantityGrams };
    await redis.hset(key, productId, JSON.stringify(item));
    await redis.expire(key, CART_TTL_SECONDS);

    res.json({ message: 'Item updated', item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/items/:productId  — remove a single item
router.delete('/items/:productId', async (req, res, next) => {
  try {
    const redis = getRedisClient();
    await redis.hdel(cartKey(req.user.id), req.params.productId);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart  — clear entire cart
router.delete('/', async (req, res, next) => {
  try {
    const redis = getRedisClient();
    await redis.del(cartKey(req.user.id));
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/checkout  — emit order event and clear cart
router.post('/checkout', async (req, res, next) => {
  try {
    const redis = getRedisClient();
    const key   = cartKey(req.user.id);
    const hash  = await redis.hgetall(key);

    if (!hash || Object.keys(hash).length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const items = parseCartItems(hash);

    // Calculate total price
    const totalPrice = items.reduce(
      (sum, item) => sum + item.pricePerGram * item.quantityGrams,
      0
    );

    // Build Kafka payload items
    const kafkaItems = items.map((item) => ({
      productId:     item.productId,
      productName:   item.productName,
      quantityGrams: item.quantityGrams,
      pricePerGram:  item.pricePerGram,
    }));

    // Emit to Kafka (fire-and-forget — order-service processes asynchronously)
    const eventId = await sendOrderCreated({
      userId:     req.user.id,
      userEmail:  req.user.email,
      items:      kafkaItems,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    });

    // Clear the cart only AFTER the Kafka event is confirmed
    await redis.del(key);

    res.status(202).json({
      message:     'Order placed — processing in background',
      eventId,
      totalPrice:  parseFloat(totalPrice.toFixed(2)),
      itemCount:   items.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
