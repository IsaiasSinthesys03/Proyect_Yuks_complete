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


export const LegalView = ({ showToast }) => {
    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Editor de Textos Legales (Compliance CMS)</h1>
                <p className="text-slate-400 mt-1">Interfaz exclusiva para modificar dinámicamente el contenido legal sin reprogramar la página.</p>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden flex flex-col h-[600px] relative shadow-2xl">
                <div className="flex bg-slate-900 border-b border-slate-700">
                    <button className="px-6 py-4 text-sm font-bold text-[#96c93e] border-b-2 border-[#96c93e] bg-slate-800">Aviso Privacidad</button>
                    <button className="px-6 py-4 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">Términos Venta</button>
                    <button className="px-6 py-4 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">Términos Juego</button>
                    <button className="px-6 py-4 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">Políticas de Seguridad</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-3/4 flex flex-col border-r border-slate-700">
                        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex gap-4">
                            <button className="p-1.5 text-white bg-slate-700 rounded"><Bold className="w-4 h-4" /></button>
                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Italic className="w-4 h-4" /></button>
                        </div>
                        <textarea className="flex-1 bg-transparent p-8 text-slate-300 outline-none resize-none custom-scrollbar leading-relaxed" defaultValue="Última actualización: 27 de Mayo de 2026.&#10;&#10;De conformidad con lo establecido en la Ley Federal de Protección de Datos Personales..."></textarea>
                    </div>

                    <div className="w-1/4 bg-slate-900 p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Historial Versiones</h4>
                        <div className="space-y-2">
                            <div className="p-2 bg-[#96c93e]/10 border border-[#96c93e]/30 rounded text-[#96c93e] text-xs font-bold">v1.2 (Actual) - 27 May</div>
                            <div className="p-2 border border-slate-700 rounded text-slate-500 text-xs cursor-pointer hover:bg-slate-800">v1.1 - 10 Ene</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border-t border-slate-700 p-4 flex justify-between items-center">
                    <p className="text-xs text-slate-500">Al guardar, el backend registrará esta versión para futuras ventas y la bitácora legal (Audit Trail).</p>
                    <button onClick={() => showToast('Versión v1.3 Publicada. Audit Log actualizado.', 'success')} className="bg-[#96c93e] hover:bg-[#86b537] text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" /> Publicar Versión v1.3
                    </button>
                </div>
            </div>
        </div>
    );
};
