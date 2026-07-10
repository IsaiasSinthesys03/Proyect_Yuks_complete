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


export const KanbanView = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState('activos');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [lastMileOrder, setLastMileOrder] = useState(null);

    const [cards, setCards] = useState([
        { id: 'ORD-8821', col: 'pago', client: 'Carlos Mendoza', phone: '+52 999 123 4567', addr: 'Calle 42 #123', refs: 'Casa blanca con reja negra', cp: '97000', city: 'Mérida', state: 'Yucatán', country: 'México', type: 'LOCAL', items: 2, amount: '$850.00' },
        { id: 'ORD-8822', col: 'empaque', client: 'Ana Sofía Ruiz', phone: '+52 555 987 6543', addr: 'Av. Insurgentes Sur 456', refs: 'Edificio cristal', cp: '01020', city: 'CDMX', state: 'CDMX', country: 'México', type: 'EXTERNAL_COURIER', items: 1, amount: '$320.00' },
    ]);

    const columns = [
        { id: 'pago', title: 'Pago Confirmado', color: 'border-[#03bbd3] text-[#03bbd3]' },
        { id: 'empaque', title: 'Empaquetando', color: 'border-[#ffce07] text-[#ffce07]' },
        { id: 'camino', title: 'En Camino', color: 'border-[#502c84] text-[#502c84]' },
        { id: 'reparto', title: 'En Reparto', color: 'border-[#96c93e] text-[#96c93e]' },
    ];

    const handleDragStart = (e, cardId) => e.dataTransfer.setData('cardId', cardId);
    const handleDrop = (e, colId) => {
        const cardId = e.dataTransfer.getData('cardId');
        const card = cards.find(c => c.id === cardId);
        if (!card || card.col === colId) return;

        setCards(prev => prev.map(c => c.id === cardId ? { ...c, col: colId } : c));

        if (colId === 'reparto') {
            setLastMileOrder(card);
        } else {
            showToast(`Pedido movido. Background Job disparó correo (REQ-BE-04).`, 'success');
        }
    };

    const saveLastMile = (e) => {
        e.preventDefault();
        setLastMileOrder(null);
        showToast('Última milla guardada. BullMQ notificó por WebSocket y Correo.', 'success');
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in relative">
            <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        Logística (Kanban)
                        <span className="bg-[#96c93e]/20 text-[#96c93e] text-xs px-2 py-1 rounded-full border border-[#96c93e]/30 flex items-center gap-1 font-bold">
                            <Wifi className="w-3 h-3 animate-pulse" /> WebSockets Live
                        </span>
                    </h1>
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => setActiveTab('activos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'activos' ? 'bg-[#96c93e] text-white' : 'bg-slate-800 text-slate-400'}`}>Pedidos Activos</button>
                        <button onClick={() => setActiveTab('historial')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'historial' ? 'bg-[#96c93e] text-white' : 'bg-slate-800 text-slate-400'}`}>Historial Finalizados</button>
                    </div>
                </div>
            </div>

            {activeTab === 'activos' ? (
                <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                    {columns.map(col => (
                        <div key={col.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.id)} className={`flex flex-col w-[26rem] shrink-0 bg-[#0a0b14]/40 backdrop-blur-xl rounded-[32px] border-t-[6px] ${col.color.split(' ')[0]} border-white/5 shadow-2xl`}>
                            <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
                                <h3 className={`font-bold ${col.color.split(' ')[1]}`}>{col.title}</h3>
                                <span className="bg-white/5 text-slate-400 text-xs px-2 py-1 rounded-lg">{cards.filter(c => c.col === col.id).length}</span>
                            </div>
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                                {cards.filter(c => c.col === col.id).map(card => (
                                    <div key={card.id} draggable onDragStart={(e) => handleDragStart(e, card.id)} onClick={() => setSelectedOrder(card)} className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl shadow-lg cursor-grab active:cursor-grabbing hover:border-[#03bbd3]/50 transition-all hover:scale-[1.02] group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-mono font-bold text-[#03bbd3] bg-[#03bbd3]/10 px-2 py-1 rounded">{card.id}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${card.type === 'LOCAL' ? 'bg-[#03bbd3]/20 text-[#03bbd3]' : 'bg-[#ffce07]/20 text-[#ffce07]'}`}>{card.type}</span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-start gap-2">
                                                <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                                <div><p className="text-sm font-bold text-slate-200">{card.client}</p><p className="text-xs text-slate-400">{card.phone}</p></div>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs text-slate-300">
                                                <p className="font-bold text-white">{card.addr}</p>
                                                <p className="text-slate-500 mt-1">{card.city}, {card.state}, {card.country} CP {card.cp}</p>
                                                <p className="text-[#ffce07] mt-2 font-black bg-[#ffce07]/10 p-2 rounded-lg border border-[#ffce07]/20 break-words">REF: {card.refs}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-500">
                    Tabla DataGrid de Historial de Entregados y Cancelados
                </div>
            )}

            {/* Modal Última Milla */}
            {lastMileOrder && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={saveLastMile} className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-md animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-2">Acción de Última Milla</h3>
                        <p className="text-sm text-slate-400 mb-6">Pedido: {lastMileOrder.id} - {lastMileOrder.type}</p>
                        {lastMileOrder.type === 'LOCAL' ? (
                            <div className="space-y-4">
                                <input type="text" placeholder="Nombre del Chofer" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                                <input type="text" placeholder="Matrícula / Vehículo" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                                <input type="tel" placeholder="Teléfono del Chofer" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <select required defaultValue="" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#96c93e]">
                                    <option value="" disabled>Seleccionar Paquetería</option><option>FedEx</option><option>DHL</option><option>Estafeta</option>
                                </select>
                                <input type="text" placeholder="Número de Guía (Tracking)" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#96c93e]" />
                            </div>
                        )}
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setLastMileOrder(null)} className="flex-1 text-slate-400">Cancelar</button>
                            <button type="submit" className="flex-1 bg-[#96c93e] text-white py-3 rounded-xl font-bold">Guardar y Notificar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Bóveda de Reembolsos */}
            {selectedOrder && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <div><h3 className="text-xl font-black text-white">Detalle de Pedido {selectedOrder.id}</h3></div>
                            <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
                                <span className="text-slate-400 font-bold uppercase text-xs">Total del Pedido</span>
                                <span className="text-2xl font-black text-white">{selectedOrder.amount}</span>
                            </div>

                            <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4"><ShieldAlert className="w-6 h-6 text-red-400" /><h4 className="text-lg font-bold text-red-400">Bóveda de Reembolsos</h4></div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-red-400 uppercase mb-2">Razón de Devolución (Obligatoria para Auditoría)</label>
                                        <textarea placeholder="Explique brevemente el motivo..." required rows="2" className="w-full bg-slate-900 border border-red-500/50 rounded-xl px-4 py-3 text-white outline-none resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-red-400 uppercase mb-2">Re-Auth: PIN o Contraseña</label>
                                        <input type="password" placeholder="••••••••" required className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-3 text-white outline-none" />
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button onClick={() => { showToast('Reembolsado al Monedero de forma transparente', 'success'); setSelectedOrder(null); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold">A Monedero</button>
                                        <button onClick={() => { showToast('Reembolso a tarjeta enviado a Pasarela', 'success'); setSelectedOrder(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold">A Tarjeta B.</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3.3 PRODUCT MANAGER 
