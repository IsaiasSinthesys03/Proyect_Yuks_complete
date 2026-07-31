# Walkthrough — Stripe One-Time Checkout

Fecha de validación: 2026-07-31

## Arquitectura resultante

- El perfil ya no contiene navegación, tarjetas demostrativas ni formularios para guardar métodos de pago.
- `PaymentModal.jsx` solicita la creación de la orden una sola vez y recibe su `stripeClientSecret`.
- `PaymentForm.jsx` monta `PaymentElement` dentro de `Elements` y confirma el `PaymentIntent` con `stripe.confirmPayment`.
- El backend crea el `PaymentIntent` sin `customer`, `SetupIntent` ni `setup_future_usage`.
- PAN, CVC y expiración permanecen dentro de los iframes alojados por Stripe; Animayuks no recibe ni persiste esos valores.

`confirmPayment` se conserva intencionalmente en lugar de `confirmCardPayment`: el checkout usa `PaymentElement` y métodos de pago automáticos. `confirmCardPayment` corresponde al flujo limitado de `CardElement`.

## Archivos modificados

- `Plantilla_Prototipos_UI_UX/src/components/store/PaymentForm.jsx`
- `Plantilla_Prototipos_UI_UX/src/components/store/PaymentModal.jsx`
- `Plantilla_Prototipos_UI_UX/src/components/store/ProfileDrawer.jsx`
- `Plantilla_Prototipos_UI_UX/src/pages/store/ProfilePage.jsx`
- `Plantilla_Prototipos_UI_UX/src/api/checkout.js`
- `Plantilla_Prototipos_UI_UX/.env.example`
- `API_Backend/src/infrastructure/services/payment/StripeAdapter.ts`

## Resultados empíricos

- Stripe Test confirmó el método `pm_card_visa`, equivalente programático de la tarjeta de prueba `4242 4242 4242 4242`.
- PaymentIntent: `pi_3TzCF44CMhQYamfz1pvfcLxj`.
- Orden: `6563187c-16f7-4644-b3ea-d5ce66a13a9a`.
- Total confirmado: `$274.94 MXN`.
- Stripe: `status=succeeded`.
- Persistencia futura: `setup_future_usage=null`.
- Cliente Stripe: `customer=null`.
- Asociación del PaymentMethod: `payment_method.customer=null`.
- Webhook firmado `payment_intent.succeeded`: HTTP `200`, `handled=true`.
- PostgreSQL: orden actualizada de `PAYMENT_PENDING` a `PAID`.
- Esquema PostgreSQL inspeccionado: cero columnas de tarjetas guardadas, `payment_method`, `stripe_customer`, `last4` o equivalentes.
- Backend: `npm run typecheck` con cero errores.
- Frontend: `npm run build` completado sin errores.

## Alcance visual

La automatización del navegador alcanzó la aplicación local, pero la superficie de navegador bloqueó por política la recarga posterior de `127.0.0.1`. Por integridad del registro, no se marca un recorrido visual automatizado completo. La integración API → Stripe → webhook → PostgreSQL sí fue ejecutada de extremo a extremo.
