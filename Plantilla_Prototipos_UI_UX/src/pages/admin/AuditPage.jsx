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


export const AuditView = () => {
    const [showJson, setShowJson] = useState(false);

    const logs = [
        { date: '2026-05-27 10:15', user: 'admin@animayuks.com', action: 'UPDATE', target: 'PRD-01 (Precio)', ip: '192.168.1.45' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto relative">
            <div className="flex justify-between items-end">
                <div><h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3"><History className="w-8 h-8 text-[#03bbd3]" /> Visor de Bitácora (Audit Log Grid)</h1><p className="text-slate-400 mt-1">Tabla inmutable de solo lectura con filtros avanzados.</p></div>
                <div className="flex gap-3">
                    <input type="date" className="bg-black/40 border border-white/10 text-sm text-slate-200 px-4 py-2 rounded-xl outline-none" />
                    <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" /><input type="text" placeholder="¿Qué hizo el administrador X?" className="bg-black/40 border border-white/10 text-sm rounded-xl pl-9 pr-4 py-2 text-white w-56 outline-none" /></div>
                    <select defaultValue="Todas las Acciones" className="bg-black/40 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-sm outline-none">
                        <option value="Todas las Acciones">Todas las Acciones</option><option value="CREATE">CREATE</option><option value="UPDATE">UPDATE</option><option value="SOFT_DELETE">SOFT_DELETE</option><option value="REFUND">REFUND</option>
                    </select>
                </div>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/80 border-b border-slate-700">
                        <tr className="text-slate-400">
                            <th className="px-6 py-4 font-bold">Timestamp</th>
                            <th className="px-6 py-4 font-bold">Admin</th>
                            <th className="px-6 py-4 font-bold">IP de Origen</th>
                            <th className="px-6 py-4 font-bold text-center">Payload Viejo/Nuevo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {logs.map((log, i) => (
                            <tr key={i} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.date}</td>
                                <td className="px-6 py-4 text-slate-200 font-bold">{log.user}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.ip}</td>
                                <td className="px-6 py-4 text-center"><button onClick={() => setShowJson(true)} className="text-slate-500 hover:text-[#96c93e] bg-slate-900 p-2 rounded-lg border border-slate-700 flex items-center justify-center mx-auto gap-2 text-xs"><Code className="w-4 h-4" /> Ver</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showJson && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between mb-4"><h3 className="text-white font-bold font-mono">Payload Diff Viewer</h3><button onClick={() => setShowJson(false)} className="text-slate-400"><X /></button></div>
                        <pre className="bg-slate-900 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-700">
                            {`{
  "action": "UPDATE",
  "table": "products",`}
                            <br /><span className="text-red-400 bg-red-500/10 block w-full px-2">{'- "old_value": { "price": 400.00 }'}</span><span className="text-[#96c93e] bg-[#96c93e]/10 block w-full px-2">{'+ "new_value": { "price": 450.00 }'}</span>{`}
`}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3.11 DONATIONS VIEW
