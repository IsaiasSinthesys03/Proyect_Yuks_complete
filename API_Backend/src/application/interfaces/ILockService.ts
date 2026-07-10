/**
 * Puerto (Interfaz) del Servicio de Bloqueo Distribuido (Distributed Locking).
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la implementación concreta (Redis, etc.) debe cumplir.
 * Los Use Cases dependen de esta abstracción — no de ioredis directamente.
 *
 * USO PRINCIPAL: Bloqueo pesimista de stock durante el checkout (REQ-BE-01).
 * Cada variante de producto se bloquea por 10 minutos para prevenir
 * sobreventa mientras se procesa el pago.
 *
 * Key pattern: `stock-lock:${variantId}` con TTL 600s (10 min).
 */
export interface ILockService {
  /**
   * Intenta adquirir un lock exclusivo sobre una key.
   *
   * @param key - Identificador único del recurso a bloquear (ej. `stock-lock:uuid-variante`).
   * @param ttlSeconds - Tiempo de vida del lock en segundos. Si el proceso no lo libera,
   *                     se auto-libera después de este tiempo (safety net contra deadlocks).
   * @returns `true` si el lock fue adquirido exitosamente, `false` si otro proceso lo tiene.
   */
  acquireLock(key: string, ttlSeconds: number): Promise<boolean>;

  /**
   * Libera un lock previamente adquirido.
   *
   * La implementación DEBE verificar que el lock pertenece al proceso que lo solicita
   * (ej. usando un valor UUID único) para evitar liberar locks de otros procesos.
   *
   * @param key - Identificador del recurso a desbloquear.
   */
  releaseLock(key: string): Promise<void>;
}
