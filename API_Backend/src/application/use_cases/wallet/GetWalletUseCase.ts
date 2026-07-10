import { IWalletRepository } from '../../interfaces/IWalletRepository';
import { WalletSummaryDTO } from '../../../domain/types/WalletDTOs';

/**
 * Caso de Uso: Obtener el resumen del Monedero (REQ-FE-20).
 *
 * Si `expiresAt` ya pasó, el saldo se reporta como 0 (saldo expirado),
 * sin necesidad de mutar la BD — la expiración es puramente de lectura
 * hasta que un nuevo movimiento dispare la lógica del repositorio.
 */
export class GetWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(userId: string): Promise<WalletSummaryDTO> {
    const wallet = await this.walletRepository.getOrCreate(userId);

    const isExpired = wallet.expiresAt !== null && wallet.expiresAt.getTime() < Date.now();

    return {
      balance: isExpired ? 0 : wallet.balance,
      expiresAt: wallet.expiresAt,
    };
  }
}
