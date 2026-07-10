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


export const CouponsView = ({ showToast }) => {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto relative">
            <div className="flex justify-between items-end">
                <div><h1 className="text-3xl font-black text-white tracking-tight">Gestor de Cupones</h1><p className="text-slate-400 mt-1">Creación y administración de códigos de descuento.</p></div>
                <button onClick={() => setShowForm(true)} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20"><Plus className="w-5 h-5" /> NUEVO CUPÓN</button>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <div>
                        <div className="flex items-center gap-3"><span className="text-lg font-mono font-bold text-[#03bbd3] bg-[#03bbd3]/10 px-3 py-1 rounded border border-[#03bbd3]/20">VERANO26</span><span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">15% Dto.</span></div>
                        <p className="text-xs text-slate-400 mt-2">Fecha de expiración estricta: 30/Ago/2026 • Límite usos: 100</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#03bbd3]">ACTIVO</span>
                        <ToggleRight className="w-8 h-8 text-[#03bbd3] cursor-pointer" onClick={() => showToast('Campaña desactivada en tiempo real sin destruir registro histórico.', 'warning')} />
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={(e) => { e.preventDefault(); showToast('Cupón creado', 'success'); setShowForm(false); }} className="bg-slate-800 border border-slate-700 rounded-3xl p-8 w-full max-w-lg animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-6">Crear Código Promocional</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código (Alfanumérico)</label><input required type="text" placeholder="Ej. BUENFIN" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono uppercase outline-none" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo / Monto Directo</label>
                                    <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                                        <select defaultValue="%" className="bg-slate-800 text-white px-2 py-3 border-r border-slate-700 outline-none text-xs"><option value="%">%</option><option value="$ MXN">$ MXN</option></select>
                                        <input required type="number" className="flex-1 bg-transparent px-3 py-3 text-white outline-none" />
                                    </div>
                                </div>
                                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Límite usos globales</label><input required type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha de Expiración Estricta</label><input required type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 text-slate-400">Cancelar</button>
                            <button type="submit" className="flex-1 bg-[#03bbd3] text-white py-3 rounded-xl font-bold">Activar Cupón</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// 3.7 MEDIA VIEW
