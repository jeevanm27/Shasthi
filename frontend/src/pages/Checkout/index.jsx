import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import Spinner from '../../components/ui/Spinner';
import './Checkout.css';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const STEPS = ['Review', 'Details', 'Confirmed'];

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  // Auto-fill from logged-in user
  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '' });
  }, [user]);


  if (items.length === 0 && step < 2) {
    return (
      <div className="checkout-empty container">
        <span>🛒</span>
        <h2>Your basket is empty</h2>
        <p>Add some products before checking out.</p>
        <Link to="/shop" className="btn-primary">Browse products</Link>
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
        email: form.email,
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
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

  return (
    <div className="checkout-page">
      <div className="container checkout-inner">
        {/* Progress */}
        <ol className="checkout-steps">
          {STEPS.map((s, i) => (
            <li key={s} className={`step-item${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
              <span className="step-num">{i < step ? '✓' : i + 1}</span>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <span className="step-line" />}
            </li>
          ))}
        </ol>

        {/* Step 0: Review */}
        {step === 0 && (
          <div className="checkout-section">
            <h2>Review your basket</h2>
            <div className="review-items">
              {items.map(item => (
                <div key={item.id} className="review-item">
                  <div>
                    <p className="review-name">{item.name}</p>
                    <p className="review-meta">{item.quantity} × {money.format(item.price)}</p>
                  </div>
                  <strong>{money.format(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>Total</span>
              <strong>{money.format(subtotal)}</strong>
            </div>
            <div className="step-actions">
              <Link to="/shop" className="btn-secondary">← Continue shopping</Link>
              <button className="btn-primary" onClick={() => setStep(1)}>Enter details →</button>
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="checkout-section">
            <h2>Your details</h2>
            <form className="checkout-form" onSubmit={handleSubmit}>
              <label>
                Full name
                <input required type="text" placeholder="Ananya Rao" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </label>
              <label>
                Email address
                <input required type="email" placeholder="ananya@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </label>
              <div className="order-summary-mini">
                <span>Order total</span>
                <strong>{money.format(subtotal)}</strong>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="step-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(0)}>← Back</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Spinner size={18} /> : 'Place order'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Confirmed */}
        {step === 2 && order && (
          <div className="checkout-success">
            <div className="success-icon">✅</div>
            <h2>Order confirmed!</h2>
            <p>Thank you, <strong>{order.customerName}</strong>. We've received your order.</p>
            <div className="order-id">
              Order <code>#{order.id.slice(0, 8).toUpperCase()}</code>
            </div>
            <div className="success-items">
              {order.items.map(item => (
                <div key={item.productId} className="success-item">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{money.format(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="success-total">
                <span>Total paid</span>
                <strong>{money.format(order.total)}</strong>
              </div>
            </div>
            <p className="success-note">A receipt will be sent to <strong>{order.email}</strong>.</p>
            <Link to="/shop" className="btn-primary">Continue shopping</Link>
          </div>
        )}
      </div>
    </div>
  );
}
