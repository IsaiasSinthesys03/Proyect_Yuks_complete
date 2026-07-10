import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { AdminLoginDTO, AdminLoginResultDTO } from '../../../domain/types/AdminAuthDTOs';
import { InvalidCredentialsError, UserBannedError } from '../../../domain/errors/AuthErrors';
import { InsufficientPermissionsError } from '../../../domain/errors/AdminErrors';

/**
 * Caso de Uso: Iniciar Sesión como Administrador (CMS-BE-01) con 2FA INELUDIBLE (Fase 34).
 *
 * Reglas:
 *   - Rechaza con `InsufficientPermissionsError` si el usuario no es ADMIN.
 *   - Firma el Access Token con un TTL propio de 8h (CMS-BE-01).
 *
 * ▓▓▓ 2FA INELUDIBLE (REQ-SEC-09, C-03) ▓▓▓
 * NINGÚN admin obtiene una sesión utilizable sin pasar por el segundo factor:
 *   - Si tiene 2FA activo → `tempToken` (scope `admin_2fa`) para `/2fa/verify`.
 *   - Si AÚN NO tiene 2FA → `setupToken` (scope `admin_2fa_setup`) que SOLO sirve
 *     para `/2fa/setup` y `/2fa/enable`. Antes (Fase 29) se entregaba el JWT de 8h
 *     directamente — brecha C-03. Ahora se fuerza la configuración del 2FA.
 */
export const ADMIN_2FA_SCOPE = 'admin_2fa';
export const ADMIN_2FA_SETUP_SCOPE = 'admin_2fa_setup';

export class AdminLoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly adminJwtSecret: string,
    private readonly adminJwtExpiresIn: string,
    private readonly tempTokenExpiresIn: string = '2m',
    private readonly setupTokenExpiresIn: string = '10m',
  ) {}

  async execute(dto: AdminLoginDTO): Promise<AdminLoginResultDTO> {
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    if (user.role !== 'ADMIN') {
      throw new InsufficientPermissionsError();
    }

    if (user.isBanned) {
      throw new UserBannedError(user.email);
    }

    // MURO DE 2FA: si está activo, solo un tempToken para verificar el código.
    if (user.totpEnabled) {
      const tempToken = jwt.sign(
        { sub: user.id, scope: ADMIN_2FA_SCOPE },
        this.adminJwtSecret,
        { expiresIn: this.tempTokenExpiresIn as any }
      );
      return { outcome: '2fa_required', tempToken };
    }

    // 2FA INELUDIBLE: el admin nunca configuró 2FA → NO se entrega sesión.
    // Se emite un setupToken acotado que solo habilita el flujo de configuración.
    const setupToken = jwt.sign(
      { sub: user.id, scope: ADMIN_2FA_SETUP_SCOPE },
      this.adminJwtSecret,
      { expiresIn: this.setupTokenExpiresIn as any }
    );
    return { outcome: '2fa_setup_required', setupToken };
  }
}
