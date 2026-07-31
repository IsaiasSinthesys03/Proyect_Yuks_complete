import React, { useEffect, useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../../lib/adminApi';

const emptyForm = { code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', expiresAt: '' };
const errorMessage = (error) => error.response?.data?.error || error.response?.data?.message || 'No fue posible completar la operación.';

export const CouponsView = ({ showToast }) => {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const couponsQuery = useQuery({
        queryKey: ['admin', 'coupons'],
        queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/coupons')),
    });
    const detailQuery = useQuery({
        queryKey: ['admin', 'coupons', selectedId],
        queryFn: async () => unwrapAdmin(await adminApi.get(`/api/admin/coupons/${selectedId}`)),
        enabled: Boolean(selectedId),
    });

    useEffect(() => {
        if (!detailQuery.data) return;
        const coupon = detailQuery.data;
        setForm({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: String(coupon.discountValue),
            maxUses: String(coupon.maxUses),
            expiresAt: new Date(coupon.expiresAt).toISOString().slice(0, 10),
        });
    }, [detailQuery.data]);

    const saveMutation = useMutation({
        mutationFn: async (payload) => selectedId
            ? unwrapAdmin(await adminApi.put(`/api/admin/coupons/${selectedId}`, payload))
            : unwrapAdmin(await adminApi.post('/api/admin/coupons', payload)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
            showToast(selectedId ? 'Cupón actualizado' : 'Cupón creado', 'success');
            setShowForm(false);
            setSelectedId(null);
            setForm(emptyForm);
        },
        onError: (error) => showToast(errorMessage(error), 'error'),
    });
    const toggleMutation = useMutation({
        mutationFn: async (id) => unwrapAdmin(await adminApi.patch(`/api/admin/coupons/${id}/toggle`, {})),
        onSuccess: (coupon) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
            showToast(`Campaña ${coupon.isActive ? 'activada' : 'desactivada'} en tiempo real sin destruir registro histórico.`, coupon.isActive ? 'success' : 'warning');
        },
        onError: (error) => showToast(errorMessage(error), 'error'),
    });

    const openCreate = () => {
        setSelectedId(null);
        setForm(emptyForm);
        setShowForm(true);
    };
    const openEdit = (id) => {
        setSelectedId(id);
        setShowForm(true);
    };
    const submit = (event) => {
        event.preventDefault();
        saveMutation.mutate({
            code: form.code.trim().toUpperCase(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            maxUses: Number(form.maxUses),
            expiresAt: new Date(`${form.expiresAt}T23:59:59.999`).toISOString(),
        });
    };

    const coupons = couponsQuery.data ?? [];
    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div><h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">Gestor de Cupones</h1><p className="text-[#e6c59e]/70 mt-1">Creación y administración de códigos de descuento.</p></div>
                <button onClick={openCreate} className="bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] px-6 py-4 rounded-2xl text-[10px] font-bungee leading-none flex items-center gap-2 shadow-lg shadow-[#96c93e]/20"><Plus className="w-5 h-5" /> NUEVO CUPÓN</button>
            </div>

            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 shadow-2xl">
                {couponsQuery.isPending && <p className="text-sm text-[#e6c59e]/70">Cargando cupones…</p>}
                {couponsQuery.isError && <p className="text-sm text-red-400">No fue posible cargar los cupones.</p>}
                {!couponsQuery.isPending && !couponsQuery.isError && coupons.length === 0 && <p className="text-sm text-[#e6c59e]/70">No hay cupones registrados.</p>}
                <div className="space-y-4">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a2e0d] p-4 rounded-xl border border-[#1a9a21]/30">
                            <div>
                                <div className="flex items-center gap-3"><span onClick={() => openEdit(coupon.id)} title="Editar cupón" className="text-lg font-mono font-bold text-[#03bbd3] bg-[#03bbd3]/10 px-3 py-1 rounded border border-[#03bbd3]/20">{coupon.code}</span><span className="text-xs bg-[#1a5521] text-[#e6c59e]/90 px-2 py-0.5 rounded">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% Dto.` : `$${coupon.discountValue} MXN`}</span></div>
                                <p className="text-xs text-[#e6c59e]/70 mt-2">Fecha de expiración estricta: {new Date(coupon.expiresAt).toLocaleDateString('es-MX')} • Usos: {coupon.currentUses}/{coupon.maxUses}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-[#03bbd3]">{coupon.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                                <ToggleRight className="w-8 h-8 text-[#03bbd3] cursor-pointer" onClick={() => !toggleMutation.isPending && toggleMutation.mutate(coupon.id)} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-[#061f09]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={submit} className="mobile-scroll-safe bg-[#0a2e0d]/95 border border-[#1a9a21]/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-lg animate-in zoom-in-95 shadow-2xl shadow-black/50">
                        <h3 className="text-xl font-bold text-white mb-6">{selectedId ? 'Editar Código Promocional' : 'Crear Código Promocional'}</h3>
                        {detailQuery.isPending && selectedId && <p className="text-sm text-[#e6c59e]/70 mb-4">Cargando detalle…</p>}
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-1">Código (Alfanumérico)</label><input required type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ej. BUENFIN" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white font-mono uppercase outline-none" /></div>
                            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-1">Tipo / Monto Directo</label>
                                    <div className="flex bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl overflow-hidden">
                                        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="bg-[#123d17] text-white px-2 py-3 border-r border-[#1a9a21]/30 outline-none text-xs"><option value="PERCENTAGE">%</option><option value="FIXED_AMOUNT">$ MXN</option></select>
                                        <input required min="1" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="flex-1 bg-transparent px-3 py-3 text-white outline-none" />
                                    </div>
                                </div>
                                <div><label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-1">Límite usos globales</label><input required min="1" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white outline-none" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-1">Fecha de Expiración Estricta</label><input required type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-white outline-none" /></div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => { setShowForm(false); setSelectedId(null); }} className="flex-1 text-[#e6c59e]/70">Cancelar</button>
                            <button disabled={saveMutation.isPending || (selectedId && detailQuery.isPending)} type="submit" className="flex-1 bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] py-3 rounded-2xl font-black disabled:opacity-60">{saveMutation.isPending ? 'Guardando…' : selectedId ? 'Guardar Cambios' : 'Activar Cupón'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// 3.7 MEDIA VIEW
