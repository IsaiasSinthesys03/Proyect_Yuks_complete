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
