# Auditoría Crítica de Seguridad y Brechas — Panel CMS Administrativo

**Rol:** Arquitecto de Software Senior / Auditor DevSecOps.
**Alcance:** Estado del código en `/API_Backend/src/` previo al inicio de la Fase 21, contrastado contra `MD/SRS_v10.1.md` (Secciones 5 y 6: CMS Frontend/Backend), `implementation_plan.md` y `Resolucion_Casos_Limite_v1.md`.
**Propósito:** Documento de aprobación previa al desarrollo. Ninguna línea de código de CMS se escribe hasta que este análisis quede validado.

---

## 1. Autenticación / Autorización (RBAC)

### Estado verificado en código (no supuesto)

- `User.role: UserRole` (`'CLIENT' | 'ADMIN'`) existe desde la migración inicial.
- `JwtPayload.role: string` ya viaja en el Access Token (`authMiddleware.ts` lo decodifica a `request.user.role`).
- **No existe ningún middleware que lea ese campo para autorizar.** `authMiddleware` certifica *quién eres*, nunca *qué puedes hacer*. Es autenticación pura, cero autorización.

### Vulnerabilidades identificadas

1. **RBAC decorativo.** Si hoy se montara una ruta `/api/admin/products` reutilizando solo `authMiddleware`, cualquier `CLIENT` con sesión válida la alcanzaría. Mitigación: `adminMiddleware` dedicado, ejecutado siempre **después** de `authMiddleware`, nunca como sustituto.
2. **Escalación de privilegios en el registro.** El Easter Egg de registro de admin (`developer_code`) no existe todavía. Si se implementa ingenuamente aceptando un campo `role` en el body de cualquier endpoint de registro, un atacante se autopromueve. El Use Case debe hardcodear `role: 'ADMIN'` y nunca leerlo del payload del cliente.
3. **Secreto en texto plano.** El código `000000` no puede vivir en una env var ni en el código fuente — Q21 exige Argon2id en `system_settings`, verificado vía `argon2.verify()`, nunca comparación de strings.
4. **TTL de sesión uniforme.** Hoy un admin y un cliente comparten el mismo `JWT_EXPIRES_IN` (15 min). El SRS exige 8h para admin (CMS-BE-01) con su propio secreto/config de expiración — sesiones administrativas más largas exigen compensar con controles adicionales (ver puntos 5-7).
5. **Sin filtrado de IP (Q22).** El CMS está pensado para operar en "intranet simulada". Sin un middleware de allowlist de IP, el único control de acceso es el password — insuficiente para un panel que mueve dinero e inventario.
6. **Sin rate limiting en login admin.** Ya señalado en auditorías previas (Fase 19) y nunca resuelto. Aquí es más grave: el endpoint protege reembolsos y modificación de precios, no solo el carrito de un cliente.
7. **Sin 2FA/TOTP (REQ-SEC-09).** Un solo factor protege capacidades de alto impacto financiero. Pendiente, documentado para fase posterior si el negocio lo prioriza (no incluido en el alcance de Fases 21-26 por decisión de alcance, **debe quedar explícitamente aceptado como riesgo residual**, no olvidado).

### Decisión de diseño propuesta

Cadena de middlewares **en este orden exacto** para toda ruta `/api/admin/*` (excepto login):
```
ipAllowlistMiddleware → authMiddleware → adminMiddleware → adminAuditContextMiddleware
```
El orden importa: filtrar por IP antes de gastar ciclos de verificación criptográfica de JWT es una optimización de superficie de ataque, no solo de rendimiento.

---

## 2. Gestión de Archivos (Upload de Imágenes de Producto)

### Estado verificado

`package.json` no contiene `@fastify/multipart`, `sharp`, `file-type`, ni SDK de almacenamiento en la nube. **Cero infraestructura de upload existe.** Cualquier implementación debe construirse con disciplina desde el primer commit, porque no hay nada que "arreglar después" — se construye seguro o no se construye.

### Vulnerabilidades si se construye sin estos controles

1. **RCE/XSS vía spoofing de tipo de archivo.** Validar solo la extensión del nombre o el header `Content-Type` (controlado por el cliente) es insuficiente. Un atacante puede subir cualquier payload con extensión `.jpg`. Mitigación obligatoria: leer el *magic number* real del buffer (librería `file-type`) y comparar contra una allowlist (`image/jpeg`, `image/png`, `image/webp`).
2. **SVG como vector de ataque.** SVG es XML — puede contener `<script>` (XSS si se sirve inline) o referencias externas (XXE). El SRS no requiere SVG para fotos de producto. Decisión: **prohibido explícitamente**.
3. **DoS por tamaño o "decompression bomb".** Sin límite de tamaño en el parser multipart, un upload de varios GB agota memoria/disco antes de que cualquier validación de aplicación se ejecute. Sin límite de dimensiones de imagen decodificada, un PNG pequeño en bytes pero con dimensiones declaradas de 50000x50000 puede reventar el proceso al decodificarlo con `sharp`. Ambos límites deben aplicarse **en capas distintas**: `@fastify/multipart` (`limits.fileSize`) antes de tocar el buffer, y validación de dimensiones decodificadas antes de redimensionar.
4. **Path Traversal.** Nunca usar el nombre de archivo provisto por el cliente para construir una ruta de almacenamiento. Generar siempre un identificador server-side (`crypto.randomUUID()`).
5. **Decisión de almacenamiento: Cloud Storage, no disco local.** El `implementation_plan.md` ya proyecta una arquitectura de VPS pública + VPS de BD separada (Sección 8 del SRS, Zero Trust). Un disco local de la API no sobrevive a redeploys ni escala horizontalmente. Se recomienda S3 (o un compatible) desde el día uno — Cloudinary es alternativa válida si se prioriza simplicidad operativa sobre control de infraestructura.
6. **URLs públicas predecibles — decisión consciente, no descuido.** Las imágenes de producto son públicas por diseño (se muestran en el catálogo sin autenticación). Documentar esto explícitamente evita que en una auditoría futura se confunda con una vulnerabilidad: no lo es, es la naturaleza del activo.

---

## 3. Integridad de Datos — CRUDs Faltantes

Tabla de brechas, ya verificada contra el código real (no contra lo que el plan dice que debería existir):

| Entidad | Estado actual | Brecha | Regla de validación crítica |
|---|---|---|---|
| Productos | Solo lectura | Falta `POST/PUT/DELETE(soft)` | OCC real vía `version` (columna existe en BD desde la Fase 8, **nunca leída ni comparada** por ningún Use Case hasta hoy) |
| Variantes | Solo lectura | Falta `POST/PUT` + ajuste de stock | `sku` único, stock nunca negativo (constraint SQL ya existe), ajuste SIEMPRE por delta, nunca por valor absoluto (Q15) |
| Categorías | Solo lectura | Falta `findOrCreate` | Case-insensitive, índice único ya existe en BD, falta el endpoint que lo aproveche |
| Cupones | Solo lectura (validación de canje) | Falta `POST/PUT/PATCH(toggle)` | `discountValue` coherente con `discountType` (porcentaje 1-100, fijo > 0), `expiresAt` futuro al crear |
| Pedidos (vista admin) | Inexistente | Falta listado global + cambio de estado | Máquina de estados estricta — ningún salto fuera de secuencia (`PAID` → `DELIVERED` directo debe rechazarse) |
| Usuarios (CRM) | Inexistente | Falta listado + ban/unban | Un admin no puede banearse a sí mismo |
| Reembolsos manuales | Inexistente (solo automáticos vía Use Cases del motor transaccional) | Falta endpoint con re-auth | Monto reembolsado nunca > `order.totalPaid`; exige confirmación de password actual, no solo JWT válido |
| `system_settings` | Inexistente | Toda la configuración logística vive hardcodeada en `ProcessCheckoutUseCase` (`DEFAULT_SYSTEM_CONFIG`) | Cambiarla hoy exige un despliegue de código — inaceptable para operar el negocio |

---

## 4. Audit Logs — Trazabilidad Absoluta

### Estado actual: 0% implementado

No existe la tabla `audit_logs`. No existe ningún trigger de base de datos. Esta es, de todas las brechas, la que tiene mayor exposición legal/compliance si se ignora: cualquier disputa bancaria o reclamo de un cliente sobre una modificación de pedido o reembolso quedaría sin evidencia verificable.

### Decisión de arquitectura: logging de doble capa

1. **Triggers SQL síncronos** (`AFTER INSERT/UPDATE`) sobre las tablas administrables (`products`, `product_variants`, `coupons`, cambios de `status` en `orders`, cambios de `is_banned` en `users`). Esto garantiza que la trazabilidad es **imposible de evadir** incluso si un Use Case tiene un bug que olvida registrar el log manualmente — el `implementation_plan.md` exige exactamente esto.
2. **Contexto de sesión vía `SET LOCAL`**: un trigger de Postgres no tiene acceso nativo a "quién hizo esta petición HTTP". La aplicación debe inyectar `app.current_admin_email` y `app.current_admin_ip` en la transacción **antes** de ejecutar la mutación, y el trigger los lee con `current_setting(..., true)`. Esto requiere que todo Use Case administrativo reciba una transacción ya contextualizada (helper `withAdminAuditContext`).
3. **Inmutabilidad reforzada a nivel de permisos de BD**, no solo de la interfaz `IAuditLogRepository` (que deliberadamente nunca expone `update`/`delete`). Doble candado: ni el contrato de TypeScript ni el rol de conexión a Postgres permiten alterar la bitácora.

---

## Veredicto

El núcleo transaccional (Fases 12-20) está construido con rigor. El CMS administrativo, en cambio, **parte de cero en los cuatro ejes auditados**: RBAC es un campo sin verificar, upload de archivos no tiene una sola línea de infraestructura, los CRUDs de escritura no existen, y la auditoría es inexistente. Ninguna de estas brechas es sorpresa — ya se habían señalado en `Auditoria_Backend_Fase19.md` — pero esta auditoría las convierte en requisitos de diseño concretos con su mitigación específica, listos para ejecutarse en las Fases 21-26 de `MD/task.md`.

**Recomendación de secuencia:** Fase 21 (seguridad + auditoría) es estrictamente bloqueante. Ningún CRUD de Fases 22-25 debe empezar a construirse antes de que `adminMiddleware`, `ipAllowlistMiddleware` y los triggers de `audit_logs` existan y estén verificados — de lo contrario, cada CRUD nuevo se entrega sin las salvaguardas que motivaron este documento.
