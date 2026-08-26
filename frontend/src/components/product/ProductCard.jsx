import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const CATEGORY_COLORS = {
  Blends:  '#c55237',
  Powders: '#b9782d',
  Podis:   '#744632',
  Pickles: '#557442',
};

const CATEGORY_EMOJI = {
  Blends:  '🌶️',
  Powders: '✨',
  Podis:   '🍚',
  Pickles: '🥭',
};

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});

export default function ProductCard({ product, onAdd }) {
  const { add } = useCart();

  function handleAdd() {
    add(product);
    if (onAdd) onAdd(product);
  }

  const jarColor = CATEGORY_COLORS[product.category] || '#d88128';
  const emoji    = CATEGORY_EMOJI[product.category]  || '🌿';

  return (
    <article className="product-card">
      <div className="product-jar" style={{ '--jar-color': jarColor }}>
        <div className="jar-body">
          <span className="jar-emoji">{emoji}</span>
          <p className="jar-label">{product.name.split(' ').slice(0, 2).join(' ')}</p>
        </div>
      </div>

      <div className="product-info">
        {product.tag && (
          <span className="product-tag">{product.tag}</span>
        )}
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
