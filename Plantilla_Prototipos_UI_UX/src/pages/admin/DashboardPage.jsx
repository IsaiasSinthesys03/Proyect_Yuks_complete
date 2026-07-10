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


export const DashboardView = () => {
    const topProducts = [
        { id: 'PRD-01', name: 'Playera Jaguar Neón', size: 'M', sales: 145, revenue: '$43,500', stock: 12, status: 'warning' },
        { id: 'PRD-02', name: 'Peluche Animayuk Base', size: 'Única', sales: 98, revenue: '$29,400', stock: 45, status: 'ok' },
        { id: 'PRD-03', name: 'Sudadera Gamer', size: 'L', sales: 67, revenue: '$40,200', stock: 3, status: 'danger' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Analítico</h1>
                    <p className="text-slate-400 mt-1">Gráficos dinámicos y métricas en tiempo real.</p>
                </div>
                <select defaultValue="Últimos 7 días" className="bg-slate-800 border border-slate-700 text-sm text-slate-200 px-4 py-2 rounded-xl outline-none cursor-pointer">
                    <option>Últimos 7 días</option><option>Mes Actual</option><option>YTD (Año actual)</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Ventas Totales', value: '$124,500', trend: '+14%', color: '#03bbd3' },
                    { title: 'Ticket Promedio', value: '$1,200', trend: '+5%', color: '#ec1676' },
                    { title: 'Donaciones', value: '$8,450', trend: '+12%', color: '#96c93e' },
                    { title: 'Usuarios Activos', value: '1,204', trend: '+22%', color: '#ffce07' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 p-6 rounded-[30px] relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -right-4 -top-4 w-20 h-20 blur-3xl rounded-full opacity-20 transition-all group-hover:scale-150" style={{ backgroundColor: kpi.color }}></div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{kpi.title}</p>
                        <div className="flex items-end gap-3 relative z-10"><h3 className="text-3xl font-black text-white tracking-tighter">{kpi.value}</h3><span className="text-[#96c93e] text-xs font-bold bg-[#96c93e]/10 px-2 py-0.5 rounded-full">{kpi.trend}</span></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 flex flex-col shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-2">Ingresos y Ticket Promedio (Chart.js View)</h3>
                    <p className="text-xs text-slate-400 mb-6">Últimos 7 días de rendimiento transaccional.</p>
                    <div className="h-64 w-full relative pt-4 pb-6 border-b border-l border-slate-700 flex items-end justify-between px-4">
                        <div className="absolute -left-2 top-0 h-full flex flex-col justify-between text-[10px] text-slate-500 items-end pb-6 pr-2 transform -translate-x-full">
                            <span>$100k</span><span>$75k</span><span>$50k</span><span>$25k</span><span>$0</span>
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-between pb-6 border-b border-transparent pointer-events-none">
                            <div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div>
                        </div>
                        {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                            <div key={i} className="w-12 relative group flex flex-col justify-end h-full z-10">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 z-20 shadow-lg border border-slate-700 transition-opacity whitespace-nowrap pointer-events-none">
                                    <span className="font-bold text-[#03bbd3]">${h},000</span>
                                </div>
                                <div className="bg-[#03bbd3] hover:bg-[#03bbd3]/80 rounded-t-sm w-full transition-all cursor-crosshair" style={{ height: `${h}%` }}></div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-mono">D{i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 flex flex-col justify-between shadow-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Embudo de Conversión</h3>
                        <p className="text-xs text-slate-400 mb-6">Usuarios App → Compra Fija (Top 10)</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-6 mt-4">
                        <div className="space-y-2 group">
                            <div className="flex justify-between text-xs text-slate-400 font-bold"><span>1. Usuarios App</span> <span className="group-hover:text-white transition-colors">10,000</span></div>
                            <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden"><div className="bg-slate-600 h-full rounded-full w-full"></div></div>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-slate-700 group">
                            <div className="flex justify-between text-xs text-[#03bbd3] font-bold"><span>2. Reclaman UUID</span> <span className="group-hover:text-white transition-colors">3,500</span></div>
                            <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden"><div className="bg-[#03bbd3] h-full rounded-full w-[35%]"></div></div>
                        </div>
                        <div className="space-y-2 pl-8 border-l-2 border-slate-700 group">
                            <div className="flex justify-between text-xs text-[#96c93e] font-bold"><span>3. Compran Físico</span> <span className="group-hover:text-white transition-colors">1,204</span></div>
                            <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden"><div className="bg-[#96c93e] h-full rounded-full w-[12%] shadow-[0_0_10px_rgba(150,201,62,0.4)]"></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 flex flex-col shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Top 10 Productos Más Vendidos (Tiempo Real)</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 border-b border-slate-700/50">
                                <th className="pb-3 font-medium">ID / Producto</th>
                                <th className="pb-3 font-medium">Variante</th>
                                <th className="pb-3 font-medium">Ventas</th>
                                <th className="pb-3 font-medium">Ingresos</th>
                                <th className="pb-3 font-medium">Stock Local</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {topProducts.map((p, i) => (
                                <tr key={i} className="group hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4">
                                        <p className="font-bold text-slate-200">{p.name}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{p.id}</p>
                                    </td>
                                    <td className="py-4 text-slate-300">{p.size}</td>
                                    <td className="py-4 font-bold text-[#96c93e]">{p.sales} un.</td>
                                    <td className="py-4 text-slate-300">{p.revenue}</td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                      ${p.status === 'ok' ? 'bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/20' :
                                                p.status === 'warning' ? 'bg-[#ffce07]/10 text-[#ffce07] border-[#ffce07]/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'}
                    `}>
                                            {p.stock} pts
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// 3.2 KANBAN
