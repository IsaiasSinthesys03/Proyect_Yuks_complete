import { IUserRepository } from '../../interfaces/IUserRepository';
import { ITotpService } from '../../interfaces/ITotpService';
import { Setup2faResponseDTO } from '../../../domain/types/TwoFactorDTOs';
import { InsufficientPermissionsError } from '../../../domain/errors/AdminErrors';
import { TwoFactorAlreadyEnabledError } from '../../../domain/errors/AdvancedAuthErrors';

/**
 * Caso de Uso: Iniciar la Configuración de 2FA (Fase 29).
 *
 * Genera y persiste un secreto TOTP (dejando `totp_enabled = false`) y devuelve
 * la URI `otpauth://` para que el admin la escanee. El 2FA NO queda activo hasta
 * que confirme un primer código válido vía Enable2faUseCase.
 *
 * Solo un ADMIN autenticado (JWT de 8h) puede iniciar esto. Si ya lo tiene
 * activo, se rechaza para no romper su configuración vigente sin querer.
 */
export class Setup2faUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly totpService: ITotpService,
    private readonly issuer: string = 'Animayuks CMS',
  ) {}

  async execute(userId: string): Promise<Setup2faResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.role !== 'ADMIN') {
      throw new InsufficientPermissionsError();
    }
    if (user.totpEnabled) {
      throw new TwoFactorAlreadyEnabledError();
    }

    const secret = this.totpService.generateSecret();
    await this.userRepository.setTotpSecret(user.id, secret);

    const otpauthUri = this.totpService.buildOtpAuthUri(secret, user.email, this.issuer);

    return { secret, otpauthUri };
  }
}
