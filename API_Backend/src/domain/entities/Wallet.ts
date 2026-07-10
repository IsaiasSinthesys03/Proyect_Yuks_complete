/**
 * Entidad de Dominio: Wallet
 *
 * Representa el monedero virtual de un usuario (REQ-FE-20, REQ-BE-01).
 *
 * Reglas de negocio críticas:
 *   - Q8: El balance NUNCA puede ser negativo. A nivel de BD existe un
 *     CHECK (balance >= 0) como red de seguridad final.
 *   - Resolución #4: Saldo Global y Renovable. Cada ingreso de saldo
 *     actualiza `expiresAt` a NOW() + 12 meses.
 *
 * Relación 1:1 con User. Se crea con lazy initialization (balance 0)
 * la primera vez que el usuario consulta su perfil.
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface Wallet {
  readonly id: string;
  readonly userId: string;
  readonly balance: number;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
