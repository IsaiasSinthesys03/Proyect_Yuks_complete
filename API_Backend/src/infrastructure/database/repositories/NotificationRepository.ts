import { db } from '../client';
import { INotificationRepository } from '../../../application/interfaces/INotificationRepository';
import { Notification } from '../../../domain/entities/Notification';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';

export class NotificationRepository implements INotificationRepository {
  async create(data: { userId: string; type: string; payload: Record<string, unknown> }): Promise<Notification> {
    const row = await db
      .insertInto('notifications')
      .values({
        user_id: data.userId,
        type: data.type,
        payload: JSON.stringify(data.payload),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(row);
  }

  async findByUser(userId: string, page: number, limit: number): Promise<PaginatedResponseDTO<Notification>> {
    const offset = (page - 1) * limit;

    const countResult = await db
      .selectFrom('notifications')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .where('user_id', '=', userId)
      .executeTakeFirstOrThrow();
    const total = Number(countResult.total);

    const rows = await db
      .selectFrom('notifications')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      data: rows.map((r) => this.mapRow(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countUnread(userId: string): Promise<number> {
    const row = await db
      .selectFrom('notifications')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .where('user_id', '=', userId)
      .where('is_read', '=', false)
      .executeTakeFirstOrThrow();
    return Number(row.total);
  }

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await db
      .updateTable('notifications')
      .set({ is_read: true })
      .where('id', '=', notificationId)
      .where('user_id', '=', userId) // el usuario solo puede marcar las suyas
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await db
      .updateTable('notifications')
      .set({ is_read: true })
      .where('user_id', '=', userId)
      .where('is_read', '=', false)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  private mapRow(row: {
    id: string;
    user_id: string;
    type: string;
    payload: unknown;
    is_read: boolean;
    created_at: Date;
  }): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      // JSONB ya viene deserializado por pg/Kysely.
      payload: (row.payload ?? {}) as Record<string, unknown>,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }
}
