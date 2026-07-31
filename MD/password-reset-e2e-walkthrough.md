# Walkthrough E2E — Restablecimiento de contraseña

Fecha de validación: 2026-07-31

## Implementación

- `StoreApp.jsx` detecta tokens tanto en `?token=...` como en `/reset-password/:token`, conserva el token únicamente en memoria y lo elimina inmediatamente de la barra de direcciones con `history.replaceState`.
- `AuthModal.jsx` abre automáticamente la vista de nueva contraseña, muestra los cinco criterios de complejidad en tiempo real, valida coincidencia y bloquea el submit hasta que el formulario sea válido.
- El cliente consume `POST /api/auth/reset-password`, muestra estados de carga, traduce expiración/reutilización a un mensaje accionable y cambia a Login después del éxito.
- Fastify valida token no vacío y contraseña de 8–200 caracteres con mayúscula, minúscula, número y símbolo permitido.
- PostgreSQL ejecuta bajo una sola transacción y bloqueo de fila: consumo del token, actualización Argon2id y revocación de todos los refresh tokens. Esto impide reutilización concurrente y evita estados parciales.

## Evidencias verificadas

| Prueba | Resultado |
|---|---|
| Registro de cuenta E2E dedicada | HTTP 201 |
| Login previo al cambio | HTTP 200 |
| Solicitud `forgot-password` | HTTP 202 |
| Job BullMQ de recuperación | Encontrado con URL y TTL de 30 minutos |
| Token crudo contra hash de PostgreSQL | SHA-256 coincidente |
| Apertura del enlace | Modal `Nueva Contraseña` abierto automáticamente |
| Limpieza de URL | El parámetro `token` desapareció antes de interactuar |
| Contraseña débil | Botón deshabilitado |
| Contraseñas distintas | Mensaje visible y botón deshabilitado |
| Contraseña válida coincidente | Botón habilitado; cambio completado desde la UI |
| Resultado visual de éxito | Toast visible y modal de Login abierto |
| Sesiones anteriores | 1 existente, 0 activas después del cambio |
| Login con contraseña anterior | HTTP 401 |
| Login con contraseña nueva | HTTP 200 |
| Reutilización del token | HTTP 400 y mensaje de enlace inválido/usado |
| Integridad ante reutilización | Hash de contraseña sin cambios |
| Estado visual del enlace usado | Mensaje de expiración/uso y botón para solicitar otro enlace |
| Consola del navegador | 0 errores |
| Backend | `npm run typecheck` sin errores |
| Frontend | `npm run build` sin errores |

## Límite comprobable

La generación del correo quedó verificada hasta PostgreSQL y el job real de BullMQ. No se declaró recepción en una bandeja Gmail porque la prueba utilizó una cuenta técnica `@animayuks.test` y no se proporcionó una sesión Gmail autorizada. El sistema de correo productivo no fue sustituido por un mock para fabricar ese resultado.
