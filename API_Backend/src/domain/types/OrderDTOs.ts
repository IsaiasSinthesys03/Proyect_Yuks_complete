import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { RewardCode } from '../entities/RewardCode';

/**
 * Data Transfer Objects para el módulo de Pedidos (REQ-FE-23).
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases de pedidos. No contienen lógica de negocio.
 */

/**
 * Versión resumida de un pedido para listados.
 * Usado en el historial de pedidos del usuario (pestañas Activos/Finalizados).
 */
export interface OrderSummaryDTO {
  id: string;
  status: OrderStatus;
  totalPaid: number;
  itemCount: number;
  createdAt: Date;
  /** Thumbnail del primer producto del pedido para vista rápida. */
  productThumbnail: string | null;
}

/**
 * Pedido completo con ítems y recompensas asociadas.
 * Usado en la vista de detalle del pedido con timeline de 5 estatus.
 */
export interface OrderDetailDTO {
  order: Order;
  items: OrderItem[];
  rewardCodes: RewardCode[];
}

/**
 * Payload para la cancelación autónoma de un pedido.
 */
export interface CancelOrderRequestDTO {
  orderId: string;
}
