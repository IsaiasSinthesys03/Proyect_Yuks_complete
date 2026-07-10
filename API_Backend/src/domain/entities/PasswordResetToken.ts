/**
 * Entidad de Dominio: PasswordResetToken
 *
 * Token de un solo uso para recuperación de contraseña (Fase 29).
 * Se almacena únicamente el hash SHA-256 del token; el valor crudo viaja
 * exclusivamente en el enlace enviado por correo al usuario.
 */
export interface PasswordResetToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly createdAt: Date;
}
