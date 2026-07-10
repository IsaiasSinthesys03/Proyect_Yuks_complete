import jwt from 'jsonwebtoken';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { RefreshTokenResponseDTO } from '../../domain/types/AuthDTOs';
import { InvalidRefreshTokenError, UserBannedError } from '../../domain/errors/AuthErrors';
import { RefreshTokenReuseError } from '../../domain/errors/AdvancedAuthErrors';
import { generateOpaqueToken, sha256Hex, parseDurationToSeconds } from '../use_cases/auth/authTokenUtils';

/**
 * Caso de Uso: Renovación Silenciosa con Refresh Token Rotation (RTR, Fase 29).
 *
 * El refresh token es ahora un token OPACO persistido (su hash) con una
 * `familyId`. En cada renovación:
 *   1. Se localiza el token por su hash.
 *   2. Si no existe / está revocado / expiró → InvalidRefreshTokenError (401).
 *   3. Si YA fue consumido (`usedAt != null`) → REÚSO DETECTADO: se asume robo
 *      de sesión y se REVOCA TODA LA FAMILIA → RefreshTokenReuseError (401).
 *      Esto invalida incluso al token "legítimo" que rotó después, forzando un
 *      re-login limpio de todos los dispositivos de esa cadena.
 *   4. Caso normal: se marca el token como usado y se emite uno nuevo en la
 *      MISMA familia (la cadena de custodia continúa).
 *
 * Este Use Case NO conoce Fastify ni cookies — solo recibe un string.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string,
    private readonly refreshTokenExpiresIn: string,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenResponseDTO> {
    const tokenHash = sha256Hex(refreshToken);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    // 1. Token inexistente → inválido (no revela nada al atacante).
    if (!record) {
      throw new InvalidRefreshTokenError();
    }

    // 2. Familia ya revocada (logout previo o reúso anterior) → inválido.
    if (record.revoked) {
      throw new InvalidRefreshTokenError();
    }

    // 3. REÚSO: un token ya rotado se presenta de nuevo → matar la familia.
    if (record.usedAt !== null) {
      await this.refreshTokenRepository.revokeFamily(record.familyId);
      throw new RefreshTokenReuseError();
    }

    // 4. Expiración natural.
    if (record.expiresAt.getTime() < Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    // 5. Validar que el usuario siga existiendo y activo.
    const user = await this.userRepository.findById(record.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }
    if (user.isBanned) {
      // Sesión de una cuenta suspendida: cerrar la familia por higiene.
      await this.refreshTokenRepository.revokeFamily(record.familyId);
      throw new UserBannedError(user.email);
    }

    // 6. Rotación: consumir el actual y emitir uno nuevo en la misma familia.
    await this.refreshTokenRepository.markUsed(record.id);

    const newRefreshToken = generateOpaqueToken();
    const ttlSeconds = parseDurationToSeconds(this.refreshTokenExpiresIn) || 7 * 86400;
    await this.refreshTokenRepository.create({
      userId: user.id,
      familyId: record.familyId,
      tokenHash: sha256Hex(newRefreshToken),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });

    const newAccessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as any }
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
