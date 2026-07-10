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


export const SettingsView = ({ showToast }) => {
    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div><h1 className="text-3xl font-black text-white tracking-tight">Configuración Global de Rutas</h1><p className="text-slate-400 mt-1">Definición de ETAs y operaciones comerciales.</p></div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 space-y-6 shadow-2xl">
                {/* NUEVA CUADRÍCULA (5 COLUMNAS PARA ACOMODAR TODOS LOS COSTOS) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 border-b border-slate-700 pb-6">
                    <div className="col-span-2 md:col-span-5">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dirección Física del Local</label>
                        <input type="text" defaultValue="Calle 60 #123 x 45 y 47, Centro, Mérida, Yucatán" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estado Base</label>
                        <input type="text" defaultValue="Yucatán" disabled className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-500" />
                    </div>

                    {/* NUEVO: Costo Envío Local */}
                    <div>
                        <label className="block text-xs font-bold text-[#03bbd3] uppercase mb-2">Costo Envío Local</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="49" className="w-full bg-slate-900 border border-[#03bbd3]/50 rounded-xl pl-8 pr-4 py-3 text-[#03bbd3] font-bold outline-none" /></div>
                    </div>

                    {/* Costo Envío Foráneo */}
                    <div>
                        <label className="block text-xs font-bold text-[#ffce07] uppercase mb-2">Costo Envío Foráneo</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="199" className="w-full bg-slate-900 border border-[#ffce07]/50 rounded-xl pl-8 pr-4 py-3 text-[#ffce07] font-bold outline-none" /></div>
                    </div>

                    {/* Umbral Envío Gratis */}
                    <div>
                        <label className="block text-xs font-bold text-[#96c93e] uppercase mb-2">Umbral Envío Gratis</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="1500" className="w-full bg-slate-900 border border-[#96c93e]/50 rounded-xl pl-8 pr-4 py-3 text-[#96c93e] font-bold outline-none" /></div>
                    </div>

                    {/* Mínimo de Compra */}
                    <div>
                        <label className="block text-xs font-bold text-[#502c84] uppercase mb-2">Mínimo de Compra</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="200" className="w-full bg-slate-900 border border-[#502c84]/50 rounded-xl pl-8 pr-4 py-3 text-[#502c84] font-bold outline-none" /></div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Matriz de Municipios Locales (Aplica Tarifa Local)</label>
                    <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-wrap gap-2">
                        {['Mérida', 'Progreso', 'Kanasín', 'Umán'].map(tag => (
                            <span key={tag} className="bg-[#03bbd3]/10 text-[#03bbd3] border border-[#03bbd3]/20 px-3 py-1 rounded-lg text-sm flex items-center gap-2">{tag} <span className="cursor-pointer">&times;</span></span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div><label className="block text-xs font-bold text-slate-400 mb-2">Definición ETA Local</label><input type="text" defaultValue="Llega hoy mismo" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                    <div><label className="block text-xs font-bold text-slate-400 mb-2">Definición ETA Paquetería</label><input type="text" defaultValue="3 a 5 días hábiles" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                </div>

                {/* Change Dev Code Secure */}
                <div className="pt-6 border-t border-slate-700 mt-6">
                    <label className="block text-xs font-bold text-red-400 uppercase mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Gestión de Credenciales de Rescate (Easter Egg)</label>
                    <div className="flex gap-4 items-center bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                        <div className="flex-1"><input type="password" placeholder="Código Actual" className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-2 text-white font-mono" /></div>
                        <div className="flex-1"><input type="password" placeholder="Confirmar Nuevo Código" className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-2 text-white font-mono" /></div>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold" onClick={() => showToast('Código de desarrollador modificado con éxito.', 'success')}>Actualizar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.10 AUDIT LOG 
