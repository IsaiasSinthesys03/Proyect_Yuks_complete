import { IUserRepository } from '../../../interfaces/IUserRepository';
import { User } from '../../../../domain/entities/User';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import {
  SelfBanNotAllowedError,
  UserNotFoundAdminError,
} from '../../../../domain/errors/AdminErrors';

export class BanUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(targetUserId: string, context: AdminAuditContext): Promise<User> {
    // Protección anti-auto-ban: un admin no puede suspender su propia cuenta
    if (context.adminId === targetUserId) {
      throw new SelfBanNotAllowedError();
    }

    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new UserNotFoundAdminError(targetUserId);

    return this.userRepo.banUser(targetUserId);
  }
}
