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
import { useMutation } from '@tanstack/react-query';
import { donate } from '../../api/checkout';
import { useAuthStore } from '../../store/authStore';

export const DonationModal = ({ isOpen, close, isLoggedIn, showToast }) => {
    const [amount, setAmount] = useState(10);
    const [isCustom, setIsCustom] = useState(false);
    const [donorEmail, setDonorEmail] = useState('');
    const [success, setSuccess] = useState(null);
    const minAmount = 10;

    const userEmail = useAuthStore((s) => s.user?.email);

    // Validación en tiempo real (Reactiva)
    const isValidAmount = amount !== '' && Number(amount) >= minAmount;

    /**
     * POST /api/donate (Fase 46). El backend crea la donación REAL (PENDING) y
     * devuelve un `clientSecret`. TODO: STRIPE — con claves reales, aquí iría
     * `stripe.confirmPayment(clientSecret)`; hoy simulamos el éxito con el
     * PaymentIntent ficticio que retorna el backend.
     */
    const donateMutation = useMutation({
        mutationFn: () => donate(Number(amount), (isLoggedIn ? userEmail : donorEmail.trim())),
        onSuccess: (data) => {
            // Evidencia de que la lógica del backend corrió: llegó el clientSecret.
            setSuccess(data);
            showToast('¡Gracias por tu aportación! (pago simulado)', 'success');
        },
        onError: (error) => {
            // 400 campos faltantes · 422 monto < mínimo · 409 idempotencia
            showToast(error?.response?.data?.error || error?.response?.data?.message || 'No se pudo procesar la donación.', 'error');
        },
    });

    const handleDonate = (e) => {
        e.preventDefault();
        if (!isValidAmount) { showToast(`El monto mínimo permitido es de $${minAmount} MXN`, 'error'); return; }
        if (!isLoggedIn && !donorEmail.trim()) { showToast('Ingresa tu correo para el recibo.', 'error'); return; }
        donateMutation.mutate();
    };

    const handleClose = () => {
        setSuccess(null);
        setIsCustom(false);
        setAmount(10);
        setDonorEmail('');
        close();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0f172a] border border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95">
                <button onClick={handleClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-black/20 rounded-full p-1"><X className="w-5 h-5" /></button>
                <div className="h-40 bg-gradient-to-br from-pink-500 to-purple-600 relative flex items-center justify-center overflow-hidden">{success ? <CheckCircle2 className="w-16 h-16 text-white opacity-90" /> : <HeartHandshake className="w-16 h-16 text-white opacity-80" />}</div>

                {success ? (
                    /* ── Éxito: donación registrada en la BD (PENDING) ── */
                    <div className="p-8 text-center">
                        <h2 className="text-2xl font-black text-white mb-2">¡Gracias de corazón! 💖</h2>
                        <p className="text-slate-400 text-sm mb-6">Tu aportación de <span className="text-pink-400 font-black">${Number(success.amount).toFixed(2)} MXN</span> quedó registrada.</p>
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-6 text-left space-y-2">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Folio de Donación</p>
                            <p className="text-xs font-mono text-pink-300 break-all">{success.donationId}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold pt-1">Estado</p>
                            <p className="text-xs font-black text-white">{success.status} <span className="text-[9px] text-amber-400 font-bold uppercase">· pago simulado</span></p>
                        </div>
                        <button onClick={handleClose} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">Cerrar</button>
                    </div>
                ) : (
                    <div className="p-8">
                        <h2 className="text-2xl font-black text-white text-center mb-2">Apoya el Proyecto</h2>
                        <p className="text-slate-400 text-sm text-center mb-6">Tu aportación nos ayuda a mantener los servidores encendidos. 💖</p>
                        <form onSubmit={handleDonate} className="space-y-6">
                            {!isCustom ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setAmount(10)} className={`py-3 rounded-xl font-bold border transition-colors ${amount === 10 ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>$10</button>
                                    <button type="button" onClick={() => setAmount(20)} className={`py-3 rounded-xl font-bold border transition-colors ${amount === 20 ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>$20</button>
                                    <button type="button" onClick={() => setAmount(30)} className={`py-3 rounded-xl font-bold border transition-colors ${amount === 30 ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>$30</button>
                                    <button type="button" onClick={() => { setIsCustom(true); setAmount(''); }} className="py-3 rounded-xl font-bold bg-slate-800 text-slate-400 border border-slate-700 text-xs">Otra Cantidad</button>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative max-w-[200px] mx-auto">
                                        <span className="absolute left-4 top-3 text-white font-bold text-xl">$</span>
                                        <input autoFocus type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={`w-full bg-slate-800 border-2 rounded-xl pl-8 pr-4 py-3 text-xl text-white font-black text-center outline-none transition-colors ${!isValidAmount && amount !== '' ? 'border-red-500 focus:border-red-500' : 'border-pink-500 focus:border-pink-400'}`} />
                                    </div>
                                    {/* Alerta de validación en tiempo real */}
                                    {!isValidAmount && amount !== '' && <p className="text-[10px] text-red-500 text-center mt-2 font-bold animate-pulse">El monto mínimo es de ${minAmount} MXN</p>}
                                    <button type="button" onClick={() => { setIsCustom(false); setAmount(10); }} className="text-[10px] text-slate-500 underline text-center block w-full mt-2 hover:text-white">Volver a botones rápidos</button>
                                </div>
                            )}
                            {!isLoggedIn && (
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 animate-in fade-in">
                                    <p className="text-[10px] text-pink-400 font-bold mb-2 uppercase flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Transparencia Fiscal</p>
                                    <input type="email" required value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="Tu correo para enviar el recibo" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                                </div>
                            )}
                            <button type="submit" disabled={!isValidAmount || donateMutation.isPending} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                {donateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : 'Confirmar Donación Segura'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// 4. DRAWERS (CART & PROFILE QUICK MENU)
// ==========================================

