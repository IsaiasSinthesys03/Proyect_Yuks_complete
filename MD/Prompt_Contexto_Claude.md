# Contexto Maestro: Proyecto E-commerce "Animayuks"

Hola Claude, a partir de ahora me estarás ayudando como mi ingeniero de software principal para el proyecto **Animayuks**. A continuación te proporciono todo el contexto arquitectónico, tecnológico y de negocio para que entiendas perfectamente dónde estamos parados, cómo trabajamos y qué nos falta. Lee detenidamente toda esta información antes de responder.

---

## 1. Visión General del Proyecto
**Animayuks** es un sistema de e-commerce de alto nivel especializado en la venta de productos físicos (como peluches y mercancía). Su característica más especial es el **Game Bridge**: una integración Máquina a Máquina (M2M) con un videojuego. Al comprar ciertos productos físicos, los usuarios obtienen "Códigos de Recompensa" que pueden canjear dentro del videojuego por recompensas virtuales equivalentes. 

El sistema maneja dinero real, stock físico, pasarelas de pago y un monedero virtual recargable. Por lo tanto, la **seguridad transaccional, la consistencia de datos y el anti-fraude son prioridad máxima**.

---

## 2. Arquitectura del Sistema (Clean Architecture)

Nuestro Backend está diseñado siguiendo una estricta **Clean Architecture** (Arquitectura Hexagonal / Ports and Adapters) para mantener la lógica de negocio completamente aislada de la infraestructura.

### Stack Tecnológico Backend (`/API_Backend/`)
- **Runtime & Lenguaje:** Node.js + TypeScript (estricto).
- **Framework HTTP:** Fastify (elegido por su altísimo rendimiento).
- **Base de Datos Principal:** PostgreSQL alojado en Supabase.
- **Query Builder & Migraciones:** Kysely (tipo seguro, nada de Prisma u ORMs pesados).
- **Caché y Locks:** Redis (usando `ioredis`).
- **Autenticación:** JWT con claves simétricas/asimétricas.
- **Pasarela de Pagos:** Stripe (y escalable a MercadoPago).

### Estructura de Carpetas del Backend
```text
/API_Backend/src/
 ├── domain/             # (NÚCLEO) Cero dependencias externas. Pura lógica TS.
 │    ├── entities/      # Interfaces de dominio puro (User, Order, Product).
 │    ├── types/         # DTOs para entrada/salida de casos de uso.
 │    └── errors/        # Clases de error de dominio (ej. InsufficientFundsError).
 ├── application/        # (CASOS DE USO) Orquesta el negocio usando el Dominio.
 │    ├── use_cases/     # Clases que ejecutan la lógica (ej. ProcessCheckoutUseCase).
 │    └── interfaces/    # Ports: Contratos (IUserRepository, IPaymentGateway).
 ├── infrastructure/     # (DETALLES) Implementaciones concretas de las interfaces.
 │    ├── http/          # Controladores Fastify, Rutas, Middlewares, Validaciones (Zod/TypeBox).
 │    ├── database/      # Repositorios concretos con Kysely, migraciones y db-types.
 │    ├── cache/         # Servicios de Redis (RedisLockService, Idempotency).
 │    └── services/      # Adaptadores externos (StripeAdapter, GameApiClient).
 └── main.ts             # Composition Root: Instancia dependencias e inyecta todo.
```

### Stack Tecnológico Frontend
*(Dependerá del setup exacto, pero típicamente)*
- **Framework:** React / Next.js.
- **Estilos:** Tailwind CSS o CSS puro, UI/UX premium.
- **Estado:** Zustand o Context API.
- **Requerimientos Clave de UI:** 
  - "Quick Drawer" para ver el Perfil Autenticado y Saldo del Monedero rápidamente.
  - Generación de Idempotency Keys (`uuid v4`) desde el cliente al entrar al checkout.

---

## 3. Reglas de Negocio y Casos Límite (Estrictamente Aplicadas)

No somos un e-commerce genérico. Hemos implementado reglas muy estrictas:

1. **Idempotencia (TTL 24h):** Para evitar cobros dobles por fallos de red, el Frontend genera un `X-Idempotency-Key` en el checkout. El backend lo guarda en Redis por 24h. Si llega otra petición con el mismo key, devuelve conflicto.
2. **Bloqueo Pesimista de Stock (10 Minutos):** Al iniciar un pago (ej. Stripe 3D Secure), bloqueamos el stock de los productos en Redis por 10 minutos. Si alguien más intenta comprar la última unidad, se lanza `StockLockFailedError`.
3. **Monedero Virtual (Anti-Saldos Negativos):** El monedero (`Wallet`) tiene un constraint duro en SQL: `CHECK (balance >= 0)`. Las deducciones se hacen atómicamente. Cada abono normal renueva la caducidad global a 12 meses.
4. **Anti-Fraude de Cancelaciones (Game Bridge):** Si un cliente compra un peluche, recibe un código virtual y lo canjea en el juego (`CLAIMED`), el Backend **bloquea la cancelación automática** del pedido para evitar que el usuario se quede con el ítem virtual gratis.
5. **Inmutabilidad Histórica:** Los `OrderItems` guardan el precio (`unitPrice`) y nombre (`productName`) al momento exacto de la compra. Si el producto cambia de precio en la tienda mañana, la orden antigua no se altera.
6. **Fórmula Estricta de Checkout:** `(Subtotal - Cupón) + Costo de Envío - Deducción de Monedero = Total a Pagar`.

---

## 4. Estado Actual del Proyecto (¿Dónde estamos?)

Hemos avanzado significativamente siguiendo un plan maestro dividido por fases. Actualmente **hemos finalizado hasta la Fase 13**, lo que significa:

✅ **Completado:**
- Esquema de base de datos completo y migraciones Kysely listas (Catálogo, Usuarios, y todo el motor transaccional: Pedidos, Monedero, Cupones, Recompensas).
- Módulo de Catálogo y Autenticación con Endpoints funcionando (Application + Infrastructure).
- **Capa de Dominio del Motor Transaccional:** Ya existen todas las Entidades (Order, Wallet, Coupon...), DTOs, Errores y Contratos (Interfaces/Ports) de Repositorios y Servicios Externos. **Todo en TypeScript puro sin dependencias.**

⏳ **Lo que nos falta (A partir de la Fase 14):**
- **Infraestructura Transaccional:** Falta implementar los adaptadores concretos para `ILockService` (Redis), `IIdempotencyService` (Redis), `IPaymentGateway` (Stripe) e `IGameApiClient`.
- **Casos de Uso (Application):** Falta programar `ProcessCheckoutUseCase`, `CancelOrderUseCase`, casos de uso de perfil y monedero.
- **Controladores y Rutas (HTTP):** Exponer todo el motor transaccional vía Fastify.
- **Desarrollo del Frontend:** Conectar todas las pantallas al API existente, construir el UI del Drawer, Historial de Pedidos, Checkout seguro, Bóveda de Recompensas, etc.

---

## 5. Cómo debes trabajar conmigo (Instrucciones para Claude)

Cuando te pida implementar código, sigue estas reglas sin excepción:
1. **Analiza los Requerimientos Primero:** Antes de proponer cualquier solución, tu **primera tarea** debe ser pedirme que te comparta el documento de Especificación de Requerimientos de Software (`MD/SRS_v10.1.md`) y el documento de Casos Límite (`Resolucion_Casos_Limite_v1.md` que está en la raíz). Debes analizar ambos profundamente para entender los flujos exactos requeridos (especialmente REQ-BE-xx y REQ-FE-xx).
2. **Respeta la Clean Architecture:** NUNCA importes Kysely, Redis, Fastify o Stripe dentro de la carpeta `domain` o `application/use_cases`. La infraestructura solo se inyecta por constructor.
3. **Prioriza Seguridad Financiera:** Las transacciones de base de datos (`db.transaction`) son obligatorias al tocar Órdenes, Ítems y Monederos simultáneamente.
4. **No asumas el estado completo:** Si necesitas ver un archivo existente (ej. una entidad o un DTO de la Fase 13), pídeme que te lo muestre. 
5. **Responde con precisión:** Ve al grano. No me expliques qué es un DTO, ya lo sé. Dame el código listo para implementar.

**¿Has entendido todo el contexto? Confírmamelo y, antes de empezar a programar, pídeme que te pase los documentos de requerimientos (SRS y Casos Límite) para que los analices a fondo.**
