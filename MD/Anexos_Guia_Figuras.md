# ANEXOS — Guía de Figuras y Evidencias Visuales

> **Propósito de este documento:** Listado completo y ordenado de todas las evidencias visuales (capturas de pantalla) que deben tomarse e insertarse en el documento de titulación. Cada entrada indica el número de figura, el capítulo donde se inserta, una descripción detallada de lo que debe mostrar la captura, y sugerencias de cómo obtenerla.

---

## Resumen rápido

| # | Figura | Capítulo | Tipo de evidencia |
|---|--------|----------|-------------------|
| 1 | Figura 4.1 | IV — §4.1.1 | Estructura de carpetas (Clean Architecture) |
| 2 | Figura 4.2 | IV — §4.1.3 | Compilación TypeScript exitosa |
| 3 | Figura 4.3 | IV — §4.2.1 | Ejecución de migraciones de BD |
| 4 | Figura 4.4 | IV — §4.3.1 | Prueba de API — Checkout |
| 5 | Figura 4.5 | IV — §4.3.2 | Webhook de Stripe (logs) |
| 6 | Figura 4.6 | IV — §4.3.3 | Game Bridge — Validación UUID |
| 7 | Figura 4.7 | IV — §4.4.1 | Login Admin con 2FA TOTP |
| 8 | Figura 4.8 | IV — §4.5.1 | Dashboard del CMS |
| 9 | Figura 4.9 | IV — §4.5.2 | Bitácora de auditoría |

---

## Figuras del Capítulo IV "Resultados y Experiencias"

### Figura 4.1 — Estructura de carpetas de Clean Architecture

- **Sección destino:** 4.1.1. Validación de Clean Architecture en el entorno de pruebas
- **Descripción:** Diagrama o captura de pantalla de la estructura de carpetas del proyecto backend mostrando las tres capas de Clean Architecture (`domain/`, `application/`, `infrastructure/`) y la distribución de archivos en cada una.
- **Cómo obtenerla:**
  - Abrir VS Code con la carpeta `API_Backend/src/` expandida.
  - Expandir las tres subcarpetas principales: `domain/`, `application/`, `infrastructure/`.
  - Opcionalmente expandir `domain/entities/`, `application/interfaces/`, `application/use_cases/` y `infrastructure/database/repositories/` para mostrar la cantidad de archivos.
  - Tomar captura de pantalla del panel del explorador de archivos.
- **Nota de formato APA:**
  > *Figura 4.1. Estructura de carpetas del proyecto backend organizada en tres capas concéntricas de Clean Architecture.*
  > Nota. Captura de pantalla del explorador de archivos de Visual Studio Code.

---

### Figura 4.2 — Compilación exitosa de TypeScript

- **Sección destino:** 4.1.3. Resultados de la compilación y verificación estática de tipos
- **Descripción:** Captura de pantalla de la terminal mostrando la compilación exitosa de TypeScript (`tsc`) sin errores, indicando la cantidad de archivos procesados.
- **Cómo obtenerla:**
  - Abrir una terminal en `API_Backend/`.
  - Ejecutar: `npx tsc --noEmit`
  - Si la compilación es exitosa, la terminal no mostrará errores. Capturar la salida limpia.
  - Alternativamente, ejecutar `npm run dev` y capturar el mensaje de inicio exitoso del servidor Fastify con el puerto.
- **Nota de formato APA:**
  > *Figura 4.2. Resultado de la compilación del proyecto TypeScript sin errores de tipo.*
  > Nota. Captura de pantalla de la terminal de Visual Studio Code.

---

### Figura 4.3 — Ejecución exitosa de las migraciones de base de datos

- **Sección destino:** 4.2.1. Ejecución exitosa del sistema de migraciones
- **Descripción:** Captura de pantalla de la terminal mostrando la ejecución exitosa de las 27 migraciones con el mensaje de confirmación de cada una.
- **Cómo obtenerla:**
  - Asegurarse de que PostgreSQL esté corriendo y la base de datos exista.
  - Abrir una terminal en `API_Backend/`.
  - Ejecutar: `npm run migrate`
  - Capturar la salida que muestra las migraciones ejecutadas (001 a 027) con mensajes de éxito.
  - Si las migraciones ya fueron aplicadas, se puede mostrar el mensaje de "ya aplicadas" o bien recrear la base de datos para capturar la ejecución completa.
- **Nota de formato APA:**
  > *Figura 4.3. Ejecución exitosa de las 27 migraciones incrementales del esquema de base de datos PostgreSQL.*
  > Nota. Captura de pantalla de la terminal mostrando el resultado del comando `npm run migrate`.

---

### Figura 4.4 — Prueba de API del flujo de Checkout

- **Sección destino:** 4.3.1. Validación del motor de Checkout (11 pasos)
- **Descripción:** Captura de pantalla de una prueba de API (Postman, Thunder Client o similar) mostrando la solicitud de Checkout exitosa con el payload de entrada y la respuesta JSON incluyendo `orderId`, `status` y `stripeClientSecret`.
- **Cómo obtenerla:**
  - Abrir Postman o Thunder Client en VS Code.
  - Realizar una solicitud `POST /api/checkout` con:
    - Header `Authorization: Bearer <access_token>` (de un usuario autenticado).
    - Header `Idempotency-Key: <uuid-único>`.
    - Body JSON con `addressId`, `items` (array con `variantId` y `quantity`), `termsVersion`, y opcionalmente `couponCode` y `walletAmount`.
  - Capturar la solicitud (método, URL, headers, body) y la respuesta JSON exitosa (con `orderId`, `status: "PAYMENT_PENDING"`, `totalPaid`, `stripeClientSecret`).
  - Idealmente mostrar ambos paneles (request y response) en la misma captura.
- **Nota de formato APA:**
  > *Figura 4.4. Prueba funcional del endpoint de Checkout mostrando la solicitud HTTP y la respuesta JSON exitosa.*
  > Nota. Captura de pantalla de Thunder Client en Visual Studio Code.

---

### Figura 4.5 — Logs de verificación de Webhook de Stripe

- **Sección destino:** 4.3.2. Validación del flujo de pagos en entorno Sandbox
- **Descripción:** Captura de pantalla de los logs del servidor mostrando la recepción y verificación exitosa de un webhook de Stripe en entorno Sandbox, incluyendo el *event type* y el *payment intent ID*.
- **Cómo obtenerla:**
  - Tener el servidor corriendo con `npm run dev`.
  - Opción A (Stripe CLI): Ejecutar `stripe listen --forward-to localhost:3000/api/webhooks/stripe` y luego `stripe trigger payment_intent.succeeded`. Capturar los logs del servidor que muestran la recepción del evento.
  - Opción B (Dashboard Stripe): Ir a la sección de Webhooks en el Dashboard de Stripe Sandbox, seleccionar un evento enviado exitosamente y capturar la respuesta HTTP 200.
  - En los logs del backend debe aparecer el tipo de evento procesado (`payment_intent.succeeded`) y el ID del payment intent.
- **Nota de formato APA:**
  > *Figura 4.5. Logs del servidor backend mostrando la recepción y verificación exitosa de un evento webhook de Stripe en entorno Sandbox.*
  > Nota. Captura de pantalla de la terminal del servidor Fastify.

---

### Figura 4.6 — Login administrativo con 2FA (TOTP)

- **Sección destino:** 4.4.1. Validación del esquema de autenticación multifactor
- **Descripción:** Captura de pantalla del flujo de login administrativo mostrando la solicitud del código TOTP de 6 dígitos como segundo factor de autenticación.
- **Cómo obtenerla:**
  - Opción A (Interfaz CMS): Navegar al panel CMS (`/admin/login`), ingresar credenciales de un administrador con 2FA habilitado y capturar la pantalla donde se solicita el código de 6 dígitos.
  - Opción B (API en Postman): Mostrar la solicitud `POST /api/admin/auth/verify-2fa` con el body `{ totpCode: "123456" }` y la respuesta exitosa que retorna el `accessToken` definitivo.
  - Si se usa la interfaz, la captura debe mostrar el campo de entrada del código TOTP con un diseño claro.
- **Nota de formato APA:**
  > *Figura 4.6. Pantalla de verificación del segundo factor de autenticación (TOTP) en el acceso administrativo del CMS.*
  > Nota. Captura de pantalla de la interfaz del panel administrativo Animayuks.

---

### Figura 4.7 — Dashboard del panel administrativo CMS

- **Sección destino:** 4.5.1. Módulos implementados y verificados
- **Descripción:** Captura de pantalla del Dashboard del panel CMS mostrando las tarjetas de resumen (ventas totales, pedidos del mes, usuarios registrados) y una gráfica de ventas por período.
- **Cómo obtenerla:**
  - Iniciar sesión como administrador en el panel CMS.
  - Navegar a la página principal (Dashboard).
  - Asegurarse de que existan datos de prueba (pedidos, usuarios) para que las tarjetas y gráficas no estén vacías.
  - Capturar la vista completa de la página mostrando: tarjetas KPI (ventas, pedidos, usuarios), la gráfica de tendencia de ventas y el menú lateral de navegación.
  - Si la pantalla es muy larga, tomar dos capturas (parte superior e inferior).
- **Nota de formato APA:**
  > *Figura 4.7. Vista general del Dashboard del panel administrativo CMS con indicadores clave de rendimiento y gráfica de ventas.*
  > Nota. Captura de pantalla de la interfaz del panel administrativo Animayuks en el navegador web.

---

### Figura 4.8 — Bitácora de auditoría inmutable

- **Sección destino:** 4.5.2. Validación de la bitácora de auditoría inmutable
- **Descripción:** Captura de pantalla de la página de Auditoría del CMS mostrando registros de acciones con fecha, administrador, acción, entidad afectada y detalle de cambios.
- **Cómo obtenerla:**
  - Iniciar sesión como administrador en el panel CMS.
  - Realizar varias acciones administrativas previamente (crear producto, actualizar precio, bloquear usuario) para generar registros de auditoría.
  - Navegar a la página de Auditoría (`AuditPage`).
  - Capturar la tabla o listado de registros mostrando: fecha/hora, email del administrador, tipo de acción (`CREATE`, `UPDATE`, `SOFT_DELETE`, `BAN`), entidad afectada y los valores previos/posteriores al cambio.
  - Asegurarse de que sean visibles al menos 3-5 registros distintos para demostrar la variedad de acciones registradas.
- **Nota de formato APA:**
  > *Figura 4.8. Bitácora de auditoría inmutable del panel CMS mostrando el registro de acciones administrativas con detalle de cambios.*
  > Nota. Captura de pantalla de la interfaz del panel administrativo Animayuks en el navegador web.

---

---

### Figura 4.10 — Pantalla principal y catálogo de la tienda

- **Sección destino:** 4.6.1. Integración visual del catálogo y sistema de compra
- **Descripción:** Captura de pantalla de la Landing Page mostrando el diseño visual y las tarjetas de productos.
- **Cómo obtenerla:**
  - Abre la página pública de tu tienda en pantalla completa en tu navegador.
  - Toma una captura donde se vea el diseño general (hero banner, productos, colores de la marca Animayuks).
- **Nota de formato APA:**
  > *Figura 4.10. Vista principal de la tienda en línea (Storefront) mostrando el catálogo de productos disponibles para la compra.*
  > Nota. Captura de pantalla de la interfaz de usuario en el navegador web.

---

### Figura 4.11 — Vista de producto y carrito de compras

- **Sección destino:** 4.6.1. Integración visual del catálogo y sistema de compra
- **Descripción:** Captura de pantalla del carrito de compras listo para el checkout.
- **Cómo obtenerla:**
  - Agrega un par de productos al carrito en tu tienda.
  - Abre el carrito o ve a la pantalla de Checkout.
  - Toma la captura de pantalla asegurándote de que se vean los artículos, el subtotal y el botón de pago.
- **Nota de formato APA:**
  > *Figura 4.11. Interfaz del carrito de compras y proceso previo al pago (Checkout) en la plataforma web.*
  > Nota. Captura de pantalla del componente del carrito en el frontend de la tienda.

---

### Figura 4.12 — Diseño responsivo del Storefront (Vista Móvil)

- **Sección destino:** 4.6.1. Integración visual del catálogo y sistema de compra
- **Descripción:** Captura de pantalla demostrando que la tienda se adapta a pantallas de teléfonos móviles.
- **Cómo obtenerla:**
  - Abre tu tienda en Chrome, presiona F12 (Herramientas de Desarrollador) y activa la vista de dispositivos (Ctrl+Shift+M).
  - Selecciona un teléfono (ej. iPhone 14 o Pixel 7).
  - Toma una captura que demuestre cómo el menú y los productos se adaptan a la pantalla pequeña vertical.
- **Nota de formato APA:**
  > *Figura 4.12. Validación del diseño responsivo (mobile-first) de la plataforma en línea simulando la vista desde un dispositivo móvil.*
  > Nota. Captura de pantalla del navegador web utilizando las herramientas de simulación de dispositivos móviles.

---

## Notas generales para todas las capturas

1. **Resolución:** Tomar las capturas en una resolución mínima de 1920×1080 para garantizar legibilidad al imprimir.
2. **Datos sensibles:** Difuminar o censurar cualquier token JWT, clave API, contraseña o dato personal real antes de incluirlo en la tesis.
3. **Consistencia visual:** Utilizar el mismo tema de VS Code (claro u oscuro) y la misma herramienta de prueba de API en todas las capturas para mantener coherencia visual.
4. **Formato de inserción en Word/PDF:** Cada figura debe ir centrada, con pie de figura en cursiva debajo, seguido de una nota explicativa en fuente más pequeña, conforme al formato APA 7ª edición mostrado en las notas de cada entrada.
5. **Numeración:** Las figuras mantienen la numeración `4.X` porque todas pertenecen al Capítulo IV. Si se agregan figuras adicionales al Capítulo I (contexto), se numerarían `1.X`.
