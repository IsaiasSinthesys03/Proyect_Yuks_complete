import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterAdminUseCase } from '../../../application/use_cases/admin/RegisterAdminUseCase';
import { AdminLoginUseCase } from '../../../application/use_cases/admin/AdminLoginUseCase';
import { VerifyAdmin2faUseCase } from '../../../application/use_cases/admin/VerifyAdmin2faUseCase';
import { Setup2faUseCase } from '../../../application/use_cases/admin/Setup2faUseCase';
import { Enable2faUseCase } from '../../../application/use_cases/admin/Enable2faUseCase';
import { RegisterAdminDTO, AdminLoginDTO } from '../../../domain/types/AdminAuthDTOs';
import { Verify2faDTO, Enable2faDTO } from '../../../domain/types/TwoFactorDTOs';
import { UserAlreadyExistsError, InvalidCredentialsError, UserBannedError } from '../../../domain/errors/AuthErrors';
import { DeveloperCodeRequiredError, InsufficientPermissionsError } from '../../../domain/errors/AdminErrors';
import {
  InvalidTempTokenError,
  InvalidTwoFactorCodeError,
  TwoFactorNotEnabledError,
  TwoFactorAlreadyEnabledError,
} from '../../../domain/errors/AdvancedAuthErrors';

/**
 * Controlador HTTP de Autenticación Administrativa (CMS-BE-01) con 2FA (Fase 29).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 */
export class AdminAuthController {
  constructor(
    private readonly registerAdminUseCase: RegisterAdminUseCase,
    private readonly adminLoginUseCase: AdminLoginUseCase,
    private readonly verifyAdmin2faUseCase: VerifyAdmin2faUseCase,
    private readonly setup2faUseCase: Setup2faUseCase,
    private readonly enable2faUseCase: Enable2faUseCase,
  ) {}

  /** POST /api/admin/auth/register */
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as RegisterAdminDTO;
      const admin = await this.registerAdminUseCase.execute(dto);

      return reply.status(201).send({
        statusCode: 201,
        message: 'Administrador registrado exitosamente.',
        data: { id: admin.id, email: admin.email, role: admin.role },
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** POST /api/admin/auth/login */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as AdminLoginDTO;
      const result = await this.adminLoginUseCase.execute(dto);

      // 2FA INELUDIBLE (Fase 34): la sesión completa SOLO se entrega en 'session'.
      if (result.outcome === '2fa_required') {
        return reply.status(200).send({
          statusCode: 200,
          message: 'Verificación en dos pasos requerida. Ingresa el código de tu autenticador.',
          data: { requires2fa: true, tempToken: result.tempToken },
        });
      }

      if (result.outcome === '2fa_setup_required') {
        return reply.status(200).send({
          statusCode: 200,
          message: 'Debes configurar la autenticación de dos factores antes de acceder al panel. Usa el setupToken en /2fa/setup y /2fa/enable.',
          data: { requiresSetup: true, setupToken: result.setupToken },
        });
      }

      return reply.status(200).send({
        statusCode: 200,
        message: 'Inicio de sesión administrativo exitoso.',
        data: { requires2fa: false, accessToken: result.accessToken, user: result.user },
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /api/admin/auth/2fa/verify
   * Segundo paso del login: valida el tempToken + código TOTP y emite el JWT de 8h.
   */
  async verify2fa(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as Verify2faDTO;
      const result = await this.verifyAdmin2faUseCase.execute(dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Verificación exitosa. Sesión administrativa iniciada.',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /api/admin/auth/2fa/setup  (requiere JWT admin)
   * Genera el secreto TOTP y devuelve la URI otpauth:// para el QR.
   */
  async setup2fa(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const result = await this.setup2faUseCase.execute(userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Escanea el código QR con tu app de autenticación y confirma con un código.',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /api/admin/auth/2fa/enable  (requiere JWT admin)
   * Activa el 2FA tras confirmar un primer código válido.
   */
  async enable2fa(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const dto = request.body as Enable2faDTO;
      await this.enable2faUseCase.execute(userId, dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Autenticación de dos factores activada exitosamente.',
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof InvalidTempTokenError) {
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: error.message });
      return;
    }

    if (error instanceof InvalidTwoFactorCodeError) {
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: error.message });
      return;
    }

    if (error instanceof TwoFactorNotEnabledError || error instanceof TwoFactorAlreadyEnabledError) {
      reply.status(409).send({ statusCode: 409, error: 'Conflict', message: error.message });
      return;
    }

    if (error instanceof DeveloperCodeRequiredError) {
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: error.message });
      return;
    }

    if (error instanceof InsufficientPermissionsError) {
      reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: error.message });
      return;
    }

    if (error instanceof UserAlreadyExistsError) {
      reply.status(409).send({ statusCode: 409, error: 'Conflict', message: error.message });
      return;
    }

    if (error instanceof InvalidCredentialsError) {
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: error.message });
      return;
    }

    if (error instanceof UserBannedError) {
      reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: error.message });
      return;
    }

    console.error('❌ Error inesperado en AdminAuthController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
