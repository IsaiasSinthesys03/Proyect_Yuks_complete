import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';

/**
 * useProfile — Perfil completo del usuario autenticado (Fase 43, REQ-FE-14).
 * GET /api/profile → { user, profile:{tierLevel, experiencePoints,...},
 * wallet:{balance, expiresAt}, gamification:{silver/gold/platinumThreshold} }.
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => unwrap(await api.get('/api/profile')),
    enabled,
  });
}

/**
 * useOrders — Historial de pedidos (Fase 43, REQ-FE-23).
 * GET /api/profile/orders → OrderSummaryDTO[]:
 * { id, status, totalPaid, itemCount, createdAt, productThumbnail }.
 */
export function useOrders(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'orders'],
    queryFn: async () => {
      // Respuesta PAGINADA: { data: OrderSummaryDTO[], total, page, limit, totalPages }.
      // Se normaliza al array (el perfil muestra la primera página; limit backend = 10).
      const page = unwrap(await api.get('/api/profile/orders'));
      return Array.isArray(page) ? page : (page?.data ?? []);
    },
    enabled,
  });
}

/**
 * useOrderDetail — Detalle con timeline (Fase 43, REQ-FE-23).
 * GET /api/profile/orders/:id → { order, items, rewardCodes }.
 */
export function useOrderDetail(orderId) {
  return useQuery({
    queryKey: ['profile', 'orders', orderId],
    queryFn: async () => unwrap(await api.get(`/api/profile/orders/${orderId}`)),
    enabled: !!orderId,
  });
}

/**
 * cancelOrder — Cancelación autónoma (Fase 43, REQ-FE-23).
 * POST /api/profile/orders/:id/cancel. REGLA DE NEGOCIO DEL BACKEND: solo se
 * permite en estado `PAID` ("Pago Confirmado"); devuelve el saldo al monedero
 * (heredando la caducidad original) y reembolsa la pasarela.
 */
export async function cancelOrder(orderId) {
  return unwrap(await api.post(`/api/profile/orders/${orderId}/cancel`));
}

/**
 * useRewards — Códigos UUID de recompensas del juego (Fase 43, REQ-FE-22).
 * GET /api/profile/rewards → [{ code, status ('🟢 Listo para usar' | '⚪ Canjeado'
 * | 'Revocado'), productName, claimedAt }].
 */
export function useRewards(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'rewards'],
    queryFn: async () => unwrap(await api.get('/api/profile/rewards')),
    enabled,
  });
}

/**
 * useWalletLedger — Movimientos del monedero (Fase 44, REQ-FE-20).
 * GET /api/profile/wallet/transactions → paginado de WalletTransaction:
 * { id, orderId, amount, type: 'DEPOSIT'|'WITHDRAWAL',
 *   source: 'REFUND'|'PURCHASE'|'CANCELLATION', description, createdAt }.
 */
export function useWalletLedger(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'wallet', 'ledger'],
    queryFn: async () => {
      const page = unwrap(await api.get('/api/profile/wallet/transactions'));
      return Array.isArray(page) ? page : (page?.data ?? []);
    },
    enabled,
  });
}

/**
 * useAvailableCoupons — Cupones promocionales VIGENTES (Fase 44, REQ-FE-21).
 * GET /api/profile/coupons → [{ code, discountType, discountValue,
 * minPurchaseAmount, expiresAt }] — `expiresAt` REAL de la BD para la
 * cuenta regresiva FOMO (nada de strings estáticos).
 */
export function useAvailableCoupons(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'coupons', 'available'],
    queryFn: async () => unwrap(await api.get('/api/profile/coupons')),
    enabled,
  });
}

/**
 * redeemCoupon — Valida un código contra el subtotal del carrito (REQ-FE-21).
 * POST /api/profile/coupons/redeem → { couponId, discountType, discountValue,
 * finalDiscount }. Errores: 404 no existe · 410 expirado/agotado/inactivo ·
 * 422 mínimo de compra no alcanzado.
 */
export async function redeemCoupon(code, cartSubtotal) {
  return unwrap(await api.post('/api/profile/coupons/redeem', { code, cartSubtotal }));
}

/**
 * useWishlist — Favoritos con stock agregado (Fase 44, REQ-FE-19).
 * GET /api/profile/wishlist → [{ ...Product, totalStock }] — `totalStock` = 0
 * pinta la tarjeta en escala de grises ("Agotado").
 */
export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'wishlist'],
    queryFn: async () => unwrap(await api.get('/api/profile/wishlist')),
    enabled,
  });
}

/** POST /api/profile/wishlist — agrega un producto a favoritos (idempotente). */
export async function addToWishlist(productId) {
  return unwrap(await api.post('/api/profile/wishlist', { productId }));
}

/** DELETE /api/profile/wishlist/:productId — quita un producto de favoritos. */
export async function removeFromWishlist(productId) {
  return unwrap(await api.delete(`/api/profile/wishlist/${productId}`));
}

/**
 * useNotifications — Bandeja de notificaciones in-app (Fase 45, REQ-FE-24).
 * GET /api/profile/notifications → paginado de { id, type, payload:{title,body},
 * isRead, createdAt }. Se normaliza al array (primera página).
 */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'notifications', 'list'],
    queryFn: async () => {
      const page = unwrap(await api.get('/api/profile/notifications'));
      return Array.isArray(page) ? page : (page?.data ?? []);
    },
    enabled,
  });
}

/** PATCH /api/profile/notifications/:id/read — marca UNA como leída. */
export async function markNotificationRead(id) {
  return unwrap(await api.patch(`/api/profile/notifications/${id}/read`));
}

/** PATCH /api/profile/notifications/read-all — marca TODAS como leídas. */
export async function markAllNotificationsRead() {
  return unwrap(await api.patch('/api/profile/notifications/read-all'));
}

/**
 * updateProfile — PUT /api/profile (Fase 45, REQ-FE-16).
 * SOLO firstName/lastName se aplican directo; email/phone son RECHAZADOS por
 * el backend aquí — esos exigen el flujo OTP (requestOtp + verifyOtp).
 */
export async function updateProfile({ firstName, lastName }) {
  return unwrap(await api.put('/api/profile', { firstName, lastName }));
}

/**
 * requestOtp — POST /api/auth/otp/request (autenticado, rate limit 5/min).
 * Genera un código de 6 dígitos, lo hashea (Argon2id) y lo envía POR EMAIL al
 * correo ACTUAL verificado (anti-secuestro de cuenta).
 * @param purpose 'email_change' | 'phone_change'
 * @param newValue el nuevo email/teléfono pendiente de confirmar
 */
export async function requestOtp(purpose, newValue) {
  return unwrap(await api.post('/api/auth/otp/request', { purpose, newValue }));
}

/**
 * verifyOtp — POST /api/auth/otp/verify (autenticado, rate limit 5/min).
 * Con el código correcto el backend APLICA el cambio (updateEmail/updatePhone)
 * y consume el OTP. 401 código incorrecto · 400 expirado/sin OTP vigente.
 */
export async function verifyOtp(purpose, code) {
  return unwrap(await api.post('/api/auth/otp/verify', { purpose, code }));
}

/**
 * useUnreadCount — Contador de notificaciones no leídas (Fase 43, REQ-FE-14).
 * GET /api/profile/notifications/unread-count. El resultado se SINCRONIZA al
 * `notificationStore` (fuente única del badge; la Fase 54 lo alimentará
 * también por WebSocket vía `pushRealtime`).
 */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'notifications', 'unread-count'],
    queryFn: async () => {
      const data = unwrap(await api.get('/api/profile/notifications/unread-count'));
      const count = typeof data === 'number' ? data : (data?.unread ?? 0); // shape real: { unread: n }
      useNotificationStore.getState().setUnreadCount(count);
      return count;
    },
    enabled,
  });
}
