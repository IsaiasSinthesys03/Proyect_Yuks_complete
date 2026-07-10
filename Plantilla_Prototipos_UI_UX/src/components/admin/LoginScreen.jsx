import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, ShoppingCart, Package, Image as ImageIcon,
    Gamepad2, Settings, ShieldAlert, FileText, HeartHandshake,
    LogOut, Lock, Search, Bell, Plus, Filter, MoreVertical,
    ChevronRight, GripVertical, AlertTriangle, CheckCircle2, CreditCard,
    Truck, ArrowRight, User, UploadCloud, ToggleRight, MonitorPlay,
    History, Eye, EyeOff, Save, Type, Bold, Italic, Link2,
    Users, Ticket, List, Menu, X, Code, Loader2, Database, Trash2, Ban, Clock,
    Wifi, ChevronLeft, Link as LinkIcon, Layers
} from 'lucide-react';


export const LoginScreen = ({ onLogin, showToast }) => {
    const [showRegister, setShowRegister] = useState(false);
    const [devCode, setDevCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(3);
    const [isBlocked, setIsBlocked] = useState(false);

    const handleRegister = (e) => {
        e.preventDefault();
        if (isBlocked) return;

        if (devCode === '000000') {
            showToast('Modo Registro Desbloqueado', 'success');
            onLogin();
        } else {
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);
            if (newAttempts <= 0) {
                setIsBlocked(true);
                showToast('IP Bloqueada (Fail2Ban). Contacte a soporte.', 'error');
            } else {
                showToast(`Código inválido. ${newAttempts} intentos restantes.`, 'warning');
            }
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-brand-gradient relative overflow-hidden">
            {/* Elementos decorativos animados */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#03bbd3]/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ec1676]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#502c84]/30 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-[#0a0b14]/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] shadow-2xl brand-shadow">
                    <div className="text-center mb-10">
                        <div
                            onClick={() => setShowRegister(!showRegister)}
                            className="w-24 h-24 bg-gradient-to-tr from-[#03bbd3] to-[#502c84] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/20 rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                        >
                            <Lock className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">ANIMAYUKS<span className="text-[#03bbd3]">.</span>OS</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Portal de Gestión Logística</p>
                    </div>

                    {!showRegister ? (
                        <form onSubmit={(e) => { e.preventDefault(); showToast('Sesión Iniciada', 'success'); onLogin(); }} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Identificador Corporativo</label>
                                <input
                                    required type="email" defaultValue="admin@animayuks.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-white/10 transition-all font-bold"
                                    placeholder="Usuario"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Clave de Acceso</label>
                                <div className="relative">
                                    <input
                                        required type={showPassword ? "text" : "password"} defaultValue="password123"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-white/10 transition-all font-bold"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500 hover:text-[#03bbd3]">
                                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#03bbd3] to-[#502c84] hover:from-[#ec1676] hover:to-[#502c84] text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-xl shadow-cyan-500/10 active:scale-95 flex items-center justify-center gap-3"
                            >
                                ACCEDER AL SISTEMA <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in zoom-in-95">
                            <div className="bg-[#ffce07]/10 border border-[#ffce07]/20 p-5 rounded-2xl flex items-start gap-4 mb-4">
                                <AlertTriangle className="w-6 h-6 text-[#ffce07] shrink-0" />
                                <p className="text-[11px] leading-relaxed text-[#ffce07]/90 font-bold uppercase tracking-tight">Acceso forzado de administradores. Registro directo en BD NoSQL sin validación RBAC.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#ffce07] uppercase tracking-widest ml-2">Developer Key</label>
                                <input
                                    required type={showPassword ? "text" : "password"}
                                    value={devCode} onChange={(e) => setDevCode(e.target.value)}
                                    placeholder="000000" disabled={isBlocked}
                                    className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-white outline-none transition-all font-mono tracking-widest text-center text-xl ${isBlocked ? 'border-red-500/50 opacity-50' : 'border-[#ffce07]/30 focus:border-[#ffce07] focus:bg-[#ffce07]/5'}`}
                                />
                            </div>
                            <button
                                type="submit" disabled={isBlocked}
                                className={`w-full font-black py-5 rounded-2xl transition-all duration-300 shadow-xl ${isBlocked ? 'bg-red-500/20 text-red-500/50 cursor-not-allowed' : 'bg-[#ffce07] hover:bg-[#e6b906] text-slate-900 shadow-[#ffce07]/20 active:scale-95'}`}
                            >
                                DESBLOQUEAR REGISTRO
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 2. ADMIN LAYOUT & NAVIGATION ---
