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


export const InventoryView = ({ showToast }) => {
    const [editingId, setEditingId] = useState(null);

    const handleStockUpdate = (e) => {
        if (e.key === 'Enter') {
            setEditingId(null);
            showToast('Stock actualizado vía PATCH silencioso (Edición Inline)', 'success');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto flex flex-col h-full">
            <div className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Monitor Global de Inventario (DataGrid)</h1>
                    <p className="text-slate-400 mt-1">Vista macroestructural. Permite Edición Inline en el Stock haciendo doble clic.</p>
                </div>
            </div>
            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden flex flex-col flex-1 shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/80 border-b border-slate-700">
                        <tr className="text-slate-400">
                            <th className="px-6 py-4 font-bold">SKU Único</th>
                            <th className="px-6 py-4 font-bold">Producto Principal y Variante</th>
                            <th className="px-6 py-4 font-bold text-[#03bbd3]">Precio</th>
                            <th className="px-6 py-4 font-bold text-center border-l border-r border-slate-700 bg-slate-800/50">Stock Físico (Editable)</th>
                            <th className="px-6 py-4 font-bold">Estatus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {[{ id: 1, sku: 'PLY-JAG-S', name: 'Playera Jaguar Neón (S)', price: '$450.00', stock: 12, st: 'ok' }, { id: 2, sku: 'PLY-JAG-M', name: 'Playera Jaguar Neón (M)', price: '$450.00', stock: 2, st: 'warn' }, { id: 3, sku: 'PEL-BASE', name: 'Peluche Animayuk (Única)', price: '$299.00', stock: 0, st: 'danger' }].map(r => (
                            <tr key={r.id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-mono text-xs text-slate-400">{r.sku}</td>
                                <td className="px-6 py-4 font-bold text-slate-200">{r.name}</td>
                                <td className="px-6 py-4 text-[#03bbd3] font-medium">{r.price}</td>
                                <td className="px-6 py-4 border-l border-r border-slate-700 bg-slate-900/30 text-center" onDoubleClick={() => setEditingId(r.id)}>
                                    {editingId === r.id ? (
                                        <input autoFocus type="number" defaultValue={r.stock} onKeyDown={handleStockUpdate} onBlur={() => setEditingId(null)} className="w-16 bg-slate-800 border border-[#96c93e] rounded text-center text-[#96c93e] font-bold outline-none py-1" />
                                    ) : (
                                        <span className="font-bold text-lg cursor-pointer hover:text-[#03bbd3] transition-colors" title="Doble clic para editar">{r.stock}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border
                    ${r.st === 'ok' ? 'bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/20' :
                                            r.st === 'warn' ? 'bg-[#ffce07]/10 text-[#ffce07] border-[#ffce07]/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'}
                  `}>
                                        {r.st === 'ok' ? 'Activo' : r.st === 'warn' ? 'Stock Bajo' : 'Agotado'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="bg-slate-900 p-4 border-t border-slate-700 mt-auto flex justify-between items-center text-sm text-slate-400">
                    <span>Mostrando 1-10 de 543 variantes (Server-side pagination)</span>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-slate-800 border border-slate-700 rounded hover:text-white transition-colors opacity-50 cursor-not-allowed">Anterior</button>
                        <button className="px-3 py-1 bg-[#96c93e] text-white font-bold rounded">1</button>
                        <button className="px-3 py-1 bg-slate-800 border border-slate-700 rounded hover:text-white transition-colors">2</button>
                        <button className="px-3 py-1 bg-slate-800 border border-slate-700 rounded hover:text-white transition-colors">Siguiente</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.5 GESTOR CRM 
