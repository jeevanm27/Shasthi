import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { insightsApi } from '../../api/insightsApi';
import './CartDrawer.css';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});

export default function CartDrawer({ open, onClose }) {
  const {
    items, itemCount, subtotalFormatted,
    updateQty, remove,
    insight, setInsight, clearInsight,
  } = useCart();

  const [loadingInsight, setLoadingInsight] = useState(false);
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
        className={`drawer-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`cart-drawer${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2>Your Basket</h2>
            {itemCount > 0 && (
              <span className="drawer-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.3">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
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
                      <p className="cart-item-price">{money.format(item.price)} each</p>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-control">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >−</button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pantry tip */}
              {insight ? (
                <div className="insight-box">
                  <div className="insight-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span className="insight-label">Pantry tip</span>
                  </div>
                  <p>{insight}</p>
                  <button className="insight-dismiss" onClick={clearInsight}>Dismiss</button>
                </div>
              ) : (
                <button
                  className="insight-btn"
                  onClick={handleInsight}
                  disabled={loadingInsight}
                >
                  {loadingInsight ? 'Getting tip…' : 'Get a pantry tip'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-subtotal">
              <span>Subtotal</span>
              <strong>{subtotalFormatted}</strong>
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
