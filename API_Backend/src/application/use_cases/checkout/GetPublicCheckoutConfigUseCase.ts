import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';

/**
 * DTO público de configuración de checkout (Fase 42, REQ-FE-13).
 * Expone SOLO lo necesario para que el carrito calcule la barra de
 * "Te faltan $X para envío gratis" con el multiplicador del Tier del usuario.
 */
export interface PublicCheckoutConfigDTO {
  freeShippingThreshold: number;
  localShippingCost: number;
  externalShippingCost: number;
  minPurchaseAmount: number;
  /** Multiplicadores del umbral por tier (BRONZE implícito = 1.0). */
  tierMultipliers: Record<string, number>;
}

/**
 * Caso de Uso: Configuración pública del checkout.
 *
 * El frontend NO debe hardcodear el umbral de envío gratis ni los costos:
 * son configuración dinámica del CMS (`system_settings`, editable en caliente).
 * Este caso de uso arma la vista PÚBLICA de esa config (sin datos sensibles).
 * El cálculo autoritativo del envío sigue viviendo en ProcessCheckoutUseCase;
 * esto es solo para la UI (barra de progreso / estimación en el carrito).
 */
export class GetPublicCheckoutConfigUseCase {
  constructor(private readonly systemSettingsRepository: ISystemSettingsRepository) {}

  async execute(): Promise<PublicCheckoutConfigDTO> {
    const config = await this.systemSettingsRepository.getCheckoutConfig();

    const [silver, gold, platinum] = await Promise.all([
      this.systemSettingsRepository.getTierShippingMultiplier('SILVER'),
      this.systemSettingsRepository.getTierShippingMultiplier('GOLD'),
      this.systemSettingsRepository.getTierShippingMultiplier('PLATINUM'),
    ]);

    return {
      freeShippingThreshold: config.freeShippingThreshold,
      localShippingCost: config.localShippingCost,
      externalShippingCost: config.externalShippingCost,
      minPurchaseAmount: config.minPurchaseAmount,
      tierMultipliers: { BRONZE: 1.0, SILVER: silver, GOLD: gold, PLATINUM: platinum },
    };
  }
}
