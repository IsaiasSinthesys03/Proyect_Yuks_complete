# Canvas de Resoluciones de Arquitectura y Negocio

**Proyecto:** Plataforma Interactiva Animayuks  
**Módulo:** Edge Cases y Clarificación de Requerimientos (Fase de Especificación)

---

## PARTE 1: Resoluciones Técnicas y de Infraestructura (✅ Aprobadas)

Las siguientes decisiones han sido integradas en el modelo mental de la arquitectura para resolver los vacíos técnicos del SRS original. No requieren intervención del área de negocio.

### Infraestructura y Base de Datos

#### Q2. ¿La Idempotency Key es generada por el frontend o por el backend? ¿Cuál es su TTL?
* **Resolución:** El frontend la genera usando `crypto.randomUUID()` en el momento en que el usuario entra a la vista de Checkout. Se envía en el header `X-Idempotency-Key`. El backend la almacena en Redis con un TTL (Time-To-Live) de 24 horas. Si el usuario modifica el carrito, el frontend debe generar una llave nueva para invalidar la anterior.

#### Q4. ¿Qué pasa si el ROLLBACK del monedero falla por timeout de la DB durante un checkout parcial?
* **Resolución:** Se implementará una cola de compensación (Dead Letter Queue) en BullMQ. Si el cobro en Stripe es exitoso pero el servidor de base de datos se cae antes de debitar el monedero, el Worker reintentará la operación con un retroceso exponencial (Exponential Backoff). Si falla 5 veces, marca la orden como `NEEDS_RECONCILIATION` y dispara una alerta crítica al administrador. No se pierde el dinero.

#### Q8. ¿El monedero puede tener saldo negativo transitoriamente por race conditions?
* **Resolución:** Estrictamente prohibido. A nivel de infraestructura, la columna en PostgreSQL debe tener un constraint `CHECK (balance >= 0)`. Cualquier colisión que intente sobregirar la cuenta lanzará un error SQL inmediato que abortará la transacción a nivel de base de datos.

#### Q20. La Bitácora Inmutable (CMS-BE-06) usa Database Triggers. ¿Estos operan dentro de la transacción principal?
* **Resolución:** Operan dentro de la misma transacción (Síncronos). Si el disco se llena y el log no se puede escribir, la actualización del producto falla y hace rollback. En este sistema, es preferible la inactividad operativa a la pérdida de trazabilidad en la auditoría.

---

### Game Bridge (Cross-DB)

#### Q11. ¿Cómo autentica el juego la consulta al Backend Web para validar el UUID?
* **Resolución:** Autenticación Máquina a Máquina (M2M). El servidor del videojuego usará un Service Account Token (un JWT estático firmado con larga duración) que viaja en el header `Authorization: Bearer <TOKEN>`. El Rate Limiting se desactiva exclusivamente para las IPs internas del Game Server.

---

### Concurrencia y CMS

#### Q14. ¿Cómo se implementa el Optimistic Concurrency Control (OCC) sin un campo version documentado?
* **Resolución:** Se agregará una columna `version` (integer) a las tablas maestras (ej. `products`). Por cada UPDATE, la consulta incluirá `WHERE id = X AND version = Y`. Si ninguna fila se actualiza (la versión cambió), el backend devolverá un HTTP 409 (Conflict).

#### Q15. ¿El OCC aplica también a la edición inline de stock (CMS-FE-07 / CMS-FE-16)?
* **Resolución:** No. Las ediciones rápidas en la tabla de datos usarán operaciones matemáticas relativas (Deltas). La consulta SQL será `UPDATE products SET stock = stock + X WHERE id = Y`. Esto elimina las colisiones al 100% durante ajustes de inventario simultáneos.

#### Q19. ¿Cómo se maneja la rotación JWT de 8 horas cuando un admin está editando un producto?
* **Resolución:** Implementación de Silent Refresh vía cookies HttpOnly. Access Token vive 15 minutos; Refresh Token vive 7 días. Si el token expira durante un formulario largo, el interceptor de Axios pide un token nuevo en segundo plano y reintenta el POST sin que el usuario pierda su trabajo.

#### Q21. El "Código de Desarrollador" (000000), ¿se hashea en DB o es texto plano?
* **Resolución:** Se guardará como un hash criptográfico Argon2id en una tabla `system_settings` mediante el script de seed inicial. Para cambiarlo, el endpoint verificará el hash actual contra el payload proporcionado.

#### Q22. ¿Qué pasa cuando el CMS opera en red local pero necesita comunicarse con webhooks (Stripe/S3)?
* **Resolución:** Al ser un monorepo, comparten el mismo backend expuesto a internet. El requerimiento de "Intranet" se simula mediante un Middleware de Filtrado de IPs. Rutas `/api/admin/*` solo aceptan peticiones si la IP de origen coincide con la red autorizada de la empresa.

#### Q23. ¿El findOrCreate de categorías es case-sensitive?
* **Resolución:** Strict Case-Insensitivity. Se implementará un constraint `UNIQUE (LOWER(name))` en BD. Las inserciones aplicarán `.trim().toLowerCase()` a nivel código para evitar duplicados como "Playeras" y "playeras".

---

## PARTE 2: Lienzo de Reglas de Negocio (✅ Resueltas)

### 1. Flujo 3D Secure vs Reserva de Stock
* **Contexto:** El usuario compra una playera (stock reservado 10 min). Se tarda 15 min en la app del banco autorizando. El stock se libera y otro cliente la compra. El banco del usuario 1 finalmente aprueba el pago de una playera que ya no existe.
* **[ ✅ RESOLUCIÓN ESTÁNDAR DE INDUSTRIA ]:** Se cancela automáticamente. Permitir sobreventas es una mala práctica que genera fricción legal (PROFECO) y riesgo de contracargos bancarios.
* **Mecánica técnica:** Cuando el webhook de la pasarela reciba el pago tardío, el backend verificará el stock. Al detectar `stock == 0`, el servidor ejecutará instantáneamente la API de Refund (Reembolso total) de la pasarela de pago y despachará un correo automático: *"Tu pago fue aprobado por tu banco, pero el artículo se agotó durante el tiempo de procesamiento. Hemos reembolsado tu dinero automáticamente."*

### 2. Fórmula de Deducción en Checkout
* **Contexto:** Un usuario tiene saldo en monedero, un cupón de descuento y quiere comprar.
* **[ ✅ RESOLUCIÓN ESTÁNDAR E-COMMERCE ]:** `(Subtotal - Cupón de descuento) + Envío = Total`. El saldo del Monedero se resta de ese Total.
* **Nota:** Aplicar el cupón antes del envío afecta las métricas de "Envío Gratis" (si el subtotal con descuento baja del umbral, se cobra envío). Restar el monedero al final asegura que se pueda usar para pagar el envío.

### 3. Regla del Mínimo de Compra
* **Contexto:** Tienes un mínimo configurado de $200 MXN. El usuario compra $250, usa un cupón de $100 y su total baja a $150.
* **[ ✅ RESOLUCIÓN APROBADA ]:** Se bloquea la compra. El monto evaluado para cumplir la regla debe ser el Total Final (después de aplicar descuentos y antes del monedero). Si el Total es menor a $200, la UI no permite procesar el pago.

### 4. Política de Caducidad del Monedero
* **Contexto:** El usuario tiene $100 que caducan en enero. Hoy le devuelven otros $50.
* **[ ✅ RESOLUCIÓN APROBADA ]:** Saldo Global y Renovable. Cualquier ingreso de saldo (ej. por devolución de los $50) actualiza la fecha de caducidad de todo el monedero sumando 12 meses exactos desde el momento de la nueva inyección.

### 5. Caducidad en Reembolsos (Loophole Anti-fraude)
* **Contexto:** Compro con monedero que estaba a punto de caducar (2 días). Cancelo y el dinero regresa.
* **[ ✅ RESOLUCIÓN APROBADA ]:** Hereda el tiempo original. Para evitar un bucle de cancelaciones que renueve el dinero indefinidamente, el sistema registrará internamente qué fondos se usaron. Al devolverlos, se les asignarán los mismos 2 días de vida que tenían antes de la compra simulada.

### 6. Ciclo de Vida del UUID y Anti-Fraude
* **Contexto:** Fraude potencial: El cliente compra físico, canjea el UUID virtual, y luego cancela la orden física.
* **[ ✅ RESOLUCIÓN ARQUITECTURA HÍBRIDA ]:** Códigos No-Caducos con "Garbage Collection" Condicional.
  * **Caducidad:** Los UUID no tienen caducidad temporal (pueden guardarse y regalarse meses después).
  * **Anti-fraude (Cancelación):** Si el usuario cancela la orden desde el Historial (REQ-FE-23), el backend SQL envía una petición síncrona al backend del Juego (API Interna).
    * Si el código **NO** se ha canjeado: Se marca como `REVOKED` en SQL y ya no sirve. Se aprueba la cancelación del pedido y el reembolso.
    * Si el código **YA** se canjeó en el juego: El backend bloquea el botón de cancelación automática del usuario y lanza una alerta: *"No puedes cancelar este pedido porque ya reclamaste la recompensa virtual. Contacta a soporte."*

### 7. Emisión de Códigos por Volumen
* **Contexto:** El cliente compra 5 peluches idénticos.
* **[ ✅ RESOLUCIÓN APROBADA ]:** Generación Unitaria (1 a 1). El sistema generará 5 códigos UUID separados en la pestaña "Recompensas" del usuario. Esto permite flexibilidad (ej. canjear 1, regalar los otros 4).

### 8. Donaciones Anónimas y Compliance
* **Contexto:** Donaciones sin sesión iniciada.
* **[ ✅ RESOLUCIÓN APROBADA ]:** Aislamiento y Consentimiento Estricto.
  * **Aislamiento:** Las donaciones anónimas son registros huérfanos. No se vincularán retrospectivamente si el usuario crea una cuenta con ese correo después.
  * **Compliance:** El modal de donación anónima incluirá obligatoriamente el checkbox de *"Acepto Términos, Condiciones y Aviso de Privacidad"*. El sistema bloqueará el pago si no está marcado, y registrará este consentimiento en la tabla `audit_logs`.
