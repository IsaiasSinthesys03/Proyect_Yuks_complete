import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { OrderSummaryDTO, OrderDetailDTO } from '../../domain/types/OrderDTOs';
import { PaginatedResponseDTO } from '../../domain/types/ProductDTOs';
import { AdminOrderFilterDTO, AdminOrderSummaryDTO } from '../../domain/types/AdminOrderDTOs';
import { AdminAuditContext } from '../../domain/types/AdminTypes';

/**
 * Puerto (Interfaz) del Repositorio de Pedidos.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 * - Solo recibe y devuelve Entidades de Dominio y DTOs.
 * - Jamás expone tipos de Kysely, SQL, o cualquier detalle de persistencia.
 * - Los Use Cases dependen de esta abstracción, no de la implementación concreta.
 */
export interface IOrderRepository {
  /**
   * Crea un pedido junto con sus ítems en una sola transacción atómica.
   * La implementación concreta DEBE usar db.transaction() para garantizar
   * que si falla la inserción de un ítem, la orden no se persiste.
   */
  createOrder(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ): Promise<Order>;

  /**
   * Busca un pedido por su ID, filtrado por usuario para seguridad.
   * Un usuario solo puede ver sus propios pedidos.
   */
  findById(orderId: string, userId: string): Promise<Order | null>;

  /**
   * Lista pedidos de un usuario con filtro por estado y paginación.
   * - 'active': PAYMENT_PENDING, PAID, PREPARING, SHIPPED, DELIVERING
   * - 'completed': DELIVERED, CANCELLED
   * - 'all': Todos los estados
   */
  findByUserId(
    userId: string,
    filter: 'active' | 'completed' | 'all',
    page: number,
    limit: number
  ): Promise<PaginatedResponseDTO<OrderSummaryDTO>>;

  /**
   * Obtiene el detalle completo de un pedido (orden + ítems + códigos de recompensa).
   * Filtrado por usuario para seguridad.
   */
  findDetailById(orderId: string, userId: string): Promise<OrderDetailDTO | null>;

  /**
   * Actualiza el estatus de un pedido y campos opcionales (driver, tracking).
   * La implementación debe actualizar también el campo `updated_at`.
   */
  updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    extraData?: Partial<Pick<Order,
      'driverName' | 'driverVehicle' | 'driverPhone' |
      'trackingCompany' | 'trackingNumber' | 'stripePaymentIntentId'
    >>,
    context?: AdminAuditContext
  ): Promise<Order>;

  /**
   * Busca un pedido por su idempotency key.
   * Usado para implementar respuestas idempotentes (Q2).
   */
  findByIdempotencyKey(key: string): Promise<Order | null>;

  /**
   * Busca un pedido por el ID del PaymentIntent de la pasarela de pago.
   * Usado por el Webhook de reconciliación (REQ-BE-02), que no tiene
   * contexto de `userId` (la petición viene de Stripe, no del cliente).
   */
  findByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null>;

  /**
   * Obtiene el detalle completo de un pedido SIN filtrar por usuario.
   * Uso exclusivo de procesos internos/sistema (Webhook de pagos, Game Bridge M2M)
   * donde no existe un usuario autenticado en la petición.
   */
  findDetailByOrderId(orderId: string): Promise<OrderDetailDTO | null>;

  /**
   * Busca un ítem de pedido por su ID, sin filtrar por usuario.
   * Uso exclusivo del Game Bridge M2M (REQ-BE-05) para resolver
   * `productName`/`variantSku` al validar un código de recompensa.
   */
  findItemById(orderItemId: string): Promise<OrderItem | null>;

  // ==========================================
  // Métodos de administración CMS (Fase 24)
  // ==========================================

  /**
   * Busca un pedido por ID sin filtrar por usuario.
   * Uso exclusivo del CMS para obtener el estado actual antes de validar
   * una transición de estado (UpdateOrderStatusUseCase).
   */
  findOrderById(orderId: string): Promise<Order | null>;

  /**
   * Lista todos los pedidos del sistema con filtros opcionales y paginación.
   * Uso exclusivo del Kanban CMS — no filtra por userId.
   */
  findAllAdmin(filters: AdminOrderFilterDTO): Promise<PaginatedResponseDTO<AdminOrderSummaryDTO>>;
}
