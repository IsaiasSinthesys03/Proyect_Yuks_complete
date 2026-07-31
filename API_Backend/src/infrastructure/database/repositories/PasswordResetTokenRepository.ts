import { db } from '../client';
import { IPasswordResetTokenRepository } from '../../../application/interfaces/IPasswordResetTokenRepository';
import { PasswordResetToken } from '../../../domain/entities/PasswordResetToken';

export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetToken> {
    const row = await db
      .insertInto('password_reset_tokens')
      .values({
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(row);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await db
      .selectFrom('password_reset_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await db
      .updateTable('password_reset_tokens')
      .set({ used_at: new Date() })
      .where('id', '=', id)
      .execute();
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    // Marca como usados todos los tokens aún vigentes: solo el enlace más
    // reciente quedará operativo tras emitir uno nuevo.
    await db
      .updateTable('password_reset_tokens')
      .set({ used_at: new Date() })
      .where('user_id', '=', userId)
      .where('used_at', 'is', null)
      .execute();
  }

  async consumeAndResetPassword(data: {
    tokenHash: string;
    passwordHash: string;
    now: Date;
  }): Promise<'SUCCESS' | 'INVALID' | 'EXPIRED'> {
    return db.transaction().execute(async (trx) => {
      const token = await trx
        .selectFrom('password_reset_tokens')
        .select(['id', 'user_id', 'expires_at', 'used_at'])
        .where('token_hash', '=', data.tokenHash)
        .forUpdate()
        .executeTakeFirst();

      if (!token || token.used_at !== null) return 'INVALID';
      if (token.expires_at.getTime() < data.now.getTime()) return 'EXPIRED';

      const consumed = await trx
        .updateTable('password_reset_tokens')
        .set({ used_at: data.now })
        .where('id', '=', token.id)
        .where('used_at', 'is', null)
        .executeTakeFirst();

      if (consumed.numUpdatedRows !== 1n) return 'INVALID';

      await trx
        .updateTable('users')
        .set({ password_hash: data.passwordHash })
        .where('id', '=', token.user_id)
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('refresh_tokens')
        .set({ revoked: true })
        .where('user_id', '=', token.user_id)
        .where('revoked', '=', false)
        .execute();

      return 'SUCCESS';
    });
  }

  private mapRow(row: {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    used_at: Date | null;
    created_at: Date;
  }): PasswordResetToken {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  }
}
