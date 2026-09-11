import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import './AuthModal.css';

export default function AuthModal({ open, onClose, defaultTab = 'login' }) {
  const { login, register, loading } = useAuth();

  const [tab,    setTab]    = useState(defaultTab);
  const [error,  setError]  = useState('');
  const [success, setSuccess] = useState('');

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');

  useEffect(() => {
    if (open) { setTab(defaultTab); setError(''); setSuccess(''); }
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      await login(loginEmail.trim(), loginPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register(regName.trim(), regEmail.trim(), regPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'login' ? 'Sign in' : 'Create account'}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="modal-brand">
          <span>🌿</span> Shasthi Masala
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >Sign in</button>
          <button
            className={`modal-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >Create account</button>
        </div>

        {error && <p className="modal-error" role="alert">{error}</p>}
        {success && <p className="modal-success">{success}</p>}

        {/* Login Form */}
        {tab === 'login' && (
          <form className="modal-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="modal-switch">
              Don't have an account?{' '}
              <button type="button" className="link-btn" onClick={() => setTab('register')}>
                Create one
              </button>
            </p>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form className="modal-form" onSubmit={handleRegister}>
            <label>
              Full name
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Ananya Rao"
                value={regName}
                onChange={e => setRegName(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                id="reg-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
            </label>
            <label>
              Confirm password
              <input
                id="reg-confirm"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={regConfirm}
                onChange={e => setRegConfirm(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <p className="modal-switch">
              Already have an account?{' '}
              <button type="button" className="link-btn" onClick={() => setTab('login')}>
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </>
  );
}
