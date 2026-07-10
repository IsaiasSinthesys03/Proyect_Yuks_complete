# Auditoría Técnica Backend — Post Fase 19

**Alcance:** Código en `/API_Backend/src/` construido entre Fase 12 y Fase 19.
**Contraste contra:** `MD/SRS_v10.1.md`, `implementation_plan.md`, `Resolucion_Casos_Limite_v1.md`.
**Metodología:** Lectura íntegra del código fuente (no inferencia desde changelog ni desde reportes previos de avance), grep dirigido sobre patrones de riesgo (ORM leakage, `ilike`, `audit_logs`, `donations`, websockets, rate-limit), y comparación línea por línea contra el diccionario de datos y el contrato de API del `implementation_plan.md`.

**Veredicto ejecutivo:** El motor transaccional (checkout, monedero, cupones, recompensas, Game Bridge) está construido con disciplina arquitectónica real y cubre los casos límite documentados. Sin embargo, el backend en su totalidad cubre una fracción minoritaria del SRS v10.1 — **el Panel CMS Administrativo, el módulo de Donaciones, OTP, OCC, Auditoría, Búsqueda Indexada, WebSockets y 2FA no existen en absoluto**. No es deuda técnica menor: son módulos completos del documento de requerimientos que aún no se han empezado.

---

## 1. Integridad de la Arquitectura (Clean Architecture)

**Veredicto: Pureza arquitectónica certificada en `domain/` y `application/use_cases/`, con una fuga de abstracción puntual y documentada en un Use Case, más dos decisiones de diseño discutibles que conviene registrar.**

### 1.1 Verificación de fugas de infraestructura

Se realizó búsqueda exhaustiva de imports de `kysely`, `ioredis`/`redis`, `fastify`, `stripe` dentro de `domain/` y `application/`:

```
domain/        → 0 imports de infraestructura. Limpio.
application/interfaces/  → 0 imports de infraestructura (son los Ports, correcto por diseño).
application/use_cases/   → 0 imports de Kysely/Redis/Fastify directos.
```

Todos los Use Cases dependen exclusivamente de interfaces (`I*Repository`, `I*Service`, `I*Gateway`) inyectadas por constructor. Esto es correcto y se mantuvo consistente en las 18 clases de caso de uso auditadas.

### 1.2 Fuga de abstracción puntual (documentada, no oculta)

`WebhookPaymentReconciliationUseCase.ts` parsea el body de Stripe directamente:

```ts
const event = JSON.parse(rawPayload.toString('utf-8')) as StripeWebhookEvent;
```

Esto significa que la capa de aplicación conoce la **forma** del payload de Stripe (`type`, `data.object.id`, `data.object.status`), aunque no importa el SDK de Stripe. Es una fuga de abstracción real — un cambio de pasarela de pago (ej. migrar a MercadoPago) obligaría a tocar este Use Case, no solo el adaptador. El propio código lo admite en un comentario ("compromiso pragmático"). **No está oculto, pero sigue siendo una violación técnica de la Regla de Dependencia**, porque `IPaymentGateway` no expone un método de parseo de eventos normalizado. Recomendación: añadir `IPaymentGateway.parseWebhookEvent(payload): { type, externalId, status }` para devolver la fuga a la capa de infraestructura.

### 1.3 Decisiones de diseño con tensión arquitectónica (no son bugs, son trade-offs a vigilar)

- **Ausencia de Unit of Work.** `ProcessCheckoutUseCase` reconoce explícitamente (comentario en clase) que no existe un Unit of Work compartido entre `IOrderRepository`, `IProductRepository`, `IWalletRepository` e `ICouponRepository`. El único bloque atómico real es `IOrderRepository.createOrder` (order + order_items). Decremento de stock, débito de monedero, incremento de cupón y generación de reward codes ocurren **secuencialmente después del commit**, con compensación manual (marcar la orden `CANCELLED`) si algo falla. Esto es una Saga coreografiada artesanal, no un patrón formal con voucher/journal de pasos completados — si el proceso del backend muere a mitad de la fase de compensación (por ejemplo, después de decrementar 2 de 4 variantes), **no hay journal que permita reanudar o revertir limpiamente los pasos ya aplicados**. Es deuda técnica real, no solo un comentario.

- **`Resolucion_Casos_Limite_v1.md` (Q4)** exige explícitamente una Dead Letter Queue en BullMQ para reconciliar el caso "Stripe cobra pero el SQL falla", con reintentos exponenciales y marca `NEEDS_RECONCILIATION` tras 5 fallos. **Esto no está implementado.** El estado `NEEDS_RECONCILIATION` existe como valor de `OrderStatus` en el dominio, pero ningún Use Case lo asigna jamás, y `ProcessCheckoutUseCase` no encola ningún job en `mainQueue` ante un fallo post-commit. El worker de BullMQ (`init-worker.ts`) es un *dispatcher* con `switch` vacío que solo hace `console.log` por tipo de job — no hay lógica real de reconciliación. **Esto es un incumplimiento directo de Q4**, no una limitación aceptable.

### 1.4 Extensiones de contrato bien gestionadas

Las interfaces de Fase 13 (`IUserRepository`, `IProductRepository`, `IOrderRepository`, `IWalletRepository`) se extendieron en fases posteriores (`updateProfile`, `findVariantWithProductById`, `decrementStock`, `restoreStock`, `findByStripePaymentIntentId`, `findDetailByOrderId`, `findItemById`, `findTransactionByOrderId`). Todas viven correctamente en `application/interfaces/`, nunca se filtró un tipo de Kysely hacia el dominio para soportarlas, y cada implementación concreta quedó sincronizada. Esto es ejecución correcta de Clean Architecture bajo presión de requerimientos cambiantes.

**Conclusión de la sección:** Arquitectura sólida en el núcleo construido. La única fuga real es el parseo de eventos Stripe en el Use Case de webhook, y la deuda más seria no es de "pureza de capas" sino de **atomicidad cross-repositorio** y de **ausencia total del mecanismo DLQ exigido por Q4**.

---

## 2. Requerimientos Cumplidos y Casos Límite

### 2.1 Flujos transaccionales 100% completados (lógica de Use Case + Repositorio concreto + ruta HTTP registrada)

| Flujo | Estado | Evidencia |
|---|---|---|
| Registro / Login | ✅ Completo | `RegisterUserUseCase`, `LoginUserUseCase`, rutas `/api/auth/*` |
| Catálogo público (listado, detalle, top ventas, categorías) | ✅ Completo (con salvedad, ver 2.3) | `ProductController` + 4 Use Cases + rutas `/api/products/*` |
| Perfil autenticado (lectura/actualización parcial) | ✅ Completo para nombre/apellido | `ProfileController`, rutas `/api/profile` |
| Libreta de direcciones (CRUD + default) | ✅ Completo | `AddressController`, rutas `/api/profile/addresses/*` |
| Monedero (resumen + ledger paginado) | ✅ Completo | `WalletController`, rutas `/api/profile/wallet/*` |
| Cupones (validación/cálculo, sin canje destructivo previo) | ✅ Completo | `CouponController`, ruta `/api/profile/coupons/redeem` |
| Recompensas (bóveda del usuario) | ✅ Completo | `RewardController.getUserRewards` |
| Checkout (Motor transaccional completo) | ✅ Completo | `CheckoutController`, ruta `POST /api/checkout` |
| Webhook de pago (Stripe) | ✅ Completo, con la salvedad del punto 1.3/2.2 sobre DLQ | `WebhookController`, ruta `POST /api/webhooks/stripe` |
| Cancelación autónoma de pedidos | ✅ Completo | `OrderController.cancelOrder` |
| Listado/detalle de pedidos del usuario | ✅ Completo | `OrderController.listOrders/getOrderDetail` |
| Game Bridge M2M (validación de canje) | ✅ Completo | `RewardController.validateReward`, ruta `/api/game/rewards/validate` |

### 2.2 Verificación explícita de las 5 reglas críticas exigidas

**a) Idempotencia (TTL 24h) — ✅ CUMPLE.**
`RedisIdempotencyService.set(key, 86400)` y `ProcessCheckoutUseCase` paso 1: verifica `check()`, si existe busca la orden por `findByIdempotencyKey` y la retorna; si no, reserva la key antes de continuar. Correcto y verificado contra Q2.

**b) Bloqueos Pesimistas (Redis 10 min) — ✅ CUMPLE, con matiz de robustez.**
`RedisLockService.acquireLock(key, 600)` usa `SET key token NX EX 600`, y `releaseLock` usa un script Lua que verifica el token antes de borrar (previene liberar el lock de otro proceso tras una expiración de TTL). El locking en sí es correcto y mejor que el mínimo exigido. **Matiz:** los locks se liberan en un único `finally` al final de `execute()` — si el proceso Node crashea entre la adquisición del lock y el `finally` (ej. el proceso muere por OOM durante el paso de pasarela de pago), el lock permanece hasta que expire por TTL (10 min). Esto es el comportamiento esperado de un lock con TTL, no un bug, pero vale la pena que quede documentado como ventana de indisponibilidad de hasta 10 minutos en escenarios de crash.

**c) Fórmula Estricta de Checkout — ✅ CUMPLE matemáticamente.**
Se verificó la secuencia exacta en `ProcessCheckoutUseCase`:
`subtotal` (de BD, no del frontend) → `discountAmount` (cupón) → `subtotalAfterDiscount` → `+ shippingCost` → `totalBeforeWallet` → `- walletDeduction` → `totalPaid`. Coincide exactamente con la Resolución #2 (`(Subtotal - Cupón) + Envío - Monedero = Total`). El mínimo de compra (Resolución #3) se evalúa sobre `totalBeforeWallet`, es decir **después** del cupón y **antes** del monedero — correcto según la resolución.

**d) Herencia de Caducidad en Monedero (Resolución #5) — ✅ CUMPLE, implementación correcta y no trivial.**
`WalletRepository.debit()` lee el `expires_at` del wallet **antes** de decrementar y lo persiste como `original_expires_at` en la fila de la transacción `WITHDRAWAL`. `CancelOrderUseCase` recupera esa transacción vía `findTransactionByOrderId(orderId, 'PURCHASE')` y pasa su `originalExpiresAt` a `credit()`, que si recibe ese valor **no** renueva a 12 meses, solo lo hereda. Si no se pasa (ingreso normal), sí renueva a NOW()+12 meses (Resolución #4). Esta es, de las 5 reglas, la de mayor riesgo de error de implementación y está correctamente resuelta.

**e) Anti-Fraude de Cancelaciones (Game Bridge) — ✅ CUMPLE.**
`CancelOrderUseCase` itera **todos** los reward codes `AVAILABLE` de la orden y consulta `IGameApiClient.checkRewardStatus` para cada uno **antes** de mutar cualquier estado. Si cualquiera devuelve `CLAIMED`, lanza `RewardAlreadyClaimedError` y la función termina sin tocar stock, wallet ni códigos — no hay mutación parcial. Solo si **todos** pasan la validación se procede a revocar, restaurar stock, acreditar wallet y reembolsar pasarela. Correcto contra Resolución #6.

### 2.3 Hallazgo que contradice un requerimiento explícito del SRS

**REQ-BE-03 dice textualmente:** *"Prohibido hacer `SELECT * LIKE '%query%'` directamente a la base de datos para la búsqueda. Implementar Full-Text Search o motor tipo Algolia [...] con tolerancia a errores ortográficos (Fuzzy Matching)."*

`ProductRepository.findAll()` hace exactamente lo prohibido:
```ts
baseQuery = baseQuery.where('products.name', 'ilike', `%${query.search}%`);
```
No hay Full-Text Search (`tsvector`/`tsquery`), no hay Algolia, no hay fuzzy matching. Esto no es una omisión de un "nice-to-have" — es la violación directa de un requerimiento que el SRS marca como prohibición explícita. Debe registrarse como no conformidad, no como pendiente.

### 2.4 Caso límite NO verificado por ningún test ni guard de código

El **Caso Límite #1** (3D Secure tardío + stock agotado) está codificado en `WebhookPaymentReconciliationUseCase`, pero la verificación de que el reembolso se ejecuta **antes** de cancelar la orden, y que Stripe recibe HTTP 200 para no reintentar, descansa únicamente en la lectura de código — no existe ningún test automatizado ni de integración en el repositorio (no hay carpeta `tests/`, `npm test` es el placeholder `"echo \"Error: no test specified\" && exit 1"` de `package.json`). El `Verification Plan` del `implementation_plan.md` exige explícitamente tests unitarios de la fórmula de checkout y tests de integración de colisión de stock — **ninguno existe**.

---

## 3. Análisis de Brechas Críticas (Missing Endpoints & CRUDs)

Mapeo exhaustivo contra el SRS v10.1 y el contrato de API del `implementation_plan.md`. Se agrupa por área funcional. **Ningún elemento de esta lista existe en el código actual** salvo donde se indique lo contrario.

### 3.1 Panel CMS Administrativo — Ausencia total (Secciones 5 y 6 completas del SRS, ~37 requerimientos)

- **Autenticación de Admin:** No existe `/api/admin/register` ni `/api/admin/login`. `RegisterAdminDTO` existe como tipo en `AuthDTOs.ts` pero **no tiene Use Case, ni Controller, ni ruta** — es un tipo huérfano. El flujo de "Código de Desarrollador" (000000, hasheado con Argon2id en `system_settings`, Q21) no tiene tabla, migración ni lógica.
- **CMS-FE-02 (Dashboard Analítico):** No hay endpoints de métricas/embudo de conversión/ticket promedio.
- **CMS-FE-03 (Media Manager / Banners):** No hay tabla `banners`, no hay pipeline de upload (CMS-BE-04: resize 1080x1080, conversión WEBP, CDN). No hay dependencia de procesamiento de imágenes en `package.json` (`sharp` ausente).
- **CMS-FE-04 (Kanban de Pedidos + WebSockets):** No hay servidor WebSocket (`@fastify/websocket` no está en dependencias). No hay endpoint `PATCH /api/admin/orders/:id/status`.
- **CMS-FE-05 (Reembolsos administrativos / Bóveda):** No existe endpoint de reembolso manual a tarjeta con re-auth. El único `refund()` disponible se invoca desde Use Cases automáticos (webhook 3DS tardío, cancelación de usuario) — no hay flujo administrativo deliberado.
- **CMS-FE-06 (CRUD maestro de Catálogo):** **No existe ningún endpoint de escritura sobre `products` o `product_variants`.** Toda la capa de catálogo construida (Fases 9-11) es de **solo lectura**. No hay `POST/PUT/DELETE /api/admin/products`, no hay gestión de variantes, no hay soft-delete activable, no hay `findOrCreate` de categorías (`POST /api/categories` del CMS-BE-07 tampoco existe).
- **CMS-BE-02 (OCC):** La columna `products.version` existe en el schema (migración 002) y en la entidad `Product`, pero **no se usa en ningún lado** — no hay endpoint que la lea para comparar antes de actualizar, porque no hay endpoint de actualización.
- **CMS-FE-07 / CMS-FE-16 (Inventory Grid + edición inline de stock vía delta):** No existe `PATCH /api/admin/products/:id/variants/:variantId/stock`.
- **CMS-FE-08/09 (Consola de Economía In-Game / Banner Manager Juego):** Requiere la DB NoSQL (MongoDB/Firebase) mencionada en el SRS Sección 2 — **no hay ninguna conexión a una segunda base de datos en todo el proyecto**. `package.json` no incluye driver de Mongo ni Firebase Admin SDK.
- **CMS-FE-10 / CMS-BE-06 (Bitácora de Auditoría inmutable vía Triggers):** **No existe la tabla `audit_logs`**, ni en migraciones ni en `db-types.ts`. No existen Database Triggers (el `implementation_plan.md` los exige explícitamente como mecanismo síncrono). Ninguna operación administrativa registra IP, payload viejo/nuevo. Esto bloquea por completo CMS-FE-10.
- **CMS-FE-11 (Configuración Global):** No existe tabla `system_settings`. El propio `ProcessCheckoutUseCase` usa un `DEFAULT_SYSTEM_CONFIG` hardcodeado en TypeScript (estado base, municipios cercanos, costos de envío, umbral de envío gratis, mínimo de compra) — **documentado explícitamente como placeholder en el código**, pero confirmamos aquí que no hay ningún camino para que un administrador lo modifique en runtime.
- **CMS-FE-12 (Editor de Textos Legales):** No existe tabla ni endpoints para Aviso de Privacidad/Términos editables.
- **CMS-FE-13 (Gestor del Modal de Donaciones):** Depende del módulo de Donaciones, que no existe (ver 3.2).
- **CMS-FE-14 (CRM y Monederos):** No hay endpoint de listado administrativo de usuarios/wallets, ni "Suspender Cuenta" (aunque `users.is_banned` existe en el schema desde la Fase inicial, ningún endpoint lo modifica).
- **CMS-FE-15 (Gestor de Cupones):** Existe la tabla `coupons` y el repositorio de lectura/incremento, pero **no hay ningún endpoint de creación/edición/toggle de cupones**. Un administrador no tiene forma de crear un cupón salvo insertarlo manualmente en la base de datos.
- **CMS-FE-17/18/19/20 (Sidebar, Exportación de Reportes, Notificaciones, Command Palette):** Sin contraparte de backend (exportación asíncrona vía BullMQ no está conectada a ningún endpoint real; el worker es un placeholder).
- **CMS-BE-01 (Filtrado de IPs para intranet, Q22):** No existe el middleware de IP-filtering mencionado en el `implementation_plan.md` para simular la intranet en rutas `/api/admin/*` — coherente con que esas rutas no existen, pero es una pieza de seguridad pendiente día uno cuando se empiece el CMS.

### 3.2 Módulo de Donaciones — Ausencia total

REQ-FE-26 a REQ-FE-30 y REQ-BE-09 describen un flujo completo (botón flotante, modal con montos predefinidos, donación anónima con captura de correo y consentimiento legal). **No existe la tabla `donations`** (sí está en el diccionario de datos del `implementation_plan.md`), no existe `POST /api/donate`, no existe DTO, Use Case ni controlador. Bloqueo total.

### 3.3 OTP / Verificación de Email y Teléfono — Diseñado pero no implementado

`UpdateProfileUseCase` rechaza correctamente cambios de `email`/`phone` lanzando `OtpVerificationRequiredError` — esto es el **gancho** correcto, pero no existe ningún flujo real detrás: no hay endpoint para solicitar OTP, no hay tabla de códigos temporales, no hay integración SMTP/SMS (`package.json` no tiene `nodemailer`, Twilio, ni SDK de email transaccional alguno). El usuario queda permanentemente bloqueado para cambiar su correo o teléfono.

### 3.4 Autenticación — Brechas respecto al SRS y a `Resolucion_Casos_Limite_v1.md`

- **Google OAuth (REQ-FE-07):** No implementado. Solo login clásico con email/password.
- **Recuperación de contraseña (REQ-FE-10):** No existe `POST /api/auth/forgot-password` ni flujo de enlace temporal.
- **Silent Refresh con Refresh Token en cookie HttpOnly (Q19):** El comentario en `LoginUserUseCase` dice *"El Refresh Token (HttpOnly Cookie) se gestiona en la capa de infraestructura (Controller)"* — **esto es falso en el código actual**. Se verificó `AuthController.login`: solo retorna un `accessToken` en el body JSON. No hay `reply.setCookie(...)`, no hay generación de refresh token, no hay endpoint `/api/auth/refresh`. El usuario es desconectado cada 15 minutos (`JWT_EXPIRES_IN=15m`) sin mecanismo de renovación silenciosa. Esto es una contradicción directa entre lo que el código dice hacer en su propio comentario y lo que realmente hace.
- **Rate Limiting / Fail2Ban en login (REQ-SEC-10):** No implementado. No hay `@fastify/rate-limit` en `package.json`. El endpoint de login es vulnerable a fuerza bruta sin mitigación alguna a nivel aplicación.
- **2FA/MFA para CMS (REQ-SEC-09):** No aplica todavía porque el CMS no existe, pero se documenta como pendiente conjunto.

### 3.5 Notificaciones — Esqueleto sin contenido

BullMQ está correctamente configurado a nivel de infraestructura (`mainQueue`, `worker`), pero:
- Ningún Use Case llama `mainQueue.add(...)` en ningún punto del código (`grep` confirmó cero invocaciones reales).
- El worker tiene un `switch` con 3 casos (`reconcile-payment`, `export-report`, `send-notification`) que solo hacen `console.log`.
- No hay integración SMTP/SendGrid real.
- No hay servidor WebSocket para notificaciones en tiempo real (REQ-FE-24, CMS-FE-19).
- Esto significa que **REQ-BE-04 (notificación por correo + WebSocket en cada cambio de estatus) no está implementado**, a pesar de que el pipeline de estados de orden (`PREPARING`, `SHIPPED`, `DELIVERING`, `DELIVERED`) existe en el dominio.

### 3.6 Social Proof / FOMO (REQ-FE-32, REQ-BE-10) — Ausencia total
Sin servidor WebSocket, no hay forma de emitir los eventos de compra en tiempo real que el SRS exige.

### 3.7 Tabla de Base de Datos faltantes (contrastadas contra el diccionario de datos del `implementation_plan.md`)

| Tabla prevista | Estado |
|---|---|
| `audit_logs` | ❌ No existe |
| `donations` | ❌ No existe |
| `system_settings` | ❌ No existe |
| Banners/CMS media | ❌ No existe |
| Categorías legales (Aviso de Privacidad, T&C versionados) | ❌ No existe |

### 3.8 Resumen de severidad de brechas

| Severidad | Elemento |
|---|---|
| **Crítica (bloquea negocio)** | CMS completo (no se puede operar la tienda sin forma de crear productos/cupones/gestionar pedidos), Donaciones, Refresh Token real |
| **Alta** | Auditoría inmutable (riesgo legal/compliance bancario, REQ-BE-08 parcialmente cubierto solo en `orders`, no en acciones administrativas), OTP, Notificaciones reales, Búsqueda Full-Text (no-conformidad directa con REQ-BE-03) |
| **Media** | Rate limiting, 2FA, WebSockets de Social Proof, Google OAuth, recuperación de contraseña |
| **Baja (mejora, no bloqueo)** | Command Palette, Exportación de reportes, Dashboard analítico |

---

## 4. Veredicto de Integración Frontend

**Estimación: ~22% de las pantallas descritas en el SRS pueden conectarse hoy a un backend funcional de extremo a extremo.** El cálculo se basa en contar pantallas/secciones distintas mencionadas en la Sección 3 (Frontend E-commerce) y Sección 5 (CMS) del SRS, no en líneas de código.

### 4.1 Pantallas que SÍ se pueden desarrollar y conectar hoy

- **Login / Registro clásico** (REQ-FE-07 parcial, REQ-FE-08) — endpoints existen. *(Sin Google OAuth, sin recuperación de contraseña).*
- **Catálogo `/tienda` y vista de producto** (REQ-FE-11) — listado, filtros básicos por categoría/búsqueda simple, detalle con variantes. *(Sin Omnibox predictivo con miniaturas/fuzzy matching — REQ-FE-12 — porque no hay Full-Text Search backend).*
- **Carrito** (cálculo de subtotal en frontend) — funcional para armar el payload de checkout, aunque el cálculo de envío "en vivo" antes de checkout no tiene endpoint dedicado (el cálculo de `deliveryType`/`shippingCost` solo ocurre dentro de `ProcessCheckoutUseCase`, no hay un endpoint de cotización previa).
- **Checkout** (REQ-BE-01 completo) — el flujo de pago end-to-end es el módulo más maduro del backend.
- **Quick Profile Drawer — datos básicos y saldo** (REQ-FE-14, parcial) — perfil + wallet summary funcionan. *(Sin Tier System visual completo más allá del campo `tierLevel`/`experiencePoints` ya existentes; no hay lógica que otorgue XP en ningún Use Case).*
- **Tab Direcciones** (REQ-FE-17) — CRUD completo disponible.
- **Tab Monedero / Ledger** (REQ-FE-20) — funcional, incluyendo el aviso de caducidad (el dato `expiresAt` se expone correctamente).
- **Tab Cupones (solo validación, sin reclamar histórico)** (REQ-FE-21, parcial).
- **Tab Recompensas / Bóveda** (REQ-FE-22) — funcional para visualizar y copiar UUIDs.
- **Tab Historial de Pedidos + Cancelación** (REQ-FE-23, parcial) — listado, detalle y cancelación funcionan. *(Sin datos de Última Milla en tiempo real porque no hay endpoint administrativo que los actualice — los campos `driverName`/`trackingNumber` existen en el dominio pero ningún flujo los puebla)*.

### 4.2 Pantallas estrictamente BLOQUEADAS por ausencia de backend

- **Vitrina de Personajes, Lore/YouTube, Quiénes Somos, Footer** — son estáticas, no bloqueadas por backend, pero tampoco "conectables" porque no requieren API.
- **Omnibox predictivo con Fuzzy Matching y Cmd+K** (REQ-FE-12) — bloqueado, no hay motor de búsqueda indexada.
- **WebAR / Visor 3D** (REQ-FE-31) — no depende del backend actual, pero cualquier metadata 3D específica del producto no existe en el schema (`products` no tiene campo de modelo 3D).
- **Social Proof / FOMO en tiempo real** (REQ-FE-32) — bloqueado, no hay WebSocket.
- **Notificaciones in-app en tiempo real** (REQ-FE-24) — bloqueado, no hay WebSocket ni persistencia de notificaciones (no existe tabla `notifications`).
- **OTP para cambio de email/teléfono** (REQ-FE-16) — bloqueado, el frontend puede mostrar el modal pero la API responderá 422 siempre.
- **Tab Métodos de Pago / PCI** (REQ-FE-18) — bloqueado, no existe tabla ni endpoint de tarjetas guardadas (Stripe Customer/PaymentMethod nunca se crea ni se asocia al usuario).
- **Tab Favoritos / Wishlist** (REQ-FE-19) — bloqueado, no existe tabla `wishlists` ni endpoints.
- **Modal de Donaciones** (REQ-FE-26/27) — bloqueado por completo.
- **TODO el Panel CMS** (Sección 5 entera del SRS) — bloqueado al 100%. No hay un solo endpoint administrativo de escritura.
- **AdSense con detección de AdBlock** (REQ-FE-25) — no depende del backend, es puramente frontend, pero se menciona para constancia de cobertura del SRS.

### 4.3 Conclusión de la sección

El backend actual permite construir un **MVP transaccional de compra**: ver catálogo, comprar, pagar, gestionar perfil/direcciones/monedero, ver y cancelar pedidos, y canjear recompensas en el juego. **No permite operar el negocio** (no hay forma de dar de alta un producto sin tocar la base de datos a mano) ni cumplir varias promesas de UX avanzada del SRS v10 (Omnibox, FOMO, AR, notificaciones en vivo, OTP, donaciones).

---

## 5. Porcentaje General y Próximos Pasos (Deuda Técnica)

### 5.1 Cálculo de completitud global

Metodología: conteo de requerimientos identificables individualmente en el SRS (`REQ-FE-*`, `REQ-BE-*`, `CMS-FE-*`, `CMS-BE-*`, `REQ-SEC-*`) y clasificación en Completo / Parcial / No iniciado, ponderando exclusivamente los requerimientos con responsabilidad de backend (los puramente visuales de frontend, como animaciones CSS, quedan fuera del cálculo).

| Bloque | Requerimientos con responsabilidad de Backend | Completos | Parciales | No iniciados |
|---|---|---|---|---|
| Auth (REQ-FE-07/08/09/10, REQ-BE-08 parcial) | 5 | 2 | 1 | 2 |
| Catálogo/Búsqueda (REQ-FE-11/12/13, REQ-BE-03/07) | 5 | 1 | 2 | 2 |
| Perfil/Drawer (REQ-FE-14 al 24) | 11 | 5 | 2 | 4 |
| Motor Transaccional (REQ-BE-01/02/05/06) | 4 | 3 | 1 | 0 |
| Donaciones (REQ-FE-26/27, REQ-BE-09) | 3 | 0 | 0 | 3 |
| Social/FOMO (REQ-FE-32, REQ-BE-10) | 2 | 0 | 0 | 2 |
| CMS completo (CMS-FE-01 al 20, CMS-BE-01 al 07) | 27 | 0 | 0 | 27 |
| Seguridad (REQ-SEC-01 al 11) | 11 | 1 (hashing Argon2id) | 1 (CORS) | 9 |

**Total ponderado: ≈ 30% de completitud global del Backend respecto al SRS v10.1.**

Esta cifra es deliberadamente más conservadora que una estimación basada en "fases completadas" (Fase 12-19 de 19 suena a ~100%, pero esas 19 fases nunca cubrieron el CMS, Donaciones, ni Seguridad perimetral — fueron, desde su origen, un subconjunto del SRS centrado en el motor transaccional). Dentro de ese subconjunto (motor transaccional puro), la completitud es alta (~85-90%); dentro del SRS completo, es ~30%.

### 5.2 Deuda Técnica documentada

1. **Ausencia de Unit of Work / Saga formal.** El "Saga artesanal" de `ProcessCheckoutUseCase` no tiene journal de pasos completados; un crash a mitad de la fase de compensación deja el sistema en un estado parcial sin mecanismo de reanudación. Prioridad: **Alta**, antes de producción con tráfico real.

2. **Q4 (DLQ de reconciliación) no implementado.** El estado `NEEDS_RECONCILIATION` existe en el tipo pero nunca se asigna. No hay job `reconcile-payment` real encolado desde ningún Use Case. Prioridad: **Alta** — es un requisito de negocio explícito (no perder dinero), no una mejora.

3. **Comentario falso en `LoginUserUseCase`** sobre gestión de Refresh Token — el código documenta una funcionalidad (Silent Refresh) que no existe en la capa que dice implementarla. Esto es deuda de *documentación engañosa*, riesgo de que un desarrollador futuro asuma que existe. Prioridad: **Media-Alta**, corregir el comentario o implementar la funcionalidad real.

4. **`ProductRepository.findAll` viola REQ-BE-03** usando `ILIKE` en vez de Full-Text Search/fuzzy matching. Prioridad: **Media**, no rompe nada hoy pero escalará mal y es no conformidad documentada.

5. **Configuración de sistema hardcodeada** (`DEFAULT_SYSTEM_CONFIG` en `ProcessCheckoutUseCase`): umbral de envío gratis, costos de envío, mínimo de compra y municipios cercanos están fijos en código. Cualquier cambio de negocio (ej. temporada alta, cambio de tarifas) requiere un despliegue. Prioridad: **Media**, bloqueante para operar el negocio sin intervención de ingeniería.

6. **Cero cobertura de pruebas automatizadas.** El `Verification Plan` del `implementation_plan.md` exige tests unitarios de la fórmula de checkout y tests de integración de colisión de stock; no existe ni un solo archivo de test en el repositorio. Prioridad: **Alta** dado que el módulo más crítico (dinero real) no tiene red de seguridad de regresión.

7. **Falta de rate limiting / protección de fuerza bruta** en endpoints de autenticación, contradiciendo REQ-SEC-10. Prioridad: **Alta** antes de exponer el backend a internet público.

### 5.3 Próximos pasos recomendados (orden de prioridad de negocio, no de fase)

1. Cerrar la deuda de seguridad transaccional: implementar el job DLQ real (Q4) y decidir conscientemente si el Saga artesanal actual es aceptable para el volumen esperado, o si se requiere un Outbox Pattern/journal de compensación.
2. Construir el CRUD administrativo mínimo de Catálogo y Cupones — sin esto, el negocio no puede operar la tienda en producción aunque el checkout funcione perfectamente.
3. Implementar el módulo de Auditoría (`audit_logs` + triggers) antes de dar acceso de escritura a cualquier administrador — es una exigencia de compliance, no una característica opcional.
4. Resolver la contradicción de Refresh Token (implementar Silent Refresh real o eliminar el comentario engañoso) y añadir rate limiting a `/api/auth/login`.
5. Añadir suite de pruebas automatizadas mínima sobre `ProcessCheckoutUseCase`, `CancelOrderUseCase` y `WalletRepository` antes de tocar este código de nuevo — es el área de mayor riesgo financiero del sistema y actualmente se modifica sin red de seguridad.
6. Priorizar Donaciones y OTP solo después de los puntos 1-5, ya que tienen menor riesgo financiero/legal que el motor transaccional y el CMS.

---

**Fin del informe.**
