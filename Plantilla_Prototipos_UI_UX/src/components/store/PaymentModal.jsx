import React, { useState } from 'react';
import { X, CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { processCheckout } from '../../api/checkout';
import { useCartStore } from '../../store/cartStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useCart } from '../../hooks/useCart';

/**
 * Versión de términos aceptada en el checkout (REQ-BE-01, compliance).
 * TODO: leerla del documento legal versionado del CMS cuando el módulo Legal
 * del storefront (Fase 46) exponga la versión vigente.
 */
const TERMS_VERSION = '1.0';

/**
 * PaymentModal (Fase 42) — Paso de pago del checkout.
 *
 * ▓▓▓ TODO: STRIPE — MODO SIMULADO ▓▓▓
 * No hay claves de Stripe todavía (backend con PAYMENTS_SIMULATED=true), así que
 * este modal muestra un formulario de tarjeta FICTICIO y un botón "Pagar
 * (Simulado)". Cuando existan las claves reales:
 *   1. `npm i @stripe/stripe-js @stripe/react-stripe-js` y poner
 *      VITE_STRIPE_PUBLISHABLE_KEY (pk_test_...) en el .env del frontend.
 *   2. Envolver el formulario con `<Elements stripe={stripePromise} options={{ clientSecret }}>`
 *      usando el `stripeClientSecret` que YA devuelve `processCheckout()`.
 *   3. Reemplazar los inputs ficticios por `<PaymentElement />`.
 *   4. En `handlePay`, tras obtener el clientSecret, llamar
 *      `stripe.confirmPayment({ elements, redirect: 'if_required' })` (soporta 3DS).
 *   5. Vaciar el carrito SOLO si `confirmPayment` resuelve sin error
 *      (hoy se vacía con el 201 del backend porque no hay confirmación real).
 *
 * Lo que SÍ es real hoy: POST /api/checkout con cabecera X-Idempotency-Key
 * (UUID) → crea la ORDEN REAL en la BD (estado PAYMENT_PENDING) con dirección,
 * envío por tier y snapshot de items.
 */
export const PaymentModal = ({ isOpen, close, showToast }) => {
    const items = useCartStore((s) => s.items);
    const clearCart = useCartStore((s) => s.clear);
    const addressId = useCheckoutStore((s) => s.addressId);
    const { finalTotal, shippingCost } = useCart();

    // Campos FICTICIOS de tarjeta (solo visuales). TODO: STRIPE → <PaymentElement />
    const [cardNumber, setCardNumber] = useState('');
    const [cardExp, setCardExp] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [successOrder, setSuccessOrder] = useState(null);

    const payMutation = useMutation({
        mutationFn: () => processCheckout({ items, addressId, termsVersion: TERMS_VERSION }),
        onSuccess: (order) => {
            // TODO: STRIPE — aquí irá stripe.confirmPayment(order.stripeClientSecret).
            // El carrito se vacía SOLO ante éxito INCONDICIONAL de la confirmación;
            // en modo simulado, el 201 del backend (orden creada) es el éxito.
            clearCart();
            setSuccessOrder(order);
            showToast('¡Pago simulado exitoso! Orden creada.', 'success');
        },
        onError: (error) => {
            // 409 stock/idempotencia · 422 mínimo de compra · 404 dirección · 402 pago
            const msg = error?.response?.data?.message || 'No pudimos procesar el pago.';
            showToast(msg, 'error');
        },
    });

    const handlePay = (e) => {
        e.preventDefault();
        if (!addressId) {
            showToast('Falta la dirección de entrega.', 'error');
            return;
        }
        payMutation.mutate();
    };

    const handleClose = () => {
        setSuccessOrder(null);
        close();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95">
                <button type="button" onClick={handleClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>

                {successOrder ? (
                    /* ── Estado de éxito: orden creada en la BD ── */
                    <div className="text-center py-6">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-white mb-2">¡Orden Confirmada!</h2>
                        <p className="text-xs text-slate-400 mb-4">Tu orden fue registrada exitosamente.</p>
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6 text-left space-y-2">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Número de Orden</p>
                            <p className="text-xs font-mono text-[#03bbd3] break-all">{successOrder.orderId}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold pt-2">Total</p>
                            <p className="text-lg font-black text-white">${Number(successOrder.totalPaid).toFixed(2)} <span className="text-[10px] text-slate-500 font-bold uppercase">({successOrder.status})</span></p>
                        </div>
                        <button onClick={handleClose} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-transform hover:scale-[1.02]">Seguir Comprando</button>
                    </div>
                ) : (
                    /* ── Formulario de pago (SIMULADO — TODO: STRIPE <PaymentElement />) ── */
                    <form onSubmit={handlePay}>
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-[#03bbd3]/20 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-[#03bbd3]/30"><CreditCard className="text-[#03bbd3] w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Pago Seguro</h2>
                            <p className="text-[10px] text-amber-400 font-bold mt-2 uppercase tracking-wider">⚠ Modo simulado — sin cargo real (TODO: STRIPE)</p>
                        </div>

                        <div className="space-y-4">
                            {/* TODO: STRIPE — reemplazar estos 3 inputs por <PaymentElement /> */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Número de Tarjeta</label>
                                <input required value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/[^\d ]/g, '').slice(0, 19))} type="text" placeholder="4242 4242 4242 4242" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#03bbd3] transition-colors font-mono" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiración</label>
                                    <input required value={cardExp} onChange={e => setCardExp(e.target.value.slice(0, 5))} type="text" placeholder="MM/AA" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#03bbd3] transition-colors font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CVC</label>
                                    <input required value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} type="text" placeholder="123" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#03bbd3] transition-colors font-mono" />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Total a Pagar</span>
                                <span className="text-xl font-black text-[#03bbd3]">${finalTotal.toFixed(2)}</span>
                            </div>
                            {shippingCost === 0 && (
                                <p className="text-[10px] text-[#96c93e] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Envío gratis aplicado — el total final lo confirma el backend</p>
                            )}
                        </div>

                        <button type="submit" disabled={payMutation.isPending} className="w-full bg-gradient-to-r from-[#03bbd3] to-[#02a8be] hover:from-[#02a8be] hover:to-[#0295a8] text-white font-bold py-4 rounded-xl mt-6 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                            {payMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><Lock className="w-4 h-4" /> Pagar (Simulado)</>}
                        </button>

                        <p className="text-center text-[10px] text-slate-500 mt-4 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Idempotency-Key UUID · la orden jamás se duplica
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};
