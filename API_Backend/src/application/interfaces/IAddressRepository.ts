import { Address } from '../../domain/entities/Address';
import { CreateAddressDTO, UpdateAddressDTO } from '../../domain/types/AddressDTOs';

/**
 * Puerto (Interfaz) del Repositorio de Direcciones.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 * - Solo recibe y devuelve Entidades de Dominio y DTOs.
 * - Jamás expone tipos de Kysely, SQL, o cualquier detalle de persistencia.
 */
export interface IAddressRepository {
  /**
   * Lista todas las direcciones de un usuario.
   * Ordenadas por isDefault DESC, createdAt DESC.
   */
  findByUserId(userId: string): Promise<Address[]>;

  /**
   * Busca una dirección por su ID, filtrada por usuario para seguridad.
   */
  findById(addressId: string, userId: string): Promise<Address | null>;

  /**
   * Crea una nueva dirección para un usuario.
   */
  create(userId: string, data: CreateAddressDTO): Promise<Address>;

  /**
   * Actualiza una dirección existente.
   * Verifica que la dirección pertenece al usuario.
   */
  update(addressId: string, userId: string, data: UpdateAddressDTO): Promise<Address>;

  /**
   * Elimina una dirección.
   * Verifica que la dirección pertenece al usuario.
   */
  delete(addressId: string, userId: string): Promise<void>;

  /**
   * Marca una dirección como predeterminada.
   * DEBE desmarcar la dirección predeterminada anterior en la misma transacción
   * para garantizar que solo exista una predeterminada por usuario.
   */
  setDefault(addressId: string, userId: string): Promise<void>;
}
