import { Coupon } from '../../domain/entities/Coupon';
import { CreateCouponDTO, UpdateCouponDTO } from '../../domain/types/AdminCouponDTOs';
import { AdminAuditContext } from '../../domain/types/AdminTypes';

/**
 * Puerto (Interfaz) del Repositorio de Cupones.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 * - Solo recibe y devuelve Entidades de Dominio.
 * - Jamás expone tipos de Kysely, SQL, o cualquier detalle de persistencia.
 */
export interface ICouponRepository {
  /**
   * Busca un cupón por su código de forma case-insensitive.
   * La implementación debe usar UPPER(code) o equivalente para
   * garantizar que "VERANO26" y "verano26" encuentren el mismo registro.
   */
  findByCode(code: string): Promise<Coupon | null>;

  /**
   * Consume un uso del cupón de forma ATÓMICA y condicional (VULN-01, Fase 30).
   *
   * Ejecuta `UPDATE coupons SET current_uses = current_uses + 1
   *          WHERE id = $1 AND current_uses < max_uses` y devuelve `true`
   * SOLO si efectivamente afectó una fila (`numUpdatedRows > 0`).
   *
   * Esta es la ÚNICA forma correcta de garantizar, bajo concurrencia extrema,
   * que un cupón con `max_uses = 1` no se consuma dos veces: la condición
   * `current_uses < max_uses` se evalúa dentro del mismo statement atómico,
   * eliminando la ventana read-check-then-write. Si devuelve `false`, el
   * cupón se agotó en una carrera y el llamador debe abortar/compensar.
   */
  incrementUsage(couponId: string): Promise<boolean>;

  // ==========================================
  // Métodos de escritura CMS (Fase 24)
  // ==========================================

  /** Lista todos los cupones para el CMS (Fase 30, GET endpoint). */
  findAllCoupons(): Promise<Coupon[]>;

  /** Busca un cupón por su ID primario. */
  findCouponById(id: string): Promise<Coupon | null>;

  /** Crea un cupón. Lanza error de BD si el código ya existe (UNIQUE). */
  createCoupon(data: CreateCouponDTO, context: AdminAuditContext): Promise<Coupon>;

  /**
   * Actualiza campos de un cupón. Devuelve null si el id no existe.
   * Lanza error de BD si el nuevo código entra en conflicto (UNIQUE).
   */
  updateCoupon(id: string, data: UpdateCouponDTO, context: AdminAuditContext): Promise<Coupon | null>;

  /** Invierte el flag `is_active` del cupón. Devuelve null si el id no existe. */
  toggleActive(id: string, context: AdminAuditContext): Promise<Coupon | null>;
}
