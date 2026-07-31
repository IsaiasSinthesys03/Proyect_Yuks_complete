import React, { useState } from 'react';
import { X, CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { checkShippingCoverage, processCheckout } from '../../api/checkout';
import { useCartStore } from '../../store/cartStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useCart } from '../../hooks/useCart';
import { PaymentForm } from './PaymentForm';

const TERMS_VERSION = '1.0';
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const stripeAppearance = {
    theme: 'night',
    variables: {
        colorPrimary: '#03bbd3',
        colorBackground: '#0f172a',
        colorText: '#ffffff',
        colorDanger: '#ec1676',
        borderRadius: '12px',
        fontFamily: 'Quicksand, system-ui, sans-serif',
    },
};

export const PaymentModal = ({ isOpen, close, showToast }) => {
    const items = useCartStore((s) => s.items);
    const clearCart = useCartStore((s) => s.clear);
    const addressId = useCheckoutStore((s) => s.addressId);
    const { finalTotal, hasFreeShipping } = useCart();
    const [pendingOrder, setPendingOrder] = useState(null);
    const [successOrder, setSuccessOrder] = useState(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const beginPayment = async () => {
        if (!addressId) {
            showToast('Falta la dirección de entrega.', 'error');
            return;
        }
        if (!stripePromise) {
            showToast('Stripe no está configurado en el frontend.', 'error');
            return;
        }

        if (isCreatingOrder) return;
        setIsCreatingOrder(true);
        try {
            await checkShippingCoverage(addressId);
            const order = await processCheckout({ items, addressId, termsVersion: TERMS_VERSION });

            if (!order.stripeClientSecret) {
                clearCart();
                setSuccessOrder(order);
                showToast('¡Orden confirmada sin saldo pendiente!', 'success');
                return;
            }
            setPendingOrder(order);
        } catch (error) {
            const msg = error?.response?.data?.message || error?.response?.data?.error || 'No pudimos iniciar el pago.';
            showToast(msg, 'error');
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleConfirmed = (order, stripeStatus) => {
        clearCart();
        setPendingOrder(null);
        setSuccessOrder({ ...order, stripeStatus });
        showToast(stripeStatus === 'succeeded' ? '¡Pago confirmado por Stripe!' : 'Stripe está procesando tu pago.', 'success');
    };

    const handleClose = () => {
        setPendingOrder(null);
        setSuccessOrder(null);
        setIsCreatingOrder(false);
        close();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-8 shadow-2xl relative animate-in zoom-in-95 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto">
                <button type="button" onClick={handleClose} disabled={pendingOrder && !successOrder} className="absolute top-6 right-6 text-slate-500 hover:text-white disabled:opacity-30"><X className="w-6 h-6" /></button>

                {successOrder ? (
                    <div className="text-center py-6">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="font-bungee text-xl sm:text-2xl text-white leading-tight mb-3">¡Pago Recibido!</h2>
                        <p className="text-xs text-slate-400 mb-4">Stripe aceptó el pago. El webhook actualizará el estado definitivo de tu orden.</p>
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6 text-left space-y-2">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Número de Orden</p>
                            <p className="text-xs font-mono text-[#03bbd3] break-all">{successOrder.orderId}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold pt-2">Total</p>
                            <p className="text-lg font-black text-white">${Number(successOrder.totalPaid).toFixed(2)} <span className="text-[10px] text-slate-500 font-bold uppercase">{successOrder.stripeStatus || successOrder.status}</span></p>
                        </div>
                        <button onClick={handleClose} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-transform hover:scale-[1.02]">Seguir Comprando</button>
                    </div>
                ) : pendingOrder ? (
                    <div>
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-[#03bbd3]/20 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-[#03bbd3]/30"><CreditCard className="text-[#03bbd3] w-6 h-6" /></div>
                            <h2 className="font-bungee text-xl sm:text-2xl text-white uppercase leading-tight">Pago Seguro</h2>
                            <p className="text-[10px] text-[#96c93e] font-bold mt-2 uppercase tracking-wider">Procesado por Stripe</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center mb-5">
                            <span className="text-xs font-bold text-slate-400 uppercase">Total a Pagar</span>
                            <span className="text-xl font-black text-[#03bbd3]">${Number(pendingOrder.totalPaid).toFixed(2)}</span>
                        </div>
                        <Elements stripe={stripePromise} options={{ clientSecret: pendingOrder.stripeClientSecret, appearance: stripeAppearance, locale: 'es', loader: 'auto' }}>
                            <PaymentForm order={pendingOrder} onConfirmed={handleConfirmed} showToast={showToast} />
                        </Elements>
                    </div>
                ) : (
                    <div>
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-[#03bbd3]/20 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-[#03bbd3]/30"><CreditCard className="text-[#03bbd3] w-6 h-6" /></div>
                            <h2 className="font-bungee text-xl sm:text-2xl text-white uppercase leading-tight">Confirmar Compra</h2>
                            <p className="text-[10px] text-[#96c93e] font-bold mt-2 uppercase tracking-wider">Pago real en entorno de prueba Stripe</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">Total a Pagar</span>
                            <span className="text-xl font-black text-[#03bbd3]">${finalTotal.toFixed(2)}</span>
                        </div>
                        {hasFreeShipping && (
                            <p className="text-[10px] text-[#96c93e] font-bold flex items-center gap-1 mt-3"><CheckCircle2 className="w-3 h-3" /> Envío gratis aplicado — el total final lo confirma el backend</p>
                        )}
                        <button type="button" onClick={beginPayment} disabled={!addressId || items.length === 0 || isCreatingOrder} className="w-full bg-gradient-to-r from-[#03bbd3] to-[#02a8be] hover:from-[#02a8be] hover:to-[#0295a8] text-white font-bold py-4 rounded-xl mt-6 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                            {isCreatingOrder ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparando Stripe...</> : <><Lock className="w-4 h-4" /> Continuar al pago seguro</>}
                        </button>
                        <p className="text-center text-[10px] text-slate-500 mt-4 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> La orden se crea una sola vez antes de abrir Stripe
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
