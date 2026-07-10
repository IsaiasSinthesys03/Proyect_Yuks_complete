/**
 * Puerto (Interfaz) del Cliente API del Videojuego (Game Bridge M2M).
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la implementación concreta (HTTP Client) debe cumplir.
 * Los Use Cases dependen de esta abstracción — no de fetch/axios directamente.
 *
 * USO PRINCIPAL: Consultar el estado de un código de recompensa en el
 * backend del videojuego durante la cancelación de un pedido (Resolución #6).
 *
 * AUTENTICACIÓN (Q11): La implementación concreta usa un Service Account Token
 * (JWT estático de larga duración) en el header Authorization: Bearer <M2M_TOKEN>.
 * El Rate Limiting se desactiva para las IPs del Game Server.
 */
export interface IGameApiClient {
  /**
   * Consulta al backend del videojuego si un código de recompensa
   * ya fue canjeado in-game.
   *
   * Resolución #6 (Anti-fraude):
   *   - Si retorna 'CLAIMED': El backend DEBE bloquear la cancelación
   *     del pedido asociado ("No puedes cancelar porque ya reclamaste
   *     la recompensa virtual. Contacta a soporte.").
   *   - Si retorna 'AVAILABLE': El código puede ser revocado y la
   *     cancelación procede normalmente.
   *   - Si retorna 'NOT_FOUND': El servidor del juego no conoce el código.
   *     Se trata como 'AVAILABLE' para permitir la cancelación
   *     (fallback seguro si el Game Server está offline).
   *
   * @param code - UUID del código de recompensa a consultar.
   * @returns El estado del código según el backend del juego.
   */
  checkRewardStatus(code: string): Promise<'NOT_FOUND' | 'AVAILABLE' | 'CLAIMED'>;
}
