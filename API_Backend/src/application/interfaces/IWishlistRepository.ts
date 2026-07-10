import { Product } from '../../domain/entities/Product';

/**
 * Item de wishlist (Fase 44, REQ-FE-19): producto + stock TOTAL agregado de
 * sus variantes, para que el frontend pinte "Agotado" (escala de grises) en
 * vivo sin N+1 llamadas al detalle.
 */
export type WishlistItem = Product & { totalStock: number };

/**
 * Puerto del repositorio de Wishlist (REQ-FE-19, Fase 31).
 */
export interface IWishlistRepository {
  /**
   * Agrega un producto a la lista del usuario. Idempotente: si ya existía,
   * devuelve `false` (sin error). Devuelve `true` si se insertó ahora.
   */
  add(userId: string, productId: string): Promise<boolean>;

  /** Elimina un producto de la lista. Devuelve `true` si existía. */
  remove(userId: string, productId: string): Promise<boolean>;

  /** Lista los productos (activos) con su stock agregado, más recientes primero. */
  findByUserId(userId: string): Promise<WishlistItem[]>;
}
