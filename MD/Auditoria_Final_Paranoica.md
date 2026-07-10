# 🔴 Auditoría Final Paranoica — Backend Animayuks

**Rol:** Auditor DevSecOps Paranoico + QA Lead
**Fecha:** 2026-07-03
**Objeto:** Destruir la afirmación "el Backend está 100% terminado".
**Método:** Lectura línea por línea del `MD/SRS_v10.1.md` cruzada contra el código real en `API_Backend/`.

## ⚖️ VEREDICTO

**EL BACKEND NO ESTÁ LISTO PARA FRONTEND NI PARA PRODUCCIÓN.**

Se encontraron **16 hallazgos** (4 críticos, 6 altos, 6 medios) que incumplen requerimientos explícitos del SRS. Adicionalmente, se detectó que **el checklist `MD/task.md` contiene casillas marcadas `[x]` que NO corresponden al código implementado** (checklist aspiracional/alucinado). No se certifica. Se abren las **Fases 32–36** para cerrar las brechas antes de tocar el Frontend.

> **La sospecha del director era correcta.** "Siempre hay sorpresas antes de conectar el Frontend." Aquí están.

---

## 🚨 DISCREPANCIA DE INTEGRIDAD: el `task.md` miente

Antes de los hallazgos técnicos, el hallazgo más grave para la confianza del proyecto: varias tareas están marcadas como completadas `[x]` en `MD/task.md` pero **no existen en el código**:

| task.md dice `[x]` | Realidad en el código |
|---|---|
| 31.5 "Cambio de estado → **notificación WS al cliente**" | `UpdateOrderStatusUseCase` solo encola email. **Cero WebSocket.** |
| 31.3 "Modificar checkout: si tier JAGUAR reducir `freeShippingThreshold`" | `ProcessCheckoutUseCase` usa umbral estático. **Sin lógica de tier.** |
| 30.6 "`GET /api/admin/products` retorna lista paginada con variantes" | `adminProductRoutes` **no tiene ningún GET.** |
| 30.2 "analytics `?start=&end=`" | `AnalyticsRepository` **no acepta rango de fechas.** |
| 31.1 reportes con `startDate/endDate`, `format JSON`, **S3**, endpoint `/status` | Reportes reales: sin fechas, sin JSON, escriben a **disco local**, notifican por WS. Diseño distinto. |
| 30.5 "**JSON schema** a 5 endpoints críticos" | **Ninguna** ruta tiene `schema:` de Fastify. |
| 30.5 "migración `017_missing_indices`" | Las migraciones reales llegan a la **015**. Los índices **no existen**. |
| 31.3 tiers `BRONCE/JAGUAR/DRAGON/ANIMAYUK` | El código usa `BRONZE/SILVER/GOLD/PLATINUM`. |

**Conclusión:** el `task.md` no es una fuente de verdad confiable. La auditoría se basó exclusivamente en el código.

---

## 🟥 HALLAZGOS CRÍTICOS (rompen requerimientos core)

### C-01 · REQ-BE-04 — El WebSocket NO se dispara en cambios de estatus de pedido
> *"El sistema de colas disparará un Correo Electrónico **Y una notificación WebSocket** en CADA cambio de estatus del pedido (Empaquetando, En Camino, En Reparto, Entregado), **sin excepción**."*

**Realidad:** [`UpdateOrderStatusUseCase.ts`](../API_Backend/src/application/use_cases/admin/orders/UpdateOrderStatusUseCase.ts) encola `email:order_status` y **nada más**. No llama a `notifyUser()`. El cliente jamás recibe la actualización en tiempo real. Rompe también **REQ-FE-24** (bandeja in-app) y **CMS-FE-04** (Kanban "Socket Live").

### C-02 · REQ-BE-10 / REQ-FE-32 — El Motor de Social Proof no emite NADA
> *"Nuevo canal bidireccional que transmite eventos de compra verificados a todos los clientes conectados."*

**Realidad:** `WebSocketServer.broadcastPublic()` **está definido pero jamás se invoca en todo el código** (verificado por `grep`). Ninguna confirmación de pago emite el pop-up "⚡ Roberto G. de Mérida acaba de comprar…". El motor FOMO existe como cascarón vacío. `notifyUser` solo se usa en gamificación; `notifyAdmins` solo en el puente de reportes.

### C-03 · REQ-SEC-09 — El 2FA del CMS es OPCIONAL, no obligatorio
> *"Requisito **ineludible** para el acceso al panel CMS."*

**Realidad:** `AdminLoginUseCase` entrega el JWT de 8h directo si `totp_enabled = false` (el default). Un admin puede operar todo el panel **sin jamás configurar 2FA**. El SRS lo exige como muro ineludible para TODOS los administradores.

### C-04 · REQ-BE-08 — No se persiste la aceptación del Aviso de Privacidad al registrar
> *"En el momento del Registro de Usuario, el backend **guardará un booleano** confirmando la aceptación del Aviso de Privacidad."*

**Realidad:** `RegisterUserUseCase` valida `dto.termsAccepted` pero **no lo persiste**. La tabla `users` (migración 001) **no tiene columna** `privacy_accepted`/`terms_accepted`. No hay rastro de auditoría del consentimiento en el registro (el trail de checkout sí existe: `terms_version`+`client_ip` en `orders`, pero el del registro no).

---

## 🟧 HALLAZGOS ALTOS

### A-05 · REQ-FE-12 / REQ-BE-03 — Búsqueda incompleta: sin rango de precio, sin personaje, **sin fuzzy**
> *"filtros combinables (Categoría + **Rango de Precio** + **Personaje**) … **Tolerancia a errores ortográficos (Fuzzy Matching)**."*

**Realidad:** `GetProductsQueryDTO` solo soporta `search`, `categoryId`, `sortBy`. **No hay** `minPrice`/`maxPrice` ni filtro por personaje/tag. El índice de la migración 008 es `to_tsvector('spanish', name)` — hace *stemming*, **no fuzzy**. `to_tsquery` no tolera typos ("Palyera" no encuentra "Playera"). Falta `pg_trgm` + `similarity()`.

### A-06 · REQ-FE-08 — El registro no captura teléfono
> *"Registro Básico: Nombre, Apellidos, Correo, Contraseña, Confirmar Contraseña, **Número Telefónico**."*

**Realidad:** `RegisterUserDTO` = `{ email, password, firstName, lastName, termsAccepted }`. **No hay `phone`**. La columna `profiles.phone` existe pero el registro nunca la llena.

### A-07 · REQ-SEC-10 — Endpoint de canje de UUID sin rate limit anti-fuerza-bruta
> *"protección de endpoints críticos (Login **y canje de códigos UUID**) … 5 intentos fallidos consecutivos en 1 minuto → baneo temporal."*

**Realidad:** `POST /api/game/rewards/validate` ([`gameRewardRoutes.ts`](../API_Backend/src/infrastructure/http/routes/gameRewardRoutes.ts)) solo tiene `m2mAuthMiddleware`. Le aplica el rate limit **global (200/min)**, pero **no** el estricto de 5/min que el SRS exige para el canje de UUIDs. Superficie de fuerza bruta sobre códigos de recompensa.

### A-08 · REQ-BE-06 — CORS abierto (refleja cualquier origen)
> *"Uso estricto de CORS."*

**Realidad:** [`main.ts`](../API_Backend/src/main.ts) registra `cors` con `origin: true` + `credentials: true` → **refleja cualquier `Origin`** con credenciales. El propio comentario admite "En producción, restringir a dominios específicos". Vector de robo de sesión cross-origin si no se corrige antes de exponer al Frontend.

### A-09 · Edge Case de Negocio — Pago capturado + webhook que falla definitivamente → orden huérfana
**Pregunta del director:** *"¿Qué pasa si un pago se aprueba pero el webhook falla 3 veces?"*

**Realidad:** Stripe reintenta el webhook por ~3 días. Si nuestro procesamiento falla persistentemente (o el evento se pierde), la orden **queda en `PAYMENT_PENDING` para siempre con el dinero cobrado**. El worker de reconciliación solo atiende `NEEDS_RECONCILIATION` (fallos post-commit del checkout), **no** hace un barrido que consulte a Stripe por órdenes `PAYMENT_PENDING` estancadas. No existe *orphaned-payment sweeper*.

### A-10 · CMS-FE-16 — Sin Monitor Global de Inventario (variantes por SKU)
> *"tabla paginada desde el servidor (Server-side pagination) que lista absolutamente **todas las variantes por su SKU único**."*

**Realidad:** `adminProductRoutes` no expone ningún listado. No hay endpoint que pagine variantes con Producto/Talla/Color/Precio/Stock/Estatus. El `adjustStock` (edición inline) existe, pero **la vista maestra que alimenta no tiene backend**.

---

## 🟨 HALLAZGOS MEDIOS

### M-11 · REQ-FE-24 / REQ-FE-14 — Sin persistencia de notificaciones (contador de no leídas)
El WebSocket es **efímero**. No hay tabla `notifications` ni endpoints de bandeja/no-leídas/marcar-leída. Si el cliente está desconectado cuando cambia su pedido, **pierde la notificación para siempre**. El "contador de notificaciones no leídas" (REQ-FE-14) no tiene respaldo.

### M-12 · CMS-FE-02 — Dashboard analítico sin filtros de rango de fechas
> *"Filtros de rango de fechas preestablecidos ('Últimos 7 días', 'Mes Actual', 'YTD') que recalculen todos los gráficos."*

`AnalyticsRepository.getDashboardSummary()` no acepta parámetros de fecha; devuelve totales históricos absolutos. Los filtros temporales del dashboard no tienen backend.

### M-13 · CMS-FE-18 — Reportes: faltan entidades, JSON y rango de fechas
> *"seleccionar la entidad (Ventas, CRM, **Inventario**, **Auditoría**, Donaciones), rango de fechas y formato final (**CSV/JSON**)."*

Los tipos implementados son `sales | orders | donations | users`. **Faltan "Inventario" y "Auditoría"**, el **formato JSON** y el **filtrado por rango de fechas**.

### M-14 · REQ-BE-07 / REQ-FE-14 — El umbral de envío gratis no se reduce por tier
> *"El umbral puede reducirse dinámicamente si el cliente tiene un Rango superior en el Pase de Leyenda."*

El beneficio logístico del sistema de lealtad **no está implementado**. El checkout ignora el tier del usuario al calcular envío gratis.

### M-15 · CMS-FE-06 — Sin endpoint admin para listar productos (incluye descontinuados)
El CRUD de catálogo necesita listar productos —incluidos los `is_deleted = true`— para gestionarlos/reactivarlos. El único GET de productos es el público, que **excluye** los descontinuados. El admin no puede ver ni "reactivar" un producto soft-deleted.

### M-16 · REQ-BE-06 — Sin validación declarativa de esquema (JSON Schema) en ninguna ruta
No existe un solo `schema:` de Fastify en las rutas. Toda la validación es manual y dispersa en controllers. Endpoints como `POST /api/checkout` o `/api/donate` aceptan cuerpos arbitrarios y confían en checks ad-hoc. Riesgo de inputs mal formados / type-confusion.

### M-17 · Rendimiento — Faltan índices que el `task.md` daba por hechos
No existen `idx_orders_stripe_payment_intent_id`, `idx_wallet_transactions_order_id`, `idx_order_items_variant_id`. El webhook hace `findByStripePaymentIntentId` en **cada** evento de Stripe → *full table scan* de `orders`. Degradación garantizada con volumen.

---

## 🟩 HALLAZGOS BAJOS / FUERA DE ALCANCE DEL SRS (informativos)

- **GDPR — eliminación de cuenta:** el SRS **no** exige el derecho al olvido (solo "Suspender Cuenta / baneo", CMS-FE-14, que sí existe). No es un gap del SRS, pero se **recomienda** un `DELETE /api/profile` con anonimización para cumplimiento real.
- **Verificación de correo antes de comprar:** **no es requerimiento del SRS.** El SRS pide checkbox de privacidad (registro) y checkbox de políticas (checkout), no verificación de email. No es gap — se documenta para evitar alcance inventado.
- **CSRF:** la cookie de refresh usa `SameSite=strict` + `path=/api/auth/refresh` (mitigación fuerte) y el resto de la API es *stateless* con `Authorization: Bearer`. **Aceptable**; se sugiere token double-submit solo si se añaden más endpoints con cookies.
- **REQ-FE-23 — Factura CFDI:** integración fiscal mexicana mayor; fuera del alcance del backend actual. Documentar como fase futura dedicada.
- **REQ-FE-18 — Métodos de pago guardados (tarjetas):** requiere Stripe Customer + SetupIntent. No implementado; se difiere a Fase 36.
- **Infraestructura (REQ-SEC-01 a 04, 06, 07, 08, 11):** WAF/Cloudflare, UFW, segmentación de red, TLS 1.3/HSTS a nivel servidor, cifrado en reposo AES-256, geobloqueo, SIEM → son responsabilidad de **DevOps/despliegue**, no del código de la aplicación. Fuera del alcance de esta auditoría de código, pero **deben checklistearse antes de producción** (especialmente HSTS y ocultamiento de firmas, que Helmet cubre parcialmente).

---

## ✅ LO QUE SÍ ESTÁ SÓLIDO (para ser justos)

Para que esta auditoría sea creíble, se reconoce lo bien hecho:

- **Checkout (REQ-BE-01):** idempotencia, lock pesimista Redis, Saga con DLQ, cupón atómico (VULN-01 corregida y probada a 20× concurrencia), wallet `ON CONFLICT` (VULN-03).
- **Webhook HMAC (REQ-BE-02):** verificación de firma dentro del adaptador; auto-refund por stock agotado tras 3DS.
- **Argon2id (REQ-SEC-05):** contraseñas, códigos OTP, developer code, códigos de reset — todo hasheado correctamente.
- **Refresh Token Rotation:** tokens opacos persistidos, revocación por familia ante reúso.
- **Bitácora inmutable (CMS-BE-06):** triggers que bloquean UPDATE/DELETE (verificado: bloqueó incluso el borrado de un admin auditado).
- **Donaciones (REQ-BE-09)**, **Reward codes (REQ-BE-05)**, **Ruteo logístico base (REQ-BE-07)**, **Top ventas en Redis TTL 1h (REQ-BE-03 parcial)**, **OTP cambio email/teléfono (REQ-FE-16)**, **Recuperación con anti-enumeración**, **OAuth Google**, **findOrCreate categorías (CMS-BE-07)**, **OCC de productos (CMS-BE-02)**, **Soft delete (CMS-BE-03)**, **Config dinámica de checkout con caché (BRECHA-16)**.

El núcleo transaccional es de calidad. Las brechas son de **cobertura de features y hardening**, no de podredumbre arquitectónica.

---

## 🗺️ PLAN DE REMEDIACIÓN — Fases 32 a 36

Añadidas a `MD/task.md`. **Ninguna** debe saltarse antes de conectar el Frontend; los hallazgos críticos (C-01…C-04) son bloqueantes duros.

| Fase | Cierra | Prioridad |
|---|---|---|
| **32** — Motor de Tiempo Real Real | C-01, C-02, M-11 (WS en estatus, Social Proof, notificaciones persistidas) | 🔴 Bloqueante |
| **33** — Compliance de Registro + Búsqueda Enterprise | C-04, A-05, A-06 (privacy boolean, teléfono, fuzzy+filtros) | 🔴/🟧 |
| **34** — Hardening de Seguridad | C-03, A-07, A-08, M-16 (2FA obligatorio, rate limit canje, CORS, JSON schema) | 🔴/🟧 |
| **35** — Cierre Operativo del CMS | A-10, M-12, M-13, M-14, M-15, M-17 (inventario global, analytics fechas, reportes, envío por tier, listar productos admin, índices) | 🟧/🟨 |
| **36** — Resiliencia de Pagos + Métodos de Pago | A-09, REQ-FE-18 (sweeper de PAYMENT_PENDING, tarjetas guardadas) | 🟧 |

**Re-certificación:** solo tras completar 32–35 (36 puede correr en paralelo al arranque del Frontend si el director lo aprueba) se podrá declarar el backend *Production-Ready y Frontend-Ready*. Hasta entonces: **NO CERTIFICADO**.
