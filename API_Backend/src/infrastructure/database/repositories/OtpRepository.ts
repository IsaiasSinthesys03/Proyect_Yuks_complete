import { db } from '../client';
import { IOtpRepository } from '../../../application/interfaces/IOtpRepository';
import { OtpCode, OtpPurpose } from '../../../domain/entities/OtpCode';

export class OtpRepository implements IOtpRepository {
  async create(data: {
    userId: string;
    codeHash: string;
    purpose: OtpPurpose;
    newValue: string;
    expiresAt: Date;
  }): Promise<OtpCode> {
    const row = await db
      .insertInto('otp_codes')
      .values({
        user_id: data.userId,
        code_hash: data.codeHash,
        purpose: data.purpose,
        new_value: data.newValue,
        expires_at: data.expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(row);
  }

  async findLatestPending(userId: string, purpose: OtpPurpose): Promise<OtpCode | null> {
    const row = await db
      .selectFrom('otp_codes')
      .selectAll()
      .where('user_id', '=', userId)
      .where('purpose', '=', purpose)
      .where('consumed_at', 'is', null)
      .orderBy('created_at', 'desc')
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async incrementAttempts(id: string): Promise<void> {
    await db
      .updateTable('otp_codes')
      .set((eb) => ({ attempts: eb('attempts', '+', 1) }))
      .where('id', '=', id)
      .execute();
  }

  async markConsumed(id: string): Promise<void> {
    await db
      .updateTable('otp_codes')
      .set({ consumed_at: new Date() })
      .where('id', '=', id)
      .execute();
  }

  async invalidatePending(userId: string, purpose: OtpPurpose): Promise<void> {
    await db
      .updateTable('otp_codes')
      .set({ consumed_at: new Date() })
      .where('user_id', '=', userId)
      .where('purpose', '=', purpose)
      .where('consumed_at', 'is', null)
      .execute();
  }

  private mapRow(row: {
    id: string;
    user_id: string;
    code_hash: string;
    purpose: string;
    new_value: string;
    expires_at: Date;
    consumed_at: Date | null;
    attempts: number;
    created_at: Date;
  }): OtpCode {
    return {
      id: row.id,
      userId: row.user_id,
      codeHash: row.code_hash,
      purpose: row.purpose as OtpPurpose,
      newValue: row.new_value,
      expiresAt: row.expires_at,
      consumedAt: row.consumed_at,
      attempts: row.attempts,
      createdAt: row.created_at,
    };
  }
}
