import { useState } from "react";

const catalogUrl = import.meta.env.VITE_CATALOG_API || "/catalog";
const orderUrl = import.meta.env.VITE_ORDER_API || "/orders";
const emptyProduct = { name: "", category: "Blends", price: "", weight: "", tag: "New", description: "", available: true };

export default function AdminPanel({ products, setProducts, onClose, notify }) {
  const [key, setKey] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [product, setProduct] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const headers = { "Content-Type": "application/json", "X-Admin-Key": key };

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    if (!response.ok) throw new Error(response.status === 401 ? "Incorrect admin key." : "The requested admin action failed.");
    return response.status === 204 ? null : response.json();
  }

  async function signIn(event) {
    event.preventDefault();
    setError("");
    try {
      await request(`${orderUrl}/api/orders`);
      setSignedIn(true);
    } catch (err) { setError(err.message); }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    try {
      const saved = await request(editing ? `${catalogUrl}/api/products/${editing}` : `${catalogUrl}/api/products`, { method: editing ? "PUT" : "POST", body: JSON.stringify({ ...product, price: Number(product.price) }) });
      setProducts(current => editing ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved]);
      setProduct(emptyProduct); setEditing(null); notify(editing ? "Product updated." : "Product created.");
    } catch (err) { setError(err.message); }
  }

  function edit(item) { setEditing(item.id); setProduct({ ...item, price: String(item.price) }); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }
  async function toggle(item) {
    try { const saved = await request(`${catalogUrl}/api/products/${item.id}`, { method: "PUT", body: JSON.stringify({ available: !item.available }) }); setProducts(current => current.map(p => p.id === saved.id ? saved : p)); } catch (err) { setError(err.message); }
  }
  async function remove(item) {
    if (!window.confirm(`Remove ${item.name}?`)) return;
    try { await request(`${catalogUrl}/api/products/${item.id}`, { method: "DELETE" }); setProducts(current => current.filter(p => p.id !== item.id)); notify("Product removed."); } catch (err) { setError(err.message); }
  }
  async function loadOrders() { try { setOrders(await request(`${orderUrl}/api/orders`)); } catch (err) { setError(err.message); } }

  return <div className="modal-backdrop admin-backdrop"><section className="admin-panel" role="dialog" aria-modal="true" aria-label="Admin controls"><button className="close" onClick={onClose}>x</button>{!signedIn ? <form className="admin-login" onSubmit={signIn}><p className="eyebrow">Administration</p><h2>Sign in to control the store</h2><p>Enter the administrator key configured for this environment.</p><input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Admin key" autoFocus required /><button className="primary">Sign in</button>{error && <p className="admin-error">{error}</p>}<small>Local demo key: <code>shasthi-admin</code></small></form> : <><div className="admin-title"><div><p className="eyebrow">Administration</p><h2>Store controls</h2></div><button className="text-button" onClick={loadOrders}>Refresh orders</button></div>{error && <p className="admin-error">{error}</p>}<div className="admin-summary"><span><b>{products.length}</b> products</span><span><b>{products.filter(p => p.available).length}</b> in stock</span><span><b>{orders.length}</b> orders</span></div><section className="admin-section"><h3>Catalog</h3><div className="admin-products">{products.map(item => <div key={item.id}><span><b>{item.name}</b><small>{item.category} - {item.available ? "Live" : "Hidden"}</small></span><span className="admin-actions"><button onClick={() => toggle(item)}>{item.available ? "Hide" : "Show"}</button><button onClick={() => edit(item)}>Edit</button><button className="danger" onClick={() => remove(item)}>Remove</button></span></div>)}</div></section><section className="admin-section"><h3>{editing ? `Edit ${product.name}` : "Add product"}</h3><form className="admin-form" onSubmit={saveProduct}><input required placeholder="Product name" value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })} /><input required placeholder="Category" value={product.category} onChange={e => setProduct({ ...product, category: e.target.value })} /><input required min="1" type="number" placeholder="Price" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} /><input required placeholder="Weight, e.g. 200 g" value={product.weight} onChange={e => setProduct({ ...product, weight: e.target.value })} /><input placeholder="Tag" value={product.tag} onChange={e => setProduct({ ...product, tag: e.target.value })} /><textarea placeholder="Description" value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} /><label className="availability"><input type="checkbox" checked={product.available} onChange={e => setProduct({ ...product, available: e.target.checked })} /> Available for sale</label><div><button className="primary">{editing ? "Save changes" : "Create product"}</button>{editing && <button type="button" className="text-button" onClick={() => { setEditing(null); setProduct(emptyProduct); }}>Cancel</button>}</div></form></section><section className="admin-section"><h3>Recent orders</h3>{orders.length ? <div className="admin-products orders">{orders.map(order => <div key={order.id}><span><b>{order.customerName}</b><small>{order.email} - {order.items.length} item(s)</small></span><span><b>INR {order.total}</b><small>{new Date(order.createdAt).toLocaleString()}</small></span></div>)}</div> : <p className="muted">Select “Refresh orders” to view confirmed orders.</p>}</section></>}</section></div>;
}
