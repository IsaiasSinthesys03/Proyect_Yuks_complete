# Especificación de Requerimientos de Software (SRS) y Arquitectura

**Proyecto:** Plataforma Interactiva Animayuks (E-commerce + CMS + Game Bridge)

**Elaborado por:** Dirección Técnica (Arquitectura de Software)

**Fase:** 2 (Levantamiento de Requerimientos Detallados)

**Estatus:** Aprobado para Producción (V 10.1 - Refinamiento UX/UI y Navegación)

## 1. 🚨 Resoluciones Estratégicas (Aprobadas)

Con base en la revisión de la mesa directiva, se asientan las siguientes directrices arquitectónicas:

* **Riesgo 1 (Fricción Temprana):** RESUELTO. Navegación del catálogo 100% libre y anónima. Login requerido solo para Checkout y Perfil.

* **Riesgo 2 (Legalidad del Monedero):** RESUELTO. Monedero habilitado para devoluciones voluntarias con fecha de caducidad. Reembolso a pasarela habilitado solo para administradores.

* **Riesgo 3 (Rendimiento Landing):** RESUELTO. Implementación de Lazy Loading (carga diferida) en carrusel de YouTube para no penalizar el SEO.

* **Iniciativas de Retención Diaria:** APROBADAS (Expansión 10.0). Implementación de sistema de Lealtad (Tier System RPG) y Social Proof en tiempo real.

## 2. 🏛️ Arquitectura Global y Bases de Datos

El sistema operará bajo una arquitectura híbrida con acceso a dos bases de datos, garantizando rendimiento y separación de responsabilidades:

* **DB 1 (Relacional - SQL / PostgreSQL):** Núcleo del E-Commerce. Maneja transacciones exactas: Usuarios, Perfiles, Direcciones, Pedidos, Inventario (por tallas/variantes), Monedero y Bitácora de Auditoría (ACID Compliance).

* **DB 2 (NoSQL - MongoDB / Firebase):** Núcleo del Videojuego. Almacena inventarios de Skins, progreso de jugadores y configuración de banners in-game.

* **El Puente (Cross-DB API):** El Backend del E-Commerce y del Juego comparten la validación de UUIDs para el canje manual de recompensas.

## 3. 🛒 REQUERIMIENTOS E-COMMERCE (FRONTEND)

Interfaz de cliente construida con React/Next.js y Tailwind CSS.

### 3.1. Landing Page (/) - Estructura de Conversión

El flujo visual de la página de inicio ha sido reestructurado para priorizar el embudo de ventas y la retención narrativa.

* **[REQ-FE-01] Hero Carousel (Prioridad 1):** Carrusel principal. El primer slide OBLIGATORIAMENTE debe ser el banner promocional del juego (siempre y cuando este se encuentre marcado como "Activo" en el CMS).

  * **Background Inmersivo (Capa 1):** El fondo del banner debe integrar de manera ineludible un video de gameplay en reproducción automática, en ciclo (loop) y silenciado (autoPlay loop muted playsInline), fusionado visualmente con el tema oscuro de la plataforma mediante modos de mezcla (mix-blend-screen) para comunicar la experiencia lúdica instantáneamente.

  * **Micro-interacción (Capa 2):** Un personaje en .SVG debe renderizarse con un z-index superior, sobresaliendo de los límites del banner para crear un efecto 3D/Pop-out.

  * **CTA (Exclusividad Android):** Botón principal y único de descarga dirigido estrictamente a Google Play, asumiendo el lanzamiento exclusivo inicial para dispositivos Android, eliminando botones de otras tiendas para evitar confusión operativa.

* **[REQ-FE-02] Top Ventas Físicas (Prioridad 2):** Inmediatamente debajo del Hero. Grid dinámico que consume el endpoint de "Productos más vendidos". Permite agregar al carrito rápidamente o hacer clic para redirigir a `/producto/:id` sin pedir inicio de sesión.

* **[REQ-FE-03] Sección "Quiénes Somos" (Prioridad 3):** Texto breve e institucional que aparece con una animación Fade-In-Up (Intersection Observer) al hacer scroll.

* **[REQ-FE-04] Carrusel de Lore / YouTube (Prioridad 4):** Barra deslizable horizontal con miniaturas de videos de la historia de los Animayuks.

  * **Optimización Core Web Vitals:** Usar componente `lite-youtube-embed` para cargar solo la carátula (.webp). El iframe pesado solo se monta al hacer clic.

* **[REQ-FE-05] Vitrina de Personajes (Prioridad 5):** Presentación de los 3 personajes principales mediante Tarjetas Rotatorias (3D Flip Cards). Al pasar el cursor (o tocar en móviles), la tarjeta gira 180 grados mostrando la historia del personaje en el reverso. Las ilustraciones (.SVG) deben estar posicionadas absolutamente sobre fondos asimétricos para resaltar.

* **[REQ-FE-06] Footer Corporativo:** Enlaces a redes sociales, formulario de contacto, correos y teléfonos de atención al cliente, y listado de enlaces a las Políticas Legales (Aviso de Privacidad, Términos y Condiciones).

* **[REQ-FE-33] Barra de Navegación Rápida Flotante (Quick Nav Anchor):** Inyección de un menú flotante estilo glassmorphism anclado debajo de la cabecera principal en la vista de escritorio. Contendrá botones de acceso rápido (ej. "Tendencias", "Personajes", "Quiénes Somos") que ejecutarán un desplazamiento suave (Smooth Scroll) directamente a los identificadores (IDs) de cada sección en la Landing Page, minimizando la fricción del scroll manual.

### 3.2. Autenticación y Registro (Auth Flow)

* **[REQ-FE-07] Login Híbrido:** Vista con formulario clásico (Correo, Contraseña) y botón de "Continuar con Google" (OAuth 2.0).

* **[REQ-FE-08] Registro Básico (Fase 1):** Nombre, Apellidos, Correo, Contraseña, Confirmar Contraseña, Número Telefónico.

  * **Compliance Legal:** Se incluirá un Checkbox obligatorio desmarcado por defecto: "He leído y acepto el Aviso de Privacidad y los Términos y Condiciones" para autorizar legalmente la recolección de sus datos personales.

* **[REQ-FE-09] Registro Progresivo (Fase 2):** Un middleware detecta si es la primera vez que el usuario intenta comprar. Si es así, despliega un Modal bloqueante solicitando: Dirección completa, Código Postal y Referencias del domicilio.

  * **Restricción de Logística:** Para evitar errores de tipografía, el "Estado" y el "Municipio" no serán campos de texto libre. Serán menús desplegables (Selects) que se autocompletan forzosamente mediante la validación del Código Postal.

* **[REQ-FE-10] Recuperación:** Flujo de recuperación de contraseña vía enlace temporal al correo.

### 3.3. Catálogo y Tienda (/tienda)

* **[REQ-FE-11] Explorador de Productos:** Grid general con Infinite Scroll o Paginación.

* **[REQ-FE-12] Buscador y Filtros (Omnibox Predictivo y Command Palette):** Barra de búsqueda indexada, filtros combinables (Categoría + Rango de Precio + Personaje).

  * **[V10 Enterprise - Búsqueda Visual Predictiva]:** Implementación de un Omnibox de búsqueda instantánea. Al teclear la tercera letra (ej. "Pla..."), se despliega un panel flotante masivo debajo del buscador. Este panel no solo mostrará texto, sino que renderizará miniaturas de los productos, el precio exacto, el badge morado de "Skin Incluida" y un mini-botón de + Carrito directo en el resultado. Debe incluir tolerancia a errores ortográficos (Fuzzy Matching).

  * **[V10.1 - Atajo Global Power User]:** Se implementará un Event Listener global en toda la tienda web que escuche el atajo de teclado `Cmd + K` o `Ctrl + K`. Al presionarlo, el usuario abrirá el Omnibox Predictivo desde cualquier parte de la plataforma sin necesidad de usar el ratón, otorgando una experiencia de navegación de altísimo nivel.

* **[REQ-FE-13] Carrito y Cálculo de Envíos Dinámico:** Drawer lateral que calcula subtotales, IVA y costos de envío.

  * **UI Inteligente:** Al ingresar su Código Postal en el checkout (validado con Selects de Estado/Municipio), el sistema le avisará automáticamente: "Envío Local: Llega en [X] tiempo" o "Envío Foráneo por Paquetería".

  * **Regla de Envío Gratis:** Si el Subtotal de la compra supera el "Umbral de Envío Gratis" preconfigurado en el CMS, el costo de envío se tacha visualmente y se calcula como $0.00.

### 3.4. Vista de Producto y Tecnologías Inmersivas (NUEVO)

* **[REQ-FE-31] Probador Virtual de Realidad Aumentada (WebAR):** Dentro de la vista individual del producto (`/producto/:id`), se implementará un botón secundario holográfico con la etiqueta "👁️ Ver en mi espacio (AR)".

  * **Comportamiento Móvil:** Al pulsarlo, lanza una instancia de WebXR abriendo la cámara del dispositivo sin requerir apps externas. Permite proyectar productos tridimensionales (ej. Peluches) sobre superficies reales o filtros faciales para accesorios (Gorras/Playeras).

  * **Comportamiento Escritorio:** Despliega un visor 3D en el navegador interactivo (Drag & Rotate) soportado por WebGL/Three.js.

* **[REQ-FE-32] Motor de "Social Proof" y Escasez (FOMO):** Inyección de micro-notificaciones y contadores en tiempo real para generar urgencia de compra y validación psicológica.

  * **Global UI:** Pop-ups flotantes elegantes en la esquina inferior generados vía WebSockets (Ej. "⚡ Roberto G. de Mérida acaba de comprar Playera Élite").

  * **ProductView:** Etiqueta dinámica en vivo mostrando el tráfico concurrente (Ej. "🔥 14 personas están viendo este artículo ahora mismo").

  * **Cart Drawer:** Alerta amarilla de escasez (Ej. "⚠️ Solo quedan 2 artículos de esta talla, completa tu pedido antes de que se agote").

### 3.5. Perfil del Usuario (/perfil) - Flujo de Panel Lateral (Drawer) y Dashboard

* **[REQ-FE-14] Quick Profile Drawer (Menú Lateral Rápido):** Al hacer clic en el ícono de usuario en el menú principal, se desliza un panel desde la derecha (Offcanvas/Drawer).

  * **Resumen Visual:** Muestra el Avatar del usuario, el Saldo del Monedero en grande y un contador de notificaciones no leídas.

  * **Navegación Rápida:** Contiene un menú en forma de lista para acceder a las secciones complejas (Pedidos, Direcciones, Recompensas) y el botón de Cerrar Sesión.

  * **[V10 Enterprise - Pase de Leyenda / Gamificación Transversal]:** Inyección de un Sistema de Niveles (Tier System RPG) directamente en el Drawer. Muestra una Barra de Experiencia (XP) al lado del Avatar. Cada compra confirmada suma puntos XP. Al llenarse, el usuario sube de rango (Ej. Rango Bronce -> Rango Jaguar). Este rango aplicará automáticamente estilos visuales dorados/brillantes al perfil y desbloqueará beneficios logísticos dinámicos (Ej. umbral de envío gratis más bajo).

* **[REQ-FE-15] Dashboard Ampliado (SPA):** Al seleccionar una opción del panel lateral, el usuario es redirigido a la vista completa `/perfil` (Single Page Application) donde dispone de toda la pantalla para administrar las siguientes pestañas complejas:

* **[REQ-FE-16] Tab: Datos Personales (Seguridad):** Formularios con validación en tiempo real (Regex para correos y contraseñas fuertes).

  * Modificación de Teléfono/Correo requerirá obligatoriamente un modal de Verificación OTP (One-Time Password) de 6 dígitos enviado por SMS/Email.

* **[REQ-FE-17] Tab: Libreta de Direcciones (Logística):** Integración con API postal para autocompletar Estado y Municipio. Opciones para marcar una dirección como "Predeterminada".

* **[REQ-FE-18] Tab: Métodos de Pago (PCI Compliance):** Visualización de tarjetas guardadas mostrando ÚNICAMENTE la marca (Visa/MC) y los últimos 4 dígitos. Alertas rojas para tarjetas próximas a expirar.

* **[REQ-FE-19] Tab: Favoritos (Wishlist Activa):** Grid de productos guardados con validación de Stock en tiempo real. Si un favorito se agota, se muestra en escala de grises.

* **[REQ-FE-20] Tab: Monedero y Aportaciones (Ledger UI):** Tabla de movimientos históricos (Ingresos por devoluciones vs. Egresos por compras), con fechas y folios de referencia.

  * **Transparencia Fiscal:** Nueva sub-sección "Mis Aportaciones", que funciona como un historial/recibo digital de las donaciones voluntarias realizadas, separándolas de las compras comerciales.

  * **Cumplimiento Legal Financiero:** La UI deberá mostrar un aviso visible indicando la Fecha de Caducidad del saldo (ej. "Tu saldo expira en 12 meses desde su emisión").

* **[REQ-FE-21] Tab: Cupones (Wallet Promo):** Input field para reclamar códigos. Tarjetas de cupones con "Cuenta Regresiva" para generar urgencia (FOMO).

* **[REQ-FE-22] Tab: Recompensas (Crossover Game Hub):** UI de "Inventario de Videojuego". Muestra tarjetas 3D con Skins ganadas.

  * Muestra un código alfanumérico (UUID) encriptado con un botón de "Copiar".

  * **Lógica Manual:** El usuario debe copiar este código, abrir el videojuego Animayuks en su celular y pegarlo allá para reclamar el ítem.

  * **Badge de Estatus Visual:** 🟢 "Listo para usar" o ⚪ "Canjeado".

* **[REQ-FE-23] Tab: Historial de Pedidos (Timeline de Última Milla):** Incluye filtros visuales (Pestañas) para separar los "Pedidos Activos" del "Historial Finalizado". Lista con imágenes en miniatura del producto. Al hacer clic, abre un "Timeline" vertical con 5 estatus interactivos:

  * ✅ **Pago Confirmado:** En esta fase SE HABILITA un botón rojo de "Cancelar Pedido" para que el usuario pueda arrepentirse sin contactar a soporte (El dinero va al monedero).

  * 📦 **Empaquetando:** (Al entrar a este estatus, el botón de Cancelar Pedido desaparece irremediablemente).

  * 🚚 **En Camino**

  * 🛵 **En Reparto:** Si es Local: Mostrará "¡Llega Hoy!" con los datos capturados por el administrador (Nombre del chofer, Vehículo/Matrícula, Teléfono de contacto). Si es Paquetería: Mostrará el Link de rastreo (Ej. FedEx/DHL) y el número de guía.

  * 🏠 **Entregado** (Habilita botón de descargar factura CFDI).

* **[REQ-FE-24] Tab: Notificaciones In-App (WebSockets):** Bandeja de entrada con indicadores de "No Leído". Las notificaciones (cambios de estatus de pedido, regalos) llegan en tiempo real sin recargar la página.

### 3.6. Monetización Web

* **[REQ-FE-25] Google AdSense:** Espacios publicitarios con carga diferida y detección de bloqueadores de anuncios (AdBlock) para mostrar un mensaje amigable pidiendo soporte a la marca.

### 3.7. Sistema de Donaciones Voluntarias (Apoyo Comunitario) 🪙

* **[REQ-FE-26] Botón Flotante Lúdico (Global UI):** Un botón posicionado estratégicamente con diseño curioso (ej. mascota sosteniendo una moneda) acompañado de una micro-animación de "latido".

* **[REQ-FE-27] Modal Interactivo de Donación:** Al hacer clic en el botón lúdico, se oscurece el fondo y se despliega un Modal en el centro de la pantalla que contiene:

  * **Banner Superior:** Una imagen o ilustración predeterminada atractiva agradeciendo el apoyo.

  * **Botones de Selección Rápida:** Un panel con 4 opciones clicleables estilo 'chips': $10, $20, $30 y un cuarto botón que diga Otra cantidad.

  * **Input Dinámico:** Si el usuario selecciona Otra cantidad, los botones se colapsan para mostrar un campo numérico. Este campo validará en tiempo real que la cifra introducida sea mayor o igual al mínimo configurado por el administrador.

  * **Condición de Usuario Anónimo:** Si el sistema detecta que el usuario no tiene una sesión activa, desplegará automáticamente un campo de entrada obligatorio para ingresar un Correo Electrónico antes de permitir el pago, asegurando el envío de su recibo fiscal digital.

  * **CTA de Pago:** Un botón prominente de Confirmar Donación. Al darle clic, omite el carrito de compras y lanza directamente el pop-up de la pasarela de pago (Stripe/MercadoPago).

### 3.8. Cumplimiento Legal y Compliance Institucional ⚖️

* **[REQ-FE-28] Vistas Institucionales de Políticas:** Páginas estáticas para Aviso de Privacidad, Términos y Condiciones, Políticas de Seguridad y Términos de Uso (App/Juego).

* **[REQ-FE-29] Banner de Consentimiento (Cookies/Tracking):** Banner flotante en la primera visita.

* **[REQ-FE-30] Checkbox Legal Obligatorio (Checkout de Compra):** Checkbox desmarcado por defecto que diga: "Acepto las Políticas de Reembolso y Tiempos de Envío". (Requisito ineludible bancario para procesar ventas).

### 3.9. Arquitectura de Navegación Global (UX)

* **[REQ-FE-34] Botones de Retroceso Explícitos:** Prohibición de depender exclusivamente de las "migas de pan" (breadcrumbs) o del menú principal para acciones de retorno. Toda vista secundaria y de profundidad (Catálogo de Tienda, Vista Individual de Producto, Dashboard de Perfil y Vistas Legales) debe incorporar obligatoriamente un botón visual y prominente de retroceso (ej. `<ArrowLeft /> Volver al Inicio / Catálogo`) en la parte superior izquierda de su contenedor. Esto garantiza una navegación a prueba de fricción cognitiva en cualquier dispositivo.

## 4. ⚙️ REQUERIMIENTOS E-COMMERCE (BACKEND API - Nivel Senior)

La lógica del servidor será construida bajo principios RESTful o GraphQL, garantizando alta disponibilidad y seguridad transaccional (ACID).

* **[REQ-BE-01] Motor de Checkout y Bloqueo de Doble Gasto (Idempotencia):** El Endpoint de pago (`POST /api/checkout`) es crítico. Debe operar bajo el patrón Saga o transacciones controladas:

  * **Idempotency Key:** Exigir una llave única del frontend por transacción para evitar que el usuario cobre dos veces si presiona el botón "Pagar" múltiples veces por lag.

  * **Reserva de Stock (Race Conditions):** Utilizar bloqueos pesimistas (SELECT FOR UPDATE) o Redis para reservar el producto por 10 minutos. Si el pago falla, liberar el stock automáticamente.

  * **Lógica de Monedero:** Iniciar transacción SQL, restar del monedero, cobrar diferencia a pasarela. Si falla, hacer ROLLBACK. Si se añade saldo, calcular caducidad legal a 12 meses.

* **[REQ-BE-02] Integración Pasarela y 3D Secure (Seguridad):**

  * Implementar Webhooks seguros validados mediante firma criptográfica (HMAC) con la pasarela (Stripe/MercadoPago) para actualizar los pagos asíncronos.

  * Soporte obligatorio para flujos de autenticación biométrica o 3D Secure 2.0.

* **[REQ-BE-03] API Búsqueda Indexada y Caché (Redis):**

  * Prohibido hacer `SELECT * LIKE '%query%'` directamente a la base de datos para la búsqueda. Implementar Full-Text Search o motor tipo Algolia para soporte del Omnibox Predictivo (Tolerancia a errores ortográficos/Fuzzy matching).

  * Los resultados de la "Top Ventas" deben cachearse en Redis con un TTL de 1 hora.

* **[REQ-BE-04] Sistema de Cola de Tareas y Notificaciones (BullMQ/RabbitMQ):**

  * Tareas pesadas no deben bloquear el hilo principal HTTP.

  * **Notificación Integral de Estatus:** El sistema de colas disparará un Correo Electrónico y una notificación WebSocket en CADA cambio de estatus del pedido (Empaquetando, En Camino, En Reparto, Entregado), sin excepción.

* **[REQ-BE-05] Motor de Recompensas y Firmas JWT (Game Bridge Transaccional):** Si un pedido contiene `has_virtual_reward = true`, al confirmarse el pago, el Backend Web ÚNICAMENTE genera un código UUID alfanumérico y lo guarda en la DB SQL. No hace peticiones a la API del juego. Será la API del juego la que, posteriormente, consulte este UUID en el backend SQL cuando el jugador intente canjearlo.

* **[REQ-BE-06] Middleware de Seguridad y Rate Limiting:**

  * Uso estricto de CORS, prevención de ataques de fuerza bruta (Rate Limiting) y sanitización de inputs (XSS / SQL Injection).

* **[REQ-BE-07] Motor de Enrutamiento Logístico Automático (Sin Costo):**

  * **Lógica de decisión:** Al procesar un pedido, el sistema comparará los Strings del menú desplegable del Estado y Municipio del cliente contra el "Estado Base" y la "Lista de Municipios Cercanos" del CMS.

  * Al provenir de menús controlados y no de texto libre, el match será exacto. Si coincide, el campo `delivery_type` en la BD será "LOCAL". Si no coincide, será "EXTERNAL_COURIER". Esto permite asignar la logística interna y avisar al cliente su tiempo de entrega sin gastar en APIs de geolocalización.

  * **Regla de Envío Gratis:** Previo al cobro final, verifica: `IF (subtotal >= umbral_envio_gratis) THEN costo_envio = 0`. El umbral puede reducirse dinámicamente si el cliente tiene un Rango superior en el Pase de Leyenda (REQ-FE-14).

* **[REQ-BE-08] Trazabilidad de Consentimiento Legal (Audit Trail):**

  * En el momento del Registro de Usuario, el backend guardará un booleano confirmando la aceptación del Aviso de Privacidad.

  * En el momento del Checkout, al completarse una orden, se guardará en la base de datos la versión exacta de las políticas de venta que el usuario aceptó (`terms_version: "v1.2"`), junto con la IP y el Timestamp (fecha y hora). Esto protege a la empresa ante controversias bancarias por contracargos.

* **[REQ-BE-09] Endpoint Exclusivo de Donaciones (Frictionless Payment):** Creación de una ruta dedicada (`POST /api/donate`). A diferencia del Checkout, este endpoint NO procesa cálculos de envíos, NO afecta el inventario y NO exige dirección física. Crea un "Intent de Pago" directo. El Payload validará estrictamente que el monto supere el mínimo establecido en el CMS. Si el usuario es anónimo, el sistema capturará su correo en esta misma petición para disparar asíncronamente el recibo digital agradeciendo la aportación.

* **[REQ-BE-10] Motor Push Social Proof (FOMO WebSockets):** Nuevo canal bidireccional que transmite eventos de compra verificados (anonimizados parcialmente, ej. "Usuario X de Ciudad Y") a todos los clientes conectados actualmente en la plataforma, fomentando la sensación de escasez y prueba social masiva.

## 5. 🛠️ PANEL ADMINISTRATIVO CMS (FRONTEND - Nivel Enterprise)

El panel interno es una SPA (Single Page Application) orientada a la eficiencia operativa, diseñada para ejecutarse en entorno de red local y compartida globalmente por todos los administradores registrados.

* **[CMS-FE-01] Login Local y Botón Oculto de Registro (Easter Egg):**

  * La pantalla de inicio de sesión será tradicional, pero el botón de "Registrarse" estará oculto visualmente (ej. haciendo clic en el logo de la esquina o en un píxel transparente).

  * Al activarlo, levantará un modal solicitando el "Código de Desarrollador" (Por defecto: 000000). Solo si el código es correcto, permitirá registrar una nueva cuenta de administrador para recuperar el acceso a la plataforma.

* **[CMS-FE-02] Dashboard Analítico Interactivo:**

  * Gráficos dinámicos e interactivos (Ej. SVG, Recharts/Chart.js) que muestren Embudo de Conversión y Ticket Promedio. Filtros de rango de fechas preestablecidos ("Últimos 7 días", "Mes Actual", "YTD") que recalculen todos los gráficos en tiempo real.

  * Incluye una tabla en tiempo real con el "Top 10 de Productos Más Vendidos" para decisiones de reabastecimiento.

* **[CMS-FE-03] Media Manager y Creador de Banners:**

  * Interfaz de Drag and Drop para subir imágenes y reordenar los slides del Hero Carousel.

  * **Toggle de Activación:** Switch (On/Off) en cada banner que permite al administrador activar o desactivar temporalmente el banner principal del juego o cualquier promoción sin tener que borrar el registro.

  * **Hipervínculo opcional:** Campo de texto para incluir un enlace que redirija al cliente al darle clic al banner.

  * **Creador Multicapa 3D:** Validador visual que obliga a estructurar la Capa 1 (Fondo Base) y la Capa 2 (SVG Frontal 3D) para generar un efecto Pop-out. Permite incluir un Video Dinámico Invertido opcional que actuará como GIF silencioso en loop, sustituyendo la Capa 1. Requiere de manera estricta un campo de "Título Interno" para identificación de la campaña.

* **[CMS-FE-04] Kanban de Pedidos (Sincronizado en Tiempo Real por WebSockets):**

  * Interfaz de columnas arrastrables con un Indicador visual de "Socket Live" (Semáforo) en la cabecera.

  * La tarjeta de cada pedido debe mostrar todos los detalles del cliente (Teléfono, Dirección completa, Referencias del domicilio, Código Postal, Estado, País) para que la empresa empiece el empaquetado y la ruta directamente desde esta vista, evitando que los choferes se pierdan.

  * Separación estricta de vistas operativas mediante Pestañas: Pedidos Activos, Historial de Finalizados y Cancelaciones/Devoluciones.

  * **Acción de Última Milla:** Al soltar un pedido local en la columna "En Reparto", se abre un Modal Express para capturar velozmente: Nombre del Chofer, Matrícula y Teléfono.

  * Si es Paquetería: Despliega un Modal solicitando Empresa (Ej. FedEx) y Número de Guía. Ambos casos disparan el envío masivo de correos (REQ-BE-04).

* **[CMS-FE-05] Gestor de Reembolsos Transaccional (Bóveda):**

  * Vista de alta seguridad que exige Re-auth (PIN/Contraseña) para reembolsos a tarjeta.

  * El botón "Reembolsar a Monedero" levanta un modal para añadir una "Razón de Devolución" obligatoria para mantener un rastro de auditoría transparente.

* **[CMS-FE-06] Gestor Avanzado de Catálogo (Master CRUD):**

  * **Campos Base:** El formulario solicitará obligatoriamente el precio base sin envío, stock del producto y fotografías.

  * **Gestión de Variantes (Abismo de las Tallas):** El CRUD no tiene un "Stock Global". El sistema obliga a crear Variantes (ej. Talla M - Color Rojo) asignando inventario (Stock) de forma individual a cada talla para evitar quiebres logísticos.

  * **Editor WYSIWYG (Rich Text):** Para redactar descripciones de productos de forma enriquecida.

  * **Acción Crítica de Suspensión:** Inclusión de un botón de "Descontinuar Producto (Soft Delete)" en color rojo, que preserva la integridad de la base de datos marcando el registro como oculto sin eliminarlo físicamente.

  * **Selector Creativo Dinámico de Categorías (UX Notion):** Buscador interactivo Creatable Select; si la categoría no existe, muestra un botón + Crear "Nombre_Nuevo". Al hacer clic, se registra asíncronamente.

  * **Game Linker Inteligente:** Menú desplegable asíncrono para asociar recompensas virtuales a productos físicos.

* **[CMS-FE-07] Monitor de Abastecimiento (Inventory Grid):**

  * Tabla de datos (DataGrid) con Edición Inline: Posibilidad de hacer doble clic estricto en el número de "Stock" para cambiarlo rápidamente sin abrir el formulario completo.

* **[CMS-FE-08] Consola de Economía In-Game (Game Bridge):**

  * Interfaz apartada que lee directamente de la DB NoSQL para modificar costos virtuales del videojuego.

* **[CMS-FE-09] Banner Manager del Juego:**

  * Definir qué producto físico de la tienda SQL se mostrará hoy en la publicidad de la App NoSQL.

* **[CMS-FE-10] Visor de Bitácora (Audit Log Grid):**

  * Tabla inmutable de solo lectura con filtros avanzados de búsqueda. Debe incluir un filtro de búsqueda exacto por "Email del Administrador" y un menú desplegable para filtrar por "Tipo de Acción Crítica" (CREATE, UPDATE, SOFT_DELETE, REFUND).

  * La tabla maestra debe exponer frontalmente la IP de Origen y la columna de Timestamp del evento.

  * **Payload Diff Viewer:** El botón de visualización levantará un modal JSON que debe renderizar un Diff visual (estilo Git), marcando en rojo el `old_value` y en verde el `new_value` para agilizar las auditorías de seguridad.

* **[CMS-FE-11] Configuración Global de Rutas y Operaciones:**

  * Pantalla de ajustes (Settings) donde el administrador ingresa la dirección física del local, el "Estado Base" y gestiona la matriz de "Municipios Cercanos" (Tags Input) que alimentan el Motor de Enrutamiento logístico. Definición de ETAs (Tiempo Estimado de Llegada).

  * **Campos Numéricos Financieros:** Inclusión de inputs para "Costo de Envío Local", "Costo de Envío Foráneo", "Umbral de Envío Gratis" (Ej. $1,500.00) y un "Mínimo de Compra" para bloquear el checkout en el E-commerce si el carrito no supera dicho valor.

  * **Gestión de Credenciales de Rescate:** Input de alta seguridad protegido por autenticación para modificar el "Código de Desarrollador" predeterminado (000000), exigiendo confirmación doble (Código Actual y Nuevo Código) para evitar bloqueos accidentales del módulo Easter Egg de registro.

* **[CMS-FE-12] Editor de Textos Legales (Compliance CMS):**

  * Interfaz de edición de texto enriquecido exclusiva para modificar dinámicamente el contenido de "Aviso de Privacidad", "Términos y Condiciones", "Políticas de Seguridad" y "Términos de Uso del Juego", evitando la necesidad de reprogramar la página cada vez que un abogado o el dueño actualice una regla.

* **[CMS-FE-13] Gestor del Modal de Donaciones:**

  * Módulo dedicado para que el administrador pueda subir/modificar la imagen o ilustración que aparece en el banner superior del Pop-Up de donaciones.

  * Incluye un input para que el dueño establezca el "Monto mínimo permitido" (ej. $10.00 MXN) que evitará errores de procesamiento de cobros mínimos en la opción de texto libre del cliente.

  * Integración de una Tabla de Transacciones Históricas (DataGrid) que registre las donaciones recibidas (mostrando Folio, Fecha, Monto, Correo Fiscal del Donante y Estado de la Pasarela) permitiendo la auditoría contable y la exportación de donantes para la emisión de recibos.

* **[CMS-FE-14] Gestor CRM (Customer Relationship Management) y Monederos:**

  * Interfaz de tabla de datos (DataGrid) dedicada a la administración y auditoría de usuarios registrados en el E-commerce. El panel listará: Nombre del Cliente, Correo Electrónico, Fecha de Registro y Saldo del Monedero Virtual (ambos visibles desde la tabla raíz), y el Historial de Compras (Cantidad de tickets y valor monetario).

  * Debe incluir una acción de 'Ver Perfil' para analizar comportamientos individuales. Dentro del perfil, se exige un 'Libro Mayor (Ledger) Individual' que desglose y audite el historial exacto de ingresos y egresos del monedero del usuario.

  * Acción de alta seguridad de color rojo para 'Suspender Cuenta (Bloqueo Fraude)' que modifique el estado de baneo de la cuenta, destruyendo su sesión instantáneamente.

* **[CMS-FE-15] Gestor de Cupones y Promociones (Marketing):**

  * Módulo dedicado a la creación y administración de códigos de descuento alfanuméricos. El formulario de creación exigirá de manera rigurosa: Nombre del código (Ej. VERANO26), Selector de Tipo de Descuento (para alternar entre Porcentaje % y Monto Directo Fijo $ MXN), Fecha de expiración estricta y Límite de usos máximos globales.

  * Debe incluir un Toggle Switch (On/Off) que permita activar o desactivar campañas promocionales en tiempo real sin destruir ni eliminar el registro histórico de la base de datos.

* **[CMS-FE-16] Monitor Global de Inventario (DataGrid Maestro):**

  * A diferencia del CRUD individual de productos, esta es una vista macroestructural de toda la tienda. Consiste en una tabla paginada desde el servidor (Server-side pagination) que lista absolutamente todas las variantes por su SKU único de forma simultánea.

  * Incluye columnas de Producto Principal, Variante (Talla/Color), Precio, Stock Físico y un 'Badge' de Estatus dinámico e intermitente (Activo, Stock Bajo, Agotado). Los controles de Paginación Server-Side deben ubicarse explícitamente en el pie de la tabla.

  * La celda numérica de 'Stock' debe permitir Edición Inline (doble clic) para realizar ajustes transaccionales ultrarrápidos durante las auditorías físicas de bodega, disparando peticiones PATCH silenciosas al servidor.

* **[CMS-FE-17] Arquitectura de Navegación Avanzada (UI/UX Enterprise):**

  * El layout global del CMS debe implementar un Sidebar (Menú Lateral) colapsable. Esto es obligatorio para maximizar el viewport horizontal en el área de trabajo, especialmente al visualizar tablas de datos complejas (como el Monitor Global o el Audit Log).

  * Los ítems de navegación en el menú deben estar categóricamente agrupados por unidad de negocio (Ej. Analítica, Operaciones, Catálogo, Marketing, Integraciones, Sistema) para reducir la carga cognitiva del usuario. Adicionalmente, la cabecera superior debe incluir Breadcrumbs (Migas de pan) dinámicas (Ej. Panel Admin > Catálogo > CRUD Productos) para asegurar que el administrador mantenga el contexto de navegación profundo en todo momento.

* **[CMS-FE-18] Generador de Reportes y Exportación Masiva:**

  * Modal de exportación accesible de forma global desde el Header del sistema para seleccionar la entidad de base de datos a exportar (Ventas, CRM, Inventario, Auditoría, Donaciones), rango de fechas y formato final (CSV/JSON), enviando el trabajo a la cola asíncrona de BullMQ para evitar la saturación del hilo principal del servidor.

* **[CMS-FE-19] Bandeja de Notificaciones Asíncronas (WebSockets):**

  * Menú desplegable tipo Dropdown en el Header administrativo (Campana de Notificaciones). Escucha eventos vía WebSockets desde el backend para notificar visualmente al administrador cuando un trabajo pesado en segundo plano (como el reporte de CMS-FE-18) se ha completado, habilitando su visualización y descarga inmediata.

* **[CMS-FE-20] Command Palette (Navegación Power User):**

  * **[V10 Enterprise]:** Implementación de un atajo global de teclado (`Cmd + K` o `Ctrl + K`) que activa una barra de comandos flotante central (Spotlight Modal). Permite al administrador teclear intenciones directas (Ej. "Cancelar orden 8821" o "Editar Playera") para ejecutar operaciones instantáneas o saltar entre módulos sin requerir navegación manual por clics, acelerando radicalmente la eficiencia operativa.

## 6. 🛡️ PANEL ADMINISTRATIVO CMS (BACKEND Y SEGURIDAD - Nivel Senior)

El Backend administrativo está proyectado para operar en red local y prioriza un entorno de trabajo unificado, previniendo colisiones de integridad entre la Base de Datos SQL y NoSQL.

* **[CMS-BE-01] Acceso Administrativo Global y Local:**

  * Operación en entorno Local/Intranet para máxima seguridad perimetral.

  * Login unificado. No existen divisiones de roles ni jerarquías (Sin RBAC).

  * El endpoint de Registro está bloqueado por defecto. Solo acepta peticiones POST si el Payload incluye `developer_code: "000000"`.

  * Los datos no se dividen por usuario; todos operan en el mismo nivel de permisos. Rotación de JWTs cada 8 horas.

* **[CMS-BE-02] Optimistic Concurrency Control (OCC) - Prevención de Colisiones:**

  * Si "Admin B" y "Admin A" editan el mismo producto, y "Admin B" guarda primero, el Backend rechazará la petición de "Admin A" con un error HTTP 409 (Conflict), requiriendo recargar la página.

* **[CMS-BE-03] Arquitectura "Soft Delete" e Integridad Referencial Cruzada (Game Bridge):**

  * **SQL:** Prohibido el uso de la sentencia `DELETE FROM` en tablas maestras. El botón de "Descontinuar Producto" del frontend disparará un `UPDATE is_deleted = true`.

  * **NoSQL (Game Bridge):** El sistema impedirá eliminar un ítem o recompensa virtual en la DB del Videojuego si esta se encuentra vinculada a un producto físico activo en la Tienda E-commerce. El administrador deberá primero editar el producto físico, remover la recompensa virtual asociada, y solo entonces el sistema le permitirá borrar la recompensa de la BD del juego.

* **[CMS-BE-04] Pipeline de Procesamiento de Medios (Uploads y CDN):**

  * El Backend intercepta las fotos pesadas, las redimensiona (1080x1080px), las convierte a formato .WEBP para optimización SEO y las sube a un CDN (AWS S3/Cloudinary) devolviendo la URL.

* **[CMS-BE-05] Generador Asíncrono de Reportes (Background Jobs):**

  * Para exportaciones masivas, el Backend recibirá los parámetros de filtrado del modal (entidad, fechas, formato), enviará el trabajo de base de datos a una cola (BullMQ) y notificará obligatoriamente por WebSocket a la bandeja del cliente al finalizar para su descarga.

* **[CMS-BE-06] Logger Transaccional Inmutable (Bitácora):**

  * Cualquier modificación ejecutada por el Panel grabará IP, Payload Old y Payload New en una tabla de Logs (Bitácora) mediante Database Triggers, impidiendo operaciones de eliminación. Esto garantiza la auditoría interna a pesar de no existir roles restrictivos.

* **[CMS-BE-07] Endpoints Ligeros de Creación en Línea (Inline Entities):**

  * Para soportar el componente estilo Notion del frontend (Selector Dinámico de Categorías), el backend expondrá rutas de alta velocidad (`POST /api/categories`) utilizando el patrón `findOrCreate` en SQL, garantizando que no se dupliquen categorías si dos administradores crean la misma palabra al mismo tiempo.

## 7. Notas del Arquitecto (Mejoras Finales)

* **UX de Micro-Transacciones (Sección 3.7):** La implementación de un botón de "Donación Lúdica" no intrusivo pero visualmente curioso, abre un flujo de ingresos directos. Al ofrecer botones predefinidos ($10, $20, $30) reducimos la fatiga de decisión del usuario.

* **Procesamiento de Pago Sin Fricción (REQ-BE-09):** Tratar la donación como un endpoint aislado evita obligar al usuario a hacer "Check-out" y llenar datos de envío por una transacción enteramente digital, mejorando la experiencia global.

* **Arquitectura V10 (Scope Creep Integrado):** La plataforma ya no compite como un sitio local; al implementar Omnibox, Gamificación nativa (RPG) y AR (Realidad Aumentada) in-browser, se posiciona en el cuartil superior de E-commerce a nivel global, dictando un nuevo estándar de interacción entre ventas y juego.

## 8. 🛡️ REQUERIMIENTOS DE CIBERSEGURIDAD E INFRAESTRUCTURA DE RED (Nivel Arquitectura SecOps)

Para garantizar la integridad del ecosistema híbrido (E-commerce + Game Bridge) y proteger los datos logísticos y financieros, la infraestructura de red se desplegará bajo un enfoque de defensa en profundidad y políticas de confianza cero (Zero Trust).

### 8.1. Seguridad Perimetral y Control de Acceso (Capa de Red - Arquitectura Optimizada)

* **[REQ-SEC-01] Web Application Firewall (WAF) en la Nube:** Implementación obligatoria de un firewall perimetral mediante delegación de DNS (ej. Cloudflare). Actuará como escudo de borde operando en modo de bloqueo preventivo para mitigar inyecciones SQL, XSS, ocultar la IP pública real del servidor y neutralizar escaneos automatizados de vulnerabilidades.

* **[REQ-SEC-02] Blindaje de Origen (Firewall UFW):** El servidor virtual (VPS) implementará un firewall a nivel de sistema operativo (UFW). Para garantizar el paradigma Zero Trust y evitar que un atacante salte el WAF atacando la IP directa, UFW denegará por defecto todo tráfico entrante. Los puertos web (80/443) permitirán el acceso única y exclusivamente a los rangos de IPs oficiales del proveedor del WAF.

* **[REQ-SEC-03] Segmentación de Redes (Bóveda Aislada):** Aislamiento estricto de entornos. El E-commerce operará en la VPS pública, mientras que las bases de datos (SQL y NoSQL) residirán en una VPS separada. La comunicación estará restringida por UFW para que el puerto de la base de datos (5432) solo acepte peticiones provenientes de la IP de la VPS del E-commerce.

* **[REQ-SEC-04] Políticas de Geobloqueo y Anti-DDoS:** Configuración de reglas en el WAF para absorber ataques de denegación de servicio (SYN Floods) y descartar automáticamente cualquier paquete TCP/UDP proveniente de regiones geográficas fuera del alcance comercial y logístico de la empresa.

### 8.2. Criptografía y Hardening de Servidores

* **[REQ-SEC-05] Estándares de Hashing Seguro (Contraseñas):** Prohibición del uso de algoritmos rápidos (como MD5 o SHA-256) para el almacenamiento de contraseñas de usuarios y administradores. Se implementará obligatoriamente Argon2id o Bcrypt, los cuales incorporan un "Salt" criptográfico dinámico y un factor de costo computacional (retardo intencional) para neutralizar ataques de fuerza bruta y de diccionario.

* **[REQ-SEC-06] Protocolo TLS 1.3 y Políticas HSTS:** El servidor web (ej. Apache/Nginx) deberá forzar conexiones seguras desactivando protocolos obsoletos (TLS 1.0/1.1/1.2 antiguo). Se implementará la cabecera HTTP Strict Transport Security (HSTS) para obligar a los navegadores a interactuar exclusivamente por canales cifrados, previniendo ataques Man-in-the-Middle (MitM).

* **[REQ-SEC-07] Cifrado de Base de Datos en Reposo (AES-256):** Los volúmenes de almacenamiento de los motores de bases de datos (SQL y NoSQL) deberán estar cifrados a nivel de bloque. En caso de una extracción física de los medios de almacenamiento o una brecha a nivel de sistema operativo, la información (nombres, direcciones, correos) será matemáticamente ilegible.

* **[REQ-SEC-08] Ocultamiento de Firmas del Servidor:** Configuración a nivel de servidor web para suprimir las cabeceras de respuesta HTTP que revelen la versión del sistema operativo, el tipo de servidor o la versión del lenguaje de programación subyacente.

### 8.3. Gestión de Identidad y Autenticación (IAM)

* **[REQ-SEC-09] Autenticación de Dos Factores (2FA/MFA):** Requisito ineludible para el acceso al panel CMS. La verificación de identidad de los administradores exigirá un token dinámico basado en tiempo (TOTP) validado por aplicaciones de autenticación, o un código temporal (OTP) enviado mediante una API de correo transaccional segura (SMTP sobre TLS).

* **[REQ-SEC-10] Prevención de Fuerza Bruta (Fail2Ban / Rate Limiting):** Implementación de bloqueos a nivel de red para la protección de endpoints críticos (Login y canje de códigos UUID). El sistema monitorizará las tasas de error; superar el umbral definido (ej. 5 intentos fallidos consecutivos en 1 minuto) detonará un baneo temporal de la dirección IP de origen en las reglas del firewall.

### 8.4. Monitoreo, Auditoría y SecOps (Opción – A largo plazo o a futuro)

* **[REQ-SEC-11] Integración de Logs y SIEM:** Todos los nodos de la infraestructura (firewalls, servidor web y bases de datos) exportarán sus registros de eventos (Syslog) en tiempo real hacia una plataforma centralizada. Esto permitirá la correlación automatizada de anomalías y la generación de alertas tempranas ante posibles incidentes de seguridad.
