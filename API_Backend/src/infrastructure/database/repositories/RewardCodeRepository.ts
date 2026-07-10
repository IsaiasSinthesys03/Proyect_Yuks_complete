import { db } from '../client';
import { IRewardCodeRepository } from '../../../application/interfaces/IRewardCodeRepository';
import { RewardCode, RewardCodeStatus } from '../../../domain/entities/RewardCode';

/**
 * Implementación concreta de IRewardCodeRepository usando Kysely.
 *
 * Resolución #7: Generación Unitaria (1 a 1) — por cada unidad de un
 * item con `hasVirtualReward = true`, se inserta un código UUID individual.
 */
export class RewardCodeRepository implements IRewardCodeRepository {
  async createBatch(
    orderId: string,
    orderItems: Array<{ orderItemId: string; hasVirtualReward: boolean; quantity: number }>
  ): Promise<RewardCode[]> {
    const rowsToInsert = orderItems
      .filter((item) => item.hasVirtualReward)
      .flatMap((item) =>
        Array.from({ length: item.quantity }, () => ({
          order_id: orderId,
          order_item_id: item.orderItemId,
        }))
      );

    if (rowsToInsert.length === 0) return [];

    const rows = await db
      .insertInto('reward_codes')
      .values(rowsToInsert)
      .returningAll()
      .execute();

    return rows.map((row) => this.mapRowToRewardCode(row));
  }

  async findByOrderId(orderId: string): Promise<RewardCode[]> {
    const rows = await db
      .selectFrom('reward_codes')
      .selectAll()
      .where('order_id', '=', orderId)
      .execute();

    return rows.map((row) => this.mapRowToRewardCode(row));
  }

  async findByUserId(userId: string): Promise<RewardCode[]> {
    const rows = await db
      .selectFrom('reward_codes')
      .innerJoin('orders', 'orders.id', 'reward_codes.order_id')
      .select([
        'reward_codes.id',
        'reward_codes.order_id',
        'reward_codes.order_item_id',
        'reward_codes.code',
        'reward_codes.status',
        'reward_codes.claimed_at',
        'reward_codes.revoked_at',
        'reward_codes.created_at',
      ])
      .where('orders.user_id', '=', userId)
      .execute();

    return rows.map((row) => this.mapRowToRewardCode(row));
  }

  async findByCode(code: string): Promise<RewardCode | null> {
    const row = await db
      .selectFrom('reward_codes')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToRewardCode(row);
  }

  async markAsClaimed(codeId: string): Promise<void> {
    await db
      .updateTable('reward_codes')
      .set({ status: 'CLAIMED', claimed_at: new Date() })
      .where('id', '=', codeId)
      .execute();
  }

  async markAsRevoked(codeId: string): Promise<void> {
    await db
      .updateTable('reward_codes')
      .set({ status: 'REVOKED', revoked_at: new Date() })
      .where('id', '=', codeId)
      .execute();
  }

  private mapRowToRewardCode(row: {
    id: string;
    order_id: string;
    order_item_id: string;
    code: string;
    status: string;
    claimed_at: Date | null;
    revoked_at: Date | null;
    created_at: Date;
  }): RewardCode {
    return {
      id: row.id,
      orderId: row.order_id,
      orderItemId: row.order_item_id,
      code: row.code,
      status: row.status as RewardCodeStatus,
      claimedAt: row.claimed_at,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    };
  }
}
