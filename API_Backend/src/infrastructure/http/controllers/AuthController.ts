import { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie'; // Side-effect import: habilita los tipos de request.cookies / reply.setCookie
import { RegisterUserUseCase, InvalidPhoneError } from '../../../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/usecases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../../../application/usecases/RefreshTokenUseCase';
import { ForgotPasswordUseCase } from '../../../application/use_cases/auth/ForgotPasswordUseCase';
import { ResetPasswordUseCase, WeakPasswordError } from '../../../application/use_cases/auth/ResetPasswordUseCase';
import { RequestOtpUseCase } from '../../../application/use_cases/auth/RequestOtpUseCase';
import { VerifyOtpUseCase } from '../../../application/use_cases/auth/VerifyOtpUseCase';
import { LogoutUseCase } from '../../../application/use_cases/auth/LogoutUseCase';
import { GoogleOAuthCallbackUseCase } from '../../../application/use_cases/auth/GoogleOAuthCallbackUseCase';
import { IOAuthProvider } from '../../../application/interfaces/IOAuthProvider';
import { RegisterUserDTO, LoginDTO } from '../../../domain/types/AuthDTOs';
import { ForgotPasswordDTO, ResetPasswordDTO } from '../../../domain/types/PasswordRecoveryDTOs';
import { RequestOtpDTO, VerifyOtpDTO } from '../../../domain/types/OtpDTOs';
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserBannedError,
  TermsNotAcceptedError,
  InvalidRefreshTokenError,
} from '../../../domain/errors/AuthErrors';
import {
  InvalidResetTokenError,
  ResetTokenExpiredError,
  RefreshTokenReuseError,
  InvalidOtpError,
  OtpNotValidError,
  OAuthExchangeError,
} from '../../../domain/errors/AdvancedAuthErrors';

import * as crypto from 'crypto';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_COOKIE_PATH = '/api/auth/refresh';
const OAUTH_STATE_COOKIE_NAME = 'oauth_state';

/**
 * Atributos de seguridad estrictos para la cookie del Refresh Token (Q19).
 * `path` la restringe para que el navegador SOLO la envíe al pegarle a
 * `/api/auth/refresh` — nunca viaja en el resto de las peticiones a la API.
 */
function refreshTokenCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: maxAgeSeconds,
  };
}

/**
 * Controlador HTTP de Autenticación.
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * - Extrae el body (DTO) del request de Fastify.
 * - Invoca el Use Case correspondiente.
 * - Traduce errores de dominio a códigos HTTP apropiados.
 *
 * NO contiene lógica de negocio. Eso vive en los Use Cases.
 */
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly requestOtpUseCase: RequestOtpUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly googleOAuthCallbackUseCase: GoogleOAuthCallbackUseCase,
    private readonly oauthProvider: IOAuthProvider,
  ) {}

  /**
   * POST /register
   * Registra un nuevo usuario en el sistema.
   */
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as RegisterUserDTO;

      const user = await this.registerUseCase.execute(dto);

      return reply.status(201).send({
        statusCode: 201,
        message: 'Usuario registrado exitosamente.',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /login
   * Autentica un usuario existente y retorna un JWT.
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as LoginDTO;

      const { refreshToken, ...publicResponse } = await this.loginUseCase.execute(dto);

      // SEGURIDAD: el Refresh Token JAMÁS se incluye en el body JSON.
      // Viaja exclusivamente como cookie HttpOnly, restringida a /api/auth/refresh.
      reply.setCookie(
        REFRESH_TOKEN_COOKIE_NAME,
        refreshToken,
        refreshTokenCookieOptions(7 * 24 * 60 * 60)
      );

      return reply.status(200).send({
        statusCode: 200,
        message: 'Inicio de sesión exitoso.',
        data: publicResponse,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /refresh
   * Renueva el Access Token leyendo EXCLUSIVAMENTE la cookie HttpOnly
   * `refreshToken` — nunca acepta el token vía body o header.
   */
  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

      if (!refreshToken) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No se encontró la cookie de sesión. Inicia sesión nuevamente.',
        });
      }

      const result = await this.refreshTokenUseCase.execute(refreshToken);

      // Rotación: se reemplaza la cookie con el nuevo refresh token.
      reply.setCookie(
        REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        refreshTokenCookieOptions(7 * 24 * 60 * 60)
      );

      return reply.status(200).send({
        statusCode: 200,
        message: 'Sesión renovada exitosamente.',
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /forgot-password
   * ▓ ANTI-ENUMERACIÓN ▓ Responde SIEMPRE 202, exista o no el email.
   */
  async forgotPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as ForgotPasswordDTO;
      if (!dto?.email) {
        // Incluso ante input faltante damos la misma respuesta neutra.
        return reply.status(202).send({
          statusCode: 202,
          message: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
        });
      }

      await this.forgotPasswordUseCase.execute(dto);

      return reply.status(202).send({
        statusCode: 202,
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
      });
    } catch (error) {
      // Incluso si algo interno falla, NO revelamos detalles: log interno + 202.
      console.error('❌ Error interno en forgotPassword (no expuesto al cliente):', error);
      return reply.status(202).send({
        statusCode: 202,
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
      });
    }
  }

  /**
   * POST /reset-password
   * Restablece la contraseña usando el token del enlace.
   */
  async resetPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as ResetPasswordDTO;
      await this.resetPasswordUseCase.execute(dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Contraseña actualizada exitosamente. Todas las sesiones anteriores fueron cerradas.',
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /otp/request  (requiere JWT)
   * Solicita un OTP para cambiar el email o teléfono del usuario autenticado.
   */
  async requestOtp(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const dto = request.body as RequestOtpDTO;
      await this.requestOtpUseCase.execute(userId, dto);

      return reply.status(202).send({
        statusCode: 202,
        message: 'Enviamos un código de verificación a tu correo actual.',
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /otp/verify  (requiere JWT)
   * Confirma el cambio de email/teléfono con el código recibido.
   */
  async verifyOtp(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const dto = request.body as VerifyOtpDTO;
      await this.verifyOtpUseCase.execute(userId, dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Cambio confirmado exitosamente.',
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /logout
   * Revoca la familia de refresh tokens y limpia la cookie.
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
      await this.logoutUseCase.execute(refreshToken);

      reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: REFRESH_TOKEN_COOKIE_PATH });

      return reply.status(200).send({
        statusCode: 200,
        message: 'Sesión cerrada exitosamente.',
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * GET /oauth/google
   * Redirige al usuario a la pantalla de consentimiento de Google, sembrando
   * un `state` anti-CSRF en una cookie efímera.
   */
  async googleRedirect(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const state = crypto.randomBytes(16).toString('hex');
    reply.setCookie(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/oauth',
      maxAge: 600, // 10 min
    });
    const url = this.oauthProvider.getAuthorizationUrl(state);
    return reply.redirect(url);
  }

  /**
   * GET /oauth/google/callback?code=...&state=...
   * Valida el `state`, intercambia el code y establece la sesión.
   */
  async googleCallback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as { code?: string; state?: string };
      const cookieState = request.cookies?.[OAUTH_STATE_COOKIE_NAME];

      if (!query.code) {
        return reply.status(400).send({
          statusCode: 400, error: 'Bad Request', message: 'Falta el parámetro "code".',
        });
      }
      // Validación anti-CSRF del state.
      if (!query.state || !cookieState || query.state !== cookieState) {
        return reply.status(400).send({
          statusCode: 400, error: 'Bad Request', message: 'Estado OAuth inválido. Reintenta el inicio de sesión.',
        });
      }
      reply.clearCookie(OAUTH_STATE_COOKIE_NAME, { path: '/api/auth/oauth' });

      const { refreshToken, ...publicResponse } = await this.googleOAuthCallbackUseCase.execute(query.code);

      reply.setCookie(
        REFRESH_TOKEN_COOKIE_NAME,
        refreshToken,
        refreshTokenCookieOptions(7 * 24 * 60 * 60)
      );

      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',')[0]
        .trim();

      return reply.redirect(frontendUrl);
    } catch (error) {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',')[0]
        .trim();
      return reply.redirect(`${frontendUrl}?auth_error=oauth_failed`);
    }
  }

  /**
   * Traductor centralizado: Errores de Dominio → Códigos HTTP.
   *
   * Mapeo según el SRS y las resoluciones de casos límite:
   * - UserAlreadyExistsError → 409 Conflict
   * - InvalidCredentialsError → 401 Unauthorized
   * - UserBannedError → 403 Forbidden
   * - TermsNotAcceptedError → 422 Unprocessable Entity
   * - Error genérico → 500 Internal Server Error
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    // ── Fase 29: Auth avanzada ──
    if (error instanceof RefreshTokenReuseError) {
      // Reúso detectado: limpiar la cookie de sesión comprometida.
      reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: REFRESH_TOKEN_COOKIE_PATH });
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: error.message });
      return;
    }

    if (error instanceof InvalidResetTokenError || error instanceof ResetTokenExpiredError) {
      reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: error.message });
      return;
    }

    if (error instanceof WeakPasswordError) {
      reply.status(422).send({ statusCode: 422, error: 'Unprocessable Entity', message: error.message });
      return;
    }

    if (error instanceof InvalidOtpError) {
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: error.message });
      return;
    }

    if (error instanceof OtpNotValidError) {
      reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: error.message });
      return;
    }

    if (error instanceof OAuthExchangeError) {
      reply.status(502).send({ statusCode: 502, error: 'Bad Gateway', message: error.message });
      return;
    }

    if (error instanceof UserAlreadyExistsError) {
      reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: error.message,
      });
      return;
    }

    if (error instanceof InvalidRefreshTokenError) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: error.message,
      });
      return;
    }

    if (error instanceof InvalidCredentialsError) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: error.message,
      });
      return;
    }

    if (error instanceof UserBannedError) {
      reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: error.message,
      });
      return;
    }

    if (error instanceof TermsNotAcceptedError || error instanceof InvalidPhoneError) {
      reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: error.message,
      });
      return;
    }

    // Error no controlado → 500
    console.error('❌ Error inesperado en AuthController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
