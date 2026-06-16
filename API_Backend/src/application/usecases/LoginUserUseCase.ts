import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../interfaces/IUserRepository';
import { LoginDTO, AuthResponseDTO } from '../../domain/types/AuthDTOs';
import { InvalidCredentialsError, UserBannedError } from '../../domain/errors/AuthErrors';

/**
 * Caso de Uso: Iniciar Sesión
 *
 * Orquesta la autenticación de un usuario existente.
 * Reglas de negocio aplicadas:
 * 1. Verifica que el email exista en la base de datos.
 * 2. Verifica que la contraseña coincida con el hash almacenado (Argon2id).
 * 3. Verifica que el usuario no esté baneado.
 * 4. Genera un JWT (Access Token) con los claims del usuario.
 * 5. Obtiene el perfil para incluir datos de gamificación en la respuesta.
 *
 * Este Use Case NO conoce Fastify, Express, ni ningún framework HTTP.
 * El Refresh Token (HttpOnly Cookie) se gestiona en la capa de infraestructura (Controller).
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string = '15m',
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

    // 5. Generar Access Token JWT
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as any }
    );

    // 6. Construir respuesta con datos del usuario y su perfil
    return {
      accessToken,
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
