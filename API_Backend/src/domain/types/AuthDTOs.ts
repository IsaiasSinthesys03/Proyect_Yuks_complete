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
  termsAccepted: boolean;
}

/** Datos requeridos para iniciar sesión. */
export interface LoginDTO {
  email: string;
  password: string;
}

/** Datos devueltos al cliente tras una autenticación exitosa. */
export interface AuthResponseDTO {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    tierLevel: string;
  };
}

/** Datos requeridos para registrar un administrador (Easter Egg del CMS). */
export interface RegisterAdminDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  developerCode: string;
}
