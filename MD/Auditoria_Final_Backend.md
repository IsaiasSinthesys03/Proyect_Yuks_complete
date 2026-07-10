# Auditoría Técnica Final — Backend Animayuks
**Fecha:** 30 de junio de 2026
**Auditor:** Claude Sonnet 4.6 (Análisis automatizado + revisión línea por línea)
**Fuentes contrastadas:**
- `MD/SRS_v10.1.md` (Especificación de Requerimientos)
- `MD/task.md` (Fases 12-26, plan de implementación)
- `API_Backend/src/**/*.ts` (167 archivos TypeScript auditados)
- PostgreSQL: 16 tablas, 37 índices verificados en BD real

---

## VEREDICTO EJECUTIVO

El backend NO cumple con el 100% del SRS. Cumple aproximadamente el **62-65%** de los requerimientos funcionales. Las Fases 12-26 implementaron una base transaccional sólida y bien arquitecturada, pero **8 módulos enteros definidos en el SRS están completamente ausentes del código**, incluyendo el sistema de donaciones (un canal de ingresos directo) y toda la infraestructura de comunicación en tiempo real (WebSockets + email). El backend es desplegable y funcional para el flujo core de e-commerce, pero incompleto según el SRS firmado.

---

## SECCIÓN 1 — ANÁLISIS DE BRECHAS FUNCIONALES

### 1.1 MÓDULOS COMPLETAMENTE AUSENTES (0% implementados)

#### BRECHA-01: Motor de Donaciones [REQ-BE-09, CMS-FE-13]
**Severidad: CRÍTICA — Canal de ingresos del SRS**

El SRS define explícitamente (`REQ-BE-09`, Sección 3.7) un sistema de donaciones voluntarias como fuente de ingresos directa, con flujo propio diferente al checkout.

**Lo que falta:**
- Tabla `donations` en BD (folio, fecha, monto, email_donante, stripe_payment_intent_id, estado)
- `POST /api/donate` — sin inventario, sin envío, con captura de email para anónimos
- `DonationUseCase` — validación de monto mínimo (configurable desde CMS)
- `DonationController`, `donationRoutes`
- Panel CMS (CMS-FE-13): `GET /api/admin/donations` para historial, exportación y verificación contable
- Variable de entorno `DONATION_MIN_AMOUNT` o configuración vía `system_settings`

**Impacto:** El botón flotante lúdico del frontend no tiene backend. Las donaciones no se pueden procesar.

---

#### BRECHA-02: WebSockets — Comunicación en Tiempo Real [REQ-BE-10, REQ-FE-24, REQ-FE-32, CMS-FE-04, CMS-FE-19]
**Severidad: CRÍTICA — Requerimiento transversal de 5 funcionalidades**

No existe ninguna referencia a `@fastify/websocket`, `socket.io`, `ws`, o cualquier protocolo de WebSocket en los 167 archivos TypeScript. El SRS lo requiere en cinco contextos distintos:

| Requerimiento | Descripción | Estado |
|---|---|---|
| REQ-FE-24 | Notificaciones in-app de cambios de estado de pedidos | ❌ Ausente |
| REQ-FE-32 | Social Proof FOMO: "Roberto compró en Mérida" broadcasts | ❌ Ausente |
| REQ-BE-10 | Motor Push Social Proof — canal bidireccional de eventos de compra | ❌ Ausente |
| CMS-FE-04 | Kanban sincronizado en tiempo real con "Socket Live" indicator | ❌ Ausente |
| CMS-FE-19 | Notificaciones de reportes completados en bandeja del admin | ❌ Ausente |

**Lo que falta:**
- Dependencia: `@fastify/websocket` o `socket.io`
- `WebSocketService` con canales `user:{userId}` y `admin` y `public`
- Integración con BullMQ worker para disparar eventos en cada cambio de estado de orden
- `GET /api/realtime/subscribe` o endpoint de handshake WebSocket

---

#### BRECHA-03: Servicio de Email Transaccional [REQ-BE-04]
**Severidad: CRÍTICA — Requisito explícito en REQ-BE-04**

El SRS establece: *"el sistema de colas disparará un Correo Electrónico... en CADA cambio de estatus del pedido (Empaquetando, En Camino, En Reparto, Entregado), sin excepción."*

El worker de BullMQ (`payment-reconciliation.worker.ts`) existe pero solo maneja reconciliación de pagos. No hay ningún provider de email.

**Lo que falta:**
- Dependencia: `@sendgrid/mail`, `nodemailer`, `resend` o similar
- `IEmailService` interface (puerto en capa de aplicación)
- `EmailService` implementación (adaptador de infraestructura)
- `SendOrderStatusEmailUseCase` — disparado desde el worker de BullMQ en cada transición de Kanban
- Templates de email (confirmación, en camino, entregado, cancelado)
- Variable de entorno `EMAIL_API_KEY`, `EMAIL_FROM`
- Cola BullMQ `send-email` con retry y DLQ
- Trigger para donaciones: email de recibo fiscal al donante

---

#### BRECHA-04: Recuperación de Contraseña [REQ-FE-10]
**Severidad: ALTA**

No existe ningún flujo de password recovery. El SRS (`REQ-FE-10`) requiere recuperación vía enlace temporal al correo.

**Lo que falta:**
- Tabla `password_reset_tokens` (token UUID, user_id, expires_at, used_at) **o** almacenamiento en Redis con TTL
- `POST /api/auth/forgot-password` — genera token, envía email
- `POST /api/auth/reset-password` — valida token, aplica nuevo hash Argon2
- `ForgotPasswordUseCase`, `ResetPasswordUseCase`
- Integración con el servicio de email (BRECHA-03)

---

#### BRECHA-05: Verificación OTP para Cambio de Email/Teléfono [REQ-FE-16]
**Severidad: ALTA**

`UpdateProfileUseCase` lanza `OtpVerificationRequiredError` como stub correcto, pero el flujo OTP completo está 0% implementado.

**Lo que falta:**
- Almacenamiento OTP: Redis `otp:{userId}:{field}` con TTL 10 min
- `POST /api/profile/otp/request` — genera código 6 dígitos, envía por email/SMS
- `POST /api/profile/otp/verify` — valida código, aplica cambio de email/teléfono
- `RequestOtpUseCase`, `VerifyOtpAndUpdateUseCase`
- Integración con proveedor SMS (Twilio, Vonage) o email (BRECHA-03)

---

#### BRECHA-06: OAuth 2.0 — Autenticación con Google [REQ-FE-07]
**Severidad: ALTA**

El SRS (`REQ-FE-07`) requiere "Continuar con Google" como método de login.

**Lo que falta:**
- Dependencia: `@fastify/passport` + `passport-google-oauth20`
- `POST /api/auth/google/callback` — exchange de código por token, upsert de usuario
- `GoogleOAuthUseCase`
- Variable de entorno `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- Campo `oauth_provider` / `oauth_id` en tabla `users` (migración)

---

#### BRECHA-07: 2FA/MFA para Administradores [REQ-SEC-09]
**Severidad: ALTA — El SRS lo califica de "ineludible"**

El SRS dice literalmente: *"Requisito ineludible para el acceso al panel CMS. La verificación de identidad de los administradores exigirá un token dinámico basado en tiempo (TOTP)..."*

Actualmente el admin login solo requiere email + password. La re-auth de reembolsos usa Argon2 sobre la contraseña (correcto), pero no hay TOTP.

**Lo que falta:**
- Dependencia: `otpauth` o `speakeasy` (TOTP RFC 6238)
- Campo `totp_secret` en tabla `users` (nullable, sólo admins)
- `POST /api/admin/auth/setup-2fa` — genera QR para authenticator app
- `POST /api/admin/auth/verify-2fa` — valida TOTP code, activa 2FA
- Modificar `AdminLoginUseCase` para exigir TOTP cuando `totp_enabled = true`
- UI: input de código de 6 dígitos en el login CMS

---

#### BRECHA-08: Generador Asíncrono de Reportes [CMS-BE-05, CMS-FE-18]
**Severidad: MEDIA-ALTA**

El SRS define un sistema de exportación de datos (CSV/JSON) vía BullMQ con notificación WebSocket al completarse.

**Lo que falta:**
- `POST /api/admin/reports/export` — recibe entidad, rango fechas, formato
- `GenerateReportUseCase` — consulta BD, formatea, guarda en S3/temp
- Job BullMQ tipo `generate-report`
- Worker para `generate-report`
- Notificación WebSocket al admin cuando el reporte esté listo (depende de BRECHA-02)
- Endpoint de descarga del reporte generado

---

### 1.2 MÓDULOS PARCIALMENTE IMPLEMENTADOS

#### BRECHA-09: Endpoints READ Faltantes para CMS [CMS-FE-06, CMS-FE-15]
**Severidad: ALTA — Sin esto el frontend CMS no puede pre-llenar formularios de edición**

Los routes de admin solo exponen mutaciones, no lecturas. El frontend no puede obtener datos para:

| Endpoint faltante | Necesario para |
|---|---|
| `GET /api/admin/products` (paginado + filtros) | Listar productos en CMS, Monitor Global (CMS-FE-16) |
| `GET /api/admin/products/:id` | Pre-llenar formulario de edición (CMS-FE-06) |
| `GET /api/admin/coupons` (paginado) | Listar cupones activos/inactivos (CMS-FE-15) |
| `GET /api/admin/coupons/:id` | Pre-llenar formulario de edición de cupón |
| `GET /api/admin/categories` | Listar categorías para el Creatable Select |
| `GET /api/admin/users/:id` | Ver perfil individual de cliente (CMS-FE-14) |
| `GET /api/admin/users/:id/wallet` | Libro Mayor individual del cliente (CMS-FE-14) |

---

#### BRECHA-10: Dashboard Analítico — Sin Endpoints de Analítica [CMS-FE-02]
**Severidad: MEDIA**

No existe ningún endpoint de analítica. El CMS-FE-02 requiere:

**Lo que falta:**
- `GET /api/admin/analytics/summary` — total ventas, ticket promedio, pedidos del período
- `GET /api/admin/analytics/top-products?start=&end=&limit=10` — top 10 más vendidos por fecha
- `GET /api/admin/analytics/conversion-funnel` — usuarios registrados vs. pedidos
- `GetSalesAnalyticsUseCase`, `GetTopProductsAdminUseCase`
- Índices para optimizar queries de analítica: `idx_orders_created_at`, `idx_order_items_product_id`

---

#### BRECHA-11: Gestión de Banners/Carrusel Hero [CMS-FE-03, REQ-FE-01]
**Severidad: MEDIA**

El REQ-FE-01 define que el Hero Carousel del landing es dinámico y controlado por CMS. No hay tabla ni endpoints.

**Lo que falta:**
- Tabla `banners` (id, title, layer1_url, layer2_svg_url, video_url, cta_url, is_active, display_order, created_at)
- `GET /api/banners` — público, retorna banners activos ordenados (el activo del juego primero)
- CRUD admin: `POST /api/admin/banners`, `PUT /api/admin/banners/:id`, `PATCH /api/admin/banners/:id/toggle`
- Reordenamiento: `PATCH /api/admin/banners/reorder`

---

#### BRECHA-12: Editor de Textos Legales [CMS-FE-12]
**Severidad: MEDIA**

Las páginas legales (Aviso de Privacidad, T&C, Políticas de Seguridad) son estáticas. El SRS requiere que el admin las edite sin reprogramar.

**Lo que falta:**
- Tabla `legal_documents` (id, slug, title, content_html, version, updated_at)
- `GET /api/legal/:slug` — público (para que el frontend las renderice dinámicamente)
- `GET /api/admin/legal` — listar todos los documentos
- `PUT /api/admin/legal/:slug` — actualizar contenido WYSIWYG

---

#### BRECHA-13: Sistema de Loyalidad/Gamificación [REQ-FE-14 V10]
**Severidad: BAJA-MEDIA (V10 Enterprise)**

El Tier System RPG (Bronce, Jaguar, etc.) con barra de XP y beneficios logísticos dinámicos.

**Lo que falta:**
- Campos `xp_points`, `tier_level` en tabla `users` o tabla `user_tiers` separada
- Lógica de ganancia de XP al confirmar pedido (trigger o use case post-checkout)
- `GetUserTierUseCase` — incluido en `ProfileResponseDTO`
- Modificación del `ProcessCheckoutUseCase` para aplicar umbral de envío gratis reducido por tier

---

#### BRECHA-14: Wishlist / Favoritos [REQ-FE-19]
**Severidad: BAJA**

No hay tabla `wishlists` ni endpoints. El frontend no puede guardar favoritos.

---

#### BRECHA-15: Cambio del Developer Code desde CMS [CMS-FE-11]
**Severidad: BAJA**

El SRS dice que el admin debe poder cambiar el "Código de Desarrollador" desde la pantalla de Settings, con confirmación doble. Actualmente `UpdateSystemSettingsUseCase` excluye explícitamente `developer_code_hash`.

---

### 1.3 REQUERIMIENTOS SRS CUBIERTOS PERO INCOMPLETOS

#### BRECHA-16: Configuración del Sistema — Desincronización en Runtime
**Severidad: ALTA (BUG FUNCIONAL)**

`ProcessCheckoutUseCase` recibe `systemConfig` como parámetro en `main.ts`. El problema:

```typescript
// main.ts línea ~314
checkoutSystemConfig = await systemSettingsRepository.getAll();
// Se carga UNA VEZ en el arranque del servidor
const processCheckoutUseCase = new ProcessCheckoutUseCase(..., systemConfig: checkoutSystemConfig);
```

Si el admin actualiza los costos de envío vía `PUT /api/admin/settings`, **el checkout seguirá usando los valores del arranque hasta que el servidor se reinicie**. Un cambio de `freeShippingThreshold` de $1,500 a $800 no tiene efecto hasta el próximo restart.

**Fix:** Inyectar `ISystemSettingsRepository` directamente en `ProcessCheckoutUseCase` y consultar la BD en cada ejecución (con cache de Redis TTL 5 min para no saturar).

---

#### BRECHA-17: Top Productos sin Caché Redis [REQ-BE-03]
**Severidad: MEDIA**

`GetTopProductsUseCase` dice en un comentario: *"La lógica de caché Redis se implementará en la capa de infraestructura"*. Ni el controlador ni ningún middleware implementan ese caché.

```typescript
// ProductController.getTopProducts — solo llama al use case sin caché
const products = await this.getTopProductsUseCase.execute(limit);
```

Bajo carga, `findTopSelling()` hace un `ORDER BY total_sold DESC` en toda la tabla de order_items en cada request.

---

#### BRECHA-18: Índices Faltantes en Base de Datos
**Severidad: MEDIA (Rendimiento en producción)**

Los índices actuales son adecuados para el estado actual, pero faltan tres críticos:

| Índice faltante | Tabla | Usado por | Impacto |
|---|---|---|---|
| `idx_orders_stripe_pi_id` | `orders(stripe_payment_intent_id)` | Webhook Stripe (alta frecuencia) | Full table scan en cada evento de pago |
| `idx_orders_created_at` | `orders(created_at DESC)` | Analytics, reportes, paginación | Sin orden eficiente para queries temporales |
| `idx_wallet_transactions_order_id` | `wallet_transactions(order_id)` | `CancelOrderUseCase` busca tx original | Sin índice, scan completo en cancelaciones |
| `idx_order_items_variant_id` | `order_items(variant_id)` | Analytics top productos | Lento para `GetTopProductsUseCase` |

---

---

## SECCIÓN 2 — VULNERABILIDADES Y DEUDA TÉCNICA

### 2.1 RACE CONDITIONS

#### VULN-01: Race Condition en Incremento de Cupón
**Severidad: ALTA**

La validación de cupos disponibles y el incremento son dos operaciones separadas:

```typescript
// ProcessCheckoutUseCase — Paso 5 (validación)
if (coupon.currentUses >= coupon.maxUses) throw new CouponExhaustedError(...)
// ... muchos pasos después ...
// CouponRepository.incrementUsage — Paso 10
UPDATE coupons SET current_uses = current_uses + 1 WHERE id = X
```

Si dos checkouts concurrent leen `currentUses = 49` con `maxUses = 50`, ambos pasan la validación, ambos incrementan, y `current_uses` queda en `51`, violando el constraint de BD `current_uses <= max_uses` con una excepción no controlada en producción.

**Fix correcto:**
```sql
UPDATE coupons
SET current_uses = current_uses + 1
WHERE id = :couponId AND current_uses < max_uses
RETURNING id;
-- Si rowCount === 0 → lanzar CouponExhaustedError (la condición fue alcanzada concurrentemente)
```

---

#### VULN-02: Stock Lock No Cubre el Webhook de Stripe [REQ-BE-01]
**Severidad: MEDIA**

El Redis lock de stock (`stock-lock:{variantId}`, TTL 10 min) se adquiere en el checkout y se libera al final. Pero el flujo 3D Secure puede tardar más de 10 minutos. Cuando el webhook `payment_intent.succeeded` llega, el lock ya expiró.

El `WebhookPaymentReconciliationUseCase` verifica el stock actual antes de decrementar (`StockExpiredAfter3DSecureError`), pero ese stock pudo haber sido comprado por otra persona en esos 10 minutos, resultando en stock negativo si no se maneja la excepción correctamente.

**Estado actual:** Hay un `StockExpiredAfter3DSecureError` en el dominio. El webhook cancela el pedido en ese caso. Esto es correcto en lógica pero genera una mala experiencia: el usuario pagó y su pedido se cancela sin aviso inmediato (el email transaccional que lo notificaría no existe, BRECHA-03).

---

#### VULN-03: `getOrCreate` de Wallet Sin Transacción Atómica
**Severidad: BAJA (mitigada por UNIQUE constraint)**

```typescript
// WalletRepository.getOrCreate
const existing = await this.findByUserId(userId);
if (existing) return existing;
// Si dos requests llegan simultáneamente y ambas pasan aquí...
const row = await db.insertInto('wallet').values({ user_id: userId })...
```

Dos requests concurrentes del mismo usuario podrían intentar crear dos wallets. El UNIQUE constraint en `wallet(user_id)` hace que la segunda inserte falle con error de DB, que Kysely convierte en excepción no controlada en lugar de retornar el wallet existente.

**Fix:** `INSERT INTO wallet (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING RETURNING *` o manejo del error de constraint.

---

### 2.2 SEGURIDAD

#### VULN-04: Sin Validación de Schema JSON en Endpoints
**Severidad: ALTA**

Ningún endpoint usa Fastify's schema validation (`schema: { body: { ... } }`). Todos los controllers hacen `request.body as SomeType` — un type cast que es puramente en TypeScript y no existe en runtime.

Consecuencias:
- `POST /api/checkout` con `items: "hola"` en lugar de `items: []` causa una excepción no controlada (500) en lugar de 400
- Payloads malformados llegan hasta los use cases
- No hay protección automática contra campos inesperados (mass assignment)
- Los atacantes pueden enviar cuerpos grandes sin pre-validación

**Fastify tiene esto nativo:** añadir `schema: { body: CheckoutBodySchema }` a cada route builder genera validación automática, mensajes de error descriptivos y protege antes de tocar el use case.

---

#### VULN-05: Sin Headers de Seguridad HTTP [REQ-SEC-08]
**Severidad: MEDIA**

No está instalado `@fastify/helmet`. Las respuestas del servidor exponen:
- `X-Powered-By: Fastify` (fingerprinting del framework)
- Ausencia de `X-Content-Type-Options: nosniff`
- Ausencia de `X-Frame-Options: DENY`
- Ausencia de `Content-Security-Policy`
- Ausencia de `Strict-Transport-Security` (HSTS)

El SRS REQ-SEC-08 exige explícitamente ocultar las firmas del servidor.

---

#### VULN-06: Refresh Token Sin Rotación
**Severidad: MEDIA**

Cuando el frontend llama a `POST /api/auth/refresh`, el servidor emite un nuevo access token pero el mismo refresh token sigue válido hasta su expiración natural (7 días). Si un atacante captura un refresh token (ej. via XSS o log exposure), puede generar access tokens indefinidamente durante 7 días.

**Fix:** Implementar refresh token rotation:
1. Al usar un refresh token, invalidarlo en Redis (blocklist)
2. Emitir un nuevo refresh token junto con el nuevo access token
3. Si se detecta reuso de un token ya invalidado → revocar TODA la familia de tokens (señal de compromiso)

---

#### VULN-07: `ADMIN_ALLOWED_IPS` Bypass con IPv6/IPv4 Dual-Stack
**Severidad: BAJA (pero operacional)**

`ipAllowlistMiddleware` compara `request.ip` contra `ADMIN_ALLOWED_IPS`. En desarrollo, `127.0.0.1` y `::ffff:127.0.0.1` y `::1` son la misma IP de loopback pero representadas diferente. El `.env.example` ya incluye las tres variantes, pero en producción un servidor dual-stack puede presentar IPv6 donde se configuró IPv4, causando bloqueos inesperados para admins legítimos.

**Fix:** Normalizar `request.ip` con `net.isIPv4(ip) ? ip : net.isIPv6(ip) && ip.startsWith('::ffff:') ? ip.slice(7) : ip` antes de comparar.

---

### 2.3 ARQUITECTURA Y DEUDA TÉCNICA

#### DEUDA-01: Checkout usa Configuración Cargada en Arranque [BUG FUNCIONAL]
Descrito en BRECHA-16. La configuración logística se carga una sola vez al iniciar el servidor. Los cambios del admin en `system_settings` no afectan el checkout hasta el próximo restart.

---

#### DEUDA-02: Sin Tests Automatizados
**Severidad: ALTA para producción**

No existe ningún archivo `.spec.ts`, `.test.ts`, `jest.config.ts`, o `vitest.config.ts`. Todo el testing ha sido manual via curl.

- Los use cases son perfectamente testables sin infraestructura (inyección de dependencias)
- La lógica de la máquina de estados del Kanban, el cálculo de envío, la validación de cupones — todo debería tener tests unitarios
- Los repositorios requieren tests de integración contra la BD real

Sin tests, cualquier cambio futuro puede romper silenciosamente el motor transaccional.

---

#### DEUDA-03: Sin Paginación Cursor-Based en Endpoints de Alta Carga
**Severidad: MEDIA**

Todos los endpoints paginados usan `LIMIT/OFFSET`. Bajo carga alta (>10,000 órdenes), `OFFSET 900` implica que PostgreSQL lee 900 filas y las descarta — rendimiento O(n). Los endpoints de admin (`GET /api/admin/orders`, `GET /api/admin/audit-logs`) son los más afectados.

**Fix recomendado:** Cursor-based pagination con `WHERE id > :cursor ORDER BY id LIMIT :limit` para las vistas de auditoría e inventario.

---

#### DEUDA-04: Carga de Imágenes sin Respaldo de URL en Producto
**Severidad: MEDIA**

`UploadProductImageUseCase` sube la imagen a S3 y retorna la URL, pero **no actualiza el campo `image_url` del producto en la BD**. La URL devuelta al frontend no se persiste automáticamente.

Verificar si `AdminProductController` recibe la URL y llama a `UpdateProductUseCase` para persistirla, o si esto es responsabilidad del frontend hacer un segundo request.

---

#### DEUDA-05: `processCheckoutUseCase` no Inyecta `ISystemSettingsRepository`
Relacionado con DEUDA-01. El checkout debería inyectar el repositorio de configuración y consultarlo dinámicamente (con Redis cache) en cada ejecución.

---

#### DEUDA-06: Logs Estructurados Ausentes
**Severidad: MEDIA**

Fastify tiene su propio logger (Pino) integrado. El código usa `console.error()` directamente en los controllers y use cases para errores. En producción esto:
- Pierde contexto (requestId, traceId, userId)
- No es indexable por herramientas SIEM (REQ-SEC-11)
- Dificulta el debugging de incidentes

**Fix:** Usar `request.log.error()` dentro de Fastify, y configurar Pino con `redact` para no loguear contraseñas o tokens.

---

#### DEUDA-07: Ausencia de Manejo Unificado de Errores
**Severidad: MEDIA**

Cada controlador tiene su propio bloque `catch` con su lógica de mapeo de errores. Si se añade un nuevo error de dominio, hay que actualizar todos los controladores donde ese error puede propagarse. Un `setErrorHandler` global de Fastify con un mapa de error → statusCode centralizaría esto.

---

## SECCIÓN 3 — VEREDICTO FINAL

### 3.1 Métricas de Cumplimiento por Módulo SRS

| Módulo SRS | Reqs. Definidos | Implementados | % |
|---|---|---|---|
| Auth Clientes (REQ-FE-07,08,10 / Auth) | 6 | 3 (login, register, refresh) | 50% |
| Catálogo Público (REQ-FE-02,11,12) | 4 | 4 | 100% |
| Perfil / Direcciones / Monedero | 8 | 7 (OTP stub) | 87% |
| Checkout + Pagos (REQ-BE-01,02,05,07,08) | 10 | 10 | 100% |
| Cancelaciones + Recompensas | 4 | 4 | 100% |
| Donaciones (REQ-BE-09, CMS-FE-13) | 4 | 0 | **0%** |
| Notificaciones Email (REQ-BE-04) | 3 | 0 | **0%** |
| WebSockets (REQ-BE-10, REQ-FE-24,32) | 5 | 0 | **0%** |
| Recuperación de Contraseña (REQ-FE-10) | 2 | 0 | **0%** |
| OTP Email/Teléfono (REQ-FE-16) | 2 | 0 (stub) | **0%** |
| OAuth Google (REQ-FE-07) | 2 | 0 | **0%** |
| CMS Admin Auth (CMS-BE-01 + Fases 21) | 5 | 5 | 100% |
| CMS Catálogo CRUD (CMS-FE-06 + Fases 22-23) | 8 | 6 (faltan GETs) | 75% |
| CMS Kanban + CRM + Cupones (Fases 24-25) | 8 | 7 (faltan GETs) | 87% |
| CMS Dashboard Analítico (CMS-FE-02) | 3 | 0 | **0%** |
| CMS Banners (CMS-FE-03, REQ-FE-01) | 3 | 0 | **0%** |
| CMS Reportes (CMS-BE-05, CMS-FE-18) | 3 | 0 | **0%** |
| CMS Textos Legales (CMS-FE-12) | 2 | 0 | **0%** |
| 2FA Admin (REQ-SEC-09) | 2 | 0 | **0%** |
| Gamificación/Tiers (REQ-FE-14 V10) | 3 | 0 | **0%** |
| Wishlist (REQ-FE-19) | 2 | 0 | **0%** |
| **TOTAL** | **89** | **~55** | **~62%** |

### 3.2 Veredicto Directo

**El backend Animayuks Fases 12-26 implementó correctamente el core transaccional de e-commerce.** La arquitectura hexagonal está bien ejecutada, el motor de checkout es robusto, la auditoría inmutable funciona, y la seguridad perimetral del CMS es sólida.

**Sin embargo, el SRS define un sistema de plataforma completo — no solo e-commerce.** Ocho módulos enteros (donaciones, WebSockets, email transaccional, password recovery, OTP, OAuth, analytics, 2FA) que el SRS describe como requerimientos, no como "bonus features", están ausentes del código.

**El backend NO está listo para producción en el estado actual porque:**
1. Un usuario no puede recuperar su contraseña si la olvida
2. Los administradores no reciben notificaciones de nuevos pedidos
3. Los clientes no reciben emails de confirmación ni de estado de envío
4. El canal de donaciones (ingreso directo) no existe
5. Los administradores no tienen 2FA (el SRS lo marca como "ineludible")

---

## SECCIÓN 4 — EXTENSIÓN DEL PLAN DE TRABAJO

Las fases 27-31 a continuación se redactan con la misma estructura que las fases 12-26 y deben añadirse a `MD/task.md`.

---

### Fase 27 — Módulo de Donaciones (REQ-BE-09, CMS-FE-13)
**Prioridad: ALTA — Canal de ingresos**

**27.1 — Migración `012_donations_schema.ts`**
- [ ] Tabla `donations`: id (UUID PK), stripe_payment_intent_id (VARCHAR UNIQUE), amount (NUMERIC 10,2 NOT NULL), donor_email (VARCHAR 255 NOT NULL), status ('PENDING'/'COMPLETED'/'REFUNDED'), stripe_charge_id (VARCHAR NULLABLE), idempotency_key (VARCHAR UNIQUE), created_at
- [ ] Constraint CHECK: `amount >= 0`
- [ ] Índice `idx_donations_created_at` para reportes cronológicos
- [ ] Seed en `system_settings`: `donation_min_amount = 10` y `donation_image_url = ''`

**27.2 — Dominio**
- [ ] `domain/entities/Donation.ts`: interfaz con id, amount, donorEmail, status, stripePaymentIntentId
- [ ] `domain/types/DonationDTOs.ts`: `CreateDonationDTO { amount, donorEmail?, idempotencyKey }`, `DonationResponseDTO`
- [ ] `domain/errors/DonationErrors.ts`: `DonationAmountTooLowError` (422), `DonationAlreadyProcessedError` (409)
- [ ] Añadir `donation_min_amount` a `ISystemSettingsRepository.getAll()` retorno

**27.3 — Contratos**
- [ ] `application/interfaces/IDonationRepository.ts`: `create(dto)`, `findByIdempotencyKey(key)`, `findByStripePaymentIntentId(piId)`, `findAll(filter, page, limit)`, `updateStatus(id, status)`

**27.4 — Use Cases**
- [ ] `ProcessDonationUseCase.ts` ← (donationRepository, paymentGateway, systemSettingsRepository):
  1. Verificar idempotencia en `donations` table
  2. Leer `donation_min_amount` de system_settings — rechazar si `amount < min`
  3. `paymentGateway.createPaymentIntent(amount, 'mxn', { type: 'DONATION', donorEmail })`
  4. Crear registro en `donations` con status `PENDING`
  5. Retornar `DonationResponseDTO { donationId, clientSecret }`
- [ ] `ConfirmDonationWebhookUseCase.ts` ← (donationRepository, paymentGateway, emailService):
  1. Verificar firma HMAC Stripe
  2. En `payment_intent.succeeded`: actualizar status → `COMPLETED`, disparar email de recibo al donante
- [ ] `AdminListDonationsUseCase.ts` ← (donationRepository): paginado con filtros fecha/estado
- [ ] `UpdateDonationCmsImageUseCase.ts`: actualiza `donation_image_url` en system_settings

**27.5 — Controladores y Rutas**
- [ ] `DonationController.ts`: `donate` (público), `handleWebhook` (solo firma Stripe)
- [ ] `POST /api/donate` (sin authMiddleware, con rawBodyMiddleware para webhook HMAC)
- [ ] `AdminDonationController.ts`, `adminDonationRoutes.ts`
- [ ] `GET /api/admin/donations` (paginado), `PUT /api/admin/donations/cms-image`

**27.6 — Verificación**
- [ ] Probar monto por debajo del mínimo → 422
- [ ] Probar idempotencia: mismo `idempotency_key` → devuelve la donación existente
- [ ] Simular webhook de Stripe → status cambia a COMPLETED, email enviado (con email mock)

---

### Fase 28 — Infraestructura de Comunicación: Email + WebSockets
**Prioridad: ALTA — Requerida por REQ-BE-04, REQ-BE-10, REQ-FE-24**

Esta fase es un prerequisito para las notificaciones de Fase 29.

**28.1 — Servicio de Email Transaccional**
- [ ] Instalar dependencia elegida (recomendado: `resend` por su API simple, o `nodemailer` + SES)
- [ ] `application/interfaces/IEmailService.ts`: `sendOrderStatusEmail(to, orderSummary, newStatus)`, `sendDonationReceiptEmail(to, amount, donationId)`, `sendPasswordResetEmail(to, resetLink)`, `sendOtpEmail(to, otp, purpose)`
- [ ] `infrastructure/services/email/ResendEmailService.ts` (o `NodemailerSESService.ts`): implementa la interfaz
- [ ] Variables de entorno: `EMAIL_API_KEY`, `EMAIL_FROM="noreply@animayuks.com"`, `EMAIL_REPLY_TO`
- [ ] Templates HTML básicos para cada tipo de email (confirmación orden, estado, cancelación, OTP, password reset, recibo donación)
- [ ] Job BullMQ `send-email` con retry exponencial y DLQ
- [ ] Worker `email.worker.ts` que consume la cola y llama a `IEmailService`

**28.2 — Servidor WebSocket**
- [ ] Instalar `@fastify/websocket`
- [ ] `infrastructure/realtime/WebSocketServer.ts`:
  - Canales: `user:{userId}` (notificaciones personales), `admin` (kanban en tiempo real), `public` (social proof FOMO)
  - `broadcast(channel, event)`, `sendToUser(userId, event)`, `sendToAdmins(event)`
  - Reconexión automática con exponential backoff
- [ ] `application/interfaces/IRealtimeService.ts`: `notifyUser(userId, event)`, `notifyAdmins(event)`, `broadcastPublic(event)`
- [ ] `GET /api/realtime/ws` — endpoint de handshake WebSocket con autenticación por JWT query param
- [ ] Integrar `IRealtimeService` en BullMQ worker para disparar eventos de estado de pedido

**28.3 — Headers de Seguridad**
- [ ] Instalar `@fastify/helmet`
- [ ] Registrar en `main.ts` con política CSP básica que permita WebSockets

**28.4 — Cache Redis para Top Productos**
- [ ] Modificar `ProductController.getTopProducts` para verificar Redis `cache:top-products:{limit}` con TTL 3600s
- [ ] Si existe → retornar del cache, si no → consultar BD, guardar en cache
- [ ] Invalidar cache cuando se actualice stock o cuando un nuevo pedido se confirme (evento BullMQ)

**28.5 — Verificación**
- [ ] Conectar cliente WebSocket con JWT y recibir evento de prueba
- [ ] Verificar que `resend` (o nodemailer) envía email real en sandbox
- [ ] Verificar headers de seguridad con `curl -I http://localhost:3000/api/health`

---

### Fase 29 — Auth Avanzada: Password Recovery, OTP, OAuth y 2FA Admin
**Prioridad: ALTA**

**29.1 — Migración `013_auth_advanced_schema.ts`**
- [ ] Tabla `password_reset_tokens`: id (UUID PK), user_id (UUID FK → users), token_hash (VARCHAR 64, Argon2id del token raw), expires_at (TIMESTAMPTZ), used_at (TIMESTAMPTZ NULLABLE), created_at
- [ ] Constraint: índice UNIQUE sobre `token_hash`
- [ ] Campos nuevos en `users`: `totp_secret` (VARCHAR 64 ENCRYPTED, NULLABLE), `totp_enabled` (BOOLEAN DEFAULT false)
- [ ] Campos nuevos en `users`: `oauth_provider` (VARCHAR 20 NULLABLE), `oauth_id` (VARCHAR 255 NULLABLE)
- [ ] Índice UNIQUE sobre `(oauth_provider, oauth_id)` para upsert OAuth

**29.2 — Recuperación de Contraseña**
- [ ] `ForgotPasswordUseCase.ts` ← (userRepository, emailService):
  1. Buscar usuario por email — si no existe, responder 200 igualmente (no revelar si email existe)
  2. Generar token UUID raw → hashear con Argon2id → guardar en `password_reset_tokens`
  3. Enviar email con link `{FRONTEND_URL}/reset-password?token={rawToken}`
  4. TTL del token: 15 minutos
- [ ] `ResetPasswordUseCase.ts` ← (userRepository):
  1. Buscar token en BD, verificar no expirado, no usado
  2. Verificar token raw contra `token_hash` con Argon2 verify
  3. Actualizar `password_hash` del usuario
  4. Marcar token como `used_at = NOW()`
- [ ] `POST /api/auth/forgot-password` (público)
- [ ] `POST /api/auth/reset-password` (público, body: `{ token, newPassword }`)

**29.3 — OTP para Cambio de Email/Teléfono**
- [ ] Redis key: `otp:{userId}:{field}` (field = 'email' | 'phone') → valor cifrado → TTL 600s
- [ ] `RequestOtpUseCase.ts` ← (userRepository, emailService o smsService):
  1. Generar código 6 dígitos aleatorio
  2. Guardar en Redis con TTL 10 min
  3. Enviar por email (field=email) o SMS (field=phone)
- [ ] `VerifyOtpAndUpdateUseCase.ts` ← (userRepository):
  1. Leer OTP de Redis, comparar
  2. Si correcto → aplicar cambio, eliminar key Redis
  3. Si incorrecto → decrementar intentos (max 3) → después del 3° bloquear 30 min
- [ ] `POST /api/profile/otp/request` (protegido por authMiddleware)
- [ ] `POST /api/profile/otp/verify` (protegido por authMiddleware, body: `{ field, code, newValue }`)
- [ ] Actualizar `UpdateProfileUseCase` para aceptar email/phone cuando OTP esté verificado

**29.4 — OAuth 2.0 con Google**
- [ ] Instalar `@fastify/passport` + `passport-google-oauth20`
- [ ] `GoogleOAuthUseCase.ts` ← (userRepository): upsert de usuario por `oauth_id`
- [ ] `GET /api/auth/google` — redirige a Google consent
- [ ] `GET /api/auth/google/callback` — intercambia code por tokens, crea sesión JWT
- [ ] Variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**29.5 — 2FA TOTP para Administradores (REQ-SEC-09)**
- [ ] Instalar `otpauth`
- [ ] `SetupTotpUseCase.ts` ← (userRepository):
  1. Generar `totp_secret` aleatorio
  2. Guardar en `users.totp_secret` (pendiente de activación)
  3. Retornar URI `otpauth://totp/...` para generar QR code
- [ ] `ActivateTotpUseCase.ts` ← (userRepository):
  1. Verificar el código TOTP actual con la secret pendiente
  2. Si correcto → marcar `totp_enabled = true`
- [ ] Modificar `AdminLoginUseCase`:
  - Si `user.totp_enabled = true`, el login retorna `{ requiresTotp: true, tempToken: '...' }` en lugar del JWT final
  - `POST /api/admin/auth/totp-verify` recibe `{ tempToken, totpCode }` → emite JWT real
- [ ] `POST /api/admin/auth/2fa/setup` — genera QR
- [ ] `POST /api/admin/auth/2fa/activate` — activa 2FA con primer código válido
- [ ] `POST /api/admin/auth/2fa/verify` — segundo paso del login

---

### Fase 30 — CMS Completar: Reads, Analytics, Banners, Textos Legales
**Prioridad: MEDIA — Sin esto el frontend CMS no puede renderizar**

**30.1 — Endpoints READ del CMS (Bloqueantes para el frontend)**
- [ ] `GET /api/admin/products` — paginado, con filtros `?categoryId=&search=&isDeleted=false`
  - `ListProductsAdminUseCase.ts` ← (adminProductRepository)
  - Necesario para el CRUD y el Monitor Global de Inventario
- [ ] `GET /api/admin/products/:id` — detalle para pre-llenar formulario de edición
- [ ] `GET /api/admin/coupons` — paginado, filtros `?isActive=&discountType=`
  - `ListCouponsAdminUseCase.ts` ← (couponRepository)
- [ ] `GET /api/admin/coupons/:id`
- [ ] `GET /api/admin/categories` — listar todas las categorías (para el Creatable Select)
- [ ] `GET /api/admin/users/:id` — perfil individual del cliente
  - Incluye datos de usuario, wallet, total de pedidos, fecha de registro
  - `GetUserProfileAdminUseCase.ts` ← (userRepository, walletRepository, orderRepository)
- [ ] `GET /api/admin/users/:id/wallet` — ledger del monedero individual
  - `GetUserWalletAdminUseCase.ts`

**30.2 — Dashboard Analítico**
- [ ] Migración: índices `idx_orders_created_at`, `idx_order_items_product_id_quantity`
- [ ] `GetSalesAnalyticsUseCase.ts` ← (orderRepository):
  - Parámetros: `startDate`, `endDate`
  - Retorna: total ventas, ticket promedio, total pedidos, pedidos por estado
- [ ] `GetTopProductsAdminUseCase.ts` ← (orderRepository): consulta `order_items` con JOIN productos, agrupa por `product_id`, ordena por cantidad total
- [ ] `GET /api/admin/analytics/summary?start=&end=`
- [ ] `GET /api/admin/analytics/top-products?start=&end=&limit=10`

**30.3 — Gestión de Banners**
- [ ] Migración `014_banners_schema.ts`: tabla `banners` (id, internal_title NOT NULL, layer1_url, layer2_svg_url, video_url NULLABLE, cta_url NULLABLE, is_active DEFAULT false, display_order INTEGER, created_at)
- [ ] `domain/entities/Banner.ts`, DTOs, errores
- [ ] `IBannerRepository.ts`: `findAllActive()`, `findAll()`, `findById()`, `create()`, `update()`, `toggleActive()`, `reorder()`
- [ ] Use Cases: `GetBannersUseCase` (público), `CreateBannerUseCase`, `UpdateBannerUseCase`, `ToggleBannerUseCase`, `ReorderBannersUseCase`
- [ ] `GET /api/banners` (público — para el landing)
- [ ] CRUD admin bajo `/api/admin/banners`

**30.4 — Editor de Textos Legales**
- [ ] Migración `015_legal_documents_schema.ts`: tabla `legal_documents` (id UUID PK, slug VARCHAR UNIQUE NOT NULL, title VARCHAR NOT NULL, content_html TEXT NOT NULL, version VARCHAR 10, updated_at)
- [ ] Seed inicial: 4 documentos (aviso-privacidad, terminos-condiciones, politicas-seguridad, terminos-juego)
- [ ] `GET /api/legal/:slug` (público)
- [ ] `GET /api/admin/legal` / `PUT /api/admin/legal/:slug`

**30.5 — Correcciones de Deuda Técnica**
- [ ] **Migración `016_missing_indices.ts`**: añadir los 4 índices de BRECHA-18
- [ ] **Fix Race Condition Cupón** (VULN-01): Modificar `CouponRepository.incrementUsage` para usar UPDATE condicional con verificación de rowCount
- [ ] **Fix Wallet `getOrCreate`** (VULN-03): Usar `INSERT ... ON CONFLICT DO NOTHING`
- [ ] **Fix `ProcessCheckoutUseCase` config dinámica**: Inyectar `ISystemSettingsRepository`, consultar por request con Redis cache TTL 5 min
- [ ] **Fix `UploadProductImageUseCase`**: Verificar si URL se persiste en producto; si no, añadir `productRepository.updateImageUrl(productId, url)` dentro del use case
- [ ] **Añadir `@fastify/helmet`** en `main.ts` con política CSP que permita WS
- [ ] **Validación de Schema JSON**: Añadir schemas Fastify a los 5 endpoints más críticos (checkout, donate, login, register, refund)

---

### Fase 31 — Generador de Reportes + Wishlist + Gamificación
**Prioridad: BAJA-MEDIA (completitud del SRS)**

**31.1 — Generador Asíncrono de Reportes (CMS-BE-05)**
- [ ] Job BullMQ `generate-report`: recibe `{ entity, startDate, endDate, format }`
- [ ] `GenerateReportUseCase.ts`: ejecuta query parametrizada, genera CSV/JSON, sube a S3 con URL firmada (TTL 1h), notifica al admin via WebSocket
- [ ] `POST /api/admin/reports/export` → encola job, retorna `{ jobId }`
- [ ] `GET /api/admin/reports/:jobId/status` → estado del job y URL de descarga cuando listo
- [ ] Worker `report.worker.ts`

**31.2 — Wishlist / Favoritos (REQ-FE-19)**
- [ ] Migración `017_wishlist_schema.ts`: tabla `wishlist_items` (id UUID PK, user_id FK, product_id FK, created_at) + UNIQUE(user_id, product_id)
- [ ] `GET /api/profile/wishlist` — lista con stock en tiempo real
- [ ] `POST /api/profile/wishlist` — añadir producto
- [ ] `DELETE /api/profile/wishlist/:productId` — eliminar

**31.3 — Sistema de Tiers / Gamificación (REQ-FE-14 V10)**
- [ ] Campos: `xp_points INTEGER DEFAULT 0`, `tier_level VARCHAR DEFAULT 'BRONCE'` en `users`
- [ ] `XP_PER_MXN = 1` (1 XP por peso gastado)
- [ ] En `ProcessPaymentWebhookUseCase`, después de confirmar pago: acreditar XP = `totalPaid`
- [ ] Tier thresholds definidos en `system_settings`
- [ ] `GetUserTierUseCase.ts` incluido en `GetProfileUseCase` response
- [ ] Modificar `ProcessCheckoutUseCase`: si `tier_level === 'JAGUAR'`, reducir `freeShippingThreshold` × 0.75

**31.4 — Cambio del Developer Code (CMS-FE-11)**
- [ ] `POST /api/admin/auth/change-developer-code` con body `{ currentCode, newCode, confirmNewCode }`
- [ ] `ChangeDeveloperCodeUseCase.ts` ← (systemSettingsRepository, userRepository):
  1. Verificar `currentCode` contra hash actual en `system_settings`
  2. Verificar `newCode === confirmNewCode`
  3. Hashear `newCode` con Argon2id
  4. Actualizar `system_settings` `developer_code_hash`
- [ ] Protegida por la cadena admin completa + re-auth de contraseña

---

## RESUMEN DE PRIORIDADES PARA EL JEFE DE PROYECTO

### Bloqueantes para Lanzamiento (Fase 27-29)
1. **Fase 27** — Donaciones: canal de ingresos mandatorio en el SRS
2. **Fase 28** — Email transaccional: sin esto los usuarios no saben el estado de sus pedidos
3. **Fase 29** — Password recovery: sin esto los usuarios quedan bloqueados permanentemente

### Necesarios para el CMS Funcional (Fase 30, parcial)
4. **BRECHA-09** — GETs del CMS: el frontend CMS no puede cargar sin datos de lectura
5. **BRECHA-16/DEUDA-01** — Config dinámica: los cambios del admin no aplican en runtime
6. **VULN-01** — Race condition cupones: corregir antes de campañas de marketing

### Importantes pero no bloqueantes (Fase 30, 31)
7. Analytics, Banners, Textos Legales, Reportes, Wishlist, Tiers

### Seguridad adicional (integrado en Fases 28-29)
8. `@fastify/helmet`, 2FA admin, schema validation JSON, refresh token rotation
