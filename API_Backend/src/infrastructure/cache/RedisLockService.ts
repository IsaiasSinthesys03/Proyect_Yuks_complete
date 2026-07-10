import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';
import { ILockService } from '../../application/interfaces/ILockService';

/**
 * Implementación concreta de ILockService usando Redis (Distributed Locking).
 *
 * USO PRINCIPAL: Bloqueo pesimista de stock durante el checkout (REQ-BE-01).
 * Key pattern: `stock-lock:${variantId}` con TTL 600s (10 min).
 *
 * Cada lock adquirido guarda un valor único (UUID) en memoria local para que
 * `releaseLock` sólo borre la key si el token coincide (evita liberar el lock
 * de otro proceso que haya re-adquirido la misma key tras una expiración).
 */
export class RedisLockService implements ILockService {
  private readonly tokens = new Map<string, string>();

  constructor(private readonly redis: Redis) {}

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const token = randomUUID();
    const result = await this.redis.set(key, token, 'EX', ttlSeconds, 'NX');

    if (result === 'OK') {
      this.tokens.set(key, token);
      return true;
    }

    return false;
  }

  async releaseLock(key: string): Promise<void> {
    const token = this.tokens.get(key);
    if (!token) return;

    // Lua script: borra la key SOLO si el valor coincide con el token que adquirió el lock.
    // Evita la condición de carrera donde el TTL expira, otro proceso adquiere el lock,
    // y este proceso lo libera "a ciegas" destruyendo el lock ajeno.
    const releaseScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    await this.redis.eval(releaseScript, 1, key, token);
    this.tokens.delete(key);
  }
}
