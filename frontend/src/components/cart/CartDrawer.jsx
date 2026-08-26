import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { insightsApi } from '../../api/insightsApi';
import './CartDrawer.css';

export default function CartDrawer({ open, onClose }) {
  const { items, itemCount, formatted, updateQty, remove, insight, setInsight, clearInsight } = useCart();
  const [loadingInsight, setLoadingInsight] = useState(false);
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleInsight() {
    if (!items.length) return;
    setLoadingInsight(true);
    try {
      const data = await insightsApi.getCartInsight(items);
      setInsight(data.message);
    } catch {
      setInsight('Our pantry tip service is taking a short break.');
    } finally {
      setLoadingInsight(false);
    }
  }

  function handleCheckout() {
    onClose();
    navigate('/checkout');
  }

  return (
    <>
      <div
        ref={overlayRef}
        className={`drawer-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`cart-drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="drawer-header">
          <div>
            <h2>Your Basket</h2>
            {itemCount > 0 && <span className="drawer-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <span>🛒</span>
              <p>Your basket is empty.</p>
              <button className="btn-secondary" onClick={onClose}>Browse products</button>
            </div>
          ) : (
            <>
              <ul className="cart-list">
                {items.map(item => (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <p className="cart-item-name">{item.name}</p>
                      <p className="cart-item-price">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price)} each
                      </p>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-control">
                        <button onClick={() => updateQty(item.id, -1)} aria-label="Decrease">−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, +1)} aria-label="Increase">+</button>
                      </div>
                      <button className="remove-btn" onClick={() => remove(item.id)} aria-label="Remove item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {insight ? (
                <div className="insight-box">
                  <p className="insight-label">🌿 Pantry tip</p>
                  <p>{insight}</p>
                  <button className="insight-dismiss" onClick={clearInsight}>Dismiss</button>
                </div>
              ) : (
                <button
                  className="insight-btn"
                  onClick={handleInsight}
                  disabled={loadingInsight}
                >
                  {loadingInsight ? 'Getting tip…' : '✨ Get a pantry tip'}
                </button>
              )}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-subtotal">
              <span>Subtotal</span>
              <strong>{formatted}</strong>
            </div>
            <p className="drawer-note">Taxes and delivery calculated at checkout</p>
            <button className="btn-primary full-width" onClick={handleCheckout}>
              Proceed to checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
