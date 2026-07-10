import * as argon2 from 'argon2';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { RegisterAdminDTO } from '../../../domain/types/AdminAuthDTOs';
import { User } from '../../../domain/entities/User';
import { UserAlreadyExistsError } from '../../../domain/errors/AuthErrors';
import { DeveloperCodeRequiredError } from '../../../domain/errors/AdminErrors';

/**
 * Caso de Uso: Registrar Administrador (Easter Egg del CMS, Q21).
 *
 * El `role: 'ADMIN'` NUNCA se acepta del cliente — `IUserRepository.createAdmin`
 * lo fija internamente. La única puerta de entrada a esta capacidad es
 * conocer el Código de Desarrollador correcto, verificado contra su hash
 * Argon2id en `system_settings` (nunca comparación de texto plano).
 */
export class RegisterAdminUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly systemSettingsRepository: ISystemSettingsRepository
  ) {}

  async execute(dto: RegisterAdminDTO): Promise<User> {
    const developerCodeHash = await this.systemSettingsRepository.getDeveloperCodeHash();

    if (!developerCodeHash) {
      // Falla cerrada: si el sistema no tiene un hash configurado, nadie
      // puede registrarse como admin, nunca se asume un código por defecto.
      throw new DeveloperCodeRequiredError();
    }

    const isCodeValid = await argon2.verify(developerCodeHash, dto.developerCode);
    if (!isCodeValid) {
      throw new DeveloperCodeRequiredError();
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(dto.email);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    return this.userRepository.createAdmin(
      { email: dto.email.toLowerCase().trim(), passwordHash },
      { firstName: dto.firstName.trim(), lastName: dto.lastName.trim() }
    );
  }
}
