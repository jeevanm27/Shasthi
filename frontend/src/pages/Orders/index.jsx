import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import Spinner from '../../components/ui/Spinner';
import './Orders.css';


const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Orders() {
  const { user, token } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    // Use admin key to fetch all orders, then filter by user's email
    orderApi.listOrders('shasthi-admin')
      .then(all => {
        const mine = all.filter(o => o.email?.toLowerCase() === user?.email?.toLowerCase());
        setOrders(mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <div>
            <span className="eyebrow">Your account</span>
            <h1>My Orders</h1>
            {user && <p className="orders-sub">Orders placed by <strong>{user.email}</strong></p>}
          </div>
          <Link to="/shop" className="btn-secondary">Continue shopping</Link>
        </div>

        {loading ? (
          <div className="orders-loading"><Spinner /></div>
        ) : error ? (
          <div className="orders-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
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
                    <span className="order-id-label">Order <code>#{order.id.slice(0, 8).toUpperCase()}</code></span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-meta">
                    <span className="order-total-val">{money.format(order.total)}</span>
                    <span className="order-badge">{order.status || 'Confirmed'}</span>
                    <svg className="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </summary>

                <div className="order-items">
                  {order.items.map(item => (
                    <div key={item.productId} className="order-item-row">
                      <div className="order-item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="item-price">{money.format(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="order-total-row">
                    <span>Total</span>
                    <strong>{money.format(order.total)}</strong>
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
