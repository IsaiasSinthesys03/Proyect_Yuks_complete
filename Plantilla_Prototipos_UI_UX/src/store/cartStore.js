import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const totals = (items) => ({
  items,
  itemCount: items.reduce((count, item) => count + item.quantity, 0),
  cartTotal: items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
});

const normalizeItem = (productOrItem, variant, quantity = 1) => {
  if (!variant) return { ...productOrItem, quantity: productOrItem.quantity || quantity };
  return {
    variantId: variant.id,
    productId: productOrItem.id,
    name: productOrItem.name,
    price: productOrItem.price,
    imageUrl: productOrItem.imageUrl,
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    quantity,
  };
};

/**
 * cartStore — Carrito del cliente (Fase 38, scaffold funcional).
 * Sustituirá al `useCart` local del prototipo al conectar el checkout (Fase 42).
 * Los precios autoritativos los calcula el backend en `POST /api/checkout`.
 */
export const useCartStore = create(persist((set, get) => ({
  items: [], // { variantId, productId, name, price, quantity, ... }
  itemCount: 0,
  cartTotal: 0,

  addItem: (productOrItem, variant, quantity = 1) =>
    set((state) => {
      const item = normalizeItem(productOrItem, variant, quantity);
      const existing = state.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        return totals(state.items.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i
        ));
      }
      return totals([...state.items, item]);
    }),

  removeItem: (variantId) => set((state) => totals(state.items.filter((i) => i.variantId !== variantId))),
  clear: () => set(totals([])),
  syncWithServer: (validationResults) => set((state) => {
    let hasChanges = false;
    let newItems = [...state.items];
    for (const res of validationResults) {
      if (res.status === 'out_of_stock') {
        newItems = newItems.filter(i => i.variantId !== res.variantId);
        hasChanges = true;
      } else if (res.status === 'reduced') {
        newItems = newItems.map(i => i.variantId === res.variantId ? { ...i, quantity: res.availableStock } : i);
        hasChanges = true;
      }
    }
    return hasChanges ? totals(newItems) : state;
  }),
  count: () => get().items.reduce((n, i) => n + i.quantity, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}), {
  name: 'animayuks-cart',
  partialize: ({ items, itemCount, cartTotal }) => ({ items, itemCount, cartTotal }),
}));
