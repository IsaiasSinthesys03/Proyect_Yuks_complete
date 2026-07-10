import { FastifyRequest, FastifyReply } from 'fastify';
import { GetProfileUseCase } from '../../../application/use_cases/profile/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../../application/use_cases/profile/UpdateProfileUseCase';
import { UpdateProfileRequestDTO } from '../../../domain/types/ProfileDTOs';
import { OtpVerificationRequiredError } from '../../../domain/errors/ProfileErrors';

/**
 * Controlador HTTP del Perfil Autenticado (REQ-FE-14, REQ-FE-15, REQ-FE-16).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 */
export class ProfileController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase
  ) {}

  /** GET /api/profile */
  async getProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const profile = await this.getProfileUseCase.execute(userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Perfil obtenido exitosamente.',
        data: profile,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** PUT /api/profile */
  async updateProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const dto = request.body as UpdateProfileRequestDTO;

      const profile = await this.updateProfileUseCase.execute(userId, dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Perfil actualizado exitosamente.',
        data: profile,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof OtpVerificationRequiredError) {
      reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: error.message,
      });
      return;
    }

    console.error('❌ Error inesperado en ProfileController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
