/**
 * Entidad de Dominio: RefreshTokenRecord
 *
 * Representa un refresh token persistido (Refresh Token Rotation, Fase 29).
 * El token CRUDO nunca vive aquí — solo su hash SHA-256. Esta entidad es la
 * fuente de verdad para decidir si una sesión sigue viva, fue rotada, o debe
 * invalidarse en cascada por detección de reúso.
 *
 * `familyId` agrupa todos los tokens rotados de una misma sesión de login.
 * Si un token ya consumido (`usedAt != null`) se vuelve a presentar, se asume
 * robo y se revoca TODA la familia.
 */
export interface RefreshTokenRecord {
  readonly id: string;
  readonly userId: string;
  readonly familyId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly revoked: boolean;
  readonly createdAt: Date;
}
