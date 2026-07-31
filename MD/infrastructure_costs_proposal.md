# Propuesta de Infraestructura y Costos Operativos
**Proyecto:** Plataforma E-commerce Animayuks
**Fecha:** Julio 2026
**Fase:** Lanzamiento y Validación de Mercado
**Precios verificados:** Julio 2026 (se recomienda revalidar antes de contratar)

---

## 1. Resumen Ejecutivo

Este documento detalla la infraestructura en la nube requerida para desplegar la plataforma E-commerce "Animayuks" en producción. Se presentan **dos escenarios de inversión** para que la dirección pueda tomar una decisión informada según el nivel de riesgo que esté dispuesta a asumir.

| Escenario | Costo Mensual | Nivel de Riesgo |
| :--- | :--- | :--- |
| **A — Mínimo Viable** | **$8.25 USD / mes** | Medio-Alto |
| **B — Producción Recomendado** | **$33.25 USD / mes** | Bajo |

---

## 2. Arquitectura del Dominio

Se adquirirá un único dominio (ej. `animayuks.com`) y se configurarán subdominios para separar los servicios:

| Componente | URL | Función |
| :--- | :--- | :--- |
| **Tienda (Frontend)** | `animayuks.com` | Interfaz visual para los clientes |
| **API (Backend)** | `api.animayuks.com` | Procesamiento de pagos, pedidos e inventario |

Al compartir el mismo dominio raíz, las cookies de autenticación funcionan de forma nativa entre ambos servicios (política SameSite de los navegadores), mejorando la seguridad y eliminando problemas de compatibilidad con sesiones.

---

## 3. Desglose Completo de Servicios

### 🌍 Dominio Personalizado (.com)
La dirección oficial de la tienda en internet.

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor Sugerido** | Namecheap o Cloudflare Registrar |
| **Precio de Mercado** | $10.00 – $15.00 USD / año |
| **Lo que pagaremos** | **~$15.00 USD / año ($1.25 USD / mes)** |
| **Incluye** | Subdominios ilimitados, gestión DNS |

* **¿Por qué pagar?** Un dominio propio es obligatorio para un e-commerce. Los clientes no confían en sitios con URLs genéricas como `animayuks.onrender.com` para ingresar datos de tarjeta.

---

### ⚙️ Backend — Servidor API (Node.js)
El cerebro de la tienda: procesa pagos, gestiona inventario, autenticación y comunicación con todos los servicios.

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Render.com (Web Service) |
| **Plan Gratuito** | Se apaga tras 15 min de inactividad (30–50 seg para despertar) |
| **Plan Starter** | **$7.00 USD / mes** — 512 MB RAM, 0.5 vCPU, siempre encendido |
| **Plan Standard** | $15.00 – $25.00 USD / mes — 1–2 GB RAM |
| **Lo que pagaremos** | **$7.00 USD / mes (Starter)** |
| **Incluye** | SSL/HTTPS gratuito, soporte para dominio personalizado, facturación por segundo |

* **¿Por qué pagar?** Un servidor que tarda 50 segundos en responder pierde clientes. En un e-commerce, cada segundo de carga reduce la tasa de conversión un ~7%. El plan Starter mantiene el servidor activo 24/7.

> [!NOTE]
> Render utiliza un sistema de **Workspace Plans** (plan del espacio de trabajo). El plan **Hobby** ($0/mes) permite hasta 25 servicios y es suficiente para el lanzamiento. Si en el futuro se necesitan funciones avanzadas como autoescalado, el plan **Pro** del workspace tiene un costo de $25 USD/mes adicionales.

---

### 🖥️ Frontend — Interfaz de la Tienda (React/Vite)
El sitio web estático que ven los clientes.

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Render.com (Static Site) |
| **Plan Gratuito** | Los sitios estáticos NO se apagan. Incluye hasta 2 dominios personalizados |
| **Plan Pro (Vercel)** | $20.00 USD / mes |
| **Lo que pagaremos** | **$0.00 USD / mes (Plan Gratuito de Render)** |
| **Incluye** | SSL/HTTPS gratuito, CDN, soporte para dominio personalizado |
| **Límite de ancho de banda** | ~5 GB / mes en plan Hobby |

* **¿Por qué NO pagar?** A diferencia del backend, los sitios estáticos se distribuyen mediante CDN y no necesitan un servidor encendido. El plan gratuito de Render ofrece el mismo rendimiento para el volumen inicial de tráfico.

> [!WARNING]
> **Vercel descartado para uso comercial:** El plan Hobby de Vercel prohíbe explícitamente el uso comercial en sus términos de servicio. Para un e-commerce que genera ingresos, se requeriría su plan Pro ($20 USD/mes). Por esta razón, se recomienda **Render** para el frontend, donde el plan gratuito sí permite uso comercial.

---

### 🗄️ Base de Datos (PostgreSQL)
Almacena toda la información crítica del negocio: usuarios, pedidos, inventario, pagos y configuraciones.

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Supabase |
| **Plan Gratuito** | 500 MB almacenamiento, 5 GB egress, máx. 2 proyectos activos, sin respaldos automáticos |
| **Plan Pro** | **$25.00 USD / mes** — 8 GB almacenamiento, 250 GB egress, respaldos diarios, sin pausas |
| **Lo que pagaremos** | **Escenario A: $0.00 / Escenario B: $25.00 USD / mes** |

> [!CAUTION]
> **Riesgo crítico del plan gratuito:** Supabase **pausa automáticamente** los proyectos gratuitos después de **7 días sin actividad en la base de datos**. Si la tienda tiene un periodo bajo en tráfico (ej. días festivos, temporada baja), la base de datos se apagará y la tienda quedará completamente fuera de servicio hasta que se reactive manualmente desde el dashboard de Supabase. Además, **no hay respaldos automáticos**: si se pierden datos de clientes o pedidos, no hay forma de recuperarlos.

* **Recomendación:** Para un e-commerce en producción con datos reales de clientes, se recomienda fuertemente el **Plan Pro ($25.00 USD/mes)**.

---

### 🚀 Caché y Colas de Trabajo (Redis)
Maneja sesiones de usuario, idempotencia de pagos, locks distribuidos y colas de procesamiento en segundo plano (emails, reportes).

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Upstash (Serverless Redis) |
| **Plan Gratuito** | **500,000 comandos / mes**, 256 MB almacenamiento |
| **Plan Pay-as-you-go** | $0.20 USD por cada 100,000 comandos adicionales |
| **Plan Fijo** | Desde $10.00 USD / mes |
| **Lo que pagaremos** | **$0.00 USD / mes (Plan Gratuito)** |

* **¿Por qué NO pagar por ahora?** 500,000 comandos mensuales equivalen aproximadamente a 3,000–5,000 visitas diarias, lo cual es más que suficiente para la fase de lanzamiento.

---

### 📁 Almacenamiento Multimedia (S3 Compatible)
Aloja imágenes de productos, videos promocionales, banners y documentos legales (PDFs).

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Cloudflare R2 |
| **Plan Gratuito** | 10 GB almacenamiento, 1M escrituras/mes, 10M lecturas/mes. **Sin cobro por ancho de banda de salida** |
| **Plan de Pago** | $0.015 USD / GB / mes (solo al exceder 10 GB) |
| **Lo que pagaremos** | **$0.00 USD / mes (Plan Gratuito)** |

* **¿Por qué NO pagar?** 10 GB es suficiente para miles de imágenes de productos. A diferencia de Amazon S3 (que cobra por cada descarga), Cloudflare R2 no cobra ancho de banda de salida, eliminando el riesgo de costos sorpresa por alto tráfico.

---

### 📧 Email Transaccional (OTP, Confirmaciones, Recuperación de Contraseña)
Envío de correos automáticos del sistema.

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Resend |
| **Plan Gratuito** | 3,000 correos / mes, **100 correos / día**, 1 dominio verificado, 1 día de retención de logs |
| **Plan Pro** | $20.00 USD / mes — 50,000 correos / mes, sin límite diario |
| **Lo que pagaremos** | **$0.00 USD / mes (Plan Gratuito)** |

* **¿Por qué NO pagar por ahora?** 100 correos diarios es suficiente para la fase de lanzamiento. Se requiere verificar el dominio de envío (`noreply@animayuks.com`) en Resend para evitar que los correos caigan en spam.

> [!NOTE]
> El límite más restrictivo es el de **100 correos por día**. En un día de alta actividad con muchos registros, OTPs y confirmaciones de pedido, este límite podría alcanzarse. Se debe monitorear y escalar a Pro ($20 USD/mes) si es necesario.

---

### 💳 Pasarela de Pagos (Stripe)
Procesamiento de tarjetas de crédito/débito y donaciones.

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Stripe |
| **Costo Fijo Mensual** | **$0.00 USD** (sin mensualidad ni cuota de setup) |
| **Tarjetas Nacionales (México)** | **3.6% + $3.00 MXN** por transacción exitosa (+ IVA) |
| **Tarjetas Internacionales** | +1.5% adicional sobre la tarifa base |
| **Conversión de Moneda** | +2.0% adicional si aplica |
| **Pagos en OXXO** | 3.6% + $3.00 MXN por transacción |
| **Transferencias SPEI** | $7.00 MXN por transacción |

> [!IMPORTANT]
> **Ejemplo práctico (tarjeta nacional):** En una venta de $500.00 MXN, Stripe retiene $21.00 MXN (~$1.20 USD) como comisión + IVA. El resto (~$479.00 MXN) se deposita en la cuenta bancaria. Si no hay ventas, no hay cobro alguno.

---

### 🔐 Autenticación (Google OAuth + JWT)
Login social con Google y sistema de tokens de sesión.

| Concepto | Detalle |
| :--- | :--- |
| **Proveedor** | Google Cloud Console |
| **Lo que pagaremos** | **$0.00 USD / mes** |

* Google OAuth es gratuito sin límite de usuarios. Solo requiere configurar las credenciales en la consola de Google Cloud.

---

### 🔒 Certificados SSL/HTTPS
Encriptación obligatoria para procesar pagos en línea y cumplir normativas PCI-DSS.

| Concepto | Detalle |
| :--- | :--- |
| **Lo que pagaremos** | **$0.00 USD / mes** |

* Render genera y renueva automáticamente certificados SSL gratuitos (Let's Encrypt) para dominios personalizados.

---

## 4. Resumen Financiero

### Escenario A — Mínimo Viable (Riesgo Medio-Alto)

| Servicio | Proveedor | Plan | Precio Real del Plan | Lo que pagaremos |
| :--- | :--- | :--- | :--- | :--- |
| Dominio (.com) | Namecheap | Anual | $15.00 USD/año | **$1.25 USD/mes** |
| Backend API | Render | Starter | $7.00 USD/mes | **$7.00 USD/mes** |
| Frontend | Render | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Base de Datos | Supabase | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Caché (Redis) | Upstash | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Multimedia | Cloudflare R2 | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Email | Resend | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Pagos | Stripe | Sin mensualidad | $0.00 USD/mes | $0.00 USD/mes |
| Auth | Google Cloud | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| SSL/HTTPS | Render | Incluido | $0.00 USD/mes | $0.00 USD/mes |
| | | | | |
| **TOTAL** | | | | **$8.25 USD / mes** |

> [!CAUTION]
> **Riesgos de este escenario:**
> - La base de datos puede pausarse automáticamente tras 7 días sin actividad, dejando la tienda fuera de servicio.
> - No hay respaldos automáticos de la base de datos. Si se pierden datos de clientes o pedidos, no hay recuperación posible.
> - Los correos transaccionales están limitados a 100 por día.
> - Solo 2 dominios personalizados permitidos en Render Hobby.

---

### Escenario B — Producción Recomendado (Riesgo Bajo) ⭐

| Servicio | Proveedor | Plan | Precio Real del Plan | Lo que pagaremos |
| :--- | :--- | :--- | :--- | :--- |
| Dominio (.com) | Namecheap | Anual | $15.00 USD/año | **$1.25 USD/mes** |
| Backend API | Render | Starter | $7.00 USD/mes | **$7.00 USD/mes** |
| **Base de Datos** | **Supabase** | **Pro** | **$25.00 USD/mes** | **$25.00 USD/mes** |
| Frontend | Render | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Caché (Redis) | Upstash | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Multimedia | Cloudflare R2 | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Email | Resend | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| Pagos | Stripe | Sin mensualidad | $0.00 USD/mes | $0.00 USD/mes |
| Auth | Google Cloud | Gratuito | $0.00 USD/mes | $0.00 USD/mes |
| SSL/HTTPS | Render | Incluido | $0.00 USD/mes | $0.00 USD/mes |
| | | | | |
| **TOTAL** | | | | **$33.25 USD / mes** |

> [!TIP]
> **Ventajas de este escenario:**
> - Base de datos siempre activa, sin riesgo de pausas por inactividad.
> - Respaldos automáticos diarios con recuperación point-in-time (hasta 7 días).
> - 8 GB de almacenamiento en base de datos (16x más que el plan gratuito).
> - 250 GB de egress (50x más que el plan gratuito).
> - El resto de los servicios (Frontend, Redis, R2, Email, Auth, SSL) operan de forma segura en sus capas gratuitas sin riesgo para el negocio.

### Costos Variables (Adicionales a ambos escenarios)

| Concepto | Proveedor | Tarifa |
| :--- | :--- | :--- |
| Comisión por venta (tarjeta nacional) | Stripe | 3.6% + $3.00 MXN + IVA por transacción |
| Comisión por venta (tarjeta internacional) | Stripe | 5.1% + $3.00 MXN + IVA por transacción |
| Pago en OXXO | Stripe | 3.6% + $3.00 MXN por transacción |
| Transferencia SPEI | Stripe | $7.00 MXN por transacción |

---

## 5. Configuraciones Post-Despliegue (Sin costo adicional)

Una vez desplegada la plataforma, se deben realizar estas configuraciones únicas:

1. **DNS:** Configurar registros CNAME en el proveedor de dominio para apuntar `animayuks.com` y `api.animayuks.com` a los servidores de Render.
2. **Google OAuth:** Actualizar la URI de redirección en la Consola de Google Cloud a `https://api.animayuks.com/api/auth/oauth/google/callback`.
3. **Stripe Webhooks:** Registrar la URL del webhook de producción en el Dashboard de Stripe: `https://api.animayuks.com/api/stripe/webhook`.
4. **Resend:** Verificar el dominio de envío (`animayuks.com`) mediante registros DNS para que los correos no caigan en spam.

---

## 6. Plan de Escalabilidad (Fase 2 — Crecimiento)

| Servicio | Condición para Escalar | Nuevo Costo |
| :--- | :--- | :--- |
| Backend | Tráfico alto sostenido o eventos pico | Render Standard: $15.00 – $25.00 USD / mes |
| Workspace Render | Se requiere autoescalado o previews | Render Pro Workspace: +$25.00 USD / mes |
| Redis | Más de 500,000 comandos / mes | Upstash Pay-as-you-go: ~$0.20 / 100K comandos |
| Email | Más de 100 correos / día | Resend Pro: $20.00 USD / mes |
| Multimedia | Más de 10 GB de archivos almacenados | R2: $0.015 USD / GB adicional / mes |

---

## 7. Conclusión y Recomendación

Para un e-commerce que procesa pagos reales y almacena datos de clientes, **se recomienda el Escenario B ($33.25 USD / mes)**, donde la única inversión adicional frente al mínimo es asegurar la base de datos con respaldos automáticos y disponibilidad continua.

El costo del Escenario B equivale a aproximadamente **$665 MXN mensuales**, una inversión mínima considerando que protege los datos del negocio y garantiza una experiencia de compra profesional y confiable.
