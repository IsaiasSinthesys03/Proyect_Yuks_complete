import React, { useState, useEffect, useRef } from 'react';
import {
    ShoppingCart, User, Menu, X, ChevronRight, ChevronLeft, Heart, Play,
    Search, Filter, ChevronDown, Package, MapPin,
    Ticket, Gamepad2, Copy, CheckCircle2, Truck, Box,
    Home, LogOut, HeartHandshake, Mail, Lock, ShieldAlert,
    AlertTriangle, Settings, Image as ImageIcon, Clock,
    Smartphone, FileText, CheckSquare, Youtube, Cat, Coins,
    Facebook, Instagram, Twitter, Eye, EyeOff, Trash2, ArrowLeft, Plus, Loader2,
    Sparkles, Terminal, Eye as ViewIcon, Zap, Navigation, Star, Share2, ShieldCheck, Wallet, HeadphonesIcon
} from 'lucide-react';
import { useProfile } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';
import { tierDisplay, tierProgress } from '../../lib/gamification';

export const ProfileDrawer = ({ isOpen, close, onClose, navigate, logout, onLogout }) => {
    const handleClose = close || onClose;
    const handleLogout = logout || onLogout;
    // 1. Obtener datos rápidos de autenticación para que no diga "Cargando..."
    const authUser = useAuthStore((s) => s.user);

    // 2. Obtener datos completos de la API de perfil
    const { data: me } = useProfile(isOpen);

    const profile = me?.profile;
    const wallet = me?.wallet;

    // Si tenemos datos del perfil, usamos firstName/lastName. Si no, usamos el name de authUser (o email)
    let displayName = profile ? `${profile.firstName} ${profile.lastName}` : (authUser?.name ?? authUser?.firstName ?? '');
    if (!displayName || displayName.trim() === 'undefined') {
        displayName = authUser?.email?.split('@')[0] || 'Usuario Mágico';
    }
    const displayEmail = me?.user?.email ?? authUser?.email ?? '';

    // Datos de gamificación (rango)
    const tier = tierDisplay(profile?.tierLevel);
    const progress = tierProgress(profile?.experiencePoints, profile?.tierLevel, me?.gamification);

    return (
        <>
            {/* Fondo opaco oscuro para desenfocar lo de atrás */}
            {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" onClick={handleClose}></div>}

            {/* Contenedor del Drawer - Despliegue desde la IZQUIERDA y fondo SELVÁTICO */}
            <div className={`fixed top-0 left-0 h-full w-full min-[390px]:w-4/5 sm:w-[350px] bg-[#0a2e0d] border-r border-[#1a9a21]/30 z-[70] transform transition-transform duration-300 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.8)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* ════ CABECERA (Madera) ════ */}
                <div className="pt-8 pb-6 px-6 relative shadow-[0_4px_15px_rgba(0,0,0,0.5)] rounded-br-[2rem] border-b-4 border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] z-20">
                    <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
                    <button onClick={handleClose} aria-label="Cerrar perfil" className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl text-[#3a2212]/60 hover:bg-white/20 hover:text-[#3a2212] transition-colors"><X className="w-6 h-6" /></button>

                    <div className="flex items-center gap-4 mt-2 relative z-10">

                        {/* Info Usuario */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-[#3a2212] text-xl truncate" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>Hola, {displayName}</h3>
                            {/* Nivel (Tier) */}
                            {profile ? (
                                <span className="mt-1 inline-flex items-center gap-1 bg-[#3a2212] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm border border-[#3a2212]/50">
                                    {tier.label} {tier.emoji}
                                </span>
                            ) : (
                                <span className="mt-1 inline-flex items-center gap-1 bg-[#e6c59e]/30 text-[#3a2212]/60 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse border border-[#3a2212]/20">
                                    Cargando rango...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ════ BARRA DE EXPERIENCIA (XP) ════ */}
                <div className="px-6 py-4 bg-[#061f09] border-b border-[#1a9a21]/20 shadow-sm relative z-10 -mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#96c93e] mb-1.5">
                        <span>Pase de Leyenda</span>
                        <span className="text-[#03bbd3]">{progress.isMax ? `${progress.current} XP (MAX)` : `${progress.current} / ${progress.target} XP`}</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#0a2e0d] rounded-full overflow-hidden border border-[#1a9a21]/30 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-[#1a9a21] to-[#34c759] transition-all duration-500" style={{ width: `${progress.pct}%` }}></div>
                    </div>
                    <p className="text-[9px] text-[#e6c59e]/70 mt-1.5">{progress.isMax ? 'Rango máximo alcanzado. Disfrutas todos los beneficios.' : `${progress.missing} XP para desbloquear "${progress.nextTierLabel}".`}</p>
                </div>

                {/* ════ LISTA DE OPCIONES (Navegación Selvática) ════ */}
                <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#1a9a21]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="px-3 space-y-1">

                        <button onClick={() => { navigate('landing'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <Home className="w-5 h-5 text-[#96c93e] group-hover:text-[#03bbd3]" /> Inicio
                        </button>

                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <Package className="w-5 h-5 text-[#96c93e] group-hover:text-[#ffce07]" /> Mis Compras
                        </button>

                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <Wallet className="w-5 h-5 text-[#96c93e] group-hover:text-[#1a9a21]" />
                            <span className="flex-1 text-left">Mi Monedero</span>
                            <span className="text-[#34c759] font-black">${Number(wallet?.balance ?? 0).toFixed(2)}</span>
                        </button>

                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <Heart className="w-5 h-5 text-[#96c93e] group-hover:text-[#ec1676]" /> Mis Favoritos
                        </button>

                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <Gamepad2 className="w-5 h-5 text-[#96c93e] group-hover:text-[#8b5cf6]" /> Recompensas y UUIDs
                        </button>

                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <Ticket className="w-5 h-5 text-[#96c93e] group-hover:text-[#f59e0b]" /> Cupones
                        </button>

                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <MapPin className="w-5 h-5 text-[#96c93e] group-hover:text-[#ef4444]" /> Mis Ubicaciones
                        </button>

                        <hr className="border-[#1a9a21]/20 my-2 mx-4 border-t-2" />

                        <button onClick={() => { navigate('profile'); close(); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold text-[#e6c59e] hover:bg-[#1a9a21]/20 hover:text-white rounded-2xl transition-colors group">
                            <Settings className="w-5 h-5 text-[#96c93e] group-hover:text-white" /> Mi Cuenta
                        </button>



                    </div>
                </div>

                {/* ════ FOOTER (Cerrar Sesión) ════ */}
                <div className="p-4 border-t-2 border-[#1a9a21]/20 bg-[#061f09]">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#ec1676] hover:text-white hover:bg-[#ec1676] py-3.5 rounded-2xl transition-all border border-[#ec1676]/30 hover:border-transparent">
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </div>
        </>
    );
};

// ==========================================
// 2. LANDING PAGE VIEW [REQ-FE-01 a 05]
// ==========================================
