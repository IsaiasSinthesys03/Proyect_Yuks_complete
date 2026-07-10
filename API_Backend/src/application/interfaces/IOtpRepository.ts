import { OtpCode, OtpPurpose } from '../../domain/entities/OtpCode';

/**
 * Puerto del repositorio de códigos OTP (cambio email/teléfono, REQ-FE-16).
 * Solo almacena el HASH (Argon2id) del código de 6 dígitos.
 */
export interface IOtpRepository {
  create(data: {
    userId: string;
    codeHash: string;
    purpose: OtpPurpose;
    newValue: string;
    expiresAt: Date;
  }): Promise<OtpCode>;

  /**
   * Devuelve el OTP vigente más reciente (no consumido) de un usuario para un
   * propósito dado. `null` si no hay ninguno pendiente.
   */
  findLatestPending(userId: string, purpose: OtpPurpose): Promise<OtpCode | null>;

  /** Incrementa el contador de intentos fallidos de un OTP. */
  incrementAttempts(id: string): Promise<void>;

  /** Marca un OTP como consumido (verificación exitosa). */
  markConsumed(id: string): Promise<void>;

  /** Invalida todos los OTP pendientes de un usuario+propósito (al emitir uno nuevo). */
  invalidatePending(userId: string, purpose: OtpPurpose): Promise<void>;
}
