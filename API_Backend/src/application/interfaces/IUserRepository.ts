import { User } from '../../domain/entities/User';
import { Profile } from '../../domain/entities/Profile';

/**
 * Puerto (Interfaz) del Repositorio de Usuarios.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 * - Solo recibe y devuelve Entidades de Dominio (User, Profile).
 * - Jamás expone tipos de Kysely, SQL, o cualquier detalle de persistencia.
 * - Los Use Cases dependen de esta abstracción, no de la implementación concreta.
 */
export interface IUserRepository {
  /**
   * Busca un usuario por su email.
   * @returns El usuario encontrado, o null si no existe.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca un usuario por su ID (UUID).
   * @returns El usuario encontrado, o null si no existe.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Crea un nuevo usuario junto con su perfil asociado en una sola transacción.
   * La implementación concreta (Kysely) debe garantizar atomicidad:
   * si falla la creación del perfil, el usuario tampoco debe persistirse.
   *
   * @returns El usuario recién creado (sin el perfil en el retorno directo).
   */
  createWithProfile(userData: {
    email: string;
    passwordHash: string;
    role: string;
  }, profileData: {
    firstName: string;
    lastName: string;
  }): Promise<User>;

  /**
   * Obtiene el perfil asociado a un userId.
   * @returns El perfil del usuario, o null si no se encuentra.
   */
  findProfileByUserId(userId: string): Promise<Profile | null>;
}
