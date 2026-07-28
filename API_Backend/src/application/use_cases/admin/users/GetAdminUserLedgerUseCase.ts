import { IUserRepository } from '../../../interfaces/IUserRepository';
import { IWalletRepository } from '../../../interfaces/IWalletRepository';
import { WalletTransaction } from '../../../../domain/entities/WalletTransaction';
import { PaginatedResponseDTO } from '../../../../domain/types/ProductDTOs';
import { UserNotFoundAdminError } from '../../../../domain/errors/AdminErrors';

/**
 * Consulta administrativa, de solo lectura, del ledger de un cliente.
 * A diferencia del endpoint de perfil, el userId objetivo viene de la ruta y
 * no de `request.user.sub`. No crea una wallet vacía como efecto secundario.
 */
export class GetAdminUserLedgerUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(
    targetUserId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDTO<WalletTransaction>> {
    const user = await this.userRepository.findById(targetUserId);
    if (!user) throw new UserNotFoundAdminError(targetUserId);

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const wallet = await this.walletRepository.findByUserId(targetUserId);

    if (!wallet) {
      return { data: [], total: 0, page: safePage, limit: safeLimit, totalPages: 0 };
    }

    return this.walletRepository.getTransactions(wallet.id, safePage, safeLimit);
  }
}
