import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import './Checkout.css';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});

const STEPS = ['Review order', 'Your details', 'Confirmed'];

const INITIAL_FORM = {
  name: '', email: '', phone: '',
  address: '', city: '', pincode: '',
};

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// Dynamically load Razorpay checkout script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout({ onNotify }) {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();

  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [order,   setOrder]   = useState(null);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name || f.name, email: user.email || f.email }));
  }, [user]);

  // Preload Razorpay script when entering step 1
  useEffect(() => {
    if (step === 1 && RAZORPAY_KEY) loadRazorpayScript();
  }, [step]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Empty basket guard
  if (items.length === 0 && step < 2) {
    return (
      <div className="checkout-empty">
        <div className="container">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <h2>Your basket is empty</h2>
          <p>Add some products before checking out.</p>
          <Link to="/shop" className="btn-primary">Browse products</Link>
        </div>
      </div>
    );
  }

  // --- Payment pipeline ---
  async function initiatePayment() {
    setLoading(true);
    setError('');

    try {
      // Step 1: Create Razorpay order on backend
      const res = await fetch('/catalog/api/payments/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: subtotal }),
      });
      const rzpOrder = await res.json();
      if (!res.ok) throw new Error(rzpOrder.message || 'Could not initiate payment');

      // Step 2: If mock (no Razorpay keys) — skip popup, go straight to order creation
      if (rzpOrder.mock || !RAZORPAY_KEY) {
        await createOrder({ paymentId: 'demo_payment', orderId: rzpOrder.id, verified: true });
        return;
      }

      // Step 3: Load script and open Razorpay checkout popup
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Could not load Razorpay. Check your connection and try again.');

      const options = {
        key:         RAZORPAY_KEY,
        amount:      rzpOrder.amount,
        currency:    rzpOrder.currency,
        name:        'Shasthi Masala',
        description: 'Artisan Spice Order',
        order_id:    rzpOrder.id,
        prefill:     { name: form.name, email: form.email, contact: form.phone },
        theme:       { color: '#d96946' },
        handler: async (response) => {
          // Step 4: Verify payment signature on backend
          try {
            const vRes = await fetch('/catalog/api/payments/verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });
            const vData = await vRes.json();
            if (!vRes.ok || !vData.verified) throw new Error(vData.message || 'Payment verification failed');

            // Step 5: Create order record
            await createOrder({
              paymentId: response.razorpay_payment_id,
              orderId:   response.razorpay_order_id,
              verified:  true,
            });
          } catch (err) {
            setError(err.message);
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Your cart is still saved.');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  // Create the final order record in order-service
  async function createOrder({ paymentId }) {
    try {
      const placed = await orderApi.createOrder({
        customerName: form.name,
        email:        form.email,
        paymentId,
        items:        items.map(i => ({ productId: i.id, quantity: i.quantity })),
      });
      setOrder(placed);
      clear();
      setStep(2);
    } catch (err) {
      setError(err.message || 'Payment succeeded but order could not be saved. Contact support.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDetailsSubmit(e) {
    e.preventDefault();
    await initiatePayment();
  }

  // Shared order summary sidebar
  const OrderSummary = () => (
    <aside className="order-summary-aside">
      <h3>Order summary</h3>
      <div className="summary-items">
        {items.map(item => (
          <div key={item.id} className="summary-item">
            <span className="summary-item-name">{item.name} <em>×{item.quantity}</em></span>
            <span>{money.format(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money.format(subtotal)}</strong>
      </div>
    </aside>
  );

  return (
    <div className="checkout-page">
      <div className="container">

        {/* Step Progress */}
        <nav className="checkout-progress" aria-label="Order progress">
          {STEPS.map((label, i) => (
            <div key={label} className={`progress-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
              <div className="progress-num">
                {i < step ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className="progress-label">{label}</span>
              {i < STEPS.length - 1 && <div className="progress-connector" />}
            </div>
          ))}
        </nav>

        {/* Step 0 — Review */}
        {step === 0 && (
          <div className="checkout-layout">
            <div className="checkout-main">
              <h1>Review your order</h1>
              <div className="review-items">
                {items.map(item => (
                  <div key={item.id} className="review-item">
                    <div className="review-item-info">
                      <p className="review-name">{item.name}</p>
                      <p className="review-meta">{item.weight} &mdash; Qty {item.quantity}</p>
                    </div>
                    <div className="review-item-price">
                      <span className="review-unit">{money.format(item.price)} each</span>
                      <strong>{money.format(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="checkout-actions">
                <Link to="/shop" className="btn-secondary">Edit basket</Link>
                <button className="btn-primary" onClick={() => setStep(1)}>
                  Continue to details
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
            <OrderSummary />
          </div>
        )}

        {/* Step 1 — Details + Payment */}
        {step === 1 && (
          <div className="checkout-layout">
            <div className="checkout-main">
              <h1>Delivery &amp; payment</h1>
              <form className="checkout-form" onSubmit={handleDetailsSubmit} noValidate>
                <fieldset>
                  <legend>Contact information</legend>
                  <div className="form-row">
                    <label>
                      Full name
                      <input required type="text" autoComplete="name" placeholder="Ananya Rao"
                        value={form.name} onChange={set('name')} />
                    </label>
                    <label>
                      Email address
                      <input required type="email" autoComplete="email" placeholder="ananya@example.com"
                        value={form.email} onChange={set('email')} />
                    </label>
                  </div>
                  <label>
                    Phone number
                    <input type="tel" autoComplete="tel" placeholder="+91 98765 43210"
                      value={form.phone} onChange={set('phone')} />
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Delivery address</legend>
                  <label>
                    Street address
                    <input type="text" autoComplete="street-address" placeholder="12, Anna Nagar, 3rd Street"
                      value={form.address} onChange={set('address')} />
                  </label>
                  <div className="form-row">
                    <label>
                      City
                      <input type="text" autoComplete="address-level2" placeholder="Chennai"
                        value={form.city} onChange={set('city')} />
                    </label>
                    <label>
                      PIN code
                      <input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="600001"
                        value={form.pincode} onChange={set('pincode')} />
                    </label>
                  </div>
                </fieldset>

                {/* Payment notice */}
                <div className="payment-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  <span>Secure payment via <strong>Razorpay</strong> — UPI, cards, net banking accepted</span>
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}

                <div className="checkout-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setStep(0); setError(''); }}>
                    Back
                  </button>
                  <button type="submit" className="btn-primary pay-btn" disabled={loading}>
                    {loading ? (
                      <span className="pay-loading">
                        <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                        Processing…
                      </span>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2"/>
                          <line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                        Pay {money.format(subtotal)}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            <OrderSummary />
          </div>
        )}

        {/* Step 2 — Confirmed */}
        {step === 2 && order && (
          <div className="checkout-confirmed">
            <div className="confirmed-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1>Order confirmed</h1>
            <p className="confirmed-sub">
              Thank you, <strong>{order.customerName}</strong>. Your payment was successful and your order is being prepared.
            </p>
            <div className="confirmed-id">
              Order reference: <code>#{order.id.slice(0, 8).toUpperCase()}</code>
            </div>

            <div className="confirmed-items">
              <h3>Items ordered</h3>
              {order.items.map(item => (
                <div key={item.productId} className="confirmed-item">
                  <span>{item.name} <em>×{item.quantity}</em></span>
                  <span>{money.format(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="confirmed-total">
                <span>Total paid</span>
                <strong>{money.format(order.total)}</strong>
              </div>
            </div>

            <p className="confirmed-note">
              A confirmation will be sent to <strong>{order.email}</strong>.
            </p>
            <div className="confirmed-actions">
              <Link to="/orders" className="btn-secondary">View my orders</Link>
              <Link to="/shop"   className="btn-primary">Continue shopping</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
