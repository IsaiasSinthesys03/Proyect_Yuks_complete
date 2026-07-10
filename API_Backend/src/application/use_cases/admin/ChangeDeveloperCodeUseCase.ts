import * as argon2 from 'argon2';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { IAuditLogRepository } from '../../interfaces/IAuditLogRepository';
import { AdminAuditContext } from '../../../domain/types/AdminTypes';
import { ChangeDeveloperCodeDTO } from '../../../domain/types/DeveloperCodeDTOs';
import { DeveloperCodeReauthFailedError, WeakDeveloperCodeError } from '../../../domain/errors/AdminSecurityErrors';

const MIN_DEVELOPER_CODE_LENGTH = 6;

/**
 * Caso de Uso: Cambiar el Código de Desarrollador con Re-Autenticación (Fase 31).
 *
 * ▓ FLUJO DE RE-AUTH DEFENSIVO ▓ (mismo patrón que ManualRefundUseCase)
 * El nuevo hash NUNCA se escribe si `argon2.verify` de la contraseña ACTUAL del
 * admin falla. El orden estructural lo garantiza: re-auth en el paso 2, escritura
 * en el paso 4. Un JWT admin válido NO basta — se exige la contraseña de nuevo,
 * porque este código es la única puerta para crear nuevos administradores (Q21).
 *
 * El código en claro jamás se persiste ni se registra en el audit log: solo su
 * hash Argon2id, y el log deja constancia únicamente de QUIÉN lo cambió y CUÁNDO.
 */
export class ChangeDeveloperCodeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly systemSettingsRepository: ISystemSettingsRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(dto: ChangeDeveloperCodeDTO, context: AdminAuditContext): Promise<void> {
    // STEP 1: recuperar el admin de la BD.
    const admin = await this.userRepository.findById(context.adminId);
    if (!admin) {
      throw new DeveloperCodeReauthFailedError();
    }

    // STEP 2: RE-AUTENTICACIÓN. Si falla, sale AQUÍ — nada se modifica.
    const passwordCorrect = await argon2.verify(admin.passwordHash, dto.currentPassword);
    if (!passwordCorrect) {
      throw new DeveloperCodeReauthFailedError();
    }

    // STEP 3: validar el nuevo código.
    if (!dto.newCode || dto.newCode.trim().length < MIN_DEVELOPER_CODE_LENGTH) {
      throw new WeakDeveloperCodeError(MIN_DEVELOPER_CODE_LENGTH);
    }

    // STEP 4: hashear y persistir (Argon2id, mismos parámetros que el resto del sistema).
    const newHash = await argon2.hash(dto.newCode.trim(), {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
    await this.systemSettingsRepository.setDeveloperCodeHash(newHash);

    // STEP 5: auditar el CAMBIO (sin exponer el código ni su hash).
    await this.auditLogRepository.write({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'UPDATE',
      entityType: 'developer_code',
      entityId: context.adminId,
      oldValue: null,
      newValue: { changed: true },
      ipAddress: context.ip,
    });
  }
}
