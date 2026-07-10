import { FastifyRequest, FastifyReply } from 'fastify';
import { ListOrdersUseCase } from '../../../application/use_cases/orders/ListOrdersUseCase';
import { GetOrderDetailUseCase } from '../../../application/use_cases/orders/GetOrderDetailUseCase';
import { CancelOrderUseCase } from '../../../application/use_cases/orders/CancelOrderUseCase';
import { OrderNotFoundError, OrderNotCancellableError, RewardAlreadyClaimedError } from '../../../domain/errors/OrderErrors';

/**
 * Controlador HTTP de Pedidos (REQ-FE-23).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 */
export class OrderController {
  constructor(
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderDetailUseCase: GetOrderDetailUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase
  ) {}

  /** GET /api/profile/orders */
  async listOrders(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const query = request.query as Record<string, string | undefined>;

      const filter = (query.filter as 'active' | 'completed' | 'all' | undefined) ?? 'all';
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 10;

      const orders = await this.listOrdersUseCase.execute(userId, filter, page, limit);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Pedidos obtenidos exitosamente.',
        data: orders,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** GET /api/profile/orders/:id */
  async getOrderDetail(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const { id } = request.params as { id: string };

      const detail = await this.getOrderDetailUseCase.execute(id, userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Detalle del pedido obtenido exitosamente.',
        data: detail,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** POST /api/profile/orders/:id/cancel */
  async cancelOrder(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const { id } = request.params as { id: string };

      const order = await this.cancelOrderUseCase.execute(id, userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Pedido cancelado exitosamente.',
        data: order,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof OrderNotFoundError) {
      reply.status(404).send({ statusCode: 404, error: 'Not Found', message: error.message });
      return;
    }

    if (error instanceof OrderNotCancellableError || error instanceof RewardAlreadyClaimedError) {
      reply.status(422).send({ statusCode: 422, error: 'Unprocessable Entity', message: error.message });
      return;
    }

    console.error('❌ Error inesperado en OrderController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
