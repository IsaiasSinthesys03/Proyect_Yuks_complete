import { db } from '../client';
import { IUserRepository } from '../../../application/interfaces/IUserRepository';
import { User, UserRole } from '../../../domain/entities/User';
import { Profile, TierLevel } from '../../../domain/entities/Profile';

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
    userData: { email: string; passwordHash: string; role: string },
    profileData: { firstName: string; lastName: string }
  ): Promise<User> {
    // Transacción atómica: si falla la creación del perfil,
    // el usuario tampoco se persiste (rollback automático).
    return await db.transaction().execute(async (trx) => {
      // 1. Insertar usuario
      const userRow = await trx
        .insertInto('users')
        .values({
          email: userData.email,
          password_hash: userData.passwordHash,
          role: userData.role,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 2. Insertar perfil asociado al usuario recién creado
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

  async findProfileByUserId(userId: string): Promise<Profile | null> {
    const row = await db
      .selectFrom('profiles')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToProfile(row);
  }

  // --- Mappers privados: traducen snake_case (SQL) → camelCase (Dominio) ---

  private mapRowToUser(row: {
    id: string;
    email: string;
    password_hash: string;
    role: string;
    is_banned: boolean;
    created_at: Date;
  }): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      isBanned: row.is_banned,
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
