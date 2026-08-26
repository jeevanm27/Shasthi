import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <h1 className="notfound-code">404</h1>
        <h2>Page not found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">Back to home</Link>
          <Link to="/shop" className="btn-secondary">Browse products</Link>
        </div>
      </div>
    </div>
  );
}
