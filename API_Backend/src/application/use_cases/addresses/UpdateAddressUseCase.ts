import { IAddressRepository } from '../../interfaces/IAddressRepository';
import { UpdateAddressDTO } from '../../../domain/types/AddressDTOs';
import { Address } from '../../../domain/entities/Address';
import { AddressNotFoundError } from '../../../domain/errors/CheckoutErrors';

/** Caso de Uso: Actualizar una dirección existente (REQ-FE-17). */
export class UpdateAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string, data: UpdateAddressDTO): Promise<Address> {
    const existing = await this.addressRepository.findById(addressId, userId);
    if (!existing) {
      throw new AddressNotFoundError(addressId);
    }

    return this.addressRepository.update(addressId, userId, data);
  }
}
