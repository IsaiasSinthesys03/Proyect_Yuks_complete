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


export const DonationsView = ({ showToast }) => {
    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Gestor del Modal de Donaciones</h1>
                <p className="text-[#ec1676] mt-1 font-bold uppercase tracking-widest text-[10px]">Módulo dedicado para modificar el panel del cliente.</p>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ec1676]/10 blur-[50px] pointer-events-none"></div>

                <div className="space-y-6 relative z-10">
                    <div className="flex gap-6">
                        <div className="w-1/3 flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Banner del Pop-Up Front</label>
                            <div className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-[#ec1676]/50 transition-colors cursor-pointer">
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold text-center px-4">Subir Ilustración<br />(Ej. Temática Halloween)</span>
                            </div>
                        </div>

                        <div className="w-2/3 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#ec1676] uppercase mb-2">Botones de Acceso Rápido (Chips)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="relative"><span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">$</span><input type="number" defaultValue="10" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white outline-none" /></div>
                                    <div className="relative"><span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">$</span><input type="number" defaultValue="20" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white outline-none" /></div>
                                    <div className="relative"><span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">$</span><input type="number" defaultValue="30" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white outline-none" /></div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">El 4to botón siempre dirá "Otra cantidad" dinámicamente en el front.</p>
                            </div>

                            <div className="pt-2 border-t border-slate-700">
                                <label className="block text-xs font-bold text-[#ec1676] uppercase mb-2">Input Libre: Monto Mínimo Permitido (Antifraude)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                    <input type="number" defaultValue="10" className="w-full bg-slate-900 border-[#ec1676]/50 rounded-xl pl-8 pr-4 py-3 text-[#ec1676] font-bold outline-none" />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Evita errores de procesamiento de cobros mínimos en Stripe.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#96c93e]" /> Transparencia Fiscal Activada
                        </h4>
                        <p className="text-xs text-slate-400">Si un usuario anónimo intenta donar, el frontend le exigirá un correo electrónico obligatorio para enviar el recibo.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-700">
                        <button type="button" onClick={() => showToast('Modal de donaciones actualizado', 'success')} className="bg-[#ec1676] hover:bg-[#d11368] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg">
                            Actualizar Modal UI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.12 LEGAL VIEW 
