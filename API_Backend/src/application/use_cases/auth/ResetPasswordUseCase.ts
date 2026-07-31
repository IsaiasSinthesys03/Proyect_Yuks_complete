import * as argon2 from 'argon2';
import { IPasswordResetTokenRepository } from '../../interfaces/IPasswordResetTokenRepository';
import { ResetPasswordDTO } from '../../../domain/types/PasswordRecoveryDTOs';
import { InvalidResetTokenError, ResetTokenExpiredError } from '../../../domain/errors/AdvancedAuthErrors';
import { sha256Hex } from './authTokenUtils';

const MIN_PASSWORD_LENGTH = 8;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,200}$/;

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
    private readonly resetTokenRepository: IPasswordResetTokenRepository,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<void> {
    if (!dto?.token || typeof dto.token !== 'string' || dto.token.trim().length === 0) {
      throw new InvalidResetTokenError();
    }

    if (typeof dto.newPassword !== 'string' || !STRONG_PASSWORD_PATTERN.test(dto.newPassword)) {
      throw new WeakPasswordError();
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await this.resetTokenRepository.consumeAndResetPassword({
      tokenHash: sha256Hex(dto.token),
      passwordHash,
      now: new Date(),
    });

    if (result === 'EXPIRED') throw new ResetTokenExpiredError();
    if (result === 'INVALID') throw new InvalidResetTokenError();
  }
}

/** Se lanza cuando la nueva contraseña no cumple la longitud mínima. HTTP 422. */
export class WeakPasswordError extends Error {
  constructor() {
    super(`La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y 200 caracteres e incluir mayúscula, minúscula, número y un símbolo (@$!%*?&).`);
    this.name = 'WeakPasswordError';
  }
}
