/**
 * Entidad de Dominio: ProductVariant
 *
 * Representa una variante específica de un producto (ej. Talla M, Color Rojo).
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 *
 * El stock se controla a nivel de variante, NO a nivel de producto.
 * Esto permite un control granular del inventario por talla/color,
 * evitando quiebres logísticos (CMS-FE-06 "Abismo de las Tallas").
 */
export interface ProductVariant {
  readonly id: string;
  readonly productId: string;
  readonly sku: string;
  readonly size: string | null;
  readonly color: string | null;
  readonly stock: number;
  readonly createdAt: Date;
}
