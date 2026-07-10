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
import { useProfile, useUnreadCount } from '../../api/profile';
import { useNotificationStore } from '../../store/notificationStore';
import { tierDisplay, tierProgress } from '../../lib/gamification';

export const ProfileDrawer = ({ isOpen, close, navigate, logout }) => {
    // [Fase 43] Perfil REAL: GET /api/profile (usuario + tier + XP + wallet +
    // umbrales de gamificación de system_settings). Solo consulta al abrirse.
    const { data: me } = useProfile(isOpen);
    // Contador de no leídas → se sincroniza al notificationStore (fuente del badge)
    useUnreadCount(isOpen);
    const unread = useNotificationStore((s) => s.unreadCount);

    const profile = me?.profile;
    const wallet = me?.wallet;
    const tier = tierDisplay(profile?.tierLevel);
    const progress = tierProgress(profile?.experiencePoints, profile?.tierLevel, me?.gamification);
    const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60]" onClick={close}></div>}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[350px] bg-[#0b1121] border-l border-slate-800 z-[70] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-8 border-b border-slate-800 bg-gradient-to-b from-slate-800/50 to-transparent relative">
                    <button onClick={close} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>

                    <div className="flex items-center gap-4 mt-4 relative">
                        <div className="w-16 h-16 bg-slate-800 rounded-full border-2 border-[#96c93e] flex items-center justify-center overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(me?.user?.email ?? 'Felix')}`} alt="Avatar" className="w-full h-full" /></div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{fullName || 'Cargando...'}</h3>
                            <p className="text-xs text-slate-400">{me?.user?.email ?? ''}</p>
                            {/* [ENTERPRISE] Rank Label — tier REAL del perfil */}
                            <span className="mt-1 inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/30">
                                {tier.label} {tier.emoji}
                            </span>
                        </div>
                        {unread > 0 && <div className="absolute top-0 right-8 bg-red-500 border-2 border-[#0b1121] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">{unread}</div>}
                    </div>

                    {/* [ENTERPRISE] Pase de Leyenda XP Bar — XP real vs umbral real (system_settings) */}
                    <div className="mt-5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>Pase de Leyenda</span>
                            <span className="text-emerald-400">{progress.isMax ? `${progress.current} XP (MAX)` : `${progress.current} / ${progress.target} XP`}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500" style={{ width: `${progress.pct}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">{progress.isMax ? 'Rango máximo alcanzado. Disfrutas todos los beneficios.' : `${progress.missing} XP para desbloquear "${progress.nextTierLabel}" y mejores beneficios de envío.`}</p>
                    </div>

                    <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer group" onClick={() => { navigate('profile'); close(); }}>
                        <div><p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider mb-1">Saldo Monedero</p><p className="text-2xl font-black text-amber-400">${Number(wallet?.balance ?? 0).toFixed(2)}</p></div>
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

