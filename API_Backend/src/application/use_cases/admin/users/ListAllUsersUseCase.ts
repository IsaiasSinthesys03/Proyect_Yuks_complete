import { IUserRepository } from '../../../interfaces/IUserRepository';
import { PaginatedResponseDTO } from '../../../../domain/types/ProductDTOs';
import { AdminUserCrmDTO } from '../../../../domain/types/AdminUserDTOs';

export class ListAllUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(page: number, limit: number): Promise<PaginatedResponseDTO<AdminUserCrmDTO>> {
    const safePage  = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return this.userRepo.findAllPaginated(safePage, safeLimit);
  }
}
