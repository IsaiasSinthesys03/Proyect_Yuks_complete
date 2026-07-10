import { IUserRepository } from '../../../interfaces/IUserRepository';
import { User } from '../../../../domain/entities/User';
import { PaginatedResponseDTO } from '../../../../domain/types/ProductDTOs';

export class ListAllUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(page: number, limit: number): Promise<PaginatedResponseDTO<User>> {
    const safePage  = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return this.userRepo.findAllPaginated(safePage, safeLimit);
  }
}
