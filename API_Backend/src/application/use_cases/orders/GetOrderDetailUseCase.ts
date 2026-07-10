import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { OrderDetailDTO } from '../../../domain/types/OrderDTOs';
import { OrderNotFoundError } from '../../../domain/errors/OrderErrors';

/** Caso de Uso: Obtener el detalle de un pedido con Timeline (REQ-FE-23). */
export class GetOrderDetailUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string, userId: string): Promise<OrderDetailDTO> {
    const detail = await this.orderRepository.findDetailById(orderId, userId);
    if (!detail) {
      throw new OrderNotFoundError(orderId);
    }
    return detail;
  }
}
