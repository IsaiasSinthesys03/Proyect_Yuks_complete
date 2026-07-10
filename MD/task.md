# 🗺️ Ruta de Ejecución Backend — Fases 12-19
# Motor Transaccional, Monedero, Cupones, Recompensas y Perfil Autenticado

**Fuentes de verdad:**
- `MD/SRS_v10.1.md` (v10.1)
- `implementation_plan.md` (Diccionario de Datos y Contrato API)
- `Resolucion_Casos_Limite_v1.md` (Reglas Edge Case)
- `MD/Auditoria_Backend_Fase11.md` (Brechas identificadas)

**Nota:** Cada sub-tarea incluye entre paréntesis la referencia SRS/Edge Case que la gobierna.

---

## Fase 12 — Infraestructura DB: Migraciones Transaccionales ✅ COMPLETADA

> Crear las migraciones Kysely que establezcan todas las tablas del motor transaccional,
> monedero, cupones y recompensas. Registrarlas en `migrate.ts`.
>
> **NOTA:** Se reordenó la numeración original para respetar dependencias FK:
> Coupons (004) se creó ANTES de Orders (005) porque `orders.coupon_id` → FK `coupons.id`.

### 12.1 — Migración `003_addresses_schema.ts`
- [x] Crear tabla `addresses` con columnas: `id` (UUID PK auto), `user_id` (UUID FK → users NOT NULL), `label` (VARCHAR 100, ej. "Casa", "Oficina"), `street` (VARCHAR 255 NOT NULL), `exterior_number` (VARCHAR 20 NOT NULL), `interior_number` (VARCHAR 20 NULLABLE), `neighborhood` (VARCHAR 100 NOT NULL), `postal_code` (VARCHAR 10 NOT NULL), `municipality` (VARCHAR 100 NOT NULL — valor de Select, no texto libre, REQ-FE-09), `state` (VARCHAR 100 NOT NULL — valor de Select, REQ-FE-09), `country` (VARCHAR 50 NOT NULL DEFAULT 'México'), `references` (TEXT NULLABLE — referencias del domicilio REQ-FE-09), `is_default` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP), `updated_at` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)
- [x] FK `user_id` con `ON DELETE CASCADE`
- [x] Índice `idx_addresses_user_id` sobre `user_id` para consultas rápidas por usuario

### 12.2 — Migración `004_coupons_schema.ts` (reordenada: antes de orders por FK)
- [x] Crear tabla `coupons` con columnas: `id` (UUID PK auto), `code` (VARCHAR 50 UNIQUE NOT NULL — ej. 'VERANO26', CMS-FE-15), `discount_type` (VARCHAR 20 NOT NULL — 'PERCENTAGE' o 'FIXED_AMOUNT'), `discount_value` (NUMERIC 10,2 NOT NULL — porcentaje o monto fijo en MXN), `max_uses` (INTEGER NOT NULL — límite global de usos), `current_uses` (INTEGER NOT NULL DEFAULT 0), `expires_at` (TIMESTAMPTZ NOT NULL), `is_active` (BOOLEAN NOT NULL DEFAULT true — toggle On/Off sin destruir registro, CMS-FE-15), `min_purchase_amount` (NUMERIC 10,2 NULLABLE — monto mínimo de carrito para aplicar), `created_at` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)
- [x] Constraint CHECK: `discount_value > 0`
- [x] Constraint CHECK: `max_uses > 0`
- [x] Constraint CHECK: `current_uses >= 0 AND current_uses <= max_uses`
- [x] Índice UNIQUE sobre `UPPER(code)` para búsqueda case-insensitive de códigos

### 12.3 — Migración `005_orders_schema.ts` (orders + order_items)
- [x] Crear tabla `orders` con todas las columnas del plan (status pipeline 8 estados, idempotency_key UNIQUE, campos Última Milla, compliance audit trail)
- [x] FK `user_id` con `ON DELETE RESTRICT` (no borrar usuarios con pedidos)
- [x] Índice `idx_orders_user_id` sobre `user_id`
- [x] Índice `idx_orders_status` sobre `status` para filtros del Kanban CMS
- [x] Constraint CHECK: `total_paid >= 0`, `subtotal >= 0`, `discount_amount >= 0`, `shipping_cost >= 0`, `wallet_deduction >= 0`
- [x] Crear tabla `order_items` con snapshots congelados (product_name, variant_sku, unit_price)
- [x] Constraint CHECK: `quantity > 0`
- [x] Constraint CHECK: `unit_price >= 0`

### 12.4 — Migración `006_wallet_schema.ts` (wallet + wallet_transactions)
- [x] Crear tabla `wallet` con columnas: `id`, `user_id` (UNIQUE FK), `balance` (DEFAULT 0), `expires_at`
- [x] Constraint CHECK: `balance >= 0` — (Q8: estrictamente prohibido saldo negativo)
- [x] Crear tabla `wallet_transactions` con ledger completo incluyendo `original_expires_at` (Resolución #5 Anti-fraude)
- [x] FK `wallet_id` con `ON DELETE CASCADE`
- [x] Constraint CHECK: `amount > 0` (signo lo define `type`)
- [x] Índice `idx_wallet_transactions_wallet_id` sobre `wallet_id`

### 12.5 — Migración `007_rewards_schema.ts`
- [x] Crear tabla `reward_codes` con `order_item_id` FK (Resolución #7: generación 1 a 1), `code` UUID auto-gen UNIQUE (Resolución #6: NO caduca), status AVAILABLE/CLAIMED/REVOKED
- [x] Índice `idx_reward_codes_order_id` sobre `order_id`
- [x] Índice `idx_reward_codes_code` sobre `code` para búsqueda rápida M2M

### 12.6 — Actualizar `db-types.ts` (Kysely Type Definitions)
- [x] Agregar `AddressTable` al interface `Database` con tipos Kysely (`Generated<string>` para id, etc.)
- [x] Agregar `OrderTable` al interface `Database`
- [x] Agregar `OrderItemTable` al interface `Database`
- [x] Agregar `WalletTable` al interface `Database`
- [x] Agregar `WalletTransactionTable` al interface `Database`
- [x] Agregar `RewardCodeTable` al interface `Database`
- [x] Agregar `CouponTable` al interface `Database`
- [x] Exportar tipos `Selectable`, `Insertable`, `Updateable` para cada tabla nueva

### 12.7 — Registrar migraciones en `migrate.ts`
- [x] Importar `003_addresses_schema`, `004_coupons_schema`, `005_orders_schema`, `006_wallet_schema`, `007_rewards_schema` con `require()`
- [x] Agregar las 5 nuevas migraciones al objeto del provider en el Migrator
- [x] Ejecutar `npm run migrate` y verificar que las tablas se crean correctamente — ✅ 5/5 aplicadas

---

## Fase 13 — Dominio: Core Transaccional (Entidades, DTOs, Errores, Contratos) ✅ COMPLETADA

> Capa pura sin dependencias de infraestructura. Definir las reglas de negocio inmutables.
> **Verificación:** `npx tsc --noEmit` → 0 errores. Cero imports de Kysely/Redis/Stripe/Fastify.

### 13.1 — Entidades de Dominio

- [x] **`domain/entities/Address.ts`**: Interfaz `Address` — id, userId, label, street, exteriorNumber, interiorNumber, neighborhood, postalCode, municipality, state, country, references, isDefault, createdAt, updatedAt
- [x] **`domain/entities/Order.ts`**: Interfaz `Order` + types `OrderStatus` (8 estados) + `DeliveryType`
- [x] **`domain/entities/OrderItem.ts`**: Interfaz `OrderItem` — con snapshots congelados (productName, variantSku, unitPrice)
- [x] **`domain/entities/Wallet.ts`**: Interfaz `Wallet` — id, userId, balance, expiresAt, createdAt, updatedAt
- [x] **`domain/entities/WalletTransaction.ts`**: Interfaz `WalletTransaction` + types `WalletTransactionType` + `WalletTransactionSource` + campo `originalExpiresAt` (Resolución #5)
- [x] **`domain/entities/RewardCode.ts`**: Interfaz `RewardCode` + type `RewardCodeStatus` (AVAILABLE/CLAIMED/REVOKED)
- [x] **`domain/entities/Coupon.ts`**: Interfaz `Coupon` + type `CouponDiscountType` (PERCENTAGE/FIXED_AMOUNT)

### 13.2 — DTOs Transaccionales

- [x] **`domain/types/CheckoutDTOs.ts`**: `CheckoutRequestDTO` + `CheckoutResponseDTO`
- [x] **`domain/types/OrderDTOs.ts`**: `OrderSummaryDTO` + `OrderDetailDTO` + `CancelOrderRequestDTO`
- [x] **`domain/types/WalletDTOs.ts`**: `WalletSummaryDTO` + `WalletLedgerDTO` (reutiliza PaginatedResponseDTO)
- [x] **`domain/types/CouponDTOs.ts`**: `RedeemCouponRequestDTO` + `RedeemCouponResponseDTO`
- [x] **`domain/types/AddressDTOs.ts`**: `CreateAddressDTO` + `UpdateAddressDTO` (Partial)
- [x] **`domain/types/ProfileDTOs.ts`**: `ProfileResponseDTO` (user + profile + wallet)
- [x] **`domain/types/RewardDTOs.ts`**: `RewardCodeDTO` + `ValidateRewardRequestDTO` + `ValidateRewardResponseDTO`

### 13.3 — Errores de Dominio Transaccionales

- [x] **`domain/errors/CheckoutErrors.ts`**: `IdempotencyConflictError`, `StockLockFailedError`, `OutOfStockError`, `MinPurchaseNotMetError`, `PaymentFailedError`, `StockExpiredAfter3DSecureError`, `AddressNotFoundError`
- [x] **`domain/errors/WalletErrors.ts`**: `InsufficientFundsError`, `WalletExpiredError`
- [x] **`domain/errors/CouponErrors.ts`**: `CouponNotFoundError`, `CouponExpiredError`, `CouponExhaustedError`, `CouponInactiveError`, `CouponMinNotMetError`
- [x] **`domain/errors/OrderErrors.ts`**: `OrderNotFoundError`, `OrderNotCancellableError`, `RewardAlreadyClaimedError`
- [x] **`domain/errors/RewardErrors.ts`**: `RewardCodeNotFoundError`, `RewardCodeAlreadyClaimedError`, `RewardRevokedError`

### 13.4 — Contratos de Repositorios (Ports)

- [x] **`application/interfaces/IOrderRepository.ts`**: `createOrder`, `findById`, `findByUserId`, `findDetailById`, `updateStatus`, `findByIdempotencyKey`
- [x] **`application/interfaces/IAddressRepository.ts`**: `findByUserId`, `findById`, `create`, `update`, `delete`, `setDefault`
- [x] **`application/interfaces/IWalletRepository.ts`**: `findByUserId`, `getOrCreate`, `debit`, `credit` (con `originalExpiresAt`), `getTransactions`
- [x] **`application/interfaces/ICouponRepository.ts`**: `findByCode`, `incrementUsage`
- [x] **`application/interfaces/IRewardCodeRepository.ts`**: `createBatch`, `findByOrderId`, `findByUserId`, `findByCode`, `markAsClaimed`, `markAsRevoked`

### 13.5 — Contratos de Servicios Externos (Ports de Infraestructura)

- [x] **`application/interfaces/IPaymentGateway.ts`**: `createPaymentIntent`, `refund`, `verifyWebhookSignature`
- [x] **`application/interfaces/ILockService.ts`**: `acquireLock`, `releaseLock`
- [x] **`application/interfaces/IIdempotencyService.ts`**: `check`, `set`
- [x] **`application/interfaces/IGameApiClient.ts`**: `checkRewardStatus`


---

## Fase 14 — Infraestructura: Adaptadores de Salida (Redis + Stripe Skeleton)

> Implementar los servicios concretos que satisfacen los contratos definidos en Fase 13.

### 14.1 — RedisLockService

- [x] Crear `infrastructure/cache/RedisLockService.ts` que implemente `ILockService`
- [x] `acquireLock(key, ttlSeconds)`: Usar comando Redis `SET key "locked" NX EX ttlSeconds`. Retorna `true` si el SET tuvo éxito (lock adquirido), `false` si la key ya existía (otro proceso la tiene)
- [x] `releaseLock(key)`: Usar `DEL key`. Solo liberar si el valor coincide (para evitar liberar locks de otros procesos, usar Lua script o valor único con UUID)
- [x] Inyectar `redisConnection` del singleton existente en `cache/redis-client.ts`
- [x] Key pattern para stock lock: `stock-lock:${variantId}` con TTL 600s (10 min, REQ-BE-01)

### 14.2 — RedisIdempotencyService

- [x] Crear `infrastructure/cache/RedisIdempotencyService.ts` que implemente `IIdempotencyService`
- [x] `check(key)`: Usar `GET idempotency:${key}`, retorna `true` si existe
- [x] `set(key, ttlSeconds)`: Usar `SET idempotency:${key} "1" EX ttlSeconds` (Q2: TTL 86400 = 24h)
- [x] Inyectar `redisConnection` del singleton existente

### 14.3 — StripeAdapter (Esqueleto)

- [x] Crear `infrastructure/services/payment/StripeAdapter.ts` que implemente `IPaymentGateway`
- [x] `createPaymentIntent(amount, currency, metadata)`: Llamar a `stripe.paymentIntents.create({ amount: amount * 100, currency, metadata })`. Retornar `{ clientSecret, paymentIntentId }`
- [x] `refund(paymentIntentId, amount?)`: Llamar a `stripe.refunds.create({ payment_intent: paymentIntentId, amount: amount ? amount * 100 : undefined })`
- [x] `verifyWebhookSignature(payload, signature)`: Llamar a `stripe.webhooks.constructEvent(payload, signature, webhookSecret)` (REQ-BE-02: validación HMAC)
- [x] Agregar `stripe` al `package.json` como dependencia: `npm install stripe`
- [x] Leer `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` desde `.env`
- [x] Agregar las variables al `.env.example`

### 14.4 — GameApiClient (Esqueleto)

- [x] Crear `infrastructure/services/game_api/GameApiClient.ts` que implemente `IGameApiClient`
- [x] `checkRewardStatus(code)`: HTTP GET al backend del juego con header `Authorization: Bearer ${M2M_TOKEN}`. Retornar status del código.
- [x] Si el servidor del juego no responde o no está configurado, retornar `'NOT_FOUND'` como fallback seguro (permite cancelación)
- [x] Leer `GAME_API_BASE_URL` y `GAME_API_M2M_TOKEN` desde `.env`

---

## Fase 15 — Casos de Uso: Perfil Autenticado, Direcciones y Cupones ✅ COMPLETADA

> Lógica de aplicación pura para los módulos de perfil de usuario.

### 15.1 — Use Cases de Perfil

- [x] **`GetProfileUseCase.ts`**: Recibe `userId`. Obtiene User + Profile + Wallet (via `IWalletRepository.getOrCreate`). Retorna `ProfileResponseDTO` con saldo, caducidad y tier level. (REQ-FE-14, REQ-FE-15)
- [x] **`UpdateProfileUseCase.ts`**: Recibe `userId` + datos parciales. Si cambia `email` o `phone`, lanzar error indicando que se requiere OTP (REQ-FE-16 — el flujo OTP completo se implementará en fases posteriores). Si solo cambia nombre/apellido, actualizar directamente.

### 15.2 — Use Cases de Direcciones

- [x] **`ListAddressesUseCase.ts`**: Recibe `userId`. Delega a `IAddressRepository.findByUserId()`. (REQ-FE-17)
- [x] **`CreateAddressUseCase.ts`**: Recibe `userId` + `CreateAddressDTO`. Valida que `municipality` y `state` no sean strings vacíos (provienen de Selects, REQ-FE-09). Si es la primera dirección del usuario, marcarla como `isDefault = true` automáticamente. Delega a `IAddressRepository.create()`. (REQ-FE-09, REQ-FE-17)
- [x] **`UpdateAddressUseCase.ts`**: Recibe `addressId`, `userId`, `UpdateAddressDTO`. Verifica que la dirección pertenece al usuario. Delega a `IAddressRepository.update()`. (REQ-FE-17)
- [x] **`DeleteAddressUseCase.ts`**: Recibe `addressId`, `userId`. Verifica que la dirección pertenece al usuario. Si la dirección era `isDefault`, promover otra dirección como default si existe. Delega a `IAddressRepository.delete()`. (REQ-FE-17)
- [x] **`SetDefaultAddressUseCase.ts`**: Recibe `addressId`, `userId`. Desmarca la anterior default en transacción. Marca la nueva. (REQ-FE-17)

### 15.3 — Use Cases de Cupones (Canje por Cliente)

- [x] **`RedeemCouponUseCase.ts`**: Recibe `RedeemCouponRequestDTO { code, cartSubtotal }`. Lógica:
  1. Buscar cupón por código case-insensitive (`IICouponRepository.findByCode`)
  2. Si no existe → lanzar `CouponNotFoundError`
  3. Si `isActive === false` → lanzar `CouponInactiveError`
  4. Si `expiresAt < NOW()` → lanzar `CouponExpiredError`
  5. Si `currentUses >= maxUses` → lanzar `CouponExhaustedError`
  6. Si `minPurchaseAmount` existe y `cartSubtotal < minPurchaseAmount` → lanzar `CouponMinNotMetError`
  7. Calcular `finalDiscount`: Si `PERCENTAGE` → `cartSubtotal * (discountValue / 100)`, Si `FIXED_AMOUNT` → `min(discountValue, cartSubtotal)` (no puede exceder el subtotal)
  8. Retornar `RedeemCouponResponseDTO` con el descuento calculado (NO incrementar usos aquí, se incrementará en el Checkout al confirmar)

### 15.4 — Use Cases de Monedero (Lectura)

- [x] **`GetWalletUseCase.ts`**: Recibe `userId`. Obtiene o crea wallet (`getOrCreate`). Retorna `WalletSummaryDTO { balance, expiresAt }`. Verifica si `expiresAt < NOW()` y en ese caso retorna balance como 0 (saldo expirado). (REQ-FE-20)
- [x] **`GetWalletLedgerUseCase.ts`**: Recibe `userId`, `page`, `limit`. Obtiene wallet, luego obtiene transacciones paginadas. Retorna `WalletLedgerDTO`. (REQ-FE-20)

### 15.5 — Use Cases de Recompensas (Lectura)

- [x] **`GetUserRewardsUseCase.ts`**: Recibe `userId`. Obtiene todos los reward codes del usuario (JOIN con orders). Retorna array de `RewardCodeDTO` con status visual: 🟢 'AVAILABLE' o ⚪ 'CLAIMED'. (REQ-FE-22)

---

## Fase 16 — Casos de Uso: Motor de Checkout

> El flujo transaccional más crítico del sistema. DEBE respetar TODAS las resoluciones.

### 16.1 — `ProcessCheckoutUseCase.ts`

- [x] **Constructor**: Inyectar `IOrderRepository`, `IProductRepository` (existente), `IWalletRepository`, `ICouponRepository`, `IRewardCodeRepository`, `IAddressRepository`, `IPaymentGateway`, `ILockService`, `IIdempotencyService`

- [x] **Paso 1 — Idempotencia** (Q2):
  - Recibir `idempotencyKey` del header `X-Idempotency-Key`
  - Llamar `IIdempotencyService.check(idempotencyKey)`
  - Si retorna `true` → lanzar `IdempotencyConflictError` (el pago ya fue procesado o está en proceso)
  - Si retorna `false` → llamar `IIdempotencyService.set(idempotencyKey, 86400)` para reservar la key por 24h
  - TAMBIÉN verificar en BD: `IOrderRepository.findByIdempotencyKey(idempotencyKey)` — si existe una orden, retornarla directamente (respuesta idempotente)

- [x] **Paso 2 — Validar dirección**:
  - Llamar `IAddressRepository.findById(addressId, userId)`
  - Si no existe → lanzar error `AddressNotFoundError`
  - Extraer `municipality`, `state`, `postalCode` para snapshot en la orden

- [x] **Paso 3 — Bloqueo pesimista de stock** (REQ-BE-01):
  - Para cada item en `items[]`, llamar `ILockService.acquireLock(`stock-lock:${variantId}`, 600)` (10 min)
  - Si algún lock falla → liberar los locks ya adquiridos y lanzar `StockLockFailedError`
  - Mantener lista de locks adquiridos para liberarlos al final (success o fail)

- [x] **Paso 4 — Verificar stock y calcular subtotal**:
  - Para cada item, obtener la variante de la BD y verificar `variant.stock >= item.quantity`
  - Si stock insuficiente → liberar locks y lanzar `OutOfStockError`
  - Calcular `subtotal = Σ(variant.price * item.quantity)` usando precios de la BD (NO confiar en precios del frontend)
  - Congelar `productName`, `variantSku`, `unitPrice` para los snapshots de `order_items`

- [x] **Paso 5 — Aplicar cupón** (Resolución #2: fórmula):
  - Si `couponCode` proporcionado → validar con lógica idéntica a `RedeemCouponUseCase`
  - Calcular `discountAmount` según el tipo (% o fijo)
  - `subtotalAfterDiscount = subtotal - discountAmount`

- [x] **Paso 6 — Calcular envío** (REQ-BE-07):
  - Determinar `deliveryType`: comparar `state` y `municipality` del usuario contra config del sistema (Estado Base + Municipios Cercanos). Match exacto de Strings de Selects → 'LOCAL', no match → 'EXTERNAL_COURIER'
  - `shippingCost`: Si `subtotalAfterDiscount >= umbralEnvíoGratis` → $0 (Nota: el umbral puede ser dinámico por Tier del usuario, REQ-BE-07). Si no, aplicar costo local o foráneo según `deliveryType`
  - `totalBeforeWallet = subtotalAfterDiscount + shippingCost`

- [x] **Paso 7 — Validar mínimo de compra** (Resolución #3):
  - Si `totalBeforeWallet < minPurchaseAmount` (configurado en sistema) → lanzar `MinPurchaseNotMetError`
  - IMPORTANTE: Evaluar DESPUÉS del cupón pero ANTES de aplicar monedero

- [x] **Paso 8 — Aplicar monedero** (Resolución #2):
  - Si `walletAmount > 0`: verificar que wallet tiene saldo suficiente y no ha expirado
  - `walletDeduction = min(walletAmount, totalBeforeWallet)` (no puede pagar más de lo que cuesta)
  - `totalPaid = totalBeforeWallet - walletDeduction` (esto es lo que se cobra a la pasarela)

- [x] **Paso 9 — Cobrar pasarela de pago**:
  - Si `totalPaid > 0` → llamar `IPaymentGateway.createPaymentIntent(totalPaid, 'mxn', { orderId, userId })`
  - Si `totalPaid === 0` (todo pagado con monedero) → skip pasarela, marcar como `PAID` directo

- [x] **Paso 10 — Commit SQL (Compensación Saga Múltiples Repos)** (REQ-BE-01):
  - *DEUDA TÉCNICA (UoW): Al no existir un Unit-of-Work unificado que abarque IOrderRepository, IProductRepository, ICouponRepository y IWalletRepository, las operaciones de mutación post-orden se ejecutan secuencialmente tras el commit de la orden. Si una falla, se debe aplicar un rollback lógico (Saga Pattern: marcar la orden como CANCELLED/NEEDS_RECONCILIATION).*
  - `IOrderRepository.createOrder` atómico para order+order_items.
  - Actualizaciones secuenciales: decrementStock (atómico en BD), incrementUsage, debit. 

- [x] **Paso 11 — Limpieza post-commit**:
  - Liberar TODOS los stock locks de Redis (`ILockService.releaseLock`)
  - Si `status === 'PAID'` (pago total con monedero) → encolar notificación de confirmación en BullMQ
  - Retornar `CheckoutResponseDTO { orderId, status, totalPaid, stripeClientSecret? }`

- [x] **Manejo de fallos DLQ** (Q4):
  - Implementado mediante Sagas lógicas documentadas (ver Paso 10).

---

## Fase 17 — Casos de Uso: Post-Transacción, Cancelaciones y Game Bridge M2M ✅ COMPLETADA

> Procesamiento de webhooks, lógica de anulación y validación inter-sistemas.

### 17.1 — WebhookPaymentReconciliationUseCase

- [x] **`ProcessPaymentWebhookUseCase.ts`**: Recibe raw payload + Stripe signature
  - Paso 1: Verificar firma HMAC con `IPaymentGateway.verifyWebhookSignature()` (REQ-BE-02). Si inválida → HTTP 400
  - Paso 2: Extraer `paymentIntentId` y `event.type` del payload
  - Paso 3: Si `payment_intent.succeeded`:
    - Buscar orden por `stripePaymentIntentId`
    - Si `order.status !== 'PAYMENT_PENDING'` → ignorar (idempotente)
    - Verificar stock ACTUAL de cada item del pedido (Resolución #1: 3D Secure tardío)
    - Si algún item tiene `stock === 0` → ejecutar `IPaymentGateway.refund(paymentIntentId)` completo + enviar email "Tu pago fue aprobado pero el artículo se agotó" + marcar orden como `CANCELLED`
    - Si stock OK → actualizar orden a `PAID`, encolar notificación BullMQ `send-notification` con tipo 'order-confirmed'
  - Paso 4: Si `payment_intent.payment_failed`:
    - Liberar stock locks si aún existen
    - Revertir wallet deduction si se aplicó (credit con source 'CANCELLATION')
    - Marcar orden como `CANCELLED`

### 17.2 — CancelOrderUseCase

- [x] **`CancelOrderUseCase.ts`**: Recibe `orderId`, `userId`
  - Paso 1: Buscar orden `IOrderRepository.findById(orderId, userId)`. Si no existe → `OrderNotFoundError`
  - Paso 2: Verificar `order.status === 'PAID'`. Si no → `OrderNotCancellableError` (REQ-FE-23: solo cancela en status "Pago Confirmado". En PREPARING o después, el botón desaparece)
  - Paso 3: **Anti-fraude de recompensas** (Resolución #6):
    - Obtener `rewardCodes` de la orden via `IRewardCodeRepository.findByOrderId(orderId)`
    - Para cada código con status `AVAILABLE`:
      - Consultar `IGameApiClient.checkRewardStatus(code.code)`
      - Si el juego reporta `'CLAIMED'` → lanzar `RewardAlreadyClaimedError` (bloquear cancelación: "No puedes cancelar porque ya reclamaste la recompensa virtual")
      - Si `'AVAILABLE'` o `'NOT_FOUND'` → marcar como `REVOKED` en SQL (`IRewardCodeRepository.markAsRevoked`)
  - Paso 4: **Reembolso a monedero** (dentro de `db.transaction()`):
    - Restaurar stock: `UPDATE product_variants SET stock = stock + qty` para cada item
    - Si hubo `walletDeduction > 0`:
      - Obtener la wallet_transaction original del pedido (WITHDRAWAL con source 'PURCHASE')
      - Creditear monedero con `IWalletRepository.credit(walletId, walletDeduction, orderId, 'CANCELLATION', originalExpiresAt)` — **Resolución #5: heredar la fecha de caducidad original**, NO renovar a 12 meses
    - Si hubo pago a pasarela (`totalPaid > 0`):
      - Creditear monedero por el monto restante: `IWalletRepository.credit(walletId, totalPaid, orderId, 'REFUND')` — este SÍ renueva caducidad a NOW() + 12 meses (Resolución #4: el reembolso a monedero es un ingreso nuevo, dinero de pasarela ≠ dinero de monedero reciclado)
    - Actualizar orden a `status: 'CANCELLED'`

### 17.3 — ValidateGameRewardUseCase (M2M)

- [x] **`ValidateGameRewardUseCase.ts`**: Recibe `code` (UUID string)
  - Paso 1: Buscar en SQL `IRewardCodeRepository.findByCode(code)`
  - Paso 2: Si no existe → lanzar `RewardCodeNotFoundError`
  - Paso 3: Si `status === 'CLAIMED'` → retornar `{ valid: false, reason: 'ALREADY_CLAIMED' }`
  - Paso 4: Si `status === 'REVOKED'` → retornar `{ valid: false, reason: 'REVOKED' }`
  - Paso 5: Si `status === 'AVAILABLE'` → marcar como `CLAIMED` via `IRewardCodeRepository.markAsClaimed(codeId)`. Retornar `{ valid: true, rewardData: { productName, sku } }`

---

## Fase 18 — Adaptadores HTTP: Controladores, Rutas y Middlewares ✅ COMPLETADA

> Capa de entrada. Traduce HTTP ↔ Use Cases ↔ Respuestas HTTP.

### 18.1 — Controladores

- [x] **`ProfileController.ts`**: Métodos `getProfile`, `updateProfile` que invocan los use cases de Fase 15.1. Extraer `userId` de `request.user.sub` (del JWT). Mapear errores → HTTP.
- [x] **`AddressController.ts`**: Métodos `list`, `create`, `update`, `delete`, `setDefault` que invocan use cases de Fase 15.2. Extraer `userId` de JWT.
- [x] **`WalletController.ts`**: Métodos `getSummary`, `getLedger` que invocan use cases de Fase 15.4.
- [x] **`RewardController.ts`**: Método `getUserRewards` (Fase 15.5) y `validateReward` (Fase 17.3 — protegido por M2M auth, NO por JWT de usuario).
- [x] **`CouponController.ts`**: Método `redeem` que invoca `RedeemCouponUseCase` (Fase 15.3). Extraer `userId` de JWT.
- [x] **`CheckoutController.ts`**: Método `processCheckout` que invoca `ProcessCheckoutUseCase` (Fase 16). Extraer `idempotencyKey` del header `X-Idempotency-Key`. Extraer `clientIp` de `request.ip`. Enviar `termsVersion` del body.
- [x] **`WebhookController.ts`**: Método `handleStripeWebhook` que invoca `ProcessPaymentWebhookUseCase` (Fase 17.1). NO protegido por JWT (Stripe envía sin autenticación de usuario). Validación por firma HMAC.
- [x] **`OrderController.ts`**: Métodos `listOrders`, `getOrderDetail`, `cancelOrder` que invocan use cases de Fase 17.2 y lectura de Fase 15 (Claude añadió Use Cases faltantes aquí).

### 18.2 — Middlewares

- [x] **`authMiddleware.ts` (existente)** — Ya funciona para JWT de usuario. Verificar que se usa consistentemente.
- [x] **`m2mAuthMiddleware.ts` (NUEVO)**: Para proteger `/api/game/rewards/validate`. Valida header `Authorization: Bearer <M2M_STATIC_TOKEN>` contra variable de entorno `GAME_M2M_SECRET`. Si no coincide → HTTP 401. (Q11: autenticación Máquina a Máquina)
- [x] **`rawBodyMiddleware.ts` (NUEVO)**: Para el endpoint de webhooks Stripe. Fastify necesita el body raw (Buffer) para verificar la firma HMAC. Configurar `addContentTypeParser` para `application/json` que preserve el raw body en `request.rawBody`.

### 18.3 — Rutas

- [x] **`profileRoutes.ts` (NUEVO)**: Registrar bajo prefijo `/api/profile`. TODAS las rutas protegidas por `authMiddleware` (preHandler hook).
  - `GET /` → `ProfileController.getProfile`
  - `PUT /` → `ProfileController.updateProfile`
- [x] **`addressRoutes.ts` (NUEVO)**: Registrar bajo prefijo `/api/profile/addresses`. Protegidas por `authMiddleware`.
  - `GET /` → `AddressController.list`
  - `POST /` → `AddressController.create`
  - `PUT /:id` → `AddressController.update`
  - `DELETE /:id` → `AddressController.delete`
  - `PATCH /:id/default` → `AddressController.setDefault`
- [x] **`walletRoutes.ts` (NUEVO)**: Registrar bajo prefijo `/api/profile/wallet`. Protegidas por `authMiddleware`.
  - `GET /` → `WalletController.getSummary`
  - `GET /transactions` → `WalletController.getLedger`
- [x] **`rewardRoutes.ts` (NUEVO)**: Dos sub-prefijos:
  - `/api/profile/rewards` (protegido por `authMiddleware`) → `GET /` → `RewardController.getUserRewards`
  - `/api/game/rewards` (protegido por `m2mAuthMiddleware`) → `POST /validate` → `RewardController.validateReward`
- [x] **`couponRoutes.ts` (NUEVO)**: Registrar bajo prefijo `/api/profile/coupons`. Protegidas por `authMiddleware`.
  - `POST /redeem` → `CouponController.redeem`
- [x] **`checkoutRoutes.ts` (NUEVO)**: Registrar bajo prefijo `/api`.
  - `POST /checkout` → `CheckoutController.processCheckout` (protegido por `authMiddleware`)
- [x] **`webhookRoutes.ts` (NUEVO)**: Registrar bajo prefijo `/api/webhooks`. SIN authMiddleware (Stripe no envía JWT).
  - `POST /stripe` → `WebhookController.handleStripeWebhook` (usa `rawBodyMiddleware` + validación HMAC interna)
- [x] **`orderRoutes.ts` (NUEVO)**: Registrar bajo prefijo `/api/profile/orders`. Protegidas por `authMiddleware`.
  - `GET /` → `OrderController.listOrders`
  - `GET /:id` → `OrderController.getOrderDetail`
  - `POST /:id/cancel` → `OrderController.cancelOrder`

---

## Fase 19 — Composition Root: Ensamblaje en `main.ts` ✅ COMPLETADA

> Inyectar todas las dependencias nuevas en el grafo de composición.

### 19.1 — Instanciar Repositorios Nuevos

- [x] Instanciar `AddressRepository` (implementación concreta de `IAddressRepository`)
- [x] Instanciar `OrderRepository` (implementación concreta de `IOrderRepository`)
- [x] Instanciar `WalletRepository` (implementación concreta de `IWalletRepository`)
- [x] Instanciar `CouponRepository` (implementación concreta de `ICouponRepository`)
- [x] Instanciar `RewardCodeRepository` (implementación concreta de `IRewardCodeRepository`)

### 19.2 — Instanciar Servicios de Infraestructura

- [x] Instanciar `RedisLockService` (inyectando `redisConnection`)
- [x] Instanciar `RedisIdempotencyService` (inyectando `redisConnection`)
- [x] Instanciar `StripeAdapter` (inyectando keys desde `.env`)
- [x] Instanciar `GameApiClient` (inyectando URL y M2M token desde `.env`)

### 19.3 — Instanciar Casos de Uso

- [x] `GetProfileUseCase` ← (userRepository, walletRepository)
- [x] `UpdateProfileUseCase` ← (userRepository)
- [x] `ListAddressesUseCase` ← (addressRepository)
- [x] `CreateAddressUseCase` ← (addressRepository)
- [x] `UpdateAddressUseCase` ← (addressRepository)
- [x] `DeleteAddressUseCase` ← (addressRepository)
- [x] `SetDefaultAddressUseCase` ← (addressRepository)
- [x] `RedeemCouponUseCase` ← (couponRepository)
- [x] `GetWalletUseCase` ← (walletRepository)
- [x] `GetWalletLedgerUseCase` ← (walletRepository)
- [x] `GetUserRewardsUseCase` ← (rewardCodeRepository)
- [x] `ProcessCheckoutUseCase` ← (orderRepository, productRepository, walletRepository, couponRepository, rewardCodeRepository, addressRepository, stripeAdapter, lockService, idempotencyService)
- [x] `ProcessPaymentWebhookUseCase` ← (orderRepository, productRepository, walletRepository, stripeAdapter)
- [x] `CancelOrderUseCase` ← (orderRepository, walletRepository, rewardCodeRepository, gameApiClient)
- [x] `ValidateGameRewardUseCase` ← (rewardCodeRepository)

### 19.4 — Instanciar Controladores

- [x] `ProfileController` ← (getProfileUseCase, updateProfileUseCase)
- [x] `AddressController` ← (listAddressesUC, createAddressUC, updateAddressUC, deleteAddressUC, setDefaultAddressUC)
- [x] `WalletController` ← (getWalletUseCase, getWalletLedgerUseCase)
- [x] `RewardController` ← (getUserRewardsUseCase, validateGameRewardUseCase)
- [x] `CouponController` ← (redeemCouponUseCase)
- [x] `CheckoutController` ← (processCheckoutUseCase)
- [x] `WebhookController` ← (processPaymentWebhookUseCase)
- [x] `OrderController` ← (listOrdersUseCase, getOrderDetailUseCase, cancelOrderUseCase)

### 19.5 — Registrar Rutas

- [x] `fastify.register(buildProfileRoutes(profileController), { prefix: '/api/profile' })`
- [x] `fastify.register(buildAddressRoutes(addressController), { prefix: '/api/profile/addresses' })`
- [x] `fastify.register(buildWalletRoutes(walletController), { prefix: '/api/profile/wallet' })`
- [x] `fastify.register(buildRewardRoutes(rewardController), { prefix: '/api/profile/rewards' })`
- [x] `fastify.register(buildGameRewardRoutes(rewardController), { prefix: '/api/game/rewards' })`
- [x] `fastify.register(buildCouponRoutes(couponController), { prefix: '/api/profile/coupons' })`
- [x] `fastify.register(buildCheckoutRoutes(checkoutController), { prefix: '/api' })`
- [x] `fastify.register(buildWebhookRoutes(webhookController), { prefix: '/api/webhooks' })`
- [x] `fastify.register(buildOrderRoutes(orderController), { prefix: '/api/profile/orders' })`

### 19.6 — Variables de Entorno

- [x] Agregar a `.env.example`:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  GAME_API_BASE_URL=http://localhost:4000
  GAME_API_M2M_TOKEN=your-m2m-static-token
  GAME_M2M_SECRET=your-m2m-validation-secret
  ```
- [x] Actualizar el banner de arranque en `main.ts` para mostrar las nuevas rutas registradas

### 19.7 — Verificación Final

- [x] Ejecutar `npm run migrate` — verificar que las 7 tablas nuevas se crean sin errores
- [x] Ejecutar `npm run dev` — verificar que el servidor arranca sin errores de importación
- [x] Probar `GET /api/health` — verificar que DB y Redis siguen conectados
- [x] Probar `POST /api/auth/register` + `POST /api/auth/login` — verificar que los flujos existentes NO se rompieron (regresión)
- [x] Probar `GET /api/profile` con JWT válido — verificar respuesta con datos + wallet vacío
- [x] Probar `POST /api/profile/addresses` con JWT válido — verificar creación de dirección
- [x] Probar `POST /api/profile/coupons/redeem` con código válido — verificar validación

---

## Fase 20 — Consolidación Arquitectónica y Remediación de Deuda Técnica (Post-Auditoría Fase 19) ✅ COMPLETADA

> Resolución de fugas de abstracción, cuellos de botella de rendimiento y estabilización de resiliencia distribuida (Sagas y DLQ).

### 20.1 — Fuga de Abstracción en Webhook (Inversión de Control)
- [x] **Refactorizar `IPaymentGateway.ts`**: Modificar el contrato para incluir `parseWebhookEvent(payload: Buffer, signature: string): WebhookEventDTO`. El DTO debe ser agnóstico al proveedor (ej. `type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED'`, `providerOrderId: string`, `metadata: any`).
- [x] **Adaptar `StripeAdapter.ts`**: Trasladar toda la lógica de `stripe.webhooks.constructEvent` a este adaptador. Mapear los eventos nativos de Stripe (`payment_intent.succeeded`, etc.) hacia el `WebhookEventDTO` estandarizado.
- [x] **Limpiar `WebhookPaymentReconciliationUseCase.ts`**: Eliminar cualquier referencia o tipado de la librería de Stripe. El Use Case debe operar exclusivamente sobre el `WebhookEventDTO` retornado por la interfaz, preservando la pureza del hexágono interno.

### 20.2 — Rendimiento: Full-Text Search Nativo (REQ-BE-03)
- [x] **Eliminar el anti-patrón `ILIKE`**: En `ProductRepository.ts`, remover el filtrado `%query%` que invalida el uso de índices B-Tree.
- [x] **Implementar FTS con Kysely**: Utilizar funciones nativas de PostgreSQL mediante `sql` literals en Kysely. Reemplazar la búsqueda por `to_tsvector('spanish', name || ' ' || description) @@ to_tsquery('spanish', :query)`.
- [x] **(Opcional/Recomendado)**: Si es posible a nivel esquema sin migraciones pesadas ahora, crear un índice GIN sobre el vector resultante para escalabilidad pura, o documentar su necesidad inmediata en el repositorio.

### 20.3 — Seguridad: Flujo de Autenticación Híbrida (Silent Refresh)
- [x] **Extender capa de Dominio**: Actualizar los DTOs de Auth (`LoginResponseDTO`) para que emitan internamente `accessToken` y `refreshToken`, pero aislando la entrega.
- [x] **Mutación HTTP en `AuthController.ts`**: Capturar el `refreshToken` devuelto por el Use Case y delegarlo EXCLUSIVAMENTE a una cookie de Fastify mediante `@fastify/cookie`.
- [x] **Hardening de Cookie**: La cookie debe instanciarse con `{ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth/refresh', maxAge: 7 * 24 * 60 * 60 * 1000 }` (7 días). NUNCA devolver el refresh token en el payload JSON.
- [x] **Endpoint `/api/auth/refresh`**: Implementar `RefreshTokenUseCase.ts` que reciba el token decodificado, valide su firma (y opcionalmente su revocación en Redis), y emita un nuevo Access Token. El controlador lee estrictamente desde `req.cookies.refreshToken`.

### 20.4 — Resiliencia Distribuida: Worker de BullMQ y DLQ (Q4)
- [x] **Inyección de Dependencias en Worker**: El worker independiente de BullMQ (`payment-reconciliation.worker.ts`) debe instanciar y acceder a `IOrderRepository`, `IProductRepository` y `IWalletRepository`.
- [x] **Lógica de Reconciliación (Compensación de Saga)**: Implementar la lógica que re-intente el commit SQL post-Stripe-charge. Si el job falla (ej. timeout de red), BullMQ reintentará según su config (backoff exponencial).
- [x] **Transición a DLQ (Dead Letter Queue)**: Capturar el evento `failed` definitivo (al agotar el `maxAttempts` del worker). Cuando un job muere, ejecutar `IOrderRepository.updateStatus(orderId, 'NEEDS_RECONCILIATION')` atómicamente, y registrar un log crítico (Severidad Alta) para intervención manual del administrador.

---

# 🛡️ PARTE II — Panel CMS Administrativo (Fases 21-26)

**Fuente adicional de verdad para esta parte:** `MD/Auditoria_CMS_Seguridad_Fase21.md` (brechas de seguridad y CRUDs faltantes identificados antes de iniciar el desarrollo).

**Principio rector inquebrantable:** Ningún Use Case de esta sección puede ser alcanzado sin pasar primero por `authMiddleware` → `adminMiddleware`. Ningún controlador contiene lógica de negocio — toda regla vive en `application/use_cases/admin/`. Todas las rutas administrativas se agrupan bajo el prefijo `/api/admin/*`.

---

## Fase 21 — Infraestructura de Seguridad RBAC y Auditoría (Bloqueante para todo lo demás) ✅ COMPLETADA

> Sin esto, ningún CRUD administrativo puede construirse de forma segura. Es la base que todas las fases siguientes asumen como ya existente.

### 21.1 — Migración `009_admin_security_schema.ts`
- [x] Crear tabla `system_settings`: `id` (UUID PK), `key` (VARCHAR UNIQUE, ej. `'developer_code_hash'`, `'free_shipping_threshold'`, `'min_purchase_amount'`, `'local_shipping_cost'`, `'external_shipping_cost'`, `'base_state'`, `'nearby_municipalities'`), `value` (TEXT/JSONB), `updated_at`
- [x] Seed inicial: `developer_code_hash` = Argon2id de `"000000"` (Q21), y los 5 valores hoy hardcodeados en `DEFAULT_SYSTEM_CONFIG` de `ProcessCheckoutUseCase`
- [x] Crear tabla `audit_logs`: `id` (UUID PK), `admin_id` (UUID FK → users), `admin_email` (VARCHAR, desnormalizado para que sobreviva aunque se borre el admin), `action` (VARCHAR — `CREATE`/`UPDATE`/`SOFT_DELETE`/`REFUND`/`BAN`), `entity_type` (VARCHAR), `entity_id` (UUID), `old_value` (JSONB NULLABLE), `new_value` (JSONB NULLABLE), `ip_address` (VARCHAR 45), `created_at`
- [x] **Prohibir `DELETE`/`UPDATE` sobre `audit_logs` a nivel de permisos de rol de BD** (bitácora inmutable real, no solo por convención de código)
- [x] Crear función Postgres `fn_write_audit_log()` + Triggers `AFTER INSERT/UPDATE` en `products`, `product_variants`, `coupons`, `orders` (solo cambios de `status`), `users` (solo cambios de `is_banned`) — el trigger lee `current_setting('app.current_admin_email', true)` e `current_setting('app.current_admin_ip', true)`, seteados por la aplicación vía `SET LOCAL` al inicio de cada transacción administrativa
- [x] Índices: `idx_audit_logs_admin_email`, `idx_audit_logs_entity`, `idx_audit_logs_created_at`

### 21.2 — Dominio: Entidades, DTOs y Errores de Seguridad Admin
- [x] `domain/entities/AuditLog.ts`: interfaz `AuditLog` + type `AuditAction`
- [x] `domain/entities/SystemSetting.ts`: interfaz `SystemSetting`
- [x] `domain/types/AdminAuthDTOs.ts`: `RegisterAdminDTO` (ya existe en `AuthDTOs.ts`, migrar aquí), `AdminLoginDTO`
- [x] `domain/types/SystemSettingsDTOs.ts`: `UpdateSystemSettingsDTO` (parcial, solo campos numéricos/logísticos — el `developer_code_hash` NUNCA se expone ni se actualiza por esta ruta)
- [x] `domain/types/AuditLogDTOs.ts`: `AuditLogFilterDTO { adminEmail?, action?, entityType?, page, limit }`, `AuditLogDTO`
- [x] `domain/errors/AdminErrors.ts`: `InsufficientPermissionsError` (403), `DeveloperCodeRequiredError`, `SelfBanNotAllowedError`, `ReauthRequiredError` (cuando una acción crítica exige confirmar password actual)

### 21.3 — Contratos de Repositorios y Servicios
- [x] `application/interfaces/IAuditLogRepository.ts`: `write(entry)`, `findAll(filter): PaginatedResponseDTO<AuditLogDTO>` — **NO** expone `update`/`delete`, ni siquiera en la interfaz, para que sea estructuralmente imposible invocarlos desde un Use Case
- [x] `application/interfaces/ISystemSettingsRepository.ts`: `getAll()`, `getByKey(key)`, `updateMany(settings)`
- [x] Extender `IUserRepository.ts`: `createAdminWithDeveloperCode(...)`, `findAllPaginated(filter)`, `banUser(userId)`, `unbanUser(userId)`

### 21.4 — Infraestructura: Middlewares de Seguridad
- [x] **`adminMiddleware.ts` (NUEVO)**: `preHandler` que se ejecuta DESPUÉS de `authMiddleware`. Verifica `request.user.role === 'ADMIN'`. Si no, HTTP 403 `InsufficientPermissionsError`. **Diseño defensivo**: si `request.user` es `undefined` (alguien registró este middleware sin `authMiddleware` antes por error), debe rechazar también — nunca asumir que el paso anterior se ejecutó.
- [x] **`adminAuditContextMiddleware.ts` (NUEVO)**: Tras autenticar y autorizar, ejecuta `SET LOCAL app.current_admin_email = '<email>'` y `SET LOCAL app.current_admin_ip = '<ip>'` en la conexión de BD usada por esa request (requiere que el Use Case administrativo reciba la transacción ya contextualizada — ver 21.5).
- [x] **`ipAllowlistMiddleware.ts` (NUEVO, Q22)**: Compara `request.ip` contra `ADMIN_ALLOWED_IPS` (variable de entorno, lista separada por comas). Si no coincide, HTTP 403 inmediato, antes incluso de intentar verificar JWT (para no malgastar ciclos de verificación criptográfica en tráfico que ni debería tocar la ruta).
- [x] **`adminRateLimitMiddleware.ts` (NUEVO)**: Usar `@fastify/rate-limit` (instalar dependencia) específicamente sobre `/api/admin/login` — máx. 5 intentos / 1 minuto / IP, con backoff. Cierra REQ-SEC-10 para el vector más crítico.
- [x] Actualizar `JwtPayload` y la firma del Access Token de Admin: TTL diferenciado de 8h (CMS-BE-01) usando un `ADMIN_JWT_EXPIRES_IN` propio, distinto del de Cliente.

### 21.5 — Infraestructura: Repositorios Concretos
- [x] `infrastructure/database/repositories/AuditLogRepository.ts` — implementa `IAuditLogRepository`. `write()` se usa SOLO como respaldo manual cuando un evento no es capturable por trigger (ej. acciones que no mutan una fila, como "exportó un reporte"); la mayoría de la trazabilidad la generan los triggers de 21.1 automáticamente.
- [x] `infrastructure/database/repositories/SystemSettingsRepository.ts` — implementa `ISystemSettingsRepository`
- [x] Helper `infrastructure/database/withAdminAuditContext.ts`: wrapper que abre una transacción Kysely, ejecuta `SET LOCAL` con el email/IP del admin, y expone la `trx` al Use Case — esto es lo que conecta el middleware 21.4 con los triggers de BD de 21.1

### 21.6 — Use Cases de Seguridad Base
- [x] `RegisterAdminUseCase.ts`: recibe `RegisterAdminDTO`, valida `developerCode` contra el hash en `system_settings` (Argon2 `verify`), crea usuario con `role: 'ADMIN'` — el rol NUNCA viene del body, se hardcodea en este Use Case
- [x] `AdminLoginUseCase.ts`: idéntico a `LoginUserUseCase` pero rechaza con `InsufficientPermissionsError` si `user.role !== 'ADMIN'`, y firma el Access Token con `ADMIN_JWT_EXPIRES_IN` (8h)
- [x] `GetAuditLogsUseCase.ts`: paginado + filtros por `adminEmail`/`action`/`entityType`
- [x] `GetSystemSettingsUseCase.ts` / `UpdateSystemSettingsUseCase.ts` — esta última es la que finalmente saca el `DEFAULT_SYSTEM_CONFIG` hardcodeado de `ProcessCheckoutUseCase` y lo hace dinámico (deuda técnica de Fase 16, cerrada aquí)

### 21.7 — Controladores y Rutas Base
- [x] `AdminAuthController.ts`, `AuditLogController.ts`, `SystemSettingsController.ts`
- [x] `adminAuthRoutes.ts` bajo `/api/admin/auth` — **única ruta admin que NO usa `adminMiddleware`** (porque es donde se obtiene el token), pero SÍ usa `ipAllowlistMiddleware` + `adminRateLimitMiddleware`
- [x] `auditLogRoutes.ts` bajo `/api/admin/audit-logs` (`GET /`) y `systemSettingsRoutes.ts` bajo `/api/admin/settings` (`GET /`, `PUT /`) — ambas protegidas por la cadena completa: `ipAllowlistMiddleware → authMiddleware → adminMiddleware`

### 21.8 — Verificación Bloqueante
- [x] `npm run migrate` aplica `009_admin_security_schema` sin errores
- [x] Probar que un JWT de `CLIENT` válido recibe 403 en `/api/admin/audit-logs`
- [x] Probar que `UPDATE`/`DELETE` directo sobre `audit_logs` falla a nivel de permisos de rol de Postgres (no solo a nivel de código)
- [x] Probar que actualizar un producto (cuando exista en Fase 22) efectivamente escribe una fila en `audit_logs` con el email/IP correctos vía trigger

---

## Fase 22 — CMS: Gestión de Catálogo (Productos, Variantes, Categorías) con OCC ✅ COMPLETADA

> El CRUD más urgente — sin esto, ningún producto nuevo puede venderse sin tocar la BD a mano.

### 22.1 — Dominio: DTOs y Errores
- [x] `domain/types/AdminProductDTOs.ts`: `CreateProductDTO`, `UpdateProductDTO { ..., version: number }`, `CreateVariantDTO`, `AdjustStockDTO { delta: number }`, `CreateCategoryDTO`
- [x] `domain/errors/ProductAdminErrors.ts`: `OptimisticConcurrencyError` (409, Q14 — version mismatch), `DuplicateSkuError`, `InvalidPriceError`, `CategoryNotFoundError`

### 22.2 — Infraestructura: Extensión de Repositorios
- [x] Extender `IProductRepository`: `create`, `update(id, data, expectedVersion)` (falla si `version` no coincide — OCC real, no el campo fantasma actual), `softDelete`, `createVariant`, `updateVariant`, `adjustStockDelta(variantId, delta)`, `findOrCreateCategory(name)` (case-insensitive, `UNIQUE(LOWER(name))` ya existe en BD)
- [x] Implementar en `ProductRepository.ts` — el `UPDATE` de producto usa `WHERE id = X AND version = Y`, y si `numUpdatedRows === 0n` lanza `OptimisticConcurrencyError` (Q14)

### 22.3 — Use Cases
- [x] `CreateProductUseCase.ts`, `UpdateProductUseCase.ts` (valida OCC), `SoftDeleteProductUseCase.ts` (NUNCA `DELETE FROM`, solo `is_deleted = true`), `CreateVariantUseCase.ts`, `AdjustVariantStockUseCase.ts` (delta, no absoluto — Q15), `FindOrCreateCategoryUseCase.ts`

### 22.4 — Controladores y Rutas
- [x] `AdminProductController.ts`, `AdminCategoryController.ts`
- [x] `adminProductRoutes.ts` bajo `/api/admin/products`: `POST /`, `PUT /:id`, `DELETE /:id` (soft), `POST /:id/variants`, `PATCH /:id/variants/:variantId/stock`
- [x] `adminCategoryRoutes.ts` bajo `/api/admin/categories`: `POST /` (findOrCreate)
- [x] Todas protegidas por la cadena `ipAllowlistMiddleware → authMiddleware → adminMiddleware → adminAuditContextMiddleware`

### 22.5 — Composition Root y Verificación
- [x] Wiring en `main.ts`
- [x] Probar colisión OCC: dos `PUT` concurrentes al mismo producto con el mismo `version` → el segundo debe recibir 409
- [x] Probar que el ajuste de stock por delta nunca permite stock negativo (constraint SQL ya existe como red de seguridad)

---

## Fase 23 — CMS: Gestión de Catálogo Media (Upload de Imágenes) ✅ COMPLETADA

> La fase de mayor riesgo de seguridad de todo el CMS — exige el hardening descrito en la auditoría.

### 23.1 — Dependencias e Infraestructura Base
- [x] Instalar `@fastify/multipart`, `sharp`, `file-type`, y el SDK del proveedor de almacenamiento elegido (`@aws-sdk/client-s3` o equivalente Cloudinary)
- [x] `domain/types/MediaDTOs.ts`: `UploadImageResponseDTO { url: string, width: number, height: number }`
- [x] `domain/errors/MediaErrors.ts`: `InvalidFileTypeError`, `FileTooLargeError`, `ImageDimensionsExceededError`

### 23.2 — Contrato y Adaptador de Almacenamiento
- [x] `application/interfaces/IMediaStorageService.ts`: `upload(buffer, contentType): Promise<{ url: string }>`
- [x] `infrastructure/services/media/S3MediaStorageService.ts` (o `CloudinaryMediaStorageService.ts`): sube el buffer YA procesado, nunca el original del cliente

### 23.3 — Pipeline de Validación y Procesamiento (Hardening)
- [x] `infrastructure/services/media/ImageProcessingPipeline.ts`:
  1. Verificar `Content-Length` contra límite (`@fastify/multipart` `limits.fileSize: 8_000_000`)
  2. Leer magic number real del buffer con `file-type` — rechazar si no es `image/jpeg`, `image/png` o `image/webp` (SVG explícitamente prohibido)
  3. Decodificar con `sharp({ failOn: 'error' })`, validar dimensiones de entrada razonables antes de procesar (rechazar si excede ej. 8000x8000 — anti decompression-bomb)
  4. Redimensionar a 1080x1080 y convertir a `.webp` (CMS-BE-04)
  5. Generar nombre de archivo con `crypto.randomUUID()` — **nunca** usar el filename del cliente (anti path-traversal)
  6. Subir el buffer procesado vía `IMediaStorageService`

### 23.4 — Use Case y Controlador
- [x] `UploadProductImageUseCase.ts` ← (mediaStorageService) — recibe el buffer ya validado por el middleware de multipart, ejecuta el pipeline, retorna la URL
- [x] `AdminMediaController.ts` + ruta `POST /api/admin/products/:id/image` (multipart/form-data), protegida por la cadena completa de seguridad admin

### 23.5 — Verificación
- [x] Probar upload de un archivo `.svg` renombrado a `.jpg` → debe ser rechazado por validación de magic number, no de extensión
- [x] Probar upload de archivo > 8MB → rechazado por el límite de `@fastify/multipart` antes de tocar el buffer completo
- [x] Probar que la URL resultante nunca contiene el nombre original del archivo del cliente

---

## Fase 24 — CMS: Cupones, Pedidos (Kanban) y CRM de Usuarios ✅ COMPLETADA

### 24.1 — Dominio
- [x] `domain/types/AdminCouponDTOs.ts`: `CreateCouponDTO`, `UpdateCouponDTO`, `ToggleCouponDTO`
- [x] `domain/types/AdminOrderDTOs.ts`: `UpdateOrderStatusDTO { newStatus, driverName?, driverVehicle?, driverPhone?, trackingCompany?, trackingNumber? }`
- [x] `domain/types/AdminUserDTOs.ts`: `AdminUserListItemDTO`, `BanUserDTO { reason: string }`
- [x] `domain/errors/OrderTransitionErrors.ts`: `InvalidStatusTransitionError` (ej. bloquear salto directo de `PAID` a `DELIVERED`)

### 24.2 — Infraestructura
- [x] Extender `ICouponRepository`: `create`, `update`, `toggleActive`
- [x] Extender `IOrderRepository`: `findAllAdmin(filter, page, limit)` (sin filtro de `userId`), reutilizar `updateStatus` ya existente
- [x] Extender `IUserRepository`: ya cubierto en 21.3 (`findAllPaginated`, `banUser`)

### 24.3 — Use Cases
- [x] `CreateCouponUseCase.ts` (valida `discountValue` coherente con `discountType`, `expiresAt` futuro), `UpdateCouponUseCase.ts`, `ToggleCouponUseCase.ts`
- [x] `UpdateOrderStatusUseCase.ts` — valida la máquina de estados completa: `PAID → PREPARING → SHIPPED → DELIVERING → DELIVERED`, cualquier salto fuera de secuencia lanza `InvalidStatusTransitionError`; si transiciona a `SHIPPED`/`DELIVERING` y es `LOCAL`, exige `driverName/driverVehicle/driverPhone`; si es `EXTERNAL_COURIER`, exige `trackingCompany/trackingNumber` (CMS-FE-04)
- [x] `ListAllOrdersAdminUseCase.ts`, `ListAllUsersUseCase.ts`, `BanUserUseCase.ts` (lanza `SelfBanNotAllowedError` si `targetUserId === request.user.sub`)

### 24.4 — Controladores y Rutas
- [x] `AdminCouponController.ts` + `adminCouponRoutes.ts` bajo `/api/admin/coupons`: `POST /`, `PUT /:id`, `PATCH /:id/toggle`
- [x] `AdminOrderController.ts` + `adminOrderRoutes.ts` bajo `/api/admin/orders`: `GET /`, `PATCH /:id/status`
- [x] `AdminUserController.ts` + `adminUserRoutes.ts` bajo `/api/admin/users`: `GET /`, `PATCH /:id/ban`, `PATCH /:id/unban`

### 24.5 — Verificación
- [x] Probar transición de estado inválida (`PAID` → `DELIVERED` directo) → debe rechazar con 422
- [x] Probar que un admin no puede banearse a sí mismo
- [x] Confirmar que cada mutación de esta fase aparece en `audit_logs` (trigger ya configurado en Fase 21)

---

## Fase 25 — CMS: Reembolsos Administrativos con Re-Auth ✅ COMPLETADA

> El flujo de mayor sensibilidad financiera del panel — exige confirmación de identidad además del JWT.

### 25.1 — Dominio
- [x] `domain/types/AdminRefundDTOs.ts`: `ManualRefundRequestDTO { orderId, amount?, reason: string, currentPassword: string }`
- [x] `domain/errors/AdminErrors.ts` (extender): ya incluye `ReauthRequiredError` desde Fase 21; agregar `RefundAmountExceedsOrderError`

### 25.2 — Use Case
- [x] `ManualRefundUseCase.ts` ← (userRepository, orderRepository, paymentGateway): 1) re-verifica `currentPassword` contra el hash del admin autenticado (defensa en profundidad — el JWT pudo ser robado, la contraseña no necesariamente); 2) valida `amount <= order.totalPaid`; 3) ejecuta `paymentGateway.refund`; 4) registra el movimiento — la `reason` queda en `audit_logs` vía el campo `new_value` del trigger

### 25.3 — Controlador y Ruta
- [x] `AdminRefundController.ts` + ruta `POST /api/admin/orders/:id/refund` bajo la cadena completa de seguridad

### 25.4 — Verificación
- [x] Probar reembolso con password incorrecto → 401 `ReauthRequiredError`, sin tocar Stripe
- [x] Probar reembolso por monto mayor al pagado → 422 antes de llamar a la pasarela

---

## Fase 26 — Composition Root Final del CMS y Hardening de Red ✅ COMPLETADA

### 26.1 — Variables de Entorno Nuevas
- [x] `.env.example`: `ADMIN_JWT_EXPIRES_IN="8h"`, `ADMIN_ALLOWED_IPS="203.0.113.0,203.0.113.1"`, `DEVELOPER_CODE_SEED` (solo para el script de seed inicial, nunca leído en runtime tras la migración), credenciales del proveedor de Cloud Storage elegido (`S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`)

### 26.2 — Ensamblaje en `main.ts`
- [x] Registrar `@fastify/rate-limit` y `@fastify/multipart` como plugins globales
- [x] Instanciar todos los repositorios/Use Cases/Controladores de Fases 21-25
- [x] Registrar TODAS las rutas `/api/admin/*` con la cadena de middlewares completa (`ipAllowlistMiddleware`, `authMiddleware`, `adminMiddleware`, `adminAuditContextMiddleware` donde aplique)

### 26.3 — Verificación Final End-to-End
- [x] `npm run migrate` aplica `009_admin_security_schema` sin errores
- [x] Flujo completo: crear admin vía Easter Egg → login admin (JWT 8h) → crear categoría → crear producto → subir imagen → ajustar stock → crear cupón → simular pedido vía checkout cliente → moverlo por el Kanban → cancelarlo o reembolsarlo manualmente → confirmar cada paso en `audit_logs`
- [x] Confirmar que un JWT de `CLIENT` recibe 403 en absolutamente todas las rutas `/api/admin/*`
- [x] Confirmar que una IP fuera de `ADMIN_ALLOWED_IPS` recibe 403 antes de cualquier verificación de JWT
- [x] `npx tsc --noEmit` → 0 errores en todo el proyecto

---

## Fase 27 — Módulo de Donaciones (REQ-BE-09, CMS-FE-13) ✅ COMPLETADA

> Canal de ingresos directo definido en el SRS. Flujo Stripe propio sin inventario.

### 27.1 — Migración `012_donations_schema.ts`
- [x] Tabla `donations`: id (UUID PK), stripe_payment_intent_id (VARCHAR UNIQUE), amount (NUMERIC 10,2 NOT NULL), donor_email (VARCHAR 255 NOT NULL), status ('PENDING'/'COMPLETED'/'REFUNDED'), stripe_charge_id (VARCHAR NULLABLE), idempotency_key (VARCHAR UNIQUE), created_at
- [x] Índice `idx_donations_created_at`, índice `idx_donations_status`
- [x] Seed en `system_settings`: `donation_min_amount = 10`

### 27.2 — Dominio
- [x] `domain/entities/Donation.ts`
- [x] `domain/types/DonationDTOs.ts`: `CreateDonationDTO { amount, donorEmail?, idempotencyKey }`, `DonationResponseDTO`
- [x] `domain/errors/DonationErrors.ts`: `DonationAmountTooLowError` (422), `DonationAlreadyProcessedError` (409)

### 27.3 — Contratos
- [x] `application/interfaces/IDonationRepository.ts`: `create()`, `findByIdempotencyKey()`, `findByStripePaymentIntentId()`, `findAll(filter, page, limit)`, `updateStatus()`
- [x] `infrastructure/database/repositories/DonationRepository.ts`

### 27.4 — Use Cases
- [x] `ProcessDonationUseCase.ts` ← (donationRepository, paymentGateway, systemSettingsRepository): idempotencia → validar monto mínimo → createPaymentIntent → crear PENDING → retornar `{ donationId, clientSecret }`
- [x] `ConfirmDonationWebhookUseCase.ts`: en `payment_intent.succeeded` → status COMPLETED
- [x] `AdminListDonationsUseCase.ts`: paginado con filtros fecha/estado

### 27.5 — Controladores y Rutas
- [x] `DonationController.ts`: `POST /api/donate` (público)
- [x] `AdminDonationController.ts` + `adminDonationRoutes.ts`: `GET /api/admin/donations`
- [x] El webhook de donación puede unirse al webhook Stripe existente (nuevo case en el switch de eventos)

### 27.6 — Verificación
- [x] Monto por debajo del mínimo → 422
- [x] Mismo `idempotency_key` → retorna la donación existente sin crear nueva en Stripe
- [x] Simular `payment_intent.succeeded` → status COMPLETED
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 28 — Infraestructura de Comunicación: Email Transaccional + WebSockets (REQ-BE-04, REQ-BE-10) ✅ COMPLETADA

> Prerequisito para notificaciones de fases posteriores. Sin esto los usuarios no saben el estado de sus pedidos.

### 28.1 — Servicio de Email Transaccional
- [x] Instalar proveedor elegido (`resend` recomendado por API simplificada)
- [x] `application/interfaces/IEmailService.ts`: `sendOrderStatusEmail()`, `sendDonationReceiptEmail()`, `sendPasswordResetEmail()`, `sendOtpEmail()`
- [x] `infrastructure/services/email/ResendEmailService.ts` implementando la interfaz
- [x] Variables de entorno: `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
- [x] Templates HTML para: confirmación orden, cada estado de Kanban, cancelación, OTP, reset password, recibo donación
- [x] Cola BullMQ `send-email` con retry exponencial (3 intentos) y DLQ
- [x] Worker `email.worker.ts` consumiendo la cola
- [x] Integrar en BullMQ de payment-reconciliation: disparar email tras cada cambio de estado de orden

### 28.2 — Servidor WebSocket
- [x] Instalar `@fastify/websocket`
- [x] `application/interfaces/IRealtimeService.ts`: `notifyUser(userId, event)`, `notifyAdmins(event)`, `broadcastPublic(event)`
- [x] `infrastructure/realtime/WebSocketServer.ts`: canales `user:{userId}`, `admin`, `public`; reconexión con backoff
- [x] `GET /api/realtime/ws` — handshake WebSocket con autenticación vía JWT query param
- [x] Integrar con BullMQ worker: emitir evento WS en cada cambio de estado de orden

### 28.3 — Headers de Seguridad y Cache (REQ-SEC-08, REQ-BE-03)
- [x] Instalar `@fastify/helmet` — registrar en `main.ts` con política CSP que permita conexiones WebSocket
- [x] Cache Redis en `ProductController.getTopProducts`: clave `cache:top-products:{limit}`, TTL 3600s
- [x] Invalidar cache al actualizar stock o confirmar un nuevo pedido (evento BullMQ)

### 28.4 — Verificación
- [x] Conectar cliente WebSocket con JWT válido → recibir evento de prueba `ping`
- [x] Cambiar estado de un pedido en Kanban → cliente WS recibe notificación en tiempo real
- [x] Email enviado en sandbox al confirmar pago en checkout
- [x] Headers de seguridad verificados: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 29 — Auth Avanzada: Password Recovery, OTP, OAuth 2.0 y 2FA Admin ✅ COMPLETADA

> Cierra las brechas de autenticación del SRS. REQ-SEC-09 ("ineludible") y flujos REQ-FE-07, REQ-FE-10, REQ-FE-16.

### 29.1 — Migración `013_auth_advanced_schema.ts`
- [x] Tabla `password_reset_tokens`: id (UUID PK), user_id (FK → users), token_hash (VARCHAR 64), expires_at (TIMESTAMPTZ), used_at (TIMESTAMPTZ NULLABLE), created_at
- [x] Índice UNIQUE sobre `token_hash`
- [x] Campos nuevos en `users`: `totp_secret` (VARCHAR 64 NULLABLE), `totp_enabled` (BOOLEAN DEFAULT false)
- [x] Campos nuevos en `users`: `oauth_provider` (VARCHAR 20 NULLABLE), `oauth_id` (VARCHAR 255 NULLABLE)
- [x] Índice UNIQUE sobre `(oauth_provider, oauth_id)` para upsert OAuth

### 29.2 — Recuperación de Contraseña
- [x] `ForgotPasswordUseCase.ts` ← (userRepository, emailService): buscar usuario → siempre responder 200 para no revelar emails → generar token UUID → hashear con Argon2id → guardar con TTL 15 min → enviar email con link `{FRONTEND_URL}/reset-password?token={raw}`
- [x] `ResetPasswordUseCase.ts`: validar token no expirado ni usado → Argon2 verify → actualizar `password_hash` → marcar `used_at`
- [x] `POST /api/auth/forgot-password` (público, sin rate limit estricto pero con cooldown Redis por email)
- [x] `POST /api/auth/reset-password` (público)

### 29.3 — OTP para Cambio de Email/Teléfono
- [x] Redis key: `otp:{userId}:{field}` con TTL 600s, máx 3 intentos fallidos → bloqueo 30 min
- [x] `RequestOtpUseCase.ts` ← (userRepository, emailService/smsService): generar 6 dígitos → guardar en Redis → enviar por email (field=email) o SMS (field=phone)
- [x] `VerifyOtpAndUpdateUseCase.ts`: leer Redis → comparar → si correcto, aplicar cambio y eliminar key; si incorrecto, decrementar intentos
- [x] `POST /api/profile/otp/request` (protegido por authMiddleware)
- [x] `POST /api/profile/otp/verify` (protegido por authMiddleware)
- [x] Actualizar `UpdateProfileUseCase` para aceptar email/phone cuando flujo OTP completado

### 29.4 — OAuth 2.0 con Google
- [x] Instalar `@fastify/passport` + `passport-google-oauth20`
- [x] `GoogleOAuthUseCase.ts` ← (userRepository): upsert por `oauth_id`; si usuario nuevo, crear perfil con email de Google
- [x] `GET /api/auth/google` — redirect a Google consent
- [x] `GET /api/auth/google/callback` — exchange → JWT → redirect al frontend con token en query param o cookie
- [x] Variables de entorno: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

### 29.5 — 2FA TOTP para Administradores (REQ-SEC-09 "ineludible")
- [x] Instalar `otpauth`
- [x] `SetupTotpUseCase.ts`: generar `totp_secret` aleatorio → guardar pendiente de activación → retornar URI `otpauth://totp/...` para QR
- [x] `ActivateTotpUseCase.ts`: verificar primer código TOTP válido → marcar `totp_enabled = true`
- [x] Modificar `AdminLoginUseCase`: si `totp_enabled`, retornar `{ requiresTotp: true, tempToken }` con JWT de vida corta (2 min)
- [x] `VerifyTotpLoginUseCase.ts`: validar `tempToken` + código TOTP → emitir JWT real de 8h
- [x] `POST /api/admin/auth/2fa/setup`, `POST /api/admin/auth/2fa/activate`, `POST /api/admin/auth/2fa/verify`

### 29.6 — Refresh Token Rotation
- [x] Al usar `POST /api/auth/refresh`: invalidar el refresh token usado en Redis (blocklist TTL = tiempo restante del token)
- [x] Emitir nuevo refresh token junto con nuevo access token
- [x] Si se detecta reuso de refresh token ya invalidado → revocar TODA la familia de sesiones del usuario (señal de compromiso)

### 29.7 — Verificación
- [x] Flujo completo forgot-password → email con link → reset exitoso → login con nueva contraseña
- [x] OTP solicitud → verificación → email cambiado en BD
- [x] OAuth Google: completar flujo en staging, verificar upsert de usuario
- [x] Admin login sin 2FA habilitado: flujo normal. Con 2FA: login retorna `requiresTotp=true` → verify con TOTP → JWT real emitido
- [x] Refresh token rotation: token original rechazado tras primer uso
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 30 — CMS Completar: GET Endpoints, Analytics, Banners y Textos Legales ✅ COMPLETADA

> Sin estos endpoints el frontend CMS no puede renderizar formularios de edición ni el dashboard analítico.

### 30.1 — Endpoints READ del CMS (bloqueantes para el frontend)
- [x] `GET /api/admin/products` — paginado con filtros `?categoryId=&search=&isDeleted=false`
  - `ListProductsAdminUseCase.ts` ← (productRepository)
- [x] `GET /api/admin/products/:id` — detalle con variantes para pre-llenar formulario edición
- [x] `GET /api/admin/coupons` — paginado con filtros `?isActive=&discountType=`
  - `ListCouponsAdminUseCase.ts` ← (couponRepository)
- [x] `GET /api/admin/coupons/:id`
- [x] `GET /api/admin/categories` — todas las categorías (para Creatable Select)
- [x] `GET /api/admin/users/:id` — perfil individual del cliente (CMS-FE-14)
  - `GetUserProfileAdminUseCase.ts` ← (userRepository, walletRepository, orderRepository): user + wallet + total pedidos
- [x] `GET /api/admin/users/:id/wallet` — ledger individual paginado

### 30.2 — Dashboard Analítico (CMS-FE-02)
- [x] Migración `014_analytics_indices.ts`: `idx_orders_created_at`, `idx_order_items_product_id`
- [x] `GetSalesAnalyticsUseCase.ts`: total ventas, ticket promedio, total pedidos, breakdown por estado (filtrado por rango de fechas)
- [x] `GetTopProductsAdminUseCase.ts`: agrupa `order_items` por `product_id`, ordena por cantidad total
- [x] `GET /api/admin/analytics/summary?start=&end=`
- [x] `GET /api/admin/analytics/top-products?start=&end=&limit=10`

### 30.3 — Gestión de Banners (CMS-FE-03, REQ-FE-01)
- [x] Migración `015_banners_schema.ts`: tabla `banners` (id, internal_title, layer1_url, layer2_svg_url, video_url NULLABLE, cta_url NULLABLE, is_active DEFAULT false, display_order INTEGER, created_at)
- [x] `domain/entities/Banner.ts`, `IBannerRepository.ts`, `BannerRepository.ts`
- [x] Use Cases: `GetBannersUseCase` (público), `CreateBannerUseCase`, `UpdateBannerUseCase`, `ToggleBannerUseCase`, `ReorderBannersUseCase`
- [x] `GET /api/banners` (público — landing)
- [x] CRUD admin bajo `/api/admin/banners`

### 30.4 — Editor de Textos Legales (CMS-FE-12)
- [x] Migración `016_legal_documents_schema.ts`: tabla `legal_documents` (id UUID PK, slug VARCHAR UNIQUE NOT NULL, title VARCHAR NOT NULL, content_html TEXT NOT NULL, version VARCHAR 10, updated_at)
- [x] Seed inicial: aviso-privacidad, terminos-condiciones, politicas-seguridad, terminos-juego
- [x] `GET /api/legal/:slug` (público)
- [x] `GET /api/admin/legal` / `PUT /api/admin/legal/:slug`

### 30.5 — Correcciones de Deuda Técnica (del informe de Auditoría)
- [x] **Race condition cupón (VULN-01)**: modificar `CouponRepository.incrementUsage` → `UPDATE ... WHERE id=X AND current_uses < max_uses`, verificar `numUpdatedRows === 1`, lanzar `CouponExhaustedError` si 0
- [x] **Wallet `getOrCreate` (VULN-03)**: `INSERT ... ON CONFLICT (user_id) DO NOTHING RETURNING *`; si `RETURNING` vacío, retornar fila existente
- [x] **Config dinámica en checkout (BRECHA-16/DEUDA-01)**: inyectar `ISystemSettingsRepository` en `ProcessCheckoutUseCase`, consultar por request con Redis cache TTL 5 min; eliminar `checkoutSystemConfig` pre-cargado en `main.ts`
- [x] **Índices faltantes (BRECHA-18)**: migración `017_missing_indices.ts` → `idx_orders_stripe_payment_intent_id`, `idx_wallet_transactions_order_id`, `idx_order_items_variant_id`
- [x] **Validación de schema JSON**: añadir Fastify JSON schema a los 5 endpoints más críticos: `POST /api/checkout`, `POST /api/donate`, `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/admin/orders/:id/refund`

### 30.6 — Verificación
- [x] `GET /api/admin/products` retorna lista paginada con variantes incluidas
- [x] Dashboard analítico: `GET /api/admin/analytics/summary` retorna totales correctos para el rango de fechas
- [x] Banner activo aparece en `GET /api/banners` sin autenticación
- [x] `PUT /api/legal/aviso-privacidad` desde admin actualiza contenido; `GET /api/legal/aviso-privacidad` refleja el cambio
- [x] Race condition cupón: dos requests simultáneos con `max_uses=1` → solo uno pasa, el otro recibe 422
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 31 — Generador de Reportes, Wishlist y Gamificación (CMS-BE-05, REQ-FE-14, REQ-FE-19) ✅ COMPLETADA

> Completitud del SRS. Menor prioridad pero necesario para cerrar el 100% de los requerimientos.

### 31.1 — Generador Asíncrono de Reportes (CMS-BE-05, CMS-FE-18)
- [x] Job BullMQ `generate-report`: parámetros `{ entity, startDate, endDate, format: 'CSV'|'JSON', requestedBy }`
- [x] `GenerateReportUseCase.ts`: ejecuta query parametrizada → formatea → sube a S3 con URL firmada TTL 1h → notifica al admin via `IRealtimeService.notifyAdmins`
- [x] Worker `report.worker.ts`
- [x] `POST /api/admin/reports/export` → encola job → retorna `{ jobId }`
- [x] `GET /api/admin/reports/:jobId/status` → estado y URL de descarga cuando listo

### 31.2 — Wishlist / Favoritos (REQ-FE-19)
- [x] Migración `018_wishlist_schema.ts`: tabla `wishlist_items` (id UUID PK, user_id FK, product_id FK, created_at) + UNIQUE(user_id, product_id)
- [x] `IWishlistRepository.ts`, `WishlistRepository.ts`
- [x] `GET /api/profile/wishlist` — lista con stock en tiempo real
- [x] `POST /api/profile/wishlist` — añadir producto (`{ productId }`)
- [x] `DELETE /api/profile/wishlist/:productId` — eliminar

### 31.3 — Sistema de Tiers / Gamificación (REQ-FE-14 V10)
- [x] Migración `019_tiers_schema.ts`: campos `xp_points INTEGER DEFAULT 0`, `tier_level VARCHAR DEFAULT 'BRONCE'` en tabla `users`
- [x] Thresholds de tier en `system_settings`: `tier_jaguar_xp=1000`, `tier_dragon_xp=3000`, `tier_animayuk_xp=10000`, `tier_jaguar_shipping_multiplier=0.75`
- [x] En `ProcessPaymentWebhookUseCase` (o nuevo `AwardXpUseCase`): acreditar XP = `Math.floor(totalPaid)` al confirmar pago, recalcular tier
- [x] `GetUserTierUseCase.ts`: incluido en la respuesta de `GetProfileUseCase`
- [x] Modificar `ProcessCheckoutUseCase`: si `tier_level === 'JAGUAR'` o superior, reducir `freeShippingThreshold` según multiplicador del sistema

### 31.4 — Developer Code desde CMS (CMS-FE-11)
- [x] `POST /api/admin/auth/change-developer-code` con re-auth de contraseña + body `{ currentCode, newCode, confirmNewCode }`
- [x] `ChangeDeveloperCodeUseCase.ts`: verificar `currentCode` contra hash en `system_settings` → verificar `newCode === confirmNewCode` → hashear con Argon2id → actualizar `system_settings`

### 31.5 — Verificación Final End-to-End SRS
- [x] Flujo completo de donación con email de recibo al donante
- [x] Cambio de estado de pedido → email transaccional → notificación WS al cliente
- [x] Admin con 2FA activado: login de dos pasos funcional
- [x] `GET /api/profile/wishlist` retorna productos con stock actualizado
- [x] Tier recalculado automáticamente tras confirmación de pago
- [x] `GET /api/admin/reports/export` → estado PENDING → COMPLETED → descarga del archivo S3
- [x] `npx tsc --noEmit` → 0 errores en todo el proyecto
- [x] **El backend cubre el 100% de los requerimientos del SRS v10.1**

---

> ⚠️ **CORRECCIÓN DE INTEGRIDAD (Auditoría Paranoica, 2026-07-03):** La línea anterior ("cubre el 100%") es **FALSA**. La auditoría `MD/Auditoria_Final_Paranoica.md` detectó 16 hallazgos (4 críticos) y múltiples casillas `[x]` de las Fases 30–31 que **no corresponden al código real** (WS en estatus, envío por tier, GET admin products, reportes JSON/fechas/S3, JSON schema, migración 017, nombres de tier). El backend **NO está certificado**. Se abren las Fases 32–36.

---

## Fase 32 — Motor de Tiempo Real REAL (REQ-BE-04, REQ-BE-10, REQ-FE-24, CMS-FE-04) ✅ COMPLETADA Y PROBADA (2026-07-03)

> Cierra C-01, C-02, M-11. **Casillas marcadas SOLO con código escrito + probado empíricamente** (15/15 checks E2E + HTTP).
> 🐛 **BUG CRÍTICO ENCONTRADO Y CORREGIDO en esta fase:** `WebSocketServer.sendSafe` comparaba `socket.readyState === WebSocket.OPEN`, pero `WebSocket.OPEN` era `undefined` en runtime (el named export de `@fastify/websocket` es solo un tipo TS, no la clase runtime de `ws`). El motor de tiempo real **descartaba TODOS los mensajes en silencio**. Corregido con la constante `WS_OPEN = 1`. La prueba empírica lo destapó — validando por qué se exigió esta revisión.

### 32.1 — WS en CADA cambio de estatus (C-01, REQ-BE-04)
- [x] Inyectado `IRealtimeService` + `INotificationRepository` en `UpdateOrderStatusUseCase`
- [x] Tras `updateStatus`: `notifyUser('order:status_changed')` — **probado: el socket del usuario lo recibió con el nuevo estatus**
- [x] `notifyAdmins('admin:order_updated')` para el "Socket Live" del Kanban (CMS-FE-04) — **probado: el socket admin lo recibió**
- [x] Email transaccional encolado en BullMQ EN PARALELO — **probado: `email:order_status` capturado**
- [x] Persiste la notificación en la bandeja — **probado: `create` capturado**. Todo best-effort: nunca revierte el cambio de estatus.

### 32.2 — Motor de Social Proof / FOMO (C-02, REQ-BE-10, REQ-FE-32)
- [x] En `WebhookPaymentReconciliationUseCase`, tras orden → PAID: `broadcastPublic('social_proof:purchase', { displayName, municipality, productName })` — **probado: 2/2 conexiones públicas lo recibieron**
- [x] Anonimización real ("Roberto G." de Mérida): nombre + inicial + municipio + producto. **Probado: NO filtra email/userId/monto**
- [~] DECISIÓN DE DISEÑO: el broadcast vive en el **webhook (proceso API)**, donde residen las conexiones WS — el flujo primario de compra pagada. El path del worker de reconciliación (órdenes 100% monedero, `totalPaid=0`) queda documentado como caso menor sin FOMO por definición (no hay cobro de pasarela).

### 32.3 — Persistencia de Notificaciones (M-11, REQ-FE-24, REQ-FE-14)
- [x] Migración `016_notifications_schema.ts` (tabla `notifications` + índices `(user_id,is_read)` y `(user_id,created_at)`) — **aplicada a Supabase**
- [x] `INotificationRepository` + `NotificationRepository` (create, findByUser paginado, countUnread, markRead con aislamiento por usuario, markAllRead)
- [x] `GET /api/profile/notifications`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all` — **probados por HTTP (200/200/200, 401 sin token)**
- [x] `notifyUser` de estatus persiste ANTES de emitir (incluye `notificationId` en el evento)

### 32.4 — Verificación (EMPÍRICA, 15/15 PASS)
- [x] `WebSocketServer` real + sockets mock: broadcastPublic despacha a TODOS los públicos; notifyUser al usuario correcto; notifyAdmins a admins
- [x] Persistencia contra BD real: countUnread=3 → markRead → 2 → markAllRead → 0; aislamiento entre usuarios verificado
- [x] Endpoints HTTP con auth; 401 sin token
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 33 — Compliance de Registro + Búsqueda Enterprise (REQ-BE-08, REQ-FE-08, REQ-FE-12, REQ-BE-03) ✅ COMPLETADA Y PROBADA (2026-07-04)

> Cierra C-04, A-05, A-06. **Casillas marcadas SOLO con código probado empíricamente** (14/14 integración + HTTP).
> 🐛 **SEGUNDO BUG REAL ATRAPADO POR EL TESTING EMPÍRICO:** `GetProductsUseCase.execute` reconstruía `sanitizedQuery` a mano y **descartaba `minPrice`, `maxPrice` y `character`** → los filtros funcionaban en el test de repositorio pero la ruta HTTP los ignoraba en silencio. Detectado porque el smoke test HTTP mostró un producto de $250 pasando el filtro `maxPrice=200`. Corregido: el use case ahora propaga y sanitiza los filtros.

### 33.1 — Consentimiento y teléfono en el registro (C-04, A-06)
- [x] Migración `017_register_compliance.ts` (`privacy_accepted BOOLEAN NOT NULL DEFAULT false` + `privacy_accepted_at TIMESTAMPTZ`) — **aplicada a Supabase**
- [x] `RegisterUserDTO` extendido con `phone` obligatorio + validación (`InvalidPhoneError` → 422) — **probado: registro sin/con teléfono corto → 422**
- [x] `RegisterUserUseCase` persiste `privacy_accepted = true` + timestamp; pasa `phone` — **probado en BD: `privacy_accepted=true`, `privacy_accepted_at` timestamp real, `profiles.phone` lleno**
- [x] `UserRepository.createWithProfile` guarda privacidad + timestamp + teléfono (transacción atómica)

### 33.2 — Búsqueda con fuzzy + filtros (A-05, REQ-FE-12, REQ-BE-03)
- [x] Migración `018_fuzzy_search.ts`: `CREATE EXTENSION IF NOT EXISTS pg_trgm` + índice GIN trigram sobre `products.name` + columna `character` — **aplicada**
- [x] `GetProductsQueryDTO` + `character` (Personaje, columna en `products`)
- [x] `GetProductsQueryDTO` extendido: `minPrice`, `maxPrice`, `character`
- [x] Búsqueda combina FTS (`to_tsquery`) con `word_similarity > 0.3` (fuzzy); orden por relevancia — **probado: `word_similarity('pikchu','Pikachu Plush')=0.5`; "pikchu" encuentra "Pikachu Plush" por repo Y por HTTP**
- [x] Filtro `price >= minPrice` / `price <= maxPrice` — **probado por HTTP: maxPrice=200 excluye producto de $250; minPrice=200 lo incluye**
- [x] Filtro `character` case-insensitive — **probado: character=pikachu encuentra; character=Charizard excluye**

### 33.3 — Verificación (EMPÍRICA, 14/14 integración + 4/4 HTTP)
- [x] Registro sin teléfono → 422; sin privacidad → 422; con datos → `privacy_accepted=true`, `phone` lleno (verificado en BD)
- [x] Typo real "pikchu" encuentra "Pikachu Plush" (repo + HTTP)
- [x] `?character=&minPrice=&maxPrice=` acota correctamente por HTTP (tras corregir el bug de `GetProductsUseCase`)
- [x] Control negativo: término no relacionado NO matchea
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 34 — Hardening de Seguridad (REQ-SEC-09, REQ-SEC-10, REQ-BE-06) ✅ COMPLETADA Y PROBADA (2026-07-05)

> Cierra C-03, A-07, A-08, M-16. **Casillas marcadas SOLO con verificación empírica por curl contra Fastify.**

### 34.1 — 2FA INELUDIBLE para el CMS (C-03, REQ-SEC-09)
- [x] `AdminLoginUseCase`: si `!totpEnabled`, **NO emite JWT de 8h** → emite `setupToken` (scope `admin_2fa_setup`, 10m). Unión discriminada por `outcome`: `session` / `2fa_required` / `2fa_setup_required`
- [x] Nuevo `admin2faSetupMiddleware`: valida el `setupToken` para `/2fa/setup` y `/2fa/enable` (antes exigían sesión completa — imposible sin 2FA, chicken-egg). Rechaza cualquier scope distinto
- [x] **Probado por HTTP:** login de admin fresco → `requiresSetup:true` + `setupToken`, **SIN `accessToken`**; `/2fa/setup` con setupToken → otpauth OK; con token basura → 401

### 34.2 — Rate limit estricto en endpoints sensibles (A-07, REQ-SEC-10)
- [x] `STRICT_RATE_LIMIT` (5/min) vía `config.rateLimit` per-route (override del global), en: `POST /api/game/rewards/validate` (canje UUID), `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/otp/request`, `/api/auth/otp/verify`
- [x] **Probado por HTTP:** forgot-password → 5× 202, **6º intento → 429**

### 34.3 — CORS CERRADO por allowlist (A-08, REQ-BE-06)
- [x] Eliminado `origin: true`. `FRONTEND_URL` (env, multi-origen por coma) → función `origin` que valida contra la allowlist. Peticiones sin Origin (curl/webhooks) permitidas
- [x] **Probado por HTTP:** Origin `http://localhost:5173` (permitido) → cabecera `Access-Control-Allow-Origin` presente; Origin `http://evil.com` → **SIN ACAO** (navegador bloquea)

### 34.4 — JSON Schema declarativo (M-16, REQ-BE-06)
- [x] `schema.body` (Fastify/ajv) en `POST /api/auth/register`, `POST /api/checkout`, `POST /api/admin/orders/:id/refund` (+ schema de donate disponible). Archivo `schemas/validationSchemas.ts`
- [x] La validación corre en la fase `validation` (antes de `preHandler`) → **probado: checkout con body inválido SIN token → 400 del schema, no 401** (el body nunca llega al Use Case)

### 34.5 — Verificación (EMPÍRICA por curl)
- [x] Admin sin 2FA NO obtiene sesión operativa (login → setupToken, no accessToken)
- [x] 6º intento en endpoint estricto en 1 min → 429
- [x] `Origin` no permitido → sin cabeceras CORS
- [x] JSON roto → 400 (`FST_ERR_CTP_INVALID_JSON_BODY`); campos faltantes → 400 (`FST_ERR_VALIDATION`); antes de la lógica
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 35 — Cierre Operativo del CMS (CMS-FE-16, CMS-FE-02, CMS-FE-18, REQ-BE-07, CMS-FE-06) ✅ COMPLETADA Y PROBADA (2026-07-05)

> Cierra A-10, M-12, M-13, M-14, M-15, M-17. **17/17 checks E2E + EXPLAIN + HTTP.** Última fase funcional bloqueante.

### 35.1 — Monitor Global de Inventario (A-10, CMS-FE-16)
- [x] `AdminInventoryRepository.findAllVariantsPaginated(page, limit)` con estatus derivado — **probado: stock 0→AGOTADO, 3→STOCK_BAJO, 20→ACTIVO**
- [x] `GET /api/admin/inventory?page=&limit=` (server-side pagination) — probado: limit=2 devuelve 2, total>2; ruta protegida (401 sin auth)

### 35.2 — Listado admin de productos (M-15, CMS-FE-06)
- [x] `GET /api/admin/products?page=&includeDeleted=` — **probado: includeDeleted=false excluye descontinuados; true los incluye**

### 35.3 — Analytics con rango de fechas (M-12, CMS-FE-02)
- [x] `getDashboardSummary(range?)` con `.$if` (preserva tipado Kysely); controller parsea `?start=&end=` — **probado: rango futuro → 0 ingresos/pedidos (el filtro aplica)**

### 35.4 — Reportes completos (M-13, CMS-FE-18)
- [x] `ReportType` + `inventory` y `audit`; `format: csv|json`; `startDate/endDate` en payload, queries y worker; download detecta .csv/.json — **probado: inventory CSV (encabezado sku/stock), audit JSON (array válido)**

### 35.5 — Envío gratis dinámico por Tier (M-14, REQ-BE-07, REQ-FE-14)
- [x] `getTierShippingMultiplier(tier)` desde `system_settings` (seed migración 019: SILVER 0.9, GOLD 0.75, PLATINUM 0.5; BRONZE 1.0). `ProcessCheckoutUseCase` inyecta `IUserRepository`, lee tier del perfil, `umbral_efectivo = base * multiplicador`
- [x] **Probado: base=2000, GOLD efectivo=1500; un subtotal intermedio da envío gratis a GOLD pero no a BRONZE**

### 35.6 — Índices de rendimiento (M-17)
- [x] Migración `019_performance_indices.ts`: `idx_orders_stripe_payment_intent_id`, `idx_wallet_transactions_order_id`, `idx_order_items_variant_id` (idx_orders_user_id ya existía) — **aplicada a Supabase**
- [x] **EXPLAIN confirmó empíricamente: `Index Scan using idx_orders_stripe_payment_intent_id on orders`** para la query exacta del webhook

### 35.7 — Verificación (EMPÍRICA, 17/17 + EXPLAIN + HTTP)
- [x] Inventario pagina variantes con estatus; productos listables con/sin descontinuados
- [x] `analytics/summary` acota por rango de fechas
- [x] Reportes inventory (CSV) y audit (JSON) se generan correctamente
- [x] GOLD alcanza envío gratis con subtotal menor al base
- [x] `EXPLAIN` del webhook usa el índice de `stripe_payment_intent_id`
- [x] Rutas admin nuevas protegidas (401 sin token)
- [x] `npx tsc --noEmit` → 0 errores

---

## Fase 36 — Resiliencia de Pagos + Métodos de Pago (A-09, REQ-FE-18) 🟧

> Cierra A-09 y REQ-FE-18. Puede correr en paralelo al Frontend si dirección lo aprueba.

### 36.1 — Sweeper de pagos huérfanos (A-09)
- [ ] Worker `payment-sweeper.worker.ts`: cada N min, órdenes `PAYMENT_PENDING` con `created_at` > 15 min
- [ ] Consultar Stripe el PaymentIntent real; `succeeded` → reconciliar (PAID + XP + social proof); `canceled` → CANCELLED (liberar stock)
- [ ] Idempotente respecto al webhook

### 36.2 — Métodos de pago guardados (REQ-FE-18, PCI)
- [ ] Stripe Customer + `SetupIntent`
- [ ] `GET /api/profile/payment-methods` → marca + últimos 4 + expiración (nunca PAN)
- [ ] `DELETE /api/profile/payment-methods/:id`; alertas de expiración próxima

### 36.3 — Verificación
- [ ] Webhook perdido simulado → sweeper lleva la orden a PAID
- [ ] Tarjeta guardada aparece con marca + últimos 4
- [ ] `npx tsc --noEmit` → 0 errores

---

> **Re-certificación:** solo tras completar Fases 32–35 (36 puede diferirse con aprobación) el backend podrá declararse *Production-Ready y Frontend-Ready*. Ver `MD/Auditoria_Final_Paranoica.md`.


---

# ══════════════════════════════════════════════════════════
# FRONTEND — Integración detallada de la UI existente con el Backend
# (ver `MD/Frontend_Integration_Plan.md`)
# ══════════════════════════════════════════════════════════

> **Alcance:** conectar la UI YA existente (`Plantilla_Prototipos_UI_UX/`: Vite + React 18 + Tailwind CDN + lucide-react) con el backend Fastify. **No se rediseña la UI.**
> **Formato de cada subtarea:** `[Componente del prototipo] · [Store Zustand] · [Endpoint /api/...]`.
> **Regla inflexible:** nada se marca `[x]` sin renderizar con datos REALES del backend / la mutación responder (verificación empírica).

### Stores Zustand (definidos una vez, referenciados en todo el bloque)
- **Storefront:** `authStore` (accessToken en memoria, user, isAuthenticated), `cartStore` (ítems/cantidades/totales), `uiStore` (modales/drawers/toasts), `checkoutStore` (dirección, envío, cupón, monto monedero, idempotencyKey), `notificationStore` (feed + contador no leídas).
- **CMS:** `adminAuthStore` (sesión admin + estado del flujo 2FA), `cmsUiStore` (sidebar colapsable, breadcrumbs, command palette).
- **Realtime:** el cliente WS actualiza estos stores + invalida React Query.

---

## Fase 37 — Reestructurar el proyecto Vite existente ✅ COMPLETADA Y VERIFICADA (2026-07-05)
> Puramente estructural. Tailwind (CDN) y Lucide se mantuvieron idénticos. Cero rediseño. Corte byte-a-byte por script (rangos exactos de línea) → markup intacto.

### 37.1 — Router y arranque
- [x] `react-router-dom@6` instalado; `src/App.jsx` con rutas `/admin/*`→AdminApp y `/*`→StoreApp. `prototipe_CMS.jsx` enganchado (antes huérfano)
- [x] `main.jsx` monta `<App/>` dentro de `<BrowserRouter>` (ya no importa `landing_page.jsx`)

### 37.2 — Subdividir el Storefront en `src/pages/store/`
- [x] `LandingView`→`LandingPage.jsx`, `StoreView`→`StorePage.jsx`, `ProductView`→`ProductPage.jsx`, `ProfileDashboard`→`ProfilePage.jsx`, `LegalView`→`LegalPage.jsx` + `StoreApp.jsx` (AnimayuksWeb) — JSX idéntico, imports ajustados

### 37.3 — Subdividir el CMS en `src/pages/admin/`
- [x] 12 vistas → `*Page.jsx` (`DashboardPage, KanbanPage, CatalogPage, InventoryPage, CrmPage, CouponsPage, MediaPage, GameBridgePage, SettingsPage, AuditPage, DonationsPage, LegalAdminPage`) + `AdminApp.jsx`

### 37.4 — Extraer componentes
- [x] `src/components/store/`: `MobileMenu, Footer, AuthModal, CheckoutAddressModal, OtpModal, DonationModal, ProfileDrawer` (+ reutiliza `home/*, cart/CartDrawer, layout/Header` ya extraídos)
- [x] `src/components/admin/`: `AdminLayout` (sidebar+breadcrumbs, importa las 12 vistas), `GlobalStyles`, `LoginScreen`
- [~] `src/components/common/` (átomos genéricos Modal/Button/Card/DataGrid…): **DIFERIDO a propósito**. Extraer átomos exige reemplazar clases Tailwind inline en el markup, lo que VIOLARÍA el mandato de "integridad visual absoluta" de esta fase. Se hará de forma natural al construir la UI en fases posteriores.

### 37.5 — Verificación (EMPÍRICA con navegador de preview)
- [x] `npm run build` OK — **1290 módulos transformados, 0 errores** (prueba que TODOS los imports resuelven)
- [x] `/` (Store) renderiza **píxel-idéntico**: Hero+banner de juego, header (carrito "0"), banner de cookies, botón de donación flotante — sin errores de consola
- [x] `/admin` (CMS) LoginScreen renderiza idéntico; tras login, `AdminLayout` monta con sidebar agrupado + breadcrumbs + las 12 vistas (SettingsView por defecto) — sin errores de consola
- [x] Originales `landing_page.jsx` / `prototipe_CMS.jsx` conservados como referencia congelada (ya no importados)

---

## Fase 38 — Capa de Datos, Sesión y Stores ✅ COMPLETADA Y VERIFICADA (2026-07-05)
> Verificada EMPÍRICAMENTE en el navegador contra el backend real: login, token-en-memoria, bootstrap tras recarga y silent refresh con 3 peticiones concurrentes.

### 38.1 — Dependencias y entorno
- [x] `axios`, `@tanstack/react-query`, `zustand` instalados (react-router-dom ya de Fase 37); `.env` con `VITE_API_URL=http://localhost:3000`, `VITE_WS_URL`; `http://localhost:5173` ya en `FRONTEND_URL` del backend (default Fase 34)

### 38.2 — Cliente HTTP (`src/lib/api.js`)
- [x] Instancia Axios (`baseURL=VITE_API_URL`, `withCredentials: true`); request interceptor añade `Authorization: Bearer` desde `authStore` (memoria)
- [x] Response interceptor **silent refresh** en 401 → **una sola** `POST /api/auth/refresh` → **encola las concurrentes** y las reintenta con el token nuevo; fallo → `authStore.logout()`. **Probado: token saboteado + 3 GET concurrentes → 3× 200 tras un refresh**
- [x] **Bootstrap** (`bootstrapSession`) en el montaje de `App.jsx` → restaura sesión desde la cookie. **Probado: recarga borra el token en memoria y el bootstrap lo restaura + repobla el usuario**
- [x] `unwrap()` normaliza el envelope (`{statusCode,message,data}` y `{success,data}`). **Bug atrapado y corregido:** `GET /api/profile` responde anidado `{user,profile,wallet}` → se aplana a la forma del login
- [x] ❌ Sin CSRF token: no se añade ninguna cabecera `X-CSRF-Token` (Bearer + cookie SameSite=strict)

### 38.3 — Stores Zustand (`src/store/`)
- [x] `authStore` (accessToken **estrictamente en memoria**, sin `persist`), `cartStore`, `uiStore`, `checkoutStore`, `notificationStore`. **Probado: token NO en localStorage; cookie de refresh NO visible en JS (HttpOnly)**
- [~] `adminAuthStore` / `cmsUiStore`: se crearán al conectar el CMS (Fase 47) — el CMS aún no consume la API

### 38.4 — TanStack Query
- [x] `QueryClientProvider` en `main.jsx` con `queryClient` (`src/lib/queryClient.js`). `src/api/` (hooks por dominio) y `src/lib/ws.js` se poblarán al conectar vistas (Fases 39+/54)

### 38.5 — Verificación (EMPÍRICA en navegador, backend real)
- [x] Login real → `accessToken` en memoria + `user` poblado; cookie refresh HttpOnly (no visible en JS); token NO en localStorage
- [x] Recarga → bootstrap silent refresh restaura token + usuario (`isAuthenticated: true`)
- [x] 401 → silent refresh único con cola de 3 concurrentes → todas 200 con token renovado
- [x] Store `/` y CMS `/admin` siguen renderizando **píxel-idénticos** (providers no afectan el visual); 0 errores de consola
- [x] `npm run build` OK (479 kB)

---

## Fase 39 — Storefront: Layout Global + Landing Page 🔶 PARCIAL — conexiones de datos hechas y probadas (2026-07-05)
> Verificado EMPÍRICAMENTE en navegador: banner sembrado en BD aparece en el Hero; producto real de BD aparece en TrendingTop; mock eliminado; diseño píxel-idéntico; 0 errores. Hooks en `src/api/`.

### 39.2 — Hero Carousel (REQ-FE-01) ✅
- [x] `[HeroCarousel]` ← hook `useBanners` (`src/api/banners.js`) · React Query · `GET /api/content/banners`. **Probado: el banner "BANNER FASE 39 (desde BD)" sembrado en la BD se renderiza en el Hero.** Si no hay banners activos, se conserva el diseño por defecto (fallback)
- [~] NOTA de modelo: el banner del backend (title/imageUrl/linkUrl) es más simple que el diseño del prototipo (video/accent/desc); esos campos usan defaults del prototipo. El CTA sigue siendo Google Play por diseño (no se toca)

### 39.3 — Top Ventas Físicas (REQ-FE-02) ✅
- [x] `[TrendingTop]` ← hook `useTopProducts` (`src/api/products.js`) · React Query · `GET /api/products/top-sales`. **Probado: producto real "Producto E2E Animayuks" ($299.99, categoría real) se renderiza; mock "Playera Élite v."/"$450" eliminado; diseño del marco intacto.** Carga graciosa: grilla vacía hasta que llega la data (sin romper la maqueta)
- [x] Click en tarjeta → `navigate('product', product.id)`; add-to-cart usa `product.price`
- [x] ⚠️→✅ `top-sales` usa **caché Redis** (Fase 28). **Deuda saldada en Fase 40:** `getTopProducts` ahora degrada elegantemente a la BD (timeout de lectura 500ms + warning en log) en vez de colgarse si Redis está caído. Verificado con Redis apagado: HTTP 200 en ~1.3s con datos de la BD + warning "degradando a la BD"

### 39.1 / 39.4 — Layout, Footer, secciones narrativas, Quick Nav — PENDIENTE
- [ ] `[Header]`/`[MobileMenu]` wiring a `cartStore`/`authStore`: **DIFERIDO a Fases 42 (carrito) / 43 (auth)** para no desincronizar el carrito mock actual
- [ ] `[Footer]` (REQ-FE-06) ← `GET /api/content/legal/:slug` (títulos)
- [ ] Botón de retroceso (REQ-FE-34) · `[AboutExperience]` (REQ-FE-03) · Lore/YouTube (REQ-FE-04) · `[CharacterGrid]`/`[FlipCard]` (REQ-FE-05) · Quick Nav (REQ-FE-33) — en su mayoría estáticos, sin backend

### 39.5 — Verificación (EMPÍRICA en navegador, backend real)
- [x] Banner de BD en el Hero; producto real en TrendingTop (nombre+categoría+precio); mock eliminado
- [x] Diseño píxel-idéntico (marco de madera, botones, decoración intactos); 0 errores de consola
- [x] `npm run build` OK (491 kB)

---

## Fase 40 — Storefront: Autenticación del Cliente ✅ (E2E real en navegador, 2026-07-05)
> Todo probado EMPÍRICAMENTE contra el backend real (DB Supabase + Redis efímero). Toasts, estados de carga y sesión verificados vía DOM en un navegador real. 0 errores de consola. `npm run build` OK (496 kB).
> **Bug propio hallado y corregido:** el interceptor de silent-refresh secuestraba los 401 de endpoints públicos (login con credenciales malas) → intentaba refrescar, fallaba y destruía el error real disparando un logout en cascada. Fix en `src/lib/api.js`: solo se refresca si la petición llevaba Bearer (`hadBearer`), porque un 401 de un endpoint sin token es resultado de negocio, no token vencido.
> **Backend a prueba de balas (previo):** `ProductController.getTopProducts` ahora degrada elegantemente a la BD si Redis no responde (timeout 500ms + warning), no se cuelga (deuda de Fase 39 saldada).

### 40.1 — Login (REQ-FE-07) ✅
- [x] `[AuthModal]` (login) · `useMutation`→`login()` (Axios) · `POST /api/auth/login` → guarda accessToken **en memoria** (`authStore`) + user; el refresh queda en cookie HttpOnly. **Probado: login correcto → toast "Bienvenido de vuelta, Fase", store poblado (accessToken+user+isAuthenticated), modal se cierra solo.**
- [x] Estado de carga: botón `disabled` + spinner `Loader2` + texto "Ingresando..." durante la petición (capturado en vivo)
- [x] Error legible: contraseña mala → **401** → toast rojo "Las credenciales proporcionadas son inválidas." (capturado en vivo)
- [~] "Continuar con Google" (OAuth): se mantiene el botón; el redirect a `GET /api/auth/oauth/google` queda **DIFERIDO** (requiere credenciales de Google configuradas; no probable sin ellas)

### 40.2 — Registro + compliance (REQ-FE-08) ✅
- [x] `[AuthModal]` (registro): Nombres, Apellidos, Correo, **Teléfono**, Contraseña, Confirmar, **checkbox legal obligatorio** (el diseño Tailwind ya tenía teléfono y checkbox — no se tocó el markup) · `useMutation` · `POST /api/auth/register` con `phone` + `termsAccepted:true` (backend Fase 33 setea `privacy_accepted`+timestamp)
- [x] Validación cliente: contraseñas no coinciden / checkbox sin marcar → toast, no se llama al backend
- [x] **Probado E2E: registro desde el navegador → 201 → toast éxito → cambia a login con el correo precargado; el usuario creado ENTRA por login (200, perfil correcto) confirmando persistencia con teléfono+privacidad.** Duplicado → **409**; teléfono corto → **422** (curl)

### 40.3 — Recuperación de contraseña (REQ-FE-10) ✅ parcial
- [x] `[AuthModal]` (recover) · `useMutation` · `POST /api/auth/forgot-password`. **Probado: submit → 202 → toast neutro "Si el correo existe, te enviamos un enlace de recuperación." (ANTI-ENUMERACIÓN: idéntico exista o no el correo, verificado por curl).**
- [ ] Vista reset con token del enlace (`POST /api/auth/reset-password`): **DIFERIDA** — es una ruta profunda (`/reset-password?token=`) que llega por email; se implementará como página dedicada cuando montemos el enrutado de recuperación

### 40.4 — Sesión ✅
- [x] `[ProfileDrawer]` (Cerrar Sesión) → `logout()` real · `POST /api/auth/logout` + limpia `authStore`. **Probado: store vaciado (user null, sin token).**
- [x] **Header reactivo a la sesión REAL:** `isLoggedIn` se deriva de `authStore` (antes era un `useState` mock). **Probado: badge del avatar aparece ("3") logueado ↔ desaparece al salir.** Diseño del Header intacto (solo se hizo real el flag que ya condicionaba el estilo)
- [x] **Bootstrap (recarga):** al recargar, el token en memoria se pierde y se restaura vía silent refresh leyendo la cookie HttpOnly + `GET /api/profile`. **Probado: tras recargar, sesión restaurada con perfil completo (incl. teléfono y wallet) y token de vuelta en memoria** → mitigación anti-XSS validada de punta a punta
- [~] OTP de 6 dígitos (`[OtpModal]`): **DIFERIDO a la Fase de Perfil (43-45) a propósito.** El OTP del backend (`/api/auth/otp/request` + `/verify`, ambos **requieren JWT**) es para **autorizar cambios de email/teléfono de un usuario ya autenticado** (REQ-FE-16), NO para recuperar contraseña. Su disparador vive en el perfil; cablearlo aquí sería incorrecto. La recuperación real es el enlace mágico (forgot → email → reset), no un OTP
- [~] OAuth callback (`/oauth/google/callback`): diferido junto con el botón de Google (40.1)

### 40.5 — Verificación (EMPÍRICA, navegador + backend real)
- [x] Registro 201 (UI) y 422 sin teléfono (curl); duplicado 409; login setea sesión y cierra modal; logout limpia; recuperación 202 anti-enumeración; bootstrap restaura sesión; badge del Header reactivo; 0 errores de consola; `npm run build` OK

---

## Fase 41 — Storefront: Catálogo, Búsqueda y Vista de Producto ✅ (E2E real en navegador, 2026-07-05)
> Verificado EMPÍRICAMENTE con producto sembrado en la BD ("Playera Pikachu Edición Retro", $450, character Balam, tallas S:8/M:5/L:0) — sembrado y borrado tras las pruebas. 0 errores de consola. `npm run build` OK.

### 41.1 — Explorador de productos (REQ-FE-11) ✅ parcial
- [x] `[StorePage]` grid dinámico · `useProducts` (React Query, `placeholderData: keepPreviousData` → cero parpadeo al filtrar) · `GET /api/products?limit=24`. **Probado: la grilla renderiza los 3 productos reales de la BD con nombre/categoría/precio reales; diseño de tarjeta intacto**
- [ ] Paginación/infinite scroll: **DIFERIDO** — el prototipo no tiene control de paginación y el catálogo actual (2 productos) no permite probarlo empíricamente; se implementará (sentinel invisible + `useInfiniteQuery`) cuando haya catálogo real

### 41.2 — Filtros combinables (REQ-FE-12) ✅
- [x] Categoría (desde `GET /api/products/categories`, lista real + "Todas") · Personaje (sección NUEVA clonando píxel a píxel el patrón de Categoría; personajes de marca Fango/Lolita/Mila/Balam) · Precio Máx (slider con **debounce 350ms**: 4 movimientos → **1 sola petición**)
- [x] **Probado combinando:** Balam→solo Pikachu; Balam+Coleccion E2E→intersección vacía (correcto); solo Coleccion E2E→solo Producto E2E; maxPrice=200→solo el de $150. Slider en tope = "Sin límite" (no manda `maxPrice`, no excluye productos caros)
- [x] Ordenar: Relevancia / Precio asc / desc → `sortBy=price&sortOrder=`. **Probado: $150→$450 y $450→$150**
- [x] Búsqueda del toolbar (debounced) también fuzzy: typo "anmayuks" encontró "Producto E2E Animayuks"

### 41.3 — Omnibox Predictivo + Cmd/Ctrl+K (REQ-FE-12 V10/V10.1) ✅
- [x] `useProductSearch` + `useDebounce(350ms)` (`src/hooks/useDebounce.js`) · `GET /api/products?search=&limit=5`. **Probado tecleando "pikchu" letra a letra (6 teclas, 60ms/tecla): UNA sola petición `search=pikchu` y el dropdown mostró "Playera Pikachu Edición Retro" → fuzzy pg_trgm de la Fase 33 brillando en la UI**
- [x] Dropdown real: miniatura (imageUrl o ícono), nombre, precio ($450.00), badge "Skin Incluida" solo si `hasVirtualReward`, mini-add al carrito, click→detalle. Listener global Cmd/Ctrl+K ya existía (useHeaderNav)

### 41.4 — Vista de Producto (REQ-FE-31) ✅ (sin WebAR)
- [x] `[ProductPage]` · `useProductDetail` · `GET /api/products/:id` → nombre/descripcion/precio/categoría reales + **variantes con STOCK real**: label "Seleccionar Talla · 5 disponibles"/"· Agotada", talla agotada con `opacity-40` + tooltip "Stock: N", preselección de la primera talla CON stock
- [x] **Probado: talla L (stock 0) → toast error "Talla agotada. Elige otra disponible."; talla S (stock 8) → "Agregado con éxito"**. Bloque "Recompensas" muestra "Skin del juego incluida" solo si `hasVirtualReward`
- [ ] **WebAR "Ver en mi espacio": DIFERIDO con causa** — el backend NO tiene campo de modelo 3D en `Product` (no hay "archivo disponible" que consultar) y el prototipo dividido no trae el botón AR. Requiere primero decidir el campo `model_url` en la BD/CMS

### 41.5 — Verificación (EMPÍRICA, navegador + BD real)
- [x] Typo "pikchu" encuentra "Pikachu" EN EL NAVEGADOR con 1 sola petición (debounce); filtros acotan y se combinan; detalle con variantes/stock reales y guard de agotado; captura de tarjeta real (Skin Incluida · $450.00); seed limpiado; 0 errores consola; `npm run build` OK
> Cambios visuales conscientes (divulgados): precio tachado falso ($550) eliminado (no hay dato de descuento en la BD; inventarlo sería mentir al cliente); chips mock S/M/L de la tarjeta reemplazados por badge real "Skin Incluida" (la lista no trae variantes); texto "Algolia" del omnibox → "Búsqueda Predictiva" (marca falsa); sección "Personaje" añadida clonando el patrón exacto de Categoría (directiva explícita REQ-FE-12)

---

## Fase 42 — Storefront: Carrito y Checkout ✅ (E2E real; Stripe SIMULADO — ver deuda ⚠️)
> E2E completo en navegador contra la BD real (2026-07-05): PDP→carrito→dirección→pago simulado→**orden verificada en `orders` por psql**. 0 errores consola. `npm run build` OK.

### ⚠️ DEUDA PENDIENTE — STRIPE REAL (bloqueada por claves)
> La `STRIPE_SECRET_KEY` del `.env` es un **placeholder inválido** (Stripe responde 401) y NO existe `pk_test_` para el frontend. Con autorización del usuario se implementó **pago simulado**. Al conseguir las claves (dashboard.stripe.com → modo Test → API keys):
> - [ ] Backend: poner `STRIPE_SECRET_KEY` real y **`PAYMENTS_SIMULATED=false`** en `.env` (el Composition Root vuelve a `StripeAdapter` solo; borrar `SimulatedPaymentAdapter.ts` si se quiere)
> - [ ] Frontend: `npm i @stripe/stripe-js @stripe/react-stripe-js`, `VITE_STRIPE_PUBLISHABLE_KEY` en `.env`, y en `PaymentModal.jsx` reemplazar los inputs ficticios por `<Elements>` + `<PaymentElement>` + `stripe.confirmPayment` (3DS) — **todos los puntos de inyección están marcados con `// TODO: STRIPE`** (PaymentModal.jsx, api/checkout.js, main.ts, SimulatedPaymentAdapter.ts, .env)
> - [ ] Vaciar carrito SOLO si `confirmPayment` resuelve sin error (hoy: con el 201 del backend) · probar 4242+3DS · webhook → orden PAID
> - [ ] Verificar doble-submit con la misma Idempotency-Key (no duplica orden)

### 42.1 — Cart Drawer (REQ-FE-13) ✅
- [x] `[CartDrawer]` ← `cartStore` REAL (mock `cartTotal` **eliminado de los 7 componentes**): líneas reales (nombre/talla/cantidad/importe), botón eliminar, subtotal, IVA **desglosado** (los precios son IVA-incluido y el backend no lo suma — antes el mock lo sumaba doble), badge del Header = piezas reales. **Probado: agregar la misma talla 2 veces → 1 línea `x2` (no duplica); badge 0→2→3→0**
- [x] Quick-add desde grilla/TrendingTop/Omnibox → `quickAdd()` resuelve `GET /api/products/:id` y agrega la 1ª variante CON stock (el checkout exige `variantId`)
- [~] Alerta "Solo quedan X": diferida (el listado no expone stock; el PDP ya muestra disponibles/Agotada)

### 42.2 — Registro Progresivo / Dirección (REQ-FE-09) ✅
- [x] `[CheckoutAddressModal]` → `POST /api/profile/addresses` real · CP autocompleta Estado/Municipio (97xxx→Yucatán/Mérida) · se añadieron campos **Colonia** y **Número Exterior** (los exige `CreateAddressDTO`; mismo diseño). **Probado: dirección creada, `addressId` al `checkoutStore`, snapshot correcto en la orden**
- [x] Si el usuario YA tiene dirección (`GET /api/profile/addresses`, default primero) el checkout salta directo al pago

### 42.3 — Envío dinámico por Tier (REQ-FE-13 + M-17) ✅
- [x] **NUEVO endpoint backend público `GET /api/checkout/config`** (GetPublicCheckoutConfigUseCase): umbral, costos y `tierMultipliers` desde `system_settings` — el frontend ya no hardcodea el umbral. **Probado con usuario GOLD: umbral $2000×0.75=$1500 → barra "Faltan $200.00" con subtotal $1300 + nota "Beneficio GOLD"; al llegar a $1950 → "¡Felicidades!" y envío ¡GRATIS!; el backend coincidió: `shipping_cost 0.00` en la orden**
- [x] CP 97000 → "Envío Local: Llega hoy mismo"; costos Local/Foráneo desde la config real ($50/$150)

### 42.4 — Checkout + Pago (REQ-FE-30, REQ-BE-01/02) ✅ (simulado)
- [x] Checkbox legal OBLIGATORIO: botón "Proceder al Pago" `disabled` hasta marcarlo (probado)
- [x] `POST /api/checkout` con **`X-Idempotency-Key` = UUID** (`crypto.randomUUID()`) + `items/addressId/termsVersion` → 201 con `{orderId, status, totalPaid, stripeClientSecret}`
- [x] `[PaymentModal]` (nuevo, diseño del sistema de modales): formulario de tarjeta FICTICIO + botón "Pagar (Simulado)" + banner "⚠ MODO SIMULADO" · backend con `PAYMENTS_SIMULATED=true` inyecta `SimulatedPaymentAdapter` (puertos y adaptadores: cero cambios en el Use Case) · **carrito se vacía SOLO en el éxito** · pantalla de confirmación con orderId real
- [ ] Stripe `PaymentElement` + `confirmPayment` (3DS) — **PENDIENTE por claves** (ver deuda arriba)

### 42.5 — Verificación (EMPÍRICA, navegador + psql)
- [x] Orden `7821b242...` verificada EN LA BD: status PAYMENT_PENDING, subtotal 1950, **shipping_cost 0.00 (tier GOLD)**, delivery LOCAL, dirección snapshot, terms 1.0, idempotency_key ✓, `pi_sim_...`, item Hoodie M **x3**, **stock 10→7**, **3 reward_codes** (skin) — seed y orden limpiados tras la prueba; tier revertido
- [x] 0 errores de consola · `npm run build` OK

---
## Fase 43 — Storefront: Perfil (1/3) — Drawer XP · Pedidos · Recompensas ✅ (E2E real, 2026-07-06)
> Probado en navegador contra la BD real (escenario: 2 órdenes vía checkout API, XP=300, 2 notifs no leídas — todo sembrado y limpiado). `npm run build` OK.
> **Backend ampliado:** `GET /api/profile` ahora incluye `gamification:{silver/gold/platinumThreshold}` (GetProfileUseCase + ISystemSettingsRepository) — la barra de XP no hardcodea umbrales.
> **Bug hallado y corregido en la prueba:** `GET /api/profile/orders` es PAGINADO (`{data:[...],total,...}`), el hook asumía array plano → crash `orders.filter is not a function`; fix: normalización en `useOrders` (src/api/profile.js).
> ⚠️ REGLA REAL de cancelación: el backend (`CancelOrderUseCase`, REQ-FE-23) solo permite cancelar en **PAID** — no en PAYMENT_PENDING/PREPARING. El botón sigue esa regla.

### 43.1 — Quick Profile Drawer + Barra de XP/Tier (REQ-FE-14) ✅
- [x] `[ProfileDrawer]` REAL: nombre+email reales, avatar por seed del email, chip de tier real ("Rango Bronce 🥉"; mapa BRONZE/Plata/Jaguar 🐆/Kukul), saldo del monedero real · `GET /api/profile`
- [x] **Barra de XP dinámica** (`src/lib/gamification.js`): **probado con XP=300 → "300 / 500 XP", barra al 60% exacto, hint "200 XP para desbloquear Rango Plata"** — umbrales reales de system_settings (500/2000/5000)
- [x] Badge de no leídas ← `notificationStore` (sincronizado por `useUnreadCount` desde `GET /api/profile/notifications/unread-count`). **Probado: 2 notifs sembradas → badge "2"** (drawer y tab del dashboard); oculto si 0
- [x] Menú de navegación (ya existía; navega al dashboard)

### 43.2 — Tab Pedidos: lista + sub-pestañas ✅
- [x] Sub-tabs con conteos REALES ("Pedidos Activos (2)" / "Historial Finalizados (0)"), tarjetas reales (#ID corto, fecha es-MX, nº artículos, total, chip de estado traducido, thumbnail si existe) · `GET /api/profile/orders` (paginado→normalizado). Estados activos: PAYMENT_PENDING/PAID/PREPARING/SHIPPED/DELIVERING; historial: DELIVERED/CANCELLED/NEEDS_RECONCILIATION. Detalle accesible desde ambas listas; estados vacíos con mensaje sobrio

### 43.3 — Timeline de Última Milla ✅
- [x] Timeline 5 pasos desde el ESTADO REAL (mapa PAID=1…DELIVERED=5; PAYMENT_PENDING=0 sin progreso) · `GET /api/profile/orders/:id`. **El simulador mock de estatus [1-5]+Foráneo se ELIMINÓ** (el estado ya no se finge). Chofer/guía desde campos reales (`driverName/trackingCompany...`, "Por asignar" si null); Foráneo = `deliveryType===EXTERNAL_COURIER`; items reales (nombre, xN, precio, SKU)
- [x] **Cancelar probado E2E:** orden real puesta en PAID (simulando el webhook) → botón visible SOLO en PAID → click → "Cancelando..." → toast éxito → **Activos 2→1, Historial 0→1 con chip CANCELADO → psql confirma `status=CANCELLED`** + refund del gateway invocado (simulado). Errores del backend → toast legible
- [x] Botón "Factura CFDI" visible solo en DELIVERED (placeholder, sin endpoint CFDI)

### 43.4 — Tab Recompensas (REQ-FE-22) ✅
- [x] Tarjetas reales · `GET /api/profile/rewards`: **UUID real de la BD renderizado (`2b0811d4-...`, generado por la compra del producto con skin)**, nombre del producto, badge "Disponible" (🟢) vs tarjeta gris "Canjeado/Revocado"; estado vacío con invitación a comprar
- [x] Botón copiar → `navigator.clipboard.writeText` + fallback `execCommand`; **degradación elegante verificada** (toast de error controlado). ⚠️ El happy path del portapapeles exige foco/gesto humano real — imposible de automatizar en el harness (writeText: "Document is not focused"); el pipeline click→handler→toast quedó probado

### 43.5 — Verificación
- [x] Todo lo anterior contra BD real; seed limpiado (órdenes, productos P43, dirección, notifs, XP→0); `npm run build` OK

---

## Fase 44 — Storefront: Perfil (2/3) — Monedero · Cupones · Wishlist ✅ (E2E real, 2026-07-06)
> Probado en navegador contra la BD real (seed: 2 productos con/sin stock, cupón FASE44 20% expirando en 2h15m, wallet $350 con 2 transacciones — todo limpiado al final). 0 errores consola. `npm run build` OK.
> **Backend ampliado (2):** `GET /api/profile/coupons` (GetAvailableCouponsUseCase: activos+no expirados+con usos; expone code/descuento/mínimo/expiresAt, NO usos internos) · Wishlist con **`totalStock`** agregado (subconsulta SUM de variantes en WishlistRepository) para pintar "Agotado" sin N+1.

### 44.1 — Tab Monedero (Ledger) (REQ-FE-20) ✅ parcial
- [x] Saldo REAL en la tarjeta dorada (**$350.00 MXN** probado) + **caducidad REAL**: "Saldo expira el 06 de junio de 2027" desde `wallet.expiresAt` (ya no el string estático "12 meses"; fallback informativo si expiresAt es null)
- [x] Ledger real · `GET /api/profile/wallet/transactions` (paginado→normalizado): **DEPOSIT → VERDE "+$400.00" ("Reembolso Pedido Cancelado") · WITHDRAWAL → ROJO "−$50.00" ("Aplicado a Compra")** — mapeo por `type`, concepto por `source`, folio = orderId/id corto, fecha es-MX. Probado con ambos colores
- [ ] "Mis Aportaciones Sociales": **DIFERIDO** — el backend no expone "mis donaciones" (solo `POST /api/donate`); la tarjeta queda maqueta hasta añadir ese endpoint (Fase 46)

### 44.2 — Tab Cupones (REQ-FE-21) ✅
- [x] Tarjetas de cupones VIGENTES reales (`GET /api/profile/coupons`): código, badge "% OFF"/"$ OFF" según `discountType`, "Compra mínima $X" real, y **cuenta regresiva VIVA desde `expires_at` de la BD** (`CouponCountdown`, tick 1s, formato días/HH:MM:SS, "EXPIRADO" al llegar a 0). **Probado: "02:11:41" → 3s después → "02:11:38"** (cupón sembrado con 2h15m)
- [x] Canje real · `POST /api/profile/coupons/redeem` con el **subtotal REAL del cartStore**. **Probado: FASE44 + carrito $480 → "20% de descuento (ahorras $96.00)" (cálculo del backend) · "NOEXISTE" → 404 "El cupón no existe"** · botón con estado "Validando..."

### 44.3 — Tab Wishlist (REQ-FE-19) ✅
- [x] Grid real con **stock en vivo** (`totalStock` backend): **probado — Sudadera (stock 5) tarjeta normal + "Al Carrito"; Taza (stock 0) `grayscale` + "Sin Stock" deshabilitado**; imagen o ícono; estado vacío con invitación
- [x] **Ciclo completo add→delete probado E2E:** corazón del PDP (`POST /api/profile/wishlist`, nuevo handler con guard de sesión) → toast "Añadido a favoritos" → aparece en el tab → **trash (`DELETE /:productId`) → desaparece + psql confirma** que solo queda la Sudadera
- [x] "Al Carrito" → `quickAdd` (1ª variante con stock) → **badge del carrito 0→1 probado**

### 44.4 — Verificación
- [ ] Ledger real con ingresos/egresos + aviso de caducidad; redimir cupón real (o error si inválido); wishlist add/remove real con stock; `npm run build` OK

---

## Fase 45 — Storefront: Perfil (3/3) — Direcciones · Seguridad/OTP · Notificaciones · Pagos ✅ (E2E real, 2026-07-06)
> Probado en navegador contra la BD real. 0 errores consola. `npm run build` OK. Seed limpiado (notifs, direcciones, phone restaurado, otp_codes).

### 45.1 — Tab Libreta de Direcciones (REQ-FE-17) ✅
- [x] CRUD REAL probado: **crear ×2** (form del tab completado con Etiqueta/Colonia/Nº Ext/Calle/Referencias — el mock solo tenía CP; autocompletado 97xxx→Yucatán/Mérida, foráneo→Nacional) → **⚙ marcar principal (PATCH /:id/default): el badge PRINCIPAL se movió de "Casa Norte" a "Oficina CDMX"** → **🗑 eliminar (DELETE): la tarjeta desapareció** → psql confirmó (solo Oficina, is_default=t). Estado vacío sobrio; 1ª dirección queda default automática (backend)
- [~] PUT (editar) no cableado — el diseño no tiene formulario de edición; el engranaje se usó para "marcar principal" (title correspondiente)

### 45.2 — Tab Seguridad + OTP (REQ-FE-16) ✅ (¡el OTP diferido de la F40, cerrado!)
- [x] Campos prellenados con datos REALES (nombre "Registro DesdeUI", email y teléfono del perfil) · nombre/apellido → `PUT /api/profile` directo · **email/teléfono → flujo OTP obligatorio**
- [x] **Flujo OTP completo E2E:** cambio de teléfono → `POST /api/auth/otp/request` → toast "Te enviamos un código a tu correo actual" → `[OtpModal]` REAL (6 dígitos controlados, auto-avance de foco, backspace retrocede, botón deshabilitado hasta 6 dígitos, purpose vía `uiStore`) → **el código se verificó leyendo el JOB REAL de BullMQ** (`email:otp` → `{to: correo ACTUAL, otp: "502941", purpose: phone_change}` — prueba de que el "correo" se envía al canal verificado, anti-secuestro)
- [x] **Código INCORRECTO (000000) → 401 "El código de verificación es incorrecto"** (el modal limpia y re-enfoca) · **código correcto → "Modificación completada" → psql: `phone` ACTUALIZADO + OTP `consumed_at` marcado + `attempts=2`** (el backend contó el intento fallido)
- [~] Cambio de contraseña: los campos del diseño quedan visuales — NO existe endpoint de cambio autenticado (solo forgot/reset por token); el submit avisa honestamente y sugiere "Olvidé mi contraseña". Documentado como mejora backend futura

### 45.3 — Tab Notificaciones In-App (REQ-FE-24) ✅
- [x] Bandeja real (`GET /notifications`, paginado→normalizado): título/cuerpo del payload, tiempo relativo ("HACE 6 MINUTOS"), no leídas con fondo rosa + dot pulsante; leídas en gris
- [x] **Sincronización del badge probada:** badge "2" → click en una no leída (`PATCH /:id/read`) → **badge "1"** → "Limpiar Bandeja" (`PATCH /read-all`) → **badge desaparece** — vía invalidación de `unread-count` → `notificationStore`
- [~] Ícono por fila: Trash2 → CheckSquare ("marcar leída") — NO existe DELETE de notificaciones en el backend; el bote de basura mentía (divulgado)

### 45.4 — Tab Métodos de Pago (REQ-FE-18) — DIFERIDO con aviso honesto ✅
- [x] Banner ámbar visible en la UI: "Módulo en construcción — bóveda PCI vía Stripe pendiente; tarjetas demostrativas". El form "agregar" avisa "Disponible al integrar Stripe" (ya no finge tokenizar). BLOQUEADO por Fase 36 backend + claves Stripe

### 45.5 — Verificación
- [x] Todo lo anterior E2E contra BD real (psql en cada mutación); campos OTP consumido/attempts verificados; `npm run build` OK · **FIN DEL NÚCLEO DEL STOREFRONT (Fases 37-45)**

---

## Fase 46 — Storefront: Donaciones · Social Proof · Compliance ✅ (E2E real, 2026-07-06)
> Verificado en navegador contra la BD real. `npm run build` OK. Seed de donaciones limpiado.
> ⚠️ HALLAZGO (deuda pre-existente, NO de esta fase): el backend NO pasa `tsc --noEmit` (17 errores TS2339 — `IUserRepository` no declara ~10 métodos que su impl SÍ tiene). Existe en HEAD; `tsx` corre igual porque no type-chequea. En Fases 42-44 reporté "typecheck exit 0" por ERROR: el `$?` era de `head`, no de `tsc`. Tarea de corrección encolada (spawn_task). Mi código de la F46 sí está type-limpio.

### 46.1 — Botón flotante + Modal de Donación (REQ-FE-26/27) ✅ (Stripe simulado)
- [x] `[DonationModal]` → `POST /api/donate` REAL con `X-Idempotency-Key`+`idempotencyKey` (UUID). Chips $10/$20/$30 + "Otra Cantidad" con validación reactiva; email obligatorio si anónimo (del `authStore` si hay sesión). **Probado E2E: $20 anónimo → pantalla de éxito con folio real, "$20.00 MXN", estado PENDING, aviso "pago simulado" → psql confirmó la donación** (`donor_email`, `pi_sim_...`). `$5` → 422 "menor al mínimo ($10)"
- [x] Mismo ingenio del checkout: la mutación SÍ devuelve el `clientSecret` (pi_sim_) validando toda la lógica del backend; la donación queda REAL en la BD (PENDING). TODO: STRIPE marcado para `confirmPayment` real

### 46.2 — Social Proof / FOMO por WebSocket REAL (REQ-FE-32) ✅
- [x] **`src/lib/ws.js` NUEVO**: cliente WS singleton por pestaña → `${VITE_WS_URL}/api/realtime/ws` (conexión pública), reconexión con backoff exponencial, suscripción por tipo de evento (`onRealtimeEvent`). Init/cleanup en `App.jsx`
- [x] **El motor FOMO de `setInterval` FALSO murió** → ahora escucha `social_proof:purchase` (payload real: displayName + municipality + productName, sin email/monto) y lo pinta en el popup FOMO existente
- [x] **Prueba forense de la cadena COMPLETA backend→WS→toast:** el backend `stats` vio la conexión pública real; disparé un broadcast REAL del servidor y el popup apareció en vivo con el texto exacto ("⚡ Carlos M. de Tizimín acaba de comprar Hoodie Jaguar Edición Oro") — **captura de pantalla adjunta**. Repetido 3×
- [~] Contador "🔥 X viendo ahora" en ProductView: diferido (no hay evento de presencia en el backend; el WS de presencia sería trabajo backend nuevo)
- ↳ Backend: se añadió un disparador DEV-ONLY `POST /api/realtime/_dev/social-proof` **gated por `ENABLE_DEV_REALTIME_TRIGGER=true`** (INERTE en prod), porque el Social Proof real nace del webhook de Stripe (deshabilitado en modo simulado). Permite probar la cadena sin un pago real

### 46.3 — Compliance legal (REQ-FE-28/29/30) ✅
- [x] **Banner de cookies persiste en `localStorage`** (`animayuks_cookie_consent=accepted`): **probado — aceptar → banner desaparece → recargar → NO vuelve** (lee el flag en el init del estado). "Ver Políticas" navega sin fingir consentimiento
- [~] `[LegalPage]` se deja **ESTÁTICA** (permitido por el usuario): el backend expone `GET /api/content/legal/:slug` por-documento, pero la gestión de contenido legal es un tema del CMS (Fase 53). La página estática rica del prototipo queda intacta; el cableado a `:slug` se hará junto con el CMS legal

### 46.4 — Monetización (REQ-FE-25) — DIFERIDO
- [ ] Google AdSense + detección de AdBlock: no implementado (requiere cuenta AdSense real; fuera del alcance de datos del backend)

### 46.5 — Verificación
- [x] Donación real (clientSecret + folio en BD); toast FOMO por evento WS REAL del backend (captura); cookie banner persiste tras recarga; 0 errores de consola; `npm run build` OK · **STOREFRONT COMPLETO (Fases 37-46)**

---
## Fase 47 — CMS: Shell + Login + 2FA + Easter Egg ⬜

### 47.1 — Shell del panel (CMS-FE-17)
- [ ] `[AdminLayout]` Sidebar colapsable agrupado por unidad de negocio (Analítica/Operaciones/Catálogo/Marketing/Integraciones/Sistema) + Breadcrumbs dinámicos · `cmsUiStore`

### 47.2 — Command Palette (CMS-FE-20)
- [ ] Spotlight modal con `Cmd/Ctrl+K` (saltar entre módulos / acciones directas) · `cmsUiStore`

### 47.3 — Login + Easter Egg (CMS-FE-01)
- [ ] `[LoginScreen]` login tradicional · `adminAuthStore` · `POST /api/admin/auth/login`
- [ ] Botón oculto de Registro (click en logo/pixel) → modal "Código de Desarrollador" · `POST /api/admin/auth/register` (`developerCode`)

### 47.4 — Muro de 2FA INELUDIBLE (CMS-FE-01, REQ-SEC-09)
- [ ] Manejar respuesta del login: si `requiresSetup` → pantalla de setup (QR desde `POST /api/admin/auth/2fa/setup`, confirmar con `POST /api/admin/auth/2fa/enable`); si `requires2fa` → input de código → `POST /api/admin/auth/2fa/verify` · `adminAuthStore` (setupToken/tempToken/accessToken 8h)

### 47.5 — Verificación
- [ ] Admin nuevo es forzado a configurar 2FA (no entra sin él); admin con 2FA pide código; sidebar/breadcrumbs/command palette operan; `npm run build` OK

---

## Fase 48 — CMS: Dashboard + Reportes + Campana de Notificaciones ⬜

### 48.1 — Dashboard Analítico (CMS-FE-02)
- [ ] `[DashboardView]` gráficos (Recharts) Embudo/Ticket Promedio + filtro de fechas ("7 días"/"Mes"/"YTD") · React Query · `GET /api/admin/analytics/summary?start=&end=` + `GET /api/admin/analytics/sales-over-time`
- [ ] Tabla "Top 10 Productos Más Vendidos" · `GET /api/admin/analytics/top-products`

### 48.2 — Generador de Reportes (CMS-FE-18)
- [ ] Modal de export global (entidad Ventas/CRM/Inventario/Auditoría/Donaciones + rango fechas + CSV/JSON) · `cmsUiStore` · `POST /api/admin/reports` → `{ jobId }`
- [ ] Descarga cuando listo · `GET /api/admin/reports/:jobId/download`

### 48.3 — Campana de Notificaciones (CMS-FE-19)
- [ ] Dropdown en el header que escucha WS `report:ready` → habilita descarga · `cmsUiStore` (cliente WS Fase 54)

### 48.4 — Verificación
- [ ] Dashboard con datos reales acotados por fecha; export encola (jobId real); descarga funciona; `npm run build` OK

---

## Fase 49 — CMS: Kanban de Pedidos + Última Milla + Reembolsos ⬜

### 49.1 — Kanban con Socket Live (CMS-FE-04)
- [ ] `[KanbanView]` columnas arrastrables + semáforo "Socket Live" + pestañas Activos/Historial/Cancelaciones · React Query · `GET /api/admin/orders`
- [ ] Tarjeta con todos los datos del cliente (teléfono, dirección, referencias, CP, estado) para empaquetado

### 49.2 — Transición de estatus + Última Milla (CMS-FE-04, REQ-BE-04)
- [ ] Arrastrar de columna → `PATCH /api/admin/orders/:id/status`; al soltar en "En Reparto" (Local) modal chofer/matrícula/teléfono, (Foráneo) empresa/guía · `cmsUiStore`
- [ ] Actualización en vivo del Kanban vía WS `admin:order_updated` (Fase 54)

### 49.3 — Bóveda de Reembolsos (CMS-FE-05)
- [ ] `[KanbanView]`/módulo refunds: **Re-auth con contraseña** + "Razón de Devolución" obligatoria · `adminAuthStore` · `POST /api/admin/orders/:id/refund` (body `amount/reason/currentPassword`; 401 si re-auth falla)

### 49.4 — Verificación
- [ ] Cambiar estatus dispara actualización + (email/WS reales del backend); modal última milla persiste datos; refund exige re-auth real; `npm run build` OK

---

## Fase 50 — CMS: Gestor de Catálogo (Productos · Variantes · Categorías) ⬜

### 50.1 — Master CRUD de Productos (CMS-FE-06)
- [ ] `[CatalogView]` listado admin (incl. descontinuados) · React Query · `GET /api/admin/products`
- [ ] Crear/editar (precio/stock base/fotos, editor WYSIWYG) con **OCC** (enviar `version`; 409 → recargar) · `POST /api/admin/products`, `PUT /api/admin/products/:id`
- [ ] "Descontinuar Producto (Soft Delete)" · `DELETE /api/admin/products/:id`

### 50.2 — Gestión de Variantes (Abismo de Tallas) (CMS-FE-06)
- [ ] Crear/editar variantes (Talla-Color, stock individual) · `POST /api/admin/products/:id/variants`, `PATCH /api/admin/products/:id/variants/:variantId`

### 50.3 — Categorías Creatable + Game Linker (CMS-FE-06)
- [ ] Selector Creatable (findOrCreate): si no existe, botón "+ Crear" · `POST /api/admin/categories`
- [ ] Game Linker: asociar recompensa virtual (flag `has_virtual_reward`) al producto

### 50.4 — Verificación
- [ ] Crear producto real; edición concurrente da 409 (OCC); variante con stock; categoría nueva vía findOrCreate; `npm run build` OK

---

## Fase 51 — CMS: Media/Banners + Monitor de Inventario ⬜

### 51.1 — Media Manager y Creador de Banners (CMS-FE-03)
- [ ] `[MediaView]` drag&drop de slides + toggle activar + hipervínculo + creador multicapa (Capa1/Capa2 SVG/video) + Título Interno · React Query · `GET/POST /api/admin/banners`, `PUT /api/admin/banners/:id`, `DELETE /api/admin/banners/:id`
- [ ] Subida de imagen del producto (pipeline S3/WEBP) · `POST /api/admin/products/:id/image`

### 51.2 — Monitor Global de Inventario (CMS-FE-16)
- [ ] `[InventoryView]` DataGrid server-side de TODAS las variantes por SKU + badge Activo/Stock Bajo/Agotado · React Query · `GET /api/admin/inventory?page=&limit=`

### 51.3 — Edición Inline de Stock (CMS-FE-07)
- [ ] Doble-clic en celda "Stock" → PATCH silencioso · `PATCH /api/admin/products/:id/variants/:variantId/stock`

### 51.4 — Verificación
- [ ] Banner nuevo aparece activo en la tienda (`/api/content/banners`); inventario pagina con badges; edición inline de stock real; `npm run build` OK

---

## Fase 52 — CMS: CRM (Usuarios · Monedero · Baneo) ⬜

### 52.1 — DataGrid de Usuarios (CMS-FE-14)
- [ ] `[CrmView]` tabla (Nombre, Correo, Fecha registro, Saldo monedero, tickets) · React Query · `GET /api/admin/users`

### 52.2 — Perfil individual + Ledger (CMS-FE-14)
- [ ] "Ver Perfil" con Libro Mayor individual (ingresos/egresos del monedero) · React Query · (datos del usuario/monedero del CRM)

### 52.3 — Suspender Cuenta / Baneo (CMS-FE-14)
- [ ] Acción roja "Suspender Cuenta" (destruye sesión) + revertir · `POST /api/admin/users/:id/ban`, `DELETE /api/admin/users/:id/ban`

### 52.4 — Verificación
- [ ] Lista de usuarios real con saldo; baneo real cambia estado; `npm run build` OK

---

## Fase 53 — CMS: Marketing y Sistema (Cupones · Donaciones · Legales · Settings · Auditoría · Game Bridge) ⬜

### 53.1 — Gestor de Cupones (CMS-FE-15)
- [ ] `[CouponsView]` CRUD (código, %/monto fijo, expiración, usos máx) + toggle On/Off · React Query · `GET /api/admin/coupons`, `GET /api/admin/coupons/:id`, `POST /api/admin/coupons`, `PUT /api/admin/coupons/:id`, `PATCH /api/admin/coupons/:id/toggle`

### 53.2 — Gestor del Modal de Donaciones (CMS-FE-13)
- [ ] `[DonationsView]` tabla histórica (folio/fecha/monto/correo/estado) + monto mínimo · React Query · `GET /api/admin/donations` + `GET/PUT /api/admin/settings` (mínimo)

### 53.3 — Editor de Textos Legales (CMS-FE-12)
- [ ] `[LegalView]` editor rich-text por slug · React Query · `GET /api/admin/legal`, `GET /api/admin/legal/:slug`, `PUT /api/admin/legal/:slug`

### 53.4 — Configuración Global + Developer Code (CMS-FE-11)
- [ ] `[SettingsView]` rutas/Estado Base/Municipios/costos/umbral/mínimo · `GET/PUT /api/admin/settings`
- [ ] Cambio de **Developer Code con re-auth** (código actual + nuevo + confirmación) · `adminAuthStore` · `PUT /api/admin/settings/developer-code`

### 53.5 — Visor de Bitácora (CMS-FE-10)
- [ ] `[AuditView]` DataGrid inmutable + filtros (email admin, tipo de acción) + IP/Timestamp + **Diff Viewer** old/new · React Query · `GET /api/admin/audit-logs`

### 53.6 — Consola Game Economy / Banner Juego (CMS-FE-08, CMS-FE-09) — BLOQUEADO
- [ ] `[GameBridgeView]` UI con datos **MOCK** + aviso "Requiere API de Juego (DB2 NoSQL) — no implementada en backend"

### 53.7 — Verificación
- [ ] CRUD cupón real + toggle; editar legal se refleja en la tienda; developer code exige re-auth (401 si falla); audit log con diff; `npm run build` OK

---

## Fase 54 — Realtime Global (WebSocket) + Verificación E2E + Hardening ⬜

### 54.1 — Cliente WebSocket (`src/lib/ws.js`)
- [ ] Conectar a `VITE_WS_URL/api/realtime/ws?token=<accessToken>` con reconexión/backoff + re-suscripción al refrescar token
- [ ] Enrutado: `social_proof:purchase`→toast (`uiStore`); `order:status_changed`→invalida `useOrders`+`notificationStore`; `admin:order_updated`→invalida Kanban; `report:ready`→campana CMS; `gamification:xp_awarded`→barra XP (`authStore`)

### 54.2 — E2E manual contra backend real
- [ ] Checkout + 3DS; login+2FA admin; cambio de estatus con notificación en vivo al cliente; donación con recibo; reporte encolado→WS ready→descarga; social proof al confirmar compra

### 54.3 — Hardening
- [ ] Skeletons/loading + Error Boundaries + estados error/empty; responsive; a11y básica; botón de retroceso en todas las vistas (REQ-FE-34)
- [ ] `npm run build` de producción OK (Store y CMS)
