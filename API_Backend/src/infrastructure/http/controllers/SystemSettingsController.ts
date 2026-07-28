import { FastifyRequest, FastifyReply } from 'fastify';
import { GetSystemSettingsUseCase } from '../../../application/use_cases/admin/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '../../../application/use_cases/admin/UpdateSystemSettingsUseCase';
import { ChangeDeveloperCodeUseCase } from '../../../application/use_cases/admin/ChangeDeveloperCodeUseCase';
import { UpdateSystemSettingsDTO } from '../../../domain/types/SystemSettingsDTOs';
import { ChangeDeveloperCodeDTO } from '../../../domain/types/DeveloperCodeDTOs';
import { DeveloperCodeReauthFailedError, WeakDeveloperCodeError } from '../../../domain/errors/AdminSecurityErrors';

/**
 * Controlador HTTP de Configuración Global del Sistema (CMS-FE-11) + Developer Code (Fase 31).
 * NO contiene lógica de negocio.
 */
export class SystemSettingsController {
  constructor(
    private readonly getSystemSettingsUseCase: GetSystemSettingsUseCase,
    private readonly updateSystemSettingsUseCase: UpdateSystemSettingsUseCase,
    private readonly changeDeveloperCodeUseCase: ChangeDeveloperCodeUseCase,
  ) {}

  /** GET /api/admin/settings */
  async get(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const settings = await this.getSystemSettingsUseCase.execute();

      return reply.status(200).send({
        statusCode: 200,
        message: 'Configuración del sistema obtenida exitosamente.',
        data: settings,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** PUT /api/admin/settings */
  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as UpdateSystemSettingsDTO;
      const settings = await this.updateSystemSettingsUseCase.execute(dto, request.adminContext!);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Configuración del sistema actualizada exitosamente.',
        data: settings,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * PUT /api/admin/settings/developer-code
   * Cambia el Código de Desarrollador. Exige la contraseña actual del admin
   * (Re-Auth defensivo). El contexto de auditoría lo provee el middleware.
   */
  async changeDeveloperCode(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as ChangeDeveloperCodeDTO;
      if (!dto?.currentPassword) {
        return void reply.status(400).send({
          statusCode: 400, error: 'Bad Request', message: 'La contraseña actual es obligatoria.',
        });
      }
      const context = request.adminContext!;
      await this.changeDeveloperCodeUseCase.execute(dto, context);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Código de desarrollador actualizado exitosamente.',
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof DeveloperCodeReauthFailedError) {
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: error.message });
      return;
    }
    if (error instanceof WeakDeveloperCodeError) {
      reply.status(422).send({ statusCode: 422, error: 'Unprocessable Entity', message: error.message });
      return;
    }
    console.error('❌ Error inesperado en SystemSettingsController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
