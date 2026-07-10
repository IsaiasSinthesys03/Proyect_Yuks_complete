import { IOrderRepository } from '../../../interfaces/IOrderRepository';
import { IUserRepository } from '../../../interfaces/IUserRepository';
import { IQueueService } from '../../../interfaces/IQueueService';
import { INotificationRepository } from '../../../interfaces/INotificationRepository';
import { IRealtimeService, createRealtimeEvent } from '../../../interfaces/IRealtimeService';
import { Order, OrderStatus } from '../../../../domain/entities/Order';
import { UpdateOrderStatusDTO } from '../../../../domain/types/AdminOrderDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import {
  InvalidStatusTransitionError,
  OrderNotFoundAdminError,
} from '../../../../domain/errors/OrderTransitionErrors';

/**
 * Máquina de estados del Kanban de pedidos (CMS-FE-04).
 *
 * Solo las transiciones explícitamente listadas aquí son válidas.
 * Cualquier otra transición (retroceder, saltar, desde terminales)
 * lanza InvalidStatusTransitionError (HTTP 422).
 */
const VALID_TRANSITIONS: Readonly<Partial<Record<OrderStatus, OrderStatus[]>>> = {
  PAID:       ['PREPARING', 'CANCELLED'],
  PREPARING:  ['SHIPPED',   'CANCELLED'],
  SHIPPED:    ['DELIVERING'],
  DELIVERING: ['DELIVERED'],
} as const;

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly queueService: IQueueService,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly realtimeService: IRealtimeService,
  ) {}

  async execute(orderId: string, dto: UpdateOrderStatusDTO, context: AdminAuditContext): Promise<Order> {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new OrderNotFoundAdminError(orderId);

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!(allowed as string[]).includes(dto.status)) {
      throw new InvalidStatusTransitionError(orderId, order.status, dto.status);
    }

    const updatedOrder = await this.orderRepo.updateStatus(orderId, dto.status as OrderStatus, {
      driverName:      dto.driverName      ?? undefined,
      driverVehicle:   dto.driverVehicle   ?? undefined,
      driverPhone:     dto.driverPhone     ?? undefined,
      trackingCompany: dto.trackingCompany ?? undefined,
      trackingNumber:  dto.trackingNumber  ?? undefined,
    }, context);

    // ▓ NOTIFICACIÓN HÍBRIDA (C-01, REQ-BE-04) ▓
    // En CADA cambio de estatus se disparan EN PARALELO: (a) email transaccional
    // encolado en BullMQ, (b) evento WebSocket en tiempo real al usuario, y
    // (c) persistencia en la bandeja (para que sobreviva a desconexiones).
    // Todo es best-effort: un fallo aquí JAMÁS revierte el cambio de estatus ya
    // confirmado en la BD (la actualización del Kanban debe ser inquebrantable).
    void this.dispatchNotifications(updatedOrder).catch((err) => {
      console.error(`[UpdateOrderStatus] Falló el despacho de notificaciones de la orden ${orderId}:`, err);
    });

    return updatedOrder;
  }

  /**
   * Despacha las tres vías de notificación de un cambio de estatus. Cada una se
   * aísla para que el fallo de una no impida a las demás.
   */
  private async dispatchNotifications(order: Order): Promise<void> {
    const eventPayload = {
      orderId: order.id,
      newStatus: order.status,
      totalPaid: order.totalPaid,
    };

    // (c) Persistir la notificación (bandeja in-app). Se hace primero para que,
    // si el usuario está desconectado, la vea al reconectarse.
    let persistedId: string | undefined;
    try {
      const notification = await this.notificationRepository.create({
        userId: order.userId,
        type: 'order:status_changed',
        payload: eventPayload,
      });
      persistedId = notification.id;
    } catch (err) {
      console.error(`[UpdateOrderStatus] No se pudo persistir la notificación de la orden ${order.id}:`, err);
    }

    // (b) Emitir el evento WebSocket al usuario específico (tiempo real).
    try {
      this.realtimeService.notifyUser(
        order.userId,
        createRealtimeEvent('order:status_changed', { ...eventPayload, notificationId: persistedId })
      );
      // Kanban "Socket Live" (CMS-FE-04): avisar a los admins conectados.
      this.realtimeService.notifyAdmins(
        createRealtimeEvent('admin:order_updated', eventPayload)
      );
    } catch (err) {
      console.error(`[UpdateOrderStatus] No se pudo emitir el WebSocket de la orden ${order.id}:`, err);
    }

    // (a) Encolar el email transaccional (asíncrono, no bloquea el hilo HTTP).
    try {
      const user = await this.userRepository.findById(order.userId);
      if (user) {
        await this.queueService.enqueue('email:order_status', {
          to: user.email,
          orderId: order.id,
          newStatus: order.status,
          totalPaid: order.totalPaid,
        });
      }
    } catch (err) {
      console.error(`[UpdateOrderStatus] No se pudo encolar el email de la orden ${order.id}:`, err);
    }
  }
}
