import { INotificationRepository } from '../../interfaces/INotificationRepository';
import { Notification } from '../../../domain/entities/Notification';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';

/** Casos de uso de la bandeja de notificaciones (Fase 32, REQ-FE-24). */

export class GetNotificationsUseCase {
  constructor(private readonly repo: INotificationRepository) {}
  execute(userId: string, page?: number, limit?: number): Promise<PaginatedResponseDTO<Notification>> {
    const p = Math.max(Math.floor(page ?? 1), 1);
    const l = Math.min(Math.max(Math.floor(limit ?? 20), 1), 100);
    return this.repo.findByUser(userId, p, l);
  }
}

export class GetUnreadCountUseCase {
  constructor(private readonly repo: INotificationRepository) {}
  execute(userId: string): Promise<number> {
    return this.repo.countUnread(userId);
  }
}

export class MarkNotificationReadUseCase {
  constructor(private readonly repo: INotificationRepository) {}
  execute(userId: string, notificationId: string): Promise<boolean> {
    return this.repo.markRead(userId, notificationId);
  }
}

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly repo: INotificationRepository) {}
  execute(userId: string): Promise<number> {
    return this.repo.markAllRead(userId);
  }
}
