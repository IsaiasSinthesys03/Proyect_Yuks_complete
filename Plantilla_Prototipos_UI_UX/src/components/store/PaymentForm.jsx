import React, { useState } from 'react';
import { AlertTriangle, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const stripeErrorMessage = (error) => {
    const code = error?.decline_code || error?.code;
    const messages = {
        insufficient_funds: 'La tarjeta no tiene fondos suficientes. Prueba con otro método de pago.',
        expired_card: 'La tarjeta está expirada. Revisa la fecha o utiliza otra tarjeta.',
        incorrect_zip: 'El código postal no coincide con el registrado para la tarjeta.',
        incorrect_cvc: 'El código de seguridad es incorrecto. Revísalo e inténtalo nuevamente.',
        invalid_cvc: 'El código de seguridad no es válido.',
        card_declined: 'El banco rechazó la tarjeta. Contacta a tu banco o utiliza otra tarjeta.',
        authentication_required: 'Tu banco requiere una verificación adicional para autorizar el pago.',
        processing_error: 'Stripe no pudo procesar el pago. Espera un momento e inténtalo nuevamente.',
    };

    return messages[code] || error?.message || 'No pudimos confirmar el pago. Revisa los datos e inténtalo nuevamente.';
};

/**
 * Formulario transaccional de un solo uso.
 * Stripe aloja y tokeniza todos los campos sensibles dentro de PaymentElement;
 * Animayuks nunca recibe ni persiste PAN, CVC o fecha de expiración.
 */
export const PaymentForm = ({ order, onConfirmed, showToast }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isConfirming, setIsConfirming] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const confirmPayment = async (event) => {
        event.preventDefault();
        if (!stripe || !elements || !isComplete || isConfirming) return;

        setIsConfirming(true);
        setPaymentError('');

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret: order.stripeClientSecret,
            confirmParams: { return_url: window.location.href },
            redirect: 'if_required',
        });

        if (error) {
            const message = stripeErrorMessage(error);
            setPaymentError(message);
            showToast(message, 'error');
            setIsConfirming(false);
            return;
        }

        if (!paymentIntent || !['succeeded', 'processing'].includes(paymentIntent.status)) {
            const message = 'El pago necesita una acción adicional antes de confirmarse.';
            setPaymentError(message);
            showToast(message, 'warning');
            setIsConfirming(false);
            return;
        }

        onConfirmed(order, paymentIntent.status);
    };

    return (
        <form onSubmit={confirmPayment}>
            <PaymentElement
                options={{ layout: 'tabs' }}
                onChange={(event) => {
                    setIsComplete(event.complete);
                    if (event.error) setPaymentError(stripeErrorMessage(event.error));
                    else if (paymentError) setPaymentError('');
                }}
            />
            {paymentError && (
                <div role="alert" className="mt-4 bg-[#ec1676]/10 border border-[#ec1676]/30 rounded-xl p-3 flex gap-2 items-start text-xs text-[#fda4c8] font-bold leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                </div>
            )}
            <button type="submit" disabled={!stripe || !elements || !isComplete || isConfirming} className="w-full bg-gradient-to-r from-[#03bbd3] to-[#02a8be] hover:from-[#02a8be] hover:to-[#0295a8] text-white font-bold py-4 rounded-xl mt-6 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                {isConfirming ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirmando con Stripe...</> : <><Lock className="w-4 h-4" /> Pagar con Stripe</>}
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Los datos de tarjeta se envían directamente a Stripe y no se guardan
            </p>
        </form>
    );
};
