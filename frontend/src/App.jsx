import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header       from './components/layout/Header';
import Footer       from './components/layout/Footer';
import CartDrawer   from './components/cart/CartDrawer';
import Toast        from './components/ui/Toast';
import AuthModal    from './components/auth/AuthModal';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Home         from './pages/Home';
import Shop         from './pages/Shop';
import Checkout     from './pages/Checkout';
import Orders       from './pages/Orders';
import Admin        from './pages/Admin';
import NotFound     from './pages/NotFound';
import './styles/global.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppShell() {
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState('login');
  const [toast,    setToast]    = useState({ message: '', type: 'info' });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.authRequired) {
      setAuthTab('login');
      setAuthOpen(true);
    }
  }, [location.state]);

  const notify   = useCallback((message, type = 'info') => setToast({ message, type }), []);
  const openCart = useCallback(() => setCartOpen(true),  []);
  const closeCart= useCallback(() => setCartOpen(false), []);
  const openAuth = useCallback((tab = 'login') => { setAuthTab(tab); setAuthOpen(true); }, []);
  const closeAuth= useCallback(() => {
    setAuthOpen(false);
    if (location.state?.from) navigate(location.state.from, { replace: true });
  }, [location.state, navigate]);

  return (
    <>
      <Header onCartOpen={openCart} onAuthOpen={() => openAuth('login')} />
      <CartDrawer open={cartOpen} onClose={closeCart} onAuthOpen={() => openAuth('login')} />
      <AuthModal open={authOpen} onClose={closeAuth} defaultTab={authTab} />

      <Routes>
        <Route path="/"         element={<Home     onNotify={notify} onAuthOpen={openAuth} />} />
        <Route path="/shop"     element={<Shop     onNotify={notify} />} />
        <Route path="/shop/:id" element={<Shop     onNotify={notify} />} />
        <Route path="/checkout" element={<Checkout onNotify={notify} />} />
        <Route path="/orders"   element={
          <ProtectedRoute>
            <Orders onNotify={notify} />
          </ProtectedRoute>
        } />
        <Route path="/admin"    element={<Admin />} />
        <Route path="*"         element={<NotFound />} />
      </Routes>

      <Footer />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
