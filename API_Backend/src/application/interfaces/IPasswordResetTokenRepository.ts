import { PasswordResetToken } from '../../domain/entities/PasswordResetToken';

/**
 * Puerto del repositorio de tokens de recuperación de contraseña (Fase 29).
 * Solo maneja HASHES (SHA-256); el token crudo nunca toca la BD.
 */
export interface IPasswordResetTokenRepository {
  /** Persiste un nuevo token de reseteo (hash). */
  create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetToken>;

  /** Busca un token por su hash. `null` si no existe. */
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  /** Marca un token como consumido (un solo uso). */
  markUsed(id: string): Promise<void>;

  /**
   * Invalida todos los tokens vigentes de un usuario. Se llama al emitir uno
   * nuevo (para que solo el último enlace enviado sea válido) y tras un reseteo.
   */
  invalidateAllForUser(userId: string): Promise<void>;
}
