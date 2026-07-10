import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { ITotpService } from '../../interfaces/ITotpService';
import { AdminAuthResponseDTO } from '../../../domain/types/AdminAuthDTOs';
import { Verify2faDTO } from '../../../domain/types/TwoFactorDTOs';
import { UserBannedError } from '../../../domain/errors/AuthErrors';
import { InsufficientPermissionsError } from '../../../domain/errors/AdminErrors';
import {
  InvalidTempTokenError,
  InvalidTwoFactorCodeError,
  TwoFactorNotEnabledError,
} from '../../../domain/errors/AdvancedAuthErrors';
import { ADMIN_2FA_SCOPE } from './AdminLoginUseCase';

interface TempTokenPayload {
  sub: string;
  scope: string;
}

/**
 * Caso de Uso: Verificar el Segundo Factor y Emitir la Sesión Admin (Fase 29).
 *
 * Recibe el `tempToken` emitido por AdminLoginUseCase (scope `admin_2fa`) y el
 * código TOTP de 6 dígitos. Si ambos son válidos, emite el JWT real de 8h.
 *
 * Defensa en profundidad: se revalida rol ADMIN, estado no baneado y que el 2FA
 * siga activo — el tempToken por sí solo no basta.
 */
export class VerifyAdmin2faUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly totpService: ITotpService,
    private readonly adminJwtSecret: string,
    private readonly adminJwtExpiresIn: string,
  ) {}

  async execute(dto: Verify2faDTO): Promise<AdminAuthResponseDTO> {
    let payload: TempTokenPayload;
    try {
      payload = jwt.verify(dto.tempToken, this.adminJwtSecret) as TempTokenPayload;
    } catch {
      throw new InvalidTempTokenError();
    }

    // El tempToken debe tener EXACTAMENTE el scope de 2FA — un access token
    // normal (u otro) no puede reutilizarse aquí.
    if (payload.scope !== ADMIN_2FA_SCOPE) {
      throw new InvalidTempTokenError();
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new InvalidTempTokenError();
    }
    if (user.role !== 'ADMIN') {
      throw new InsufficientPermissionsError();
    }
    if (user.isBanned) {
      throw new UserBannedError(user.email);
    }
    if (!user.totpEnabled || !user.totpSecret) {
      throw new TwoFactorNotEnabledError();
    }

    const isCodeValid = this.totpService.verify(user.totpSecret, dto.code);
    if (!isCodeValid) {
      throw new InvalidTwoFactorCodeError();
    }

    const profile = await this.userRepository.findProfileByUserId(user.id);

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      this.adminJwtSecret,
      { expiresIn: this.adminJwtExpiresIn as any }
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
      },
    };
  }
}
