/**
 * Entidad de Dominio: Profile
 *
 * Datos personales del usuario, separados de la autenticación.
 * Incluye la información de gamificación (tier_level, experience_points)
 * dictada por el SRS v10.1.
 *
 * PURA — sin dependencias de infraestructura.
 */
export interface Profile {
  readonly id: string;
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string | null;
  readonly tierLevel: TierLevel;
  readonly experiencePoints: number;
  readonly updatedAt: Date;
}

/**
 * Niveles de lealtad del sistema de gamificación.
 * Dictados por el SRS v10.1 — Sección de Gamificación.
 */
export type TierLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
