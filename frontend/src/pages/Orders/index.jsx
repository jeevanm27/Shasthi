import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ordersApi } from '../../api/orders.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Orders.css';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
});

const STATUS_COLOR = {
  PENDING:    '#f59e0b',
  PROCESSING: '#3b82f6',
  SHIPPED:    '#8b5cf6',
  DELIVERED:  '#10b981',
  CANCELLED:  '#ef4444',
};

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function Orders() {
  const { user } = useAuth();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    ordersApi.getMyOrders()
      .then(setOrders)
      .catch(err => setError(err.message || 'Could not load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <div>
            <span className="eyebrow">Your account</span>
            <h1>My Orders</h1>
            {user && <p className="orders-sub">Signed in as <strong>{user.email}</strong></p>}
          </div>
          <Link to="/shop" className="btn-secondary">Continue shopping</Link>
        </div>

        {loading ? (
          <div className="orders-loading"><Spinner /></div>

        ) : error ? (
          <div className="orders-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="btn-secondary" onClick={() => window.location.reload()}>Try again</button>
          </div>

        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <h3>No orders yet</h3>
            <p>When you place an order, it will appear here.</p>
            <Link to="/shop" className="btn-primary">Browse products</Link>
          </div>

        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <details key={order.id} className="order-card">
                <summary className="order-card-header">
                  <div className="order-info">
                    <span className="order-id-label">
                      Order <code>#{order.id.slice(0, 8).toUpperCase()}</code>
                    </span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-meta">
                    <span className="order-total-val">{money.format(order.totalPrice)}</span>
                    <span
                      className="order-badge"
                      style={{ backgroundColor: STATUS_COLOR[order.status] || '#6b7280' }}
                    >
                      {order.status}
                    </span>
                    <svg className="expand-icon" width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </summary>

                <div className="order-items">
                  {(order.items || []).map(item => (
                    <div key={item.id} className="order-item-row">
                      <div className="order-item-info">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-qty">{item.quantityGrams}g @ ₹{parseFloat(item.priceLocked).toFixed(2)}/g</span>
                      </div>
                      <span className="item-price">{money.format(item.priceLocked * item.quantityGrams)}</span>
                    </div>
                  ))}
                  <div className="order-total-row">
                    <span>Total</span>
                    <strong>{money.format(order.totalPrice)}</strong>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
