import { IGameApiClient } from '../../../application/interfaces/IGameApiClient';

/**
 * Implementación concreta de IGameApiClient (Game Bridge M2M).
 *
 * Resolución #6 (Anti-fraude): Si el servidor del juego no responde
 * (timeout, conexión rechazada, error HTTP, etc.), el fallback seguro
 * es 'NOT_FOUND' — esto permite que la cancelación del pedido proceda
 * en vez de bloquear al usuario por un problema ajeno a su compra.
 */
export class GameApiClient implements IGameApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly m2mToken: string
  ) {}

  async checkRewardStatus(code: string): Promise<'NOT_FOUND' | 'AVAILABLE' | 'CLAIMED'> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rewards/${code}/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.m2mToken}`,
        },
      });

      if (response.status === 404) {
        return 'NOT_FOUND';
      }

      if (!response.ok) {
        return 'NOT_FOUND';
      }

      const data = (await response.json()) as { status?: string };

      if (data.status === 'CLAIMED') return 'CLAIMED';
      if (data.status === 'AVAILABLE') return 'AVAILABLE';

      return 'NOT_FOUND';
    } catch {
      // Game Server offline, timeout, DNS, etc. — fallback seguro.
      return 'NOT_FOUND';
    }
  }
}
