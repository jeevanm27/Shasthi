import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../../api/catalogApi';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import './Home.css';


const CATEGORIES = [
  { name: 'Blends',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>, desc: 'Classic masala mixes' },
  { name: 'Powders', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>, desc: 'Pure ground spices' },
  { name: 'Podis',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, desc: 'Dry chutney powders' },
  { name: 'Pickles', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>, desc: 'Tangy homestyle relishes' },
];

const TRUST = [
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: '100% Natural', desc: 'No artificial preservatives, colours, or additives. Ever.' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 112 12h3"/><path d="M12 7V4"/></svg>, title: 'Small-batch', desc: 'Made in limited quantities to ensure peak freshness.' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>, title: 'Family Recipe', desc: 'Passed down across generations of South Indian cooking.' },
];


export default function Home({ onNotify }) {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();

  useEffect(() => {
    catalogApi.getProducts()
      .then(products => {
        const sellers = products.filter(p => p.available).slice(0, 4);
        setBestSellers(sellers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(product) {
    add(product);
    if (onNotify) onNotify(`${product.name} added to basket!`, 'info');
  }

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="eyebrow">Small-batch South Indian flavours</span>
          <h1>Bring warmth<br />to every meal.</h1>
          <p>Freshly ground staples, family recipes, and no unnecessary fillers. Ground with care in small batches.</p>
          <div className="hero-ctas">
            <Link to="/shop" className="btn-primary">Shop the pantry</Link>
            <a href="#story" className="btn-ghost">Our story</a>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="categories-section">
        <div className="container">
          <span className="eyebrow">Browse by type</span>
          <h2>Find your flavour</h2>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} to={`/shop?category=${cat.name}`} className="category-card">
                <span className="cat-icon">{cat.icon}</span>
                <div>
                  <h3>{cat.name}</h3>
                  <p>{cat.desc}</p>
                </div>
                <svg className="cat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>

            ))}
          </div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <section className="best-sellers">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Most loved</span>
              <h2>Our best sellers</h2>
            </div>
            <Link to="/shop" className="see-all">See all products →</Link>
          </div>
          {loading ? (
            <div className="home-products-grid">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (

            <div className="home-products-grid">
              {bestSellers.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => handleAdd(p)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="story-section" id="story">
        <div className="container story-inner">
          <div className="story-text">
            <span className="eyebrow">Our promise</span>
            <h2>Honest ingredients. Big flavour.</h2>
            <p>Shasthi Masala celebrates the comforting food we grew up with. Every blend is stone-ground to preserve the natural oils and flavour compounds that commercial grinders destroy with heat.</p>
            <p>We source directly from farmers in Tamil Nadu and Karnataka, and every batch is hand-packed within days of grinding to lock in freshness.</p>
            <Link to="/shop" className="btn-primary" style={{marginTop:'var(--sp-4)', display:'inline-block'}}>Shop now</Link>
          </div>
          <div className="story-visual">
            <div className="story-card story-card--1">Stone<br/>Ground</div>
            <div className="story-card story-card--2">No<br/>Additives</div>
            <div className="story-card story-card--3">Farm<br/>Sourced</div>
          </div>

        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            {TRUST.map(t => (
              <div key={t.title} className="trust-item">
                <span className="trust-icon">{t.icon}</span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
