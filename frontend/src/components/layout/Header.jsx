import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header({ onCartOpen, onAuthOpen }) {
  const { itemCount }            = useCart();
  const { user, isAuthed, logout } = useAuth();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userMenuOpen]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="header-inner container">
        <Link to="/" className="brand">
          Shasthi <span>Masala</span>
        </Link>

        <nav className={`main-nav${menuOpen ? ' open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/shop" onClick={() => setMenuOpen(false)}>Shop</NavLink>
          <a href="/#story" onClick={() => setMenuOpen(false)}>Our Story</a>
          {isAuthed && (
            <NavLink to="/orders" onClick={() => setMenuOpen(false)}>My Orders</NavLink>
          )}
          <NavLink to="/admin" onClick={() => setMenuOpen(false)} className="nav-admin-link">Admin</NavLink>
        </nav>

        <div className="header-actions">
          {/* Cart */}
          <button className="cart-btn" onClick={onCartOpen} aria-label={`Open cart, ${itemCount} items`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>

          {/* Auth */}
          {isAuthed ? (
            <div className="user-menu-wrap" onClick={e => e.stopPropagation()}>
              <button
                className="user-avatar-btn"
                onClick={() => setUserMenuOpen(o => !o)}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <span className="user-avatar">{initials}</span>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <p className="user-name">{user.name}</p>
                  <p className="user-email">{user.email}</p>
                  <hr />
                  <Link to="/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    📦 My Orders
                  </Link>
                  <button className="dropdown-item danger" onClick={() => { logout(); setUserMenuOpen(false); }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="sign-in-btn" onClick={onAuthOpen}>Sign in</button>
          )}

          {/* Hamburger */}
          <button
            className="hamburger"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
