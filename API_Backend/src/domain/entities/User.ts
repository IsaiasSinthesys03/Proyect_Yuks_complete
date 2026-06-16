/**
 * Entidad de Dominio: User
 *
 * Representa al usuario autenticado del sistema Animayuks.
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 * Es la fuente de verdad dentro de la capa de dominio.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly isBanned: boolean;
  readonly createdAt: Date;
}

/**
 * Roles permitidos en el sistema.
 * CLIENT: Usuario estándar del e-commerce.
 * ADMIN: Administrador del CMS con acceso a la Intranet.
 */
export type UserRole = 'CLIENT' | 'ADMIN';
