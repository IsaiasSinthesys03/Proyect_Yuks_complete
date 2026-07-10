import { IAddressRepository } from '../../interfaces/IAddressRepository';
import { AddressNotFoundError } from '../../../domain/errors/CheckoutErrors';

/**
 * Caso de Uso: Eliminar una dirección (REQ-FE-17).
 *
 * Si la dirección eliminada era la predeterminada, promueve otra
 * dirección restante del usuario como nueva default (si existe alguna).
 */
export class DeleteAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const existing = await this.addressRepository.findById(addressId, userId);
    if (!existing) {
      throw new AddressNotFoundError(addressId);
    }

    await this.addressRepository.delete(addressId, userId);

    if (existing.isDefault) {
      const remaining = await this.addressRepository.findByUserId(userId);
      if (remaining.length > 0) {
        await this.addressRepository.setDefault(remaining[0].id, userId);
      }
    }
  }
}
