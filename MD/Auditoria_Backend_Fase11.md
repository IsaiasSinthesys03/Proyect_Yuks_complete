# 🔍 Auditoría Técnica Profunda — Backend Animayuks (Fase 11)

**Fecha:** 2026-06-18  
**Documentos Fuente:** `MD/SRS_v10.1.md` (v10.1) · `implementation_plan.md` · `Resolucion_Casos_Limite_v1.md`  
**Alcance:** Todo el código dentro de `/API_Backend/src/`

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Requerimientos Cumplidos](#2-requerimientos-cumplidos)
3. [Análisis de Brechas (Missing CRUDs)](#3-análisis-de-brechas-missing-cruds)
4. [Veredicto Frontend](#4-veredicto-frontend)
5. [Matriz de Cobertura Completa](#5-matriz-de-cobertura-completa)

---

## 1. Resumen Ejecutivo

| Métrica | Valor |
| :--- | :--- |
| **Endpoints activos en código** | 7 |
| **Endpoints requeridos por SRS + Plan** | ~35+ |
| **Tablas SQL en migraciones** | 5 (`users`, `profiles`, `categories`, `products`, `product_variants`) |
| **Tablas SQL requeridas por Plan** | 10+ (`+ addresses`, `orders`, `order_items`, `wallet`, `wallet_transactions`, `reward_codes`, `audit_logs`, `donations`, `coupons`, `system_settings`, `favorites`, `banners`, `notifications`, `legal_texts`) |
| **Porcentaje de cobertura estimado** | **~20%** del backend total especificado |
| **Estado del Frontend** | ❌ **BLOQUEADO** para la mayoría de flujos críticos |

> [!CAUTION]
> El backend actual cubre exclusivamente la **autenticación básica (registro/login de clientes)** y la **lectura pública del catálogo**. No existe ni un solo endpoint de escritura de productos, checkout, monedero, perfil autenticado, panel CMS, ni donaciones. El frontend solo podría construir la Landing Page, la página de Tienda (lectura) y los formularios de Login/Registro.

---

## 2. Requerimientos Cumplidos

### 2.1. Arquitectura y Fundamentos ✅

| Elemento | Estado | Notas |
| :--- | :---: | :--- |
| Clean Architecture (4 capas) | ✅ | Domain → Application → Infrastructure. Separation de responsabilidades correcta. |
| Composition Root (`main.ts`) | ✅ | Inyección de dependencias manual bien implementada. |
| Fastify como framework HTTP | ✅ | Configurado con CORS, logger (pino-pretty) y Graceful Shutdown. |
| Kysely como Query Builder | ✅ | Usado correctamente en los repositorios. Tipado estricto con `db-types.ts`. |
| PostgreSQL vía `pg` Pool | ✅ | Cliente singleton exportable. Pool max=10. |
| Redis (`ioredis`) | ✅ | Singleton instanciado. Opciones exportadas para BullMQ. |
| BullMQ (cola de tareas) | ✅ | Cola `animayuks-main-queue` instanciada con retry (3 intentos, backoff exponencial). Worker genérico con dispatcher por `job.name`. |
| Healthcheck endpoint | ✅ | `GET /api/health` — verifica DB + Redis. |
| Migraciones con Kysely Migrator | ✅ | Sistema funcional con require() explícito para Windows/CJS. |
| Argon2id para hashing | ✅ | `memoryCost: 64MB`, `timeCost: 3`, `parallelism: 4`. Cumple REQ-SEC-05. |
| JWT Authentication | ✅ | Access Token firmado con claims `sub`, `email`, `role`. |
| Auth Middleware | ✅ | Extrae Bearer token, verifica firma, adjunta `request.user`. Maneja `TokenExpiredError`. |

### 2.2. Endpoints Funcionales ✅

| # | Método | Ruta | SRS Ref | Estado |
| :--- | :--- | :--- | :--- | :---: |
| 1 | `POST` | `/api/auth/register` | REQ-FE-08 | ✅ |
| 2 | `POST` | `/api/auth/login` | REQ-FE-07 | ✅ |
| 3 | `GET` | `/api/products` | REQ-FE-11, REQ-BE-03 | ✅ |
| 4 | `GET` | `/api/products/top-sales` | REQ-FE-02, REQ-BE-03 | ✅ (placeholder) |
| 5 | `GET` | `/api/products/categories` | CMS-BE-07 (lectura) | ✅ |
| 6 | `GET` | `/api/products/:id` | REQ-FE-31 (detalle) | ✅ |
| 7 | `GET` | `/api/health` | Infraestructura | ✅ |

### 2.3. Tablas SQL en Migraciones ✅

| Tabla | Migración | Constraints Verificados |
| :--- | :--- | :--- |
| `users` | `001_initial_schema` | PK UUID, email UNIQUE, role DEFAULT 'CLIENT', is_banned DEFAULT false |
| `profiles` | `001_initial_schema` | PK UUID, user_id UNIQUE FK → users(ON DELETE CASCADE), tier_level DEFAULT 'BRONZE', xp DEFAULT 0 |
| `categories` | `002_catalog_schema` | PK UUID, `UNIQUE INDEX LOWER(name)` (case-insensitive) ✅ |
| `products` | `002_catalog_schema` | PK UUID, FK → categories, NUMERIC(10,2), is_deleted DEFAULT false (Soft Delete), version DEFAULT 1 (OCC) |
| `product_variants` | `002_catalog_schema` | PK UUID, FK → products(ON DELETE CASCADE), sku UNIQUE, `CHECK (stock >= 0)` ✅ |

### 2.4. Entidades de Dominio ✅

| Entidad | Archivo | Campos Correctos |
| :--- | :--- | :--- |
| `User` | `domain/entities/User.ts` | id, email, passwordHash, role, isBanned, createdAt |
| `Profile` | `domain/entities/Profile.ts` | id, userId, firstName, lastName, phone, tierLevel, experiencePoints, updatedAt |
| `Product` | `domain/entities/Product.ts` | id, categoryId, name, description, price, hasVirtualReward, isDeleted, version, imageUrl |
| `ProductWithCategory` | `domain/entities/Product.ts` | Extiende Product + categoryName |
| `ProductVariant` | `domain/entities/ProductVariant.ts` | id, productId, sku, size, color, stock |
| `Category` | `domain/entities/Category.ts` | id, name, createdAt |

### 2.5. Calidad del Código Implementado

| Aspecto | Evaluación |
| :--- | :--- |
| **Inversión de Dependencias** | ✅ Use Cases dependen de interfaces (`IUserRepository`, `IProductRepository`), no de implementaciones concretas. |
| **Transacciones atómicas** | ✅ `createWithProfile()` usa `db.transaction()` con rollback automático. |
| **Errores de dominio tipados** | ✅ 7 clases de error específicas (`UserAlreadyExistsError`, `InsufficientStockError`, etc.) |
| **Mapeo de errores HTTP** | ✅ Controllers traducen Domain Errors → HTTP status codes (409, 401, 403, 422, 404, 500). |
| **Sanitización de inputs** | ⚠️ Parcial. `email.toLowerCase().trim()` y paginación sanitizada. No hay validación de schema (Zod/Joi). |
| **DTOs bien definidos** | ✅ `RegisterUserDTO`, `LoginDTO`, `AuthResponseDTO`, `GetProductsQueryDTO`, `PaginatedResponseDTO`, `ProductDetailDTO`. |
| **Paginación server-side** | ✅ Con límites de seguridad (max 50 por página). |
| **Soft Delete en queries** | ✅ Todas las queries de producto incluyen `WHERE is_deleted = false`. |

---

## 3. Análisis de Brechas (Missing CRUDs)

> [!WARNING]
> Esta sección enumera **todo** lo que el SRS y el Plan de Implementación exigen y que **NO EXISTE** en el código actual. Está organizada por módulo de negocio.

---

### 3.1. 🗄️ TABLAS SQL FALTANTES

| # | Tabla | Referencia SRS/Plan | Propósito |
| :--- | :--- | :--- | :--- |
| 1 | `addresses` | REQ-FE-09, REQ-FE-17 | Libreta de direcciones del usuario (múltiples, con "Predeterminada") |
| 2 | `orders` | REQ-BE-01, REQ-FE-23 | Pedidos. Status pipeline, idempotency_key, delivery_type, terms_version, client_ip |
| 3 | `order_items` | REQ-BE-01 | Ítems por pedido (variant_id, qty, precio unitario congelado) |
| 4 | `wallet` | REQ-FE-20, REQ-BE-01 | Monedero virtual. Saldo, caducidad, `CHECK (balance >= 0)` |
| 5 | `wallet_transactions` | REQ-FE-20 | Ledger de movimientos (DEPOSIT/WITHDRAWAL, source, original_transaction_id) |
| 6 | `reward_codes` | REQ-BE-05, REQ-FE-22 | Códigos UUID para Game Bridge (AVAILABLE/CLAIMED/REVOKED) |
| 7 | `audit_logs` | CMS-BE-06, CMS-FE-10 | Bitácora inmutable vía DB Triggers (admin_email, action, old/new JSONB, IP) |
| 8 | `donations` | REQ-BE-09, REQ-FE-27 | Donaciones aisladas (amount, email, status, terms_consent) |
| 9 | `coupons` | CMS-FE-15, REQ-FE-21 | Códigos de descuento (tipo %, monto fijo, max_uses, expires_at, is_active) |
| 10 | `favorites` | REQ-FE-19 | Wishlist (user_id, product_id) |
| 11 | `banners` | CMS-FE-03, REQ-FE-01 | Hero carousel manager (image_url, video_url, svg_layer, is_active, sort_order, link_url) |
| 12 | `notifications` | REQ-FE-24, CMS-FE-19 | Notificaciones in-app persistentes (user_id, type, message, is_read) |
| 13 | `legal_texts` | CMS-FE-12, REQ-FE-28 | Textos legales versionados (privacy_policy, terms_conditions, etc.) |
| 14 | `system_settings` | CMS-FE-11, Q21 | Config global (developer_code hash, base_state, nearby_municipalities, shipping costs, free_shipping_threshold, min_purchase) |
| 15 | `payment_methods` | REQ-FE-18 | Tokens de tarjetas guardadas (últimos 4 dígitos, brand, expires_at) — vinculado a pasarela |

> **Total: 15 tablas SQL faltantes** (+ DB Triggers para `audit_logs` e índices adicionales)

---

### 3.2. 🔌 ENDPOINTS FALTANTES — API Cliente Pública (E-commerce)

#### Autenticación y Sesión

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/auth/login` (OAuth) | REQ-FE-07 | Login con Google OAuth 2.0 ("Continuar con Google") |
| 2 | `POST` | `/api/auth/refresh` | Q19 Resolución | Silent Refresh — generar nuevo Access Token con Refresh Token (HttpOnly Cookie) |
| 3 | `POST` | `/api/auth/forgot-password` | REQ-FE-10 | Enviar enlace temporal de recuperación de contraseña |
| 4 | `POST` | `/api/auth/reset-password` | REQ-FE-10 | Consumir token temporal y establecer nueva contraseña |
| 5 | `POST` | `/api/auth/logout` | Sesión | Invalidar Refresh Token |

#### Checkout y Pagos

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 6 | `POST` | `/api/checkout` | REQ-BE-01 | **Motor transaccional completo:** Idempotency Key, reserva stock (Redis lock 10min), deducción fórmula `(Subtotal - Cupón) + Envío - Monedero = Total`, cobro Stripe, commit SQL, BullMQ DLQ |
| 7 | `POST` | `/api/webhooks/stripe` | REQ-BE-02 | Webhook Stripe/MercadoPago con validación HMAC. Actualiza estado del pago. |
| 8 | `POST` | `/api/donate` | REQ-BE-09 | Donaciones anónimas. Stripe Intent directo, no afecta stock, captura email si anónimo. |

#### Perfil de Usuario Autenticado

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 9 | `GET` | `/api/profile` | REQ-FE-14, REQ-FE-15 | Información de perfil, saldo monedero, tier level, XP |
| 10 | `PUT` | `/api/profile` | REQ-FE-16 | Actualización de datos personales (con OTP si cambia email/teléfono) |
| 11 | `POST` | `/api/profile/verify-otp` | REQ-FE-16 | Verificar código OTP de 6 dígitos |

#### Direcciones

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 12 | `GET` | `/api/profile/addresses` | REQ-FE-17 | Listar direcciones del usuario |
| 13 | `POST` | `/api/profile/addresses` | REQ-FE-09 | Crear nueva dirección (registro progresivo Fase 2) |
| 14 | `PUT` | `/api/profile/addresses/:id` | REQ-FE-17 | Editar dirección |
| 15 | `DELETE` | `/api/profile/addresses/:id` | REQ-FE-17 | Eliminar dirección |
| 16 | `PATCH` | `/api/profile/addresses/:id/default` | REQ-FE-17 | Marcar como predeterminada |

#### Pedidos (Historial y Cancelación)

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 17 | `GET` | `/api/profile/orders` | REQ-FE-23 | Historial de pedidos con filtros (Activos / Finalizados) |
| 18 | `GET` | `/api/profile/orders/:id` | REQ-FE-23 | Detalle de pedido con timeline de 5 estatus |
| 19 | `POST` | `/api/profile/orders/:id/cancel` | REQ-FE-23, Plan 3.2 | Cancelación autónoma. Valida status `PAID`, consulta Game API para códigos CLAIMED, reembolsa a monedero heredando caducidad. |

#### Monedero y Recompensas

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 20 | `GET` | `/api/profile/wallet` | REQ-FE-20 | Saldo actual + historial de transacciones (ledger) |
| 21 | `GET` | `/api/profile/rewards` | REQ-FE-22, Plan 3.2 | Bóveda de recompensas (UUIDs: AVAILABLE / CLAIMED) |

#### Favoritos y Cupones

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 22 | `GET` | `/api/profile/favorites` | REQ-FE-19 | Lista de favoritos con validación de stock en tiempo real |
| 23 | `POST` | `/api/profile/favorites/:productId` | REQ-FE-19 | Agregar a favoritos |
| 24 | `DELETE` | `/api/profile/favorites/:productId` | REQ-FE-19 | Quitar de favoritos |
| 25 | `POST` | `/api/profile/coupons/redeem` | REQ-FE-21 | Canjear código de cupón |
| 26 | `GET` | `/api/profile/coupons` | REQ-FE-21 | Listar cupones del usuario (con countdown) |

#### Notificaciones

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 27 | `GET` | `/api/profile/notifications` | REQ-FE-24 | Bandeja de notificaciones (paginada) |
| 28 | `PATCH` | `/api/profile/notifications/:id/read` | REQ-FE-24 | Marcar como leída |

#### Envíos y Utilidades

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 29 | `POST` | `/api/shipping/calculate` | REQ-FE-13, REQ-BE-07 | Motor de enrutamiento logístico: CP → Estado/Municipio → LOCAL vs EXTERNAL_COURIER, cálculo dinámico |

---

### 3.3. 🔌 ENDPOINTS FALTANTES — API Game Bridge (M2M)

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 30 | `POST` | `/api/game/rewards/validate` | REQ-BE-05, Plan 3.3 | Validación de UUID in-game. Header M2M Bearer Token. Marca como CLAIMED. Rate Limiting desactivado para IPs del Game Server. |

---

### 3.4. 🔌 ENDPOINTS FALTANTES — API CMS Administrativo

#### Auth CMS

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 31 | `POST` | `/api/admin/auth/register` | CMS-FE-01, CMS-BE-01 | Registro admin con `developer_code` (Easter Egg). Valida hash Argon2id. |
| 32 | `POST` | `/api/admin/auth/login` | CMS-FE-01, CMS-BE-01 | Login admin. JWT rotación 8h (via Silent Refresh). |
| 33 | `POST` | `/api/admin/auth/2fa/setup` | REQ-SEC-09 | Configurar TOTP para 2FA obligatorio |
| 34 | `POST` | `/api/admin/auth/2fa/verify` | REQ-SEC-09 | Verificar token TOTP al hacer login |

#### CRUD Catálogo

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 35 | `POST` | `/api/admin/products` | CMS-FE-06, Plan 3.4 | Crear producto con variantes. Editor WYSIWYG. Game Linker. |
| 36 | `PUT` | `/api/admin/products/:id` | CMS-FE-06, Plan 3.4 | Editar producto. OCC con campo `version` → HTTP 409 si conflicto. |
| 37 | `DELETE` | `/api/admin/products/:id` | CMS-FE-06, Plan 3.4 | Soft Delete (`is_deleted = true`). Prohibido Hard Delete. |
| 38 | `PATCH` | `/api/admin/products/:id/variants/:variantId/stock` | CMS-FE-07/16, Plan 3.4 | Ajuste inline de stock con operaciones delta (`stock + X`). |
| 39 | `POST` | `/api/admin/categories` | CMS-BE-07 | `findOrCreate` case-insensitive. Patrón Notion. |

#### Kanban de Pedidos

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 40 | `GET` | `/api/admin/orders` | CMS-FE-04 | Listar pedidos por status (pestañas: Activos, Finalizados, Cancelaciones) |
| 41 | `PATCH` | `/api/admin/orders/:id/status` | CMS-FE-04, Plan 3.4 | Actualizar Última Milla. Modal Express (chofer, matrícula). Dispara WebSocket + correo vía BullMQ. |

#### Reembolsos

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 42 | `POST` | `/api/admin/orders/:id/refund` | CMS-FE-05 | Reembolso a monedero (razón obligatoria) o a pasarela (re-auth PIN). |

#### Banners (Hero Carousel)

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 43 | `GET` | `/api/banners` | REQ-FE-01 (público) | Listar banners activos para Hero Carousel |
| 44 | `POST` | `/api/admin/banners` | CMS-FE-03 | Crear banner (multicapa 3D, título interno obligatorio) |
| 45 | `PUT` | `/api/admin/banners/:id` | CMS-FE-03 | Editar banner |
| 46 | `PATCH` | `/api/admin/banners/:id/toggle` | CMS-FE-03 | Toggle On/Off |
| 47 | `PUT` | `/api/admin/banners/reorder` | CMS-FE-03 | Reordenar slides (drag & drop) |

#### CRM y Usuarios

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 48 | `GET` | `/api/admin/users` | CMS-FE-14 | DataGrid de usuarios (nombre, correo, saldo monedero, historial compras) |
| 49 | `GET` | `/api/admin/users/:id` | CMS-FE-14 | Perfil detallado + Ledger individual del monedero |
| 50 | `PATCH` | `/api/admin/users/:id/ban` | CMS-FE-14 | Suspender/Desbloquear cuenta. Destruir sesión activa. |

#### Cupones

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 51 | `GET` | `/api/admin/coupons` | CMS-FE-15 | Listar cupones |
| 52 | `POST` | `/api/admin/coupons` | CMS-FE-15 | Crear cupón (%, fijo, max_uses, expires_at) |
| 53 | `PUT` | `/api/admin/coupons/:id` | CMS-FE-15 | Editar cupón |
| 54 | `PATCH` | `/api/admin/coupons/:id/toggle` | CMS-FE-15 | Toggle On/Off |

#### Dashboard Analítico

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 55 | `GET` | `/api/admin/analytics/dashboard` | CMS-FE-02 | Embudo de conversión, ticket promedio, Top 10 productos. Filtros por rango de fechas. |

#### Reportes

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 56 | `POST` | `/api/admin/reports/export` | CMS-FE-18, CMS-BE-05, Plan 3.4 | Exportación asíncrona (BullMQ). CSV/JSON. Notificación WebSocket al finalizar. |

#### Bitácora

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 57 | `GET` | `/api/admin/audit-logs` | CMS-FE-10, Plan 3.4 | Tabla inmutable. Filtros: email admin, tipo acción, IP, timestamp. Payload Diff Viewer. |

#### Textos Legales

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 58 | `GET` | `/api/legal/:type` | REQ-FE-28 (público) | Obtener texto legal por tipo (privacy, terms, security, game_terms) |
| 59 | `PUT` | `/api/admin/legal/:type` | CMS-FE-12 | Editar texto legal (editor rich text). Versionar automáticamente. |

#### Donaciones (CMS)

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 60 | `GET` | `/api/admin/donations` | CMS-FE-13 | Tabla de donaciones históricas (folio, monto, correo, estado pasarela) |
| 61 | `PUT` | `/api/admin/donations/config` | CMS-FE-13 | Configurar imagen del modal y monto mínimo |

#### Configuración Global

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 62 | `GET` | `/api/admin/settings` | CMS-FE-11 | Obtener config global (dirección, base_state, municipalities, shipping costs, thresholds) |
| 63 | `PUT` | `/api/admin/settings` | CMS-FE-11 | Actualizar config global |
| 64 | `PUT` | `/api/admin/settings/developer-code` | CMS-FE-11 | Cambiar código de desarrollador (re-auth, doble confirmación) |

#### Inventario Global

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 65 | `GET` | `/api/admin/inventory` | CMS-FE-16 | DataGrid maestro de todas las variantes. Paginación server-side. Badge de status dinámico. |

#### Game Bridge CMS

| # | Método | Endpoint | SRS Ref | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| 66 | `GET` | `/api/admin/game/economy` | CMS-FE-08 | Leer economía in-game (NoSQL) |
| 67 | `PUT` | `/api/admin/game/economy` | CMS-FE-08 | Modificar costos virtuales (NoSQL) |
| 68 | `GET` | `/api/admin/game/banner` | CMS-FE-09 | Leer banner de producto en app |
| 69 | `PUT` | `/api/admin/game/banner` | CMS-FE-09 | Definir qué producto físico se muestra en la app (NoSQL) |

---

### 3.5. 🔌 SERVICIOS DE INFRAESTRUCTURA FALTANTES

| # | Servicio | SRS Ref | Estado |
| :--- | :--- | :--- | :--- |
| 1 | **WebSocket Server** (Socket.io/ws) | REQ-BE-10, REQ-FE-24, CMS-FE-04, CMS-FE-19 | ❌ No existe. Requerido para Social Proof (FOMO), notificaciones in-app (usuario y admin), Kanban en tiempo real. |
| 2 | **Stripe/MercadoPago Adapter** | REQ-BE-01, REQ-BE-02, REQ-BE-09 | ❌ No existe. Directorio `infrastructure/services/payment/` vacío o inexistente. |
| 3 | **Email Adapter** (SendGrid/SMTP) | REQ-BE-04, REQ-FE-10 | ❌ No existe. Directorio `infrastructure/services/email/` inexistente. |
| 4 | **CDN/Media Upload Adapter** (S3/Cloudinary) | CMS-BE-04 | ❌ No existe. Directorio `infrastructure/services/` inexistente. |
| 5 | **Game API Client** (HTTP M2M) | REQ-BE-05, CMS-BE-03 | ❌ No existe. Directorio `infrastructure/services/game_api/` inexistente. |
| 6 | **Caché Redis para Top Ventas** (TTL 1h) | REQ-BE-03 | ❌ No implementado. El use case `GetTopProductsUseCase` golpea la BD directamente. |
| 7 | **Redis Lock para Checkout** (10 min) | REQ-BE-01 | ❌ No existe. |
| 8 | **Rate Limiting Middleware** | REQ-BE-06, REQ-SEC-10 | ❌ No existe. |
| 9 | **IP Filtering Middleware** (Intranet simulada) | CMS-BE-01, Q22 | ❌ No existe. |
| 10 | **Validación de schemas** (Zod/Joi) | Best Practice | ❌ No existe. Los body se castean sin validación (`request.body as DTO`). |
| 11 | **DB Triggers para audit_logs** | CMS-BE-06 | ❌ No existen las migraciones. |
| 12 | **Refresh Token / Cookie HttpOnly** | Q19 | ❌ Login solo retorna Access Token en JSON. No genera Refresh Token en cookie. |
| 13 | **Búsqueda Full-Text / Fuzzy** | REQ-BE-03 | ⚠️ Parcial. Usa `ILIKE '%query%'` (el SRS prohíbe explícitamente este patrón). Falta Full-Text Search o Algolia. |

---

### 3.6. 🧩 ENTIDADES DE DOMINIO FALTANTES

| # | Entidad | Propósito |
| :--- | :--- | :--- |
| 1 | `Address` | Dirección de envío |
| 2 | `Order` | Pedido con pipeline de status |
| 3 | `OrderItem` | Ítem de pedido |
| 4 | `Wallet` | Monedero virtual |
| 5 | `WalletTransaction` | Movimiento del ledger |
| 6 | `RewardCode` | Código UUID para Game Bridge |
| 7 | `AuditLog` | Registro de bitácora |
| 8 | `Donation` | Donación voluntaria |
| 9 | `Coupon` | Cupón de descuento |
| 10 | `Banner` | Banner del Hero Carousel |
| 11 | `Notification` | Notificación in-app |
| 12 | `LegalText` | Texto legal versionado |
| 13 | `SystemSettings` | Configuración global |
| 14 | `Favorite` | Favorito/Wishlist |

---

## 4. Veredicto Frontend

> [!IMPORTANT]
> **Veredicto: El frontend NO puede construirse completamente con el backend actual.**
> Solo 4 pantallas (de ~25+) pueden funcionar al 100%.

### 4.1. Pantallas DESBLOQUEADAS ✅ (Pueden construirse ahora)

| # | Pantalla | Endpoints Disponibles | Notas |
| :--- | :--- | :--- | :--- |
| 1 | **Landing Page — Hero (parcial)** | N/A | Solo estructura estática. Los banners dinámicos del CMS requieren API. |
| 2 | **Landing Page — Top Ventas** | `GET /api/products/top-sales` | ✅ Funcional (placeholder: retorna los más recientes). |
| 3 | **Landing Page — Secciones estáticas** | N/A | "Quiénes Somos", YouTube, Personajes, Footer son estáticos. |
| 4 | **Login** | `POST /api/auth/login` | ✅ Funcional. Falta OAuth Google y Refresh Token. |
| 5 | **Registro (Fase 1)** | `POST /api/auth/register` | ✅ Funcional. Valida términos y duplicados. |
| 6 | **Tienda — Catálogo** | `GET /api/products` + `/categories` | ✅ Paginación, filtros por categoría, búsqueda por nombre. |
| 7 | **Vista Producto (lectura)** | `GET /api/products/:id` | ✅ Detalle + variantes con stock. |

### 4.2. Pantallas BLOQUEADAS ❌ (Requieren backend faltante)

| # | Pantalla Frontend | Endpoints/Servicios Faltantes | Impacto |
| :--- | :--- | :--- | :--- |
| 1 | **Hero Carousel (dinámico)** | `GET /api/banners` | No puede cargar banners del CMS. Solo markup estático. |
| 2 | **Login con Google** | OAuth 2.0 adapter | Sin flujo OAuth implementado. |
| 3 | **Recuperación de contraseña** | `/api/auth/forgot-password`, `/reset-password`, Email adapter | Flujo completo inexistente. |
| 4 | **Registro Progresivo (Fase 2)** | `/api/profile/addresses` POST | No puede guardar la dirección obligatoria en primera compra. |
| 5 | **Carrito / Drawer lateral** | `/api/shipping/calculate`, `/api/checkout` | No puede calcular envíos ni procesar pagos. |
| 6 | **Checkout completo** | `/api/checkout`, Stripe adapter, Redis lock | Motor transaccional inexistente. **BLOQUEANTE CRÍTICO.** |
| 7 | **Perfil — Quick Drawer** | `/api/profile`, wallet balance | No puede mostrar saldo de monedero ni tier level en vivo. |
| 8 | **Perfil — Datos Personales** | `PUT /api/profile`, OTP | No puede editar datos ni verificar OTP. |
| 9 | **Perfil — Direcciones** | CRUD `/api/profile/addresses` | Sin libreta de direcciones. |
| 10 | **Perfil — Métodos de Pago** | Stripe Customer Portal / Tokens | Sin gestión de tarjetas. |
| 11 | **Perfil — Favoritos** | CRUD `/api/profile/favorites` | Sin wishlist. |
| 12 | **Perfil — Monedero** | `GET /api/profile/wallet` | Sin ledger de movimientos. |
| 13 | **Perfil — Cupones** | `POST /api/profile/coupons/redeem`, GET | Sin canje ni listado. |
| 14 | **Perfil — Recompensas** | `GET /api/profile/rewards` | Sin bóveda de UUIDs. |
| 15 | **Perfil — Historial de Pedidos** | CRUD `/api/profile/orders` | Sin timeline ni cancelación. |
| 16 | **Perfil — Notificaciones** | GET/PATCH `/api/profile/notifications`, WebSocket | Sin bandeja ni tiempo real. |
| 17 | **Modal de Donaciones** | `POST /api/donate`, Stripe adapter | Sin procesamiento de pago. |
| 18 | **Social Proof (FOMO)** | WebSocket server, `REQ-BE-10` | Sin canal bidireccional. |
| 19 | **Omnibox Predictivo (Fuzzy)** | Full-Text Search / Algolia | Búsqueda actual usa `ILIKE` (prohibido por SRS). |
| 20 | **Políticas Legales (dinámicas)** | `GET /api/legal/:type` | Podrían ser estáticas temporalmente, pero sin versionado CMS. |
| 21 | **Banner Cookies/Tracking** | `system_settings` | Sin config dinámica del consentimiento. |
| 22 | **Todo el Panel CMS** | Todos los `/api/admin/*` (35+ endpoints) | **100% BLOQUEADO.** No existe ni un solo endpoint administrativo. |

### 4.3. Resumen de Bloqueo

```
┌──────────────────────────────────────────────────────────────┐
│                    ESTADO DEL FRONTEND                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Operativo:    ~4 pantallas (Landing lectura, Login,      │
│                   Registro, Catálogo/Producto lectura)        │
│                                                              │
│  ❌ Bloqueado:    ~22 pantallas / módulos                    │
│                   (TODO lo transaccional + TODO el CMS)      │
│                                                              │
│  🔴 Críticos:     Checkout, Monedero, Pedidos, Panel Admin   │
│                                                              │
│  📊 Cobertura:    ~15% del frontend puede funcionar          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Matriz de Cobertura Completa

Referencia cruzada: cada requerimiento del SRS vs. estado en código.

### API Backend (REQ-BE)

| Ref SRS | Descripción | Estado |
| :--- | :--- | :---: |
| REQ-BE-01 | Motor de Checkout (Idempotencia, Stock Lock, Monedero, Saga) | ❌ |
| REQ-BE-02 | Webhooks Stripe + 3D Secure | ❌ |
| REQ-BE-03 | Búsqueda indexada + Caché Redis Top Ventas | ⚠️ Parcial (ILIKE, sin caché) |
| REQ-BE-04 | Cola de tareas + Notificaciones (BullMQ) | ⚠️ Cola existe, workers vacíos |
| REQ-BE-05 | Motor de Recompensas (UUID Game Bridge) | ❌ |
| REQ-BE-06 | Middleware Seguridad + Rate Limiting | ⚠️ Solo CORS + JWT. Sin Rate Limiting. |
| REQ-BE-07 | Motor Enrutamiento Logístico (LOCAL vs EXTERNAL) | ❌ |
| REQ-BE-08 | Audit Trail (Consentimiento Legal) | ❌ |
| REQ-BE-09 | Endpoint Donaciones | ❌ |
| REQ-BE-10 | Motor Social Proof (WebSockets) | ❌ |

### CMS Backend (CMS-BE)

| Ref SRS | Descripción | Estado |
| :--- | :--- | :---: |
| CMS-BE-01 | Auth Admin + Developer Code | ❌ |
| CMS-BE-02 | OCC (Concurrencia Optimista) | ⚠️ Campo `version` en tabla, sin endpoint que lo use |
| CMS-BE-03 | Soft Delete + Integridad Game Bridge | ⚠️ `is_deleted` en tabla, sin endpoint DELETE |
| CMS-BE-04 | Pipeline Media (Upload → Resize → WebP → CDN) | ❌ |
| CMS-BE-05 | Reportes asíncronos (BullMQ) | ⚠️ Cola existe, sin lógica de generación |
| CMS-BE-06 | Logger Inmutable (DB Triggers) | ❌ |
| CMS-BE-07 | findOrCreate Categorías (inline) | ⚠️ Solo lectura. Sin POST para crear. |

### Seguridad (REQ-SEC)

| Ref SRS | Descripción | Estado |
| :--- | :--- | :---: |
| REQ-SEC-05 | Argon2id Hashing | ✅ |
| REQ-SEC-06 | TLS 1.3 / HSTS | — (Infraestructura de deploy) |
| REQ-SEC-08 | Ocultamiento de firmas de servidor | ❌ (Headers por defecto de Fastify) |
| REQ-SEC-09 | 2FA/MFA para CMS | ❌ |
| REQ-SEC-10 | Rate Limiting / Fail2Ban | ❌ |

---

> [!NOTE]
> **Conclusión Final:** El backend actual establece una base arquitectónica sólida (Clean Architecture, tipado fuerte, transacciones atómicas, hashing seguro), pero cubre únicamente **la lectura pública del catálogo y la autenticación básica de clientes**. Para que el frontend pueda desarrollarse en su totalidad, se necesitan implementar **~60 endpoints adicionales**, **~15 tablas SQL nuevas**, **5 servicios de infraestructura** (Stripe, Email, CDN, WebSocket, Game API Client) y múltiples middlewares de seguridad. La prioridad crítica debería ser: (1) Checkout + Pagos, (2) Perfil + Direcciones + Pedidos, (3) CMS CRUD Productos + Pedidos Admin, (4) Monedero + Cupones + Recompensas.
