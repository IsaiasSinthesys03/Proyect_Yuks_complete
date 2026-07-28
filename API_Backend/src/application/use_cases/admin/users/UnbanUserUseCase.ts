import { IUserRepository } from '../../../interfaces/IUserRepository';
import { UserNotFoundAdminError } from '../../../../domain/errors/AdminErrors';
import { AdminUserBanStatusDTO } from '../../../../domain/types/AdminUserDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';

export class UnbanUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(targetUserId: string, context: AdminAuditContext): Promise<AdminUserBanStatusDTO> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new UserNotFoundAdminError(targetUserId);
    const unbannedUser = await this.userRepo.unbanUser(targetUserId, context);
    return { id: unbannedUser.id, isBanned: unbannedUser.isBanned };
  }
}
