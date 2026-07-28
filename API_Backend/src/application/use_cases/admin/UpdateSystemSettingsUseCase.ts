import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { SystemSettingsValues, UpdateSystemSettingsDTO } from '../../../domain/types/SystemSettingsDTOs';
import { IAuditLogRepository } from '../../interfaces/IAuditLogRepository';
import { AdminAuditContext } from '../../../domain/types/AdminTypes';
import { validateShippingCoverageSettings } from '../../../domain/services/ShippingCoveragePolicy';

/**
 * Caso de Uso: Actualizar la Configuración Global del Sistema (CMS-FE-11).
 *
 * Cierra la deuda técnica de la Fase 16/19: `ProcessCheckoutUseCase` ya
 * acepta `CheckoutSystemConfig` por constructor (con un default hardcodeado
 * como fallback) — desde la Fase 21, el Composition Root lo alimenta con
 * estos valores leídos de BD al arrancar, en vez del default estático.
 */
export class UpdateSystemSettingsUseCase {
  constructor(
    private readonly systemSettingsRepository: ISystemSettingsRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(dto: UpdateSystemSettingsDTO, context: AdminAuditContext): Promise<SystemSettingsValues> {
    validateShippingCoverageSettings(dto);
    const previous = await this.systemSettingsRepository.getAll();
    const updated = await this.systemSettingsRepository.updateMany(dto);
    await this.auditLogRepository.write({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'UPDATE',
      entityType: 'system_settings',
      entityId: context.adminId,
      oldValue: { ...previous },
      newValue: { ...updated },
      ipAddress: context.ip,
    });
    return updated;
  }
}
