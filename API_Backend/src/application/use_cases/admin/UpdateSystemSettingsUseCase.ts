import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { SystemSettingsValues, UpdateSystemSettingsDTO } from '../../../domain/types/SystemSettingsDTOs';

/**
 * Caso de Uso: Actualizar la Configuración Global del Sistema (CMS-FE-11).
 *
 * Cierra la deuda técnica de la Fase 16/19: `ProcessCheckoutUseCase` ya
 * acepta `CheckoutSystemConfig` por constructor (con un default hardcodeado
 * como fallback) — desde la Fase 21, el Composition Root lo alimenta con
 * estos valores leídos de BD al arrancar, en vez del default estático.
 */
export class UpdateSystemSettingsUseCase {
  constructor(private readonly systemSettingsRepository: ISystemSettingsRepository) {}

  async execute(dto: UpdateSystemSettingsDTO): Promise<SystemSettingsValues> {
    return this.systemSettingsRepository.updateMany(dto);
  }
}
