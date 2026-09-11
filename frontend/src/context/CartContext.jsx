import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cart.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  // ── Sync cart from Redis when user logs in ────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) { setItems([]); return; }
    setLoading(true);
    cartApi.getCart()
      .then(({ items: serverItems }) => setItems(serverItems || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  // ── Add item ──────────────────────────────────────────────────────────────
  const addItem = useCallback(async (product, quantityGrams) => {
    const item = {
      productId:     product.id,
      productName:   product.name,
      pricePerGram:  parseFloat(product.pricePerGram),
      quantityGrams: parseInt(quantityGrams, 10),
      imageUrl:      product.imageUrl || null,
    };
    await cartApi.addItem(item);
    // Optimistic update
    setItems(prev => {
      const existing = prev.findIndex(i => i.productId === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantityGrams };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  // ── Update quantity ───────────────────────────────────────────────────────
  const updateItem = useCallback(async (productId, quantityGrams) => {
    await cartApi.updateItem(productId, quantityGrams);
    setItems(prev =>
      prev.map(i => i.productId === productId ? { ...i, quantityGrams } : i)
    );
  }, []);

  // ── Remove item ───────────────────────────────────────────────────────────
  const removeItem = useCallback(async (productId) => {
    await cartApi.removeItem(productId);
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  // ── Clear cart ────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    await cartApi.clearCart();
    setItems([]);
  }, []);

  // ── Checkout → emits Kafka event ──────────────────────────────────────────
  const checkout = useCallback(async () => {
    const result = await cartApi.checkout();
    setItems([]);  // cart cleared by server, reflect locally
    return result; // { eventId, totalPrice, itemCount }
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const cartCount = items.reduce((sum, i) => sum + 1, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.pricePerGram * i.quantityGrams, 0);

  return (
    <CartContext.Provider value={{
      items, loading, cartCount, cartTotal,
      addItem, updateItem, removeItem, clearCart, checkout
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}