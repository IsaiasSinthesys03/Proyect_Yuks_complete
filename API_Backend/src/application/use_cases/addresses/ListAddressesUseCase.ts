import { IAddressRepository } from '../../interfaces/IAddressRepository';
import { Address } from '../../../domain/entities/Address';

/** Caso de Uso: Listar la libreta de direcciones del usuario (REQ-FE-17). */
export class ListAddressesUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(userId: string): Promise<Address[]> {
    return this.addressRepository.findByUserId(userId);
  }
}
