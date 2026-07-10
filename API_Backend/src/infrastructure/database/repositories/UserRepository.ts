import { db } from '../client';
import { IUserRepository } from '../../../application/interfaces/IUserRepository';
import { User, UserRole } from '../../../domain/entities/User';
import { Profile, TierLevel } from '../../../domain/entities/Profile';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';

/**
 * Implementación concreta de IUserRepository usando Kysely.
 *
 * Este adaptador vive en la capa de Infraestructura y es el ÚNICO lugar
 * donde se tocan tipos de SQL (snake_case) y Kysely.
 * Traduce entre el formato de la BD (snake_case) y las Entidades de Dominio (camelCase).
 */
export class UserRepository implements IUserRepository {

  async findByEmail(email: string): Promise<User | null> {
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase().trim())
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async createWithProfile(
    userData: { email: string; passwordHash: string; role: string; privacyAccepted: boolean },
    profileData: { firstName: string; lastName: string; phone: string }
  ): Promise<User> {
    // Transacción atómica: si falla la creación del perfil,
    // el usuario tampoco se persiste (rollback automático).
    return await db.transaction().execute(async (trx) => {
      // 1. Insertar usuario — Fase 33: se sella la aceptación de privacidad + timestamp.
      const userRow = await trx
        .insertInto('users')
        .values({
          email: userData.email,
          password_hash: userData.passwordHash,
          role: userData.role,
          privacy_accepted: userData.privacyAccepted,
          privacy_accepted_at: userData.privacyAccepted ? new Date() : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 2. Insertar perfil asociado al usuario recién creado (con teléfono, REQ-FE-08)
      await trx
        .insertInto('profiles')
        .values({
          user_id: userRow.id,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
        })
        .execute();

      return this.mapRowToUser(userRow);
    });
  }

  async findProfileByUserId(userId: string): Promise<Profile | null> {
    const row = await db
      .selectFrom('profiles')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToProfile(row);
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string }
  ): Promise<Profile> {
    const row = await db
      .updateTable('profiles')
      .set({
        ...(data.firstName !== undefined ? { first_name: data.firstName } : {}),
        ...(data.lastName !== undefined ? { last_name: data.lastName } : {}),
        updated_at: new Date(),
      })
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToProfile(row);
  }

  async createAdmin(
    userData: { email: string; passwordHash: string },
    profileData: { firstName: string; lastName: string }
  ): Promise<User> {
    // El rol se fija aquí, NUNCA se recibe como parámetro — ver IUserRepository.
    return await db.transaction().execute(async (trx) => {
      const userRow = await trx
        .insertInto('users')
        .values({
          email: userData.email,
          password_hash: userData.passwordHash,
          role: 'ADMIN',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('profiles')
        .values({
          user_id: userRow.id,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
        })
        .execute();

      return this.mapRowToUser(userRow);
    });
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedResponseDTO<User>> {
    const offset = (page - 1) * limit;

    const countResult = await db
      .selectFrom('users')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
    const total = Number(countResult.total);

    const rows = await db
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      data: rows.map((row) => this.mapRowToUser(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async banUser(userId: string): Promise<User> {
    const row = await db
      .updateTable('users')
      .set({ is_banned: true })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToUser(row);
  }

  async unbanUser(userId: string): Promise<User> {
    const row = await db
      .updateTable('users')
      .set({ is_banned: false })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToUser(row);
  }

  // ─────────────────────────────────────────────────────────────
  // Fase 29 — Auth Avanzada
  // ─────────────────────────────────────────────────────────────

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .updateTable('users')
      .set({ password_hash: passwordHash })
      .where('id', '=', userId)
      .execute();
  }

  async updateEmail(userId: string, email: string): Promise<void> {
    await db
      .updateTable('users')
      .set({ email: email.toLowerCase().trim() })
      .where('id', '=', userId)
      .execute();
  }

  async updateProfilePhone(userId: string, phone: string): Promise<void> {
    await db
      .updateTable('profiles')
      .set({ phone, updated_at: new Date() })
      .where('user_id', '=', userId)
      .execute();
  }

  async setTotpSecret(userId: string, secret: string): Promise<void> {
    await db
      .updateTable('users')
      .set({ totp_secret: secret, totp_enabled: false })
      .where('id', '=', userId)
      .execute();
  }

  async setTotpEnabled(userId: string, enabled: boolean): Promise<void> {
    await db
      .updateTable('users')
      .set({ totp_enabled: enabled })
      .where('id', '=', userId)
      .execute();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('google_id', '=', googleId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async linkGoogleId(userId: string, googleId: string): Promise<void> {
    await db
      .updateTable('users')
      .set({ google_id: googleId })
      .where('id', '=', userId)
      .execute();
  }

  async createOAuthUser(
    userData: { email: string; passwordHash: string; googleId: string },
    profileData: { firstName: string; lastName: string }
  ): Promise<User> {
    return await db.transaction().execute(async (trx) => {
      const userRow = await trx
        .insertInto('users')
        .values({
          email: userData.email.toLowerCase().trim(),
          password_hash: userData.passwordHash,
          role: 'CLIENT',
          google_id: userData.googleId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('profiles')
        .values({
          user_id: userRow.id,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
        })
        .execute();

      return this.mapRowToUser(userRow);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Fase 31 — Gamificación (Tiers de XP)
  // ─────────────────────────────────────────────────────────────

  async addExperiencePoints(userId: string, points: number): Promise<Profile> {
    // Incremento atómico (delta) — dos pagos concurrentes del mismo usuario
    // nunca pierden XP por una lectura/escritura intercalada.
    const row = await db
      .updateTable('profiles')
      .set((eb) => ({ experience_points: eb('experience_points', '+', points), updated_at: new Date() }))
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToProfile(row);
  }

  async updateTierLevel(userId: string, tier: string): Promise<Profile> {
    const row = await db
      .updateTable('profiles')
      .set({ tier_level: tier, updated_at: new Date() })
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToProfile(row);
  }

  // --- Mappers privados: traducen snake_case (SQL) → camelCase (Dominio) ---

  private mapRowToUser(row: {
    id: string;
    email: string;
    password_hash: string;
    role: string;
    is_banned: boolean;
    totp_secret: string | null;
    totp_enabled: boolean;
    google_id: string | null;
    created_at: Date;
  }): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      isBanned: row.is_banned,
      totpSecret: row.totp_secret,
      totpEnabled: row.totp_enabled,
      googleId: row.google_id,
      createdAt: row.created_at,
    };
  }

  private mapRowToProfile(row: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    tier_level: string;
    experience_points: number;
    updated_at: Date;
  }): Profile {
    return {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      tierLevel: row.tier_level as TierLevel,
      experiencePoints: row.experience_points,
      updatedAt: row.updated_at,
    };
  }
}
