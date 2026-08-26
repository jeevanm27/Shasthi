import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../../api/catalogApi';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import './Home.css';


const CATEGORIES = [
  { name: 'Blends',  emoji: '🌶️', desc: 'Classic masala mixes' },
  { name: 'Powders', emoji: '✨', desc: 'Pure ground spices' },
  { name: 'Podis',   emoji: '🍚', desc: 'Dry chutney powders' },
  { name: 'Pickles', emoji: '🥭', desc: 'Tangy homestyle relishes' },
];

const TRUST = [
  { icon: '🌿', title: '100% Natural', desc: 'No artificial preservatives, colours, or additives. Ever.' },
  { icon: '🏺', title: 'Small-batch', desc: 'Made in limited quantities to ensure peak freshness.' },
  { icon: '👨‍👩‍👧', title: 'Family Recipe', desc: 'Passed down across generations of South Indian cooking.' },
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
                <span className="cat-emoji">{cat.emoji}</span>
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
            <div className="story-card story-card--1">🌶️</div>
            <div className="story-card story-card--2">✨</div>
            <div className="story-card story-card--3">🍚</div>
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
