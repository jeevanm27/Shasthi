import { Router } from 'express';
import crypto    from 'crypto';
import Razorpay  from 'razorpay';

const router = Router();

const KEY_ID     = process.env.RAZORPAY_KEY_ID     || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Instantiate only if keys are configured
const rzp = (KEY_ID && KEY_SECRET)
  ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  : null;

// POST /api/payments/create-order
// Creates a Razorpay order and returns the order ID to the client
router.post('/create-order', async (req, res, next) => {
  try {
    const { amount } = req.body; // amount in INR (rupees)
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (!rzp) {
      // Razorpay not configured — return a mock order for dev/demo
      return res.json({ id: `dev_order_${Date.now()}`, amount: amount * 100, currency: 'INR', mock: true });
    }

    const order = await rzp.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    });

    res.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/verify
// Verifies the HMAC signature returned by Razorpay after payment
router.post('/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = req.body;

  // Skip verification for mock/dev orders
  if (mock || !rzp) {
    return res.json({ verified: true });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ verified: false, message: 'Missing payment fields' });
  }

  const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected === razorpay_signature) {
    res.json({ verified: true, paymentId: razorpay_payment_id });
  } else {
    res.status(400).json({ verified: false, message: 'Payment signature mismatch. Please contact support.' });
  }
});

export default router;
