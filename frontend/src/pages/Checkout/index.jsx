import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Checkout({ onNotify }) {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [order,   setOrder]   = useState(null);

  // Auto-fill from logged-in user
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name:  user.name  || f.name,
        email: user.email || f.email,
      }));
    }
  }, [user]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Empty cart guard
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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const placed = await orderApi.createOrder({
        customerName: form.name,
        email:        form.email,
        items:        items.map(i => ({ productId: i.id, quantity: i.quantity })),
      });
      setOrder(placed);
      clear();
      setStep(2);
    } catch (err) {
      setError(err.message || 'Could not place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Shared order summary component
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
            <OrderSummary />
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="checkout-layout">
            <div className="checkout-main">
              <h1>Delivery details</h1>
              <form className="checkout-form" onSubmit={handleSubmit} noValidate>
                <fieldset>
                  <legend>Contact information</legend>
                  <div className="form-row">
                    <label>
                      Full name
                      <input required type="text" autoComplete="name"
                        placeholder="Ananya Rao"
                        value={form.name} onChange={set('name')} />
                    </label>
                    <label>
                      Email address
                      <input required type="email" autoComplete="email"
                        placeholder="ananya@example.com"
                        value={form.email} onChange={set('email')} />
                    </label>
                  </div>
                  <label>
                    Phone number
                    <input type="tel" autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone} onChange={set('phone')} />
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Delivery address</legend>
                  <label>
                    Street address
                    <input type="text" autoComplete="street-address"
                      placeholder="12, Anna Nagar, 3rd Street"
                      value={form.address} onChange={set('address')} />
                  </label>
                  <div className="form-row">
                    <label>
                      City
                      <input type="text" autoComplete="address-level2"
                        placeholder="Chennai"
                        value={form.city} onChange={set('city')} />
                    </label>
                    <label>
                      PIN code
                      <input type="text" inputMode="numeric" autoComplete="postal-code"
                        placeholder="600001"
                        value={form.pincode} onChange={set('pincode')} />
                    </label>
                  </div>
                </fieldset>

                {error && <p className="form-error" role="alert">{error}</p>}

                <div className="checkout-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(0)}>
                    Back
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Placing order…' : 'Place order'}
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
              Thank you, <strong>{order.customerName}</strong>. We've received your order and will get it to you soon.
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
                <span>Total</span>
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
