import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { SystemSettingsValues } from '../../../domain/types/SystemSettingsDTOs';

/** Caso de Uso: Obtener la Configuración Global del Sistema (CMS-FE-11). */
export class GetSystemSettingsUseCase {
  constructor(private readonly systemSettingsRepository: ISystemSettingsRepository) {}

  async execute(): Promise<SystemSettingsValues> {
    return this.systemSettingsRepository.getAll();
  }
}
