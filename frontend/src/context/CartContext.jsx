import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'shasthi_cart';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.product.id);
      if (existing) {
        return { ...state, items: state.items.map(i =>
          i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
        )};
      }
      return { ...state, items: [...state.items, { ...action.product, quantity: 1 }] };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY':
      if (action.quantity < 1) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) };
      }
      return { ...state, items: state.items.map(i =>
        i.id === action.id ? { ...i, quantity: action.quantity } : i
      )};
    case 'CLEAR':
      return { items: [], insight: null };
    case 'SET_INSIGHT':
      return { ...state, insight: action.insight };
    case 'CLEAR_INSIGHT':
      return { ...state, insight: null };
    default:
      return state;
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { items: [], insight: null };
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, null, loadCart);

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [state]);

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  const value = {
    items:     state.items,
    insight:   state.insight,
    subtotal,
    itemCount,
    subtotalFormatted: money.format(subtotal),
    add:          (product) => dispatch({ type: 'ADD', product }),
    remove:       (id)      => dispatch({ type: 'REMOVE', id }),
    updateQty:    (id, quantity) => dispatch({ type: 'UPDATE_QTY', id, quantity }),
    clear:        ()        => dispatch({ type: 'CLEAR' }),
    setInsight:   (insight) => dispatch({ type: 'SET_INSIGHT', insight }),
    clearInsight: ()        => dispatch({ type: 'CLEAR_INSIGHT' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}