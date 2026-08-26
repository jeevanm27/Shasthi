import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ open, onClose, defaultTab = 'login' }) {
  const { login, register, loading } = useAuth();
  const [tab, setTab]       = useState(defaultTab);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');

  useEffect(() => {
    if (open) { setTab(defaultTab); setError(''); setSuccess(''); }
  }, [open, defaultTab]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    const result = await login(loginEmail, loginPassword);
    if (result.ok) { onClose(); }
    else setError(result.message);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return; }
    const result = await register(regName, regEmail, regPassword);
    if (result.ok) { setSuccess('Account created! Welcome to Shasthi.'); setTimeout(onClose, 1200); }
    else setError(result.message);
  }

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Logo */}
        <div className="auth-brand">
          <span className="auth-logo">🌶️</span>
          <span className="auth-logo-text">Shasthi Masala</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >Sign in</button>
          <button
            role="tab"
            className={`auth-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >Create account</button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <p className="auth-subtitle">Welcome back! Sign in to your account.</p>
            <label>
              Email address
              <input type="email" required autoFocus placeholder="you@example.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" required placeholder="Your password"
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn-primary full-w" disabled={loading}>
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

        {/* Register form */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <p className="auth-subtitle">Join Shasthi — takes 30 seconds.</p>
            <label>
              Full name
              <input type="text" required autoFocus placeholder="Ananya Rao"
                value={regName} onChange={e => setRegName(e.target.value)} />
            </label>
            <label>
              Email address
              <input type="email" required placeholder="you@example.com"
                value={regEmail} onChange={e => setRegEmail(e.target.value)} />
            </label>
            <label>
              Password <span className="field-hint">(min. 8 characters)</span>
              <input type="password" required minLength={8} placeholder="Choose a password"
                value={regPassword} onChange={e => setRegPassword(e.target.value)} />
            </label>
            <label>
              Confirm password
              <input type="password" required minLength={8} placeholder="Repeat password"
                value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
            </label>
            {error   && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}
            <button type="submit" className="btn-primary full-w" disabled={loading}>
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
    </div>
  );
}
