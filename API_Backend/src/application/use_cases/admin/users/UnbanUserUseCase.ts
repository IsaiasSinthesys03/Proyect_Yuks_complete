import { IUserRepository } from '../../../interfaces/IUserRepository';
import { User } from '../../../../domain/entities/User';
import { UserNotFoundAdminError } from '../../../../domain/errors/AdminErrors';

export class UnbanUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(targetUserId: string): Promise<User> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new UserNotFoundAdminError(targetUserId);
    return this.userRepo.unbanUser(targetUserId);
  }
}
