import { IWalletRepository } from '../../interfaces/IWalletRepository';
import { WalletLedgerDTO } from '../../../domain/types/WalletDTOs';

/** Caso de Uso: Obtener el historial paginado de movimientos del Monedero (REQ-FE-20). */
export class GetWalletLedgerUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(userId: string, page: number, limit: number): Promise<WalletLedgerDTO> {
    const wallet = await this.walletRepository.getOrCreate(userId);
    return this.walletRepository.getTransactions(wallet.id, page, limit);
  }
}
