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

import { Header } from './src/components/layout/Header';
import { CartDrawer } from './src/components/cart/CartDrawer';
import { HeroCarousel } from './src/components/home/HeroCarousel';
import { CharacterGrid } from './src/components/home/CharacterGrid';
import { TrendingTop } from './src/components/home/TrendingTop';
import AboutExperience from './src/components/home/AboutExperience';


// --- MAIN APP (Router Simulation) ---
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

    const [currentView, setCurrentView] = useState('landing');
    const [selectedProductId, setSelectedProductId] = useState(null);

    // Modals & Drawers
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isDonationOpen, setIsDonationOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Requerimientos Globales
    const [showCookieBanner, setShowCookieBanner] = useState(true);
    const [showCheckoutAddressModal, setShowCheckoutAddressModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    // [ENTERPRISE] Command Palette State
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    // App State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);
    const [toast, setToast] = useState(null);

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

        // Motor FOMO (Simulación de compras en vivo en la red local)
        const fomoInterval = setInterval(() => {
            setFomoMsg('⚡ Roberto G. de Mérida acaba de comprar Playera Élite');
            setTimeout(() => setFomoMsg(null), 6000);
        }, 25000);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(fomoInterval);
        };
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const navigate = (view, payload = null) => {
        if (view === 'product' && payload) setSelectedProductId(payload);
        setCurrentView(view);
        setIsMobileMenuOpen(false);
        setIsCommandOpen(false);
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#03bbd3]/20 overflow-x-hidden">
            <style>{brandStyles}</style>

            {/* Toast Notifier */}
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full font-bold shadow-2xl animate-in slide-in-from-top-4 z-[100] flex items-center gap-2 ${toast.type === 'success' ? 'bg-[#03bbd3] text-white' : toast.type === 'warning' ? 'bg-[#ffce07] text-slate-900' : 'bg-[#ec1676] text-white'}`}>
                    <CheckCircle2 className="w-4 h-4" /> {toast.msg}
                </div>
            )}

            {/* [ENTERPRISE] Social Proof FOMO Popup */}
            {fomoMsg && (
                <div className="fixed bottom-6 left-6 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl z-[90] flex items-center gap-3 animate-in slide-in-from-left-8 fade-in duration-500 max-w-sm">
                    <div className="w-10 h-10 bg-[#03bbd3]/10 rounded-full flex items-center justify-center shrink-0 border border-[#03bbd3]/20"><Zap className="w-5 h-5 text-[#03bbd3] animate-pulse" /></div>
                    <p className="text-xs text-slate-800 font-medium leading-tight">{fomoMsg}</p>
                </div>
            )}

            {/* [REQ-FE-29] Cookie Consent Banner */}
            {showCookieBanner && (
                <div className="fixed bottom-0 left-0 w-full md:w-auto md:bottom-6 md:right-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-2xl z-[100] flex flex-col gap-4 animate-in slide-in-from-bottom-8 max-w-sm">
                    <p className="text-xs text-slate-600">Usamos cookies para mejorar la retención y personalizar tu experiencia de juego y compras. Al navegar, aceptas su uso.</p>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowCookieBanner(false)} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#03bbd3]/20">Aceptar Todas</button>
                        <button onClick={() => { navigate('legal'); setShowCookieBanner(false); }} className="text-slate-500 text-xs font-bold hover:text-slate-900 px-2 py-2">Ver Políticas</button>
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
                openProfile={() => isLoggedIn ? setIsProfileOpen(true) : setIsAuthModalOpen(true)}
                openMobileMenu={() => setIsMobileMenuOpen(true)}
                isLoggedIn={isLoggedIn}
                setCartTotal={setCartTotal}
                cartTotal={cartTotal}
                showToast={showToast}
            />

            {/* Router Switch con fondos temáticos consolidados */}
            <main className="pt-20 relative">
                {currentView === 'landing' && (
                    <div className="bg-landing min-h-screen -mt-20 pt-20">
                        <LandingView navigate={navigate} setCartTotal={setCartTotal} showToast={showToast} />
                    </div>
                )}
                {currentView === 'store' && (
                    <div className="bg-store min-h-screen -mt-20 pt-20">
                        <StoreView navigate={navigate} setCartTotal={setCartTotal} showToast={showToast} />
                    </div>
                )}
                {currentView === 'product' && (
                    <div className="bg-store min-h-screen -mt-20 pt-20">
                        <ProductView productId={selectedProductId} navigate={navigate} setCartTotal={setCartTotal} showToast={showToast} />
                    </div>
                )}
                {currentView === 'profile' && isLoggedIn && (
                    <div className="bg-landing min-h-screen -mt-20 pt-20">
                        <ProfileDashboard showToast={showToast} setShowOtpModal={setShowOtpModal} navigate={navigate} />
                    </div>
                )}
                {currentView === 'legal' && (
                    <div className="bg-store min-h-screen -mt-20 pt-20">
                        <LegalView navigate={navigate} />
                    </div>
                )}
            </main>

            <Footer navigate={navigate} showToast={showToast} />

            {/* [REQ-FE-26] Floating Donation Button */}
            <button
                onClick={() => setIsDonationOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-40 group animate-bounce"
                style={{ animationDuration: '2s' }}
            >
                <div className="relative">
                    <Cat className="w-8 h-8 text-white group-hover:animate-pulse" />
                    <Coins className="w-4 h-4 text-amber-300 absolute -top-2 -right-2" />
                </div>
            </button>

            {/* Modals & Drawers */}
            <CartDrawer isOpen={isCartOpen} close={() => setIsCartOpen(false)} total={cartTotal} showToast={showToast} requireAddress={() => setShowCheckoutAddressModal(true)} isLoggedIn={isLoggedIn} openAuth={() => setIsAuthModalOpen(true)} navigate={navigate} />
            <ProfileDrawer isOpen={isProfileOpen} close={() => setIsProfileOpen(false)} navigate={navigate} logout={() => { setIsLoggedIn(false); setIsProfileOpen(false); navigate('landing'); showToast('Sesión cerrada'); }} />
            <AuthModal isOpen={isAuthModalOpen} close={() => setIsAuthModalOpen(false)} login={() => { setIsLoggedIn(true); setIsAuthModalOpen(false); showToast('Bienvenido de vuelta'); }} showToast={showToast} />
            <DonationModal isOpen={isDonationOpen} close={() => setIsDonationOpen(false)} isLoggedIn={isLoggedIn} showToast={showToast} />
            <CheckoutAddressModal isOpen={showCheckoutAddressModal} close={() => setShowCheckoutAddressModal(false)} showToast={showToast} />
            <OtpModal isOpen={showOtpModal} close={() => setShowOtpModal(false)} showToast={showToast} />

        </div>
    );
}

// ==========================================
// GLOBAL COMPONENTS & MODALS
// ==========================================

const MobileMenu = ({ isOpen, close, navigate }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] md:hidden flex">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={close}></div>
            <div className="relative w-64 bg-slate-50 h-full border-r border-slate-200 flex flex-col p-6 animate-in slide-in-from-left shadow-2xl">
                <button onClick={close} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
                <div className="flex items-center gap-2 mb-12">
                    <Gamepad2 className="w-6 h-6 text-[#03bbd3]" />
                    <span className="text-xl font-black text-slate-900">Animayuks</span>
                </div>
                <nav className="flex flex-col gap-6 font-bold text-slate-600">
                    <button onClick={() => { navigate('landing'); close(); }} className="text-left flex items-center gap-3 hover:text-[#03bbd3] transition-colors"><Home className="w-5 h-5" /> Inicio</button>
                    <button onClick={() => { navigate('store'); close(); }} className="text-left flex items-center gap-3 hover:text-[#03bbd3] transition-colors"><Package className="w-5 h-5" /> Catálogo</button>
                    <button onClick={() => { navigate('legal'); close(); }} className="text-left flex items-center gap-3 hover:text-[#03bbd3] transition-colors"><FileText className="w-5 h-5" /> Legal</button>
                </nav>
            </div>
        </div>
    );
};

const Footer = ({ navigate, showToast }) => (
    <footer className="relative bg-gradient-to-b from-[#0e160a] to-[#04060b] pt-24 pb-12 overflow-hidden border-t-0 select-none">
        {/* Estilos CSS locales de animaciones y hovers */}
        <style dangerouslySetInnerHTML={{ __html: `
            @keyframes heartbeat {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px #ec1676); }
                50% { transform: scale(1.25); filter: drop-shadow(0 0 7px #ec1676); }
            }
            .heart-pulse {
                animation: heartbeat 1.3s infinite ease-in-out;
            }
            @keyframes button-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .shimmer-anim::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
                animation: button-shimmer 2.2s infinite linear;
            }
            .footer-link {
                transition: all 0.3s ease;
            }
            .footer-link:hover {
                transform: translateX(4px);
                color: #ffce07;
                text-shadow: 0 0 6px rgba(255, 206, 7, 0.5);
            }
            .footer-link-cyan {
                transition: all 0.3s ease;
            }
            .footer-link-cyan:hover {
                transform: translateX(4px);
                color: #03bbd3;
                text-shadow: 0 0 6px rgba(3, 187, 211, 0.5);
            }
        `}} />

        {/* Moldura Metálica Superior con Remaches 3D */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[#251206] z-10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
            {/* Bisel dorado superior */}
            <div 
                className="absolute top-[2px] inset-x-0 h-[6px]" 
                style={{
                    background: 'linear-gradient(90deg, #b38f00 0%, #ffce07 20%, #ffe57f 50%, #ffce07 80%, #b38f00 100%)'
                }}
            />
            {/* Remaches de metal distribuidos */}
            {[10, 30, 50, 70, 90].map((percent, idx) => (
                <div 
                    key={idx} 
                    className="absolute top-[8px] -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center"
                    style={{ left: `${percent}%` }}
                >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-[#7a4a00] via-[#ffc107] to-[#fff8d3] flex items-center justify-center">
                        <div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/>
                    </div>
                </div>
            ))}
        </div>

        {/* Brillos de Fondo sutiles */}
        <div className="absolute top-1/4 left-[-10%] w-[350px] h-[350px] rounded-full blur-[130px] bg-[#96c93e]/5 pointer-events-none" />
        <div className="absolute bottom-1/4 right-[-10%] w-[350px] h-[350px] rounded-full blur-[130px] bg-[#03bbd3]/5 pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative z-20">
            {/* Columna 1: Info de la Marca */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-4xl font-black tracking-widest text-white uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        Animayuks<span className="text-[#96c93e]">.</span>
                    </h2>
                    <p className="text-slate-350 text-[16px] mt-4 leading-relaxed">
                        Trascendemos el E-commerce tradicional. Juega, gana recompensas y viste tu pasión en el mundo real e interactivo.
                    </p>
                </div>
                
                {/* Redes Sociales como Runas Metálicas */}
                <div className="space-y-3">
                    <h4 className="font-black text-white uppercase tracking-widest text-xs opacity-80">
                        Síguenos
                    </h4>
                    <div className="flex gap-4">
                        <a 
                            href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                            className="w-12 h-12 bg-[#150800] border-2 border-[#ffce07]/40 hover:border-[#03bbd3] rounded-full flex items-center justify-center text-[#ffce07] hover:text-white hover:bg-[#03bbd3] hover:shadow-[0_0_15px_rgba(3,187,211,0.6)] hover:scale-110 active:scale-95 transition-all shadow-md"
                        >
                            <Facebook className="w-5.5 h-5.5" />
                        </a>
                        <a 
                            href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                            className="w-12 h-12 bg-[#150800] border-2 border-[#ffce07]/40 hover:border-[#ec1676] rounded-full flex items-center justify-center text-[#ffce07] hover:text-white hover:bg-gradient-to-tr hover:from-[#ffce07] hover:to-[#ec1676] hover:shadow-[0_0_15px_rgba(236,22,118,0.6)] hover:scale-110 active:scale-95 transition-all shadow-md"
                        >
                            <Instagram className="w-5.5 h-5.5" />
                        </a>
                        <a 
                            href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                            className="w-12 h-12 bg-[#150800] border-2 border-[#ffce07]/40 hover:border-[#03bbd3] rounded-full flex items-center justify-center text-[#ffce07] hover:text-white hover:bg-sky-500 hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.6)] hover:scale-110 active:scale-95 transition-all shadow-md"
                        >
                            <Twitter className="w-5.5 h-5.5" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Columna 2: Tienda y Soporte */}
            <div className="space-y-6">
                <h4 className="font-black text-white mb-6 uppercase tracking-widest text-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    Tienda y Soporte
                </h4>
                <ul className="space-y-4 text-[16px] text-slate-300 font-medium">
                    <li onClick={() => navigate('store')} className="footer-link-cyan cursor-pointer flex items-center gap-2">
                        <span className="text-[#03bbd3] text-sm">▶</span> Catálogo
                    </li>
                    <li onClick={() => { navigate('landing'); setTimeout(() => document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="footer-link-cyan cursor-pointer flex items-center gap-2">
                        <span className="text-[#03bbd3] text-sm">▶</span> Quiénes Somos
                    </li>
                    <li className="footer-link-cyan cursor-pointer flex items-center gap-2">
                        <span className="text-[#03bbd3] text-sm">▶</span> Rastrea tu pedido
                    </li>
                    <li className="pt-6 mt-6 border-t border-white/5 space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Soporte</span>
                        <span className="text-white hover:text-[#03bbd3] transition-colors font-black text-base">+52 999 123 4567</span>
                    </li>
                    <li className="space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Directo</span>
                        <span className="text-white hover:text-[#03bbd3] transition-colors font-black text-base font-mono">hola@animayuks.com</span>
                    </li>
                </ul>
            </div>

            {/* Columna 3: Legal */}
            <div className="space-y-6">
                <h4 className="font-black text-white mb-6 uppercase tracking-widest text-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    Legal (Compliance)
                </h4>
                <ul className="space-y-4 text-[16px] text-slate-300 font-medium">
                    <li onClick={() => navigate('legal')} className="footer-link cursor-pointer flex items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Aviso de Privacidad
                    </li>
                    <li onClick={() => navigate('legal')} className="footer-link cursor-pointer flex items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Términos y Condiciones
                    </li>
                    <li onClick={() => navigate('legal')} className="footer-link cursor-pointer flex items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Políticas de Seguridad
                    </li>
                    <li onClick={() => navigate('legal')} className="footer-link cursor-pointer flex items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Términos de Uso del Juego
                    </li>
                </ul>
            </div>

            {/* Columna 4: Formulario de Contacto (Quest Panel) */}
            <div className="space-y-6">
                <div className="relative bg-[#151f12]/50 backdrop-blur-xl border-2 border-[#96c93e]/20 p-8 rounded-[2rem] shadow-2xl w-full overflow-hidden">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#96c93e]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#96c93e]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#96c93e]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#96c93e]" />

                    <h4 className="font-black text-white mb-5 text-lg flex items-center gap-2 tracking-widest uppercase">
                        <Mail className="w-5 h-5 text-[#96c93e] animate-pulse" /> Contáctanos
                    </h4>
                    <form onSubmit={(e) => { e.preventDefault(); showToast('Mensaje enviado. Te contactaremos pronto.', 'success'); }} className="space-y-4">
                        <input 
                            type="text" required minLength="3" placeholder="Tu Nombre" 
                            className="w-full bg-[#0b0f0b]/90 border border-[#96c93e]/30 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#96c93e] focus:shadow-[0_0_10px_rgba(150,201,62,0.2)] transition-all font-medium" 
                        />
                        <input 
                            type="email" required placeholder="Tu Correo" 
                            className="w-full bg-[#0b0f0b]/90 border border-[#96c93e]/30 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#96c93e] focus:shadow-[0_0_10px_rgba(150,201,62,0.2)] transition-all font-medium" 
                        />
                        <textarea 
                            required minLength="10" placeholder="¿En qué te ayudamos?" rows={2} 
                            className="w-full bg-[#0b0f0b]/90 border border-[#96c93e]/30 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none resize-none focus:border-[#96c93e] focus:shadow-[0_0_10px_rgba(150,201,62,0.2)] transition-all font-medium"
                        />
                        <button 
                            type="submit" 
                            className="relative overflow-hidden w-full bg-gradient-to-r from-[#96c93e] to-[#7ab02b] text-slate-900 hover:text-black hover:scale-[1.02] active:scale-[0.98] text-sm font-black py-3.5 rounded-xl transition-all shadow-lg shadow-[#96c93e]/20 tracking-widest uppercase shimmer-anim"
                        >
                            <span>Enviar Mensaje</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-6 lg:px-12 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400 font-medium relative z-20">
            <p>© 2026 Animayuks. Todos los derechos reservados.</p>
            <p className="mt-3 md:mt-0 flex items-center gap-1.5">
                Diseñado con <Heart className="w-3.5 h-3.5 text-[#ec1676] heart-pulse fill-[#ec1676] inline" /> en Mérida, Yucatán.
            </p>
        </div>
    </footer>
);

// --- Auth Modal ---
const AuthModal = ({ isOpen, close, login, showToast }) => {
    const [authTab, setAuthTab] = useState('login');
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const pwdStrength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
                <button onClick={close} className="absolute top-6 right-6 text-slate-500 hover:text-[#03bbd3]"><X className="w-6 h-6" /></button>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-[#03bbd3]/20 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-[#03bbd3]/30"><User className="text-[#03bbd3] w-6 h-6" /></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{authTab === 'login' ? 'Acceder' : authTab === 'register' ? 'Unirse' : 'Recuperar'}</h2>
                </div>

                {authTab === 'login' && (
                    <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-4 animate-in fade-in">
                        <input type="email" placeholder="Correo Electrónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                        <input type="password" placeholder="Contraseña" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />

                        <div className="flex justify-end"><span onClick={() => setAuthTab('recover')} className="text-xs text-emerald-400 hover:underline cursor-pointer">¿Olvidaste tu contraseña?</span></div>

                        <button type="submit" className="w-full bg-[#96c93e] hover:bg-[#85b237] text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform hover:scale-[1.02]">Ingresar</button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">O ingresa con</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        {/* [REQ-FE-07] Botón Nativo Google */}
                        <button type="button" onClick={() => showToast('Redirigiendo a Google OAuth...', 'success')} className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            Continuar con Google
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-4 cursor-pointer hover:text-white" onClick={() => setAuthTab('register')}>¿No tienes cuenta? <span className="font-bold text-[#96c93e]">Regístrate</span></p>
                    </form>
                )}

                {authTab === 'register' && (
                    <form onSubmit={(e) => { e.preventDefault(); showToast('Registro exitoso. Inicia sesión.', 'success'); setAuthTab('login'); }} className="space-y-4 animate-in fade-in h-max max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Nombres" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                            <input type="text" placeholder="Apellidos" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                        </div>

                        <div className="relative">
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo Electrónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                            {email.length > 0 && <CheckCircle2 className={`absolute right-3 top-3 w-5 h-5 ${isEmailValid ? 'text-emerald-500' : 'text-slate-600'}`} />}
                        </div>

                        <input type="tel" placeholder="Número Telefónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />

                        <div>
                            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Contraseña Fuerte" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                            <div className="flex gap-1 mt-2 px-1">
                                <div className={`h-1.5 flex-1 rounded-full ${pwdStrength >= 1 ? (pwdStrength === 1 ? 'bg-red-500' : pwdStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${pwdStrength >= 2 ? (pwdStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${pwdStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                            </div>
                        </div>

                        <input type="password" placeholder="Confirmar Contraseña" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />

                        <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                            <input type="checkbox" required className="mt-1 accent-emerald-500 w-4 h-4 shrink-0" />
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 leading-tight">He leído y acepto el <span className="text-emerald-400 underline">Aviso de Privacidad</span> y los <span className="text-emerald-400 underline">Términos y Condiciones</span> de venta.</span>
                        </label>

                        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 transition-transform hover:scale-[1.02]">Crear Cuenta</button>
                        <p className="text-center text-xs text-slate-500 mt-4 cursor-pointer hover:text-white" onClick={() => setAuthTab('login')}>Ya tengo cuenta. <span className="font-bold text-emerald-400">Ingresar</span></p>
                    </form>
                )}

                {authTab === 'recover' && (
                    <form onSubmit={(e) => { e.preventDefault(); showToast('Enlace de recuperación enviado.', 'success'); setAuthTab('login'); }} className="space-y-4 animate-in fade-in">
                        <p className="text-xs text-slate-400 text-center mb-4">Ingresa tu correo y te enviaremos un enlace temporal seguro.</p>
                        <input type="email" placeholder="Correo Electrónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" />
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg">Enviar Enlace</button>
                        <p className="text-center text-xs text-slate-500 mt-4 cursor-pointer hover:text-white" onClick={() => setAuthTab('login')}>Volver a Iniciar Sesión</p>
                    </form>
                )}
            </div>
        </div>
    );
};

// [REQ-FE-09] Checkout Modal / CP Auto-complete
const CheckoutAddressModal = ({ isOpen, close, showToast }) => {
    const [cp, setCp] = useState('');

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <form onSubmit={(e) => { e.preventDefault(); close(); showToast('Dirección guardada. Procesando pago...', 'success'); }} className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95">
                <button type="button" onClick={close} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                <h2 className="text-xl font-black text-white mb-2">Completa tu Registro</h2>
                <p className="text-xs text-slate-400 mb-6">Un middleware ha detectado tu primera compra. Requerimos tu dirección de entrega por única vez.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Código Postal</label>
                        <input required value={cp} onChange={e => setCp(e.target.value)} type="text" placeholder="Ej. 97000" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado (Auto)</label>
                            <select required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm pointer-events-none opacity-80">
                                {cp === '97000' ? <option value="yuc">Yucatán</option> : <option value="">Esperando CP...</option>}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Municipio (Auto)</label>
                            <select required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm pointer-events-none opacity-80">
                                {cp === '97000' ? <option value="mid">Mérida</option> : <option value="">Esperando CP...</option>}
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dirección Completa</label><input required type="text" placeholder="Calle, Número, Cruzamientos..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Referencias del Domicilio</label><textarea required placeholder="Color de casa, portón, indicaciones al chofer..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none resize-none"></textarea></div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl mt-6 transition-transform hover:scale-[1.02]">Guardar y Continuar al Pago</button>
            </form>
        </div>
    );
};

// [REQ-FE-16] OTP Modal
const OtpModal = ({ isOpen, close, showToast }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center relative">
                <button onClick={close} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                <ShieldAlert className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-white mb-2">Verificación OTP</h2>
                <p className="text-xs text-slate-400 mb-6">Enviamos un código de 6 dígitos a tu correo/SMS para autorizar la modificación de datos de seguridad.</p>
                <div className="flex gap-2 justify-center mb-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <input key={i} type="text" maxLength="1" className="w-10 h-12 bg-slate-900 border border-slate-700 rounded-lg text-center text-white font-black text-xl outline-none focus:border-emerald-500" />)}
                </div>
                <button onClick={() => { close(); showToast('Modificación de datos segura completada', 'success'); }} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl">Verificar y Guardar</button>
            </div>
        </div>
    );
};

// [REQ-FE-27] Donation Modal (Con validación reactiva)
const DonationModal = ({ isOpen, close, isLoggedIn, showToast }) => {
    const [amount, setAmount] = useState(10);
    const [isCustom, setIsCustom] = useState(false);
    const minAmount = 10;

    if (!isOpen) return null;

    // Validación en tiempo real (Reactiva)
    const isValidAmount = amount !== '' && Number(amount) >= minAmount;

    const handleDonate = (e) => {
        e.preventDefault();
        if (!isValidAmount) { showToast(`El monto mínimo permitido es de $${minAmount} MXN`, 'error'); return; }
        close();
        showToast('Redirigiendo a Pasarela Segura de Stripe...', 'success');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0f172a] border border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95">
                <button onClick={close} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-black/20 rounded-full p-1"><X className="w-5 h-5" /></button>
                <div className="h-40 bg-gradient-to-br from-pink-500 to-purple-600 relative flex items-center justify-center overflow-hidden"><HeartHandshake className="w-16 h-16 text-white opacity-80" /></div>
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
                                <input type="email" required placeholder="Tu correo para enviar el recibo" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                            </div>
                        )}
                        <button type="submit" disabled={!isValidAmount} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all">Confirmar Donación Segura</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. DRAWERS (CART & PROFILE QUICK MENU)
// ==========================================

const ProfileDrawer = ({ isOpen, close, navigate, logout }) => {
    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60]" onClick={close}></div>}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[350px] bg-[#0b1121] border-l border-slate-800 z-[70] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-8 border-b border-slate-800 bg-gradient-to-b from-slate-800/50 to-transparent relative">
                    <button onClick={close} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>

                    <div className="flex items-center gap-4 mt-4 relative">
                        <div className="w-16 h-16 bg-slate-800 rounded-full border-2 border-[#96c93e] flex items-center justify-center overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full" /></div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Usuario Activo</h3>
                            <p className="text-xs text-slate-400">usuario@correo.com</p>
                            {/* [ENTERPRISE] Rank Label */}
                            <span className="mt-1 inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/30">
                                Rango Jaguar 🐆
                            </span>
                        </div>
                        <div className="absolute top-0 right-8 bg-red-500 border-2 border-[#0b1121] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">3</div>
                    </div>

                    {/* [ENTERPRISE] Pase de Leyenda XP Bar */}
                    <div className="mt-5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>Pase de Leyenda</span>
                            <span className="text-emerald-400">1200 / 1500 XP</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400" style={{ width: '80%' }}></div>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">300 XP para desbloquear "Rango Kukul" y envíos express gratuitos.</p>
                    </div>

                    <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer group" onClick={() => { navigate('profile'); close(); }}>
                        <div><p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider mb-1">Saldo Monedero</p><p className="text-2xl font-black text-amber-400">$150.00</p></div>
                        <ChevronRight className="w-5 h-5 text-amber-500/50 group-hover:text-amber-400 transform group-hover:translate-x-1 transition-all" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="space-y-1 px-4">
                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"><Package className="w-5 h-5 text-slate-500" /> Mis Pedidos (Timeline)</button>
                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"><Gamepad2 className="w-5 h-5 text-purple-400" /> Recompensas y UUIDs</button>
                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"><Heart className="w-5 h-5 text-pink-500" /> Mis Favoritos</button>
                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"><Settings className="w-5 h-5 text-slate-500" /> Configuración de Cuenta</button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800">
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-400 hover:bg-red-500/10 py-3 rounded-xl transition-colors border border-transparent hover:border-red-500/20"><LogOut className="w-4 h-4" /> Cerrar Sesión</button>
                </div>
            </div>
        </>
    );
};

// ==========================================
// 2. LANDING PAGE VIEW [REQ-FE-01 a 05]
// ==========================================

const LandingView = ({ navigate, setCartTotal, showToast }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const observerRef = useRef(null);
    const videoCarouselRef = useRef(null);
    const [playVideo, setPlayVideo] = useState(false);

    // [NUEVO] Simulación de Banners de Campaña
    const banners = [
        {
            tag: "Lanzamiento Oficial v2.0",
            title: "Viste tu Leyenda. Gana Jugando.",
            desc: "Consigue Skins exclusivas, descuentos reales y envíos gratis al vincular tu progreso del videojuego con nuestra tienda oficial.",
            btnPrimary: "Comprar Físico",
            btnSecondary: "Google Play",
            video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
            color: "from-[#96c93e]/40 via-[#96c93e]/10 to-transparent",
            accent: "#96c93e",
            char: "Balam - El Guardián"
        },
        {
            tag: "Colección Mística",
            title: "Ixchel: Sabiduría en cada Fibra.",
            desc: "Explora la nueva línea de ropa inspirada en la diosa Ixchel. Prendas premium que desbloquean cosméticos legendarios en el campo de batalla.",
            btnPrimary: "Ver Catálogo",
            btnSecondary: "YouTube Trailer",
            video: "https://www.w3schools.com/html/mov_bbb.mp4",
            color: "from-[#ec1676]/30 via-[#ec1676]/10 to-transparent",
            accent: "#ec1676",
            char: "Ixchel - La Tejedora"
        },
        {
            tag: "Torneo Estacional",
            title: "Kukul te desafía al Cenote.",
            desc: "Inscríbete al torneo relámpago de esta semana. Premios en efectivo, UUIDs únicos y el rango 'Jaguar' te esperan.",
            btnPrimary: "Participar",
            btnSecondary: "Ver Reglas",
            video: "https://www.w3schools.com/html/movie.mp4",
            color: "from-[#03bbd3]/30 via-[#03bbd3]/10 to-transparent",
            accent: "#03bbd3",
            char: "Kukul - El Místico"
        }
    ];

    // [NUEVO] Auto-scroll para carrusel de trailers y auto-slide para Hero
    useEffect(() => {
        // Intervalo para Hero Slider
        const heroInterval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % 3);
        }, 8000);

        return () => {
            clearInterval(heroInterval);
        };
    }, [playVideo]);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
        }, { threshold: 0.2 });
        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, []);

    // Función para Quick Navigation (Scroll suave)
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-0">

            {/* Quick Action Navigation */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-200 rounded-full px-2 py-1.5 shadow-xl animate-in slide-in-from-top-8">
                <button onClick={() => scrollToSection('tienda')} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-[#96c93e] hover:bg-[#96c93e]/5 rounded-full transition-colors flex items-center gap-1"><Package className="w-3 h-3" /> Tendencias</button>
                <button onClick={() => scrollToSection('personajes')} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-[#96c93e] hover:bg-[#96c93e]/5 rounded-full transition-colors flex items-center gap-1"><Gamepad2 className="w-3 h-3" /> Personajes</button>
                <button onClick={() => scrollToSection('quienes-somos')} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-[#96c93e] hover:bg-[#96c93e]/5 rounded-full transition-colors flex items-center gap-1"><Navigation className="w-3 h-3" /> Quiénes Somos</button>
            </div>

            <HeroCarousel />

            <TrendingTop navigate={navigate} setCartTotal={setCartTotal} showToast={showToast} />

            <CharacterGrid>
                <AboutExperience navigate={navigate} />
            </CharacterGrid>
        </div>
    );
};

// ==========================================
// 3. STORE CATALOG VIEW [REQ-FE-11 a 13]
// ==========================================

const StoreView = ({ setCartTotal, showToast, navigate }) => {
    return (
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row gap-12 pb-20">
            {/* [REQ-FE-05] Sidebar de Filtros Refinado */}
            <aside className="w-full md:w-64 shrink-0 space-y-8 animate-in slide-in-from-left-4">
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#03bbd3]/5 rounded-full blur-3xl"></div>
                    <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest text-[10px]"><Filter className="w-5 h-5 text-[#03bbd3]" /> Filtros de Catálogo</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase">Categoría</p>
                            <div className="space-y-2">
                                {['Todas', 'Playeras', 'Hoodies', 'Accesorios', 'Digitales'].map(cat => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-[#03bbd3] transition-colors flex items-center justify-center">
                                            <div className="w-2 h-2 bg-[#03bbd3] rounded-sm scale-0 group-hover:scale-100 transition-transform"></div>
                                        </div>
                                        <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors font-medium">{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase">Precio Máx: $800</p>
                            <input type="range" min="0" max="1000" className="w-full accent-[#03bbd3]" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#502c84] to-[#03bbd3] p-6 rounded-3xl text-white shadow-xl">
                    <Zap className="w-8 h-8 mb-4 text-[#ffce07]" />
                    <h4 className="font-black text-lg mb-2">Pase de Temporada</h4>
                    <p className="text-white/70 text-xs leading-relaxed mb-4">Compra productos seleccionados y desbloquea el Pase de Batalla gratis.</p>
                    <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 rounded-xl text-xs font-bold transition-colors">Saber más</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Buscar en el catálogo..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-[#03bbd3] transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">Ordenar:</span>
                        <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer focus:border-[#03bbd3] transition-colors w-full sm:w-auto">
                            <option>Relevancia</option>
                            <option>Precio: Menor a Mayor</option>
                            <option>Precio: Mayor a Menor</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={i} className="group bg-white/70 backdrop-blur-md rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-[#03bbd3] transition-all shadow-xl hover:shadow-[#03bbd3]/20">
                            <div onClick={() => navigate('product', i)} className="relative aspect-[4/5] bg-slate-50 p-6 flex flex-col justify-between overflow-hidden cursor-pointer">
                                <div className="flex justify-between items-start z-10 relative">
                                    {i % 3 === 0 ? <span className="bg-[#96c93e] text-white text-[9px] font-black px-2 py-1 rounded uppercase shadow-lg shadow-[#96c93e]/20">Nuevo</span> : <span className="bg-[#ec1676] text-white text-[9px] font-black px-2 py-1 rounded uppercase shadow-lg shadow-[#ec1676]/20">Trending</span>}
                                    <button className="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-400 hover:text-[#ec1676] hover:bg-white transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); showToast('Añadido a favoritos', 'success'); }}><Heart className="w-4 h-4" /></button>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                    <Package className="w-24 h-24 text-slate-200" />
                                </div>
                                <div className="flex gap-1 z-10">
                                    <span className="bg-white/80 backdrop-blur-sm text-slate-900 text-[9px] font-black px-2 py-1 rounded border border-slate-200">S</span>
                                    <span className="bg-white/80 backdrop-blur-sm text-slate-900 text-[9px] font-black px-2 py-1 rounded border border-slate-200">M</span>
                                    <span className="bg-[#03bbd3] text-white text-[9px] font-black px-2 py-1 rounded border border-[#03bbd3]">L</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Playeras Pro</p>
                                <h3 className="font-bold text-slate-900 group-hover:text-[#03bbd3] transition-colors cursor-pointer" onClick={() => navigate('product', i)}>Animayuk Gear v{i}.0</h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 line-through">$550.00</span>
                                        <span className="text-lg font-black text-slate-900">$450.00</span>
                                    </div>
                                    <button onClick={() => { setCartTotal(prev => prev + 450); showToast('Agregado al carrito', 'success'); }} className="bg-slate-100 hover:bg-[#03bbd3] text-slate-500 hover:text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

// [NUEVO] VISTA INDIVIDUAL DE PRODUCTO + [ENTERPRISE] WebAR & FOMO
const ProductView = ({ productId, navigate, setCartTotal, showToast }) => {
    return (
        <div className="container mx-auto px-6 lg:px-12 pb-20">
            <button onClick={() => navigate('store')} className="flex items-center gap-2 text-slate-500 hover:text-[#03bbd3] font-bold text-sm mb-12 transition-colors group">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Volver al catálogo
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Product Images */}
                <div className="space-y-6">
                    <div className="aspect-square bg-white border border-slate-100 rounded-[3rem] shadow-premium flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50"></div>
                        <Package className="w-48 h-48 text-slate-200 group-hover:scale-110 transition-transform duration-700 z-10" />
                        <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#ec1676] transition-all shadow-md z-20"><Heart className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-[#03bbd3] transition-all shadow-sm">
                                <ImageIcon className="w-6 h-6 text-slate-300" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#03bbd3]/10 text-[#03bbd3] text-[10px] font-bold px-2 py-1 rounded-full border border-[#03bbd3]/20">Best Seller</span>
                            <div className="flex items-center gap-1 text-[#ffce07]">
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-slate-400 text-[10px] ml-1">(120 reseñas)</span>
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">Playera Élite <br />Animayuk Pro v1.0</h1>
                        <p className="text-slate-500 mt-6 leading-relaxed max-w-md">Nuestra prenda insignia. Fabricada con algodón de 240g de alta densidad, bordado táctico y conexión directa con el personaje Balam.</p>
                    </div>

                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Oficial</span>
                            <span className="text-3xl font-black text-slate-900">$450.00 <span className="text-sm text-[#96c93e] ml-2">IVA Incluido</span></span>
                        </div>
                        <div className="h-10 w-px bg-slate-200"></div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#502c84] flex items-center gap-1 uppercase tracking-tighter"><Zap className="w-3 h-3" /> Recompensas</span>
                            <span className="text-sm font-black text-slate-600">+150 XP</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Seleccionar Talla</p>
                            <div className="flex gap-3">
                                {['S', 'M', 'L', 'XL'].map(size => (
                                    <button key={size} className={`w-14 h-14 rounded-2xl border-2 font-black transition-all flex items-center justify-center ${size === 'L' ? 'border-[#03bbd3] bg-[#03bbd3] text-white shadow-lg shadow-[#03bbd3]/20' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-900'}`}>{size}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => { setCartTotal(prev => prev + 450); showToast('Agregado con éxito', 'success'); }} className="flex-1 bg-[#03bbd3] hover:bg-[#02a8be] text-white font-black py-4 rounded-2xl shadow-brand transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Agregar al Carrito
                        </button>
                        <button className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#ec1676] hover:border-[#ec1676]/20 transition-all shadow-sm"><Share2 className="w-6 h-6" /></button>
                    </div>

                    <div className="pt-8 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white border border-slate-100 p-4 rounded-2xl shadow-premium"><ShieldCheck className="w-5 h-5 text-[#96c93e]" /> Garantía de Calidad</div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white border border-slate-100 p-4 rounded-2xl shadow-premium"><Zap className="w-5 h-5 text-[#ffce07]" /> Envío Express</div>
                    </div>
                </div>
            </div>

            {/* Tabs for Info */}
            <div className="mt-24">
                <div className="flex gap-12 border-b border-slate-200 mb-12">
                    {['Descripción', 'Especificaciones', 'Reseñas', 'Skins Asociadas'].map((tab, i) => (
                        <button key={tab} className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${i === 0 ? 'text-[#03bbd3]' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab}
                            {i === 0 && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full"></div>}
                        </button>
                    ))}
                </div>
                <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-premium">
                    <p className="text-slate-500 leading-relaxed text-lg italic">"Esta prenda no solo es una declaración de estilo, es la llave a un mundo donde lo físico y lo digital colisionan. Cada hilo ha sido pensado para el jugador de alto rendimiento."</p>
                </div>
            </div>
        </div>
    );
};

const ProfileDashboard = ({ showToast, setShowOtpModal, navigate }) => {
    const [activeTab, setActiveTab] = useState('orders');

    // States for interactive panels
    const [orderSubTab, setOrderSubTab] = useState('active');
    const [viewingOrder, setViewingOrder] = useState(null);
    const [isOrderForaneo, setIsOrderForaneo] = useState(false);
    const [showAddCard, setShowAddCard] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);

    // Seguridad Form States
    const [pwd, setPwd] = useState('');
    const pwdStrength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;
    const [profileEmail, setProfileEmail] = useState('roberto.g@gmail.com');
    const isProfileEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail);

    const tabs = [
        { id: 'orders', label: 'Historial Pedidos', icon: Package },
        { id: 'rewards', label: 'Recompensas (Juego)', icon: Gamepad2, color: 'text-[#502c84]' },
        { id: 'wallet', label: 'Monedero y Donaciones', icon: CreditCard, color: 'text-[#ffce07]' },
        { id: 'coupons', label: 'Cupones Promo', icon: Ticket },
        { id: 'wishlist', label: 'Wishlist', icon: Heart, color: 'text-[#ec1676]' },
        { id: 'notifications', label: 'Notificaciones', icon: Bell, badge: true },
        { id: 'addresses', label: 'Libreta Direcciones', icon: MapPin },
        { id: 'payments', label: 'Métodos de Pago', icon: CreditCard },
        { id: 'settings', label: 'Seguridad (Perfil)', icon: Settings },
    ];

    return (
        <div className="container mx-auto px-6 lg:px-12 flex flex-col">
            {/* Botón de Retroceso Global del Perfil */}
            <div className="mb-6">
                <button onClick={() => navigate('landing')} className="bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors border border-slate-100 shadow-sm w-max">
                    <ArrowLeft className="w-4 h-4 text-[#03bbd3]" /> Volver al Inicio
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Nav */}
                <aside className="w-full md:w-64 shrink-0">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Mi Perfil</h2>

                    {/* [ENTERPRISE] Pase de Leyenda XP Bar */}
                    <div className="mb-6 bg-white border border-slate-100 p-5 rounded-3xl shadow-premium">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase text-[#ffce07] tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> Rango Jaguar</span>
                            <span className="text-[10px] font-bold text-slate-400">1200 / 1500 XP</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#96c93e] to-[#ffce07]" style={{ width: '80%' }}></div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map(t => (
                            <button
                                key={t.id} onClick={() => { setActiveTab(t.id); setViewingOrder(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-[#03bbd3] text-white shadow-lg shadow-[#03bbd3]/20 border-transparent' : 'text-slate-500 hover:bg-white hover:shadow-premium'}`}
                            >
                                <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-white' : (t.color || 'text-slate-400')}`} />
                                {t.label}
                                {t.badge && <span className="ml-auto bg-[#ec1676] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">3</span>}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 bg-slate-50/80 border border-white rounded-[2.5rem] shadow-premium p-8 lg:p-12 backdrop-blur-md">

                    {/* TAB 1: PEDIDOS (Lista -> Detalle) [REQ-FE-23] */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="flex gap-6 border-b border-slate-100 pb-4">
                                <button onClick={() => { setOrderSubTab('active'); setViewingOrder(null); }} className={`font-bold pb-4 transition-colors relative ${orderSubTab === 'active' ? 'text-[#03bbd3]' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Pedidos Activos (1)
                                    {orderSubTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full"></div>}
                                </button>
                                <button onClick={() => { setOrderSubTab('history'); setViewingOrder(null); }} className={`font-bold pb-4 transition-colors relative ${orderSubTab === 'history' ? 'text-[#03bbd3]' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Historial Finalizados
                                    {orderSubTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full"></div>}
                                </button>
                            </div>

                            {orderSubTab === 'active' ? (
                                !viewingOrder ? (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="bg-slate-50 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 hover:border-[#03bbd3]/30 cursor-pointer transition-all hover:shadow-sm" onClick={() => setViewingOrder({ id: 'ORD-8821', state: 1 })}>
                                            <div className="flex gap-5 items-center">
                                                <div className="flex -space-x-4">
                                                    <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center relative z-10"><Package className="w-7 h-7 text-[#03bbd3]" /></div>
                                                    <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center relative z-0"><Gamepad2 className="w-7 h-7 text-[#502c84]" /></div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg">#ORD-8821</p>
                                                    <p className="text-xs text-slate-500 font-medium">08 Mayo 2026 • 2 artículos</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0 sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                                                <p className="font-black text-slate-900 text-xl">$900.00</p>
                                                <span className="text-[10px] bg-[#ffce07]/10 text-[#ffce07] px-3 py-1 rounded-full font-black border border-[#ffce07]/20 uppercase">Pago Confirmado</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-right-8">
                                        <button onClick={() => setViewingOrder(null)} className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-2 mb-8 transition-colors"><ArrowLeft className="w-4 h-4" /> Volver a mis pedidos</button>

                                        <div className="flex flex-wrap gap-2 mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-max items-center shadow-sm">
                                            <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">Estatus:</span>
                                            {[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setViewingOrder({ ...viewingOrder, state: s })} className={`w-8 h-8 rounded-xl font-black text-xs transition-all ${viewingOrder.state === s ? 'bg-[#96c93e] text-white shadow-lg shadow-[#96c93e]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}>{s}</button>)}
                                            <div className="w-px h-6 bg-slate-200 mx-2"></div>
                                            <label className="text-[10px] text-slate-600 font-bold flex items-center gap-2 cursor-pointer px-2"><input type="checkbox" checked={isOrderForaneo} onChange={() => setIsOrderForaneo(!isOrderForaneo)} className="accent-[#03bbd3]" /> Foráneo</label>
                                        </div>

                                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-premium flex flex-col md:flex-row gap-12 relative overflow-hidden">
                                            <div className="w-full md:w-2/5 md:border-r border-slate-100 md:pr-10">
                                                <div className="relative flex flex-col gap-10">
                                                    <div className="absolute top-0 left-6 w-1 h-full bg-slate-50 z-0 rounded-full"></div>
                                                    <div className="absolute top-0 left-6 w-1 bg-[#96c93e] z-0 transition-all duration-700 rounded-full" style={{ height: `${(viewingOrder.state - 1) * 25}%` }}></div>

                                                    {[
                                                        { step: 1, label: 'Pago Confirmado', icon: CreditCard, desc: 'Recibimos tu pago exitosamente.' },
                                                        { step: 2, label: 'Empaquetando', icon: Box, desc: 'Preparando tus artículos en bodega.' },
                                                        { step: 3, label: 'En Camino', icon: Truck, desc: 'El paquete salió de la bodega.' },
                                                        { step: 4, label: 'En Reparto', icon: MapPin, desc: isOrderForaneo ? 'El transportista está en tu ciudad.' : '¡Llega hoy a tu domicilio!' },
                                                        { step: 5, label: 'Entregado', icon: CheckCircle2, desc: 'Paquete en tus manos.' }
                                                    ].map((s, i) => {
                                                        const isDone = viewingOrder.state >= s.step;
                                                        const isActive = viewingOrder.state === s.step;
                                                        return (
                                                            <div key={i} className="relative z-10 flex gap-5 items-start">
                                                                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-[#ffce07] border-[#ffce07] text-white shadow-lg shadow-[#ffce07]/20 scale-110' : isDone ? 'bg-[#96c93e] border-[#96c93e] text-white shadow-md' : 'bg-white border-slate-100 text-slate-300'}`}>
                                                                    <s.icon className="w-5 h-5" />
                                                                </div>
                                                                <div className="pt-2">
                                                                    <span className={`text-sm font-black uppercase tracking-tight ${isActive ? 'text-[#ffce07]' : isDone ? 'text-[#96c93e]' : 'text-slate-400'}`}>{s.label}</span>
                                                                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">{s.desc}</p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-3/5 flex flex-col justify-between space-y-8">
                                                <div>
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-2xl uppercase tracking-tighter">Pedido {viewingOrder.id}</h3>
                                                            <p className="text-xs text-slate-400 font-bold mt-1">Generado: 08 Mayo 2026</p>
                                                        </div>
                                                        {viewingOrder.state === 1 ? (
                                                            <button onClick={() => { showToast('Cancelación procesada. Dinero en Monedero.', 'success'); setViewingOrder(null); }} className="bg-[#ec1676] hover:bg-[#d01467] text-white text-[10px] font-black px-5 py-3 rounded-xl shadow-lg shadow-[#ec1676]/20 transition-all uppercase tracking-widest">Cancelar</button>
                                                        ) : viewingOrder.state === 5 ? (
                                                            <button onClick={() => showToast('Descargando PDF de Factura...', 'success')} className="bg-slate-50 text-[#03bbd3] text-[10px] font-black px-5 py-3 rounded-xl border border-slate-100 hover:border-[#03bbd3] transition-all flex items-center gap-2 uppercase tracking-widest"><FileText className="w-4 h-4" /> Factura CFDI</button>
                                                        ) : (
                                                            <span className="bg-[#ffce07]/10 text-[#ffce07] text-[10px] font-black px-4 py-2 rounded-full border border-[#ffce07]/20 uppercase tracking-widest">En Proceso</span>
                                                        )}
                                                    </div>

                                                    {viewingOrder.state === 4 && (
                                                        <div className="mb-8 bg-slate-50 p-6 rounded-3xl border border-[#03bbd3]/20 shadow-sm relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#03bbd3]/5 rounded-bl-full"></div>
                                                            {isOrderForaneo ? (
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div>
                                                                        <p className="text-[10px] text-[#03bbd3] font-black uppercase tracking-widest">Paquetería Externa</p>
                                                                        <p className="font-black text-slate-900 text-lg">FedEx Priority</p>
                                                                        <p className="text-[11px] text-slate-500 mt-1 font-mono">Guía: 7788994455</p>
                                                                    </div>
                                                                    <button className="bg-[#03bbd3] text-white text-xs font-black px-6 py-3 rounded-xl shadow-lg shadow-[#03bbd3]/20 flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"><Search className="w-4 h-4" /> Rastrear</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm"><User className="text-[#03bbd3] w-8 h-8" /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-[#03bbd3] font-black uppercase tracking-widest">Repartidor Local</p>
                                                                            <p className="font-black text-slate-900 text-lg">Miguel Ángel</p>
                                                                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Moto 1 • Placas: YUC-998</p>
                                                                        </div>
                                                                    </div>
                                                                    <button className="bg-white text-slate-600 text-xs font-black px-6 py-3 rounded-xl border border-slate-200 hover:border-[#03bbd3] hover:text-[#03bbd3] transition-all shadow-sm">Llamar</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-5 mt-auto group hover:border-[#03bbd3]/30 transition-colors">
                                                    <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform"><Package className="text-[#03bbd3] w-8 h-8" /></div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-base uppercase tracking-tight">Playera Élite Neón</p>
                                                        <p className="text-xs text-slate-500 font-bold">x1 • Talla M • SKU: AMY-7788</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="bg-white p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 shadow-sm hover:border-[#96c93e]/30 transition-all">
                                        <div className="flex gap-5 items-center">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center grayscale"><Package className="w-7 h-7 text-slate-400" /></div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg">#ORD-7712</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">14 Feb 2026 • 1 artículo</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                                            <p className="font-black text-slate-900 text-xl">$450.00</p>
                                            <span className="text-[10px] bg-[#96c93e]/10 text-[#96c93e] px-4 py-1.5 rounded-full font-black border border-[#96c93e]/20 flex items-center gap-2 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Entregado</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 shadow-sm hover:border-[#96c93e]/30 transition-all">
                                        <div className="flex gap-5 items-center">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center grayscale"><Gamepad2 className="w-7 h-7 text-slate-400" /></div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg">#ORD-7600</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">02 Ene 2026 • Recompensa</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                                            <p className="font-black text-slate-900 text-xl">$0.00</p>
                                            <span className="text-[10px] bg-[#96c93e]/10 text-[#96c93e] px-4 py-1.5 rounded-full font-black border border-[#96c93e]/20 flex items-center gap-2 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Entregado</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: GAME BRIDGE RECOMPENSAS [REQ-FE-22] */}
                    {activeTab === 'rewards' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Inventario In-Game</h2>
                                    <p className="text-sm text-slate-500 font-medium">Recompensas desbloqueadas por tus compras físicas.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="group relative h-[280px] w-full [perspective:1000px]">
                                    <div className="absolute inset-0 bg-white border-2 border-[#502c84]/20 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-premium transition-all duration-500 hover:border-[#502c84] overflow-hidden">
                                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#502c84]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                                        <div>
                                            <span className="bg-[#96c93e]/10 text-[#96c93e] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-[#96c93e]/20 mb-4 inline-flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#96c93e] rounded-full animate-pulse"></div> Disponible</span>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Skin: Jaguar Dorado</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-DB Link Sincronizado</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between relative z-10 shadow-inner">
                                            <code className="text-sm text-[#502c84] font-black font-mono pl-2 tracking-widest">AX-992B-KM88</code>
                                            <button onClick={() => showToast('Copiado con éxito', 'success')} className="bg-[#502c84] hover:bg-[#3d2165] text-white p-3 rounded-xl transition-all shadow-lg shadow-[#502c84]/20 active:scale-95"><Copy className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative h-[280px] w-full grayscale opacity-60">
                                    <div className="absolute inset-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                        <div>
                                            <span className="bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block tracking-widest">Canjeado</span>
                                            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">100 Monedas</h3>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <code className="text-sm text-slate-300 font-black font-mono pl-2">USD-11A-00P</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: MONEDERO Y DONACIONES [REQ-FE-20] */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4">
                            <div className="bg-gradient-to-br from-[#ffce07] to-[#e6b800] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-[#ffce07]/20 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="relative z-10">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-3 opacity-70">Saldo Disponible</p>
                                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter">$150.<span className="text-3xl opacity-60">00</span> MXN</h2>
                                    <p className="text-[11px] text-slate-900 font-bold mt-4 flex items-center gap-2 bg-white/20 w-max px-3 py-1.5 rounded-full"><ShieldAlert className="w-3.5 h-3.5" /> Saldo expira en 12 meses</p>
                                </div>
                                <div className="relative z-10 bg-white/20 p-6 rounded-[2rem] backdrop-blur-md border border-white/30">
                                    <CreditCard className="w-12 h-12 text-slate-900 opacity-80" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#ffce07] rounded-full"></div>
                                    Movimientos del Ledger
                                </h3>
                                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-premium">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-slate-400"><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Fecha / Folio</th><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Concepto</th><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Monto</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr className="hover:bg-slate-50 transition-colors"><td className="px-8 py-6 text-slate-500 font-medium">12 May 26 <span className="text-[10px] font-mono block text-slate-300">REF-992</span></td><td className="px-8 py-6 text-slate-900 font-black">Reembolso Pedido Cancelado</td><td className="px-8 py-6 text-right font-black text-[#96c93e]">+$150.00</td></tr>
                                            <tr className="hover:bg-slate-50 transition-colors"><td className="px-8 py-6 text-slate-500 font-medium">10 May 26 <span className="text-[10px] font-mono block text-slate-300">ORD-8810</span></td><td className="px-8 py-6 text-slate-900 font-black">Aplicado a Compra</td><td className="px-8 py-6 text-right font-black text-[#ec1676]">-$50.00</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#ec1676] rounded-full"></div>
                                    Mis Aportaciones Sociales
                                </h3>
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center justify-between shadow-inner">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm"><HeartHandshake className="w-8 h-8 text-[#ec1676]" /></div>
                                        <div><p className="font-black text-slate-900 uppercase tracking-tight">Fondo de Reforestación</p><p className="text-xs text-slate-500 font-bold">01 Mayo 2026</p></div>
                                    </div>
                                    <p className="text-2xl font-black text-[#ec1676]">$30.00</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: CUPONES FOMO [REQ-FE-21] */}
                    {activeTab === 'coupons' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl flex shadow-inner group focus-within:border-[#03bbd3] transition-all">
                                <input type="text" placeholder="Ingresa tu código promocional..." className="flex-1 bg-transparent px-5 text-slate-900 outline-none font-black font-mono uppercase placeholder:text-slate-300" />
                                <button onClick={() => showToast('Código inválido', 'warning')} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#03bbd3]/20 transition-all">Canjear</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
                                <div className="bg-white border-2 border-[#96c93e]/30 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-[#96c93e] transition-all shadow-premium">
                                    <div className="absolute top-0 right-0 bg-[#96c93e] text-white text-[11px] font-black uppercase px-6 py-2 rounded-bl-2xl shadow-md">15% OFF</div>
                                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#96c93e]/5 rounded-full blur-2xl"></div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-2 mt-4 tracking-tighter">VERANO26</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Válido en toda la tienda</p>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center shadow-inner">
                                        <p className="text-xs font-black text-[#ec1676] flex items-center justify-center gap-2 animate-pulse uppercase tracking-widest"><Clock className="w-4 h-4" /> Expira en: <span className="font-mono text-base">02:44:59</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: WISHLIST FAVORITOS [REQ-FE-19] */}
                    {activeTab === 'wishlist' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mis Favoritos</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center hover:border-[#ec1676]/40 transition-all relative overflow-hidden group shadow-premium hover:shadow-xl">
                                    <button onClick={() => showToast('Eliminado', 'success')} className="absolute top-6 right-6 z-10 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#ec1676] hover:bg-white transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                                    <div className="w-28 h-28 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Package className="w-12 h-12 text-slate-300" /></div>
                                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight text-center">Playera Élite</h3>
                                    <button className="w-full bg-[#03bbd3] hover:bg-[#02a8be] text-white font-black py-4 rounded-2xl mt-6 transition-all shadow-lg shadow-[#03bbd3]/20 uppercase tracking-widest text-[10px]">Al Carrito</button>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center opacity-60 grayscale relative group">
                                    <span className="absolute top-6 left-6 bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-white">Agotado</span>
                                    <button onClick={() => showToast('Eliminado', 'success')} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-[#ec1676] transition-all"><Trash2 className="w-5 h-5" /></button>
                                    <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mb-6"><Package className="w-12 h-12 text-slate-200" /></div>
                                    <h3 className="font-black text-slate-400 text-lg uppercase tracking-tight text-center">Gorra Minimal</h3>
                                    <button disabled className="w-full bg-slate-200 text-slate-400 font-black py-4 rounded-2xl mt-6 cursor-not-allowed uppercase tracking-widest text-[10px]">Sin Stock</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: NOTIFICACIONES IN-APP [REQ-FE-24] */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Notificaciones</h2>
                                <button onClick={() => showToast('Hecho', 'success')} className="text-[10px] font-black text-[#03bbd3] hover:text-[#02a8be] uppercase tracking-widest border-b-2 border-[#03bbd3]/30 pb-1 transition-all">Limpiar Bandeja</button>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-premium">
                                <div className="p-6 border-b border-slate-50 bg-[#ec1676]/5 flex gap-6 cursor-pointer hover:bg-white transition-all group">
                                    <div className="w-3 h-3 rounded-full bg-[#ec1676] mt-2 shrink-0 shadow-[0_0_10px_rgba(236,22,118,0.4)] animate-pulse"></div>
                                    <div className="flex-1">
                                        <p className="text-base font-black text-slate-900 leading-tight">Tu pedido #ORD-8821 ha cambiado a "En Reparto"</p>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">El repartidor Miguel se dirige a tu domicilio. Ten tu identificación lista.</p>
                                        <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Hace 2 minutos</p>
                                    </div>
                                    <button className="text-slate-300 hover:text-[#ec1676] transition-colors self-start"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 7: DIRECCIONES [REQ-FE-17] */}
                    {activeTab === 'addresses' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mis Direcciones</h2><button onClick={() => setShowAddAddress(!showAddAddress)} className="bg-[#96c93e]/10 text-[#96c93e] text-xs font-black px-5 py-3 rounded-xl border border-[#96c93e]/20 flex items-center gap-2 hover:bg-[#96c93e] hover:text-white transition-all uppercase tracking-widest"><Plus className="w-4 h-4" /> Agregar</button></div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                                <div className="bg-white border-2 border-[#96c93e]/30 rounded-[2.5rem] p-8 relative group hover:border-[#96c93e] transition-all shadow-premium">
                                    <span className="absolute top-6 right-6 bg-[#96c93e] text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">Principal</span>
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><MapPin className="w-7 h-7 text-[#96c93e]" /></div>
                                    <p className="font-black text-slate-900 text-xl uppercase tracking-tight">Casa Centro</p>
                                    <p className="text-sm text-slate-500 mt-3 leading-relaxed font-medium">Calle 60 #123 x 45 y 47<br />Mérida, Yucatán. CP 97000</p>
                                    <div className="absolute bottom-6 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-[#03bbd3] hover:bg-white shadow-sm transition-all border border-slate-100"><Settings className="w-5 h-5" /></button>
                                        <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-[#ec1676] hover:bg-white shadow-sm transition-all border border-slate-100"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>

                            {showAddAddress && (
                                <div className="bg-slate-50 border border-slate-100 p-10 rounded-[2.5rem] max-w-lg animate-in zoom-in-95 duration-300 shadow-premium relative">
                                    <button onClick={() => setShowAddAddress(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
                                    <h3 className="font-black text-slate-900 text-2xl mb-8 uppercase tracking-tighter">Nueva Dirección</h3>
                                    <form onSubmit={(e) => { e.preventDefault(); showToast('Dirección Guardada', 'success'); setShowAddAddress(false); }} className="space-y-6">
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Postal</label><input type="text" placeholder="Ej. 97000" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label><input disabled placeholder="Yucatán" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-400 font-bold" /></div>
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciudad</label><input disabled placeholder="Mérida" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-400 font-bold" /></div>
                                        </div>
                                        <button type="submit" className="bg-[#03bbd3] text-white w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#03bbd3]/20 hover:bg-[#02a8be] transition-all transform hover:scale-[1.02]">Guardar Dirección</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 8: MÉTODOS DE PAGO PCI [REQ-FE-18] */}
                    {activeTab === 'payments' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Métodos de Pago</h2><button onClick={() => setShowAddCard(!showAddCard)} className="bg-[#03bbd3]/10 text-[#03bbd3] text-xs font-black px-5 py-3 rounded-xl border border-[#03bbd3]/20 flex items-center gap-2 hover:bg-[#03bbd3] hover:text-white transition-all uppercase tracking-widest"><Plus className="w-4 h-4" /> Agregar</button></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 relative group shadow-xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                                    <button onClick={() => showToast('Tarjeta Eliminada', 'success')} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                                    <div className="w-12 h-8 bg-white/20 rounded-md mb-8"></div>
                                    <p className="text-xl font-mono text-white tracking-[0.2em] mb-8">•••• •••• •••• 4567</p>
                                    <div className="flex justify-between items-end"><div className="space-y-1"><p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Expira</p><p className="text-sm font-black text-white">12 / 28</p></div><p className="font-black text-white italic text-xl tracking-tighter">VISA</p></div>
                                </div>
                                <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 relative group shadow-premium opacity-60">
                                    <div className="flex justify-between items-start mb-10"><span className="bg-[#ec1676] text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Expirada</span><button onClick={() => showToast('Tarjeta Eliminada', 'success')} className="text-slate-300 hover:text-[#ec1676] transition-colors"><Trash2 className="w-5 h-5" /></button></div>
                                    <p className="text-xl font-mono text-slate-300 tracking-[0.2em] mb-8">•••• •••• •••• 9012</p>
                                    <div className="flex justify-between items-end"><div className="space-y-1"><p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Expira</p><p className="text-sm font-black text-slate-400">01 / 24</p></div><p className="font-black text-slate-300 italic text-xl tracking-tighter">MASTER</p></div>
                                </div>
                            </div>

                            {showAddCard && (
                                <div className="bg-slate-50 border border-slate-100 p-10 rounded-[2.5rem] max-w-sm animate-in zoom-in-95 duration-300 shadow-premium relative mt-12">
                                    <button onClick={() => setShowAddCard(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
                                    <h3 className="font-black text-slate-900 text-2xl mb-8 uppercase tracking-tighter">Nueva Tarjeta</h3>
                                    <form onSubmit={(e) => { e.preventDefault(); showToast('Tarjeta Tokenizada Segura (Stripe)', 'success'); setShowAddCard(false); }} className="space-y-5">
                                        <input type="text" required placeholder="Titular de la Tarjeta" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black uppercase tracking-tight" />
                                        <input type="text" required placeholder="•••• •••• •••• ••••" maxLength="16" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-mono text-lg font-bold" />
                                        <div className="grid grid-cols-2 gap-5">
                                            <input type="text" required placeholder="MM/YY" maxLength="5" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black text-center" />
                                            <input type="password" required placeholder="CVC" maxLength="4" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black text-center" />
                                        </div>
                                        <button type="submit" className="bg-[#03bbd3] text-white w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#03bbd3]/20 hover:bg-[#02a8be] transition-all mt-4 transform hover:scale-[1.02]">Guardar Tarjeta</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 9: SETTINGS & OTP [REQ-FE-16] */}
                    {activeTab === 'settings' && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4 max-w-2xl">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Seguridad y Perfil</h2>

                            <form onSubmit={(e) => { e.preventDefault(); setShowOtpModal(true); }} className="space-y-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
                                    <h3 className="font-black text-slate-900 border-b border-slate-100 pb-5 mb-8 uppercase tracking-widest text-xs flex items-center gap-3"><div className="w-2 h-4 bg-[#03bbd3] rounded-full"></div> Información Básica</h3>
                                    <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label><input type="text" defaultValue="Roberto Gómez" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner font-black" /></div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo de Contacto <span className="text-[#ec1676]">(Requiere OTP)</span></label>
                                        <div className="relative">
                                            <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-slate-900 outline-none transition-all shadow-inner font-black ${isProfileEmailValid ? 'border-slate-100 focus:border-[#96c93e]' : 'border-red-100 focus:border-[#ec1676]'}`} />
                                            <CheckCircle2 className={`absolute right-5 top-4.5 w-6 h-6 transition-colors ${isProfileEmailValid ? 'text-[#96c93e]' : 'text-slate-200'}`} />
                                        </div>
                                    </div>

                                    <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp / SMS</label><input type="tel" defaultValue="9991234567" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner font-black" /></div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
                                    <h3 className="font-black text-slate-900 border-b border-slate-100 pb-5 mb-8 uppercase tracking-widest text-xs flex items-center gap-3"><div className="w-2 h-4 bg-[#ffce07] rounded-full"></div> Gestión de Acceso</h3>
                                    <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password Actual</label><input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner" /></div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nuevo Password</label>
                                        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner" />
                                        <div className="flex gap-1.5 mt-4 px-2">
                                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${pwdStrength >= 1 ? (pwdStrength === 1 ? 'bg-[#ec1676]' : pwdStrength === 2 ? 'bg-[#ffce07]' : 'bg-[#96c93e]') : 'bg-slate-100'}`}></div>
                                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${pwdStrength >= 2 ? (pwdStrength === 2 ? 'bg-[#ffce07]' : 'bg-[#96c93e]') : 'bg-slate-100'}`}></div>
                                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${pwdStrength >= 3 ? 'bg-[#96c93e]' : 'bg-slate-100'}`}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-[#96c93e] hover:bg-[#85b237] text-white font-black px-8 py-5 rounded-2xl transition-all shadow-lg shadow-[#96c93e]/20 uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-95">Actualizar Perfil de Jugador</button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};



// ==========================================
// LEGAL VIEW SPA
// ==========================================

const LegalView = ({ navigate }) => {
    return (
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl pt-8 pb-20">
            {/* Botón de Retroceso Premium */}
            <div className="mb-10">
                <button
                    onClick={() => navigate('landing')}
                    className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all font-bold"
                >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                        <ArrowLeft className="w-5 h-5 text-[#03bbd3]" />
                    </div>
                    <span>Volver al Inicio</span>
                </button>
            </div>

            <div className="bg-slate-50/80 border border-white rounded-[2.5rem] p-10 md:p-16 shadow-premium relative overflow-hidden backdrop-blur-sm">
                {/* Elementos Decorativos de Marca */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#03bbd3]/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>

                <header className="relative mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldAlert className="w-6 h-6 text-[#03bbd3]" />
                        <span className="text-[10px] font-black text-[#03bbd3] uppercase tracking-[0.3em]">Compliance & Safety</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">Políticas y Términos Legales</h1>
                    <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <span>Última actualización: 27 de Mayo de 2026</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span className="text-[#03bbd3]">Versión v1.3</span>
                    </div>
                </header>

                <div className="space-y-12 relative">
                    <section className="group">
                        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#03bbd3] rounded-full group-hover:scale-y-125 transition-transform"></div>
                            1. Aviso de Privacidad
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            De conformidad con lo establecido en la <span className="font-bold text-slate-900">Ley Federal de Protección de Datos Personales</span>, Animayuks informa que los datos recabados en nuestra plataforma web y aplicación móvil serán utilizados de manera confidencial exclusivamente para procesar sus pedidos, personalizar su experiencia de juego y sincronizar sus recompensas Jaguar XP.
                        </p>
                    </section>

                    <section className="group">
                        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#ec1676] rounded-full group-hover:scale-y-125 transition-transform"></div>
                            2. Políticas de Reembolso
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Todo reembolso solicitado por el usuario dentro del periodo válido generará saldo en el <span className="font-bold text-[#ec1676]">Monedero Virtual</span> de la plataforma. Para devoluciones directas a la tarjeta de crédito o débito, el cliente deberá iniciar un proceso de reclamación que puede tomar hasta 15 días hábiles, sujeto a las políticas de la pasarela de pago.
                        </p>
                    </section>

                    <section className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] relative group hover:border-[#03bbd3]/30 transition-colors">
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                                <CheckSquare className="w-6 h-6 text-[#96c93e]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
                                    Aceptación del Usuario
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Al registrar una cuenta y marcar la casilla de verificación correspondiente durante el Checkout, usted certifica haber leído y aceptado este documento íntegro. El sistema registrará su dirección IP y Timestamp para auditorías de seguridad, prevención de fraude y cumplimiento de normativas PCI-DSS.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Animayuks Legal Department</p>
                    <button onClick={() => window.print()} className="text-[10px] font-black text-[#03bbd3] hover:text-[#502c84] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                        <FileText className="w-4 h-4" /> Descargar Versión PDF
                    </button>
                </footer>
            </div>
        </div>
    );
};