import { User } from '../../domain/entities/User';
import { Profile } from '../../domain/entities/Profile';
import { PaginatedResponseDTO } from '../../domain/types/ProductDTOs';
import { AdminUserCrmDTO } from '../../domain/types/AdminUserDTOs';
import { AdminAuditContext } from '../../domain/types/AdminTypes';

/**
 * Puerto (Interfaz) del Repositorio de Usuarios.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 * - Solo recibe y devuelve Entidades de Dominio (User, Profile).
 * - Jamás expone tipos de Kysely, SQL, o cualquier detalle de persistencia.
 * - Los Use Cases dependen de esta abstracción, no de la implementación concreta.
 *
 * NOTA (sincronización 2026-07-06): esta interfaz llevaba ~10 métodos de
 * retraso frente a la implementación (2FA, OAuth, admin, ban, gamificación) —
 * `tsc --noEmit` fallaba con 17 errores aunque el runtime (tsx) funcionara.
 * Se declararon aquí con las firmas EXACTAS de `UserRepository`.
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
   * Fase 33 (compliance): sella `privacyAccepted` (+ timestamp en la impl) y
   * persiste el teléfono obligatorio del registro (REQ-FE-08).
   *
   * @returns El usuario recién creado (sin el perfil en el retorno directo).
   */
  createWithProfile(userData: {
    email: string;
    passwordHash: string;
    role: string;
    privacyAccepted: boolean;
  }, profileData: {
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<User>;

  /**
   * Obtiene el perfil asociado a un userId.
   * @returns El perfil del usuario, o null si no se encuentra.
   */
  findProfileByUserId(userId: string): Promise<Profile | null>;

  /**
   * Actualiza nombre/apellido del perfil (REQ-FE-16). Email y teléfono NO se
   * tocan aquí — exigen el flujo OTP (updateEmail / updateProfilePhone).
   */
  updateProfile(userId: string, data: { firstName?: string; lastName?: string }): Promise<Profile>;

  // ─────────────────────────────────────────────────────────────
  // Administración (CMS) — Fase 21+
  // ─────────────────────────────────────────────────────────────

  /**
   * Crea un usuario ADMIN + perfil en una transacción (Easter Egg, CMS-FE-02).
   * El rol se fija DENTRO de la implementación ('ADMIN'), jamás como parámetro:
   * evita la escalación de privilegios por manipulación del payload.
   */
  createAdmin(userData: {
    email: string;
    passwordHash: string;
  }, profileData: {
    firstName: string;
    lastName: string;
  }): Promise<User>;

  /**
   * Listado paginado y seguro de clientes para el CRM (CMS-FE-14).
   * El adaptador devuelve un DTO dedicado: nunca expone passwordHash/TOTP.
   */
  findAllPaginated(page: number, limit: number): Promise<PaginatedResponseDTO<AdminUserCrmDTO>>;

  /** Banea a un usuario (CMS-FE-14). @returns el usuario actualizado. */
  banUser(userId: string, context: AdminAuditContext): Promise<User>;

  /** Levanta el baneo de un usuario (CMS-FE-14). @returns el usuario actualizado. */
  unbanUser(userId: string, context: AdminAuditContext): Promise<User>;

  // ─────────────────────────────────────────────────────────────
  // Credenciales y verificación (Fase 29 — Auth avanzada)
  // ─────────────────────────────────────────────────────────────

  /** Reemplaza el hash de contraseña (flujo forgot/reset-password). */
  updatePassword(userId: string, passwordHash: string): Promise<void>;

  /** Aplica el cambio de email YA VERIFICADO por OTP (REQ-FE-16). */
  updateEmail(userId: string, email: string): Promise<void>;

  /** Aplica el cambio de teléfono YA VERIFICADO por OTP (REQ-FE-16). */
  updateProfilePhone(userId: string, phone: string): Promise<void>;

  // ─────────────────────────────────────────────────────────────
  // 2FA TOTP para administradores (REQ-SEC-09)
  // ─────────────────────────────────────────────────────────────

  /** Guarda el secreto TOTP generado en el setup (aún no habilitado). */
  setTotpSecret(userId: string, secret: string): Promise<void>;

  /** Marca el 2FA como habilitado/deshabilitado tras confirmar el código. */
  setTotpEnabled(userId: string, enabled: boolean): Promise<void>;

  // ─────────────────────────────────────────────────────────────
  // OAuth 2.0 Google (Fase 29)
  // ─────────────────────────────────────────────────────────────

  /** Busca un usuario por su Google ID (sub del ID token). */
  findByGoogleId(googleId: string): Promise<User | null>;

  /** Vincula un Google ID a una cuenta existente (mismo email verificado). */
  linkGoogleId(userId: string, googleId: string): Promise<void>;

  /** Crea un usuario nuevo a partir del perfil de Google (rol CLIENT). */
  createOAuthUser(userData: {
    email: string;
    passwordHash: string;
    googleId: string;
  }, profileData: {
    firstName: string;
    lastName: string;
  }): Promise<User>;

  // ─────────────────────────────────────────────────────────────
  // Gamificación (Fase 31 — Tiers de XP)
  // ─────────────────────────────────────────────────────────────

  /** Suma puntos de experiencia al perfil. @returns el perfil actualizado. */
  addExperiencePoints(userId: string, points: number): Promise<Profile>;

  /** Actualiza el tier de lealtad (BRONZE/SILVER/GOLD/PLATINUM). @returns el perfil actualizado. */
  updateTierLevel(userId: string, tier: string): Promise<Profile>;
}
