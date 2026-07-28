import { IAddressRepository } from '../../interfaces/IAddressRepository';
import { CreateAddressDTO } from '../../../domain/types/AddressDTOs';
import { Address } from '../../../domain/entities/Address';
import { isKnownCountryCode } from '../../../domain/services/ShippingCoveragePolicy';
import { InvalidShippingAddressError } from '../../../domain/errors/CheckoutErrors';

/**
 * Caso de Uso: Crear una nueva dirección (REQ-FE-09, REQ-FE-17).
 *
 * Si es la primera dirección del usuario, se marca automáticamente
 * como predeterminada (isDefault = true).
 */
export class CreateAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(userId: string, data: CreateAddressDTO): Promise<Address> {
    if (!isKnownCountryCode(data.countryCode)) {
      throw new InvalidShippingAddressError('El código de país no existe en ISO-3166-1 alpha-2.');
    }
    const existingAddresses = await this.addressRepository.findByUserId(userId);
    const isFirstAddress = existingAddresses.length === 0;

    const address = await this.addressRepository.create(userId, data);

    if (isFirstAddress) {
      await this.addressRepository.setDefault(address.id, userId);
      return { ...address, isDefault: true };
    }

    return address;
  }
}
