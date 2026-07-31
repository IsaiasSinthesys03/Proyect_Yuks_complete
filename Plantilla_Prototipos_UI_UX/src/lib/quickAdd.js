import { api, unwrap } from './api';
import { useCartStore } from '../store/cartStore';

/**
 * quickAdd — Añadido rápido al carrito desde listados (Fase 42).
 *
 * Los listados (grilla, TrendingTop, Omnibox) NO traen variantes, y el checkout
 * del backend exige `variantId`. Este helper resuelve el detalle del producto y
 * agrega la PRIMERA variante con stock. Si el producto no tiene stock en ninguna
 * variante, avisa con el toast y no agrega nada.
 *
 * @returns true si se agregó, false si no fue posible.
 */
export async function quickAdd(productId, showToast) {
  try {
    const detail = unwrap(await api.get(`/api/products/${productId}`));
    const variant = (detail?.variants ?? []).find((v) => v.stock > 0);
    if (!variant) {
      showToast('Producto agotado por el momento.', 'error');
      return false;
    }
    useCartStore.getState().addItem({
      variantId: variant.id,
      productId: detail.product.id,
      name: detail.product.name,
      price: detail.product.price,
      imageUrl: detail.product.imageUrl,
      size: variant.size,
      sku: variant.sku,
    });
    showToast('Agregado al carrito', 'success');
    return true;
  } catch {
    showToast('No pudimos agregar el producto. Intenta de nuevo.', 'error');
    return false;
  }
}
