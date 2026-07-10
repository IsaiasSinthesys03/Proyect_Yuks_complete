import { Notification } from '../../domain/entities/Notification';
import { PaginatedResponseDTO } from '../../domain/types/ProductDTOs';

/**
 * Puerto del repositorio de Notificaciones (Fase 32, REQ-FE-24).
 */
export interface INotificationRepository {
  /** Persiste una notificación para un usuario. */
  create(data: { userId: string; type: string; payload: Record<string, unknown> }): Promise<Notification>;

  /** Lista paginada de notificaciones del usuario, más recientes primero. */
  findByUser(userId: string, page: number, limit: number): Promise<PaginatedResponseDTO<Notification>>;

  /** Cuenta las notificaciones no leídas del usuario. */
  countUnread(userId: string): Promise<number>;

  /** Marca una notificación como leída (solo si pertenece al usuario). Devuelve true si afectó una fila. */
  markRead(userId: string, notificationId: string): Promise<boolean>;

  /** Marca TODAS las notificaciones del usuario como leídas. Devuelve cuántas se marcaron. */
  markAllRead(userId: string): Promise<number>;
}
