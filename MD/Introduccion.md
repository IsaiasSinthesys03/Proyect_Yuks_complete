<!-- ============================================================ -->
<!-- [FASE DE ANÁLISIS PREVIO]                                    -->
<!--                                                              -->
<!-- PLANIFICACIÓN DE LOS 7 PUNTOS OBLIGATORIOS:                  -->
<!--                                                              -->
<!-- 1) JUSTIFICACIÓN:                                            -->
<!--    - Crecimiento explosivo del e-commerce en LATAM (+37%     -->
<!--      post-pandemia).                                         -->
<!--    - Saturación competitiva: PYMES artísticas necesitan      -->
<!--      diferenciación más allá del precio.                     -->
<!--    - Gamificación como vector de retención documentado       -->
<!--      (Deterding et al., 2011; Zichermann, 2011).             -->
<!--    - Animayuks: marca de merchandising artístico que         -->
<!--      desarrolla un videojuego en Flutter → oportunidad       -->
<!--      única de vincular compra física con recompensa digital. -->
<!--    - Valor técnico: demostrar que Clean Architecture +       -->
<!--      Game Bridge es viable para equipos pequeños.            -->
<!--                                                              -->
<!-- 2) DELIMITACIÓN:                                             -->
<!--    - Espacial: ecosistema digital de Animayuks (backend      -->
<!--      Node.js/TypeScript, PostgreSQL, Redis, Stripe Sandbox,  -->
<!--      frontend React, panel CMS, API M2M para Game Bridge).  -->
<!--    - Temporal: desde la concepción arquitectónica hasta la   -->
<!--      fase de pruebas y QA. NO incluye puesta en producción   -->
<!--      ni integración final con el videojuego Flutter.         -->
<!--                                                              -->
<!-- 3) PROBLEMA:                                                 -->
<!--    - Las plataformas e-commerce convencionales tratan la     -->
<!--      gamificación como un módulo cosmético (puntos, badges). -->
<!--    - No existe un puente transaccional seguro que vincule    -->
<!--      una compra ACID en PostgreSQL con un estado eventual    -->
<!--      en un motor de juego NoSQL.                             -->
<!--    - Riesgo de fraude: códigos de recompensa duplicados,     -->
<!--      replay attacks, condiciones de carrera en inventario.   -->
<!--    - Riesgo de compliance: manejo de datos de tarjeta sin    -->
<!--      reducción de PCI Scope.                                 -->
<!--                                                              -->
<!-- 4) OBJETIVO GENERAL:                                         -->
<!--    Diseñar e implementar una plataforma e-commerce con CMS   -->
<!--    para la marca Animayuks, fundamentada en Clean            -->
<!--    Architecture y principios SOLID, que integre de forma     -->
<!--    segura un subsistema de gamificación (Game Bridge)        -->
<!--    capaz de sincronizar transacciones comerciales con        -->
<!--    recompensas canjeables en un videojuego, validando su     -->
<!--    viabilidad técnica mediante pruebas funcionales.          -->
<!--                                                              -->
<!-- 5) HIPÓTESIS/SUPUESTOS:                                      -->
<!--    - Clean Architecture permite escalar el sistema de 16 a  -->
<!--      22+ tablas sin regresiones.                             -->
<!--    - UUID v4 (RFC 4122) elimina colisiones entre nodos      -->
<!--      distribuidos SQL/NoSQL.                                 -->
<!--    - Tokenización de Stripe reduce el PCI Scope a nivel     -->
<!--      SAQ-A (el backend nunca toca datos de tarjeta).         -->
<!--    - El patrón Saga con DLQ garantiza consistencia eventual  -->
<!--      en el flujo de checkout de 11 pasos.                    -->
<!--                                                              -->
<!-- 6) SUSTENTO TEÓRICO Y MÉTODO:                                -->
<!--    - Teorema CAP (Brewer), DDD (Evans), SOLID (Martin),     -->
<!--      Saga Pattern (Richardson), RFC 4122 (UUID), RFC 2104   -->
<!--      (HMAC), PCI-DSS 4.0.                                   -->
<!--    - Metodología ágil incremental (Scrum adaptado) con      -->
<!--      fases temáticas (11–35).                                -->
<!--                                                              -->
<!-- 7) CAPITULADO:                                               -->
<!--    - Cap I: Contexto de la empresa y la marca Animayuks.    -->
<!--    - Cap II: Marco Teórico — Headless CMS, Teorema CAP,     -->
<!--      Persistencia Políglota, UUID, Trie, HMAC, OAuth 2.0.  -->
<!--    - Cap III: Metodología — Clean Architecture, SOLID,       -->
<!--      esquema PostgreSQL (27 migraciones, 22 tablas),        -->
<!--      flujo de checkout, Game Bridge M2M, seguridad.         -->
<!--    - Cap IV: Resultados en fase de pruebas — validación     -->
<!--      de arquitectura, 70+ use cases, 30 controllers,        -->
<!--      experiencias positivas/negativas, aportación.          -->
<!-- ============================================================ -->

# INTRODUCCIÓN

La transformación digital del comercio ha reconfigurado de manera irreversible las expectativas del consumidor contemporáneo. El crecimiento sostenido de las plataformas de comercio electrónico en América Latina —acelerado significativamente a partir de la contingencia sanitaria global de 2020— ha impuesto a las pequeñas y medianas empresas (PYMES) del sector creativo y artístico la necesidad imperante de establecer presencia digital propia, no solo como un canal alternativo de venta, sino como un ecosistema integral capaz de competir en experiencia de usuario con los grandes *marketplaces* consolidados. En este escenario de saturación competitiva, donde la diferenciación por precio resulta insostenible a largo plazo, la integración de mecánicas de gamificación ha emergido como un vector estratégico para incrementar la retención, el *engagement* y la recurrencia de compra del cliente final.

Es precisamente en la convergencia entre el comercio electrónico y la gamificación transversal donde se inscribe el presente trabajo de titulación. La marca Animayuks, dedicada al diseño y comercialización de *merchandising* artístico con identidad visual propia, desarrolla paralelamente un videojuego en la plataforma Flutter. Esta circunstancia crea una oportunidad técnica singular: vincular de forma segura y verificable la compra de un producto físico en la tienda web con la obtención de una recompensa virtual canjeable dentro del videojuego. Sin embargo, la materialización de este vínculo trasciende una simple emisión de códigos promocionales; requiere resolver desafíos fundamentales de ingeniería de sistemas distribuidos, seguridad transaccional y conciliación de estados entre subsistemas con paradigmas de consistencia radicalmente distintos.

El problema central que motiva esta investigación radica en la inexistencia de un patrón arquitectónico estandarizado que permita a una PYME integrar un puente transaccional seguro —denominado en este proyecto como "Game Bridge"— entre un sistema de comercio electrónico con garantías ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad) y un motor de videojuego que opera bajo modelos de consistencia eventual. Las plataformas convencionales de *E-commerce* tratan la gamificación como un módulo cosmético superpuesto (sistemas de puntos, insignias o niveles), sin abordar los riesgos inherentes a la sincronización bidireccional de estados: duplicación fraudulenta de códigos de recompensa, ataques por repetición (*replay attacks*), condiciones de carrera en la reserva concurrente de inventario, y la exposición de datos de tarjeta de crédito ante la ausencia de mecanismos de reducción del alcance PCI.

Ante esta problemática, el objetivo general del presente trabajo consiste en diseñar e implementar una plataforma de comercio electrónico con sistema de gestión de contenidos (CMS) para la marca Animayuks, fundamentada en los principios de Clean Architecture y los cinco principios SOLID de diseño orientado a objetos, que integre de forma segura un subsistema de gamificación (Game Bridge) capaz de sincronizar transacciones comerciales con recompensas virtuales canjeables en un videojuego, validando la viabilidad técnica de la propuesta mediante la ejecución de pruebas funcionales en un entorno controlado.

La delimitación espacial del proyecto abarca la totalidad del ecosistema digital de la plataforma Animayuks: el servidor *backend* desarrollado en Node.js con TypeScript sobre el framework Fastify, la base de datos relacional PostgreSQL, los servicios de caché y colas de trabajo sobre Redis y BullMQ, la integración con la pasarela de pago Stripe en modo *Sandbox*, el almacenamiento de medios en Amazon S3, la interfaz web del cliente construida con React, el panel administrativo CMS y la API Machine-to-Machine (M2M) que materializa el Game Bridge. Desde la perspectiva temporal, el alcance del proyecto comprende desde la fase de concepción arquitectónica y diseño de dominio hasta la fase de pruebas y aseguramiento de calidad (QA), sin incluir la puesta en producción final ni la integración completa con el aplicativo del videojuego en Flutter, los cuales se contemplan como trabajo futuro.

El desarrollo de la plataforma se sustenta en un conjunto de supuestos técnicos que orientaron las decisiones de diseño a lo largo de las iteraciones. Se partió de la premisa de que la adopción de Clean Architecture permitiría escalar el sistema desde un esquema inicial de 16 tablas hasta 22 tablas sin introducir regresiones en los módulos preexistentes, gracias a la regla de dependencia unidireccional entre capas. Se asumió que la generación de identificadores universalmente únicos conforme al estándar RFC 4122 (UUID versión 4) proporcionaría un espacio de entropía suficiente para eliminar el riesgo de colisión entre claves primarias generadas de forma concurrente en nodos distribuidos con paradigmas de persistencia heterogéneos. Asimismo, se supuso que la delegación total del procesamiento de datos de tarjeta a la pasarela de pago mediante tokenización reduciría el alcance de certificación PCI-DSS al nivel SAQ-A, donde el *backend* propio nunca procesa, transmite ni almacena información sensible de las tarjetas. Finalmente, se postuló que la implementación del patrón Saga con una *Dead-Letter Queue* (DLQ) para los pasos post-commit del motor de *checkout* garantizaría la consistencia eventual del sistema ante fallos transitorios de infraestructura.

El sustento teórico del proyecto se articula en torno a cinco ejes fundamentales de la ingeniería de software: el Teorema CAP de Brewer, que justifica la persistencia políglota y la segregación de responsabilidades de almacenamiento; los patrones de integración empresarial y el diseño dirigido por el dominio (*Domain-Driven Design*) propuestos por Evans, que fundamentan la Capa Anti-Corrupción del Game Bridge; los principios SOLID formulados por Robert C. Martin, que rigen la totalidad de las decisiones de diseño de clases e interfaces; los estándares criptográficos RFC 4122 (UUID) y RFC 2104 (HMAC), que sustentan la generación de identificadores distribuidos y la verificación de integridad de *webhooks*; y la normativa PCI-DSS 4.0, que dicta los controles de seguridad para el procesamiento de pagos electrónicos. Desde el punto de vista metodológico, se adoptó un enfoque ágil incremental inspirado en Scrum, donde cada *sprint* temático —organizado en fases secuenciales numeradas del 11 al 35— materializó una vertical completa de funcionalidad, desde la definición de interfaces de dominio hasta el despliegue del controlador HTTP correspondiente.

El presente documento se estructura en cuatro capítulos que guían al lector de forma progresiva desde el contexto empresarial hasta los resultados técnicos obtenidos. El Capítulo I presenta el contexto organizacional de la marca Animayuks, describiendo su modelo de negocio, su identidad visual y la visión estratégica que motiva la convergencia entre el comercio electrónico y el desarrollo de un videojuego propio. El Capítulo II desarrolla el marco teórico que sustenta las decisiones arquitectónicas del proyecto, abordando en profundidad la evolución del paradigma *Headless CMS*, la gamificación transversal, el Teorema CAP y la persistencia políglota, la algoritmia de identificadores UUID, las estructuras de datos para búsqueda predictiva (árboles Trie e índices invertidos), y los estándares de seguridad transaccional (PCI-DSS, OAuth 2.0, HMAC). El Capítulo III expone la metodología y la propuesta de implementación, detallando la pila tecnológica seleccionada, el modelo de dominio con sus 21 entidades puras, el esquema relacional de 22 tablas construido mediante 27 migraciones incrementales, el flujo transaccional del motor de *checkout* de 11 pasos con patrón Saga, la arquitectura M2M del Game Bridge, el sistema de autenticación multifactor y el diseño del panel administrativo CMS. Finalmente, el Capítulo IV documenta los resultados obtenidos durante la fase de pruebas, presentando la validación de la arquitectura implementada —con más de 70 casos de uso, 30 controladores HTTP y 32 interfaces de puerto verificados—, las pruebas funcionales de los flujos transaccionales principales, la evaluación del subsistema de seguridad, la discusión honesta de alcances y limitaciones, y las experiencias técnicas positivas y negativas acumuladas a lo largo del proceso de desarrollo.

A través de esta estructura, el presente trabajo aspira a demostrar que la integración rigurosa entre un ecosistema de comercio electrónico y un subsistema de gamificación no es un ejercicio meramente estético, sino un desafío de ingeniería de software que exige la aplicación disciplinada de patrones arquitectónicos, estándares criptográficos y principios de diseño orientado a objetos. La plataforma Animayuks constituye, en este sentido, tanto un producto funcional para una marca real como una arquitectura de referencia replicable para pequeñas y medianas empresas que busquen diferenciarse en un mercado digital cada vez más competitivo mediante la convergencia entre el comercio y la experiencia lúdica.
