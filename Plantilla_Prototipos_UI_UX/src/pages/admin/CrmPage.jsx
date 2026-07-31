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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../../lib/adminApi';

const fmtMoney = (value) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
}).format(Number(value ?? 0));

const fmtDate = (value) => value
    ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
    : 'Sin registro';

const getErrorMessage = (error, fallback) => error?.response?.data?.error
    || error?.response?.data?.message
    || fallback;

export const CrmView = ({ showToast, setSubBreadcrumb }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const queryClient = useQueryClient();
    const usersErrorNotified = useRef(false);
    const ledgerErrorNotified = useRef(false);

    const usersQuery = useQuery({
        queryKey: ['admin', 'users', { page: 1, limit: 100 }],
        queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/users', { params: { page: 1, limit: 100 } })),
    });

    const ledgerQuery = useQuery({
        queryKey: ['admin', 'users', selectedUser?.id, 'ledger'],
        queryFn: async () => unwrapAdmin(await adminApi.get(`/api/admin/users/${selectedUser.id}/ledger`, { params: { page: 1, limit: 100 } })),
        enabled: !!selectedUser?.id,
    });

    const banMutation = useMutation({
        mutationFn: async ({ id, isBanned }) => {
            const response = isBanned
                ? await adminApi.delete(`/api/admin/users/${id}/ban`)
                : await adminApi.post(`/api/admin/users/${id}/ban`);
            return unwrapAdmin(response);
        },
        onSuccess: (status) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            setSelectedUser((current) => current?.id === status.id
                ? { ...current, isBanned: status.isBanned }
                : current);
            showToast(status.isBanned
                ? 'Usuario suspendido. Sus sesiones y tokens fueron revocados.'
                : 'Suspensión revertida. El usuario puede autenticarse nuevamente.', 'success');
        },
        onError: (error) => showToast(getErrorMessage(error, 'No se pudo cambiar el estado de la cuenta.'), 'error'),
    });

    useEffect(() => {
        if (usersQuery.isError && !usersErrorNotified.current) {
            usersErrorNotified.current = true;
            showToast(getErrorMessage(usersQuery.error, 'No se pudo cargar el CRM.'), 'error');
        }
        if (!usersQuery.isError) usersErrorNotified.current = false;
    }, [usersQuery.isError, usersQuery.error, showToast]);

    useEffect(() => {
        if (ledgerQuery.isError && !ledgerErrorNotified.current) {
            ledgerErrorNotified.current = true;
            showToast(getErrorMessage(ledgerQuery.error, 'No se pudo cargar el libro mayor.'), 'error');
        }
        if (!ledgerQuery.isError) ledgerErrorNotified.current = false;
    }, [ledgerQuery.isError, ledgerQuery.error, showToast]);

    const users = usersQuery.data?.data ?? [];
    const ledger = ledgerQuery.data?.data ?? [];

    const openProfile = (u) => {
        setSelectedUser(u);
        setSubBreadcrumb(`Perfil: ${u.name}`);
    };

    const closeProfile = () => {
        setSelectedUser(null);
        setSubBreadcrumb('');
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div><h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">Gestor CRM y Monederos</h1><p className="text-[#e6c59e]/70 mt-1">Administración y auditoría de usuarios registrados.</p></div>
            </div>

            {!selectedUser ? (
                <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] overflow-x-auto custom-scrollbar shadow-2xl">
                    <table className="font-quicksand w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-[#0a2e0d]/80 border-b border-[#1a9a21]/30">
                            <tr className="text-[#e6c59e]/70">
                                <th className="px-6 py-4 font-bold">Cliente y Correo</th>
                                <th className="px-6 py-4 font-bold">Fecha de Registro</th>
                                <th className="px-6 py-4 font-bold">Historial de Compras</th>
                                <th className="px-6 py-4 font-bold text-[#ffce07]">Saldo del Monedero</th>
                                <th className="px-6 py-4 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a9a21]/20">
                            {usersQuery.isPending && (
                                <tr><td colSpan={5} className="px-6 py-4 text-[#e6c59e]/70"><Loader2 className="w-4 h-4 animate-spin" /> Cargando clientes…</td></tr>
                            )}
                            {usersQuery.isError && (
                                <tr><td colSpan={5} className="px-6 py-4 text-[#e6c59e]/70">No se pudo cargar el CRM.</td></tr>
                            )}
                            {!usersQuery.isPending && !usersQuery.isError && users.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-4 text-[#e6c59e]/70">No hay clientes registrados.</td></tr>
                            )}
                            {users.map((c) => (
                                <tr key={c.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4"><p className="font-bold text-white">{c.name}{c.isBanned ? ' · Suspendido' : ''}</p><p className="text-xs text-[#e6c59e]/55">{c.email}</p></td>
                                    <td className="px-6 py-4 text-[#e6c59e]/70">{fmtDate(c.createdAt)}</td>
                                    <td className="px-6 py-4 text-[#96c93e] font-medium">{c.ticketCount} tickets ({fmtMoney(c.purchaseTotal)})</td>
                                    <td className="px-6 py-4 text-[#ffce07] font-bold bg-[#123d17]/30">{fmtMoney(c.walletBalance)}</td>
                                    <td className="px-6 py-4"><button onClick={() => openProfile(c)} className="bg-[#123d17] border border-[#1a9a21]/35 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1a9a21]/30 text-[#03bbd3]">Ver Perfil</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-[#123d17] border border-[#1a9a21]/30 rounded-3xl p-4 sm:p-6 md:p-8 animate-in slide-in-from-right-8">
                    <div className="flex justify-between items-start gap-3 mb-8">
                        <div className="flex min-w-0 gap-3 sm:gap-4 items-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-[#1a9a21] rounded-full flex items-center justify-center text-xl sm:text-2xl font-black text-white/50">{selectedUser.name.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0"><h2 className="text-xl sm:text-2xl font-black text-white break-words">{selectedUser.name}</h2><p className="text-sm text-[#e6c59e]/70 break-all">{selectedUser.email}</p></div>
                        </div>
                        <button onClick={closeProfile} className="text-[#e6c59e]/55 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                        <div className="bg-[#0a2e0d]/50 p-4 sm:p-6 rounded-2xl border border-[#1a9a21]/30">
                            <h4 className="text-sm font-bold text-[#e6c59e]/70 mb-4">Libro Mayor Individual (Ledger)</h4>
                            <p className="text-sm text-[#e6c59e]/90">Privacidad aceptada: <span className="font-mono text-[#03bbd3] bg-[#03bbd3]/10 px-2 py-0.5 rounded">{fmtDate(selectedUser.privacyAcceptedAt)}</span></p>
                            {ledgerQuery.isPending && <p className="text-sm text-[#e6c59e]/90 mt-2">Cargando movimientos…</p>}
                            {ledgerQuery.isError && <p className="text-sm text-[#e6c59e]/90 mt-2">No fue posible consultar el ledger.</p>}
                            {!ledgerQuery.isPending && !ledgerQuery.isError && ledger.length === 0 && <p className="text-sm text-[#e6c59e]/90 mt-2">Sin movimientos registrados.</p>}
                            {ledger.map((transaction) => (
                                <p key={transaction.id} className="text-sm text-[#e6c59e]/90 mt-2">
                                    {fmtDate(transaction.createdAt)} · {transaction.source}: <span className="font-mono text-[#e6c59e]/70">{transaction.type === 'DEPOSIT' ? '+' : '-'}{fmtMoney(transaction.amount)}</span>
                                </p>
                            ))}
                        </div>
                        <div className="bg-[#0a2e0d]/50 p-4 sm:p-6 rounded-2xl border border-[#1a9a21]/30">
                            <h4 className="text-sm font-bold text-[#e6c59e]/70 mb-4">Estado del Monedero</h4>
                            <p className="text-3xl font-black text-[#ffce07] mb-2">{fmtMoney(selectedUser.walletBalance)}</p>
                            <p className="text-xs text-red-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Expira legalmente el: {fmtDate(selectedUser.walletExpiresAt)}</p>
                        </div>
                    </div>

                    <div className="border-t border-[#1a9a21]/30 pt-6 flex justify-stretch sm:justify-end">
                        <button disabled={banMutation.isPending} onClick={() => banMutation.mutate({ id: selectedUser.id, isBanned: selectedUser.isBanned })} className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
                            <Ban className="w-4 h-4" /> {banMutation.isPending ? 'Procesando…' : selectedUser.isBanned ? 'Revertir Suspensión' : 'Suspender Cuenta (Bloqueo Fraude)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3.6 GESTOR DE CUPONES
