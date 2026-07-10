import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { LoginDTO, AuthResponseDTO } from '../../domain/types/AuthDTOs';
import { InvalidCredentialsError, UserBannedError } from '../../domain/errors/AuthErrors';
import { generateOpaqueToken, sha256Hex, parseDurationToSeconds } from '../use_cases/auth/authTokenUtils';

/**
 * Caso de Uso: Iniciar Sesión
 *
 * Orquesta la autenticación de un usuario existente.
 * Reglas de negocio aplicadas:
 * 1. Verifica que el email exista en la base de datos.
 * 2. Verifica que la contraseña coincida con el hash almacenado (Argon2id).
 * 3. Verifica que el usuario no esté baneado.
 * 4. Genera un JWT (Access Token) con los claims del usuario.
 * 5. Abre una FAMILIA de Refresh Token (RTR, Fase 29) y persiste su hash.
 *
 * REFRESH TOKEN ROTATION (Fase 29): el refresh token ya NO es un JWT stateless.
 * Ahora es un token opaco aleatorio cuyo hash se guarda en `refresh_tokens`,
 * asociado a una `familyId`. Esto habilita la rotación estricta con detección
 * de reúso (ver RefreshTokenUseCase): la revocación es autoritativa vía BD.
 *
 * Este Use Case NO conoce Fastify, Express, ni ningún framework HTTP.
 * El Refresh Token (HttpOnly Cookie) se gestiona en la capa de infraestructura (Controller).
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string = '15m',
    private readonly refreshTokenExpiresIn: string = '7d',
  ) {}

  async execute(dto: LoginDTO): Promise<AuthResponseDTO> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2. Verificar contraseña contra el hash almacenado
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 3. Verificar que el usuario no esté baneado
    if (user.isBanned) {
      throw new UserBannedError(user.email);
    }

    // 4. Obtener perfil para datos de gamificación y respuesta
    const profile = await this.userRepository.findProfileByUserId(user.id);

    // 5. Generar Access Token JWT (corta duración)
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as any }
    );

    // 6. Abrir una nueva familia de Refresh Token (RTR) y persistir su hash.
    const refreshToken = generateOpaqueToken();
    const familyId = crypto.randomUUID();
    const ttlSeconds = parseDurationToSeconds(this.refreshTokenExpiresIn) || 7 * 86400;
    await this.refreshTokenRepository.create({
      userId: user.id,
      familyId,
      tokenHash: sha256Hex(refreshToken),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });

    // 7. Construir respuesta con datos del usuario y su perfil
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
