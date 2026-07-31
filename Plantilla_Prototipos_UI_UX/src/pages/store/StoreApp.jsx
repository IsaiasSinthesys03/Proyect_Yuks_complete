import React, { useState, useEffect, useRef } from 'react';
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

import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import { logout as apiLogout } from '../../lib/api';
import { onRealtimeEvent } from '../../lib/ws';
import { useAddresses } from '../../api/checkout';
import { Header } from '../../components/layout/Header';
import { PaymentModal } from '../../components/store/PaymentModal';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { MobileMenu } from '../../components/store/MobileMenu';
import { Footer } from '../../components/store/Footer';
import { AuthModal } from '../../components/store/AuthModal';
import { CheckoutAddressModal } from '../../components/store/CheckoutAddressModal';
import { OtpModal } from '../../components/store/OtpModal';
import { DonationModal } from '../../components/store/DonationModal';
import { ProfileDrawer } from '../../components/store/ProfileDrawer';
import { LandingView } from './LandingPage';
import { StoreView } from './StorePage';
import { ProductView } from './ProductPage';
import { ProfileDashboard } from './ProfilePage';
import { LegalView } from './LegalPage';

export default function AnimayuksWeb() {
    // Definición de Estilos de Marca (Injectados)
    const brandStyles = `
        :root {
            --brand-cyan: #03bbd3;
            --brand-magenta: #ec1676;
            --brand-yellow: #ffce07;
            --brand-lime: #96c93e;
            --brand-purple: #502c84;
            --bg-premium: #fcfcfd;
            --bg-landing: #d4ecb8; /* Verde Lima más saturado y vibrante */
            --bg-store: #c2e9f0;   /* Cian más saturado y vibrante */
            --text-main: #0f172a;
            --text-muted: #64748b;
        }
        .bg-brand-cyan { background-color: var(--brand-cyan); }
        .text-brand-cyan { color: var(--brand-cyan); }
        .border-brand-cyan { border-color: var(--brand-cyan); }
        
        .bg-brand-magenta { background-color: var(--brand-magenta); }
        .text-brand-magenta { color: var(--brand-magenta); }
        
        .bg-brand-lime { background-color: var(--brand-lime); }
        .text-brand-lime { color: var(--brand-lime); }

        .bg-landing { background-color: var(--bg-landing); }
        .bg-store { background-color: var(--bg-store); }

        .glass-light {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .shadow-premium {
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
        }

        .shadow-lime {
            box-shadow: 0 10px 25px -5px rgba(150, 201, 62, 0.2);
        }
        
        .shadow-brand {
            box-shadow: 0 10px 25px -5px rgba(3, 187, 211, 0.2);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
            animation-play-state: paused;
        }
    `;

    const initialLegalSlug = (() => {
        const pathSlug = window.location.pathname.match(/\/legal\/(privacy|terms|shipping|returns)\/?$/)?.[1];
        return pathSlug || 'terms';
    })();
    const [currentView, setCurrentView] = useState(() => { const path = window.location.pathname; if (path.includes('legal') || path.includes('privacidad') || path.includes('terminos')) return 'legal'; if (path.includes('store') || path.includes('catalogo')) return 'store'; return 'landing'; });
    const [previousView, setPreviousView] = useState('landing');
    const [selectedLegalSlug, setSelectedLegalSlug] = useState(initialLegalSlug);
    const [selectedProductId, setSelectedProductId] = useState(null);

    // Modals & Drawers
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const isAuthModalOpen = useUiStore((state) => state.isAuthModalOpen);
    const openAuth = useUiStore((state) => state.openAuth);
    const closeAuth = useUiStore((state) => state.closeAuth);
    const [isDonationOpen, setIsDonationOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Requerimientos Globales — [REQ-FE-29] el consentimiento de cookies se
    // PERSISTE en localStorage: una vez aceptado, el banner no vuelve a aparecer.
    const [showCookieBanner, setShowCookieBanner] = useState(() => {
        try { return localStorage.getItem('animayuks_cookie_consent') !== 'accepted'; }
        catch { return true; }
    });
    const acceptCookies = () => {
        try { localStorage.setItem('animayuks_cookie_consent', 'accepted'); } catch { /* modo privado */ }
        setShowCookieBanner(false);
    };
    const [showCheckoutAddressModal, setShowCheckoutAddressModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    // [ENTERPRISE] Command Palette State
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    // App State — la sesión REAL vive en authStore (Fase 40). `isLoggedIn` se deriva
    // del usuario en memoria: login/register lo pueblan y el bootstrap lo restaura
    // desde la cookie HttpOnly al recargar. Así el Header refleja la sesión real.
    const isLoggedIn = useAuthStore((s) => !!s.user);
    // Fase 42: el mock `cartTotal` MURIÓ — el carrito real vive en cartStore
    // (los componentes lo leen directo, sin prop drilling).
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const setCheckoutAddress = useCheckoutStore((s) => s.setAddress);
    // Direcciones del usuario: si ya tiene una, el checkout salta directo al pago.
    const { data: addresses } = useAddresses(isLoggedIn);
    const [toast, setToast] = useState(null);

    // Flujo de checkout (Fase 42): dirección → pago simulado (TODO: STRIPE).
    const startCheckout = () => {
        const existing = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
        if (existing) {
            setCheckoutAddress(existing.id);
            setShowPaymentModal(true);
        } else {
            setShowCheckoutAddressModal(true);
        }
    };

    // [ENTERPRISE] Social Proof FOMO State
    const [fomoMsg, setFomoMsg] = useState(null);

    useEffect(() => {
        // Escuchar atajo Ctrl+K o Cmd+K
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // [Fase 46] Social Proof REAL vía WebSocket: el motor de intervalo falso MURIÓ.
    // El backend transmite `social_proof:purchase` (nombre + inicial + municipio +
    // producto, sin exponer email/monto) cuando se confirma un pago; aquí lo
    // convertimos en el popup FOMO que ya existe en el prototipo.
    const fomoHideTimer = useRef(null);
    useEffect(() => {
        const off = onRealtimeEvent('social_proof:purchase', (p) => {
            const nombre = p?.displayName ?? 'Alguien';
            const lugar = p?.municipality ? ` de ${p.municipality}` : '';
            const producto = p?.productName ?? 'un producto';
            setFomoMsg(`⚡ ${nombre}${lugar} acaba de comprar ${producto}`);
            if (fomoHideTimer.current) clearTimeout(fomoHideTimer.current);
            fomoHideTimer.current = setTimeout(() => setFomoMsg(null), 6000);
        });
        return () => { off(); if (fomoHideTimer.current) clearTimeout(fomoHideTimer.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const navigate = (view, payload = null) => {
        if (view === -1 || view === 'back') {
            const targetView = previousView || 'landing';
            setCurrentView(targetView);
            setIsMobileMenuOpen(false);
            setIsCommandOpen(false);
            window.scrollTo(0, 0);
            return;
        }
        if (typeof view !== 'string') return;
        if (currentView !== 'legal') {
            setPreviousView(currentView);
        }
        if (view === 'product' && payload) setSelectedProductId(payload);
        if (view.startsWith('legal')) {
            const requestedSlug = view.includes(':') ? view.split(':')[1] : payload;
            setSelectedLegalSlug(requestedSlug || 'terms');
            setCurrentView('legal');
        } else {
            setCurrentView(view);
        }
        setIsMobileMenuOpen(false);
        setIsCommandOpen(false);
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#03bbd3]/20 overflow-x-hidden">
            <style>{brandStyles}</style>

            {/* Toast Notifier */}
            {toast && (
                <div className={`fixed top-20 left-3 right-3 sm:top-24 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full font-bold text-sm text-center shadow-2xl animate-in slide-in-from-top-4 z-[9999] flex items-center justify-center gap-2 ${toast.type === 'success' ? 'bg-[#03bbd3] text-white' : toast.type === 'warning' ? 'bg-[#ffce07] text-slate-900' : 'bg-[#ec1676] text-white'}`}>
                    <CheckCircle2 className="w-4 h-4" /> {toast.msg}
                </div>
            )}

            {/* [ENTERPRISE] Social Proof FOMO Popup */}
            {fomoMsg && (
                <div className="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl z-[90] flex items-center gap-3 animate-in slide-in-from-left-8 fade-in duration-500 sm:max-w-sm">
                    <div className="w-10 h-10 bg-[#03bbd3]/10 rounded-full flex items-center justify-center shrink-0 border border-[#03bbd3]/20"><Zap className="w-5 h-5 text-[#03bbd3] animate-pulse" /></div>
                    <p className="text-xs text-slate-800 font-medium leading-tight">{fomoMsg}</p>
                </div>
            )}

            {/* [REQ-FE-29] Cookie Consent Banner */}
            {showCookieBanner && (
                <div className="fixed bottom-3 left-3 right-3 w-auto md:left-auto md:bottom-6 md:right-6 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xl z-[100] flex flex-col gap-4 animate-in slide-in-from-bottom-8 md:max-w-sm">
                    <p className="text-xs text-slate-600">Usamos cookies para mejorar la retención y personalizar tu experiencia de juego y compras. Al navegar, aceptas su uso.</p>
                    <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
                        <button onClick={acceptCookies} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#03bbd3]/20">Aceptar Todas</button>
                        <button onClick={() => { navigate('legal'); }} className="text-slate-500 text-xs font-bold hover:text-slate-900 px-2 py-2">Ver Políticas</button>
                    </div>
                </div>
            )}

            {/* [ENTERPRISE] Command Palette (Cmd+K) */}
            {isCommandOpen && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[200] flex items-start justify-center pt-[20vh] p-4 animate-in fade-in">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                            <Terminal className="w-5 h-5 text-[#03bbd3]" />
                            <input autoFocus type="text" placeholder="Buscar productos, órdenes o navegar... (Ej. 'Playera' o 'Ir a Legal')" className="flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 text-lg font-light" />
                            <button onClick={() => setIsCommandOpen(false)} className="bg-white text-slate-400 hover:text-slate-900 px-2 py-1 rounded text-xs font-bold border border-slate-200 shadow-sm">ESC</button>
                        </div>
                        <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                            <p className="text-xs font-bold text-slate-400 uppercase px-3 py-1">Accesos Rápidos</p>
                            <button onClick={() => navigate('store')} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 text-slate-600 hover:text-[#03bbd3] transition-colors"><Search className="w-4 h-4 text-slate-400" /> Buscar en Catálogo</button>
                            <button onClick={() => navigate('profile')} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 text-slate-600 hover:text-[#03bbd3] transition-colors"><Package className="w-4 h-4 text-slate-400" /> Rastrear mis Pedidos</button>
                            <button onClick={() => navigate('legal')} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 text-slate-600 hover:text-[#03bbd3] transition-colors"><FileText className="w-4 h-4 text-slate-400" /> Documentación Legal</button>
                        </div>
                    </div>
                </div>
            )}

            <MobileMenu isOpen={isMobileMenuOpen} close={() => setIsMobileMenuOpen(false)} navigate={navigate} />

            {/* Global Header */}
            <Header
                navigate={navigate}
                currentView={currentView}
                openCart={() => setIsCartOpen(true)}
                openProfile={() => isLoggedIn ? setIsProfileOpen(true) : openAuth()}
                openMobileMenu={() => setIsMobileMenuOpen(true)}
                isLoggedIn={isLoggedIn}
                showToast={showToast}
            />

            {/* Router Switch con fondos temáticos consolidados */}
            <main className="pt-20 relative">
                {currentView === 'landing' && (
                    <div className="bg-landing min-h-screen -mt-20 pt-20">
                        <LandingView navigate={navigate} showToast={showToast} />
                    </div>
                )}
                {currentView === 'store' && (
                    <div className="bg-store min-h-screen -mt-20 pt-20">
                        <StoreView
                            navigate={navigate}
                            showToast={showToast}
                            openCart={() => setIsCartOpen(true)}
                            openProfile={() => isLoggedIn ? setIsProfileOpen(true) : openAuth()}
                            isLoggedIn={isLoggedIn}
                        />
                    </div>
                )}
                {currentView === 'product' && (
                    <div className="bg-[#f8fafc] min-h-screen">
                        <ProductView productId={selectedProductId} navigate={navigate} showToast={showToast} />
                    </div>
                )}
                {currentView === 'profile' && (
                    <div className="bg-[#f8fafc] min-h-screen">
                        <ProfileDashboard navigate={navigate} showToast={showToast} />
                    </div>
                )}
                {currentView === 'legal' && (
                    <div className="bg-[#f8fafc] min-h-screen">
                        <LegalView navigate={navigate} initialSlug={selectedLegalSlug} />
                    </div>
                )}
            </main>

            {/* Global Footer (Visible en todas las vistas menos login/checkout modal) */}
            <Footer navigate={navigate} />

            {/* Modales y Drawers Globales */}
            <CartDrawer
                isOpen={isCartOpen}
                close={() => setIsCartOpen(false)}
                onClose={() => setIsCartOpen(false)}
                navigate={navigate}
                showToast={showToast}
                requireAddress={() => { setIsCartOpen(false); startCheckout(); }}
                onCheckout={() => { setIsCartOpen(false); startCheckout(); }}
                isLoggedIn={isLoggedIn}
                openAuth={openAuth}
            />
            <ProfileDrawer
                isOpen={isProfileOpen}
                close={() => setIsProfileOpen(false)}
                onClose={() => setIsProfileOpen(false)}
                navigate={navigate}
                logout={async () => { await apiLogout(); showToast('Sesión cerrada correctamente'); setIsProfileOpen(false); }}
                onLogout={async () => { await apiLogout(); showToast('Sesión cerrada correctamente'); setIsProfileOpen(false); }}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                close={closeAuth}
                onClose={closeAuth}
                showToast={showToast}
                currentView={currentView}
            />
            <CheckoutAddressModal
                isOpen={showCheckoutAddressModal}
                close={() => setShowCheckoutAddressModal(false)}
                onClose={() => setShowCheckoutAddressModal(false)}
                onSaved={(addressId) => { setCheckoutAddress(addressId); setShowCheckoutAddressModal(false); setShowPaymentModal(true); }}
                showToast={showToast}
            />
            <OtpModal
                isOpen={showOtpModal}
                close={() => setShowOtpModal(false)}
                onClose={() => setShowOtpModal(false)}
                showToast={showToast}
            />
            <PaymentModal
                isOpen={showPaymentModal}
                close={() => setShowPaymentModal(false)}
                onClose={() => setShowPaymentModal(false)}
                navigate={navigate}
                showToast={showToast}
            />
            <DonationModal
                isOpen={isDonationOpen}
                close={() => setIsDonationOpen(false)}
                onClose={() => setIsDonationOpen(false)}
                showToast={showToast}
            />
        </div>
    );
}
