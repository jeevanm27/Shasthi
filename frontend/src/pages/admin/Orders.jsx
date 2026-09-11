import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../../api/orders.js';
import './Admin.css';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS = {
  PENDING:    '#f59e0b',
  PROCESSING: '#3b82f6',
  SHIPPED:    '#8b5cf6',
  DELIVERED:  '#10b981',
  CANCELLED:  '#ef4444',
};

export default function AdminOrders({ onNotify }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    ordersApi.getAllOrders()
      .then(setOrders)
      .catch(() => onNotify?.('Failed to load orders', 'error'))
      .finally(() => setLoading(false));
  }, [onNotify]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus);
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      onNotify?.(`Order status updated to ${newStatus}`, 'success');
    } catch (err) {
      onNotify?.(err.message || 'Update failed', 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Orders</h1>
        <button className="admin-btn" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? (
        <p className="admin-loading">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">No orders yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Items</th>
                <th>Total</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="admin-mono">{order.id.slice(0, 8)}…</td>
                  <td>{order.userEmail}</td>
                  <td>
                    {(order.items || []).map(i => (
                      <div key={i.id} className="admin-order-item">
                        {i.productName} × {i.quantityGrams}g
                      </div>
                    ))}
                  </td>
                  <td>₹{parseFloat(order.totalPrice).toFixed(2)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <select
                      className="admin-status-select"
                      style={{ borderColor: STATUS_COLORS[order.status] || '#ccc' }}
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
