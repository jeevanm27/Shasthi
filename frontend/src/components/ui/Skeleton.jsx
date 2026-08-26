import './Skeleton.css';

export default function Skeleton({ width, height, radius, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width:  width  || '100%',
        height: height || '16px',
        borderRadius: radius || 'var(--r)',
      }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card-skeleton">
      <div className="skeleton pcs-image" aria-hidden="true" />
      <div className="pcs-body">
        <div className="skeleton pcs-tag" aria-hidden="true" />
        <div className="skeleton pcs-name" aria-hidden="true" />
        <div className="skeleton pcs-name-2" aria-hidden="true" />
        <div className="pcs-footer">
          <div className="skeleton pcs-price" aria-hidden="true" />
          <div className="skeleton pcs-btn" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
