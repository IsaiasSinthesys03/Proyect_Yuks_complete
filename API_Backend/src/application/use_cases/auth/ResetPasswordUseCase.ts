import * as argon2 from 'argon2';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { IPasswordResetTokenRepository } from '../../interfaces/IPasswordResetTokenRepository';
import { IRefreshTokenRepository } from '../../interfaces/IRefreshTokenRepository';
import { ResetPasswordDTO } from '../../../domain/types/PasswordRecoveryDTOs';
import { InvalidResetTokenError, ResetTokenExpiredError } from '../../../domain/errors/AdvancedAuthErrors';
import { sha256Hex } from './authTokenUtils';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Caso de Uso: Restablecer Contraseña con Token (Fase 29).
 *
 * Verifica el token de un solo uso, actualiza la contraseña (Argon2id) y:
 *   - Marca el token como consumido (no reutilizable).
 *   - REVOCA TODAS LAS SESIONES del usuario: cambiar la contraseña debe cerrar
 *     cualquier sesión abierta, incluida la de un posible atacante.
 */
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetTokenRepository: IPasswordResetTokenRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<void> {
    if (!dto.newPassword || dto.newPassword.length < MIN_PASSWORD_LENGTH) {
      // Validación de negocio: reutilizamos InvalidResetTokenError no aplica aquí;
      // lanzamos un error genérico de argumento para que el Controller lo mapee a 422.
      throw new WeakPasswordError();
    }

    const record = await this.resetTokenRepository.findByTokenHash(sha256Hex(dto.token));

    if (!record || record.usedAt !== null) {
      throw new InvalidResetTokenError();
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new ResetTokenExpiredError();
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.userRepository.updatePassword(record.userId, passwordHash);
    await this.resetTokenRepository.markUsed(record.id);

    // Cerrar todas las sesiones activas tras el cambio de contraseña.
    await this.refreshTokenRepository.revokeAllForUser(record.userId);
  }
}

/** Se lanza cuando la nueva contraseña no cumple la longitud mínima. HTTP 422. */
export class WeakPasswordError extends Error {
  constructor() {
    super(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    this.name = 'WeakPasswordError';
  }
}
