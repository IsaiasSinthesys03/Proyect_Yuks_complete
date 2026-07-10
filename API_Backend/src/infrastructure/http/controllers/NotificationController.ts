import { FastifyRequest, FastifyReply } from 'fastify';
import {
  GetNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
} from '../../../application/use_cases/notifications/NotificationUseCases';

/** Controlador de la bandeja de notificaciones (Fase 32, REQ-FE-24). Requiere JWT. */
export class NotificationController {
  constructor(
    private readonly getNotifications: GetNotificationsUseCase,
    private readonly getUnreadCount: GetUnreadCountUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
  ) {}

  /** GET /api/profile/notifications?page=&limit= */
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.sub;
    const q = request.query as { page?: string; limit?: string };
    const page = q.page ? parseInt(q.page, 10) : undefined;
    const limit = q.limit ? parseInt(q.limit, 10) : undefined;
    const result = await this.getNotifications.execute(userId, page, limit);
    reply.status(200).send({ success: true, data: result });
  }

  /** GET /api/profile/notifications/unread-count */
  async unreadCount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.sub;
    const count = await this.getUnreadCount.execute(userId);
    reply.status(200).send({ success: true, data: { unread: count } });
  }

  /** PATCH /api/profile/notifications/:id/read */
  async read(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.sub;
    const { id } = request.params as { id: string };
    const ok = await this.markRead.execute(userId, id);
    if (!ok) {
      return void reply.status(404).send({ success: false, error: 'Notificación no encontrada.' });
    }
    reply.status(200).send({ success: true, message: 'Notificación marcada como leída.' });
  }

  /** PATCH /api/profile/notifications/read-all */
  async readAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.sub;
    const count = await this.markAllRead.execute(userId);
    reply.status(200).send({ success: true, data: { marked: count } });
  }
}
