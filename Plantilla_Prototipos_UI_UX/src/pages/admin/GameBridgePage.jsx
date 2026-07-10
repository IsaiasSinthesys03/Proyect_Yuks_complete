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


export const GameBridgeView = ({ showToast }) => {
    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div><h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">Consola In-Game <span className="bg-[#96c93e]/20 text-[#96c93e] text-xs px-2 py-1 rounded-full border border-[#96c93e]/30 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#96c93e] animate-pulse"></div> DB Online</span></h1><p className="text-slate-400 mt-1">Lectura directa a BD NoSQL.</p></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between border-b border-slate-700 pb-4">
                        <span className="flex items-center gap-2"><Gamepad2 className="w-6 h-6 text-[#502c84]" /> Recompensas NoSQL</span>
                        <button className="bg-[#502c84] text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> Nueva</button>
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
                            <span className="font-medium text-slate-300">Skin Jaguar Dorado</span>
                            <div className="flex gap-2">
                                <button className="text-slate-500 hover:text-white border border-slate-700 p-1.5 rounded bg-slate-800">Edit</button>
                                <button onClick={() => showToast('Acción bloqueada: Impedido eliminar recompensa virtual (CMS-BE-03) por vínculo a producto activo en Tienda E-commerce.', 'error')} className="text-red-500 hover:bg-red-500/20 border border-slate-700 p-1.5 rounded bg-slate-800 flex items-center gap-1 px-2 text-xs font-bold"><Ban className="w-4 h-4" /> Delete Blocked</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Banner Manager del Juego</h2>
                    <div className="space-y-4">
                        <select defaultValue="PRD-01" className="w-full bg-slate-900 border border-[#03bbd3]/50 rounded-xl px-4 py-3 text-white outline-none">
                            <option value="PRD-01">Producto Físico a mostrar: PRD-01 (Playera Jaguar)</option>
                        </select>
                        <button onClick={() => showToast('Definido. La App NoSQL mostrará este producto físico SQL.', 'success')} className="w-full bg-[#03bbd3] text-white font-bold py-3 rounded-xl mt-4">Publicar en App</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.9 SETTINGS (Costo de Envío Local, Foráneo, Umbral y Mínimo de Compra Unificados)
