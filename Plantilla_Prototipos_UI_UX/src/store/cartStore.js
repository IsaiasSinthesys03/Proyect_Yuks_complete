import { create } from 'zustand';

/**
 * cartStore — Carrito del cliente (Fase 38, scaffold funcional).
 * Sustituirá al `useCart` local del prototipo al conectar el checkout (Fase 42).
 * Los precios autoritativos los calcula el backend en `POST /api/checkout`.
 */
export const useCartStore = create((set, get) => ({
  items: [], // { variantId, productId, name, price, quantity, ... }

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
    }),

  removeItem: (variantId) => set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((n, i) => n + i.quantity, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
