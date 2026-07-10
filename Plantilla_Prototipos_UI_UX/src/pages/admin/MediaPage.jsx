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


export const MediaView = ({ showToast }) => {
    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Media Manager y Banners</h1>
                <p className="text-slate-400 mt-1">Configuración del Hero Carousel 3D Multicapa.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
                    <h3 className="font-bold text-white mb-4">Hero Carousel Actual</h3>
                    <div className="space-y-3">
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-4 cursor-grab hover:border-[#03bbd3]/50 transition-colors">
                            <GripVertical className="text-slate-500" />
                            <div className="w-16 h-10 bg-slate-800 rounded flex items-center justify-center relative overflow-hidden">
                                <ImageIcon className="w-5 h-5 text-slate-500" />
                                <div className="absolute inset-0 border-2 border-[#03bbd3] rounded opacity-50"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">Promo Jaguar (3D)</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> /descargar</p>
                            </div>
                            <ToggleRight className="text-[#03bbd3] w-6 h-6 cursor-pointer" onClick={() => showToast('Banner Desactivado temporalmente', 'warning')} />
                        </div>

                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-4 cursor-grab hover:border-[#03bbd3]/50 transition-colors opacity-60">
                            <GripVertical className="text-slate-500" />
                            <div className="w-16 h-10 bg-slate-800 rounded flex items-center justify-center"><MonitorPlay className="w-5 h-5 text-slate-500" /></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">Video Gameplay</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> youtube.com/watch</p>
                            </div>
                            <ToggleRight className="text-slate-600 w-6 h-6 rotate-180 cursor-pointer" onClick={() => showToast('Banner Activado', 'success')} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 space-y-6 shadow-2xl">
                    <h3 className="font-bold text-white border-b border-slate-700 pb-2 flex items-center gap-2"><Layers className="w-5 h-5 text-[#03bbd3]" /> Creador Multicapa 3D</h3>
                    <div className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Título Interno</label>
                                <input type="text" placeholder="Ej. Lanzamiento" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Hipervínculo al Clic</label>
                                <input type="text" placeholder="/producto/123" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase text-center">Capa 1: Fondo Base (BG)</label>
                                <div className="h-20 border-2 border-dashed border-slate-600 bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-500 cursor-pointer hover:border-[#03bbd3]/50 transition-colors">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#03bbd3] mb-1 uppercase text-center">Capa 2: SVG Frontal (3D)</label>
                                <div className="h-20 border-2 border-dashed border-[#03bbd3]/30 bg-[#03bbd3]/5 rounded-xl flex flex-col items-center justify-center text-[#03bbd3] cursor-pointer hover:border-[#03bbd3]/50 transition-colors">
                                    <UploadCloud className="w-5 h-5 mb-1" />
                                    <span className="text-[9px] font-bold">Pop-out Frontal</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700">
                            <label className="block text-xs font-bold text-slate-400 mb-2">Opcional: Video Dinámico (Fondo Invertido)</label>
                            <input type="text" placeholder="URL del video (Se reproducirá en loop sin sonido tipo GIF)" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                            <p className="text-[10px] text-slate-500 mt-1">Si se coloca un enlace, el video sustituirá a la Capa 1 de Fondo Base.</p>
                        </div>

                        <button onClick={() => showToast('Banner Multicapa 3D Guardado y Validado', 'success')} className="w-full bg-[#03bbd3] hover:bg-[#02a8be] text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-[#03bbd3]/20">Añadir al Carrusel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.8 GAME BRIDGE 
