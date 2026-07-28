import { OrderStatus } from '../entities/Order';

// ==========================================
// Fase 24 — DTOs para gestión admin de pedidos (Kanban)
// ==========================================

/**
 * Filtros para el listado admin de pedidos.
 * Todos los campos son opcionales — sin filtro retorna todos los pedidos.
 */
export interface AdminOrderFilterDTO {
  status?: OrderStatus;
  userId?: string;
  page?: number;
  limit?: number;
}

/**
 * DTO para actualizar el estado de un pedido desde el Kanban CMS.
 *
 * `status` solo puede avanzar según la máquina de estados definida en
 * `UpdateOrderStatusUseCase`. Retroceder o saltar estados lanza
 * `InvalidStatusTransitionError` (HTTP 422).
 *
 * Los campos de tracking son opcionales pero contextualmente requeridos:
 *   - driverName/Vehicle/Phone: para transición a SHIPPED con LOCAL delivery.
 *   - trackingCompany/Number: para SHIPPED con EXTERNAL_COURIER.
 */
export interface UpdateOrderStatusDTO {
  status: 'PREPARING' | 'SHIPPED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  driverName?: string | null;
  driverVehicle?: string | null;
  driverPhone?: string | null;
  trackingCompany?: string | null;
  trackingNumber?: string | null;
}

/**
 * Fila del Kanban logístico (Fase 49, CMS-FE-04).
 *
 * A diferencia del `OrderSummaryDTO` del perfil del cliente, el tablero
 * logístico necesita el SNAPSHOT de entrega de la orden (dirección, CP,
 * municipio, tipo de envío) y la identidad del cliente (nombre/teléfono,
 * vía JOIN a profiles) para que el operador pueda despachar sin abrir
 * cada pedido.
 */
export interface AdminOrderSummaryDTO {
  id: string;
  status: OrderStatus;
  totalPaid: number;
  itemCount: number;
  createdAt: Date;
  deliveryType: string | null;      // 'LOCAL' | 'EXTERNAL_COURIER'
  shippingAddress: string;
  postalCode: string;
  municipality: string;
  state: string;
  clientName: string;
  clientPhone: string | null;
}
