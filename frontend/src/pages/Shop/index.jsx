import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalogApi';
import ProductCard from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import './Shop.css';


const CATEGORIES = ['All', 'Blends', 'Powders', 'Podis', 'Pickles'];
const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc',   label: 'Name: A–Z' },
];

export default function Shop({ onNotify }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [query,  setQuery]  = useState('');
  const [sort,   setSort]   = useState('featured');
  const [availOnly, setAvailOnly] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const paramCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    catalogApi.getProducts()
      .then(setAllProducts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const setCategory = useCallback((cat) => {
    cat === 'All' ? setSearchParams({}) : setSearchParams({ category: cat });
  }, [setSearchParams]);

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (paramCategory !== 'All') list = list.filter(p => p.category === paramCategory);
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));

    }
    if (availOnly) list = list.filter(p => p.available);
    switch (sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name-asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return list;
  }, [allProducts, paramCategory, debouncedQuery, availOnly, sort]);

  return (
    <div className="shop-page">
      <div className="container">
        <div className="shop-header">
          <span className="eyebrow">The pantry</span>
          <h1>All products</h1>
        </div>

        <div className="shop-layout">
          {/* Sidebar */}
          <aside className="shop-sidebar">
            <div className="sidebar-section">
              <h4>Categories</h4>
              <ul className="filter-list">
                {CATEGORIES.map(cat => (
                  <li key={cat}>
                    <button
                      className={`filter-item${paramCategory === cat ? ' active' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                      <span className="filter-count">
                        {cat === 'All' ? allProducts.length : allProducts.filter(p => p.category === cat).length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sidebar-section">
              <h4>Availability</h4>
              <label className="toggle-label">
                <input type="checkbox" checked={availOnly} onChange={e => setAvailOnly(e.target.checked)} />
                In stock only
              </label>
            </div>
          </aside>

          {/* Main */}
          <main className="shop-main">
            <div className="shop-toolbar">
              <div className="search-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="search"
                  placeholder="Search spices…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Search products"
                />
              </div>
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Mobile category pills */}
            <div className="mobile-filters" role="group">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`pill${paramCategory === cat ? ' active' : ''}`}
                  onClick={() => setCategory(cat)}
                >{cat}</button>
              ))}
            </div>

            {loading ? (
              <div className="shop-grid">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>

            ) : error ? (
              <div className="shop-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="shop-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p>No products match your filters.</p>
                <button onClick={() => { setQuery(''); setCategory('All'); setAvailOnly(false); }}>Clear filters</button>
              </div>
            ) : (
              <>
                <p className="result-count">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
                <div className="shop-grid">
                  {filtered.map(p => (
                    <ProductCard key={p.id} product={p} onAdd={() => onNotify?.(`${p.name} added!`, 'info')} />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
