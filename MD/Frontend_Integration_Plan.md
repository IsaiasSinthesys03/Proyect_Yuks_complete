# Plan de Integración Frontend — Animayuks

**Fecha:** 2026-07-05
**Alcance:** Conectar la UI **ya existente** (`Plantilla_Prototipos_UI_UX/`, Vite + React 18 + Tailwind CDN + lucide-react) con el backend Fastify. **NO se rediseña ni se reescribe la UI.** No hay monorepo ni Next.js.

---

## Punto de partida (lo que ya hay)

- Proyecto **Vite funcional**: `landing_page.jsx` (E-commerce, 1640 líneas) y `prototipe_CMS.jsx` (panel admin, 1298 líneas).
- `main.jsx` monta hoy solo `landing_page.jsx`. `prototipe_CMS.jsx` existe pero **no está enganchado** al arranque.
- Ya hay un desacople PARCIAL del landing en `src/components/` (Hero, Trending, CharacterGrid, Header, CartDrawer + hooks `useCart`, `useHeaderNav`).
- Tailwind por **CDN** (en `index.html`) y `lucide-react`. **Se mantienen tal cual.**

---

## 1. Manejo del Código Existente (subdivisión dentro del MISMO proyecto Vite)

**Objetivo:** trocear los dos monolitos en `src/pages` (una página por vista) y `src/components` (lo reutilizable), sin cambiar ni un pixel del diseño.

### 1.1 Estructura destino
```
src/
├── main.jsx                 # monta <App/> con el router
├── App.jsx                  # Router: "/*" → Store, "/admin/*" → CMS
├── pages/
│   ├── store/               # de landing_page.jsx (una por vista)
│   │   ├── LandingPage.jsx  · StorePage.jsx · ProductPage.jsx · ProfilePage.jsx · LegalPage.jsx
│   └── admin/               # de prototipe_CMS.jsx (una por vista)
│       ├── LoginPage.jsx · DashboardPage.jsx · KanbanPage.jsx · CatalogPage.jsx · InventoryPage.jsx
│       ├── CrmPage.jsx · CouponsPage.jsx · MediaPage.jsx · SettingsPage.jsx · AuditPage.jsx · DonationsPage.jsx · LegalAdminPage.jsx
├── components/
│   ├── common/              # Modal, Toast, Button, Card, Badge, DataGrid, Tabs, Drawer, Sidebar…
│   ├── store/               # modales del landing: AuthModal, CheckoutAddressModal, OtpModal, DonationModal, ProfileDrawer, Footer, MobileMenu
│   │   └── (+ los ya extraídos: home/*, cart/*, layout/*, ui/FlipCard)
│   └── admin/               # AdminLayout (sidebar+breadcrumbs), GlobalStyles, sub-piezas del CMS
├── store/                   # estado global Zustand (§2)
├── lib/                     # api.js (Axios), queryClient.js, ws.js
├── api/                     # hooks TanStack Query por dominio
└── hooks/                   # useCart, useHeaderNav (ya existen) + nuevos
```

### 1.2 Método (incremental, sin romper lo que funciona)
1. **Enrutado top-level:** añadir `react-router-dom`. `App.jsx` monta el Store en `/` y el CMS en `/admin`. Con esto `prototipe_CMS.jsx` queda enganchado por primera vez.
2. **Mover, no reescribir:** cada `View`/`Modal` de los monolitos se copia tal cual a su archivo en `src/pages` o `src/components`, ajustando solo los `import`. El JSX + clases Tailwind + iconos Lucide quedan **idénticos**.
3. **Reutilizables a `components/common`:** los patrones repetidos (Modal, Toast, Card, Badge, DataGrid, Sidebar, Tabs) se extraen una vez y se importan desde ambas apps.
4. La navegación interna basada en estado (`navigate`, `currentView`) se conserva al inicio; se migra a rutas de `react-router` de forma progresiva solo donde aporte (deep-linking, botón atrás real REQ-FE-34).
5. Los prototipos originales quedan como **referencia congelada** hasta que su vista esté migrada y conectada; después se archivan.

> **Regla:** Tailwind sigue por CDN y Lucide sin cambios. Esta fase es puramente estructural — cero rediseño.

---

## 2. Integración con la API (Zustand + Axios/TanStack Query + cookies HttpOnly)

### 2.1 Estado global — **Zustand** (`src/store/`)
- `authStore`: **access token en MEMORIA** (nunca localStorage), datos del usuario, `isAuthenticated`, `login/logout/setToken`.
- `cartStore`: ítems, cantidades, totales (sustituye el `useCart` local del prototipo).
- `uiStore`: apertura de drawers/modales, toasts, sidebar del CMS.

### 2.2 Cliente HTTP — **Axios** (`src/lib/api.js`)
- Instancia con `baseURL = import.meta.env.VITE_API_URL`.
- **Request interceptor:** añade `Authorization: Bearer <accessToken del authStore>`.
- **Response interceptor (silent refresh):** ante `401`, llama `POST /api/auth/refresh` **con `withCredentials: true`** → obtiene nuevo access token → reintenta la petición original (encolando concurrentes). Si el refresh falla → `logout()` → redirige a login.
- **Bootstrap:** al cargar la app, un intento de `/api/auth/refresh` restaura la sesión desde la cookie (el access vive en memoria y se pierde al recargar).

### 2.3 Autenticación por cookies HttpOnly (cómo es REALMENTE)
| Credencial | Dónde vive | Cómo se envía |
|---|---|---|
| **Access token** (JWT, 15 min) | Memoria (Zustand) | Header `Authorization: Bearer` en TODAS las peticiones a la API |
| **Refresh token** (opaco, 7 días) | **Cookie HttpOnly, `SameSite=strict`, path `/api/auth/refresh`** | El navegador la manda solo con `withCredentials: true` en `/api/auth/refresh` y `/api/auth/logout` |

> **Nota:** el backend **no usa CSRF token**; la cookie `SameSite=strict` + path restringido ya es la defensa CSRF. Solo hay que usar `withCredentials` en las dos rutas de cookie. El origen del front (`http://localhost:5173` en dev) debe estar en `FRONTEND_URL` del backend (allowlist CORS ya configurada).

### 2.4 Estado de servidor — **TanStack Query** (`src/api/`)
- `QueryClientProvider` en `main.jsx`.
- Hooks por dominio que envuelven Axios y reemplazan los `useState`/mocks del prototipo:
  `useProducts`, `useProductDetail`, `useProfile`, `useWishlist`, `useOrders`, `useCheckout`, `useDonate` (store);
  `useKanbanOrders`, `useUpdateOrderStatus`, `useInventory`, `useCrmUsers`, `useCoupons`, `useAnalytics`, `useReports` (CMS).
- Caché + invalidación tras mutaciones (ej. cambiar estatus → invalida `useKanbanOrders`).

### 2.5 Pagos y Realtime (cuando toque la vista)
- **Stripe:** `@stripe/react-stripe-js` con el `clientSecret` que devuelven `/checkout` y `/donate` (maneja 3DS). Enviar `X-Idempotency-Key` en checkout.
- **WebSocket** (`src/lib/ws.js`): conecta a `VITE_WS_URL/api/realtime/ws?token=<accessToken>`; enruta `social_proof:purchase` (toast FOMO), `order:status_changed` / `admin:order_updated` (invalida queries), `report:ready` (campana CMS), `gamification:xp_awarded` (barra XP).

### 2.6 Dependencias a añadir
`react-router-dom`, `axios`, `@tanstack/react-query`, `zustand` (y `@stripe/stripe-js` + `@stripe/react-stripe-js` al llegar al checkout). **Nada más** — se conserva React 18 + Vite + Tailwind CDN + lucide-react.

---

## Fases (detalle en `MD/task.md`)

| Fase | Enfoque |
|---|---|
| **37** | Reestructurar el proyecto Vite: router + `src/pages` + extraer comunes a `src/components` (sin rediseño). Enganchar el CMS. |
| **38** | Capa de datos y sesión: instalar deps, `api.js` + interceptores + silent refresh, stores Zustand, QueryClient, `.env`. |
| **39** | Conectar el **Storefront** al backend (auth, catálogo/búsqueda, carrito/checkout+Stripe, perfil/wishlist/monedero/pedidos, donaciones). |
| **40** | Conectar el **CMS** al backend (login+2FA+easter egg, dashboard/analytics, kanban, catálogo/inventario, CRM, cupones/donaciones/legales/settings, reportes). |
| **41** | Realtime (WebSocket) + verificación E2E de los flujos críticos contra el backend real. |

**Regla heredada:** nada se marca `[x]` sin estar conectado a un endpoint real y verificado (la vista renderiza con datos del backend, la mutación responde).
