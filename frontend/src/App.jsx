import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider }          from './context/CartContext.jsx';

// Layout components
import Header     from './components/layout/Header.jsx';
import CartDrawer from './components/cart/CartDrawer.jsx';
import Toast      from './components/ui/Toast.jsx';

// Customer pages
import Home     from './pages/home/index.jsx';
import Shop     from './pages/Shop/index.jsx';
import Checkout from './pages/Checkout/index.jsx';
import Orders   from './pages/Orders/index.jsx';
import NotFound from './pages/NotFound/index.jsx';

// Admin pages
import AdminLayout  from './pages/admin/AdminLayout.jsx';
import AdminProducts from './pages/admin/Products.jsx';
import AdminOrders  from './pages/admin/Orders.jsx';

import './styles/global.css';

/**
 * Route guard: redirects to home if not ADMIN
 */
function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!isAdmin)   return <Navigate to="/" replace />;
  return children;
}

/**
 * Route guard: redirects to home if not logged in
 */
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const [cartOpen, setCartOpen] = useState(false);
  const [toast,    setToast]    = useState({ message: '', type: 'info' });

  const notify    = useCallback((message, type = 'info') => setToast({ message, type }), []);
  const openCart  = useCallback(() => setCartOpen(true),  []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  return (
    <>
      <Header onCartOpen={openCart} />
      <CartDrawer open={cartOpen} onClose={closeCart} />

      <Routes>
        {/* ── Customer Storefront ────────────────────────────────────────── */}
        <Route path="/"         element={<Home     onNotify={notify} />} />
        <Route path="/shop"     element={<Shop     onNotify={notify} />} />
        <Route path="/shop/:id" element={<Shop     onNotify={notify} />} />
        <Route path="/checkout" element={
          <ProtectedRoute><Checkout onNotify={notify} /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute><Orders onNotify={notify} /></ProtectedRoute>
        } />

        {/* ── Admin Dashboard ────────────────────────────────────────────── */}
        <Route path="/admin" element={
          <AdminRoute><AdminLayout /></AdminRoute>
        }>
          <Route index           element={<Navigate to="/admin/products" replace />} />
          <Route path="products" element={<AdminProducts onNotify={notify} />} />
          <Route path="orders"   element={<AdminOrders   onNotify={notify} />} />
        </Route>

        {/* ── Fallback ───────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>

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
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
