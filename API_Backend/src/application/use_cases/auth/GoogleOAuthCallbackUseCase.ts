import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../../interfaces/IRefreshTokenRepository';
import { IOAuthProvider } from '../../interfaces/IOAuthProvider';
import { AuthResponseDTO } from '../../../domain/types/AuthDTOs';
import { UserBannedError } from '../../../domain/errors/AuthErrors';
import { User } from '../../../domain/entities/User';
import { generateOpaqueToken, sha256Hex, parseDurationToSeconds } from './authTokenUtils';

/**
 * Caso de Uso: Callback de Google OAuth 2.0 (Fase 29).
 *
 * Resuelve la identidad en tres niveles (idempotente y seguro):
 *   1. ¿Ya existe una cuenta vinculada a este Google ID? → login directo.
 *   2. ¿Existe una cuenta con ese email (registro clásico previo)? → se VINCULA
 *      el Google ID a esa cuenta (account linking) y se inicia sesión.
 *   3. Si no existe ninguna → se crea una cuenta CLIENT nueva sin contraseña
 *      utilizable (hash de un secreto aleatorio irrecuperable).
 *
 * Emite el mismo par Access/Refresh que el login clásico, abriendo una familia
 * de Refresh Token (RTR).
 */
export class GoogleOAuthCallbackUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly oauthProvider: IOAuthProvider,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string,
    private readonly refreshTokenExpiresIn: string,
  ) {}

  async execute(code: string): Promise<AuthResponseDTO> {
    const profile = await this.oauthProvider.exchangeCodeForProfile(code);

    let user = await this.userRepository.findByGoogleId(profile.providerId);

    if (!user) {
      const existingByEmail = await this.userRepository.findByEmail(profile.email);
      if (existingByEmail) {
        // Account linking: la cuenta ya existía por registro clásico.
        await this.userRepository.linkGoogleId(existingByEmail.id, profile.providerId);
        user = existingByEmail;
      } else {
        // Alta nueva: contraseña aleatoria irrecuperable (solo login social).
        const randomSecret = crypto.randomBytes(32).toString('hex');
        const passwordHash = await argon2.hash(randomSecret, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
        user = await this.userRepository.createOAuthUser(
          { email: profile.email, passwordHash, googleId: profile.providerId },
          { firstName: profile.firstName, lastName: profile.lastName }
        );
      }
    }

    if (user.isBanned) {
      throw new UserBannedError(user.email);
    }

    return this.issueSession(user);
  }

  private async issueSession(user: User): Promise<AuthResponseDTO> {
    const profile = await this.userRepository.findProfileByUserId(user.id);

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as any }
    );

    const refreshToken = generateOpaqueToken();
    const familyId = crypto.randomUUID();
    const ttlSeconds = parseDurationToSeconds(this.refreshTokenExpiresIn) || 7 * 86400;
    await this.refreshTokenRepository.create({
      userId: user.id,
      familyId,
      tokenHash: sha256Hex(refreshToken),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
        tierLevel: profile?.tierLevel ?? 'BRONZE',
      },
    };
  }
}
