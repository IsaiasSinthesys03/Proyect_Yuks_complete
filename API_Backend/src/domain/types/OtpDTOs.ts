import { OtpPurpose } from '../entities/OtpCode';

/**
 * DTOs del flujo de OTP para cambio de email/teléfono (REQ-FE-16, Fase 29).
 */

/** Paso 1: el usuario autenticado solicita cambiar su email o teléfono. */
export interface RequestOtpDTO {
  purpose: OtpPurpose;
  /** Nuevo email o teléfono al que se quiere cambiar. */
  newValue: string;
}

/** Paso 2: el usuario confirma el cambio con el código recibido. */
export interface VerifyOtpDTO {
  purpose: OtpPurpose;
  code: string;
}
