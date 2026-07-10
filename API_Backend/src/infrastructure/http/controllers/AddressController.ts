import { FastifyRequest, FastifyReply } from 'fastify';
import { ListAddressesUseCase } from '../../../application/use_cases/addresses/ListAddressesUseCase';
import { CreateAddressUseCase } from '../../../application/use_cases/addresses/CreateAddressUseCase';
import { UpdateAddressUseCase } from '../../../application/use_cases/addresses/UpdateAddressUseCase';
import { DeleteAddressUseCase } from '../../../application/use_cases/addresses/DeleteAddressUseCase';
import { SetDefaultAddressUseCase } from '../../../application/use_cases/addresses/SetDefaultAddressUseCase';
import { CreateAddressDTO, UpdateAddressDTO } from '../../../domain/types/AddressDTOs';
import { AddressNotFoundError } from '../../../domain/errors/CheckoutErrors';

/**
 * Controlador HTTP de la Libreta de Direcciones (REQ-FE-09, REQ-FE-17).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 */
export class AddressController {
  constructor(
    private readonly listAddressesUseCase: ListAddressesUseCase,
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
    private readonly setDefaultAddressUseCase: SetDefaultAddressUseCase
  ) {}

  /** GET /api/profile/addresses */
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const addresses = await this.listAddressesUseCase.execute(userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Direcciones obtenidas exitosamente.',
        data: addresses,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** POST /api/profile/addresses */
  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const dto = request.body as CreateAddressDTO;

      const address = await this.createAddressUseCase.execute(userId, dto);

      return reply.status(201).send({
        statusCode: 201,
        message: 'Dirección creada exitosamente.',
        data: address,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** PUT /api/profile/addresses/:id */
  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const { id } = request.params as { id: string };
      const dto = request.body as UpdateAddressDTO;

      const address = await this.updateAddressUseCase.execute(id, userId, dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Dirección actualizada exitosamente.',
        data: address,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** DELETE /api/profile/addresses/:id */
  async delete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const { id } = request.params as { id: string };

      await this.deleteAddressUseCase.execute(id, userId);

      return reply.status(204).send();
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** PATCH /api/profile/addresses/:id/default */
  async setDefault(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const { id } = request.params as { id: string };

      await this.setDefaultAddressUseCase.execute(id, userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Dirección predeterminada actualizada exitosamente.',
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof AddressNotFoundError) {
      reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    console.error('❌ Error inesperado en AddressController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
