import './ProductCard.css';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
});

const CATEGORY_COLOR = {
  Blends:  '#c55237',
  Powders: '#b9782d',
  Podis:   '#744632',
  Pickles: '#557442',
};

/**
 * ProductCard — stateless. All add-to-cart logic lives in parent (home/shop).
 * onAdd is called with no arguments; parent handles addItem() with appropriate grams.
 */
export default function ProductCard({ product, onAdd }) {
  const accentColor = CATEGORY_COLOR[product.category] || '#d96946';

  return (
    <article className="product-card">
      {/* Product image */}
      <div className="product-image-wrap" style={{ '--accent': accentColor }}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
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
          style={{ display: product.imageUrl ? 'none' : 'flex' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          </svg>
          <span>{product.name.split(' ').slice(0, 2).join(' ')}</span>
        </div>
        {/* Category badge */}
        <span className="product-category-badge">{product.category}</span>
      </div>

      {/* Product info */}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <div className="product-price">
            <strong>₹{parseFloat(product.pricePerGram).toFixed(2)}</strong>
            <small>/gram</small>
          </div>
          {product.stockQuantity != null && (
            <small className="product-stock">
              {product.stockQuantity > 0 ? `${product.stockQuantity}g left` : 'Out of stock'}
            </small>
          )}
          <button
            className={`add-btn${!product.available || product.stockQuantity === 0 ? ' sold-out' : ''}`}
            disabled={!product.available || product.stockQuantity === 0}
            onClick={onAdd}
          >
            {product.available && product.stockQuantity !== 0 ? 'Add to cart' : 'Sold out'}
          </button>
        </div>
      </div>
    </article>
  );
}
