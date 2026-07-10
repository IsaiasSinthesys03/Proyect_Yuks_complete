import { IUserRepository } from '../../interfaces/IUserRepository';
import { UpdateProfileRequestDTO } from '../../../domain/types/ProfileDTOs';
import { OtpVerificationRequiredError } from '../../../domain/errors/ProfileErrors';
import { Profile } from '../../../domain/entities/Profile';

/**
 * Caso de Uso: Actualizar el Perfil Autenticado (REQ-FE-16).
 *
 * Solo permite actualizar `firstName`/`lastName` directamente.
 * Si el payload intenta modificar `email` o `phone`, rechaza la operación —
 * esos campos exigen el flujo de verificación OTP (fuera de este alcance).
 */
export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, data: UpdateProfileRequestDTO): Promise<Profile> {
    if (data.email !== undefined) {
      throw new OtpVerificationRequiredError('email');
    }

    if (data.phone !== undefined) {
      throw new OtpVerificationRequiredError('phone');
    }

    return this.userRepository.updateProfile(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
    });
  }
}
