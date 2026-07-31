import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../lib/adminApi';

/**
 * Pedidos del CMS — Kanban logístico (Fase 49, CMS-FE-04).
 *
 * `GET /api/admin/orders` (paginado) → AdminOrderSummaryDTO[]:
 * { id, status, totalPaid, itemCount, createdAt, deliveryType,
 *   shippingAddress, postalCode, municipality, state, clientName, clientPhone }.
 *
 * Máquina de estados del backend (PATCH /:id/status):
 *   PAID → PREPARING | CANCELLED
 *   PREPARING → SHIPPED | CANCELLED   (SHIPPED exige chofer o guía)
 *   SHIPPED → DELIVERING
 *   DELIVERING → DELIVERED
 * Cualquier otra transición → 422 (la UI muestra el error y NO mueve la tarjeta).
 */
export function useAdminOrders(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const page = unwrapAdmin(await adminApi.get('/api/admin/orders', { params: { limit: 100 } }));
      return Array.isArray(page) ? page : (page?.data ?? []);
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * PATCH /api/admin/orders/:id/status — mueve el pedido en la máquina de estados.
 * Para SHIPPED: incluir driverName/Vehicle/Phone (LOCAL) o
 * trackingCompany/Number (EXTERNAL_COURIER). El backend notifica al cliente
 * (email + WS + bandeja) y transmite `admin:order_updated` al canal admin.
 */
export async function updateOrderStatus(orderId, body) {
  return unwrapAdmin(await adminApi.patch(`/api/admin/orders/${orderId}/status`, body));
}

/**
 * POST /api/admin/orders/:id/refund — Bóveda de Reembolsos (seguridad crítica).
 * RE-AUTENTICACIÓN server-side: `currentPassword` se verifica contra el hash
 * Argon2id del ADMIN ACTUAL antes de tocar la pasarela (401 si falla — Stripe
 * jamás se invoca con una contraseña incorrecta).
 */
export async function refundOrder(orderId, { amount, reason, currentPassword }) {
  return unwrapAdmin(await adminApi.post(`/api/admin/orders/${orderId}/refund`, { amount, reason, currentPassword }));
}
