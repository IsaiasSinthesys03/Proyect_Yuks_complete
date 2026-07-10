/**
 * Entidad de Dominio: OrderItem
 *
 * Representa un ítem individual dentro de un pedido (REQ-BE-01).
 *
 * INMUTABILIDAD: Los campos `productName`, `variantSku` y `unitPrice` son
 * SNAPSHOTS CONGELADOS capturados al momento del checkout. Si el producto
 * cambia de precio o nombre después de la compra, la orden histórica
 * conserva los valores originales. Esto es crítico para compliance legal (PROFECO).
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface OrderItem {
  readonly id: string;
  readonly orderId: string;
  readonly variantId: string;
  readonly productName: string;
  readonly variantSku: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly hasVirtualReward: boolean;
}
