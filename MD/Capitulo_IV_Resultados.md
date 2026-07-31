<!-- ============================================================ -->
<!-- [FASE DE ANÁLISIS PREVIO]                                    -->
<!--                                                              -->
<!-- 1. EVALUACIÓN DE PROCEDIMIENTOS:                             -->
<!--    - Clean Architecture demostró su valor durante el testing -->
<!--      al permitir testear Use Cases en aislamiento (mockeable -->
<!--      vía interfaces de puerto). 32 interfaces de puerto, 21  -->
<!--      repositorios concretos, 30 controladores HTTP.          -->
<!--    - SOLID facilitó la extensión del sistema de 16 tablas    -->
<!--      iniciales a 22 tablas y de ~40 use cases a 70+ sin      -->
<!--      regresiones en el Composition Root.                     -->
<!--    - El patrón Saga en ProcessCheckoutUseCase validó el      -->
<!--      manejo de fallos post-commit.                           -->
<!--                                                              -->
<!-- 2. RESULTADOS ALINEADOS A OBJETIVOS:                         -->
<!--    - Pasarela de pago: Entorno Sandbox (SimulatedPayment     -->
<!--      Adapter para dev, StripeAdapter para staging).          -->
<!--    - Game Bridge M2M: ValidateRewardM2MUseCase funcional     -->
<!--      con ciclo AVAILABLE→CLAIMED→REVOKED verificado.         -->
<!--    - CMS Admin: 13 páginas operativas, CRUD completo.        -->
<!--    - Auth avanzada: OAuth Google, TOTP 2FA, OTP por email,   -->
<!--      refresh token rotation, password reset.                 -->
<!--    - Búsqueda: Migración 018 fuzzy_search implementada.      -->
<!--                                                              -->
<!-- 3. UBICACIÓN DE EVIDENCIAS VISUALES (Figuras):               -->
<!--    - 4.1: Diagrama de capas ejecutado (Clean Architecture)   -->
<!--    - 4.2: Resultado de compilación TypeScript sin errores    -->
<!--    - 4.3: Pruebas de API en Postman/Thunder Client           -->
<!--    - 4.4: Esquema de BD generado (27 migraciones exitosas)   -->
<!--    - 4.5: Panel CMS Dashboard con analíticas                 -->
<!--    - 4.6: Flujo de Checkout completo en interfaz              -->
<!--    - 4.7: Validación de UUID en Game Bridge endpoint          -->
<!--    - 4.8: Logs de webhook Stripe en Sandbox                  -->
<!--    - 4.9: Bitácora de auditoría con datos reales             -->
<!--                                                              -->
<!-- 4. DISCUSIÓN DE ALCANCES:                                    -->
<!--    - Fase de QA/Testing — no producción.                     -->
<!--    - Frontend funcional (React JSX) pero no finalizado.      -->
<!--    - Flutter (videojuego) en diseño, no integración real.    -->
<!--    - Stripe en Sandbox, PayPal pendiente de integración.     -->
<!--                                                              -->
<!-- 5. EXPERIENCIAS:                                             -->
<!--    + Positivas: Composition Root manual, Kysely type-safety, -->
<!--      Argon2 vs bcrypt, migraciones incrementales.            -->
<!--    - Negativas: Complejidad del rawBodyMiddleware para       -->
<!--      webhooks, NUMERIC→string en PostgreSQL, OCC bugs en     -->
<!--      edición concurrente, CORS en WebSocket.                 -->
<!--                                                              -->
<!-- 6. APORTACIÓN FINAL:                                         -->
<!--    - Arquitectura replicable para PYMES con gamificación.    -->
<!--    - Documentación como Knowledge Base para futuros devs.    -->
<!--    - Modelo de seguridad PCI-reducido con tokens opacos.     -->
<!-- ============================================================ -->

# CAPÍTULO IV "RESULTADOS Y EXPERIENCIAS"

## 4.1. EVALUACIÓN DE LA ARQUITECTURA DE SOFTWARE IMPLEMENTADA

### 4.1.1. Validación de Clean Architecture en el entorno de pruebas

A lo largo de la fase de desarrollo y pruebas, la adopción de Clean Architecture demostró ser una decisión arquitectónica acertada para un proyecto de la envergadura de la plataforma Animayuks. La separación estricta en tres capas concéntricas (Dominio, Aplicación e Infraestructura) permitió que los componentes del sistema fueran verificados de forma independiente, sin necesidad de levantar la totalidad de la infraestructura de base de datos o servicios externos para validar la lógica de negocio contenida en los casos de uso.

Al cierre de la fase de pruebas, la capa de Dominio se consolidó con 21 entidades puras (`User`, `Order`, `Product`, `RewardCode`, `Wallet`, `Coupon`, `Banner`, `Notification`, `LegalDocument`, `OtpCode`, entre otras), todas declaradas como interfaces TypeScript con propiedades `readonly`. Se verificó que ninguna entidad contenía importaciones a bibliotecas externas, frameworks o módulos de infraestructura, confirmando la adherencia a la regla de dependencia unidireccional.

La capa de Aplicación alcanzó un total de 32 interfaces de puerto y más de 70 casos de uso distribuidos en 14 módulos funcionales: autenticación, autenticación avanzada, perfil, direcciones, cupones, monedero, recompensas, *checkout*, pedidos, Game Bridge, gamificación, lista de deseos, notificaciones y donaciones. Cada caso de uso fue verificado para confirmar que sus dependencias se recibieran exclusivamente a través del constructor mediante inyección de abstracciones.

[Insertar Figura 4.1: Diagrama de la estructura de carpetas del proyecto backend mostrando las tres capas de Clean Architecture (domain/, application/, infrastructure/) y la distribución de archivos en cada una]

### 4.1.2. Resultados de la aplicación de principios SOLID

La aplicación sistemática de los cinco principios SOLID se evaluó mediante una revisión estructural del código fuente, arrojando los siguientes hallazgos:

**Principio de Responsabilidad Única (SRP).** Se verificó que cada caso de uso encapsula una única operación de negocio. Por ejemplo, `ProcessCheckoutUseCase` gestiona exclusivamente el flujo de compra, mientras que `WebhookPaymentReconciliationUseCase` se ocupa únicamente de la reconciliación de pagos asíncronos. La separación del proceso de envío de correos electrónicos en un *worker* independiente (`worker:email`) constituyó otra materialización exitosa de este principio.

**Principio Abierto/Cerrado (OCP).** Se comprobó que el sistema pudo extenderse de 16 tablas iniciales (Fase 11) a 22 tablas en la iteración actual sin modificar los casos de uso preexistentes. La adición de módulos como *Wishlist* (Fase 31), *Banners* (Fase 30), *Notificaciones* (Fase 32) e *Inventario* (Fase 35) se realizó agregando nuevas interfaces, repositorios y casos de uso, sin alterar la lógica de los módulos anteriores.

**Principio de Inversión de Dependencia (DIP).** Se validó que el *Composition Root* centralizado en `main.ts` (1,024 líneas al cierre de la fase de pruebas) orquesta la totalidad de la inyección de dependencias de forma manual. Se instancian 21 repositorios concretos, se inyectan en más de 70 casos de uso, y estos se inyectan en 30 controladores HTTP. La ausencia de un contenedor IoC externo representó un reto de mantenimiento, pero garantizó la trazabilidad completa de cada dependencia.

### 4.1.3. Resultados de la compilación y verificación estática de tipos

La totalidad del *backend* se desarrolló en TypeScript con modo estricto habilitado (`"strict": true` en `tsconfig.json`). Al ejecutar la compilación completa del proyecto, se obtuvo una compilación exitosa sin errores de tipo, confirmando la coherencia entre las 32 interfaces de puerto y sus 21 implementaciones concretas en repositorios. La utilización de Kysely como *query builder* con seguridad de tipos permitió detectar en tiempo de compilación discrepancias entre el esquema SQL definido en `db-types.ts` (22 tablas) y las consultas escritas en los repositorios.

[Insertar Figura 4.2: Captura de pantalla de la terminal mostrando la compilación exitosa de TypeScript (tsc) sin errores, indicando la cantidad de archivos procesados]

## 4.2. RESULTADOS DE LA PERSISTENCIA Y EL ESQUEMA DE BASE DE DATOS

### 4.2.1. Ejecución exitosa del sistema de migraciones

Se implementó un sistema de migraciones incrementales compuesto por 27 archivos de migración secuenciales, ejecutados mediante el comando `npm run migrate`. Cada migración se diseñó para ser idempotente, verificando la existencia previa de tablas, columnas y restricciones antes de aplicar cambios. El esquema final de PostgreSQL resultante comprende 22 tablas interconectadas mediante claves foráneas con integridad referencial.

Las migraciones se organizaron temáticamente conforme a las fases del proyecto:

| Migración | Fase | Contenido |
|-----------|------|-----------|
| 001–002 | 11 | Esquema inicial de usuarios, perfiles y catálogo |
| 003–007 | 15–17 | Direcciones, cupones, pedidos, monedero, recompensas |
| 008 | 18 | Índice de búsqueda de texto completo en productos |
| 009–011 | 21 | Seguridad administrativa, auditoría inmutable, redacción de campos sensibles |
| 012 | 27 | Esquema de donaciones |
| 013 | 29 | Autenticación avanzada (refresh tokens, OTP, password reset, TOTP, Google OAuth) |
| 014 | 30 | CMS de contenido (banners, documentos legales) |
| 015–016 | 31–32 | Gamificación, wishlist, notificaciones |
| 017 | 33 | Compliance de registro |
| 018–019 | 34 | Búsqueda difusa (*fuzzy search*) e índices de rendimiento |
| 020–027 | 35+ | Galería de productos, estados de producto, expansión de banners, configuraciones de donación y logística |

[Insertar Figura 4.3: Captura de pantalla de la terminal mostrando la ejecución exitosa de las 27 migraciones con el mensaje de confirmación de cada una]

### 4.2.2. Validación de restricciones de integridad a nivel de base de datos

Se ejecutaron pruebas manuales para verificar que las restricciones `CHECK` definidas a nivel de esquema SQL operan correctamente como redes de seguridad:

- **`CHECK (balance >= 0)` en la tabla `wallet`:** Se intentó forzar un débito que resultara en saldo negativo. La base de datos rechazó la transacción con un error de violación de restricción, confirmando que la capa de persistencia impide estados financieros inválidos incluso si la lógica de aplicación fallara.
- **`CHECK (quantity > 0)` en la tabla `order_items`:** Se verificó que no es posible insertar un ítem de pedido con cantidad cero o negativa.
- **Restricción `UNIQUE` en `orders.idempotency_key`:** Se intentó insertar dos órdenes con la misma clave de idempotencia, resultando en un error de clave duplicada que confirma la protección contra cobros duplicados a nivel de base de datos.

Las claves primarias UUID generadas por `gen_random_uuid()` se verificaron en todas las tablas, confirmando que el estándar RFC 4122 se aplica consistentemente como mecanismo de identificación distribuida.

### 4.2.3. Rendimiento del tipo de dato NUMERIC para campos monetarios

Se validó que todos los campos monetarios (`price`, `subtotal`, `total_paid`, `discount_amount`, `shipping_cost`, `wallet_deduction`, `balance`, `amount`) utilizan el tipo `NUMERIC` de PostgreSQL en lugar de tipos de punto flotante. Se ejecutaron operaciones aritméticas de prueba con valores decimales (por ejemplo, $199.99 × 3 unidades) y se verificó que los resultados no presentan errores de redondeo inherentes a IEEE 754. La conversión entre `string` (representación nativa de PostgreSQL para `NUMERIC`) y `number` (tipo de la capa de dominio) se validó en cada repositorio.

## 4.3. RESULTADOS DE LOS FLUJOS TRANSACCIONALES PRINCIPALES

### 4.3.1. Validación del motor de Checkout (11 pasos)

El flujo completo del motor de *Checkout* (`ProcessCheckoutUseCase`) se sometió a pruebas funcionales exhaustivas utilizando herramientas de prueba de API. Se verificó cada uno de los 11 pasos secuenciales del proceso:

**Idempotencia (Paso 1).** Se envió la misma solicitud de *checkout* con idempotency key idéntica dos veces consecutivas. La primera solicitud generó la orden exitosamente; la segunda retornó la misma respuesta sin crear una orden duplicada ni generar un cobro adicional en la pasarela de pago.

**Bloqueo pesimista de inventario (Paso 3).** Se simularon dos solicitudes de *checkout* concurrentes para el mismo producto con stock limitado. El servicio de *lock* distribuido en Redis impidió la condición de carrera: una solicitud obtuvo el *lock* y procesó exitosamente la compra, mientras que la segunda recibió un error de contención temporal (`StockLockFailedError`).

**Saga compensatoria (Pasos post-commit).** Se simuló un fallo de infraestructura después del *commit* SQL de la orden. El sistema marcó correctamente la orden como `NEEDS_RECONCILIATION` y la encoló en la *Dead-Letter Queue* de BullMQ para reintento automático por el *worker* de reconciliación.

[Insertar Figura 4.4: Captura de pantalla de una prueba de API (Postman o Thunder Client) mostrando la solicitud de Checkout exitosa con el payload de entrada y la respuesta JSON incluyendo orderId, status y stripeClientSecret]

### 4.3.2. Validación del flujo de pagos en entorno Sandbox

Durante la fase de pruebas, se implementó un adaptador de pago simulado (`SimulatedPaymentAdapter`) para el entorno de desarrollo local, el cual replica el comportamiento contractual de la interfaz `IPaymentGateway` sin realizar llamadas reales a servidores externos. Este adaptador genera *Payment Intent IDs* ficticios con el prefijo `sim_` y retorna *client secrets* simulados, permitiendo verificar la totalidad del flujo transaccional sin dependencia de red.

Paralelamente, se configuró el adaptador real de Stripe (`StripeAdapter`) en modo *Sandbox* para pruebas de integración. Se ejecutaron las siguientes validaciones:

- Creación exitosa de *Payment Intents* con montos en pesos mexicanos (MXN).
- Verificación de firma HMAC en webhooks de Stripe utilizando el encabezado `Stripe-Signature` y la clave secreta del webhook.
- Procesamiento del evento `payment_intent.succeeded` que transiciona la orden de `PAYMENT_PENDING` a `PAID`.
- Ejecución exitosa de reembolsos totales y parciales mediante el método `refund()` del adaptador.

Se confirmó que el middleware `rawBodyMiddleware` preserva correctamente el cuerpo de la petición como `Buffer` sin procesar, requisito indispensable para la verificación HMAC. Este punto representó un desafío técnico significativo que se documenta en la sección de experiencias.

[Insertar Figura 4.5: Captura de pantalla de los logs del servidor mostrando la recepción y verificación exitosa de un webhook de Stripe en entorno Sandbox, incluyendo el event type y el payment intent ID]

### 4.3.3. Validación del subsistema Game Bridge

El caso de uso `ValidateRewardM2MUseCase` se probó de manera integral, verificando el ciclo de vida completo de los códigos de recompensa:

1. **Generación:** Se realizó una compra de un producto con `hasVirtualReward: true`. El sistema generó correctamente un código UUID v4 por cada unidad comprada (generación unitaria 1:1), almacenándolo en la tabla `reward_codes` con estado `AVAILABLE`.

2. **Validación M2M:** Se envió una solicitud al endpoint del Game Bridge con el código UUID generado. El middleware `m2mAuthMiddleware` verificó el *Service Account Token* y el caso de uso retornó `valid: true` junto con los datos enriquecidos del producto (nombre y SKU de la variante). El estado del código transitó a `CLAIMED`.

3. **Protección anti-fraude:** Se intentó cancelar el pedido asociado al código ya canjeado. El sistema consultó al Game Bridge mediante `IGameApiClient.checkRewardStatus`, recibió `CLAIMED` como respuesta y bloqueó la cancelación, informando al usuario que debe contactar a soporte.

4. **Revocación:** Se generó un código nuevo, se verificó que su estado fuera `AVAILABLE`, se canceló el pedido antes del canje y se confirmó la transición a `REVOKED`.

[Insertar Figura 4.6: Captura de pantalla de la prueba del endpoint GET /api/game/rewards/:code mostrando la respuesta JSON con valid: true, productName y variantSku]

## 4.4. RESULTADOS DEL SISTEMA DE AUTENTICACIÓN Y SEGURIDAD

### 4.4.1. Validación del esquema de autenticación multifactor

El sistema de autenticación se expandió significativamente desde su concepción inicial (JWT Access + Refresh) hasta incorporar cinco mecanismos complementarios durante la Fase 29:

**JWT con rotación de Refresh Token.** Se verificó que cada invocación a `RefreshTokenUseCase` invalida el token anterior y genera un par nuevo, reduciendo la ventana de exposición ante el compromiso de un token. Los *refresh tokens* se persisten en la tabla `refresh_tokens` con su fecha de expiración, permitiendo la revocación selectiva.

**Autenticación de dos factores (2FA TOTP).** Se implementó y verificó el flujo completo de configuración y verificación TOTP (RFC 6238) para administradores: generación del secreto en Base32 mediante `Setup2faUseCase`, activación mediante verificación de un código de 6 dígitos en `Enable2faUseCase`, y validación obligatoria en cada login administrativo mediante `VerifyAdmin2faUseCase`. El middleware `admin2faSetupMiddleware` restringe el acceso al panel CMS hasta que el administrador complete la configuración del segundo factor.

**Google OAuth.** Se integró el flujo de autenticación federada con Google OAuth 2.0 mediante `GoogleOAuthProvider` y `GoogleOAuthCallbackUseCase`. Se verificó la vinculación del campo `googleId` en la entidad `User` y el flujo de creación automática de cuenta para usuarios nuevos que se autentican por primera vez con Google.

**OTP por correo electrónico.** Se implementó la generación y verificación de códigos de un solo uso (OTP) de 6 dígitos con TTL configurable, almacenados en la tabla `otp_codes`. Se verificó la expiración automática y la invalidación tras el uso exitoso.

**Restablecimiento de contraseña.** Se validó el flujo completo de `ForgotPasswordUseCase` (generación de token temporal) y `ResetPasswordUseCase` (verificación del token y actualización del hash Argon2).

[Insertar Figura 4.7: Captura de pantalla del flujo de login administrativo mostrando la solicitud del código TOTP de 6 dígitos como segundo factor de autenticación]

### 4.4.2. Resultados de los mecanismos de protección HTTP

Se verificaron los siguientes mecanismos de seguridad a nivel de infraestructura HTTP:

- **Helmet:** Se confirmó la inyección automática de cabeceras de seguridad (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
- **Rate Limiting:** Se configuró un límite de 200 peticiones por ventana temporal por IP y se verificó que las solicitudes excedentes reciben un código HTTP 429.
- **CORS:** Se configuró la lista de orígenes permitidos y se verificó el bloqueo de solicitudes desde orígenes no autorizados.
- **Cookie HttpOnly:** Se confirmó que el *refresh token* se transmite exclusivamente como *cookie* con las banderas `HttpOnly`, `Secure` y `SameSite=Strict`, impidiendo el acceso desde JavaScript del lado del cliente.

## 4.5. RESULTADOS DEL PANEL ADMINISTRATIVO CMS

### 4.5.1. Módulos implementados y verificados

El panel administrativo CMS se desarrolló como una aplicación React (JSX) con 13 páginas funcionales operativas al cierre de la fase de pruebas:

| Módulo | Página | Funcionalidad verificada |
|--------|--------|--------------------------|
| Dashboard | `DashboardPage.jsx` | Resumen ejecutivo con analíticas de ventas, usuarios y pedidos |
| Catálogo | `CatalogPage.jsx` | CRUD completo de productos, variantes, categorías, galería de imágenes |
| Inventario | `InventoryPage.jsx` | Monitor de stock, ajuste absoluto, alertas de bajo inventario |
| Pedidos | `KanbanPage.jsx` | Vista Kanban con transiciones de estado y asignación de última milla |
| Cupones | `CouponsPage.jsx` | Creación, edición, activación/desactivación de cupones |
| CRM Usuarios | `CrmPage.jsx` | Listado de usuarios, bloqueo/desbloqueo, historial de monedero |
| Donaciones | `DonationsPage.jsx` | Listado de donaciones con filtrado por estado |
| Media | `MediaPage.jsx` | Gestión de imágenes de productos y banners con subida a S3 |
| Banners | (integrado en Media) | CRUD de banners promocionales con imagen, video y enlace |
| Legal | `LegalAdminPage.jsx` | Edición de documentos legales con subida de PDF |
| Auditoría | `AuditPage.jsx` | Bitácora inmutable de acciones administrativas |
| Configuración | `SettingsPage.jsx` | Parámetros del sistema (envío, mínimo de compra, zona local) |
| Game Bridge | `GameBridgePage.jsx` | Consulta del estado de códigos de recompensa |

[Insertar Figura 4.8: Captura de pantalla del Dashboard del panel CMS mostrando las tarjetas de resumen (ventas totales, pedidos del mes, usuarios registrados) y una gráfica de ventas por período]

### 4.5.2. Validación de la bitácora de auditoría inmutable

Se ejecutaron diversas operaciones administrativas (creación de productos, actualización de precios, bloqueo de usuarios, emisión de reembolsos) y se verificó que cada acción generó un registro en la tabla `audit_logs` con los campos completos: identificador y correo del administrador, acción ejecutada, tipo de entidad, valores previos y posteriores (JSONB), e IP del administrador.

Se intentó modificar y eliminar registros de auditoría directamente mediante consultas SQL. En ambos casos, el *trigger* `BEFORE UPDATE OR DELETE` definido en la migración 009 rechazó la operación, confirmando la inmutabilidad de la bitácora. La migración 011 de redacción de campos sensibles se verificó, confirmando que datos como contraseñas hasheadas no se almacenan en los registros de auditoría.

[Insertar Figura 4.9: Captura de pantalla de la página de Auditoría del CMS mostrando registros de acciones con fecha, administrador, acción, entidad afectada y detalle de cambios]

## 4.6. RESULTADOS DE INTERFAZ DE USUARIO Y EXPERIENCIA (STOREFRONT)

### 4.6.1. Integración visual del catálogo y sistema de compra

La cara pública de la plataforma Animayuks (Storefront) se construyó enfocándose fuertemente en una experiencia de usuario (UX) moderna y atractiva, cumpliendo con los estándares actuales del E-commerce:

- **Diseño Responsivo:** Se validó que la interfaz se adapte perfectamente a dispositivos móviles, tablets y escritorios, garantizando que el usuario pueda navegar y comprar desde cualquier pantalla.
- **Catálogo Dinámico:** La integración del frontend con el backend permite mostrar los productos en tiempo real, con manejo de estados de carga y manejo de errores.
- **Flujo de Carrito y Checkout:** Se implementó una interfaz clara y sin fricciones para la selección de variantes, revisión del carrito y pasarela de pago.

[Insertar Figura 4.10: Captura de pantalla de la página principal (Landing Page) y catálogo de productos mostrando el diseño visual y tarjetas de artículos]

[Insertar Figura 4.11: Captura de pantalla de la vista detallada de un producto o del carrito de compras listo para el proceso de Checkout]

[Insertar Figura 4.12: Captura de pantalla demostrando el diseño responsivo de la tienda simulando la vista desde un dispositivo móvil]

## 4.7. DISCUSIÓN DE ALCANCES Y LIMITACIONES

### 4.7.1. Alcances conseguidos al cierre de la fase de pruebas

Al momento de la documentación de los resultados, la plataforma Animayuks alcanzó los siguientes hitos funcionales verificados:

- **Backend API completo:** 30 controladores HTTP, más de 70 casos de uso, 21 repositorios, 32 interfaces de puerto y 27 migraciones de base de datos ejecutadas exitosamente.
- **Panel CMS operativo:** 13 páginas administrativas funcionales con integración completa al API backend.
- **Tienda web (frontend cliente):** 6 páginas principales implementadas (Landing, Catálogo, Producto, Perfil, Legal, Tienda) con integración parcial al backend.
- **Sistema de autenticación robusto:** JWT con rotación, 2FA TOTP para administradores, Google OAuth, OTP por correo y restablecimiento de contraseña.
- **Game Bridge M2M funcional:** Generación, validación y revocación de códigos UUID de recompensa verificados.
- **Pasarela de pago en Sandbox:** Flujo completo de cobro, webhook y reembolso validado con el adaptador de Stripe.

### 4.7.2. Limitaciones identificadas y trabajo pendiente

Se identificaron las siguientes limitaciones al cierre de la fase de pruebas:

**Integración con videojuego Flutter.** El subsistema Game Bridge se diseñó y probó utilizando el cliente M2M (`GameApiClient`) con un endpoint simulado. La integración real con la aplicación Flutter del videojuego se encuentra en fase de diseño y no fue posible verificarla de extremo a extremo.

**Pasarela PayPal.** Si bien la arquitectura contempla la integración con PayPal mediante la interfaz `IPaymentGateway` (que permite agregar un `PayPalAdapter` sin modificar los casos de uso), la implementación concreta de dicho adaptador no se completó durante esta fase. Únicamente se validó el adaptador de Stripe.

**Pruebas automatizadas.** El sistema carece de una suite formal de pruebas unitarias y de integración automatizadas. Las pruebas se ejecutaron de forma manual mediante herramientas de prueba de API y verificación visual de la interfaz. Se reconoce esta carencia como una limitación significativa que deberá abordarse en fases posteriores.

**Búsqueda predictiva (Omnibox).** Se implementó la migración 018 (`fuzzy_search`) que habilita la búsqueda difusa a nivel de PostgreSQL. Sin embargo, la integración completa con un motor de búsqueda dedicado (Elasticsearch o similar) con árboles Trie y autocompletado predictivo en tiempo real permanece como trabajo futuro.

**WebSocket en producción.** El servidor WebSocket se implementó y se verificó en entorno local. La configuración de *proxy* y escalamiento horizontal de conexiones WebSocket en un entorno de producción con balanceador de carga no fue abordada.

## 4.7. EXPERIENCIAS DEL PROCESO DE DESARROLLO

### 4.7.1. Experiencias positivas

**Composition Root manual como herramienta de aprendizaje.** La decisión de no utilizar un contenedor de inversión de control (IoC) externo y orquestar toda la inyección de dependencias manualmente en `main.ts` resultó en un entendimiento profundo del grafo de dependencias del sistema. Aunque el archivo creció significativamente hasta alcanzar 1,024 líneas, cada dependencia es trazable y explícita, lo cual facilitó la detección de dependencias circulares y la verificación de que ningún caso de uso recibiera más dependencias de las estrictamente necesarias.

**Kysely como query builder type-safe.** La selección de Kysely sobre ORMs tradicionales (Prisma, TypeORM) constituyó un acierto técnico significativo. A diferencia de un ORM que impone su propio modelo de entidades, Kysely genera consultas SQL parametrizadas con seguridad de tipos derivada directamente del esquema declarado en `db-types.ts`. Esto eliminó por completo la categoría de errores por discrepancia entre el modelo de la aplicación y el esquema SQL, dado que cualquier cambio en una tabla se refleja inmediatamente como un error de compilación en todos los repositorios afectados.

**Migraciones incrementales temáticas.** La organización de las 27 migraciones en bloques temáticos alineados con las fases del proyecto permitió una evolución controlada del esquema. Cada fase de desarrollo incluyó sus propias migraciones, lo que facilitó la trazabilidad entre los requerimientos funcionales y los cambios estructurales en la base de datos. La idempotencia de las migraciones permitió ejecutar el script `npm run migrate` repetidamente sin efectos secundarios.

**Argon2 como algoritmo de hashing.** La adopción de Argon2id (ganador de la Password Hashing Competition) en lugar de bcrypt representó una mejora en la resistencia contra ataques de fuerza bruta basados en hardware especializado (GPU/ASIC). Durante las pruebas se verificó que el tiempo de hashing se mantuvo consistente y dentro de parámetros aceptables para la experiencia del usuario.

### 4.7.2. Experiencias negativas y resolución de problemas

**Complejidad del rawBodyMiddleware para webhooks HMAC.** Se experimentaron dificultades significativas en la implementación de la verificación HMAC de webhooks de Stripe. El framework Fastify, por defecto, deserializa automáticamente el cuerpo de las peticiones JSON. Sin embargo, la verificación de firma HMAC requiere los bytes exactos del *payload* original. La re-serialización del cuerpo deserializado altera potencialmente el orden de las claves y el formato de espacios, invalidando la firma. La resolución consistió en implementar `rawBodyMiddleware`, que intercepta la petición antes de la deserialización y preserva el cuerpo crudo como un `Buffer` adjunto al objeto de la solicitud. Este problema consumió un tiempo considerable de depuración antes de identificar la causa raíz.

**Conversión NUMERIC a string en PostgreSQL.** PostgreSQL retorna los valores de tipo `NUMERIC` como cadenas de texto (`string`) para preservar la precisión decimal. Este comportamiento no es inmediatamente evidente y generó errores sutiles en los primeros repositorios implementados, donde se asumía que los valores numéricos llegarían como tipo `number`. Se resolvió estandarizando la conversión `parseFloat()` en los mapeadores de todos los repositorios que manejan campos monetarios, y se documentó este patrón como convención del proyecto.

**Control de Concurrencia Optimista (OCC) en edición de productos.** Durante las pruebas del CMS, se detectaron escenarios donde la edición de un producto no incrementaba correctamente el campo `version`, permitiendo que dos administradores sobrescribieran cambios mutuamente. Se resolvió añadiendo una cláusula `WHERE version = :expectedVersion` en la consulta `UPDATE` del repositorio y validando que la cantidad de filas afectadas fuera exactamente 1. Si la cantidad es 0, se lanza un error de conflicto de versión.

**Configuración de CORS para WebSocket.** Se experimentaron bloqueos de conexión WebSocket desde el frontend en entorno de desarrollo debido a que la configuración de CORS de Fastify no aplicaba automáticamente al *upgrade* del protocolo HTTP a WebSocket. Se resolvió configurando los encabezados de CORS explícitamente en el *hook* de *upgrade* del plugin `@fastify/websocket`.

**Crecimiento del Composition Root.** Conforme el proyecto creció de la Fase 11 a la Fase 35, el archivo `main.ts` experimentó un crecimiento que dificultó su mantenimiento. Se identificó la necesidad futura de modularizar el *Composition Root* en archivos separados por dominio funcional (por ejemplo, `composeAuth.ts`, `composeCheckout.ts`, `composeCMS.ts`), aunque esta refactorización no se ejecutó en la fase actual.

### 4.7.3. Curvas de aprendizaje significativas

Se identificaron las siguientes curvas de aprendizaje durante el proceso de desarrollo:

- **Patrón Saga y transacciones compensatorias.** La implementación del patrón Saga en el `ProcessCheckoutUseCase` requirió un entendimiento profundo de la diferencia entre fallos de regla de negocio (que ameritan cancelación definitiva) y fallos de infraestructura (que ameritan reintento vía DLQ). La distinción entre ambos tipos de excepción en el bloque `catch` del flujo post-commit representó un aprendizaje significativo en diseño de sistemas tolerantes a fallos.

- **Seguridad de webhooks y firmas HMAC.** La comprensión del flujo completo de verificación criptográfica de webhooks (incluyendo la importancia de preservar el cuerpo crudo, la comparación en tiempo constante para prevenir ataques de temporización, y la gestión de secretos en variables de entorno) constituyó un aprendizaje de alto valor en seguridad aplicada.

- **Diseño de APIs M2M.** La comunicación máquina a máquina entre el E-commerce y el Game Bridge requirió un cambio de paradigma respecto al diseño de APIs convencionales orientadas al usuario. El caso de uso `ValidateRewardM2MUseCase` retorna DTOs con estados codificados en lugar de lanzar excepciones HTTP, dado que el consumidor es otro sistema que necesita un contrato de respuesta predecible.

## 4.8. APORTACIÓN DEL PROYECTO

### 4.8.1. Valor técnico de la arquitectura propuesta

La plataforma Animayuks constituye una arquitectura de referencia replicable para pequeñas y medianas empresas que buscan integrar mecánicas de gamificación en sus ecosistemas de comercio electrónico. La documentación exhaustiva del proyecto, materializada en el documento de especificación de requisitos de software (SRS), las auditorías arquitectónicas por fases y los capítulos precedentes de este documento de titulación, conforman una base de conocimiento transferible.

La demostración práctica de que Clean Architecture y los principios SOLID pueden aplicarse exitosamente en un proyecto de esta escala sin depender de frameworks pesados de IoC ni ORMs acoplantes valida la viabilidad del enfoque para equipos de desarrollo de tamaño reducido. La separación de responsabilidades lograda permite que futuros desarrolladores incorporen nuevos módulos (nuevas pasarelas de pago, nuevos subsistemas de gamificación, nuevas integraciones con videojuegos) sin riesgo de regresión en los flujos existentes.

### 4.8.2. Valor comercial para la marca Animayuks

Desde la perspectiva comercial, la plataforma entrega a la marca Animayuks un sistema diferenciado de sus competidores directos en el mercado de *merchandising* artístico. El Game Bridge establece un vínculo tangible entre la compra física de productos y la experiencia digital del videojuego, incentivando la recurrencia de compra mediante recompensas virtuales exclusivas. El monedero virtual con saldo renovable a 12 meses fomenta la retención del cliente dentro del ecosistema.

El panel administrativo CMS permite que el equipo de la marca gestione de manera autónoma su catálogo, inventario, pedidos, cupones, banners promocionales y documentos legales sin requerir intervención técnica constante. La bitácora de auditoría inmutable proporciona trazabilidad total de las operaciones administrativas para efectos de control interno y cumplimiento regulatorio.

### 4.8.3. Contribución académica

El presente proyecto de titulación demuestra la aplicación práctica de conceptos teóricos de ingeniería de software (Teorema CAP, patrones de integración empresarial, algoritmos criptográficos HMAC, estándares RFC 4122) en un sistema funcional de escala real. La arquitectura Game Bridge, en particular, representa una propuesta original de integración entre dominios tradicionalmente separados (comercio electrónico y videojuegos) que puede servir como referencia para investigaciones futuras en el campo de la gamificación aplicada a plataformas transaccionales.
