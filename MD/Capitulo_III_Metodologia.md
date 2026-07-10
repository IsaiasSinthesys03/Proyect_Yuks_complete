<!-- ============================================================ -->
<!-- [FASE DE ANÁLISIS METODOLÓGICO]                              -->
<!--                                                              -->
<!-- 1. ESTRATEGIA, TÉCNICA Y PROCEDIMIENTO:                      -->
<!--    Se adopta un enfoque incremental basado en fases de        -->
<!--    desarrollo ágil (Scrum adaptado), donde cada Sprint        -->
<!--    materializa una capa vertical de funcionalidad. La         -->
<!--    arquitectura interna se rige estrictamente por Clean        -->
<!--    Architecture (capas Domain → Application → Infrastructure) -->
<!--    y los cinco principios SOLID. La inyección de dependencias -->
<!--    se resuelve manualmente en un Composition Root centralizado -->
<!--    (main.ts), sin frameworks IoC externos.                    -->
<!--                                                              -->
<!-- 2. INSTRUMENTOS Y TECNOLOGÍAS:                               -->
<!--    - Backend: Node.js + TypeScript, Fastify (HTTP), Kysely   -->
<!--      (Query Builder type-safe), PostgreSQL (RDBMS ACID),     -->
<!--      Redis/BullMQ (caché, colas, locks distribuidos).         -->
<!--    - Pasarela de pago: Stripe SDK (PCI-DSS Nivel 1).         -->
<!--    - Almacenamiento de medios: AWS S3.                       -->
<!--    - Seguridad: Argon2 (hashing), JWT (autenticación),       -->
<!--      HMAC-SHA256 (webhooks), Helmet (headers HTTP).          -->
<!--    - Game Bridge: API M2M con Service Account Token (JWT     -->
<!--      estático de larga duración).                            -->
<!--                                                              -->
<!-- 3. APLICACIÓN DE LA TEORÍA (Capítulo II → Capítulo III):     -->
<!--    - Teorema CAP: PostgreSQL (CP) para E-commerce, NoSQL     -->
<!--      (AP) para telemetría de juego. Conciliación vía UUID.   -->
<!--    - HMAC: Verificación de firma en webhooks de Stripe       -->
<!--      (parseWebhookEvent) usando el header Stripe-Signature.  -->
<!--    - OAuth 2.0: Flujos JWT Access+Refresh con rotación       -->
<!--      silenciosa, cookie HttpOnly para refresh token.         -->
<!--    - Árboles Trie: Motor Omnibox sobre catálogo de productos -->
<!--      con tolerancia a errores tipográficos.                  -->
<!--    - Saga Pattern: Compensación en ProcessCheckoutUseCase     -->
<!--      (CANCELLED / NEEDS_RECONCILIATION + DLQ).               -->
<!--                                                              -->
<!-- 4. DISEÑO:                                                   -->
<!--    - Arquitectura Game Bridge: ACL + IGameApiClient +         -->
<!--      ValidateRewardM2MUseCase + m2mAuthMiddleware.            -->
<!--    - Flujos de datos: Checkout → Stripe → Webhook → DLQ.     -->
<!--    - Checkout seguro: Idempotency → Lock → Stock snapshot →  -->
<!--      Cupón → Envío → Wallet → PaymentIntent → Commit SQL →  -->
<!--      Post-commit Saga → Reward UUID generation.              -->
<!-- ============================================================ -->

# CAPÍTULO III "METODOLOGÍA O PROPUESTA A IMPLEMENTAR"

## 3.1. MARCO METODOLÓGICO DE DESARROLLO

### 3.1.1. Selección y justificación del enfoque ágil incremental

El desarrollo del sistema Animayuks se condujo bajo un enfoque ágil incremental inspirado en el marco de trabajo Scrum. Se optó por esta metodología debido a la naturaleza evolutiva del proyecto, donde los requerimientos funcionales del comercio electrónico, el panel administrativo CMS y el subsistema de gamificación (Game Bridge) presentaron interdependencias que demandaron ciclos cortos de retroalimentación.

Cada incremento de funcionalidad se organizó en fases numeradas secuencialmente (Fase 11, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 27, 28), donde cada fase representó un *sprint* temático enfocado en una vertical completa de la arquitectura. Por ejemplo, la Fase 16 abordó exclusivamente el motor de *Checkout*, mientras que la Fase 17 implementó la reconciliación de pagos mediante *webhooks* y la comunicación M2M con el Game Bridge.

La priorización de las fases se determinó mediante un criterio de dependencia técnica descendente. Se construyeron primero los cimientos de persistencia y autenticación (Fase 11), seguidos de los contratos de interfaz y la inyección de dependencias (Fase 13–14), para posteriormente materializar los flujos transaccionales críticos (Fases 15–17) y, finalmente, las capas de administración y comunicación en tiempo real (Fases 21–28).

### 3.1.2. Principios rectores: Clean Architecture y SOLID

Se adoptó de manera estricta la propuesta arquitectónica denominada Clean Architecture, cuyos lineamientos dictan una separación rigurosa del código fuente en tres capas concéntricas con una regla de dependencia unidireccional: las capas internas jamás conocen ni referencian a las capas externas.

**Capa de Dominio (`src/domain/`).** Contiene las entidades puras del negocio (`User`, `Order`, `Product`, `RewardCode`, `Wallet`, `Coupon`, entre otras), los tipos de transferencia de datos (DTOs) y los errores de dominio. Ninguna entidad depende de frameworks, ORMs ni bibliotecas de infraestructura. Cada interfaz de entidad se declaró con propiedades `readonly` para garantizar la inmutabilidad estructural.

**Capa de Aplicación (`src/application/`).** Alberga los casos de uso (*Use Cases*) y los contratos de puerto (*Interfaces*). Los casos de uso orquestan la lógica de negocio invocando exclusivamente las abstracciones definidas en esta misma capa (por ejemplo, `IPaymentGateway`, `IGameApiClient`, `IOrderRepository`). Esta inversión de dependencias constituye la materialización directa del Principio de Inversión de Dependencia (DIP) de SOLID.

**Capa de Infraestructura (`src/infrastructure/`).** Implementa los adaptadores concretos que satisfacen los contratos de la capa de aplicación. Aquí residen los repositorios SQL (Kysely + PostgreSQL), los adaptadores de pasarela de pago (`StripeAdapter`), el cliente HTTP del Game Bridge (`GameApiClient`), los servicios de caché y bloqueo distribuido (Redis), las colas de trabajo (BullMQ), los controladores HTTP (Fastify) y los *middlewares* de seguridad.

El acoplamiento entre capas se resuelve mediante inyección manual de dependencias en un punto de composición centralizado denominado *Composition Root*, ubicado en el archivo `main.ts`. En este punto se instancian primero los repositorios y servicios de infraestructura, se inyectan en los casos de uso, y estos se inyectan finalmente en los controladores HTTP. Este diseño permite sustituir cualquier implementación concreta (por ejemplo, cambiar de Stripe a PayPal) sin modificar una sola línea de lógica de negocio.

## 3.2. INSTRUMENTOS Y TECNOLOGÍAS SELECCIONADAS

### 3.2.1. Pila tecnológica del servidor (*Backend Stack*)

El servidor de la plataforma se implementó sobre **Node.js** con **TypeScript** como lenguaje de programación principal. La elección de TypeScript se fundamentó en su sistema de tipos estáticos, el cual permite detectar errores de contrato en tiempo de compilación y refuerza la coherencia entre las interfaces de dominio y sus implementaciones de infraestructura.

Como framework HTTP se seleccionó **Fastify** (versión 5.x), un servidor web de alto rendimiento basado en un modelo de *plugins* composable. Fastify se configuró con los siguientes complementos de seguridad y funcionalidad:

- `@fastify/helmet`: inyección automática de cabeceras HTTP de seguridad (Content-Security-Policy, X-Frame-Options, Strict-Transport-Security).
- `@fastify/cors`: control granular de orígenes permitidos para peticiones *cross-origin*.
- `@fastify/rate-limit`: limitación de tasa de peticiones por IP (configurada en variable de entorno `RATE_LIMIT_MAX`) para mitigar ataques de denegación de servicio.
- `@fastify/cookie`: gestión segura de *cookies* HttpOnly para el almacenamiento del *refresh token*.
- `@fastify/websocket`: soporte nativo de WebSocket para la capa de comunicación en tiempo real.

### 3.2.2. Motor de persistencia relacional: PostgreSQL y Kysely

Se seleccionó **PostgreSQL** como sistema gestor de base de datos relacional (RDBMS) principal. La justificación técnica se fundamenta en tres capacidades críticas del motor: el soporte nativo para el tipo de dato `UUID` con generación por defecto mediante `gen_random_uuid()`, el mecanismo de Control de Concurrencia Multiversión (MVCC) para lecturas no bloqueantes, y la capacidad de definir restricciones `CHECK` a nivel de columna (por ejemplo, `CHECK (balance >= 0)` en la tabla `wallet`, `CHECK (quantity > 0)` en `order_items`).

Como capa de acceso a datos se empleó **Kysely** (versión 0.29.x), un *query builder* para TypeScript que genera consultas SQL parametrizadas con total seguridad de tipos. A diferencia de ORMs tradicionales como Prisma o TypeORM, Kysely no impone un modelo de entidades propio ni genera código. Esto se alinea con Clean Architecture: las entidades de dominio permanecen puras y los repositorios traducen manualmente entre las filas de la base de datos (`Selectable<T>`) y las interfaces del dominio.

El esquema relacional se definió en el archivo `db-types.ts`, el cual declara 16 tablas interconectadas: `users`, `profiles`, `categories`, `products`, `product_variants`, `addresses`, `coupons`, `orders`, `order_items`, `wallet`, `wallet_transactions`, `reward_codes`, `system_settings`, `audit_logs` y `donations`. Las migraciones se gestionan mediante scripts dedicados ejecutados a través del comando `npm run migrate`.

### 3.2.3. Servicios complementarios de infraestructura

**Redis** se utiliza como almacén de datos en memoria para tres propósitos diferenciados: (1) servicio de bloqueo distribuido pesimista (`RedisLockService`) para la reserva temporal de inventario durante el *checkout*, (2) servicio de idempotencia (`RedisIdempotencyService`) para prevenir cobros duplicados, y (3) *broker* de colas de trabajo mediante **BullMQ** para la reconciliación asíncrona de pagos y el envío de correos electrónicos transaccionales.

**AWS S3** se integró como servicio de almacenamiento de objetos para las imágenes del catálogo de productos. El adaptador `S3MediaStorageService` gestiona la subida, validación de tipo MIME y generación de URLs públicas. La biblioteca **sharp** se encarga del procesamiento y optimización de las imágenes antes de su carga al *bucket*.

**Resend** se implementó como servicio de correo electrónico transaccional, operando en un proceso separado del servidor HTTP principal (`worker:email`) para evitar que los tiempos de respuesta de la API se degraden por latencia de red del proveedor de correo.

## 3.3. DISEÑO ARQUITECTÓNICO DE LA PLATAFORMA

### 3.3.1. Modelo de dominio y entidades del sistema

El modelo de dominio se diseñó siguiendo el principio de entidades puras e inmutables. Cada entidad se define como una interfaz TypeScript con todas sus propiedades marcadas como `readonly`. A continuación se describe la función de las entidades principales dentro del ecosistema:

**User.** Representa al actor autenticado del sistema. Contiene el identificador UUID, el correo electrónico, el hash de contraseña (Argon2), el rol (`CLIENT` o `ADMIN`) y un indicador de bloqueo (`isBanned`). La segregación de roles determina el acceso a los endpoints públicos del E-commerce o al panel administrativo CMS.

**Product y ProductVariant.** La entidad `Product` modela un artículo del catálogo con su nombre, descripción, precio base, categoría asociada y un indicador booleano `hasVirtualReward` que señala si la compra de dicho producto genera un código UUID canjeable en el videojuego. La entidad incluye un campo `version` (entero auto-incremental) que implementa el patrón de Control de Concurrencia Optimista (OCC) para prevenir colisiones de edición simultánea en el CMS. Las variantes (`ProductVariant`) especializan al producto en combinaciones de talla, color y SKU, cada una con su propio nivel de inventario (`stock`).

**Order y OrderItem.** La entidad `Order` encapsula la totalidad de un pedido comercial, incluyendo campos financieros (subtotal, descuento, costo de envío, deducción de monedero, total pagado), campos de *compliance* regulatorio (`termsVersion`, `clientIp`), campos logísticos de última milla (`driverName`, `driverVehicle`, `driverPhone`, `trackingCompany`, `trackingNumber`) y la clave de idempotencia (`idempotencyKey`). Los `OrderItem` constituyen *snapshots* congelados del producto al momento de la compra, preservando el nombre, SKU y precio unitario independientemente de futuras modificaciones al catálogo.

**RewardCode.** Representa el código UUID de recompensa virtual generado por el Game Bridge. Su ciclo de vida contempla tres estados: `AVAILABLE` (generado y listo para ser canjeado), `CLAIMED` (canjeado exitosamente en el videojuego) y `REVOKED` (revocado por cancelación del pedido, solo si no fue previamente canjeado). La regla de negocio dicta generación unitaria: si el cliente adquiere 5 unidades de un producto con recompensa, se generan 5 códigos UUID independientes.

**Wallet y WalletTransaction.** El monedero virtual mantiene una relación 1:1 con el usuario y se inicializa de forma diferida (*lazy initialization*) con saldo cero. El saldo posee una restricción `CHECK (balance >= 0)` a nivel de base de datos como red de seguridad. El *ledger* de transacciones (`WalletTransaction`) registra cada depósito o retiro con su fuente (`REFUND`, `PURCHASE`, `CANCELLATION`) y un campo `original_expires_at` como mecanismo anti-fraude.

### 3.3.2. Esquema relacional y normalización

El esquema de la base de datos PostgreSQL se diseñó en Tercera Forma Normal (3NF). Se definieron restricciones de integridad referencial mediante claves foráneas entre las tablas principales: `orders.user_id → users.id`, `order_items.order_id → orders.id`, `order_items.variant_id → product_variants.id`, `reward_codes.order_id → orders.id`, `reward_codes.order_item_id → order_items.id`, `wallet.user_id → users.id` (UNIQUE), `wallet_transactions.wallet_id → wallet.id`.

Los campos monetarios se almacenan con el tipo `NUMERIC` de PostgreSQL (representado como `string` en la capa de TypeScript) para evitar errores de precisión inherentes a la aritmética de punto flotante IEEE 754. La conversión entre `string` y `number` se realiza exclusivamente en los repositorios de infraestructura, manteniendo la capa de dominio agnóstica a esta particularidad del motor.

Las claves primarias de todas las tablas se generan mediante `gen_random_uuid()` como valor por defecto a nivel de base de datos, implementando el estándar RFC 4122 (UUID versión 4) descrito en el Marco Teórico. Esto permite la generación descentralizada de identificadores sin riesgo de colisión, un requisito fundamental para la sincronización con el subsistema NoSQL del videojuego.

### 3.3.3. Contratos de interfaz y puertos de aplicación

Se definieron 19 interfaces de puerto en la capa de aplicación, cada una representando un contrato que los adaptadores de infraestructura deben satisfacer:

- **Repositorios de datos:** `IUserRepository`, `IProductRepository`, `IAdminProductRepository`, `IOrderRepository`, `IAddressRepository`, `ICouponRepository`, `IRewardCodeRepository`, `IWalletRepository`, `IAuditLogRepository`, `IDonationRepository`, `ISystemSettingsRepository`.
- **Servicios externos:** `IPaymentGateway` (pasarela de pago), `IGameApiClient` (cliente M2M del videojuego), `IEmailService` (correo transaccional), `IMediaStorageService` (almacenamiento de imágenes).
- **Servicios transversales:** `ILockService` (bloqueo distribuido), `IIdempotencyService` (idempotencia), `IQueueService` (colas de trabajo), `IRealtimeService` (WebSocket).

Esta granularidad en la definición de puertos materializa el Principio de Segregación de Interfaces (ISP) de SOLID: cada caso de uso recibe en su constructor únicamente las dependencias que necesita, sin verse forzado a depender de métodos que no utiliza.

## 3.4. DISEÑO DEL FLUJO TRANSACCIONAL: MOTOR DE CHECKOUT

### 3.4.1. Orquestación del proceso de compra

El motor de *Checkout* constituye el flujo transaccional más crítico de la plataforma. Se implementó en la clase `ProcessCheckoutUseCase`, la cual recibe 11 dependencias inyectadas a través de su constructor. El proceso se descompone en 11 pasos secuenciales con garantías de atomicidad parcial y compensación mediante el patrón Saga.

**Paso 1 — Idempotencia.** Se verifica contra el servicio Redis (`IIdempotencyService`) si la clave de idempotencia proporcionada por el cliente ya fue procesada. Si la clave existe y una orden asociada fue persistida, se retorna la respuesta original sin ejecutar efectos secundarios. Si la clave existe pero la orden aún no se materializó, se lanza un error de conflicto. La clave se almacena con un TTL de 24 horas.

**Paso 2 — Validación de dirección.** Se consulta al repositorio de direcciones que la dirección seleccionada pertenezca al usuario autenticado. Si la dirección no existe o pertenece a otro usuario, el proceso se detiene inmediatamente.

**Paso 3 — Bloqueo pesimista de inventario.** Para cada variante de producto en el carrito, se adquiere un *lock* distribuido en Redis con TTL de 600 segundos (10 minutos). Si algún *lock* no puede adquirirse (porque otro proceso de *checkout* concurrente lo posee), se lanza un error de contención. Todos los *locks* adquiridos se liberan en un bloque `finally` al concluir el proceso, independientemente de su resultado.

**Paso 4 — Snapshot congelado y cálculo de subtotal.** Se consultan los datos actuales de cada variante (nombre, SKU, precio, stock disponible) y se genera un *snapshot* inmutable. El subtotal se calcula como la sumatoria de precio unitario multiplicado por cantidad de cada línea.

### 3.4.2. Aplicación de descuentos, envío y monedero virtual

**Paso 5 — Validación y aplicación de cupón.** Si el cliente proporcionó un código de cupón, se validan cinco condiciones de negocio secuencialmente: (a) el cupón existe, (b) está activo, (c) no ha expirado, (d) no ha alcanzado su límite de usos, y (e) el subtotal cumple el monto mínimo de compra configurado. El descuento se calcula como porcentaje del subtotal o como monto fijo, según el tipo de cupón.

**Paso 6 — Motor de enrutamiento logístico.** Se determina automáticamente el tipo de entrega (`LOCAL` o `EXTERNAL_COURIER`) comparando el estado y municipio de la dirección contra una lista configurable de municipios locales. Si el subtotal después de descuento supera un umbral configurable de envío gratuito, el costo de envío se establece en cero. Esta lógica implementa el requerimiento de un motor de enrutamiento logístico automático.

**Paso 7 — Mínimo de compra.** Se valida que el total antes de la deducción de monedero cumpla con el monto mínimo de compra configurado en el sistema. Esta restricción evita transacciones de valor despreciable que incrementen los costos operativos por comisión de pasarela.

**Paso 8 — Deducción de monedero virtual.** Si el cliente solicitó utilizar saldo de su monedero, se verifica que el monedero no haya expirado y que el saldo disponible sea suficiente. La deducción se limita al menor valor entre el monto solicitado y el total pendiente, impidiendo que se genere un saldo negativo.

### 3.4.3. Cobro, persistencia atómica y patrón Saga compensatorio

**Paso 9 — Creación del intento de pago.** Si el total a pagar tras la deducción de monedero es mayor a cero, se crea un *Payment Intent* en la pasarela de pago (Stripe) con el monto en pesos mexicanos (MXN) y metadatos que vinculan el pago al usuario y la clave de idempotencia. La pasarela retorna un `clientSecret` que el *frontend* utiliza para completar el flujo de pago con 3D Secure.

**Paso 10 — Commit SQL atómico.** La orden y todos sus ítems se persisten en una única transacción SQL atómica mediante `IOrderRepository.createOrder`. El estado inicial se establece como `PAYMENT_PENDING` si hay monto a cobrar, o `PAID` si el monedero cubrió la totalidad. Los campos de *compliance* (`termsVersion`, `clientIp`) se incluyen como parte del registro para trazabilidad regulatoria.

**Pasos post-commit — Saga compensatoria.** Después del *commit* SQL exitoso, se ejecutan secuencialmente: el decremento de stock en cada variante, el incremento del contador de usos del cupón, el débito del monedero, y la generación de códigos UUID de recompensa para los productos con `hasVirtualReward = true`. Si alguno de estos pasos falla por una regla de negocio legítima (por ejemplo, stock agotado en la ventana de tiempo entre la verificación y el decremento), la orden se marca como `CANCELLED`. Si el fallo es de infraestructura (timeout de base de datos, pérdida de conexión a Redis), la orden se marca como `NEEDS_RECONCILIATION` y se encola en la *Dead-Letter Queue* (DLQ) para reintento automático por el *worker* de reconciliación.

**Paso 11 — Liberación de locks.** Independientemente del resultado (éxito, error de negocio o error de infraestructura), todos los *locks* de inventario adquiridos en el Paso 3 se liberan en el bloque `finally`.

## 3.5. DISEÑO DEL SUBSISTEMA GAME BRIDGE

### 3.5.1. Arquitectura de comunicación máquina a máquina (M2M)

El Game Bridge se diseñó como una capa de integración entre el backend del E-commerce (PostgreSQL, ACID) y el backend del videojuego (NoSQL, eventual consistency). La comunicación entre ambos sistemas se efectúa a través de una API REST Machine-to-Machine (M2M), autenticada mediante un *Service Account Token* (JWT de larga duración almacenado en la variable de entorno `GAME_API_M2M_TOKEN`).

La interfaz `IGameApiClient` define un único método: `checkRewardStatus(code: string)`, el cual consulta al backend del videojuego si un código de recompensa ha sido canjeado *in-game*. El método retorna uno de tres estados posibles: `NOT_FOUND` (el servidor del juego no conoce el código), `AVAILABLE` (el código existe pero no ha sido canjeado) o `CLAIMED` (el código ya fue utilizado en el juego).

### 3.5.2. Flujo de generación y validación de códigos UUID

La generación de códigos de recompensa se ejecuta como parte del flujo post-commit del *checkout*. El repositorio `IRewardCodeRepository.createBatch` recibe el identificador de la orden y la lista de ítems, generando un código UUID v4 por cada unidad de cada ítem que tenga `hasVirtualReward = true` (generación unitaria 1:1).

La validación se implementó en `ValidateRewardM2MUseCase`, consumido exclusivamente por el backend del videojuego. El caso de uso sigue un flujo determinista: (1) buscar el código en la base de datos relacional, (2) verificar que su estado sea `AVAILABLE`, (3) actualizar el estado a `CLAIMED` y registrar la marca temporal de canje, (4) devolver al juego los datos enriquecidos del producto asociado (nombre y SKU de la variante) para que el motor lúdico materialice la recompensa visual correspondiente.

### 3.5.3. Capa Anti-Corrupción y protección contra fraude

La Capa Anti-Corrupción (ACL) se materializa mediante el middleware `m2mAuthMiddleware`, que intercepta todas las peticiones al endpoint del Game Bridge y valida el *Service Account Token* mediante comparación directa con la clave pre-compartida. Adicionalmente, el middleware `ipAllowlistMiddleware` restringe el acceso al Game Bridge a un conjunto finito de direcciones IP configuradas, implementando una defensa en profundidad.

La protección contra fraude en cancelaciones se implementó como una regla de negocio en `CancelOrderUseCase`: antes de permitir la cancelación de un pedido que generó códigos de recompensa, el sistema consulta al Game Bridge mediante `IGameApiClient.checkRewardStatus` para cada código asociado. Si algún código ya fue canjeado (`CLAIMED`), la cancelación se bloquea y se informa al usuario que debe contactar a soporte. Si el servidor del juego no responde o retorna `NOT_FOUND`, se aplica un *fallback* seguro que permite la cancelación (diseño de degradación elegante).

## 3.6. DISEÑO DEL SUBSISTEMA DE SEGURIDAD TRANSACCIONAL

### 3.6.1. Autenticación basada en JSON Web Tokens (JWT)

El sistema de autenticación se implementó mediante un esquema de doble token: un *Access Token* de corta duración (configurable, por defecto 15 minutos) y un *Refresh Token* de larga duración (por defecto 7 días). El *Access Token* se transmite en el cuerpo de la respuesta JSON y se almacena en memoria del cliente. El *Refresh Token* se inyecta exclusivamente como una *cookie* HttpOnly por el controlador HTTP, garantizando que JavaScript del lado del cliente nunca pueda acceder a su valor (mitigación de ataques XSS).

El middleware `authMiddleware` intercepta las peticiones protegidas, extrae el *Access Token* del encabezado `Authorization: Bearer <token>`, verifica su firma con la clave secreta (`JWT_SECRET`) y decodifica el *payload* para inyectar el contexto del usuario autenticado en el objeto de la petición. Para el panel administrativo, se definió un TTL separado de 8 horas (`ADMIN_JWT_EXPIRES_IN`) y un middleware adicional (`adminMiddleware`) que verifica que el rol del token decodificado sea `ADMIN`.

El caso de uso `RefreshTokenUseCase` implementa la renovación silenciosa de sesión: recibe el *refresh token* de la *cookie*, verifica su validez, genera un nuevo par de tokens y retorna ambos al controlador. Esta rotación continua reduce la ventana de exposición ante el compromiso de un token.

### 3.6.2. Hashing de contraseñas con Argon2

Se seleccionó **Argon2** (variante Argon2id) como algoritmo de *hashing* de contraseñas, por ser el ganador de la Password Hashing Competition (PHC) de 2015. A diferencia de bcrypt, Argon2id combina resistencia a ataques de fuerza bruta basados en GPU (componente *memory-hard*) con resistencia a ataques de canal lateral (*side-channel resistant*). El hash resultante se almacena en el campo `passwordHash` de la entidad `User` y se verifica en el caso de uso `LoginUserUseCase` contra la contraseña en texto plano proporcionada por el cliente.

### 3.6.3. Verificación HMAC de webhooks y cumplimiento PCI-DSS

La integración con la pasarela de pago Stripe se diseñó bajo el paradigma de delegación total para minimizar el alcance PCI-DSS (*PCI Scope*). El backend nunca procesa, transmite ni almacena datos de tarjeta de crédito. El flujo se describe a continuación:

1. El *frontend* invoca a Stripe.js (biblioteca cargada desde los servidores de Stripe) para crear un elemento de pago (*Payment Element*) dentro de un iframe aislado.
2. El usuario ingresa los datos de tarjeta directamente en el iframe de Stripe, los cuales se transmiten cifrados por TLS 1.3 exclusivamente a los servidores de Stripe.
3. Stripe retorna al backend un *Payment Intent ID* (identificador opaco) y un `clientSecret` para completar la confirmación en el *frontend*.
4. Al confirmarse el pago, Stripe envía un *webhook* al endpoint configurado del backend.

El método `parseWebhookEvent` del adaptador `StripeAdapter` verifica la firma HMAC del *webhook* utilizando el encabezado `Stripe-Signature` y la clave secreta del *webhook* (`STRIPE_WEBHOOK_SECRET`). Esta verificación garantiza la integridad y autenticidad del evento: que el *payload* no fue alterado en tránsito y que proviene genuinamente de los servidores de Stripe. Si la firma no coincide, se lanza un error de dominio `WebhookSignatureInvalidError` y el evento se descarta.

El middleware `rawBodyMiddleware` se encarga de preservar el cuerpo de la petición como un `Buffer` sin procesar, ya que la verificación HMAC requiere los bytes exactos del *payload* original. Si el cuerpo fuera deserializado a JSON antes de la verificación, la re-serialización podría alterar el orden de las claves o el formato de los espacios, invalidando la firma.

### 3.6.4. Reconciliación asíncrona y Dead-Letter Queue (DLQ)

Se implementó el caso de uso `WebhookPaymentReconciliationUseCase` para procesar los eventos de pago confirmado que llegan a través de webhooks de Stripe. Este caso de uso traduce el evento genérico de la pasarela a una transición de estado de la orden (de `PAYMENT_PENDING` a `PAID`) y ejecuta las operaciones post-pago que pudieron haber fallado durante el *checkout* inicial.

Si el *commit* SQL del *checkout* falló después de que Stripe procesara exitosamente el cobro (un escenario excepcional pero posible ante pérdida de conexión a la base de datos), la orden se marcó como `NEEDS_RECONCILIATION` y se encoló en la cola `reconcile-checkout` de BullMQ. Un *worker* separado (`payment-reconciliation.worker.ts`) procesa estos eventos con reintentos automáticos y *backoff* exponencial, buscando restaurar la consistencia del sistema sin intervención manual.

## 3.7. DISEÑO DEL PANEL ADMINISTRATIVO CMS

### 3.7.1. Gestión del catálogo con versionado optimista

El panel CMS permite a los administradores crear, actualizar y eliminar productos del catálogo. La eliminación se implementó como *Soft Delete* (campo `isDeleted` en la entidad `Product`), preservando la integridad referencial con los pedidos históricos. Nunca se eliminan registros físicamente de la base de datos.

La edición concurrente de productos se protege mediante Control de Concurrencia Optimista (OCC): cada producto posee un campo `version` que se incrementa automáticamente con cada actualización. Si dos administradores intentan editar el mismo producto simultáneamente, el segundo en confirmar recibirá un error de conflicto de versión, obligándolo a recargar los datos antes de reintentar la operación.

### 3.7.2. Bitácora de auditoría inmutable

Toda acción administrativa (creación de productos, actualización de precios, gestión de cupones, bloqueo de usuarios, emisión de reembolsos) se registra en la tabla `audit_logs` a través del repositorio `IAuditLogRepository`. Cada registro captura: el identificador y correo del administrador, la acción ejecutada (`CREATE`, `UPDATE`, `SOFT_DELETE`, `REFUND`, `BAN`), el tipo de entidad afectada, el identificador de la entidad, los valores previos y posteriores al cambio (almacenados como JSONB) y la dirección IP del administrador.

La inmutabilidad de la bitácora se garantiza mediante un *trigger* SQL (`BEFORE UPDATE OR DELETE`) definido en la migración 009, que impide categóricamente la modificación o eliminación de cualquier registro de auditoría una vez insertado. El middleware `adminAuditContextMiddleware` inyecta automáticamente el contexto del administrador (identificador, correo e IP) en cada petición, eliminando la necesidad de que cada caso de uso gestione manualmente los datos de auditoría.

### 3.7.3. Gestión de pedidos con flujo Kanban y última milla

Los administradores disponen de un endpoint para listar todos los pedidos del sistema con soporte de paginación y filtrado por estado, implementado en `ListAllOrdersAdminUseCase`. La transición de estados se gestiona mediante `UpdateOrderStatusUseCase`, que valida la legitimidad de cada transición dentro del *pipeline* definido: `PAYMENT_PENDING → PAID → PREPARING → SHIPPED → DELIVERING → DELIVERED`.

Durante las transiciones a `SHIPPED` o `DELIVERING`, el administrador proporciona los datos de última milla: nombre del chofer, vehículo y teléfono para envíos locales, o empresa de paquetería y número de guía para envíos foráneos. Estos datos se almacenan en la propia entidad `Order` y se exponen al cliente mediante WebSocket en tiempo real.

## 3.8. DISEÑO DE LA CAPA DE COMUNICACIÓN EN TIEMPO REAL

### 3.8.1. WebSocket para notificaciones reactivas

Se implementó un servidor WebSocket (`WebSocketServer`) integrado al servidor Fastify mediante el plugin `@fastify/websocket`. La conexión WebSocket permite enviar notificaciones en tiempo real al cliente sin necesidad de *polling*, cubriendo eventos como: actualización de estado de pedidos, confirmación de pagos procesados y alertas de inventario.

La autenticación de la conexión WebSocket se realiza mediante el mismo mecanismo JWT del API REST: el cliente incluye el *Access Token* como parámetro de *query string* al establecer la conexión, y el servidor lo verifica antes de aceptar el *upgrade* del protocolo HTTP a WebSocket.

## 3.9. ESTRATEGIA DE DESPLIEGUE Y WORKERS ASINCRÓNICOS

### 3.9.1. Topología de procesos del sistema

La arquitectura de despliegue se compone de tres procesos independientes ejecutados concurrentemente:

1. **Proceso principal (`npm run dev`):** Servidor HTTP Fastify que atiende todas las peticiones REST y conexiones WebSocket.
2. **Worker de reconciliación (`npm run worker:reconciliation`):** Proceso BullMQ que consume la cola `reconcile-checkout` para resolver órdenes en estado `NEEDS_RECONCILIATION`.
3. **Worker de correo electrónico (`npm run worker:email`):** Proceso BullMQ que consume la cola de envío de correos transaccionales (confirmación de pedido, notificación de envío) mediante el servicio Resend.

Esta separación en procesos aislados garantiza que un fallo en el envío de correos electrónicos no degrade el tiempo de respuesta del API principal, ni que un *backlog* en la cola de reconciliación bloquee el procesamiento de nuevas peticiones HTTP.

### 3.9.2. Variables de entorno y configuración segura

Todas las credenciales sensibles (claves de API de Stripe, secretos JWT, tokens M2M del Game Bridge, credenciales de AWS S3, claves de API de correo electrónico) se gestionan exclusivamente a través de variables de entorno definidas en archivos `.env` (excluidos del control de versiones mediante `.gitignore`). El archivo `.env.example` documenta la estructura esperada con 19 variables de configuración, permitiendo la replicación del entorno de desarrollo sin exponer valores reales.

El servidor implementa valores de *fallback* para las variables críticas (por ejemplo, `JWT_SECRET` posee un valor por defecto con el sufijo `do-not-use-in-production`) que permiten el arranque en entornos de desarrollo, pero que resultan intencionalmente inseguros para señalizar la necesidad de configuración explícita en producción.

## 3.10. VERIFICACIÓN Y ASEGURAMIENTO DE CALIDAD

### 3.10.1. Mecanismos de verificación integrados

La verificación del sistema se sustenta en múltiples capas de aseguramiento de calidad:

**Verificación estática.** El compilador de TypeScript (`tsc`) valida la coherencia de tipos entre las interfaces de dominio, los puertos de aplicación y los adaptadores de infraestructura en tiempo de compilación. Cualquier ruptura de contrato (por ejemplo, un repositorio que no implemente un método definido en su interfaz) se detecta antes de la ejecución.

**Verificación de esquema.** El script `test-connection.ts` permite validar la conectividad y estructura de la base de datos PostgreSQL. Las migraciones se ejecutan de forma idempotente, verificando la existencia previa de tablas y columnas antes de aplicar cambios.

**Verificación transaccional.** El flujo de *checkout* se diseñó con múltiples puntos de validación que garantizan la consistencia del estado: verificación de idempotencia, verificación de propiedad de dirección, verificación de stock con bloqueo pesimista, validación de cupón con cinco condiciones independientes, validación de saldo de monedero, y verificación de monto mínimo de compra.

**Verificación de integridad en comunicaciones.** La firma HMAC de los webhooks de Stripe se verifica en cada evento recibido. Los endpoints M2M del Game Bridge se protegen con autenticación por token y restricción por lista blanca de IP. Los *Rate Limiter* configurados a nivel de Fastify previenen la saturación del sistema por peticiones abusivas.

### 3.10.2. Auditoría arquitectónica por fases

El proyecto adoptó un proceso formal de auditoría por fases documentado en archivos independientes. Cada auditoría revisa la adherencia a Clean Architecture, la correcta aplicación de principios SOLID, la completitud de los contratos de interfaz, la cobertura de casos de error y la conformidad con los requerimientos definidos en el documento de especificación de requisitos de software (SRS).
