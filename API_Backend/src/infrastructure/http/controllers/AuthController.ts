import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterUserUseCase } from '../../../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/usecases/LoginUserUseCase';
import { RegisterUserDTO, LoginDTO } from '../../../domain/types/AuthDTOs';
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserBannedError,
  TermsNotAcceptedError,
} from '../../../domain/errors/AuthErrors';

/**
 * Controlador HTTP de Autenticación.
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * - Extrae el body (DTO) del request de Fastify.
 * - Invoca el Use Case correspondiente.
 * - Traduce errores de dominio a códigos HTTP apropiados.
 *
 * NO contiene lógica de negocio. Eso vive en los Use Cases.
 */
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
  ) {}

  /**
   * POST /register
   * Registra un nuevo usuario en el sistema.
   */
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as RegisterUserDTO;

      const user = await this.registerUseCase.execute(dto);

      return reply.status(201).send({
        statusCode: 201,
        message: 'Usuario registrado exitosamente.',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /login
   * Autentica un usuario existente y retorna un JWT.
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as LoginDTO;

      const authResponse = await this.loginUseCase.execute(dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Inicio de sesión exitoso.',
        data: authResponse,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * Traductor centralizado: Errores de Dominio → Códigos HTTP.
   *
   * Mapeo según el SRS y las resoluciones de casos límite:
   * - UserAlreadyExistsError → 409 Conflict
   * - InvalidCredentialsError → 401 Unauthorized
   * - UserBannedError → 403 Forbidden
   * - TermsNotAcceptedError → 422 Unprocessable Entity
   * - Error genérico → 500 Internal Server Error
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof UserAlreadyExistsError) {
      reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: error.message,
      });
      return;
    }

    if (error instanceof InvalidCredentialsError) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: error.message,
      });
      return;
    }

    if (error instanceof UserBannedError) {
      reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: error.message,
      });
      return;
    }

    if (error instanceof TermsNotAcceptedError) {
      reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: error.message,
      });
      return;
    }

    // Error no controlado → 500
    console.error('❌ Error inesperado en AuthController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
