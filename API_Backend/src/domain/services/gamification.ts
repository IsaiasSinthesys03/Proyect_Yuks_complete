import { TierLevel } from '../entities/Profile';

/**
 * Umbrales de XP para cada tier de lealtad. Provienen de `system_settings`,
 * por lo que son configurables desde el CMS (REQ-FE-14).
 */
export interface TierThresholds {
  silver: number;
  gold: number;
  platinum: number;
}

/**
 * Lógica de dominio PURA: dado un total de XP y los umbrales, determina el tier.
 *
 * Se evalúa de mayor a menor para que el usuario siempre obtenga el tier más
 * alto que su XP permita. Es idempotente y sin efectos secundarios.
 */
export function computeTier(experiencePoints: number, thresholds: TierThresholds): TierLevel {
  if (experiencePoints >= thresholds.platinum) return 'PLATINUM';
  if (experiencePoints >= thresholds.gold) return 'GOLD';
  if (experiencePoints >= thresholds.silver) return 'SILVER';
  return 'BRONZE';
}
