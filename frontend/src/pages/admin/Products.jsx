import { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../../api/catalog.js';
import './Admin.css';

const EMPTY_FORM = {
  slug: '', name: '', category: '', description: '',
  pricePerGram: '', stockQuantity: '', imageUrl: '', available: true,
};

export default function AdminProducts({ onNotify }) {
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [modal,    setModal]      = useState(false);
  const [editing,  setEditing]    = useState(null); // null = create, Product = edit
  const [form,     setForm]       = useState(EMPTY_FORM);
  const [saving,   setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    catalogApi.getProducts(1, 100)
      .then(({ products: p }) => setProducts(p || []))
      .catch(() => onNotify?.('Failed to load products', 'error'))
      .finally(() => setLoading(false));
  }, [onNotify]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      slug:          product.slug || '',
      name:          product.name || '',
      category:      product.category || '',
      description:   product.description || '',
      pricePerGram:  product.pricePerGram?.toString() || '',
      stockQuantity: product.stockQuantity?.toString() || '',
      imageUrl:      product.imageUrl || '',
      available:     product.available ?? true,
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      pricePerGram:  parseFloat(form.pricePerGram),
      stockQuantity: parseInt(form.stockQuantity, 10),
    };
    try {
      if (editing) {
        await catalogApi.updateProduct(editing.id, payload);
        onNotify?.('Product updated', 'success');
      } else {
        await catalogApi.createProduct(payload);
        onNotify?.('Product created', 'success');
      }
      setModal(false);
      load();
    } catch (err) {
      onNotify?.(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await catalogApi.deleteProduct(product.id);
      onNotify?.('Product deleted', 'success');
      load();
    } catch (err) {
      onNotify?.(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Products</h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>₹/gram</th>
                <th>Stock (g)</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><span className="admin-badge">{p.category}</span></td>
                  <td>₹{parseFloat(p.pricePerGram).toFixed(2)}</td>
                  <td>{p.stockQuantity}g</td>
                  <td>
                    <span className={`admin-status ${p.available ? 'available' : 'unavailable'}`}>
                      {p.available ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <button className="admin-btn admin-btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2 className="admin-modal-title">{editing ? 'Edit Product' : 'New Product'}</h2>
            <form className="admin-form" onSubmit={handleSave}>
              {[
                ['slug',         'Slug (URL-friendly)',     'text',   true],
                ['name',         'Product Name',            'text',   true],
                ['category',     'Category',                'text',   true],
                ['description',  'Description',             'text',   false],
                ['pricePerGram', 'Price per gram (₹)',      'number', true],
                ['stockQuantity','Stock (grams)',           'number', true],
                ['imageUrl',     'Image URL',               'url',    false],
              ].map(([key, label, type, required]) => (
                <label key={key} className="admin-form-label">
                  {label}
                  <input
                    type={type}
                    step={type === 'number' ? 'any' : undefined}
                    required={required}
                    className="admin-form-input"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <label className="admin-form-label admin-form-checkbox">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                />
                Available (visible to customers)
              </label>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
