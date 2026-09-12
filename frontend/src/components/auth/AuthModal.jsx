import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import './AuthModal.css';

export default function AuthModal({ open, onClose, defaultTab = 'login' }) {
  const { login, register, loading } = useAuth();

  const [tab,     setTab]    = useState(defaultTab);
  const [error,   setError]  = useState('');
  const [success, setSuccess] = useState('');

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setError('');
      setSuccess('');
      setLoginEmail('');
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
    }
  }, [open, defaultTab]);

  // Close on Escape
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
      setError(err.message || 'Invalid email or password. Please try again.');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await register(regName.trim(), regEmail.trim(), regPassword);
      setSuccess('Account created! Welcome to Shasthi Masala 🌿');
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal card */}
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'login' ? 'Sign in' : 'Create account'}
      >
        {/* Close */}
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Brand */}
        <div className="auth-brand">
          <span>🌿</span>
          <span className="auth-logo-text">Shasthi Masala</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Create account
          </button>
        </div>

        {/* Alerts */}
        {error   && <p className="auth-error"   role="alert">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        {/* ── Login form ── */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
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
                disabled={loading}
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
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              className="btn-primary full-w"
              disabled={loading || !loginEmail || !loginPassword}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="auth-switch">
              Don't have an account?{' '}
              <button type="button" className="link-btn" onClick={() => { setTab('register'); setError(''); }}>
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── Register form ── */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister} noValidate>
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              className="btn-primary full-w"
              disabled={loading || !regName || !regEmail || !regPassword || !regConfirm}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="link-btn" onClick={() => { setTab('login'); setError(''); }}>
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </>
  );
}
