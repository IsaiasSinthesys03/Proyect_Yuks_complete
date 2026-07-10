import { IUserRepository } from '../../interfaces/IUserRepository';
import { ITotpService } from '../../interfaces/ITotpService';
import { Enable2faDTO } from '../../../domain/types/TwoFactorDTOs';
import { InsufficientPermissionsError } from '../../../domain/errors/AdminErrors';
import {
  InvalidTwoFactorCodeError,
  TwoFactorAlreadyEnabledError,
  TwoFactorNotEnabledError,
} from '../../../domain/errors/AdvancedAuthErrors';

/**
 * Caso de Uso: Activar 2FA tras confirmar un código (Fase 29).
 *
 * El admin, ya con un secreto configurado (Setup2faUseCase), envía un código
 * TOTP para PROBAR que su app de autenticación está sincronizada. Solo entonces
 * se marca `totp_enabled = true`. Esto evita que un admin se bloquee a sí mismo
 * por haber escaneado mal el QR.
 */
export class Enable2faUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly totpService: ITotpService,
  ) {}

  async execute(userId: string, dto: Enable2faDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.role !== 'ADMIN') {
      throw new InsufficientPermissionsError();
    }
    if (user.totpEnabled) {
      throw new TwoFactorAlreadyEnabledError();
    }
    if (!user.totpSecret) {
      // No hay secreto configurado: debe llamar a /2fa/setup primero.
      throw new TwoFactorNotEnabledError();
    }

    const isValid = this.totpService.verify(user.totpSecret, dto.code);
    if (!isValid) {
      throw new InvalidTwoFactorCodeError();
    }

    await this.userRepository.setTotpEnabled(user.id, true);
  }
}
