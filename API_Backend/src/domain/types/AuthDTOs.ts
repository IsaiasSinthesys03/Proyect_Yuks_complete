/**
 * Data Transfer Objects para el módulo de Autenticación.
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases. No contienen lógica de negocio.
 */

/** Datos requeridos para registrar un nuevo usuario. */
export interface RegisterUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Teléfono obligatorio (REQ-FE-08 lo lista como campo del registro). */
  phone: string;
  /** Aceptación del Aviso de Privacidad y T&C (REQ-FE-08 / REQ-BE-08). */
  termsAccepted: boolean;
}

/** Datos requeridos para iniciar sesión. */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Datos devueltos por el Use Case tras una autenticación exitosa.
 *
 * SEGURIDAD: `refreshToken` viaja en este DTO porque el Use Case no conoce
 * HTTP ni cookies — es responsabilidad EXCLUSIVA del Controller extraerlo
 * de aquí, inyectarlo como cookie HttpOnly, y NUNCA incluirlo en el body
 * de la respuesta JSON enviada al cliente.
 */
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    tierLevel: string;
  };
}

/** Respuesta del Use Case de renovación silenciosa de sesión (Q19). */
export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
}

// `RegisterAdminDTO` se movió a `domain/types/AdminAuthDTOs.ts` (Fase 21) —
// la autenticación administrativa tiene reglas propias (TTL de 8h, Easter Egg).
