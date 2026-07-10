import { IUserRepository } from '../../interfaces/IUserRepository';
import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { IRealtimeService, createRealtimeEvent } from '../../interfaces/IRealtimeService';
import { TierLevel } from '../../../domain/entities/Profile';
import { computeTier } from '../../../domain/services/gamification';

export interface AwardExperienceResult {
  pointsAwarded: number;
  totalXp: number;
  previousTier: TierLevel;
  newTier: TierLevel;
  leveledUp: boolean;
}

const TIER_RANK: Record<TierLevel, number> = { BRONZE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };

/**
 * Caso de Uso: Otorgar XP y recalcular Tier tras un pago confirmado (Fase 31).
 *
 * ▓ REGLA CRÍTICA ▓ Se invoca EXCLUSIVAMENTE después de que un pago quede
 * confirmado (webhook de Stripe → orden PAID). Nunca en el checkout ni en
 * PAYMENT_PENDING: solo el dinero efectivamente cobrado genera lealtad.
 *
 * Flujo:
 *   1. Lee la config de gamificación (ratio XP↔moneda + umbrales) de system_settings.
 *   2. XP = floor(montoPagado * xpPerCurrency).
 *   3. Incrementa la XP del perfil ATÓMICAMENTE.
 *   4. Recalcula el tier con los umbrales dinámicos.
 *   5. Si el tier subió, lo persiste y notifica al usuario en tiempo real.
 */
export class AwardExperienceUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly systemSettingsRepository: ISystemSettingsRepository,
    private readonly realtimeService: IRealtimeService,
  ) {}

  async execute(userId: string, amountPaid: number): Promise<AwardExperienceResult | null> {
    const config = await this.systemSettingsRepository.getGamificationConfig();
    const pointsAwarded = Math.floor(amountPaid * config.xpPerCurrency);

    if (pointsAwarded <= 0) {
      return null; // Pago cubierto 100% con monedero, por ejemplo: no genera XP.
    }

    // 3. Incremento atómico de XP. El perfil devuelto trae la XP nueva y el tier ANTERIOR.
    const updatedProfile = await this.userRepository.addExperiencePoints(userId, pointsAwarded);
    const previousTier = updatedProfile.tierLevel;

    // 4. Recalcular tier con umbrales dinámicos.
    const newTier = computeTier(updatedProfile.experiencePoints, {
      silver: config.silverThreshold,
      gold: config.goldThreshold,
      platinum: config.platinumThreshold,
    });

    const leveledUp = TIER_RANK[newTier] > TIER_RANK[previousTier];

    if (newTier !== previousTier) {
      await this.userRepository.updateTierLevel(userId, newTier);
    }

    // 5. Notificar al usuario en tiempo real (best-effort).
    this.realtimeService.notifyUser(
      userId,
      createRealtimeEvent('gamification:xp_awarded', {
        pointsAwarded,
        totalXp: updatedProfile.experiencePoints,
        tier: newTier,
        leveledUp,
      })
    );

    return {
      pointsAwarded,
      totalXp: updatedProfile.experiencePoints,
      previousTier,
      newTier,
      leveledUp,
    };
  }
}
