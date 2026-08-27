import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthModal({ open, onClose, defaultTab = 'login' }) {
  const { login, register, googleLogin, loading } = useAuth();

  const [tab,    setTab]    = useState(defaultTab);
  const [error,  setError]  = useState('');
  const [success,setSuccess]= useState('');

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName,    setRegName]    = useState('');
  const [regEmail,   setRegEmail]   = useState('');
  const [regPassword,setRegPassword]= useState('');
  const [regConfirm, setRegConfirm] = useState('');

  useEffect(() => {
    if (open) { setTab(defaultTab); setError(''); setSuccess(''); }
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      const result = await googleLogin(tokenResponse.access_token);
      if (result.ok) { onClose(); }
      else setError(result.message);
    },
    onError: () => setError('Google sign-in failed or was cancelled.'),
  });

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
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    const result = await register(regName, regEmail, regPassword);
    if (result.ok) { setSuccess('Account created! Welcome.'); setTimeout(onClose, 1200); }
    else setError(result.message);
  }

  const switchToRegister = () => { setTab('register'); setError(''); setSuccess(''); };
  const switchToLogin    = () => { setTab('login');    setError(''); setSuccess(''); };

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Authentication">
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Brand */}
        <div className="auth-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="auth-logo-text">Shasthi Masala</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'login'}
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={switchToLogin}>Sign in</button>
          <button role="tab" aria-selected={tab === 'register'}
            className={`auth-tab${tab === 'register' ? ' active' : ''}`}
            onClick={switchToRegister}>Create account</button>
        </div>

        {/* Google Sign-In */}
        {GOOGLE_CLIENT_ID ? (
          <>
            <button
              type="button"
              className="google-btn"
              onClick={() => { setError(''); handleGoogleLogin(); }}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>or continue with email</span></div>
          </>
        ) : null}

        {/* Sign In Form */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <label>
              Email address
              <input type="email" required autoComplete="email" placeholder="you@example.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" required autoComplete="current-password" placeholder="Your password"
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="btn-primary full-w" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="auth-switch">
              No account?{' '}
              <button type="button" className="link-btn" onClick={switchToRegister}>Create one</button>
            </p>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            <label>
              Full name
              <input type="text" required autoComplete="name" placeholder="Your name"
                value={regName} onChange={e => setRegName(e.target.value)} />
            </label>
            <label>
              Email address
              <input type="email" required autoComplete="email" placeholder="you@example.com"
                value={regEmail} onChange={e => setRegEmail(e.target.value)} />
            </label>
            <label>
              Password <span className="field-hint">(min. 8 characters)</span>
              <input type="password" required minLength={8} autoComplete="new-password"
                placeholder="Create a password"
                value={regPassword} onChange={e => setRegPassword(e.target.value)} />
            </label>
            <label>
              Confirm password
              <input type="password" required minLength={8} autoComplete="new-password"
                placeholder="Repeat your password"
                value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
            </label>
            {error   && <p className="auth-error"  role="alert">{error}</p>}
            {success && <p className="auth-success" role="status">{success}</p>}
            <button type="submit" className="btn-primary full-w" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="link-btn" onClick={switchToLogin}>Sign in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
