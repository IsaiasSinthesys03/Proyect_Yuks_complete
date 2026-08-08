<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Fastify-5.x-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7.4-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
</p>

# 🦊 Animayuks — E-Commerce Platform

**Animayuks** es una plataforma e-commerce completa construida con una arquitectura **Clean Architecture** + **SOLID** de grado producción. Incluye una **tienda online pública**, un **panel de administración (CMS)** y una **API REST robusta** con pagos reales, notificaciones en tiempo real, sistema de recompensas gamificado y más.

---

## 📑 Tabla de Contenidos

- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Tech Stack](#-tech-stack)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación Rápida](#-instalación-rápida)
- [Variables de Entorno](#-variables-de-entorno)
- [Levantar la API (Backend)](#-levantar-la-api-backend)
- [Levantar el Frontend](#-levantar-el-frontend)
- [Workers en Background](#-workers-en-background)
- [Base de Datos y Migraciones](#-base-de-datos-y-migraciones)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Endpoints Principales de la API](#-endpoints-principales-de-la-api)
- [Páginas del Frontend](#-páginas-del-frontend)
- [Servicios Externos](#-servicios-externos)
- [Scripts Útiles](#-scripts-útiles)
- [Despliegue a Producción](#-despliegue-a-producción)
- [Licencia](#-licencia)

---

## 🏗 Arquitectura del Proyecto

El proyecto está organizado como un **monorepo** con dos aplicaciones principales:

```
Landin_Page_E-commers_Animayuks/
├── API_Backend/              ← API REST (Fastify + TypeScript)
├── Plantilla_Prototipos_UI_UX/  ← Frontend SPA (React + Vite)
└── README.md
```

La API sigue **Clean Architecture** con tres capas bien definidas:

```
src/
├── domain/        → Entidades, errores de dominio y contratos (ports)
├── application/   → Casos de uso (lógica de negocio pura)
└── infrastructure/ → Adaptadores: DB, HTTP, caché, colas, servicios externos
```

---

## 🛠 Tech Stack

### Backend — `API_Backend/`

| Capa | Tecnología |
|------|-----------|
| Framework HTTP | **Fastify 5** con helmet, CORS, rate-limit, cookies, multipart, WebSocket |
| Lenguaje | **TypeScript 5** (compilado con `tsx`) |
| Base de datos | **PostgreSQL** (Kysely como query builder tipado) |
| Caché / Colas | **Redis 7.4** + **BullMQ** (idempotencia, locks distribuidos, DLQ) |
| Autenticación | **JWT** (access + refresh), **TOTP 2FA**, **Google OAuth 2.0** |
| Pagos | **Stripe** (checkout, webhooks, reembolsos) |
| Storage | **AWS S3** (imágenes de producto, banners, media) |
| Email | **Resend** (transaccional vía worker asíncrono) |
| Monitoreo | **Sentry** (error tracking) |
| Hashing | **Argon2** |
| Imágenes | **Sharp** (optimización/redimensión) |

### Frontend — `Plantilla_Prototipos_UI_UX/`

| Capa | Tecnología |
|------|-----------|
| Framework | **React 18** |
| Bundler | **Vite 4** |
| Routing | **React Router v6** |
| Estado global | **Zustand** |
| Data fetching | **TanStack React Query** |
| HTTP client | **Axios** |
| Pagos | **Stripe.js + React Stripe** |
| Iconos | **Lucide React** |
| CSS | **Tailwind CSS** (via CDN) + fuentes custom (Bungee, Quicksand, Outfit) |
| Monitoreo | **Sentry React** |
| Tiempo real | **WebSocket nativo** |

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta | Versión Mínima | Propósito |
|------------|---------------|----------|
| **Node.js** | `≥ 18.x` | Runtime para API y frontend |
| **npm** | `≥ 9.x` | Gestor de paquetes |
| **Docker** + **Docker Compose** | Cualquiera reciente | Contenedor de Redis |
| **PostgreSQL** | `≥ 14` | Base de datos (local o servicio como Supabase) |

---

## ⚡ Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/IsaiasSinthesys03/Proyect_Yuks_complete.git
cd Proyect_Yuks_complete
```

### 2. Instalar dependencias del Backend

```bash
cd API_Backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
cd ../Plantilla_Prototipos_UI_UX
npm install
```

### 4. Configurar variables de entorno

```bash
# Backend
cd ../API_Backend
cp .env.example .env
# → Edita .env con tus credenciales reales (ver sección Variables de Entorno)

# Frontend
cd ../Plantilla_Prototipos_UI_UX
cp .env.example .env
# → Edita .env con la URL de la API
```

### 5. Levantar Redis con Docker

```bash
cd ../API_Backend
npm run redis:up
```

### 6. Ejecutar las migraciones de la base de datos

```bash
npm run migrate
```

### 7. Iniciar ambos servicios

```bash
# Terminal 1 — API Backend
cd API_Backend
npm run dev

# Terminal 2 — Frontend
cd Plantilla_Prototipos_UI_UX
npm run dev
```

¡Listo! La tienda estará disponible en `http://localhost:5173` y la API en `http://localhost:3000`.

---

## 🔐 Variables de Entorno

### Backend (`API_Backend/.env`)

Copia el archivo `.env.example` a `.env` y configura los siguientes valores:

| Variable | Descripción | Ejemplo |
|----------|-----------|---------|
| `PORT` | Puerto del servidor HTTP | `3000` |
| `HOST` | Host de escucha | `0.0.0.0` |
| `NODE_ENV` | Entorno (`development` / `production`) | `development` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://postgres:password@localhost:5432/animayuks` |
| `REDIS_URL` | URL de conexión Redis | `redis://127.0.0.1:6379` |
| `JWT_SECRET` | Secreto para tokens JWT (≥ 32 chars) | — |
| `JWT_EXPIRES_IN` | Expiración del access token | `15m` |
| `REFRESH_TOKEN_SECRET` | Secreto para refresh tokens | — |
| `REFRESH_TOKEN_EXPIRES_IN` | Expiración del refresh token | `7d` |
| `ADMIN_JWT_EXPIRES_IN` | Expiración JWT de administradores | `8h` |
| `ADMIN_ALLOWED_IPS` | IPs con acceso al CMS (separadas por coma) | `127.0.0.1,::1,::ffff:127.0.0.1` |
| `RATE_LIMIT_MAX` | Límite de requests por IP por minuto | `200` |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe | `whsec_...` |
| `S3_BUCKET` | Nombre del bucket S3 | `animayuks-media` |
| `S3_REGION` | Región AWS | `us-east-1` |
| `S3_ACCESS_KEY_ID` | Access Key de AWS | — |
| `S3_SECRET_ACCESS_KEY` | Secret Key de AWS | — |
| `EMAIL_API_KEY` | API Key de Resend | `re_...` |
| `EMAIL_FROM` | Dirección "De" de los correos | `Animayuks <noreply@animayuks.com>` |
| `PASSWORD_RESET_URL` | URL base para restablecer contraseña | `http://localhost:5173/reset-password` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | — |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth | — |
| `GOOGLE_REDIRECT_URI` | URI de callback OAuth | `http://localhost:3000/api/auth/oauth/google/callback` |
| `REPORTS_DIR` | Directorio para reportes CSV | `./reports` |
| `PAYMENTS_SIMULATED` | Pagos simulados (sin Stripe) | `false` |

> **Nota:** El servidor arranca sin las credenciales de S3, Google OAuth y Resend (degradación elegante). Las funcionalidades dependientes devuelven HTTP 502/503 hasta configurarlas.

### Frontend (`Plantilla_Prototipos_UI_UX/.env`)

| Variable | Descripción | Ejemplo |
|----------|-----------|---------|
| `VITE_API_URL` | URL base de la API | `http://127.0.0.1:3000` |
| `VITE_WS_URL` | URL del WebSocket | `ws://localhost:3000` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave publicable de Stripe | `pk_test_...` |

---

## 🚀 Levantar la API (Backend)

```bash
cd API_Backend
```

### Modo desarrollo (con hot-reload)

```bash
npm run dev
```

Esto ejecuta `tsx watch src/main.ts` — reinicia automáticamente al detectar cambios.

### Modo producción

```bash
npm start
```

El servidor se levanta en `http://localhost:3000` (o el puerto definido en `PORT`).

### Verificar que la API funciona

```bash
curl http://localhost:3000/api/health
```

---

## 🎨 Levantar el Frontend

```bash
cd Plantilla_Prototipos_UI_UX
```

### Modo desarrollo

```bash
npm run dev
```

Vite levanta el servidor de desarrollo en `http://localhost:5173` con HMR (Hot Module Replacement).

### Crear build de producción

```bash
npm run build
```

Los archivos estáticos se generan en `dist/`.

### Previsualizar el build

```bash
npm run preview
```

---

## ⚙ Workers en Background

La API utiliza **BullMQ** para procesar tareas en segundo plano. Los workers se ejecutan en procesos separados:

### Worker de Email

Envía correos transaccionales (confirmación de pedido, reset de contraseña, OTP):

```bash
npm run worker:email
```

### Worker de Reconciliación de Pagos

Verifica y reconcilia estados de pagos con Stripe:

```bash
npm run worker:reconciliation
```

### Worker de Reportes

Genera reportes CSV asíncronos para el CMS:

```bash
npm run worker:reports
```

> **Importante:** Para un entorno funcional completo, debes tener corriendo al menos la API + el worker de email. Los demás workers son opcionales según tus necesidades.

---

## 🗄 Base de Datos y Migraciones

### Configurar PostgreSQL

1. Crea una base de datos llamada `animayuks`:

```sql
CREATE DATABASE animayuks;
```

2. Actualiza la variable `DATABASE_URL` en tu `.env` con la cadena de conexión correcta.

### Ejecutar migraciones

```bash
cd API_Backend
npm run migrate
```

Esto crea todas las tablas necesarias: usuarios, productos, órdenes, cupones, wallets, rewards, notificaciones, banners, documentos legales, audit logs, etc.

---

## 📁 Estructura del Proyecto

### Backend — `API_Backend/src/`

```
src/
├── main.ts                          ← Composition Root (arranca todo)
├── domain/
│   ├── entities/                    ← Entidades de dominio
│   ├── errors/                      ← Errores de dominio tipados
│   ├── services/                    ← Contratos de servicios (Ports)
│   └── types/                       ← Tipos compartidos
├── application/
│   ├── usecases/                    ← Casos de uso (auth, catálogo)
│   └── use_cases/                   ← Casos de uso (auth avanzada, CRM)
└── infrastructure/
    ├── cache/                       ← Redis client, locks, idempotencia
    ├── database/
    │   ├── client.ts                ← Conexión Kysely a PostgreSQL
    │   ├── migrate.ts               ← Script de migraciones
    │   ├── migrations/              ← Archivos de migración SQL
    │   ├── repositories/            ← Implementación de repositorios
    │   └── schema/                  ← Definiciones de esquema tipadas
    ├── http/
    │   ├── controllers/             ← Controladores HTTP (31 archivos)
    │   ├── middlewares/             ← Auth, admin guard, rate-limit
    │   ├── routes/                  ← Definición de rutas (34 archivos)
    │   └── schemas/                 ← Validación de request/response
    ├── queues/
    │   └── workers/                 ← Workers BullMQ (email, pagos, reportes)
    ├── realtime/                    ← WebSocket (notificaciones en tiempo real)
    └── services/
        ├── auth/                    ← TOTP, Google OAuth
        ├── email/                   ← Adaptador Nodemailer/Resend
        ├── game_api/                ← Cliente M2M para API de juegos
        └── payment/                 ← Stripe + Simulado adapters
```

### Frontend — `Plantilla_Prototipos_UI_UX/src/`

```
src/
├── App.jsx                          ← Router principal
├── api/                             ← Clientes HTTP (Axios)
├── components/
│   ├── home/                        ← Landing page components
│   ├── store/                       ← Tienda (catálogo, producto, pago)
│   ├── cart/                        ← Carrito de compras (drawer)
│   ├── admin/                       ← Componentes del panel CMS
│   ├── layout/                      ← Navbar, Footer, Layout
│   └── ui/                          ← Componentes base reutilizables
├── hooks/                           ← Custom hooks
├── lib/                             ← Utilidades, API client, WebSocket
├── pages/
│   ├── store/                       ← Páginas públicas de la tienda
│   │   ├── LandingPage.jsx
│   │   ├── StorePage.jsx
│   │   ├── ProductPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── LegalPage.jsx
│   └── admin/                       ← Páginas del CMS
│       ├── DashboardPage.jsx
│       ├── CatalogPage.jsx
│       ├── InventoryPage.jsx
│       ├── KanbanPage.jsx (Órdenes)
│       ├── CouponsPage.jsx
│       ├── CrmPage.jsx
│       ├── DonationsPage.jsx
│       ├── MediaPage.jsx
│       ├── LegalAdminPage.jsx
│       ├── SettingsPage.jsx
│       └── AuditPage.jsx
├── store/                           ← Estado global (Zustand)
└── styles/                          ← Estilos CSS
```

---

## 🌐 Endpoints Principales de la API

Todos los endpoints están prefijados con `/api`.

### 🔓 Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Login (devuelve JWT) |
| `POST` | `/api/auth/refresh` | Renovar access token |
| `POST` | `/api/auth/forgot-password` | Solicitar reset de contraseña |
| `POST` | `/api/auth/reset-password` | Restablecer contraseña |
| `GET`  | `/api/auth/oauth/google` | Iniciar login con Google |
| `GET`  | `/api/products` | Listar productos (con filtros y paginación) |
| `GET`  | `/api/products/:slug` | Detalle de producto |
| `GET`  | `/api/content/banners` | Banners activos |
| `GET`  | `/api/content/legal/:type` | Documentos legales |
| `POST` | `/api/coupons/validate` | Validar cupón |
| `POST` | `/api/donations` | Crear donación |
| `POST` | `/api/webhooks/stripe` | Webhook de Stripe |

### 🔒 Autenticados (requieren JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/api/profile` | Perfil del usuario |
| `PUT`  | `/api/profile` | Actualizar perfil |
| `GET`  | `/api/addresses` | Direcciones del usuario |
| `POST` | `/api/checkout` | Crear sesión de checkout |
| `GET`  | `/api/orders` | Historial de órdenes |
| `GET`  | `/api/wallet` | Balance del wallet |
| `GET`  | `/api/rewards` | Recompensas acumuladas |
| `GET`  | `/api/wishlist` | Lista de deseos |
| `GET`  | `/api/notifications` | Notificaciones del usuario |

### 🛡 Admin CMS (requieren JWT admin + IP allowlist)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/admin/auth/login` | Login de administrador |
| `GET`  | `/api/admin/analytics` | Dashboard de métricas |
| `CRUD` | `/api/admin/products` | Gestión de productos |
| `CRUD` | `/api/admin/categories` | Gestión de categorías |
| `CRUD` | `/api/admin/coupons` | Gestión de cupones |
| `CRUD` | `/api/admin/banners` | Gestión de banners |
| `CRUD` | `/api/admin/legal` | Documentos legales |
| `GET`  | `/api/admin/orders` | Gestión de órdenes |
| `POST` | `/api/admin/refunds` | Procesar reembolsos |
| `GET`  | `/api/admin/users` | CRM de usuarios |
| `GET`  | `/api/admin/inventory` | Gestión de inventario |
| `POST` | `/api/admin/media/upload` | Subir imágenes a S3 |
| `GET`  | `/api/admin/reports` | Generar reportes CSV |
| `GET`  | `/api/admin/audit-logs` | Logs de auditoría |

---

## 📄 Páginas del Frontend

### Tienda Pública (`/`)

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Landing Page | Hero, productos destacados, sobre nosotros |
| `/tienda` | Tienda | Catálogo con filtros, búsqueda y paginación |
| `/producto/:slug` | Producto | Detalle, galería, variantes, agregar al carrito |
| `/perfil` | Perfil | Datos del usuario, órdenes, wallet, wishlist |
| `/legal/:type` | Legal | Términos, privacidad, cookies |

### Panel Admin (`/admin`)

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/admin` | Dashboard | KPIs, gráficas, ingresos, órdenes recientes |
| `/admin/catalogo` | Catálogo | CRUD de productos y categorías |
| `/admin/inventario` | Inventario | Stock, alertas de bajo inventario |
| `/admin/ordenes` | Kanban | Tablero Kanban de órdenes |
| `/admin/cupones` | Cupones | Crear y gestionar cupones de descuento |
| `/admin/crm` | CRM | Base de datos de clientes |
| `/admin/donaciones` | Donaciones | Historial de donaciones |
| `/admin/media` | Media | Gestor de archivos S3 |
| `/admin/legal` | Legal | Editor de documentos legales |
| `/admin/configuracion` | Settings | Configuración del sistema |
| `/admin/auditoria` | Auditoría | Logs de actividad admin |

---

## 🔗 Servicios Externos

| Servicio | Propósito | Requerido |
|----------|----------|----------|
| **PostgreSQL** | Base de datos principal | ✅ Sí |
| **Redis** | Caché, colas BullMQ, locks, idempotencia | ✅ Sí |
| **Stripe** | Procesamiento de pagos | ⚠️ Opcional (`PAYMENTS_SIMULATED=true` para simular) |
| **AWS S3** | Almacenamiento de imágenes | ⚠️ Opcional (uploads retornan 503 sin configurar) |
| **Resend** | Emails transaccionales | ⚠️ Opcional (emails fallan silenciosamente) |
| **Google OAuth** | Login social | ⚠️ Opcional (login social retorna 502) |
| **Sentry** | Monitoreo de errores | ⚠️ Opcional |

---

## 📜 Scripts Útiles

### Backend (`API_Backend/`)

| Script | Comando | Descripción |
|--------|---------|-------------|
| Dev server | `npm run dev` | Levanta la API con hot-reload |
| Start | `npm start` | Levanta la API sin hot-reload |
| Migraciones | `npm run migrate` | Ejecuta las migraciones de BD |
| Type check | `npm run typecheck` | Verifica tipos TypeScript |
| Redis up | `npm run redis:up` | Levanta Redis con Docker Compose |
| Redis down | `npm run redis:down` | Detiene el contenedor Redis |
| Redis logs | `npm run redis:logs` | Muestra logs de Redis en tiempo real |
| Worker Email | `npm run worker:email` | Inicia el worker de email |
| Worker Pagos | `npm run worker:reconciliation` | Inicia el worker de reconciliación |
| Worker Reportes | `npm run worker:reports` | Inicia el worker de reportes |

### Frontend (`Plantilla_Prototipos_UI_UX/`)

| Script | Comando | Descripción |
|--------|---------|-------------|
| Dev server | `npm run dev` | Levanta Vite con HMR |
| Build | `npm run build` | Genera build de producción |
| Preview | `npm run preview` | Previsualiza el build |

---

## 🚢 Despliegue a Producción

### Checklist de producción

- [ ] Cambiar `NODE_ENV` a `production`
- [ ] Generar secretos JWT robustos (`JWT_SECRET`, `REFRESH_TOKEN_SECRET`)
- [ ] Configurar `FRONTEND_URL` con el dominio real
- [ ] Configurar `ADMIN_ALLOWED_IPS` con IPs de la VPN o servidor CMS
- [ ] Cambiar claves de Stripe a modo live (`sk_live_...`)
- [ ] Configurar bucket S3 real y credenciales AWS
- [ ] Configurar Resend con dominio verificado
- [ ] Configurar Google OAuth con URI de callback de producción
- [ ] Construir el frontend (`npm run build`) y servir los estáticos
- [ ] Ejecutar los workers como procesos separados (PM2, systemd, etc.)
- [ ] Configurar HTTPS (Nginx/Caddy como reverse proxy)
- [ ] Configurar Sentry DSN para monitoreo

### Arquitectura recomendada en producción

```
                        ┌────────────────┐
                        │   Nginx/Caddy  │
                        │  (HTTPS + SSL) │
                        └───────┬────────┘
                       ┌────────┴────────┐
                       │                 │
              ┌────────▼──────┐  ┌───────▼───────┐
              │  Frontend     │  │   API Backend  │
              │  (estáticos)  │  │  (Fastify)     │
              │  :443/        │  │  :3000         │
              └───────────────┘  └───────┬────────┘
                                ┌────────┴────────┐
                         ┌──────▼─────┐  ┌────────▼──────┐
                         │ PostgreSQL │  │    Redis      │
                         │  :5432     │  │   :6379       │
                         └────────────┘  └───────┬───────┘
                                          ┌──────┴──────┐
                                   ┌──────▼──┐ ┌───────▼──┐
                                   │ Worker  │ │ Worker   │
                                   │ Email   │ │ Reports  │
                                   └─────────┘ └──────────┘
```

---

## 📝 Licencia

ISC

---

<p align="center">
  Desarrollado con ❤️ por <strong>Braulio Isaias Bernal Padron</strong>
</p>