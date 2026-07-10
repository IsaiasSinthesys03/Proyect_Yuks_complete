/**
 * Entidad de Dominio: OtpCode
 *
 * Código de un solo uso para confirmar el cambio de email o teléfono (REQ-FE-16).
 * Se almacena el hash Argon2id del código de 6 dígitos, nunca el valor en claro.
 * `newValue` guarda el email/teléfono pendiente hasta que el código se verifica.
 */
export type OtpPurpose = 'email_change' | 'phone_change';

export interface OtpCode {
  readonly id: string;
  readonly userId: string;
  readonly codeHash: string;
  readonly purpose: OtpPurpose;
  readonly newValue: string;
  readonly expiresAt: Date;
  readonly consumedAt: Date | null;
  readonly attempts: number;
  readonly createdAt: Date;
}
