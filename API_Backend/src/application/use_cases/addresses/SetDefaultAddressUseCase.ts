import { IAddressRepository } from '../../interfaces/IAddressRepository';
import { AddressNotFoundError } from '../../../domain/errors/CheckoutErrors';

/**
 * Caso de Uso: Marcar una dirección como predeterminada (REQ-FE-17).
 *
 * La implementación del repositorio se encarga de desmarcar la
 * default anterior dentro de la misma transacción.
 */
export class SetDefaultAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const existing = await this.addressRepository.findById(addressId, userId);
    if (!existing) {
      throw new AddressNotFoundError(addressId);
    }

    await this.addressRepository.setDefault(addressId, userId);
  }
}
