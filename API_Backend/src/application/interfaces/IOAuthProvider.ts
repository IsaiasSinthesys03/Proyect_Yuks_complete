import { OAuthProfile } from '../../domain/types/OAuthDTOs';

/**
 * Puerto del Proveedor OAuth 2.0 (Fase 29).
 *
 * Abstrae el flujo Authorization Code de un proveedor externo (Google).
 * Los Use Cases obtienen un `OAuthProfile` normalizado sin conocer los detalles
 * del endpoint de tokens ni de userinfo del proveedor concreto.
 */
export interface IOAuthProvider {
  /**
   * Construye la URL de autorización a la que se redirige al usuario.
   * @param state Valor anti-CSRF que el proveedor devolverá sin modificar.
   */
  getAuthorizationUrl(state: string): string;

  /**
   * Intercambia el `code` recibido en el callback por el perfil del usuario.
   * @throws OAuthExchangeError si el intercambio falla.
   */
  exchangeCodeForProfile(code: string): Promise<OAuthProfile>;
}
