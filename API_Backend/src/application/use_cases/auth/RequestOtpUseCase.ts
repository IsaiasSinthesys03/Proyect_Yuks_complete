import * as argon2 from 'argon2';
import { IOtpRepository } from '../../interfaces/IOtpRepository';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { IQueueService } from '../../interfaces/IQueueService';
import { RequestOtpDTO } from '../../../domain/types/OtpDTOs';
import { UserAlreadyExistsError } from '../../../domain/errors/AuthErrors';
import { OtpNotValidError } from '../../../domain/errors/AdvancedAuthErrors';
import { generateNumericOtp } from './authTokenUtils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Caso de Uso: Solicitar OTP para cambiar email o teléfono (REQ-FE-16, Fase 29).
 *
 * Genera un código de 6 dígitos, guarda su hash Argon2id + el nuevo valor
 * pendiente, y ENCOLA el email con el código. Por seguridad, el OTP se envía
 * al email ACTUAL del usuario (canal ya verificado), no al nuevo.
 */
export class RequestOtpUseCase {
  constructor(
    private readonly otpRepository: IOtpRepository,
    private readonly userRepository: IUserRepository,
    private readonly queueService: IQueueService,
    private readonly otpTtlMinutes: number = 10,
  ) {}

  async execute(userId: string, dto: RequestOtpDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      // No debería ocurrir (viene de un JWT válido); tratamos como no válido.
      throw new OtpNotValidError('Usuario no encontrado.');
    }

    const newValue = dto.newValue.trim();

    if (dto.purpose === 'email_change') {
      const email = newValue.toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        throw new OtpNotValidError('El email proporcionado no es válido.');
      }
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== userId) {
        throw new UserAlreadyExistsError(email);
      }
    } else {
      // phone_change: validación mínima de longitud.
      if (newValue.replace(/\D/g, '').length < 8) {
        throw new OtpNotValidError('El número de teléfono proporcionado no es válido.');
      }
    }

    // Solo un OTP vigente por propósito.
    await this.otpRepository.invalidatePending(userId, dto.purpose);

    const code = generateNumericOtp(6);
    const codeHash = await argon2.hash(code, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.otpRepository.create({
      userId,
      codeHash,
      purpose: dto.purpose,
      newValue: dto.purpose === 'email_change' ? newValue.toLowerCase() : newValue,
      expiresAt: new Date(Date.now() + this.otpTtlMinutes * 60 * 1000),
    });

    await this.queueService.enqueue('email:otp', {
      to: user.email, // canal verificado actual
      otp: code,
      purpose: dto.purpose,
    });
  }
}
