import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});

// Category accent colours for the fallback placeholder
const CATEGORY_COLOR = {
  Blends:  '#c55237',
  Powders: '#b9782d',
  Podis:   '#744632',
  Pickles: '#557442',
};

export default function ProductCard({ product, onAdd }) {
  const { add } = useCart();

  function handleAdd() {
    add(product);
    if (onAdd) onAdd(product);
  }

  const accentColor = CATEGORY_COLOR[product.category] || '#d96946';

  return (
    <article className="product-card">
      {/* Product image */}
      <div className="product-image-wrap" style={{ '--accent': accentColor }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="product-image"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback shown when no image or image fails to load */}
        <div
          className="product-image-fallback"
          style={{ display: product.image_url ? 'none' : 'flex' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          </svg>
          <span>{product.name.split(' ').slice(0,2).join(' ')}</span>
        </div>
        {/* Category badge */}
        <span className="product-category-badge">{product.category}</span>
      </div>

      {/* Product info */}
      <div className="product-info">
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <div className="product-price">
            <strong>{money.format(product.price)}</strong>
            <small>{product.weight}</small>
          </div>
          <button
            className={`add-btn${!product.available ? ' sold-out' : ''}`}
            disabled={!product.available}
            onClick={handleAdd}
          >
            {product.available ? 'Add to cart' : 'Sold out'}
          </button>
        </div>
      </div>
    </article>
  );
}
