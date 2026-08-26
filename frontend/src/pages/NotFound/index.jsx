import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <div className="notfound-spice">🌶️</div>
        <h1 className="notfound-code">404</h1>
        <h2>Page not found</h2>
        <p>Looks like this page went missing like the last of the rasam powder.</p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">Back to home</Link>
          <Link to="/shop" className="btn-secondary">Browse products</Link>
        </div>
      </div>
    </div>
  );
}
