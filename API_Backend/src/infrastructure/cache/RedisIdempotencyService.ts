import { Redis } from 'ioredis';
import { IIdempotencyService } from '../../application/interfaces/IIdempotencyService';

/**
 * Implementación concreta de IIdempotencyService usando Redis.
 *
 * USO PRINCIPAL: Prevenir doble procesamiento del checkout (Q2).
 * Key pattern: `idempotency:${key}` con TTL 86400s (24h).
 */
export class RedisIdempotencyService implements IIdempotencyService {
  private static readonly KEY_PREFIX = 'idempotency:';

  constructor(private readonly redis: Redis) {}

  async check(key: string): Promise<boolean> {
    const exists = await this.redis.exists(this.buildKey(key));
    return exists === 1;
  }

  async set(key: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.buildKey(key), '1', 'EX', ttlSeconds);
  }

  private buildKey(key: string): string {
    return `${RedisIdempotencyService.KEY_PREFIX}${key}`;
  }
}
