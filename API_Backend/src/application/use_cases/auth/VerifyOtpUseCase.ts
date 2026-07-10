import * as argon2 from 'argon2';
import { IOtpRepository } from '../../interfaces/IOtpRepository';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { VerifyOtpDTO } from '../../../domain/types/OtpDTOs';
import { InvalidOtpError, OtpNotValidError } from '../../../domain/errors/AdvancedAuthErrors';

const MAX_OTP_ATTEMPTS = 5;

/**
 * Caso de Uso: Verificar OTP y aplicar el cambio de email/teléfono (REQ-FE-16).
 *
 * Localiza el OTP vigente, valida caducidad e intentos, verifica el código
 * (Argon2id) y, si es correcto, aplica el cambio confirmado y consume el OTP.
 * Un código incorrecto incrementa el contador; al llegar al máximo, el OTP se
 * invalida para frenar fuerza bruta.
 */
export class VerifyOtpUseCase {
  constructor(
    private readonly otpRepository: IOtpRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: VerifyOtpDTO): Promise<void> {
    const otp = await this.otpRepository.findLatestPending(userId, dto.purpose);
    if (!otp) {
      throw new OtpNotValidError();
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      await this.otpRepository.markConsumed(otp.id);
      throw new OtpNotValidError();
    }

    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      await this.otpRepository.markConsumed(otp.id);
      throw new OtpNotValidError('Se agotaron los intentos. Solicita un nuevo código.');
    }

    const isValid = await argon2.verify(otp.codeHash, dto.code.trim());
    if (!isValid) {
      await this.otpRepository.incrementAttempts(otp.id);
      throw new InvalidOtpError();
    }

    // Código correcto → aplicar el cambio confirmado.
    if (otp.purpose === 'email_change') {
      await this.userRepository.updateEmail(userId, otp.newValue);
    } else {
      await this.userRepository.updateProfilePhone(userId, otp.newValue);
    }

    await this.otpRepository.markConsumed(otp.id);
  }
}
