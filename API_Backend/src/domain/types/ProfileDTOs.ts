import { WalletSummaryDTO } from './WalletDTOs';

/**
 * Data Transfer Objects para el módulo de Perfil Autenticado (REQ-FE-14, REQ-FE-15).
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases de perfil. No contienen lógica de negocio.
 */

/**
 * Respuesta completa del perfil del usuario autenticado.
 *
 * Combina información del usuario, perfil de gamificación y monedero
 * en una sola respuesta para el Quick Drawer del frontend (REQ-FE-14).
 */
export interface ProfileResponseDTO {
  user: {
    id: string;
    email: string;
    role: string;
  };
  profile: {
    firstName: string;
    lastName: string;
    phone: string | null;
    tierLevel: string;
    experiencePoints: number;
  };
  wallet: WalletSummaryDTO;
  /**
   * Fase 43: umbrales de XP por tier (desde `system_settings`) para que el
   * frontend calcule la barra "Pase de Leyenda" dinámicamente (REQ-FE-14).
   */
  gamification: {
    silverThreshold: number;
    goldThreshold: number;
    platinumThreshold: number;
  };
}

/**
 * Payload de entrada para actualizar el perfil del usuario.
 *
 * REQ-FE-16: Si `email` o `phone` están presentes, el Use Case DEBE
 * rechazar la petición — esos campos requieren el flujo de verificación
 * OTP (One-Time Password) que se implementará en una fase posterior.
 * Solo `firstName`/`lastName` se aplican directamente.
 */
export interface UpdateProfileRequestDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
