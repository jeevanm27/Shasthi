import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Checkout.css';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
});

const STEPS = ['Review order', 'Confirm & place', 'Order placed!'];

export default function Checkout({ onNotify }) {
  const { items, cartTotal, checkout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState(null); // { eventId, totalPrice }

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

  async function handlePlaceOrder() {
    setLoading(true);
    setError('');
    try {
      // checkout() → calls POST /api/cart/checkout → emits Kafka → clears cart → returns { eventId, totalPrice }
      const data = await checkout();
      setResult(data);
      setStep(2);
      onNotify?.('Order placed! Processing shortly.', 'success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Shared order summary sidebar
  const OrderSummary = () => (
    <aside className="order-summary-aside">
      <h3>Order summary</h3>
      <div className="summary-items">
        {items.map(item => (
          <div key={item.productId} className="summary-item">
            <span className="summary-item-name">{item.productName} <em>×{item.quantityGrams}g</em></span>
            <span>{money.format(item.pricePerGram * item.quantityGrams)}</span>
          </div>
        ))}
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money.format(cartTotal)}</strong>
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
                  <div key={item.productId} className="review-item">
                    <div className="review-item-info">
                      <p className="review-name">{item.productName}</p>
                      <p className="review-meta">{item.quantityGrams}g — ₹{parseFloat(item.pricePerGram).toFixed(2)}/g</p>
                    </div>
                    <div className="review-item-price">
                      <strong>{money.format(item.pricePerGram * item.quantityGrams)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="checkout-actions">
                <Link to="/shop" className="btn-secondary">Edit basket</Link>
                <button className="btn-primary" onClick={() => setStep(1)}>
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
            <OrderSummary />
          </div>
        )}

        {/* Step 1 — Confirm */}
        {step === 1 && (
          <div className="checkout-layout">
            <div className="checkout-main">
              <h1>Confirm your order</h1>
              <div className="payment-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>
                  Placing as <strong>{user?.email}</strong>.
                  Your order will be processed asynchronously via our order system.
                </span>
              </div>

              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="checkout-actions">
                <button type="button" className="btn-secondary" onClick={() => { setStep(0); setError(''); }}>
                  Back
                </button>
                <button className="btn-primary pay-btn" disabled={loading} onClick={handlePlaceOrder}>
                  {loading ? (
                    <span className="pay-loading">
                      <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Processing…
                    </span>
                  ) : (
                    <>Place order — {money.format(cartTotal)}</>
                  )}
                </button>
              </div>
            </div>
            <OrderSummary />
          </div>
        )}

        {/* Step 2 — Confirmed */}
        {step === 2 && (
          <div className="checkout-confirmed">
            <div className="confirmed-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1>Order placed!</h1>
            <p className="confirmed-sub">
              Your order has been received and is being processed.
            </p>
            {result?.eventId && (
              <div className="confirmed-id">
                Reference: <code>{result.eventId.slice(0, 8).toUpperCase()}</code>
              </div>
            )}
            <p className="confirmed-note">
              Check <strong>My Orders</strong> for status updates — delivery typically 2–5 business days.
            </p>
            <div className="confirmed-actions">
              <Link to="/orders" className="btn-secondary">View my orders</Link>
              <Link to="/shop" className="btn-primary">Continue shopping</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
