import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { OrderSummaryDTO } from '../../../domain/types/OrderDTOs';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';

/** Caso de Uso: Listar pedidos del usuario con filtro y paginación (REQ-FE-23). */
export class ListOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(
    userId: string,
    filter: 'active' | 'completed' | 'all',
    page: number,
    limit: number
  ): Promise<PaginatedResponseDTO<OrderSummaryDTO>> {
    return this.orderRepository.findByUserId(userId, filter, page, limit);
  }
}
