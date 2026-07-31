import React, { useState } from 'react';
import {
    ShoppingCart, User, Menu, X, ChevronRight, ChevronLeft, Heart, Play,
    Search, Filter, ChevronDown, Package, MapPin, CreditCard,
    Ticket, Gamepad2, Bell, Copy, CheckCircle2, Truck, Box,
    Home, LogOut, HeartHandshake, Mail, Lock, ShieldAlert,
    AlertTriangle, Settings, Image as ImageIcon, Clock,
    Smartphone, FileText, CheckSquare, Youtube, Cat, Coins,
    Facebook, Instagram, Twitter, Eye, EyeOff, Trash2, ArrowLeft, Plus, Loader2,
    Sparkles, Terminal, Eye as ViewIcon, Zap, Navigation, Star, Share2, ShieldCheck
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { donate, useCheckoutConfig } from '../../api/checkout';
import { useAuthStore } from '../../store/authStore';

const donationStripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    : null;

const DonationStripeForm = ({ donation, onConfirmed, showToast }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async (event) => {
        event.preventDefault();
        if (!stripe || !elements || isConfirming) return;
        setIsConfirming(true);
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret: donation.clientSecret,
            confirmParams: { return_url: window.location.href },
            redirect: 'if_required',
        });
        if (error) {
            showToast(error.message || 'Stripe rechazó la aportación.', 'error');
            setIsConfirming(false);
            return;
        }
        if (!paymentIntent || !['succeeded', 'processing'].includes(paymentIntent.status)) {
            showToast('La aportación necesita una acción adicional.', 'warning');
            setIsConfirming(false);
            return;
        }
        onConfirmed(donation, paymentIntent.status);
    };

    return (
        <form onSubmit={handleConfirm} className="w-full py-6">
            <h2 className="font-bungee text-xl sm:text-2xl text-white text-center leading-tight mb-3">Completa tu aportación</h2>
            <p className="text-white/60 text-sm text-center mb-6">Pago seguro de ${Number(donation.amount).toFixed(2)} MXN procesado por Stripe.</p>
            <PaymentElement options={{ layout: 'tabs' }} />
            <button type="submit" disabled={!stripe || !elements || isConfirming} className="relative w-full group overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500"></div>
                <div className="relative py-4 text-white font-black text-sm flex items-center justify-center gap-2">
                    {isConfirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando con Stripe...</> : 'Pagar Aportación'}
                </div>
            </button>
        </form>
    );
};

export const DonationModal = ({ isOpen, close, isLoggedIn, showToast }) => {
    const queryClient = useQueryClient();
    const { data: config, isPending: configLoading } = useCheckoutConfig();
    const minAmount = config?.donationMinAmount || 10;
    const quickAmounts = config?.donationQuickAmounts?.length === 3 ? config.donationQuickAmounts : [10, 20, 30];
    const donationTitle = config?.donationTitle || 'Apoya el Proyecto';
    const donationDesc = config?.donationDescription || 'Tu aportación nos ayuda a mantener los servidores encendidos. 💖';

    const [amount, setAmount] = useState(quickAmounts[0]);
    const [isCustom, setIsCustom] = useState(false);
    const [donorEmail, setDonorEmail] = useState('');
    const [success, setSuccess] = useState(null);
    const [pendingDonation, setPendingDonation] = useState(null);

    React.useEffect(() => {
        if (config && !isCustom && !success) {
            setAmount(quickAmounts[0]);
        }
    }, [config]);

    const userEmail = useAuthStore((s) => s.user?.email);

    // Validación en tiempo real (Reactiva)
    const isValidAmount = amount !== '' && Number(amount) >= minAmount;

    const donateMutation = useMutation({
        mutationFn: () => donate(Number(amount), (isLoggedIn ? userEmail : donorEmail.trim())),
        onSuccess: (data) => {
            if (!donationStripePromise || !data.clientSecret) {
                showToast('Stripe no está configurado para confirmar la aportación.', 'error');
                return;
            }
            setPendingDonation(data);
        },
        onError: (error) => {
            showToast(error?.response?.data?.error || error?.response?.data?.message || 'No se pudo procesar la donación.', 'error');
        },
    });

    const handleDonationConfirmed = (data, stripeStatus) => {
        setPendingDonation(null);
        setSuccess({ ...data, stripeStatus });
        queryClient.invalidateQueries({ queryKey: ['profile', 'donations'] });
        showToast(stripeStatus === 'succeeded' ? '¡Gracias! Stripe confirmó tu aportación.' : 'Stripe está procesando tu aportación.', 'success');
    };

    const handleDonate = (e) => {
        e.preventDefault();
        if (!isValidAmount) { showToast(`El monto mínimo permitido es de $${minAmount} MXN`, 'error'); return; }
        if (!isLoggedIn && !donorEmail.trim()) { showToast('Ingresa tu correo para el recibo.', 'error'); return; }
        donateMutation.mutate();
    };

    const handleClose = () => {
        setSuccess(null);
        setPendingDonation(null);
        setIsCustom(false);
        setAmount(10);
        setDonorEmail('');
        close();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
            {/* Modal Container */}
            <div className={`mobile-scroll-safe w-full ${config?.donationBannerUrl ? 'max-w-4xl' : 'max-w-md'} bg-[#0a0b14] rounded-2xl sm:rounded-[2rem] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 flex flex-col md:flex-row border border-white/5`}>
                
                {/* Left Section (Image) */}
                {config?.donationBannerUrl && (
                    <div className="w-full md:w-5/12 relative min-h-[200px] md:min-h-[500px] bg-slate-900">
                        <img 
                            src={config.donationBannerUrl} 
                            alt="Apoya el Proyecto" 
                            className="absolute inset-0 w-full h-full object-cover shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]" 
                        />
                        {/* Sutil difuminado en los bordes para integrarse mejor */}
                        <div className="absolute inset-0 shadow-[inset_0_-40px_40px_-20px_#0a0b14] md:shadow-[inset_-40px_0_40px_-20px_#0a0b14] pointer-events-none" />
                    </div>
                )}

                {/* Right Section (Form) */}
                <div className={`relative z-10 p-5 sm:p-8 flex flex-col items-center justify-center w-full ${config?.donationBannerUrl ? 'md:w-7/12' : 'w-full'}`}>
                    
                    {/* Top Shine inside form area */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20" />

                    <button onClick={handleClose} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full p-1.5 transition-colors z-50">
                        <X className="w-4 h-4" />
                    </button>

                    {success ? (
                        <div className="text-center w-full py-6 animate-in fade-in zoom-in-95">
                            <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                                <CheckCircle2 className="w-10 h-10 text-green-400" />
                            </div>
                            <h2 className="font-bungee text-xl sm:text-2xl text-white leading-tight mb-3">¡Gracias de corazón! 💖</h2>
                            <p className="text-white/60 text-sm mb-8">Tu aportación de <span className="text-pink-400 font-black">${Number(success.amount).toFixed(2)} MXN</span> quedó registrada.</p>
                            
                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Folio de Donación</p>
                                    <p className="text-xs font-mono text-pink-300 break-all">{success.donationId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest pt-2 border-t border-white/5">Estado</p>
                                    <p className="text-xs font-black text-white flex items-center gap-2">{success.stripeStatus || success.status} <span className="text-[9px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-bold uppercase">Stripe Test</span></p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="w-full bg-white text-black hover:bg-slate-200 font-black py-4 rounded-xl shadow-lg transition-all">Cerrar</button>
                        </div>
                    ) : pendingDonation ? (
                        <Elements stripe={donationStripePromise} options={{ clientSecret: pendingDonation.clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#ec1676', colorBackground: '#0a0b14', colorText: '#ffffff', borderRadius: '12px' } } }}>
                            <DonationStripeForm donation={pendingDonation} onConfirmed={handleDonationConfirmed} showToast={showToast} />
                        </Elements>
                    ) : (
                        <div className="w-full">
                            {/* We remove the big icon header if there's a banner to let the illustration shine */}
                            {!config?.donationBannerUrl && (
                                <div className="mx-auto w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-xl shadow-[0_0_30px_rgba(236,22,118,0.2)]">
                                    <HeartHandshake className="w-8 h-8 text-pink-400" />
                                </div>
                            )}

                            {configLoading ? (
                                <div className="py-20 flex justify-center flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Cargando...</p>
                                </div>
                            ) : (
                                <>
                                    <h2 className="font-bungee text-xl sm:text-2xl text-white text-center leading-tight mb-3">{donationTitle}</h2>
                                    <p className="text-white/60 text-sm text-center mb-8">{donationDesc}</p>

                                    <form onSubmit={handleDonate} className="space-y-6">
                                        {!isCustom ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {quickAmounts.map((qAmount, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        type="button" 
                                                        onClick={() => setAmount(qAmount)} 
                                                        className={`py-3.5 rounded-2xl font-black text-lg transition-all duration-300 backdrop-blur-xl ${amount === qAmount ? 'bg-pink-500 text-white border-transparent shadow-[0_0_20px_rgba(236,22,118,0.4)] scale-[1.02]' : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-white'}`}
                                                    >
                                                        ${qAmount}
                                                    </button>
                                                ))}
                                                <button type="button" onClick={() => { setIsCustom(true); setAmount(''); }} className="py-3.5 rounded-2xl font-bold bg-black/40 text-white/50 border border-white/5 hover:bg-black/60 hover:text-white/80 transition-colors text-xs backdrop-blur-xl">
                                                    Otra Cantidad
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="animate-in slide-in-from-bottom-2">
                                                <div className="relative max-w-[200px] mx-auto group">
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                                    <div className="relative">
                                                        <span className="absolute left-5 top-4 text-white/50 font-bold text-xl">$</span>
                                                        <input autoFocus type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={`w-full bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-2xl text-white font-black text-center outline-none transition-colors ${!isValidAmount && amount !== '' ? 'border-red-500/50 focus:border-red-500 text-red-100' : 'focus:border-pink-500/50'}`} />
                                                    </div>
                                                </div>
                                                {!isValidAmount && amount !== '' && <p className="text-[10px] text-red-400 text-center mt-3 font-bold uppercase tracking-widest animate-pulse">Mínimo ${minAmount} MXN</p>}
                                                <button type="button" onClick={() => { setIsCustom(false); setAmount(quickAmounts[0]); }} className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-center block w-full mt-4 hover:text-white transition-colors">
                                                    ← Volver a opciones
                                                </button>
                                            </div>
                                        )}

                                        {!isLoggedIn && (
                                            <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl animate-in fade-in">
                                                <p className="text-[10px] text-pink-400 font-bold mb-3 uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> Transparencia Fiscal</p>
                                                <input type="email" required value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="Correo para el recibo" className="w-full bg-white/5 border border-white/10 focus:border-pink-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" />
                                            </div>
                                        )}

                                        <button type="submit" disabled={!isValidAmount || donateMutation.isPending} className="relative w-full group overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-[length:200%_auto] group-hover:bg-[center_right_1rem] transition-all duration-500"></div>
                                            <div className="relative py-4 text-white font-black text-sm tracking-wide shadow-lg flex items-center justify-center gap-2">
                                                {donateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : 'Confirmar Donación Segura'}
                                            </div>
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
