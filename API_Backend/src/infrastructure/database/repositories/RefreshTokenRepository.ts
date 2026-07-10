import { db } from '../client';
import { IRefreshTokenRepository } from '../../../application/interfaces/IRefreshTokenRepository';
import { RefreshTokenRecord } from '../../../domain/entities/RefreshTokenRecord';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: {
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord> {
    const row = await db
      .insertInto('refresh_tokens')
      .values({
        user_id: data.userId,
        family_id: data.familyId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(row);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const row = await db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await db
      .updateTable('refresh_tokens')
      .set({ used_at: new Date() })
      .where('id', '=', id)
      .execute();
  }

  async revokeFamily(familyId: string): Promise<void> {
    await db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('family_id', '=', familyId)
      .execute();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('user_id', '=', userId)
      .execute();
  }

  private mapRow(row: {
    id: string;
    user_id: string;
    family_id: string;
    token_hash: string;
    expires_at: Date;
    used_at: Date | null;
    revoked: boolean;
    created_at: Date;
  }): RefreshTokenRecord {
    return {
      id: row.id,
      userId: row.user_id,
      familyId: row.family_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      revoked: row.revoked,
      createdAt: row.created_at,
    };
  }
}
