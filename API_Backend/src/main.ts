import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
  console.log('📡 [Sentry Backend] Monitoreo de errores activo.');
}

// --- Infraestructura ---
import { db } from './infrastructure/database/client';
import { createRedisSubscriber, redisConnection } from './infrastructure/cache/redis-client';
import { BullMQQueueService } from './infrastructure/queues/BullMQQueueService';
import './infrastructure/queues/workers/email.worker';

// --- Repositorios (Adaptadores de Infraestructura) ---
import { UserRepository } from './infrastructure/database/repositories/UserRepository';
import { ProductRepository } from './infrastructure/database/repositories/ProductRepository';
import { AddressRepository } from './infrastructure/database/repositories/AddressRepository';
import { OrderRepository } from './infrastructure/database/repositories/OrderRepository';
import { WalletRepository } from './infrastructure/database/repositories/WalletRepository';
import { CouponRepository } from './infrastructure/database/repositories/CouponRepository';
import { RewardCodeRepository } from './infrastructure/database/repositories/RewardCodeRepository';
import { SystemSettingsRepository } from './infrastructure/database/repositories/SystemSettingsRepository';
import { AuditLogRepository } from './infrastructure/database/repositories/AuditLogRepository';

// --- Repositorios: Auth Avanzada (Fase 29) ---
import { RefreshTokenRepository } from './infrastructure/database/repositories/RefreshTokenRepository';
import { PasswordResetTokenRepository } from './infrastructure/database/repositories/PasswordResetTokenRepository';
import { OtpRepository } from './infrastructure/database/repositories/OtpRepository';

// --- Repositorios: CMS Contenido + Analytics (Fase 30) ---
import { BannerRepository } from './infrastructure/database/repositories/BannerRepository';
import { LegalDocumentRepository } from './infrastructure/database/repositories/LegalDocumentRepository';
import { AnalyticsRepository } from './infrastructure/database/repositories/AnalyticsRepository';

// --- Repositorios: Wishlist + Reportes (Fase 31) ---
import { WishlistRepository } from './infrastructure/database/repositories/WishlistRepository';
import { ReportRepository } from './infrastructure/database/repositories/ReportRepository';

// --- Repositorio: Notificaciones (Fase 32) ---
import { NotificationRepository } from './infrastructure/database/repositories/NotificationRepository';

// --- Repositorio: Inventario Admin (Fase 35) ---
import { AdminInventoryRepository } from './infrastructure/database/repositories/AdminInventoryRepository';

// --- Servicios de Infraestructura (Fase 14) ---
import { RedisLockService } from './infrastructure/cache/RedisLockService';
import { RedisIdempotencyService } from './infrastructure/cache/RedisIdempotencyService';
import { StripeAdapter } from './infrastructure/services/payment/StripeAdapter';
import { SimulatedPaymentAdapter } from './infrastructure/services/payment/SimulatedPaymentAdapter'; // TODO: STRIPE (solo dev)
import { GameApiClient } from './infrastructure/services/game_api/GameApiClient';

// --- Servicios de Infraestructura: Auth Avanzada (Fase 29) ---
import { TotpService } from './infrastructure/services/auth/TotpService';
import { GoogleOAuthProvider } from './infrastructure/services/auth/GoogleOAuthProvider';

// --- Casos de Uso: Auth y Catálogo (preexistentes) ---
import { RegisterUserUseCase } from './application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from './application/usecases/LoginUserUseCase';
import { RefreshTokenUseCase } from './application/usecases/RefreshTokenUseCase';

// --- Casos de Uso: Auth Avanzada (Fase 29) ---
import { ForgotPasswordUseCase } from './application/use_cases/auth/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from './application/use_cases/auth/ResetPasswordUseCase';
import { RequestOtpUseCase } from './application/use_cases/auth/RequestOtpUseCase';
import { VerifyOtpUseCase } from './application/use_cases/auth/VerifyOtpUseCase';
import { LogoutUseCase } from './application/use_cases/auth/LogoutUseCase';
import { GoogleOAuthCallbackUseCase } from './application/use_cases/auth/GoogleOAuthCallbackUseCase';
import { VerifyAdmin2faUseCase } from './application/use_cases/admin/VerifyAdmin2faUseCase';
import { Setup2faUseCase } from './application/use_cases/admin/Setup2faUseCase';
import { Enable2faUseCase } from './application/use_cases/admin/Enable2faUseCase';

import { GetProductsUseCase } from './application/usecases/GetProductsUseCase';
import { GetProductDetailUseCase } from './application/usecases/GetProductDetailUseCase';
import { GetTopProductsUseCase } from './application/usecases/GetTopProductsUseCase';
import { GetCategoriesUseCase } from './application/usecases/GetCategoriesUseCase';

// --- Casos de Uso: Perfil (Fase 15) ---
import { GetProfileUseCase } from './application/use_cases/profile/GetProfileUseCase';
import { UpdateProfileUseCase } from './application/use_cases/profile/UpdateProfileUseCase';

// --- Casos de Uso: Direcciones (Fase 15) ---
import { ListAddressesUseCase } from './application/use_cases/addresses/ListAddressesUseCase';
import { CreateAddressUseCase } from './application/use_cases/addresses/CreateAddressUseCase';
import { UpdateAddressUseCase } from './application/use_cases/addresses/UpdateAddressUseCase';
import { DeleteAddressUseCase } from './application/use_cases/addresses/DeleteAddressUseCase';
import { SetDefaultAddressUseCase } from './application/use_cases/addresses/SetDefaultAddressUseCase';

// --- Casos de Uso: Cupones (Fase 15) ---
import { RedeemCouponUseCase } from './application/use_cases/coupons/RedeemCouponUseCase';
import { GetAvailableCouponsUseCase } from './application/use_cases/coupons/GetAvailableCouponsUseCase';

// --- Casos de Uso: Monedero (Fase 15) ---
import { GetWalletUseCase } from './application/use_cases/wallet/GetWalletUseCase';
import { GetWalletLedgerUseCase } from './application/use_cases/wallet/GetWalletLedgerUseCase';

// --- Casos de Uso: Recompensas (Fase 15) ---
import { GetUserRewardsUseCase } from './application/use_cases/rewards/GetUserRewardsUseCase';

// --- Casos de Uso: Checkout (Fase 16) ---
import { ProcessCheckoutUseCase } from './application/use_cases/checkout/ProcessCheckoutUseCase';
import { GetPublicCheckoutConfigUseCase } from './application/use_cases/checkout/GetPublicCheckoutConfigUseCase';

// --- Casos de Uso: Pedidos / Webhook / Game Bridge (Fase 17) ---
import { WebhookPaymentReconciliationUseCase } from './application/use_cases/orders/WebhookPaymentReconciliationUseCase';
import { ValidateCartUseCase } from './application/use_cases/checkout/ValidateCartUseCase';
import { CancelOrderUseCase } from './application/use_cases/orders/CancelOrderUseCase';
import { ListOrdersUseCase } from './application/use_cases/orders/ListOrdersUseCase';
import { GetOrderDetailUseCase } from './application/use_cases/orders/GetOrderDetailUseCase';
import { ValidateRewardM2MUseCase } from './application/use_cases/game_bridge/ValidateRewardM2MUseCase';

// --- Repositorio Admin de Catálogo (Fases 22-23) ---
import { AdminProductRepository } from './infrastructure/database/repositories/AdminProductRepository';

// --- Servicio de Media (Fase 23) ---
import { S3MediaStorageService } from './infrastructure/services/media/S3MediaStorageService';

// --- Casos de Uso: CMS Catálogo (Fase 22) ---
import { UploadProductImageUseCase } from './application/use_cases/admin/media/UploadProductImageUseCase';
import { UploadBannerImageUseCase } from './application/use_cases/admin/media/UploadBannerImageUseCase';
import { UploadBannerVideoUseCase } from './application/use_cases/admin/media/UploadBannerVideoUseCase';
import { UploadDonationBannerUseCase } from './application/use_cases/admin/media/UploadDonationBannerUseCase';
import { UploadProductGalleryImageUseCase } from './application/use_cases/admin/media/UploadProductGalleryImageUseCase';
import { RemoveProductGalleryImageUseCase } from './application/use_cases/admin/media/RemoveProductGalleryImageUseCase';
import { CreateProductUseCase } from './application/use_cases/admin/catalog/CreateProductUseCase';
import { UpdateProductUseCase } from './application/use_cases/admin/catalog/UpdateProductUseCase';
import { GetAdminProductDetailUseCase } from './application/use_cases/admin/catalog/GetAdminProductDetailUseCase';
import { SoftDeleteProductUseCase } from './application/use_cases/admin/catalog/SoftDeleteProductUseCase';
import { CreateVariantUseCase } from './application/use_cases/admin/catalog/CreateVariantUseCase';
import { UpdateVariantUseCase } from './application/use_cases/admin/catalog/UpdateVariantUseCase';
import { AdjustVariantStockUseCase } from './application/use_cases/admin/catalog/AdjustVariantStockUseCase';
import { SetAbsoluteStockUseCase } from './application/use_cases/admin/catalog/SetAbsoluteStockUseCase';
import { FindOrCreateCategoryUseCase } from './application/use_cases/admin/catalog/FindOrCreateCategoryUseCase';

// --- Casos de Uso: Seguridad Administrativa (Fase 21) ---
import { RegisterAdminUseCase } from './application/use_cases/admin/RegisterAdminUseCase';
import { AdminLoginUseCase } from './application/use_cases/admin/AdminLoginUseCase';
import { GetAuditLogsUseCase } from './application/use_cases/admin/GetAuditLogsUseCase';
import { GetSystemSettingsUseCase } from './application/use_cases/admin/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from './application/use_cases/admin/UpdateSystemSettingsUseCase';

// --- Caso de Uso: Reembolsos Administrativos (Fase 25) ---
import { ManualRefundUseCase } from './application/use_cases/admin/refunds/ManualRefundUseCase';

// --- Repositorio y Casos de Uso: Donaciones (Fase 27) ---
import { DonationRepository } from './infrastructure/database/repositories/DonationRepository';
import { ProcessDonationUseCase } from './application/use_cases/donations/ProcessDonationUseCase';
import { ConfirmDonationWebhookUseCase } from './application/use_cases/donations/ConfirmDonationWebhookUseCase';
import { AdminListDonationsUseCase } from './application/use_cases/donations/AdminListDonationsUseCase';
import { GetMyDonationsUseCase } from './application/use_cases/donations/GetMyDonationsUseCase';

// --- Casos de Uso: CMS Cupones, Pedidos Kanban, CRM Usuarios (Fase 24) ---
import { CreateCouponUseCase } from './application/use_cases/admin/coupons/CreateCouponUseCase';
import { UpdateCouponUseCase } from './application/use_cases/admin/coupons/UpdateCouponUseCase';
import { ToggleCouponUseCase } from './application/use_cases/admin/coupons/ToggleCouponUseCase';
import { ListAllOrdersAdminUseCase } from './application/use_cases/admin/orders/ListAllOrdersAdminUseCase';
import { UpdateOrderStatusUseCase } from './application/use_cases/admin/orders/UpdateOrderStatusUseCase';
import { ListAllUsersUseCase } from './application/use_cases/admin/users/ListAllUsersUseCase';
import { GetAdminUserLedgerUseCase } from './application/use_cases/admin/users/GetAdminUserLedgerUseCase';
import { BanUserUseCase } from './application/use_cases/admin/users/BanUserUseCase';
import { UnbanUserUseCase } from './application/use_cases/admin/users/UnbanUserUseCase';
import { ListCouponsUseCase, GetCouponByIdUseCase } from './application/use_cases/admin/coupons/ReadCouponUseCases';

// --- Casos de Uso: CMS Contenido + Analytics (Fase 30) ---
import {
  CreateBannerUseCase,
  UpdateBannerUseCase,
  DeleteBannerUseCase,
  ListBannersUseCase,
  GetActiveBannersUseCase,
} from './application/use_cases/admin/banners/BannerUseCases';
import {
  ListLegalDocumentsUseCase,
  GetLegalDocumentUseCase,
  UpdateLegalDocumentUseCase,
} from './application/use_cases/admin/legal/LegalDocumentUseCases';
import {
  GetDashboardSummaryUseCase,
  GetSalesOverTimeUseCase,
  GetTopProductsAnalyticsUseCase,
} from './application/use_cases/admin/analytics/AnalyticsUseCases';

// --- Casos de Uso: Wishlist, Gamificación, Reportes, Developer Code (Fase 31) ---
import {
  AddToWishlistUseCase,
  RemoveFromWishlistUseCase,
  GetWishlistUseCase,
} from './application/use_cases/wishlist/WishlistUseCases';
import { AwardExperienceUseCase } from './application/use_cases/gamification/AwardExperienceUseCase';
import { GenerateReportUseCase } from './application/use_cases/admin/reports/GenerateReportUseCase';
import { ChangeDeveloperCodeUseCase } from './application/use_cases/admin/ChangeDeveloperCodeUseCase';

// --- Casos de Uso: Notificaciones (Fase 32) ---
import {
  GetNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
} from './application/use_cases/notifications/NotificationUseCases';

// --- Casos de Uso: Inventario Admin (Fase 35) ---
import {
  GetInventoryMonitorUseCase,
  ListAdminProductsUseCase,
} from './application/use_cases/admin/inventory/InventoryUseCases';

// --- Controladores HTTP (Adaptadores) ---
import { AuthController } from './infrastructure/http/controllers/AuthController';
import { ProductController } from './infrastructure/http/controllers/ProductController';
import { ProfileController } from './infrastructure/http/controllers/ProfileController';
import { AddressController } from './infrastructure/http/controllers/AddressController';
import { CouponController } from './infrastructure/http/controllers/CouponController';
import { WalletController } from './infrastructure/http/controllers/WalletController';
import { RewardController } from './infrastructure/http/controllers/RewardController';
import { CheckoutController } from './infrastructure/http/controllers/CheckoutController';
import { WebhookController } from './infrastructure/http/controllers/WebhookController';
import { OrderController } from './infrastructure/http/controllers/OrderController';
import { AdminAuthController } from './infrastructure/http/controllers/AdminAuthController';
import { AuditLogController } from './infrastructure/http/controllers/AuditLogController';
import { SystemSettingsController } from './infrastructure/http/controllers/SystemSettingsController';
import { AdminProductController } from './infrastructure/http/controllers/AdminProductController';
import { AdminCategoryController } from './infrastructure/http/controllers/AdminCategoryController';
import { AdminMediaController } from './infrastructure/http/controllers/AdminMediaController';
import { AdminCouponController } from './infrastructure/http/controllers/AdminCouponController';
import { AdminOrderAdminController } from './infrastructure/http/controllers/AdminOrderAdminController';
import { AdminUserCrmController } from './infrastructure/http/controllers/AdminUserCrmController';
import { AdminRefundController } from './infrastructure/http/controllers/AdminRefundController';

// --- Controladores: Donaciones (Fase 27) ---
import { DonationController } from './infrastructure/http/controllers/DonationController';
import { AdminDonationController } from './infrastructure/http/controllers/AdminDonationController';

// --- Controladores: CMS Contenido + Analytics (Fase 30) ---
import { AdminBannerController } from './infrastructure/http/controllers/AdminBannerController';
import { AdminLegalController } from './infrastructure/http/controllers/AdminLegalController';
import { AdminAnalyticsController } from './infrastructure/http/controllers/AdminAnalyticsController';
import { PublicContentController } from './infrastructure/http/controllers/PublicContentController';

// --- Controladores: Wishlist + Reportes (Fase 31) ---
import { WishlistController } from './infrastructure/http/controllers/WishlistController';
import { AdminReportController } from './infrastructure/http/controllers/AdminReportController';

// --- Controlador: Notificaciones (Fase 32) ---
import { NotificationController } from './infrastructure/http/controllers/NotificationController';

// --- Controlador: Inventario Admin (Fase 35) ---
import { AdminInventoryController } from './infrastructure/http/controllers/AdminInventoryController';

// --- Infraestructura de Comunicación: WebSocket (Fase 28) ---
// ResendEmailService no se usa en el proceso HTTP — vive en worker:email (proceso separado).
import { WebSocketServer } from './infrastructure/realtime/WebSocketServer';

// --- Rutas ---
import { buildAuthRoutes } from './infrastructure/http/routes/authRoutes';
import { buildProductRoutes } from './infrastructure/http/routes/productRoutes';
import { buildProfileRoutes } from './infrastructure/http/routes/profileRoutes';
import { buildAddressRoutes } from './infrastructure/http/routes/addressRoutes';
import { buildWalletRoutes } from './infrastructure/http/routes/walletRoutes';
import { buildRewardRoutes } from './infrastructure/http/routes/rewardRoutes';
import { buildGameRewardRoutes } from './infrastructure/http/routes/gameRewardRoutes';
import { buildCouponRoutes } from './infrastructure/http/routes/couponRoutes';
import { buildCheckoutRoutes } from './infrastructure/http/routes/checkoutRoutes';
import { buildWebhookRoutes } from './infrastructure/http/routes/webhookRoutes';
import { buildOrderRoutes } from './infrastructure/http/routes/orderRoutes';
import { buildAdminAuthRoutes } from './infrastructure/http/routes/adminAuthRoutes';
import { buildAuditLogRoutes } from './infrastructure/http/routes/auditLogRoutes';
import { buildSystemSettingsRoutes } from './infrastructure/http/routes/systemSettingsRoutes';
import { buildAdminProductRoutes } from './infrastructure/http/routes/adminProductRoutes';
import { buildAdminCategoryRoutes } from './infrastructure/http/routes/adminCategoryRoutes';
import { buildAdminMediaRoutes } from './infrastructure/http/routes/adminMediaRoutes';
import { buildAdminCouponRoutes } from './infrastructure/http/routes/adminCouponRoutes';
import { buildAdminOrderAdminRoutes } from './infrastructure/http/routes/adminOrderAdminRoutes';
import { buildAdminUserCrmRoutes } from './infrastructure/http/routes/adminUserCrmRoutes';
import { buildAdminRefundRoutes } from './infrastructure/http/routes/adminRefundRoutes';
import { buildDonationRoutes } from './infrastructure/http/routes/donationRoutes';
import { buildAdminDonationRoutes } from './infrastructure/http/routes/adminDonationRoutes';
import { buildRealtimeRoutes } from './infrastructure/http/routes/realtimeRoutes';
import { buildGeographyRoutes } from './infrastructure/http/routes/geographyRoutes';
import { GeographyCatalogService } from './infrastructure/services/geography/GeographyCatalogService';

// --- Rutas: CMS Contenido + Analytics (Fase 30) ---
import { buildAdminBannerRoutes } from './infrastructure/http/routes/adminBannerRoutes';
import { buildAdminLegalRoutes } from './infrastructure/http/routes/adminLegalRoutes';
import { buildAdminYoutubeRoutes } from './infrastructure/http/routes/adminYoutubeRoutes';
import { buildAdminAnalyticsRoutes } from './infrastructure/http/routes/adminAnalyticsRoutes';
import { buildPublicContentRoutes } from './infrastructure/http/routes/publicContentRoutes';
import { UploadLegalPdfUseCase } from './application/use_cases/admin/legal/UploadLegalPdfUseCase';
import { YoutubeVideoRepository } from './infrastructure/database/repositories/YoutubeVideoRepository';
import {
  CreateYoutubeVideoUseCase,
  UpdateYoutubeVideoUseCase,
  DeleteYoutubeVideoUseCase,
  ListYoutubeVideosUseCase,
  ReorderYoutubeVideosUseCase
} from './application/use_cases/admin/youtube/YoutubeVideoUseCases';
import { AdminYoutubeVideoController } from './infrastructure/http/controllers/AdminYoutubeVideoController';

// --- Rutas: Wishlist + Reportes (Fase 31) ---
import { buildWishlistRoutes } from './infrastructure/http/routes/wishlistRoutes';
import { buildAdminReportRoutes } from './infrastructure/http/routes/adminReportRoutes';

// --- Rutas: Notificaciones (Fase 32) ---
import { buildNotificationRoutes } from './infrastructure/http/routes/notificationRoutes';

// --- Rutas: Inventario Admin (Fase 35) ---
import { buildAdminInventoryRoutes } from './infrastructure/http/routes/adminInventoryRoutes';

// Cargar variables de entorno
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '200', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-do-not-use-in-production';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
// TODO: STRIPE — quitar PAYMENTS_SIMULATED del .env cuando existan claves reales
// (sk_test_/pk_test_). Con `true` se inyecta SimulatedPaymentAdapter: las órdenes
// se crean en la BD (PAYMENT_PENDING) con un PaymentIntent FICTICIO, sin cobrar.
const PAYMENTS_SIMULATED = process.env.PAYMENTS_SIMULATED === 'true';
const GAME_API_BASE_URL = process.env.GAME_API_BASE_URL || 'http://localhost:4000';
const GAME_API_M2M_TOKEN = process.env.GAME_API_M2M_TOKEN || '';
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '8h';
const S3_BUCKET = process.env.S3_BUCKET || '';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '';
const S3_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '';
// Fase 28 — Email transaccional
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@animayuks.com';
// Fase 29 — Auth avanzada
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || 'http://localhost:5173/reset-password';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/oauth/google/callback';
const TOTP_ISSUER = process.env.TOTP_ISSUER || 'Animayuks CMS';
// Fase 34 — CORS allowlist. FRONTEND_URL admite varias URLs separadas por coma.
const CORS_ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * Composition Root — Punto de Composición del Sistema Animayuks.
 *
 * Aquí se orquesta TODA la inyección de dependencias de forma manual:
 *   1. Se instancian los repositorios y servicios externos (infraestructura).
 *   2. Se inyectan en los casos de uso (aplicación).
 *   3. Se inyectan los casos de uso en los controladores (adaptadores HTTP).
 *   4. Se registran las rutas con los controladores ya inyectados.
 *
 * Principio: Ningún módulo interno conoce cómo se construye el grafo de dependencias.
 * Solo main.ts lo sabe.
 */
async function main(): Promise<void> {
  // ==========================================
  // 1. INSTANCIAR FASTIFY
  // ==========================================
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
        },
      },
    },
  });

  // ==========================================
  // 2. REGISTRAR PLUGINS GLOBALES
  // ==========================================
  // CORS CERRADO (Fase 34, C-03/REQ-BE-06): NADA de `origin: true`. La allowlist
  // se lee de FRONTEND_URL (una o varias URLs separadas por coma). Un Origin que
  // no esté en la lista NO recibe la cabecera Access-Control-Allow-Origin → el
  // navegador bloquea la respuesta. Las peticiones sin Origin (curl, server-to-server,
  // webhooks de Stripe) se permiten porque no son cross-origin de navegador.
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || CORS_ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
        return;
      }
      // Origen no autorizado: se rechaza (no se emiten cabeceras CORS).
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'Stripe-Signature'],
  });

  // @fastify/helmet: cabeceras de seguridad HTTP (Fase 28).
  // connectSrc incluye ws: y wss: para que el navegador permita el handshake WebSocket
  // sin violar la Content Security Policy (REQ-BE-10).
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        connectSrc:  ["'self'", 'ws:', 'wss:'],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:', 'https:'],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        frameSrc:    ["'none'"],
      },
    },
  });

  // @fastify/websocket: habilita el protocolo WebSocket sobre Fastify (Fase 28).
  // DEBE registrarse antes de las rutas que usen { websocket: true }.
  await fastify.register(websocket);

  // @fastify/cookie: requerido para el Refresh Token HttpOnly (Q19 — Silent Refresh).
  await fastify.register(cookie);

  // @fastify/rate-limit: protección global contra abuso y DoS (Fase 26).
  //
  // DISEÑO DE CAPAS:
  //   - Este plugin aplica a TODAS las rutas como piso base (200 req/min).
  //   - Las rutas admin/auth sobreescriben este límite en su propio scope
  //     (5 req/min via `registerAdminRateLimit`) para proteger el login
  //     contra ataques de fuerza bruta.
  //   - Redis NO está configurado como store (dev local); en producción usar
  //     `{ redis: redisConnection }` para distribuir los contadores entre pods.
  await fastify.register(rateLimit, {
    global: true,
    max: RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    addHeaders: {
      'x-ratelimit-limit':     true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset':     true,
      'retry-after':           true,
    },
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Límite de solicitudes excedido. Máximo ${context.max} por minuto. Reintenta en ${Math.ceil(context.ttl / 1000)}s.`,
    }),
  });

  // ==========================================
  // 3. INYECCIÓN DE DEPENDENCIAS (Manual)
  // ==========================================

  // 3.1 Repositorios
  const userRepository = new UserRepository();
  const productRepository = new ProductRepository();
  const addressRepository = new AddressRepository();
  const orderRepository = new OrderRepository();
  const walletRepository = new WalletRepository();
  const couponRepository = new CouponRepository();
  const rewardCodeRepository = new RewardCodeRepository();
  // BRECHA-16: el repositorio de settings recibe Redis para cachear la config
  // de checkout con TTL corto (config dinámica sin reiniciar el contenedor).
  const systemSettingsRepository = new SystemSettingsRepository(redisConnection);
  const auditLogRepository = new AuditLogRepository();
  const donationRepository = new DonationRepository();
  // Fase 29 — Auth avanzada
  const refreshTokenRepository = new RefreshTokenRepository();
  const passwordResetTokenRepository = new PasswordResetTokenRepository();
  const otpRepository = new OtpRepository();
  // Fase 30 — CMS Contenido + Analytics
  const bannerRepository = new BannerRepository();
  const legalDocumentRepository = new LegalDocumentRepository();
  const analyticsRepository = new AnalyticsRepository();
  const youtubeVideoRepository = new YoutubeVideoRepository(db);
  // Fase 31 — Wishlist + Reportes
  const wishlistRepository = new WishlistRepository();
  const reportRepository = new ReportRepository();
  // Fase 32 — Notificaciones
  const notificationRepository = new NotificationRepository();
  // Fase 35 — Inventario Admin
  const adminInventoryRepository = new AdminInventoryRepository();

  // 3.2 Servicios de Infraestructura (Fase 14 + Fase 20 + Fase 28)
  const lockService = new RedisLockService(redisConnection);
  const idempotencyService = new RedisIdempotencyService(redisConnection);
  // TODO: STRIPE — al tener claves reales: PAYMENTS_SIMULATED=false y este
  // ternario vuelve a inyectar StripeAdapter sin tocar ninguna otra línea.
  const paymentGateway = PAYMENTS_SIMULATED
    ? new SimulatedPaymentAdapter()
    : new StripeAdapter(STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET);
  const gameApiClient = new GameApiClient(GAME_API_BASE_URL, GAME_API_M2M_TOKEN);
  const geographyCatalogService = new GeographyCatalogService();
  const queueService = new BullMQQueueService();

  // Fase 29 — Auth avanzada: TOTP (2FA) + OAuth Google
  const totpService = new TotpService();
  const googleOAuthProvider = new GoogleOAuthProvider(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth no configurado (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). El login social fallará con HTTP 502 hasta configurarlo.');
  }

  // Fase 28: Realtime (WebSocket)
  // El WebSocketServer es el único servicio de Phase 28 que vive en el proceso HTTP.
  // ResendEmailService vive únicamente en el email worker (proceso separado via npm run worker:email).
  const wsServer = new WebSocketServer();
  // Fase 31: suscribir la API al canal Redis de admins para recibir eventos
  // publicados por procesos worker (ej. reportes listos) y reenviarlos por WS.
  // Se usa una conexión Redis DEDICADA (modo suscriptor bloquea otros comandos).
  wsServer.subscribeToAdminChannel(createRedisSubscriber());
  // TODO: Re-habilitar cuando se configure EMAIL_API_KEY en producción
  // if (!EMAIL_API_KEY) {
  //   console.warn('⚠️  EMAIL_API_KEY no configurado. El worker:email fallará al enviar correos hasta configurarla.');
  // }

  // 3.3 Casos de Uso — Auth (preexistente + Fase 20 Refresh Token)
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  // RTR (Fase 29): el refresh token se persiste (su hash) vía refreshTokenRepository.
  // El REFRESH_TOKEN_SECRET dejó de usarse: los tokens ahora son opacos, no JWT.
  const loginUserUseCase = new LoginUserUseCase(
    userRepository,
    refreshTokenRepository,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(
    userRepository,
    refreshTokenRepository,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN
  );

  // Fase 29 — Recuperación de contraseña, OTP, logout, OAuth
  const forgotPasswordUseCase = new ForgotPasswordUseCase(
    userRepository,
    passwordResetTokenRepository,
    queueService,
    PASSWORD_RESET_URL,
    30, // TTL del enlace en minutos
  );
  const resetPasswordUseCase = new ResetPasswordUseCase(
    passwordResetTokenRepository,
  );
  const requestOtpUseCase = new RequestOtpUseCase(otpRepository, userRepository, queueService, 10);
  const verifyOtpUseCase = new VerifyOtpUseCase(otpRepository, userRepository);
  const logoutUseCase = new LogoutUseCase(refreshTokenRepository);
  const googleOAuthCallbackUseCase = new GoogleOAuthCallbackUseCase(
    userRepository,
    refreshTokenRepository,
    googleOAuthProvider,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
  );

  // 3.4 Casos de Uso — Catálogo (preexistente)
  const getProductsUseCase = new GetProductsUseCase(productRepository);
  const getProductDetailUseCase = new GetProductDetailUseCase(productRepository);
  const getTopProductsUseCase = new GetTopProductsUseCase(productRepository);
  const getCategoriesUseCase = new GetCategoriesUseCase(productRepository);

  // 3.5 Casos de Uso — Perfil (Fase 15)
  const getProfileUseCase = new GetProfileUseCase(userRepository, walletRepository, systemSettingsRepository);
  const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

  // 3.6 Casos de Uso — Direcciones (Fase 15)
  const listAddressesUseCase = new ListAddressesUseCase(addressRepository);
  const createAddressUseCase = new CreateAddressUseCase(addressRepository, geographyCatalogService);
  const updateAddressUseCase = new UpdateAddressUseCase(addressRepository, geographyCatalogService);
  const deleteAddressUseCase = new DeleteAddressUseCase(addressRepository);
  const setDefaultAddressUseCase = new SetDefaultAddressUseCase(addressRepository);

  // 3.7 Casos de Uso — Cupones (Fase 15)
  const redeemCouponUseCase = new RedeemCouponUseCase(couponRepository);

  // 3.8 Casos de Uso — Monedero (Fase 15)
  const getWalletUseCase = new GetWalletUseCase(walletRepository);
  const getWalletLedgerUseCase = new GetWalletLedgerUseCase(walletRepository);

  // 3.9 Casos de Uso — Recompensas (Fase 15)
  const getUserRewardsUseCase = new GetUserRewardsUseCase(rewardCodeRepository, orderRepository);

  // 3.10 Caso de Uso — Checkout (Fase 16, configuración dinámica desde Fase 30)
  //
  // BRECHA-16 RESUELTA: se elimina la config cacheada en memoria al arranque.
  // El checkout ahora lee `system_settings` en cada ejecución vía
  // `systemSettingsRepository.getCheckoutConfig()` (caché Redis con TTL de 60s).
  // Un cambio de tarifas de envío en el CMS aplica sin reiniciar el contenedor.
  const processCheckoutUseCase = new ProcessCheckoutUseCase(
    orderRepository,
    productRepository,
    walletRepository,
    couponRepository,
    rewardCodeRepository,
    addressRepository,
    paymentGateway,
    lockService,
    idempotencyService,
    queueService,
    systemSettingsRepository,
    userRepository // Fase 35: envío gratis dinámico por tier de lealtad
  );

  // 3.12 Casos de Uso — Donaciones (Fase 27)
  const processDonationUseCase = new ProcessDonationUseCase(
    donationRepository,
    paymentGateway,
    systemSettingsRepository
  );
  const confirmDonationWebhookUseCase = new ConfirmDonationWebhookUseCase(
    donationRepository,
    paymentGateway
  );
  const adminListDonationsUseCase = new AdminListDonationsUseCase(donationRepository);
  const getMyDonationsUseCase = new GetMyDonationsUseCase(donationRepository);

  // 3.11 Casos de Uso — Pedidos / Webhook / Game Bridge (Fase 17)
  // Fase 31: la asignación de XP se inyecta en el webhook — la gamificación
  // ocurre ESTRICTAMENTE cuando el pago se confirma (orden → PAID).
  const awardExperienceUseCase = new AwardExperienceUseCase(
    userRepository,
    systemSettingsRepository,
    wsServer
  );
  const webhookReconciliationUseCase = new WebhookPaymentReconciliationUseCase(
    orderRepository,
    paymentGateway,
    awardExperienceUseCase,
    userRepository,
    wsServer // Social Proof (C-02): broadcast en el proceso API donde viven las conexiones WS
  );
  const cancelOrderUseCase = new CancelOrderUseCase(
    orderRepository,
    walletRepository,
    rewardCodeRepository,
    productRepository,
    gameApiClient,
    paymentGateway
  );
  const listOrdersUseCase = new ListOrdersUseCase(orderRepository);
  const getOrderDetailUseCase = new GetOrderDetailUseCase(orderRepository);
  const validateRewardM2MUseCase = new ValidateRewardM2MUseCase(rewardCodeRepository, orderRepository);

  // 3.11.1 Casos de Uso — CMS Catálogo (Fases 22-23)
  const adminProductRepository = new AdminProductRepository();

  const S3_ENDPOINT = process.env.S3_ENDPOINT || '';
  const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || '';

  // Servicio S3: constructor lazy — no lanza si faltan credenciales en dev.
  // El error emerge al primer upload real (HTTP 503 al admin, no crash del server).
  const mediaStorageService = new S3MediaStorageService({
    bucket: S3_BUCKET,
    region: S3_REGION,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    endpoint: S3_ENDPOINT,
    publicUrl: S3_PUBLIC_URL,
  });
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    console.warn('⚠️  S3/R2 no configurado completamente. Los uploads de imagen podrían fallar.');
  }
  const uploadProductImageUseCase = new UploadProductImageUseCase(adminProductRepository, mediaStorageService);
  const createProductUseCase = new CreateProductUseCase(adminProductRepository);
  const updateProductUseCase = new UpdateProductUseCase(adminProductRepository);
  const softDeleteProductUseCase = new SoftDeleteProductUseCase(adminProductRepository);
  const createVariantUseCase = new CreateVariantUseCase(adminProductRepository);
  const updateVariantUseCase = new UpdateVariantUseCase(adminProductRepository);
  const adjustVariantStockUseCase = new AdjustVariantStockUseCase(adminProductRepository);
  const findOrCreateCategoryUseCase = new FindOrCreateCategoryUseCase(adminProductRepository);

  // 3.11.4 Caso de Uso — Reembolsos Administrativos con Re-Auth (Fase 25)
  const manualRefundUseCase = new ManualRefundUseCase(
    userRepository,
    orderRepository,
    paymentGateway,
    auditLogRepository,
  );

  // 3.11.3 Casos de Uso — CMS Cupones, Pedidos Kanban, CRM Usuarios (Fase 24)
  const createCouponUseCase = new CreateCouponUseCase(couponRepository);
  const updateCouponUseCase = new UpdateCouponUseCase(couponRepository);
  const toggleCouponUseCase = new ToggleCouponUseCase(couponRepository);
  const listCouponsUseCase = new ListCouponsUseCase(couponRepository);
  const getCouponByIdUseCase = new GetCouponByIdUseCase(couponRepository);

  // Fase 30 — Banners
  const createBannerUseCase = new CreateBannerUseCase(bannerRepository);
  const updateBannerUseCase = new UpdateBannerUseCase(bannerRepository);
  const deleteBannerUseCase = new DeleteBannerUseCase(bannerRepository);
  const listBannersUseCase = new ListBannersUseCase(bannerRepository);
  const getActiveBannersUseCase = new GetActiveBannersUseCase(bannerRepository);

  // Fase 30 — Textos Legales
  const listLegalDocumentsUseCase = new ListLegalDocumentsUseCase(legalDocumentRepository);
  const getLegalDocumentUseCase = new GetLegalDocumentUseCase(legalDocumentRepository);
  const updateLegalDocumentUseCase = new UpdateLegalDocumentUseCase(legalDocumentRepository, auditLogRepository);
  const uploadLegalPdfUseCase = new UploadLegalPdfUseCase(legalDocumentRepository, mediaStorageService, auditLogRepository);

  // Fase 30 — Analytics
  const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(analyticsRepository);
  const getSalesOverTimeUseCase = new GetSalesOverTimeUseCase(analyticsRepository);
  const getTopProductsAnalyticsUseCase = new GetTopProductsAnalyticsUseCase(analyticsRepository);

  const createYoutubeVideoUseCase = new CreateYoutubeVideoUseCase(youtubeVideoRepository, auditLogRepository);
  const updateYoutubeVideoUseCase = new UpdateYoutubeVideoUseCase(youtubeVideoRepository, auditLogRepository);
  const deleteYoutubeVideoUseCase = new DeleteYoutubeVideoUseCase(youtubeVideoRepository, auditLogRepository);
  const listYoutubeVideosUseCase = new ListYoutubeVideosUseCase(youtubeVideoRepository);
  const reorderYoutubeVideosUseCase = new ReorderYoutubeVideosUseCase(youtubeVideoRepository);

  // Fase 31 — Wishlist, Reportes, Developer Code
  const addToWishlistUseCase = new AddToWishlistUseCase(wishlistRepository, productRepository);
  const removeFromWishlistUseCase = new RemoveFromWishlistUseCase(wishlistRepository);
  const getWishlistUseCase = new GetWishlistUseCase(wishlistRepository);
  const generateReportUseCase = new GenerateReportUseCase(queueService);
  const changeDeveloperCodeUseCase = new ChangeDeveloperCodeUseCase(
    userRepository,
    systemSettingsRepository,
    auditLogRepository,
  );

  // Fase 32 — Notificaciones (bandeja in-app)
  const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);
  const getUnreadCountUseCase = new GetUnreadCountUseCase(notificationRepository);
  const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationRepository);
  const markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepository);

  // Fase 35 — Inventario Admin (monitor + listado de productos)
  const getInventoryMonitorUseCase = new GetInventoryMonitorUseCase(adminInventoryRepository);
  const listAdminProductsUseCase = new ListAdminProductsUseCase(adminInventoryRepository);
  const listAllOrdersAdminUseCase = new ListAllOrdersAdminUseCase(orderRepository);
  const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(
    orderRepository,
    queueService,
    userRepository,
    notificationRepository,
    wsServer, // Notificación híbrida (C-01): email encolado + WS en tiempo real
  );
  const listAllUsersUseCase = new ListAllUsersUseCase(userRepository);
  const getAdminUserLedgerUseCase = new GetAdminUserLedgerUseCase(userRepository, walletRepository);
  const banUserUseCase = new BanUserUseCase(userRepository, refreshTokenRepository);
  const unbanUserUseCase = new UnbanUserUseCase(userRepository);

  // 3.11.2 Casos de Uso — Seguridad Administrativa (Fase 21)
  const registerAdminUseCase = new RegisterAdminUseCase(userRepository, systemSettingsRepository);
  const adminLoginUseCase = new AdminLoginUseCase(userRepository, JWT_SECRET, ADMIN_JWT_EXPIRES_IN);
  // Fase 29 — 2FA TOTP admin
  const verifyAdmin2faUseCase = new VerifyAdmin2faUseCase(
    userRepository,
    totpService,
    JWT_SECRET,
    ADMIN_JWT_EXPIRES_IN,
  );
  const setup2faUseCase = new Setup2faUseCase(userRepository, totpService, TOTP_ISSUER);
  const enable2faUseCase = new Enable2faUseCase(userRepository, totpService);
  const getAuditLogsUseCase = new GetAuditLogsUseCase(auditLogRepository);
  const getSystemSettingsUseCase = new GetSystemSettingsUseCase(systemSettingsRepository);
  const updateSystemSettingsUseCase = new UpdateSystemSettingsUseCase(systemSettingsRepository, auditLogRepository);

  // 3.12 Controladores
  const authController = new AuthController(
    registerUserUseCase,
    loginUserUseCase,
    refreshTokenUseCase,
    forgotPasswordUseCase,
    resetPasswordUseCase,
    requestOtpUseCase,
    verifyOtpUseCase,
    logoutUseCase,
    googleOAuthCallbackUseCase,
    googleOAuthProvider,
  );
  const productController = new ProductController(
    getProductsUseCase,
    getProductDetailUseCase,
    getTopProductsUseCase,
    getCategoriesUseCase,
    redisConnection,
  );
  const profileController = new ProfileController(getProfileUseCase, updateProfileUseCase);
  const addressController = new AddressController(
    listAddressesUseCase,
    createAddressUseCase,
    updateAddressUseCase,
    deleteAddressUseCase,
    setDefaultAddressUseCase
  );
  const getAvailableCouponsUseCase = new GetAvailableCouponsUseCase(couponRepository);
  const couponController = new CouponController(redeemCouponUseCase, getAvailableCouponsUseCase);
  const walletController = new WalletController(getWalletUseCase, getWalletLedgerUseCase);
  const rewardController = new RewardController(getUserRewardsUseCase, validateRewardM2MUseCase);
  const getPublicCheckoutConfigUseCase = new GetPublicCheckoutConfigUseCase(systemSettingsRepository);
  const validateCartUseCase = new ValidateCartUseCase(productRepository);
  const checkoutController = new CheckoutController(processCheckoutUseCase, getPublicCheckoutConfigUseCase, validateCartUseCase);
  const webhookController = new WebhookController(webhookReconciliationUseCase, confirmDonationWebhookUseCase);
  const orderController = new OrderController(listOrdersUseCase, getOrderDetailUseCase, cancelOrderUseCase);
  const adminAuthController = new AdminAuthController(
    registerAdminUseCase,
    adminLoginUseCase,
    verifyAdmin2faUseCase,
    setup2faUseCase,
    enable2faUseCase,
  );
  const auditLogController = new AuditLogController(getAuditLogsUseCase);
  const systemSettingsController = new SystemSettingsController(
    getSystemSettingsUseCase,
    updateSystemSettingsUseCase,
    changeDeveloperCodeUseCase,
  );
  
  const getAdminProductDetailUseCase = new GetAdminProductDetailUseCase(adminProductRepository);
  const setAbsoluteStockUseCase = new SetAbsoluteStockUseCase(adminProductRepository);
  
  const adminProductController = new AdminProductController(
    createProductUseCase,
    updateProductUseCase,
    softDeleteProductUseCase,
    createVariantUseCase,
    updateVariantUseCase,
    adjustVariantStockUseCase,
    setAbsoluteStockUseCase,
    getAdminProductDetailUseCase,
  );
  const adminCategoryController = new AdminCategoryController(findOrCreateCategoryUseCase);
  
  const uploadBannerImageUseCase = new UploadBannerImageUseCase(bannerRepository, mediaStorageService);
  const uploadBannerVideoUseCase = new UploadBannerVideoUseCase(bannerRepository, mediaStorageService);
  const uploadDonationBannerUseCase = new UploadDonationBannerUseCase(systemSettingsRepository, mediaStorageService, auditLogRepository);
  const uploadProductGalleryImageUseCase = new UploadProductGalleryImageUseCase(adminProductRepository, mediaStorageService);
  const removeProductGalleryImageUseCase = new RemoveProductGalleryImageUseCase(adminProductRepository);

  const adminMediaController = new AdminMediaController(
    uploadProductImageUseCase, 
    uploadBannerImageUseCase,
    uploadBannerVideoUseCase,
    uploadDonationBannerUseCase,
    uploadProductGalleryImageUseCase,
    removeProductGalleryImageUseCase
  );
  const adminCouponController = new AdminCouponController(
    createCouponUseCase,
    updateCouponUseCase,
    toggleCouponUseCase,
    listCouponsUseCase,
    getCouponByIdUseCase,
  );
  const adminOrderAdminController = new AdminOrderAdminController(
    listAllOrdersAdminUseCase,
    updateOrderStatusUseCase,
  );
  const adminUserCrmController = new AdminUserCrmController(
    listAllUsersUseCase,
    getAdminUserLedgerUseCase,
    banUserUseCase,
    unbanUserUseCase,
  );
  const adminRefundController = new AdminRefundController(manualRefundUseCase);

  // Controladores: Donaciones (Fase 27)
  const donationController = new DonationController(processDonationUseCase, getMyDonationsUseCase);
  const adminDonationController = new AdminDonationController(adminListDonationsUseCase);

  // Controladores: CMS Contenido + Analytics (Fase 30)
  const adminBannerController = new AdminBannerController(
    createBannerUseCase,
    updateBannerUseCase,
    deleteBannerUseCase,
    listBannersUseCase,
  );
  const adminLegalController = new AdminLegalController(
    listLegalDocumentsUseCase,
    getLegalDocumentUseCase,
    updateLegalDocumentUseCase,
    uploadLegalPdfUseCase,
  );
  const adminAnalyticsController = new AdminAnalyticsController(
    getDashboardSummaryUseCase,
    getSalesOverTimeUseCase,
    getTopProductsAnalyticsUseCase,
  );
  const publicContentController = new PublicContentController(
    getActiveBannersUseCase,
    getLegalDocumentUseCase,
  );
  const adminYoutubeVideoController = new AdminYoutubeVideoController(
    createYoutubeVideoUseCase,
    updateYoutubeVideoUseCase,
    deleteYoutubeVideoUseCase,
    listYoutubeVideosUseCase,
    reorderYoutubeVideosUseCase
  );

  // Controladores: Wishlist + Reportes (Fase 31)
  const wishlistController = new WishlistController(
    addToWishlistUseCase,
    removeFromWishlistUseCase,
    getWishlistUseCase,
  );
  const adminReportController = new AdminReportController(generateReportUseCase);
  const notificationController = new NotificationController(
    getNotificationsUseCase,
    getUnreadCountUseCase,
    markNotificationReadUseCase,
    markAllNotificationsReadUseCase,
  );
  const adminInventoryController = new AdminInventoryController(
    getInventoryMonitorUseCase,
    listAdminProductsUseCase,
  );

  // ==========================================
  // 4. REGISTRAR RUTAS
  // ==========================================
  fastify.register(buildAuthRoutes(authController), { prefix: '/api/auth' });
  fastify.register(buildProductRoutes(productController), { prefix: '/api/products' });
  fastify.register(buildGeographyRoutes(geographyCatalogService), { prefix: '/api/geography' });
  fastify.register(buildProfileRoutes(profileController), { prefix: '/api/profile' });
  fastify.register(buildAddressRoutes(addressController), { prefix: '/api/profile/addresses' });
  fastify.register(buildWalletRoutes(walletController), { prefix: '/api/profile/wallet' });
  fastify.register(buildRewardRoutes(rewardController), { prefix: '/api/profile/rewards' });
  fastify.register(buildGameRewardRoutes(rewardController), { prefix: '/api/game/rewards' });
  fastify.register(buildCouponRoutes(couponController), { prefix: '/api/profile/coupons' });
  fastify.register(buildCheckoutRoutes(checkoutController), { prefix: '/api' });
  fastify.register(buildWebhookRoutes(webhookController), { prefix: '/api/webhooks' });
  fastify.register(buildOrderRoutes(orderController), { prefix: '/api/profile/orders' });
  fastify.register(buildAdminAuthRoutes(adminAuthController), { prefix: '/api/admin/auth' });
  fastify.register(buildAuditLogRoutes(auditLogController), { prefix: '/api/admin/audit-logs' });
  fastify.register(buildSystemSettingsRoutes(systemSettingsController), { prefix: '/api/admin/settings' });
  fastify.register(buildAdminProductRoutes(adminProductController), { prefix: '/api/admin/products' });
  fastify.register(buildAdminCategoryRoutes(adminCategoryController), { prefix: '/api/admin/categories' });
  // Rutas de media se registran sobre el prefijo /api/admin.
  fastify.register(buildAdminMediaRoutes(adminMediaController), { prefix: '/api/admin' });
  fastify.register(buildAdminCouponRoutes(adminCouponController),         { prefix: '/api/admin/coupons' });
  fastify.register(buildAdminOrderAdminRoutes(adminOrderAdminController), { prefix: '/api/admin/orders' });
  fastify.register(buildAdminUserCrmRoutes(adminUserCrmController),       { prefix: '/api/admin/users' });
  // Reembolsos: mismo prefijo /api/admin/orders para que la ruta quede
  // POST /api/admin/orders/:id/refund (semánticamente es una acción sobre un pedido).
  fastify.register(buildAdminRefundRoutes(adminRefundController),         { prefix: '/api/admin/orders' });

  // Donaciones: endpoint público POST /api/donate + panel admin GET /api/admin/donations
  fastify.register(buildDonationRoutes(donationController),               { prefix: '/api' });
  fastify.register(buildAdminDonationRoutes(adminDonationController),     { prefix: '/api/admin/donations' });

  // WebSocket + Realtime (Fase 28 — REQ-BE-10):
  //   - GET /api/realtime/ws     → WebSocket (con o sin JWT)
  //   - GET /api/realtime/stats  → métricas HTTP de conexiones activas
  fastify.register(buildRealtimeRoutes(wsServer, JWT_SECRET),             { prefix: '/api/realtime' });

  // CMS Contenido + Analytics (Fase 30):
  fastify.register(buildAdminBannerRoutes(adminBannerController),         { prefix: '/api/admin/banners' });
  fastify.register(buildAdminYoutubeRoutes(adminYoutubeVideoController),  { prefix: '/api/admin/youtube' });
  fastify.register(buildAdminLegalRoutes(adminLegalController),           { prefix: '/api/admin/legal' });
  fastify.register(buildAdminAnalyticsRoutes(adminAnalyticsController),   { prefix: '/api/admin/analytics' });
  // Contenido público (storefront, sin auth): banners activos + textos legales.
  fastify.register(buildPublicContentRoutes(publicContentController),     { prefix: '/api/content' });

  // Wishlist + Reportes (Fase 31):
  fastify.register(buildWishlistRoutes(wishlistController),               { prefix: '/api/profile/wishlist' });
  fastify.register(buildAdminReportRoutes(adminReportController),         { prefix: '/api/admin/reports' });

  // Notificaciones (Fase 32 — bandeja in-app REQ-FE-24):
  fastify.register(buildNotificationRoutes(notificationController),       { prefix: '/api/profile/notifications' });

  // Inventario Admin (Fase 35 — CMS-FE-16/CMS-FE-06):
  //   GET /api/admin/inventory  (monitor global de variantes)
  //   GET /api/admin/products   (listado admin, incluye descontinuados)
  fastify.register(buildAdminInventoryRoutes(adminInventoryController),   { prefix: '/api/admin' });

  // ==========================================
  // 5. HEALTHCHECK ENDPOINT
  // ==========================================
  fastify.get('/api/health', async (_request, reply) => {
    try {
      // Verificar conexión a la base de datos con una query trivial
      await db.selectFrom('users').select('id').limit(1).execute();

      // Verificar conexión a Redis
      const redisStatus = redisConnection.status;

      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: 'connected',
        redis: redisStatus === 'ready' ? 'connected' : redisStatus,
        uptime: process.uptime(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(503).send({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        db: 'disconnected',
        redis: redisConnection.status,
        error: errorMessage,
      });
    }
  });

  // ==========================================
  // 6. ARRANCAR SERVIDOR
  // ==========================================
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`
╔══════════════════════════════════════════════════════╗
║   🚀 Animayuks API Backend                          ║
║   ───────────────────────────────────────────────    ║
║   Puerto:      ${String(PORT).padEnd(38)}║
║   Entorno:     ${(process.env.NODE_ENV || 'development').padEnd(38)}║
║   Healthcheck: http://localhost:${PORT}/api/health${' '.repeat(Math.max(0, 14 - String(PORT).length))}║
║   Auth:        http://localhost:${PORT}/api/auth${' '.repeat(Math.max(0, 16 - String(PORT).length))}║
║   Productos:   http://localhost:${PORT}/api/products${' '.repeat(Math.max(0, 12 - String(PORT).length))}║
║   Perfil:      http://localhost:${PORT}/api/profile${' '.repeat(Math.max(0, 14 - String(PORT).length))}║
║   Checkout:    http://localhost:${PORT}/api/checkout${' '.repeat(Math.max(0, 12 - String(PORT).length))}║
║   Webhooks:    http://localhost:${PORT}/api/webhooks${' '.repeat(Math.max(0, 12 - String(PORT).length))}║
║   Game Bridge: http://localhost:${PORT}/api/game/rewards${' '.repeat(Math.max(0, 7 - String(PORT).length))}║
║   WebSocket:   ws://localhost:${PORT}/api/realtime/ws${' '.repeat(Math.max(0, 10 - String(PORT).length))}║
╚══════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // ==========================================
  // 7. GRACEFUL SHUTDOWN
  // ==========================================
  const shutdown = async (signal: string) => {
    console.log(`\n⚡ Señal ${signal} recibida. Cerrando servidor...`);
    try {
      await fastify.close();
      wsServer.close();
      if (redisConnection.status === 'ready') {
        await redisConnection.quit();
      } else {
        redisConnection.disconnect();
      }
      await db.destroy();
      console.log('✅ Servidor cerrado limpiamente.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error durante el shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Ejecutar
main().catch((err) => {
  console.error('❌ Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
