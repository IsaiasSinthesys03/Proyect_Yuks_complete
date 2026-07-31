import React, { useEffect, useState, useRef } from 'react';
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

const errorMessage = (error) => error.response?.data?.message || error.response?.data?.error || 'No fue posible completar la operación.';

export const DonationsView = ({ showToast }) => {
    const queryClient = useQueryClient();
    const [minimum, setMinimum] = useState('10');
    const [quickAmounts, setQuickAmounts] = useState(['10', '20', '30']);
    const [donationTitle, setDonationTitle] = useState('Apoya el Proyecto');
    const [donationDescription, setDonationDescription] = useState('Tu aportación nos ayuda a mantener los servidores encendidos. 💖');
    const donationsQuery = useQuery({
        queryKey: ['admin', 'donations'],
        queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/donations', { params: { page: 1, limit: 20 } })),
    });
    const settingsQuery = useQuery({
        queryKey: ['admin', 'settings'],
        queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/settings')),
    });
    useEffect(() => {
        if (settingsQuery.data) {
            if (settingsQuery.data.donationMinAmount != null) setMinimum(String(settingsQuery.data.donationMinAmount));
            if (settingsQuery.data.donationQuickAmounts?.length === 3) {
                setQuickAmounts(settingsQuery.data.donationQuickAmounts.map(String));
            }
            if (settingsQuery.data.donationTitle) setDonationTitle(settingsQuery.data.donationTitle);
            if (settingsQuery.data.donationDescription) setDonationDescription(settingsQuery.data.donationDescription);
        }
    }, [settingsQuery.data]);
    const updateMinimumMutation = useMutation({
        mutationFn: async () => unwrapAdmin(await adminApi.put('/api/admin/settings', { 
            donationMinAmount: Number(minimum),
            donationQuickAmounts: quickAmounts.map(Number),
            donationTitle,
            donationDescription,
        })),
        onSuccess: (data) => {
            queryClient.setQueryData(['admin', 'settings'], data);
            showToast('Monto mínimo de donación actualizado', 'success');
        },
        onError: (error) => showToast(errorMessage(error), 'error'),
    });
    const uploadBannerMutation = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            return unwrapAdmin(await adminApi.post('/api/admin/settings/donation-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
            showToast('Banner de donaciones actualizado', 'success');
        },
        onError: (error) => showToast(errorMessage(error), 'error'),
    });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadBannerMutation.mutate(file);
    };

    const donations = donationsQuery.data?.data ?? [];
    const donationBannerUrl = settingsQuery.data?.donationBannerUrl;

    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div>
                <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">Gestor del Modal de Donaciones</h1>
                <p className="text-[#ec1676] mt-1 font-bold uppercase tracking-widest text-[10px]">Módulo dedicado para modificar el panel del cliente.</p>
            </div>

            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 lg:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ec1676]/10 blur-[50px] pointer-events-none"></div>

                <div className="space-y-6 relative z-10">
                    <div className="flex gap-6">
                        <div className="w-1/3 flex flex-col gap-2">
                            <label className="text-xs font-bold text-[#e6c59e]/70 uppercase">Banner del Pop-Up Front</label>
                            <label className="aspect-video bg-[#0a2e0d] border-2 border-dashed border-[#1a9a21]/30 rounded-xl flex flex-col items-center justify-center text-[#e6c59e]/55 hover:border-[#ec1676]/50 transition-colors cursor-pointer relative overflow-hidden group">
                                <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileChange} disabled={uploadBannerMutation.isPending} />
                                
                                {uploadBannerMutation.isPending ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#ec1676]" />
                                        <span className="text-xs font-bold text-[#ec1676]">Subiendo...</span>
                                    </div>
                                ) : donationBannerUrl ? (
                                    <>
                                        <img src={donationBannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ImageIcon className="w-8 h-8 mb-2 text-white" />
                                            <span className="text-xs font-bold text-white text-center px-4">Cambiar Ilustración</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-xs font-bold text-center px-4">Subir Ilustración<br />(Ej. Temática Halloween)</span>
                                    </>
                                )}
                            </label>

                            <div className="mt-4 space-y-3 border-t border-[#1a9a21]/20 pt-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[#e6c59e]/70 uppercase mb-1 block">Título del Modal</label>
                                    <input type="text" value={donationTitle} onChange={(e) => setDonationTitle(e.target.value)} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ec1676] outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#e6c59e]/70 uppercase mb-1 block">Descripción corta</label>
                                    <textarea value={donationDescription} onChange={(e) => setDonationDescription(e.target.value)} rows="3" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ec1676] outline-none transition-colors resize-none" />
                                </div>
                            </div>
                        </div>

                        <div className="w-2/3 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#ec1676] uppercase mb-2">Botones de Acceso Rápido (Chips)</label>
                                <div className="grid grid-cols-1 min-[390px]:grid-cols-3 gap-3">
                                    {quickAmounts.map((amount, index) => (
                                        <div key={index} className="relative">
                                            <span className="absolute left-3 top-2 text-[#e6c59e]/70 font-bold text-sm">$</span>
                                            <input 
                                                type="number" 
                                                value={amount} 
                                                onChange={(e) => {
                                                    const newAmounts = [...quickAmounts];
                                                    newAmounts[index] = e.target.value;
                                                    setQuickAmounts(newAmounts);
                                                }}
                                                className="w-full bg-[#0a2e0d] border border-[#ec1676]/30 focus:border-[#ec1676] rounded-lg pl-7 pr-3 py-2 text-[#ec1676] font-bold outline-none transition-colors" 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[#e6c59e]/55 mt-1">El 4to botón siempre dirá "Otra cantidad" dinámicamente en el front.</p>
                            </div>

                            <div className="pt-2 border-t border-[#1a9a21]/30">
                                <label className="block text-xs font-bold text-[#ec1676] uppercase mb-2">Input Libre: Monto Mínimo Permitido (Antifraude)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-[#e6c59e]/70 font-bold">$</span>
                                    <input min="1" type="number" value={minimum} onChange={(e) => setMinimum(e.target.value)} className="w-full bg-[#0a2e0d] border-[#ec1676]/50 rounded-xl pl-8 pr-4 py-3 text-[#ec1676] font-bold outline-none" />
                                </div>
                                <p className="text-[10px] text-[#e6c59e]/55 mt-1">Evita errores de procesamiento de cobros mínimos en Stripe.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a2e0d]/50 p-4 rounded-xl border border-[#1a9a21]/30">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#96c93e]" /> Transparencia Fiscal Activada
                        </h4>
                        <p className="text-xs text-[#e6c59e]/70">Si un usuario anónimo intenta donar, el frontend le exigirá un correo electrónico obligatorio para enviar el recibo.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#1a9a21]/30">
                        <button disabled={updateMinimumMutation.isPending} type="button" onClick={() => updateMinimumMutation.mutate()} className="bg-[#ec1676] hover:bg-[#d11368] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg">
                            {updateMinimumMutation.isPending ? 'Actualizando…' : 'Actualizar Modal UI'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-[40px] overflow-x-auto custom-scrollbar shadow-2xl">
                <table className="font-quicksand w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-[#0a2e0d]/80 border-b border-[#1a9a21]/30"><tr className="text-[#e6c59e]/70"><th className="px-6 py-4 font-bold">Fecha</th><th className="px-6 py-4 font-bold">Donante</th><th className="px-6 py-4 font-bold">Monto</th><th className="px-6 py-4 font-bold">Estado</th></tr></thead>
                    <tbody className="divide-y divide-[#1a9a21]/20">
                        {donationsQuery.isPending && <tr><td colSpan="4" className="px-6 py-4 text-[#e6c59e]/70">Cargando historial…</td></tr>}
                        {donationsQuery.isError && <tr><td colSpan="4" className="px-6 py-4 text-red-400">No fue posible cargar las donaciones.</td></tr>}
                        {!donationsQuery.isPending && !donationsQuery.isError && donations.length === 0 && <tr><td colSpan="4" className="px-6 py-4 text-[#e6c59e]/70">No hay donaciones registradas.</td></tr>}
                        {donations.map((donation) => <tr key={donation.id} className="hover:bg-white/5"><td className="px-6 py-4 text-[#e6c59e]/70 font-mono text-xs">{new Date(donation.createdAt).toLocaleString('es-MX')}</td><td className="px-6 py-4 text-[#e6c59e] font-bold">{donation.donorEmail}</td><td className="px-6 py-4 text-[#ec1676] font-bold">${Number(donation.amount).toFixed(2)}</td><td className="px-6 py-4 text-[#e6c59e]/70">{donation.status}</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 3.12 LEGAL VIEW
