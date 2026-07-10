/**
 * Puerto (Interfaz) del Servicio de Idempotencia.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la implementación concreta (Redis, etc.) debe cumplir.
 * Los Use Cases dependen de esta abstracción — no de ioredis directamente.
 *
 * USO PRINCIPAL: Prevenir doble procesamiento del checkout (Q2).
 * El frontend genera la key usando `crypto.randomUUID()` al entrar a la vista
 * de Checkout y la envía en el header `X-Idempotency-Key`. El backend la
 * almacena con un TTL de 24 horas.
 *
 * Key pattern: `idempotency:${key}` con TTL 86400s (24h).
 */
export interface IIdempotencyService {
  /**
   * Verifica si una idempotency key ya fue procesada.
   *
   * @param key - La key generada por el frontend (UUID v4).
   * @returns `true` si la key ya existe (operación duplicada), `false` si es nueva.
   */
  check(key: string): Promise<boolean>;

  /**
   * Registra una idempotency key con un tiempo de vida.
   *
   * @param key - La key a registrar.
   * @param ttlSeconds - Tiempo de vida en segundos (Q2: 86400 = 24h).
   */
  set(key: string, ttlSeconds: number): Promise<void>;
}
