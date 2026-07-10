import { RefreshTokenRecord } from '../../domain/entities/RefreshTokenRecord';

/**
 * Puerto del repositorio de Refresh Tokens (Refresh Token Rotation, Fase 29).
 *
 * Habilita la ROTACIÓN ESTRICTA con detección de reúso:
 *   - Cada login abre una FAMILIA (`familyId`).
 *   - Cada refresh consume el token actual (`markUsed`) y crea uno nuevo en la
 *     misma familia.
 *   - Si un token ya consumido se vuelve a presentar → robo asumido →
 *     `revokeFamily` mata toda la cadena.
 *
 * Solo se almacenan HASHES (SHA-256) del token crudo.
 */
export interface IRefreshTokenRepository {
  /** Crea un token en una familia (nueva en login, existente en rotación). */
  create(data: {
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord>;

  /** Busca un token por su hash. `null` si no existe. */
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;

  /** Marca un token como consumido (rotado). */
  markUsed(id: string): Promise<void>;

  /** Revoca TODA una familia de tokens (logout o detección de reúso). */
  revokeFamily(familyId: string): Promise<void>;

  /**
   * Revoca TODAS las sesiones de un usuario (todas sus familias). Se usa tras un
   * reseteo de contraseña: cambiar la clave debe cerrar cualquier sesión abierta.
   */
  revokeAllForUser(userId: string): Promise<void>;
}
