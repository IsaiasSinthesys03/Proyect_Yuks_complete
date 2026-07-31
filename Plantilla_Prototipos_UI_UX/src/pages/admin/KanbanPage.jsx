import React, { useState, useEffect, useRef } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminOrders, updateOrderStatus, refundOrder } from '../../api/adminOrders';
import { onAdminRealtimeEvent } from '../../lib/adminWs';

/** Columna del tablero ↔ status REAL del backend (máquina de estados, Fase 49). */
const COLUMNS = [
    { id: 'pago',    status: 'PAID',       title: 'Pago Confirmado', color: 'border-[#03bbd3] text-[#03bbd3]' },
    { id: 'empaque', status: 'PREPARING',  title: 'Empaquetando',    color: 'border-[#ffce07] text-[#ffce07]' },
    { id: 'camino',  status: 'SHIPPED',    title: 'En Camino',       color: 'border-[#1a9a21] text-[#1a9a21]' },
    { id: 'reparto', status: 'DELIVERING', title: 'En Reparto',      color: 'border-[#96c93e] text-[#96c93e]' },
];
const ACTIVE_STATUSES = COLUMNS.map(c => c.status);
const fmtMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

export const KanbanView = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState('activos');
    const [selectedOrder, setSelectedOrder] = useState(null);   // Bóveda de reembolsos
    const [lastMileOrder, setLastMileOrder] = useState(null);   // Modal chofer/guía (→ SHIPPED)

    // Última milla (controlados)
    const [driverName, setDriverName] = useState('');
    const [driverVehicle, setDriverVehicle] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [trackingCompany, setTrackingCompany] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');

    // Bóveda (controlados)
    const [refundReason, setRefundReason] = useState('');
    const [refundPassword, setRefundPassword] = useState('');

    const queryClient = useQueryClient();
    const { data: orders } = useAdminOrders();
    const cards = (orders ?? []).filter(o => ACTIVE_STATUSES.includes(o.status));
    const history = (orders ?? []).filter(o => !ACTIVE_STATUSES.includes(o.status));

    const scrollContainerRef = useRef(null);

    // Permitir scroll horizontal con la rueda del ratón
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            // Evitar interferir si estamos haciendo scroll vertical dentro de una columna
            const isOverColumn = e.target.closest('.overflow-y-auto');
            if (!isOverColumn && e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [activeTab]);

    // ▓ SOCKET LIVE (CMS-FE-04) ▓ Cualquier cambio de pedido (otro admin o el
    // sistema) emite `admin:order_updated` → refetch → la tarjeta "vuela" sola.
    useEffect(() => {
        const off = onAdminRealtimeEvent('admin:order_updated', (p) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
            showToast(`Pedido #${String(p.orderId).slice(0, 8).toUpperCase()} → ${p.newStatus} (live)`, 'success');
        });
        return off;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** PATCH real del estado. El backend valida la máquina de estados (422). */
    const moveMutation = useMutation({
        mutationFn: ({ orderId, body }) => updateOrderStatus(orderId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
        },
        onError: (e) => showToast(e?.response?.data?.error || 'Transición inválida.', 'error'),
    });

    const refundMutation = useMutation({
        mutationFn: ({ orderId, amount }) => refundOrder(orderId, { amount, reason: refundReason.trim(), currentPassword: refundPassword }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
            showToast('Reembolso ejecutado y auditado.', 'success');
            setSelectedOrder(null);
            setRefundReason(''); setRefundPassword('');
        },
        // 401 = re-auth fallida (contraseña del admin incorrecta) → la pasarela NUNCA se tocó
        onError: (e) => showToast(e?.response?.data?.error || 'No se pudo ejecutar el reembolso.', 'error'),
    });

    const handleDragStart = (e, cardId) => e.dataTransfer.setData('cardId', cardId);
    const handleDrop = (e, colId) => {
        const cardId = e.dataTransfer.getData('cardId');
        const card = cards.find(c => c.id === cardId);
        const targetStatus = COLUMNS.find(c => c.id === colId)?.status;
        if (!card || !targetStatus || card.status === targetStatus) return;

        if (targetStatus === 'SHIPPED') {
            // Última milla OBLIGATORIA: chofer (LOCAL) o paquetería+guía (foráneo)
            setDriverName(''); setDriverVehicle(''); setDriverPhone('');
            setTrackingCompany(''); setTrackingNumber('');
            setLastMileOrder(card);
            return;
        }
        moveMutation.mutate({ orderId: card.id, body: { status: targetStatus } });
    };

    const saveLastMile = (e) => {
        e.preventDefault();
        const body = lastMileOrder.deliveryType === 'LOCAL'
            ? { status: 'SHIPPED', driverName: driverName.trim(), driverVehicle: driverVehicle.trim(), driverPhone: driverPhone.trim() }
            : { status: 'SHIPPED', trackingCompany, trackingNumber: trackingNumber.trim() };
        moveMutation.mutate({ orderId: lastMileOrder.id, body }, {
            onSuccess: () => showToast('Última milla guardada. El cliente fue notificado (email + WS).', 'success'),
        });
        setLastMileOrder(null);
    };

    const shortId = (id) => `#${String(id).slice(0, 8).toUpperCase()}`;

    return (
        <div className="h-full flex flex-col animate-in fade-in relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 shrink-0">
                <div>
                    <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight flex items-center gap-3">
                        Logística (Kanban)
                        <span className="bg-[#96c93e]/20 text-[#96c93e] text-xs px-2 py-1 rounded-full border border-[#96c93e]/30 flex items-center gap-1 font-bold">
                            <Wifi className="w-3 h-3 animate-pulse" /> WebSockets Live
                        </span>
                    </h1>
                    <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2 sm:flex sm:gap-4 mt-4">
                        <button onClick={() => setActiveTab('activos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'activos' ? 'bg-[#96c93e] text-white' : 'bg-[#123d17] text-[#e6c59e]/70'}`}>Pedidos Activos</button>
                        <button onClick={() => setActiveTab('historial')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'historial' ? 'bg-[#96c93e] text-white' : 'bg-[#123d17] text-[#e6c59e]/70'}`}>Historial Finalizados</button>
                    </div>
                </div>
            </div>

            {activeTab === 'activos' ? (
                <div ref={scrollContainerRef} className="flex-1 flex gap-4 sm:gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
                    {COLUMNS.map(col => (
                        <div key={col.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.id)} className={`flex flex-col w-[calc(100vw-2.75rem)] max-w-[26rem] shrink-0 snap-center bg-[#0a2e0d]/40 backdrop-blur-xl rounded-[32px] border-t-[6px] ${col.color.split(' ')[0]} border-[#1a9a21]/20 shadow-2xl`}>
                            <div className="p-4 flex items-center justify-between border-b border-[#1a9a21]/20">
                                <h3 className={`font-bold ${col.color.split(' ')[1]}`}>{col.title}</h3>
                                <span className="bg-white/5 text-[#e6c59e]/70 text-xs px-2 py-1 rounded-lg">{cards.filter(c => c.status === col.status).length}</span>
                            </div>
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                                {cards.filter(c => c.status === col.status).length === 0 && (
                                    <p className="text-sm text-[#e6c59e]/55 font-medium py-8 text-center">No hay pedidos en esta etapa.</p>
                                )}
                                {cards.filter(c => c.status === col.status).map(card => (
                                    <div key={card.id} draggable onDragStart={(e) => handleDragStart(e, card.id)} onClick={() => { setRefundReason(''); setRefundPassword(''); setSelectedOrder(card); }} className="bg-white/5 backdrop-blur-sm border border-[#1a9a21]/30 p-5 rounded-2xl shadow-lg cursor-grab active:cursor-grabbing hover:border-[#03bbd3]/50 transition-all hover:scale-[1.02] group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-mono font-bold text-[#03bbd3] bg-[#03bbd3]/10 px-2 py-1 rounded">{shortId(card.id)}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${card.deliveryType === 'LOCAL' ? 'bg-[#03bbd3]/20 text-[#03bbd3]' : 'bg-[#ffce07]/20 text-[#ffce07]'}`}>{card.deliveryType ?? '—'}</span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-start gap-2">
                                                <User className="w-4 h-4 text-[#e6c59e]/55 shrink-0 mt-0.5" />
                                                <div><p className="text-sm font-bold text-[#e6c59e]">{card.clientName}</p><p className="text-xs text-[#e6c59e]/70">{card.clientPhone ?? 'Sin teléfono'}</p></div>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-[#1a9a21]/20 text-xs text-[#e6c59e]/90">
                                                <p className="font-bold text-white">{card.shippingAddress}</p>
                                                <p className="text-[#e6c59e]/55 mt-1">{card.municipality}, {card.state} CP {card.postalCode}</p>
                                                <p className="text-[#96c93e] mt-2 font-black bg-[#96c93e]/10 p-2 rounded-lg border border-[#96c93e]/20">{card.itemCount} {card.itemCount === 1 ? 'artículo' : 'artículos'} · {fmtMoney(card.totalPaid)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* [Fase 49] Historial real (DELIVERED / CANCELLED) */
                <div className="flex-1 bg-[#0a2e0d]/40 backdrop-blur-xl rounded-[32px] border border-[#1a9a21]/20 shadow-2xl p-6 overflow-auto custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[#e6c59e]/55">Sin pedidos finalizados todavía.</div>
                    ) : (
                        <table className="font-quicksand w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-[#1a9a21]/20 border-b border-[#1a9a21]/20">
                                <tr className="text-[#e6c59e]/70 border-b border-[#1a9a21]/20">
                                    <th className="pb-3 font-medium">Pedido</th>
                                    <th className="pb-3 font-medium">Cliente</th>
                                    <th className="pb-3 font-medium">Fecha</th>
                                    <th className="pb-3 font-medium">Total</th>
                                    <th className="pb-3 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1a9a21]/20">
                                {history.map(o => (
                                    <tr key={o.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 font-mono text-xs text-[#03bbd3]">{shortId(o.id)}</td>
                                        <td className="py-4 text-[#e6c59e]/90">{o.clientName}</td>
                                        <td className="py-4 text-[#e6c59e]/70">{fmtDate(o.createdAt)}</td>
                                        <td className="py-4 font-bold text-white">{fmtMoney(o.totalPaid)}</td>
                                        <td className="py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${o.status === 'DELIVERED' ? 'bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{o.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal Última Milla — OBLIGATORIO al soltar en "En Camino" (SHIPPED) */}
            {lastMileOrder && (
                <div className="fixed inset-0 bg-[#061f09]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={saveLastMile} className="mobile-scroll-safe bg-[#123d17] border border-[#1a9a21]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-2">Acción de Última Milla</h3>
                        <p className="text-sm text-[#e6c59e]/70 mb-6">Pedido: {shortId(lastMileOrder.id)} · {lastMileOrder.deliveryType}</p>
                        {lastMileOrder.deliveryType === 'LOCAL' ? (
                            <div className="space-y-4">
                                <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Nombre del Chofer" required className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                                <input type="text" value={driverVehicle} onChange={e => setDriverVehicle(e.target.value)} placeholder="Matrícula / Vehículo" required className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                                <input type="tel" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="Teléfono del Chofer" required className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <select required value={trackingCompany} onChange={e => setTrackingCompany(e.target.value)} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white outline-none focus:border-[#96c93e]">
                                    <option value="" disabled>Seleccionar Paquetería</option><option>FedEx</option><option>DHL</option><option>Estafeta</option>
                                </select>
                                <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Número de Guía (Tracking)" required className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white outline-none focus:border-[#96c93e]" />
                            </div>
                        )}
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setLastMileOrder(null)} className="flex-1 text-[#e6c59e]/70">Cancelar</button>
                            <button type="submit" disabled={moveMutation.isPending} className="flex-1 bg-[#96c93e] text-white py-3 rounded-xl font-bold disabled:opacity-60">Guardar y Notificar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Bóveda de Reembolsos — RE-AUTENTICACIÓN obligatoria (server-side Argon2) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-[#061f09]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="mobile-scroll-safe bg-[#123d17] border border-[#1a9a21]/30 rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-y-auto shadow-2xl animate-in zoom-in-95">
                        <div className="p-4 sm:p-6 border-b border-[#1a9a21]/30 flex justify-between items-start gap-3 bg-[#0a2e0d]/50">
                            <div><h3 className="text-xl font-black text-white">Detalle de Pedido {shortId(selectedOrder.id)}</h3></div>
                            <button onClick={() => setSelectedOrder(null)} className="text-[#e6c59e]/55 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-6">
                            <div className="flex justify-between items-center bg-[#0a2e0d] p-4 rounded-xl border border-[#1a9a21]/30">
                                <span className="text-[#e6c59e]/70 font-bold uppercase text-xs">Total del Pedido</span>
                                <span className="text-2xl font-black text-white">{fmtMoney(selectedOrder.totalPaid)}</span>
                            </div>

                            <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4"><ShieldAlert className="w-6 h-6 text-red-400" /><h4 className="text-lg font-bold text-red-400">Bóveda de Reembolsos</h4></div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-red-400 uppercase mb-2">Razón de Devolución (Obligatoria para Auditoría)</label>
                                        <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Explique brevemente el motivo..." required rows="2" className="w-full bg-[#0a2e0d] border border-red-500/50 rounded-xl px-4 py-3 text-white outline-none resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-red-400 uppercase mb-2">Re-Auth: Contraseña del Administrador</label>
                                        <input type="password" value={refundPassword} onChange={e => setRefundPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-[#0a2e0d] border border-red-500/30 rounded-xl px-4 py-3 text-white outline-none" />
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={() => {
                                                if (!refundReason.trim()) { showToast('La razón es obligatoria para la auditoría.', 'error'); return; }
                                                if (!refundPassword) { showToast('Confirma tu contraseña (re-autenticación).', 'error'); return; }
                                                refundMutation.mutate({ orderId: selectedOrder.id, amount: selectedOrder.totalPaid });
                                            }}
                                            disabled={refundMutation.isPending}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {refundMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando…</> : 'Ejecutar Reembolso (Pasarela)'}
                                        </button>
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
