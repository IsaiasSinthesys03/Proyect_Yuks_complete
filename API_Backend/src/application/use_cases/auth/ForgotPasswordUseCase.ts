import { IUserRepository } from '../../interfaces/IUserRepository';
import { IPasswordResetTokenRepository } from '../../interfaces/IPasswordResetTokenRepository';
import { IQueueService } from '../../interfaces/IQueueService';
import { ForgotPasswordDTO } from '../../../domain/types/PasswordRecoveryDTOs';
import { generateOpaqueToken, sha256Hex } from './authTokenUtils';

/**
 * Caso de Uso: Solicitar Recuperación de Contraseña (Fase 29).
 *
 * ▓▓▓ PREVENCIÓN DE ENUMERACIÓN DE USUARIOS ▓▓▓
 * Este Use Case NUNCA revela si el email existe o no. Devuelve `void` en ambos
 * casos y el Controller responde 202 incondicionalmente. Un atacante no puede
 * distinguir un email registrado de uno que no lo está observando la respuesta.
 *
 * Cuando el email SÍ existe:
 *   - Se invalidan los tokens de reseteo previos (solo el último enlace sirve).
 *   - Se genera un token opaco; se guarda su hash SHA-256 con caducidad corta.
 *   - Se ENCOLA el email con el enlace (BullMQ) — el envío nunca bloquea el HTTP.
 * El token CRUDO solo viaja en el correo; la BD jamás lo almacena en claro.
 */
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetTokenRepository: IPasswordResetTokenRepository,
    private readonly queueService: IQueueService,
    private readonly resetLinkBaseUrl: string,
    private readonly tokenTtlMinutes: number = 30,
  ) {}

  async execute(dto: ForgotPasswordDTO): Promise<void> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(email);

    // Anti-enumeración: si no existe, terminamos silenciosamente (éxito aparente).
    if (!user) {
      return;
    }

    // Solo el enlace más reciente debe ser válido.
    await this.resetTokenRepository.invalidateAllForUser(user.id);

    const rawToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + this.tokenTtlMinutes * 60 * 1000);

    await this.resetTokenRepository.create({
      userId: user.id,
      tokenHash: sha256Hex(rawToken),
      expiresAt,
    });

    const separator = this.resetLinkBaseUrl.includes('?') ? '&' : '?';
    const resetLink = `${this.resetLinkBaseUrl}${separator}token=${rawToken}`;

    // Encolar el envío — el HTTP responde sin esperar a Resend (REQ-BE-04).
    await this.queueService.enqueue('email:password_reset', {
      to: user.email,
      resetLink,
      expiresInMinutes: this.tokenTtlMinutes,
    });
  }
}
