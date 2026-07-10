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


export const CrmView = ({ showToast, setSubBreadcrumb }) => {
    const [selectedUser, setSelectedUser] = useState(null);

    const openProfile = (u) => {
        setSelectedUser(u);
        setSubBreadcrumb(`Perfil: ${u.n}`);
    };

    const closeProfile = () => {
        setSelectedUser(null);
        setSubBreadcrumb('');
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto relative">
            <div className="flex justify-between items-end">
                <div><h1 className="text-3xl font-black text-white tracking-tight">Gestor CRM y Monederos</h1><p className="text-slate-400 mt-1">Administración y auditoría de usuarios registrados.</p></div>
            </div>

            {!selectedUser ? (
                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/80 border-b border-slate-700">
                            <tr className="text-slate-400">
                                <th className="px-6 py-4 font-bold">Cliente y Correo</th>
                                <th className="px-6 py-4 font-bold">Fecha de Registro</th>
                                <th className="px-6 py-4 font-bold">Historial de Compras</th>
                                <th className="px-6 py-4 font-bold text-[#ffce07]">Saldo del Monedero</th>
                                <th className="px-6 py-4 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {[{ n: 'Roberto Gómez', e: 'roberto.g@gmail.com', d: '10/May/2026', t: '4 tickets ($4,500)', w: '$150.00 MXN', ip: '201.145.23.1', v: 'v1.2', exp: '10/May/2027' }].map((c, i) => (
                                <tr key={i} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4"><p className="font-bold text-white">{c.n}</p><p className="text-xs text-slate-500">{c.e}</p></td>
                                    <td className="px-6 py-4 text-slate-400">{c.d}</td>
                                    <td className="px-6 py-4 text-[#96c93e] font-medium">{c.t}</td>
                                    <td className="px-6 py-4 text-[#ffce07] font-bold bg-slate-800/30">{c.w}</td>
                                    <td className="px-6 py-4"><button onClick={() => openProfile(c)} className="bg-slate-800 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 text-[#03bbd3]">Ver Perfil</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 animate-in slide-in-from-right-8">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-[#502c84] rounded-full flex items-center justify-center text-2xl font-black text-white/50">R</div>
                            <div><h2 className="text-2xl font-black text-white">{selectedUser.n}</h2><p className="text-slate-400">{selectedUser.e}</p></div>
                        </div>
                        <button onClick={closeProfile} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                            <h4 className="text-sm font-bold text-slate-400 mb-4">Trazabilidad Legal (Audit Trail)</h4>
                            <p className="text-sm text-slate-300">Términos aceptados: <span className="font-mono text-[#03bbd3] bg-[#03bbd3]/10 px-2 py-0.5 rounded">{selectedUser.v}</span></p>
                            <p className="text-sm text-slate-300 mt-2">IP Registro: <span className="font-mono text-slate-400">{selectedUser.ip}</span></p>
                        </div>
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                            <h4 className="text-sm font-bold text-slate-400 mb-4">Estado del Monedero</h4>
                            <p className="text-3xl font-black text-[#ffce07] mb-2">{selectedUser.w}</p>
                            <p className="text-xs text-red-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Expira legalmente el: {selectedUser.exp}</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-6 flex justify-end">
                        <button onClick={() => { showToast('Usuario bloqueado por posible fraude', 'error'); closeProfile(); }} className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
                            <Ban className="w-4 h-4" /> Suspender Cuenta (Bloqueo Fraude)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3.6 GESTOR DE CUPONES
