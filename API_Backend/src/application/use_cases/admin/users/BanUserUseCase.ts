import { IUserRepository } from '../../../interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../../../interfaces/IRefreshTokenRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { AdminUserBanStatusDTO } from '../../../../domain/types/AdminUserDTOs';
import {
  SelfBanNotAllowedError,
  UserNotFoundAdminError,
} from '../../../../domain/errors/AdminErrors';

export class BanUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(targetUserId: string, context: AdminAuditContext): Promise<AdminUserBanStatusDTO> {
    // Protección anti-auto-ban: un admin no puede suspender su propia cuenta
    if (context.adminId === targetUserId) {
      throw new SelfBanNotAllowedError();
    }

    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new UserNotFoundAdminError(targetUserId);

    const bannedUser = await this.userRepo.banUser(targetUserId, context);
    await this.refreshTokenRepository.revokeAllForUser(targetUserId);
    return { id: bannedUser.id, isBanned: bannedUser.isBanned };
  }
}
