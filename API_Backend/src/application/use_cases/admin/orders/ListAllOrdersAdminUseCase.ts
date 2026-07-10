import { IOrderRepository } from '../../../interfaces/IOrderRepository';
import { OrderSummaryDTO } from '../../../../domain/types/OrderDTOs';
import { PaginatedResponseDTO } from '../../../../domain/types/ProductDTOs';
import { AdminOrderFilterDTO } from '../../../../domain/types/AdminOrderDTOs';

export class ListAllOrdersAdminUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(filters: AdminOrderFilterDTO): Promise<PaginatedResponseDTO<OrderSummaryDTO>> {
    const page  = Math.max(1, filters.page  ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    return this.orderRepo.findAllAdmin({ ...filters, page, limit });
  }
}
