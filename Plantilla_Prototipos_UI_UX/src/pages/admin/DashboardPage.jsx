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
import { useAdminSummary, useSalesOverTime, useTopProductsAdmin } from '../../api/adminAnalytics';

const fmtMoney = (n) => `$${Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
const fmtK = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`);

/**
 * [Fase 48] Rango de fechas REACTIVO: el select cambia {start,end,days} →
 * las queryKeys de TanStack cambian → refetch AUTOMÁTICO (sin botones).
 */
const RANGES = {
    '7d': { label: 'Últimos 7 días' },
    'month': { label: 'Mes Actual' },
    'ytd': { label: 'YTD (Año actual)' },
};
const computeRange = (key) => {
    const now = new Date();
    const end = now.toISOString();
    if (key === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: start.toISOString(), end, days: Math.max(1, Math.ceil((now - start) / 86_400_000)) };
    }
    if (key === 'ytd') {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start: start.toISOString(), end, days: Math.max(1, Math.ceil((now - start) / 86_400_000)) };
    }
    const start = new Date(now.getTime() - 7 * 86_400_000);
    return { start: start.toISOString(), end, days: 7 };
};

export const DashboardView = () => {
    const [rangeKey, setRangeKey] = useState('7d');
    const range = computeRange(rangeKey);

    // Datos REALES del backend (CMS-FE-02); keepPreviousData evita parpadeo.
    const { data: summary } = useAdminSummary({ start: range.start, end: range.end });
    const { data: series } = useSalesOverTime(range.days);
    const { data: topProducts } = useTopProductsAdmin(10);

    // Serie del chart: alturas relativas al máximo real; eje Y dinámico.
    const points = series ?? [];
    const maxRevenue = Math.max(1, ...points.map((p) => p.revenue));
    const yLabels = [4, 3, 2, 1, 0].map((i) => fmtK((maxRevenue * i) / 4));
    // Con rangos largos, mostrar la etiqueta del eje X solo cada N puntos.
    const labelEvery = Math.max(1, Math.ceil(points.length / 7));

    const kpis = [
        { title: 'Ventas Totales', value: fmtMoney(summary?.totalRevenue), color: '#03bbd3' },
        { title: 'Ticket Promedio', value: fmtMoney(summary?.averageOrderValue), color: '#ec1676' },
        { title: 'Donaciones', value: fmtMoney(summary?.donationsAmount), color: '#96c93e' },
        { title: 'Clientes', value: Number(summary?.totalClients ?? 0).toLocaleString('es-MX'), color: '#ffce07' },
    ];

    // Embudo con datos REALES del summary (etiquetas ajustadas a lo medible).
    const funnelMax = Math.max(1, summary?.totalClients ?? 0, summary?.totalOrders ?? 0);
    const funnel = [
        { label: '1. Clientes Registrados', value: summary?.totalClients ?? 0, color: 'bg-[#236b2b]', text: 'text-[#e6c59e]/70' },
        { label: '2. Pedidos Creados', value: summary?.totalOrders ?? 0, color: 'bg-[#03bbd3]', text: 'text-[#03bbd3]' },
        { label: '3. Pedidos Vendidos', value: summary?.soldOrders ?? 0, color: 'bg-[#96c93e] shadow-[0_0_10px_rgba(150,201,62,0.4)]', text: 'text-[#96c93e]' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">Dashboard Analítico</h1>
                    <p className="text-[#e6c59e]/70 mt-1">Gráficos dinámicos y métricas en tiempo real.</p>
                </div>
                <select value={rangeKey} onChange={(e) => setRangeKey(e.target.value)} className="bg-[#123d17] border border-[#1a9a21]/30 text-sm text-[#e6c59e] px-4 py-2 rounded-xl outline-none cursor-pointer">
                    {Object.entries(RANGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 p-6 rounded-[30px] relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -right-4 -top-4 w-20 h-20 blur-3xl rounded-full opacity-20 transition-all group-hover:scale-150" style={{ backgroundColor: kpi.color }}></div>
                        <p className="text-[#e6c59e]/55 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{kpi.title}</p>
                        <div className="flex items-end gap-3 relative z-10"><h3 className="font-bungee text-2xl lg:text-3xl text-white leading-none tracking-tight">{kpi.value}</h3></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
                <div className="lg:col-span-2 bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 flex flex-col shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-2">Ingresos por Día</h3>
                    <p className="text-xs text-[#e6c59e]/70 mb-6">{RANGES[rangeKey].label} de rendimiento transaccional.</p>
                    <div className="h-64 w-full relative pt-4 pb-6 border-b border-l border-[#1a9a21]/30 flex items-end justify-between px-4 gap-1">
                        <div className="absolute -left-2 top-0 h-full flex flex-col justify-between text-[10px] text-[#e6c59e]/55 items-end pb-6 pr-2 transform -translate-x-full">
                            {yLabels.map((l, i) => <span key={i}>{l}</span>)}
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-between pb-6 border-b border-transparent pointer-events-none">
                            <div className="w-full h-px bg-[#123d17]"></div><div className="w-full h-px bg-[#123d17]"></div><div className="w-full h-px bg-[#123d17]"></div><div className="w-full h-px bg-[#123d17]"></div><div className="w-full h-px bg-[#123d17]"></div>
                        </div>
                        {points.length === 0 && <p className="absolute inset-0 flex items-center justify-center text-xs text-[#e6c59e]/40 font-bold">Sin ventas en el rango.</p>}
                        {points.map((p, i) => (
                            <div key={p.date} className="flex-1 max-w-12 relative group flex flex-col justify-end h-full z-10">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0a2e0d] text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 z-20 shadow-lg border border-[#1a9a21]/30 transition-opacity whitespace-nowrap pointer-events-none">
                                    <span className="font-bold text-[#03bbd3]">{fmtMoney(p.revenue)}</span> · {p.orders} pedidos · {p.date}
                                </div>
                                <div className="bg-[#03bbd3] hover:bg-[#03bbd3]/80 rounded-t-sm w-full transition-all cursor-crosshair" style={{ height: `${Math.max(p.revenue > 0 ? 2 : 0, (p.revenue / maxRevenue) * 100)}%` }}></div>
                                {i % labelEvery === 0 && <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[#e6c59e]/55 font-mono">{p.date.slice(5)}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Embudo de Conversión</h3>
                        <p className="text-xs text-[#e6c59e]/70 mb-6">Clientes → Pedido → Venta confirmada</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-6 mt-4">
                        {funnel.map((f, i) => (
                            <div key={f.label} className={`space-y-2 group ${i > 0 ? `pl-${i * 4} border-l-2 border-[#1a9a21]/30` : ''}`}>
                                <div className={`flex justify-between text-xs font-bold ${f.text}`}><span>{f.label}</span> <span className="group-hover:text-white transition-colors">{Number(f.value).toLocaleString('es-MX')}</span></div>
                                <div className="w-full bg-[#0a2e0d] rounded-full h-4 overflow-hidden"><div className={`${f.color} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, (f.value / funnelMax) * 100)}%` }}></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 flex flex-col shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Top 10 Productos Más Vendidos</h3>
                <div className="overflow-auto custom-scrollbar flex-1 pr-2">
                    <table className="font-quicksand w-full min-w-[620px] text-left text-sm">
                        <thead className="bg-[#1a9a21]/20 border-b border-[#1a9a21]/20">
                            <tr className="text-[#e6c59e]/70 border-b border-[#1a9a21]/20">
                                <th className="pb-3 font-medium">Producto</th>
                                <th className="pb-3 font-medium">Variante (SKU)</th>
                                <th className="pb-3 font-medium">Ventas</th>
                                <th className="pb-3 font-medium">Ingresos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a9a21]/20">
                            {(topProducts ?? []).length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-[#e6c59e]/55 font-bold text-xs">Sin ventas registradas todavía.</td></tr>
                            )}
                            {(topProducts ?? []).map((p) => (
                                <tr key={p.variantSku} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4">
                                        <p className="font-bold text-[#e6c59e]">{p.productName}</p>
                                    </td>
                                    <td className="py-4 text-[#e6c59e]/90 font-mono text-xs">{p.variantSku}</td>
                                    <td className="py-4 font-bold text-[#96c93e]">{p.unitsSold} un.</td>
                                    <td className="py-4 text-[#e6c59e]/90">{fmtMoney(p.revenue)}</td>
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
