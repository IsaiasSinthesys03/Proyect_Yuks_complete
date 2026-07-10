import { IOAuthProvider } from '../../../application/interfaces/IOAuthProvider';
import { OAuthProfile } from '../../../domain/types/OAuthDTOs';
import { OAuthExchangeError } from '../../../domain/errors/AdvancedAuthErrors';

/**
 * Proveedor OAuth 2.0 de Google (Authorization Code flow) — Fase 29.
 *
 * Usa `fetch` global (Node 18+). No depende de ninguna librería de Google.
 *
 * Flujo:
 *   1. `getAuthorizationUrl` → se redirige al usuario a la pantalla de consentimiento.
 *   2. Google regresa al `redirectUri` con `?code=...&state=...`.
 *   3. `exchangeCodeForProfile` cambia el code por tokens y consulta userinfo.
 *
 * CONFIGURACIÓN: si faltan credenciales (dev sin OAuth), el constructor NO lanza;
 * el error emerge al primer intento real de intercambio (OAuthExchangeError),
 * igual que el patrón de degradación de S3.
 */
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export class GoogleOAuthProvider implements IOAuthProvider {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });
    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string): Promise<OAuthProfile> {
    if (!this.clientId || !this.clientSecret) {
      throw new OAuthExchangeError('El proveedor OAuth de Google no está configurado en el servidor.');
    }

    // 1. Intercambiar el authorization code por un access token.
    let tokenData: GoogleTokenResponse;
    try {
      const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });
      tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    } catch (err) {
      throw new OAuthExchangeError('No se pudo contactar al servidor de tokens de Google.');
    }

    if (!tokenData.access_token) {
      throw new OAuthExchangeError(
        tokenData.error_description || tokenData.error || 'Google rechazó el código de autorización.'
      );
    }

    // 2. Consultar el perfil del usuario con el access token.
    let userInfo: GoogleUserInfo;
    try {
      const userResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      userInfo = (await userResponse.json()) as GoogleUserInfo;
    } catch (err) {
      throw new OAuthExchangeError('No se pudo obtener el perfil de Google.');
    }

    if (!userInfo.sub || !userInfo.email) {
      throw new OAuthExchangeError('El perfil de Google no incluyó los datos requeridos.');
    }

    // Fallback de nombres: si Google no da given/family_name, se parte `name`.
    const [fallbackFirst, ...fallbackRest] = (userInfo.name ?? '').split(' ');

    return {
      providerId: userInfo.sub,
      email: userInfo.email.toLowerCase().trim(),
      firstName: userInfo.given_name || fallbackFirst || 'Usuario',
      lastName: userInfo.family_name || fallbackRest.join(' ') || 'Google',
    };
  }
}
