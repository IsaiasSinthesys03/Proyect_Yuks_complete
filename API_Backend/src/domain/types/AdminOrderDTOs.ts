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
