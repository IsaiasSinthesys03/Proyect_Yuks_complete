import * as argon2 from 'argon2';
import { IUserRepository } from '../interfaces/IUserRepository';
import { RegisterUserDTO } from '../../domain/types/AuthDTOs';
import { UserAlreadyExistsError } from '../../domain/errors/AuthErrors';
import { TermsNotAcceptedError } from '../../domain/errors/AuthErrors';
import { User } from '../../domain/entities/User';

/**
 * Caso de Uso: Registrar Usuario
 *
 * Orquesta la creación de un nuevo usuario en el sistema.
 * Reglas de negocio aplicadas:
 * 1. Rechaza si los términos y condiciones no han sido aceptados.
 * 2. Rechaza si el email ya existe en la base de datos.
 * 3. Hashea la contraseña con Argon2id antes de persistir.
 * 4. Crea el usuario y su perfil en una sola transacción atómica.
 *
 * Este Use Case NO conoce Fastify, Express, ni ningún framework HTTP.
 * Depende únicamente de la abstracción IUserRepository (Inversión de Dependencias).
 */
export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: RegisterUserDTO): Promise<User> {
    // 1. Validar aceptación de términos y condiciones (compliance legal)
    if (!dto.termsAccepted) {
      throw new TermsNotAcceptedError();
    }

    // 2. Verificar que el email no esté duplicado
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(dto.email);
    }

    // 3. Hashear la contraseña con Argon2id (resistente a ataques GPU y side-channel)
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,  // 64 MB
      timeCost: 3,        // 3 iteraciones
      parallelism: 4,     // 4 hilos
    });

    // 4. Delegar la persistencia al repositorio (transacción atómica User + Profile)
    const newUser = await this.userRepository.createWithProfile(
      {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        role: 'CLIENT',
      },
      {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
      }
    );

    return newUser;
  }
}
