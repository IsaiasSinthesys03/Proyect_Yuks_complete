/**
 * Entidad de Dominio: Order
 *
 * Representa un pedido completo en el sistema Animayuks (REQ-BE-01, REQ-FE-23).
 *
 * Pipeline de estatus (8 estados):
 *   PAYMENT_PENDING → PAID → PREPARING → SHIPPED → DELIVERING → DELIVERED
 *                                                              → CANCELLED
 *                                                              → NEEDS_RECONCILIATION (Q4: fallo DLQ)
 *
 * Campos de compliance (REQ-BE-08):
 *   - termsVersion: versión exacta de las políticas aceptadas al momento de la compra.
 *   - clientIp: dirección IP del cliente para audit trail bancario.
 *
 * Campos de Última Milla (CMS-FE-04):
 *   - driverName, driverVehicle, driverPhone: datos del chofer de entrega local.
 *   - trackingCompany, trackingNumber: datos de paquetería para envío foráneo.
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface Order {
  readonly id: string;
  readonly userId: string;
  readonly status: OrderStatus;
  readonly subtotal: number;
  readonly discountAmount: number;
  readonly shippingCost: number;
  readonly walletDeduction: number;
  readonly totalPaid: number;
  readonly deliveryType: DeliveryType | null;
  readonly shippingAddress: string;
  readonly postalCode: string;
  readonly municipality: string;
  readonly state: string;
  readonly termsVersion: string;
  readonly clientIp: string;
  readonly idempotencyKey: string;
  readonly couponId: string | null;
  readonly stripePaymentIntentId: string | null;
  readonly driverName: string | null;
  readonly driverVehicle: string | null;
  readonly driverPhone: string | null;
  readonly trackingCompany: string | null;
  readonly trackingNumber: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Pipeline de estatus de un pedido.
 *
 * PAYMENT_PENDING: Esperando confirmación de la pasarela de pago (ej. 3D Secure).
 * PAID: Pago confirmado por Stripe/MercadoPago.
 * PREPARING: El equipo de almacén está empaquetando el pedido.
 * SHIPPED: El pedido fue enviado (chofer local o paquetería).
 * DELIVERING: El pedido está en camino al destino.
 * DELIVERED: El pedido fue entregado exitosamente.
 * CANCELLED: El pedido fue cancelado (por el usuario o automáticamente).
 * NEEDS_RECONCILIATION: Fallo DLQ (Q4) — el cobro en Stripe fue exitoso pero
 *   el commit SQL falló. Requiere intervención manual del administrador.
 */
export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'NEEDS_RECONCILIATION';

/**
 * Tipo de entrega según el Motor de Enrutamiento Logístico (REQ-BE-07).
 *
 * LOCAL: El municipio/estado del destino coincide con la zona configurada.
 *        Se usa el chofer de entrega local de la empresa.
 * EXTERNAL_COURIER: El destino está fuera de la zona local.
 *        Se usa una paquetería externa (FedEx, DHL, etc.).
 */
export type DeliveryType = 'LOCAL' | 'EXTERNAL_COURIER';
