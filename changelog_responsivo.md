# Changelog de refactorización responsiva

Fecha de validación: 2026-07-31

## Alcance

La interfaz se auditó con enfoque Mobile-First sobre el Storefront, Perfil, flujos transaccionales, modales y CMS. Se conservaron la lógica de negocio, los hooks, las mutaciones y el Jungle Theme; los cambios se limitaron a estructura responsiva, ergonomía táctil, control de desbordamientos y jerarquía espacial.

| Componente / área | Problema detectado en móvil | Solución aplicada |
|---|---|---|
| `index.html` y raíz React | Viewport incompleto y riesgo de scroll horizontal global | Viewport móvil explícito, bloqueo horizontal en `body`, `#root` y hoja responsiva compartida |
| Sistema responsivo global | Medios desbordables, inputs que activaban zoom y blancos táctiles pequeños | Reglas DRY para medios fluidos, inputs de 16 px, objetivos táctiles de 44 px y soporte para movimiento reducido |
| Header global | Navegación y acciones saturadas en anchos pequeños | Navegación desktop desde `md`, menú hamburguesa móvil y acciones de perfil/carrito de 44 px |
| Menú móvil | Drawer rígido, controles pequeños y navegación poco semántica | Drawer de 80% con ancho máximo, scroll vertical seguro, overlay accesible y controles de 44 px |
| Hero Carousel | Altura rígida, título/ilustración solapados y paginadores pequeños | Altura con `svh`, tipografía escalonada, ilustración reservada para `xl` y paginadores con hitbox de 44 px |
| Trending Top | Tarjetas apretadas y acciones comprimidas | Grid 1/2/4 columnas, títulos con `line-clamp`, botones sin contracción y cabecera apilable |
| Experiencia / Landing | Transformación negativa invadía otras secciones | Desplazamiento decorativo limitado a escritorio ancho |
| Catálogo | Toolbar, filtros y grid no escalaban limpiamente | Filtros apilables, contenedores `min-w-0` y grid 1/2/3/4 columnas |
| Tarjetas de catálogo | Corazón y carrito menores a 44 px; textos variables deformaban tarjetas | Controles táctiles de 44 px, `shrink-0` y títulos limitados a dos líneas |
| Producto individual | Selector de cantidad pequeño | Controles de cantidad elevados a 44 × 44 px sin alterar su lógica |
| Perfil | Sidebar y tarjetas comprimían el contenido; acciones dependían de hover | Navegación horizontal móvil, contenido `min-w-0`, tarjetas adaptables y acciones siempre accesibles en táctil |
| Direcciones | Formulario de dos columnas no cabía en 320 px | Una columna en móvil y dos desde `sm`; cabecera apilable y padding progresivo |
| Autenticación, OTP y checkout | Modales excedían la altura útil y formularios se estrechaban | `100dvh`, scroll interno seguro, grids 1→2, inputs anti-zoom y OTP adaptable |
| Carrito y perfil lateral | Drawers demasiado estrechos o controles de cierre pequeños | Ancho completo/80% en móvil, máximo desktop y cierre semántico de 44 px |
| Footer y legales | Enlaces pequeños; tabs y PDF forzaban el ancho | Enlaces de 44 px, tabs con scroll local y visor PDF con altura/ancho adaptativos |
| Layout administrativo | Sidebar permanente reducía a cero el contenido móvil | Sidebar off-canvas con overlay, cabecera móvil y contenido sin margen fijo antes de `lg` |
| Dashboard y páginas CMS | KPIs, filtros, formularios y tablas asumían desktop | Grids progresivos, filtros apilables, tablas con scroll local y padding móvil |
| Kanban CMS | Columnas causaban scroll de página | Scroll horizontal local con columnas basadas en viewport y `scroll-snap` |
| Legales CMS | Visor e historial competían por ancho | Layout apilado hasta `xl`, visor fluido e historial lateral solo en escritorio |
| Modales CMS | Formularios y confirmaciones podían salir del viewport | Scroll interno con altura dinámica, padding progresivo y grids Mobile-First |

## Validación empírica

| Resolución | Superficies verificadas | Resultado |
|---|---|---|
| 320 × 568 | Landing, menú móvil, autenticación, legales y login CMS | Sin objetivos táctiles visibles menores a 44 px; sin errores de render |
| 390 × 844 | Catálogo y producto individual | Grid y galería fluidos; controles visibles y sin scroll horizontal de contenido |
| 768 × 1024 | Landing y catálogo | Navegación tablet correcta; catálogo en tres columnas sin desbordamiento |
| 1024 × 768 | Hero y navegación | Ilustración decorativa correctamente omitida para evitar solapamiento |
| 1280 × 800 | Hero desktop | Título y arte sin intersección; ancho documental estable |

La consola del navegador quedó sin errores durante el recorrido final. El login del CMS se validó visualmente a 320 px; las vistas autenticadas del CMS se validaron estructuralmente y mediante compilación, sin inventar credenciales administrativas para forzar un acceso.

## Verificación técnica

- La compilación de producción de Vite finaliza sin errores.
- El aviso de chunks mayores a 500 kB permanece como recomendación de optimización de carga, no como fallo funcional o responsivo.
- Las tablas anchas conservan scroll local deliberado; no trasladan el desbordamiento al documento.
- No se modificaron contratos de API, stores ni mutaciones como parte de esta refactorización.

## Corrección de preservación visual

- Se restauraron los controles originales de acceso y carrito en la barra superior del catálogo, manteniendo su ubicación, forma circular y comportamiento previo.
- El Header global recuperó la presentación anterior de usuario y carrito tipo píldora; solo conserva el área táctil mínima necesaria para móvil.
- La restauración se comprobó a 390 × 844 y 1280 × 800 sin desbordamiento ni errores de consola.
