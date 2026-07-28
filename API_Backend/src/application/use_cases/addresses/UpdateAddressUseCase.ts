import { IAddressRepository } from '../../interfaces/IAddressRepository';
import { UpdateAddressDTO } from '../../../domain/types/AddressDTOs';
import { Address } from '../../../domain/entities/Address';
import { AddressNotFoundError } from '../../../domain/errors/CheckoutErrors';
import { InvalidShippingAddressError } from '../../../domain/errors/CheckoutErrors';
import { isKnownCountryCode } from '../../../domain/services/ShippingCoveragePolicy';

/** Caso de Uso: Actualizar una dirección existente (REQ-FE-17). */
export class UpdateAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string, data: UpdateAddressDTO): Promise<Address> {
    if (data.countryCode !== undefined && !isKnownCountryCode(data.countryCode)) {
      throw new InvalidShippingAddressError('El código de país no existe en ISO-3166-1 alpha-2.');
    }
    const existing = await this.addressRepository.findById(addressId, userId);
    if (!existing) {
      throw new AddressNotFoundError(addressId);
    }

    return this.addressRepository.update(addressId, userId, data);
  }
}
