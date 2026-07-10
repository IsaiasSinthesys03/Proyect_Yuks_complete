import { IRefreshTokenRepository } from '../../interfaces/IRefreshTokenRepository';
import { sha256Hex } from './authTokenUtils';

/**
 * Caso de Uso: Cerrar Sesión (Fase 29).
 *
 * Revoca la familia completa del refresh token presentado. Es idempotente:
 * si el token no existe (ya expiró, ya se cerró), termina sin error — el
 * Controller igual limpia la cookie y responde 200.
 */
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    const record = await this.refreshTokenRepository.findByTokenHash(sha256Hex(refreshToken));
    if (!record) return;

    await this.refreshTokenRepository.revokeFamily(record.familyId);
  }
}
