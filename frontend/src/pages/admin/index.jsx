import { useState } from 'react';
import { catalogApi } from '../../api/catalogApi';
import { orderApi } from '../../api/orderApi';
import Spinner from '../../components/ui/Spinner';
import './Admin.css';

const EMPTY = { name: '', category: 'Blends', price: '', weight: '', tag: '', description: '', available: true };
const CATS = ['Blends', 'Powders', 'Podis', 'Pickles'];
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function Admin() {
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm]         = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [tab, setTab]           = useState('products');

  async function handleLogin(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await orderApi.listOrders(key);
      setAuthed(true);
      loadData(key);
    } catch {
      setAuthError('Incorrect admin key. Try shasthi-admin for local demo.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadData(adminKey = key) {
    setDataLoading(true);
    setError('');
    try {
      const [prods, ords] = await Promise.all([catalogApi.getProducts(), orderApi.listOrders(adminKey)]);
      setProducts(prods);
      setOrders(ords);
    } catch (err) {
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingId) {
        const u = await catalogApi.updateProduct(key, editingId, payload);
        setProducts(ps => ps.map(p => p.id === u.id ? u : p));
      } else {
        const c = await catalogApi.createProduct(key, payload);
        setProducts(ps => [...ps, c]);
      }
      setForm(EMPTY);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(p) {
    try {
      const u = await catalogApi.updateProduct(key, p.id, { available: !p.available });
      setProducts(ps => ps.map(x => x.id === u.id ? u : x));
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Remove "${p.name}"?`)) return;
    try {
      await catalogApi.deleteProduct(key, p.id);
      setProducts(ps => ps.filter(x => x.id !== p.id));
    } catch (err) { setError(err.message); }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ ...p, price: String(p.price) });
    setTab('products');
    setTimeout(() => document.getElementById('prod-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  const revenue = orders.reduce((n, o) => n + Number(o.total), 0);

  if (!authed) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="login-icon">🔐</div>
          <h1>Admin Access</h1>
          <p>Enter your administrator key to manage the store.</p>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Admin key" value={key} onChange={e => setKey(e.target.value)} autoFocus required />
            {authError && <p className="form-error">{authError}</p>}
            <button type="submit" className="btn-primary full-width" disabled={authLoading}>
              {authLoading ? <Spinner size={18} /> : 'Sign in'}
            </button>
          </form>
          <p className="admin-hint">Local demo key: <code>shasthi-admin</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>Store Dashboard</h1>
          </div>
          <button className="btn-secondary" onClick={() => loadData()} disabled={dataLoading}>
            {dataLoading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card"><span className="stat-value">{products.length}</span><span className="stat-label">Products</span></div>
          <div className="stat-card"><span className="stat-value">{products.filter(p => p.available).length}</span><span className="stat-label">In stock</span></div>
          <div className="stat-card"><span className="stat-value">{orders.length}</span><span className="stat-label">Orders</span></div>
          <div className="stat-card accent"><span className="stat-value">{money.format(revenue)}</span><span className="stat-label">Revenue</span></div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`tab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>Products</button>
          <button className={`tab${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>Orders ({orders.length})</button>
        </div>

        {tab === 'products' && (
          <div className="admin-content">
            {/* Products table */}
            <div className="admin-section">
              <h2>Catalog</h2>
              {dataLoading ? <div className="loading-row"><Spinner /></div> : (
                <div className="products-table">
                  <div className="table-head">
                    <span>Product</span><span>Category</span><span>Price</span><span>Status</span><span>Actions</span>
                  </div>
                  {products.map(p => (
                    <div key={p.id} className="table-row">
                      <span className="row-name"><strong>{p.name}</strong><small>{p.weight}</small></span>
                      <span><span className="cat-badge">{p.category}</span></span>
                      <span className="row-price">{money.format(p.price)}</span>
                      <span><span className={`status-badge ${p.available ? 'live' : 'hidden'}`}>{p.available ? 'Live' : 'Hidden'}</span></span>
                      <span className="row-actions">
                        <button className="action-btn" onClick={() => handleToggle(p)}>{p.available ? 'Hide' : 'Show'}</button>
                        <button className="action-btn" onClick={() => startEdit(p)}>Edit</button>
                        <button className="action-btn danger" onClick={() => handleDelete(p)}>Remove</button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product form */}
            <div className="admin-section" id="prod-form">
              <h2>{editingId ? `Editing: ${form.name}` : 'Add new product'}</h2>
              <form className="product-form" onSubmit={handleSave}>
                <div className="form-row">
                  <label>Product name *<input required placeholder="e.g. Coriander Powder" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></label>
                  <label>Category *<select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{CATS.map(c => <option key={c}>{c}</option>)}</select></label>
                </div>
                <div className="form-row">
                  <label>Price (INR) *<input required type="number" min="1" placeholder="120" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} /></label>
                  <label>Weight *<input required placeholder="200 g" value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))} /></label>
                </div>
                <label>Tag<input placeholder="New / Best seller / Seasonal" value={form.tag} onChange={e => setForm(f => ({...f, tag: e.target.value}))} /></label>
                <label className="full-label">Description<textarea rows="3" placeholder="Brief product description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></label>
                <label className="checkbox-label"><input type="checkbox" checked={form.available} onChange={e => setForm(f => ({...f, available: e.target.checked}))} />Available for sale</label>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={formLoading}>
                    {formLoading ? <Spinner size={16} /> : editingId ? 'Save changes' : 'Create product'}
                  </button>
                  {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel</button>}
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="admin-section">
            <h2>Order history</h2>
            {dataLoading ? <div className="loading-row"><Spinner /></div> : orders.length === 0 ? (
              <p className="empty-state">No orders yet.</p>
            ) : (
              <div className="orders-list">
                {orders.map(o => (
                  <details key={o.id} className="order-row">
                    <summary className="order-summary-row">
                      <span className="order-customer"><strong>{o.customerName}</strong><small>{o.email}</small></span>
                      <span className="order-meta">
                        <span className="order-amount">{money.format(o.total)}</span>
                        <span className="order-date">{new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                        <span className="order-status">Confirmed</span>
                      </span>
                    </summary>
                    <div className="order-items">
                      {o.items.map(item => (
                        <div key={item.productId} className="order-item">
                          <span>{item.name} × {item.quantity}</span>
                          <span>{money.format(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
