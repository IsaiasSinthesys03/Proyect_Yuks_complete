import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';

/**
 * useCheckoutConfig — Config dinámica del carrito (Fase 42, REQ-FE-13).
 * GET /api/checkout/config (público) → { freeShippingThreshold, localShippingCost,
 * externalShippingCost, minPurchaseAmount, tierMultipliers: {BRONZE,SILVER,GOLD,PLATINUM} }.
 * El umbral EFECTIVO de envío gratis = freeShippingThreshold * tierMultipliers[tier].
 */
export function useCheckoutConfig() {
  return useQuery({
    queryKey: ['checkout', 'config'],
    queryFn: async () => unwrap(await api.get('/api/checkout/config')),
    staleTime: 60_000, // config editable en caliente desde el CMS (TTL corto)
  });
}

/**
 * useAddresses — Direcciones del usuario autenticado (Fase 42).
 * GET /api/profile/addresses. Solo se activa con sesión iniciada.
 */
export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'addresses'],
    queryFn: async () => unwrap(await api.get('/api/profile/addresses')),
    enabled,
  });
}

/** POST /api/profile/addresses — crea una dirección de entrega (REQ-FE-09). */
export async function createAddress(dto) {
  return unwrap(await api.post('/api/profile/addresses', dto));
}

/**
 * donate — Aportación al proyecto (Fase 46, REQ-FE-26/27).
 * POST /api/donate con `X-Idempotency-Key` propia (el backend también exige
 * `idempotencyKey` en el body). Genera un UUID por intento.
 * Respuesta 201: { donationId, clientSecret, amount, donorEmail, status:'PENDING' }.
 *
 * TODO: STRIPE — igual que el checkout: hoy el backend corre con
 * PAYMENTS_SIMULATED=true y el `clientSecret` es ficticio (pi_sim_...). Con
 * claves reales, ese secret se pasa a `stripe.confirmPayment` (PaymentElement).
 * La donación SÍ se registra REAL en la BD (estado PENDING).
 */
export async function donate(amount, donorEmail) {
  const idempotencyKey = crypto?.randomUUID?.() || `don-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const res = await api.post(
    '/api/donate',
    { amount, donorEmail, idempotencyKey },
    { headers: { 'X-Idempotency-Key': idempotencyKey } },
  );
  return unwrap(res);
}

/** DELETE /api/profile/addresses/:id — elimina una dirección (Fase 45, REQ-FE-17). */
export async function deleteAddress(id) {
  return unwrap(await api.delete(`/api/profile/addresses/${id}`));
}

/** PATCH /api/profile/addresses/:id/default — marca una dirección como principal. */
export async function setDefaultAddress(id) {
  return unwrap(await api.patch(`/api/profile/addresses/${id}/default`));
}

/**
 * processCheckout — Motor de checkout (Fase 42, REQ-BE-01).
 *
 * Genera un UUID como Idempotency-Key (cabecera `X-Idempotency-Key`, obligatoria
 * en el backend): reintentar con la MISMA key jamás duplica la orden.
 *
 * Respuesta 201: { orderId, status, totalPaid, stripeClientSecret }.
 *
 * TODO: STRIPE — con claves reales, el `stripeClientSecret` devuelto aquí se
 * pasa a `stripe.confirmPayment({ elements, clientSecret })` (PaymentElement,
 * con soporte 3DS). Hoy el backend corre con PAYMENTS_SIMULATED=true y el
 * secret es ficticio (pi_sim_...): la confirmación se simula en PaymentModal.
 */
export async function processCheckout({ items, addressId, termsVersion, couponCode, walletAmount }) {
  const idempotencyKey = crypto?.randomUUID?.() || `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const body = {
    items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    addressId,
    termsVersion,
    ...(couponCode ? { couponCode } : {}),
    ...(walletAmount > 0 ? { walletAmount } : {}),
  };
  const res = await api.post('/api/checkout', body, {
    headers: { 'X-Idempotency-Key': idempotencyKey },
  });
  return unwrap(res);
}
