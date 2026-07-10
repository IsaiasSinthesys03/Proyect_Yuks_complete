import { FastifyRequest, FastifyReply } from 'fastify';
import { ListAllOrdersAdminUseCase } from '../../../application/use_cases/admin/orders/ListAllOrdersAdminUseCase';
import { UpdateOrderStatusUseCase } from '../../../application/use_cases/admin/orders/UpdateOrderStatusUseCase';
import {
  InvalidStatusTransitionError,
  OrderNotFoundAdminError,
} from '../../../domain/errors/OrderTransitionErrors';

export class AdminOrderAdminController {
  constructor(
    private readonly listAllOrdersUseCase: ListAllOrdersAdminUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  async listOrders(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as {
        status?: string;
        userId?: string;
        page?: string;
        limit?: string;
      };
      const result = await this.listAllOrdersUseCase.execute({
        status: query.status as any,
        userId: query.userId,
        page:   query.page  ? parseInt(query.page,  10) : 1,
        limit:  query.limit ? parseInt(query.limit, 10) : 20,
      });
      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async updateOrderStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        status: 'PREPARING' | 'SHIPPED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
        driverName?: string | null;
        driverVehicle?: string | null;
        driverPhone?: string | null;
        trackingCompany?: string | null;
        trackingNumber?: string | null;
      };
      const order = await this.updateOrderStatusUseCase.execute(id, body, request.adminContext!);
      reply.status(200).send({ success: true, data: order });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof InvalidStatusTransitionError) {
      return void reply.status(422).send({ success: false, error: (err as Error).message });
    }
    if (err instanceof OrderNotFoundAdminError) {
      return void reply.status(404).send({ success: false, error: (err as Error).message });
    }
    console.error('[AdminOrderAdminController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
