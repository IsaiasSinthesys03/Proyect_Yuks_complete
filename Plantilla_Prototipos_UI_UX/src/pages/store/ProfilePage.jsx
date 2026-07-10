import React, { useState, useEffect, useRef } from 'react';
import {
    ShoppingCart, User, Menu, X, ChevronRight, ChevronLeft, Heart, Play,
    Search, Filter, ChevronDown, Package, MapPin, CreditCard,
    Ticket, Gamepad2, Bell, Copy, CheckCircle2, Truck, Box,
    Home, LogOut, HeartHandshake, Mail, Lock, ShieldAlert,
    AlertTriangle, Settings, Image as ImageIcon, Clock,
    Smartphone, FileText, CheckSquare, Youtube, Cat, Coins,
    Facebook, Instagram, Twitter, Eye, EyeOff, Trash2, ArrowLeft, Plus, Loader2,
    Sparkles, Terminal, Eye as ViewIcon, Zap, Navigation, Star, Share2, ShieldCheck
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    useProfile, useOrders, useOrderDetail, cancelOrder, useRewards, useUnreadCount,
    useWalletLedger, useAvailableCoupons, redeemCoupon, useWishlist, removeFromWishlist,
    useNotifications, markNotificationRead, markAllNotificationsRead,
    updateProfile, requestOtp,
} from '../../api/profile';
import { useAddresses, createAddress, deleteAddress, setDefaultAddress } from '../../api/checkout';
import { useNotificationStore } from '../../store/notificationStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { quickAdd } from '../../lib/quickAdd';
import { tierDisplay, tierProgress } from '../../lib/gamification';

/** [Fase 45] Tiempo relativo para la bandeja ("Hace 2 minutos"). */
const timeAgo = (d) => {
    const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
    if (s < 60) return 'Hace un momento';
    if (s < 3600) return `Hace ${Math.floor(s / 60)} minuto${Math.floor(s / 60) === 1 ? '' : 's'}`;
    if (s < 86400) return `Hace ${Math.floor(s / 3600)} hora${Math.floor(s / 3600) === 1 ? '' : 's'}`;
    return `Hace ${Math.floor(s / 86400)} día${Math.floor(s / 86400) === 1 ? '' : 's'}`;
};

/**
 * [Fase 44] Cuenta regresiva VIVA para cupones (REQ-FE-21): calcula el restante
 * contra `expiresAt` REAL de la BD y se re-renderiza cada segundo. >24h muestra
 * días; expirado muestra "EXPIRADO".
 */
const CouponCountdown = ({ expiresAt }) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const ms = new Date(expiresAt).getTime() - now;
    if (ms <= 0) return <span className="font-mono text-base">EXPIRADO</span>;
    const pad = (n) => String(n).padStart(2, '0');
    const days = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return <span className="font-mono text-base">{days > 0 ? `${days}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`}</span>;
};

// [Fase 43] Mapeo de estados REALES del backend → timeline de 5 pasos (REQ-FE-23)
const STATUS_STEP = { PAID: 1, PREPARING: 2, SHIPPED: 3, DELIVERING: 4, DELIVERED: 5 };
const STATUS_LABEL = {
    PAYMENT_PENDING: 'Pago Pendiente',
    PAID: 'Pago Confirmado',
    PREPARING: 'Empaquetando',
    SHIPPED: 'En Camino',
    DELIVERING: 'En Reparto',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    NEEDS_RECONCILIATION: 'En Revisión',
};
const ACTIVE_STATUSES = ['PAYMENT_PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERING'];
const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

export const ProfileDashboard = ({ showToast, setShowOtpModal, navigate }) => {
    const [activeTab, setActiveTab] = useState('orders');

    // States for interactive panels
    const [orderSubTab, setOrderSubTab] = useState('active');
    const [viewingOrder, setViewingOrder] = useState(null); // id del pedido abierto
    const [showAddCard, setShowAddCard] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);

    // ── [Fase 43] Datos REALES ──
    const queryClient = useQueryClient();
    const { data: me } = useProfile();
    const { data: orders } = useOrders();
    const { data: orderDetail } = useOrderDetail(viewingOrder);
    const { data: rewards } = useRewards(activeTab === 'rewards');
    useUnreadCount();
    const unread = useNotificationStore((s) => s.unreadCount);

    // ── [Fase 44] Monedero · Cupones · Wishlist ──
    const { data: ledger } = useWalletLedger(activeTab === 'wallet');
    const { data: coupons } = useAvailableCoupons(activeTab === 'coupons');
    const { data: wishlist } = useWishlist(activeTab === 'wishlist');
    const cartSubtotal = useCartStore((s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const [couponInput, setCouponInput] = useState('');

    // Canje de cupón: valida contra el subtotal REAL del carrito (el backend
    // aplica minPurchaseAmount). 404/410/422 → toast legible.
    const redeemMutation = useMutation({
        mutationFn: () => redeemCoupon(couponInput.trim().toUpperCase(), cartSubtotal),
        onSuccess: (r) => {
            const etiqueta = r.discountType === 'PERCENTAGE' ? `${r.discountValue}%` : `$${Number(r.discountValue).toFixed(2)}`;
            showToast(`Cupón válido: ${etiqueta} de descuento (ahorras $${Number(r.finalDiscount).toFixed(2)}). Aplícalo en el checkout.`, 'success');
        },
        onError: (error) => showToast(error?.response?.data?.message || 'Código inválido', 'warning'),
    });

    // Quitar de favoritos (DELETE) + refetch de la lista
    const removeWishMutation = useMutation({
        mutationFn: (productId) => removeFromWishlist(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'wishlist'] });
            showToast('Eliminado de favoritos', 'success');
        },
        onError: () => showToast('No se pudo eliminar.', 'error'),
    });

    // Mapeo del ledger (REQ-FE-20): DEPOSIT=verde(+) / WITHDRAWAL=rojo(−)
    const LEDGER_CONCEPT = { CANCELLATION: 'Reembolso Pedido Cancelado', REFUND: 'Reembolso Aprobado', PURCHASE: 'Aplicado a Compra' };

    // ── [Fase 45] Notificaciones · Direcciones · Seguridad ──
    const { data: notifications } = useNotifications(activeTab === 'notifications');
    const { data: addresses } = useAddresses(activeTab === 'addresses');
    const setOtpPurpose = useUiStore((s) => s.setOtpPurpose);

    // Marcar leída (fila/trash) → el badge del notificationStore baja al refetch del unread-count
    const readOneMutation = useMutation({
        mutationFn: (id) => markNotificationRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'notifications'] });
        },
    });
    const readAllMutation = useMutation({
        mutationFn: () => markAllNotificationsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'notifications'] });
            showToast('Bandeja al día', 'success');
        },
    });

    // Direcciones: crear / eliminar / marcar principal (REQ-FE-17)
    const [addrForm, setAddrForm] = useState({ cp: '', street: '', exteriorNumber: '', neighborhood: '', label: '', references: '' });
    const addrAuto = addrForm.cp.length === 5 ? (addrForm.cp.startsWith('97') ? { state: 'Yucatán', municipality: 'Mérida' } : { state: 'Nacional', municipality: 'Foráneo' }) : { state: '', municipality: '' };
    const createAddrMutation = useMutation({
        mutationFn: () => createAddress({
            label: addrForm.label || 'Dirección',
            street: addrForm.street,
            exteriorNumber: addrForm.exteriorNumber,
            neighborhood: addrForm.neighborhood,
            postalCode: addrForm.cp,
            municipality: addrAuto.municipality,
            state: addrAuto.state,
            references: addrForm.references,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'addresses'] });
            setShowAddAddress(false);
            setAddrForm({ cp: '', street: '', exteriorNumber: '', neighborhood: '', label: '', references: '' });
            showToast('Dirección Guardada', 'success');
        },
        onError: (e) => showToast(e?.response?.data?.message || 'No se pudo guardar la dirección.', 'error'),
    });
    const deleteAddrMutation = useMutation({
        mutationFn: (id) => deleteAddress(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile', 'addresses'] }); showToast('Dirección eliminada', 'success'); },
        onError: (e) => showToast(e?.response?.data?.message || 'No se pudo eliminar.', 'error'),
    });
    const defaultAddrMutation = useMutation({
        mutationFn: (id) => setDefaultAddress(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile', 'addresses'] }); showToast('Dirección marcada como principal', 'success'); },
        onError: (e) => showToast(e?.response?.data?.message || 'No se pudo actualizar.', 'error'),
    });

    // Seguridad (REQ-FE-16): nombre directo (PUT); email/phone → OTP obligatorio
    const [fullName, setFullName] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    // Poblar el formulario cuando llega el perfil real
    useEffect(() => {
        if (me?.profile) {
            setFullName(`${me.profile.firstName} ${me.profile.lastName}`.trim());
            setProfileEmail(me.user.email);
            setProfilePhone(me.profile.phone ?? '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me?.profile?.firstName, me?.profile?.lastName, me?.user?.email, me?.profile?.phone]);

    const securityMutation = useMutation({
        mutationFn: async () => {
            const results = [];
            // 1) Nombre/apellido: cambio directo (no requiere OTP)
            const [firstName, ...rest] = fullName.trim().split(/\s+/);
            const lastName = rest.join(' ');
            if (firstName && (firstName !== me.profile.firstName || lastName !== me.profile.lastName)) {
                await updateProfile({ firstName, lastName: lastName || me.profile.lastName });
                queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
                results.push('nombre');
            }
            // 2) Email/teléfono: REQUIEREN OTP — se procesa UNO por operación
            const emailChanged = profileEmail.trim().toLowerCase() !== me.user.email;
            const phoneChanged = profilePhone.trim() !== (me.profile.phone ?? '');
            if (emailChanged) {
                await requestOtp('email_change', profileEmail.trim());
                setOtpPurpose('email_change');
                setShowOtpModal(true);
                results.push('otp:email');
            } else if (phoneChanged) {
                await requestOtp('phone_change', profilePhone.trim());
                setOtpPurpose('phone_change');
                setShowOtpModal(true);
                results.push('otp:phone');
            }
            return results;
        },
        onSuccess: (results) => {
            if (results.length === 0) showToast('No hay cambios por guardar.', 'warning');
            else if (results.includes('otp:email') || results.includes('otp:phone')) showToast('Te enviamos un código a tu correo actual.', 'success');
            else showToast('Perfil actualizado.', 'success');
        },
        onError: (e) => showToast(e?.response?.data?.message || 'No se pudo actualizar el perfil.', 'error'),
    });

    const progress = tierProgress(me?.profile?.experiencePoints, me?.profile?.tierLevel, me?.gamification);
    const tierUi = tierDisplay(me?.profile?.tierLevel);

    const activeOrders = (orders ?? []).filter((o) => ACTIVE_STATUSES.includes(o.status));
    const historyOrders = (orders ?? []).filter((o) => !ACTIVE_STATUSES.includes(o.status));

    // Detalle abierto: estado real → paso del timeline; foráneo real → deliveryType
    const detailOrder = orderDetail?.order;
    const detailState = detailOrder ? (STATUS_STEP[detailOrder.status] ?? 0) : 0;
    const isOrderForaneo = detailOrder?.deliveryType === 'EXTERNAL_COURIER';

    // Cancelación autónoma — REGLA BACKEND: solo en PAID ("Pago Confirmado")
    const cancelMutation = useMutation({
        mutationFn: () => cancelOrder(viewingOrder),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'orders'] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
            showToast('Cancelación procesada. Dinero devuelto al Monedero.', 'success');
            setViewingOrder(null);
        },
        onError: (error) => showToast(error?.response?.data?.message || 'No se pudo cancelar el pedido.', 'error'),
    });

    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            showToast('Copiado con éxito', 'success');
        } catch {
            // Fallback (navegadores viejos o documento sin foco): textarea + execCommand
            try {
                const ta = document.createElement('textarea');
                ta.value = code;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(ta);
                if (!ok) throw new Error('execCommand falló');
                showToast('Copiado con éxito', 'success');
            } catch {
                showToast('No se pudo copiar el código.', 'error');
            }
        }
    };

    // Seguridad Form States
    const [pwd, setPwd] = useState('');
    const pwdStrength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;
    const [profileEmail, setProfileEmail] = useState('roberto.g@gmail.com');
    const isProfileEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail);

    const tabs = [
        { id: 'orders', label: 'Historial Pedidos', icon: Package },
        { id: 'rewards', label: 'Recompensas (Juego)', icon: Gamepad2, color: 'text-[#502c84]' },
        { id: 'wallet', label: 'Monedero y Donaciones', icon: CreditCard, color: 'text-[#ffce07]' },
        { id: 'coupons', label: 'Cupones Promo', icon: Ticket },
        { id: 'wishlist', label: 'Wishlist', icon: Heart, color: 'text-[#ec1676]' },
        { id: 'notifications', label: 'Notificaciones', icon: Bell, badge: true },
        { id: 'addresses', label: 'Libreta Direcciones', icon: MapPin },
        { id: 'payments', label: 'Métodos de Pago', icon: CreditCard },
        { id: 'settings', label: 'Seguridad (Perfil)', icon: Settings },
    ];

    return (
        <div className="container mx-auto px-6 lg:px-12 flex flex-col">
            {/* Botón de Retroceso Global del Perfil */}
            <div className="mb-6">
                <button onClick={() => navigate('landing')} className="bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors border border-slate-100 shadow-sm w-max">
                    <ArrowLeft className="w-4 h-4 text-[#03bbd3]" /> Volver al Inicio
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Nav */}
                <aside className="w-full md:w-64 shrink-0">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Mi Perfil</h2>

                    {/* [ENTERPRISE] Pase de Leyenda XP Bar */}
                    <div className="mb-6 bg-white border border-slate-100 p-5 rounded-3xl shadow-premium">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase text-[#ffce07] tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> {tierUi.label}</span>
                            <span className="text-[10px] font-bold text-slate-400">{progress.isMax ? `${progress.current} XP (MAX)` : `${progress.current} / ${progress.target} XP`}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#96c93e] to-[#ffce07] transition-all duration-500" style={{ width: `${progress.pct}%` }}></div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map(t => (
                            <button
                                key={t.id} onClick={() => { setActiveTab(t.id); setViewingOrder(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-[#03bbd3] text-white shadow-lg shadow-[#03bbd3]/20 border-transparent' : 'text-slate-500 hover:bg-white hover:shadow-premium'}`}
                            >
                                <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-white' : (t.color || 'text-slate-400')}`} />
                                {t.label}
                                {t.badge && unread > 0 && <span className="ml-auto bg-[#ec1676] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">{unread}</span>}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 bg-slate-50/80 border border-white rounded-[2.5rem] shadow-premium p-8 lg:p-12 backdrop-blur-md">

                    {/* TAB 1: PEDIDOS (Lista -> Detalle) [REQ-FE-23] */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="flex gap-6 border-b border-slate-100 pb-4">
                                <button onClick={() => { setOrderSubTab('active'); setViewingOrder(null); }} className={`font-bold pb-4 transition-colors relative ${orderSubTab === 'active' ? 'text-[#03bbd3]' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Pedidos Activos ({activeOrders.length})
                                    {orderSubTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full"></div>}
                                </button>
                                <button onClick={() => { setOrderSubTab('history'); setViewingOrder(null); }} className={`font-bold pb-4 transition-colors relative ${orderSubTab === 'history' ? 'text-[#03bbd3]' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Historial Finalizados ({historyOrders.length})
                                    {orderSubTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full"></div>}
                                </button>
                            </div>

                            {(orderSubTab === 'active' || viewingOrder) ? (
                                !viewingOrder ? (
                                    <div className="space-y-4 animate-in fade-in">
                                        {activeOrders.length === 0 && (
                                            <p className="text-sm text-slate-400 font-medium py-8 text-center">No tienes pedidos activos por ahora.</p>
                                        )}
                                        {activeOrders.map((o) => (
                                        <div key={o.id} className="bg-slate-50 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 hover:border-[#03bbd3]/30 cursor-pointer transition-all hover:shadow-sm" onClick={() => setViewingOrder(o.id)}>
                                            <div className="flex gap-5 items-center">
                                                <div className="flex -space-x-4">
                                                    <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center relative z-10 overflow-hidden">{o.productThumbnail ? <img src={o.productThumbnail} alt="" className="w-full h-full object-cover" /> : <Package className="w-7 h-7 text-[#03bbd3]" />}</div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg">#{o.id.slice(0, 8).toUpperCase()}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{fmtDate(o.createdAt)} • {o.itemCount} {o.itemCount === 1 ? 'artículo' : 'artículos'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0 sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                                                <p className="font-black text-slate-900 text-xl">${Number(o.totalPaid).toFixed(2)}</p>
                                                <span className="text-[10px] bg-[#ffce07]/10 text-[#ffce07] px-3 py-1 rounded-full font-black border border-[#ffce07]/20 uppercase">{STATUS_LABEL[o.status] ?? o.status}</span>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-right-8">
                                        <button onClick={() => setViewingOrder(null)} className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-2 mb-8 transition-colors"><ArrowLeft className="w-4 h-4" /> Volver a mis pedidos</button>

                                        {/* [Fase 43] El simulador de estatus del prototipo se eliminó:
                                            el estado del timeline ahora viene del pedido REAL del backend. */}
                                        {detailOrder && (
                                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-premium flex flex-col md:flex-row gap-12 relative overflow-hidden">
                                            <div className="w-full md:w-2/5 md:border-r border-slate-100 md:pr-10">
                                                <div className="relative flex flex-col gap-10">
                                                    <div className="absolute top-0 left-6 w-1 h-full bg-slate-50 z-0 rounded-full"></div>
                                                    <div className="absolute top-0 left-6 w-1 bg-[#96c93e] z-0 transition-all duration-700 rounded-full" style={{ height: `${Math.max(0, (detailState - 1)) * 25}%` }}></div>

                                                    {[
                                                        { step: 1, label: 'Pago Confirmado', icon: CreditCard, desc: 'Recibimos tu pago exitosamente.' },
                                                        { step: 2, label: 'Empaquetando', icon: Box, desc: 'Preparando tus artículos en bodega.' },
                                                        { step: 3, label: 'En Camino', icon: Truck, desc: 'El paquete salió de la bodega.' },
                                                        { step: 4, label: 'En Reparto', icon: MapPin, desc: isOrderForaneo ? 'El transportista está en tu ciudad.' : '¡Llega hoy a tu domicilio!' },
                                                        { step: 5, label: 'Entregado', icon: CheckCircle2, desc: 'Paquete en tus manos.' }
                                                    ].map((s, i) => {
                                                        const isDone = detailState >= s.step;
                                                        const isActive = detailState === s.step;
                                                        return (
                                                            <div key={i} className="relative z-10 flex gap-5 items-start">
                                                                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-[#ffce07] border-[#ffce07] text-white shadow-lg shadow-[#ffce07]/20 scale-110' : isDone ? 'bg-[#96c93e] border-[#96c93e] text-white shadow-md' : 'bg-white border-slate-100 text-slate-300'}`}>
                                                                    <s.icon className="w-5 h-5" />
                                                                </div>
                                                                <div className="pt-2">
                                                                    <span className={`text-sm font-black uppercase tracking-tight ${isActive ? 'text-[#ffce07]' : isDone ? 'text-[#96c93e]' : 'text-slate-400'}`}>{s.label}</span>
                                                                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">{s.desc}</p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-3/5 flex flex-col justify-between space-y-8">
                                                <div>
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-2xl uppercase tracking-tighter">Pedido #{detailOrder.id.slice(0, 8).toUpperCase()}</h3>
                                                            <p className="text-xs text-slate-400 font-bold mt-1">Generado: {fmtDate(detailOrder.createdAt)}</p>
                                                        </div>
                                                        {detailOrder.status === 'PAID' ? (
                                                            /* REGLA BACKEND (REQ-FE-23): cancelación autónoma SOLO en "Pago Confirmado" */
                                                            <button disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()} className="bg-[#ec1676] hover:bg-[#d01467] text-white text-[10px] font-black px-5 py-3 rounded-xl shadow-lg shadow-[#ec1676]/20 transition-all uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">{cancelMutation.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Cancelando...</> : 'Cancelar'}</button>
                                                        ) : detailOrder.status === 'DELIVERED' ? (
                                                            <button onClick={() => showToast('Descargando PDF de Factura...', 'success')} className="bg-slate-50 text-[#03bbd3] text-[10px] font-black px-5 py-3 rounded-xl border border-slate-100 hover:border-[#03bbd3] transition-all flex items-center gap-2 uppercase tracking-widest"><FileText className="w-4 h-4" /> Factura CFDI</button>
                                                        ) : (
                                                            <span className="bg-[#ffce07]/10 text-[#ffce07] text-[10px] font-black px-4 py-2 rounded-full border border-[#ffce07]/20 uppercase tracking-widest">{STATUS_LABEL[detailOrder.status] ?? detailOrder.status}</span>
                                                        )}
                                                    </div>

                                                    {detailState === 4 && (
                                                        <div className="mb-8 bg-slate-50 p-6 rounded-3xl border border-[#03bbd3]/20 shadow-sm relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#03bbd3]/5 rounded-bl-full"></div>
                                                            {isOrderForaneo ? (
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div>
                                                                        <p className="text-[10px] text-[#03bbd3] font-black uppercase tracking-widest">Paquetería Externa</p>
                                                                        <p className="font-black text-slate-900 text-lg">{detailOrder.trackingCompany ?? 'Por asignar'}</p>
                                                                        <p className="text-[11px] text-slate-500 mt-1 font-mono">Guía: {detailOrder.trackingNumber ?? 'pendiente'}</p>
                                                                    </div>
                                                                    <button className="bg-[#03bbd3] text-white text-xs font-black px-6 py-3 rounded-xl shadow-lg shadow-[#03bbd3]/20 flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"><Search className="w-4 h-4" /> Rastrear</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm"><User className="text-[#03bbd3] w-8 h-8" /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-[#03bbd3] font-black uppercase tracking-widest">Repartidor Local</p>
                                                                            <p className="font-black text-slate-900 text-lg">{detailOrder.driverName ?? 'Por asignar'}</p>
                                                                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">{detailOrder.driverVehicle ?? 'Vehículo por asignar'}{detailOrder.driverPhone ? ` • ${detailOrder.driverPhone}` : ''}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button className="bg-white text-slate-600 text-xs font-black px-6 py-3 rounded-xl border border-slate-200 hover:border-[#03bbd3] hover:text-[#03bbd3] transition-all shadow-sm">Llamar</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-3 mt-auto">
                                                    {(orderDetail?.items ?? []).map((item) => (
                                                    <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-5 group hover:border-[#03bbd3]/30 transition-colors">
                                                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform"><Package className="text-[#03bbd3] w-8 h-8" /></div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-base uppercase tracking-tight">{item.productName}</p>
                                                            <p className="text-xs text-slate-500 font-bold">x{item.quantity} • ${Number(item.unitPrice).toFixed(2)} • SKU: {item.variantSku}</p>
                                                        </div>
                                                    </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="space-y-4 animate-in fade-in">
                                    {historyOrders.length === 0 && (
                                        <p className="text-sm text-slate-400 font-medium py-8 text-center">Aún no hay pedidos finalizados.</p>
                                    )}
                                    {historyOrders.map((o) => (
                                    <div key={o.id} className="bg-white p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 shadow-sm hover:border-[#96c93e]/30 transition-all cursor-pointer" onClick={() => setViewingOrder(o.id)}>
                                        <div className="flex gap-5 items-center">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center grayscale overflow-hidden">{o.productThumbnail ? <img src={o.productThumbnail} alt="" className="w-full h-full object-cover" /> : <Package className="w-7 h-7 text-slate-400" />}</div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg">#{o.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{fmtDate(o.createdAt)} • {o.itemCount} {o.itemCount === 1 ? 'artículo' : 'artículos'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                                            <p className="font-black text-slate-900 text-xl">${Number(o.totalPaid).toFixed(2)}</p>
                                            {o.status === 'DELIVERED'
                                                ? <span className="text-[10px] bg-[#96c93e]/10 text-[#96c93e] px-4 py-1.5 rounded-full font-black border border-[#96c93e]/20 flex items-center gap-2 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Entregado</span>
                                                : <span className="text-[10px] bg-[#ec1676]/10 text-[#ec1676] px-4 py-1.5 rounded-full font-black border border-[#ec1676]/20 flex items-center gap-2 uppercase tracking-widest"><X className="w-3 h-3" /> {STATUS_LABEL[o.status] ?? o.status}</span>}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: GAME BRIDGE RECOMPENSAS [REQ-FE-22] */}
                    {activeTab === 'rewards' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Inventario In-Game</h2>
                                    <p className="text-sm text-slate-500 font-medium">Recompensas desbloqueadas por tus compras físicas.</p>
                                </div>
                            </div>

                            {/* [Fase 43] UUIDs REALES: GET /api/profile/rewards (REQ-FE-22) */}
                            {(rewards ?? []).length === 0 && (
                                <p className="text-sm text-slate-400 font-medium py-8 text-center">Aún no tienes recompensas. Compra productos con skin incluida para desbloquearlas.</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {(rewards ?? []).map((rw) => (
                                    rw.status.includes('Listo') ? (
                                        <div key={rw.code} className="group relative h-[280px] w-full [perspective:1000px]">
                                            <div className="absolute inset-0 bg-white border-2 border-[#502c84]/20 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-premium transition-all duration-500 hover:border-[#502c84] overflow-hidden">
                                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#502c84]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                                                <div>
                                                    <span className="bg-[#96c93e]/10 text-[#96c93e] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-[#96c93e]/20 mb-4 inline-flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#96c93e] rounded-full animate-pulse"></div> Disponible</span>
                                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{rw.productName}</h3>
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-DB Link Sincronizado</p>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between relative z-10 shadow-inner">
                                                    <code className="text-sm text-[#502c84] font-black font-mono pl-2 tracking-widest truncate" title={rw.code}>{rw.code}</code>
                                                    <button onClick={() => copyCode(rw.code)} className="bg-[#502c84] hover:bg-[#3d2165] text-white p-3 rounded-xl transition-all shadow-lg shadow-[#502c84]/20 active:scale-95 shrink-0"><Copy className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={rw.code} className="relative h-[280px] w-full grayscale opacity-60">
                                            <div className="absolute inset-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                                <div>
                                                    <span className="bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block tracking-widest">{rw.status.includes('Canjeado') ? 'Canjeado' : 'Revocado'}</span>
                                                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">{rw.productName}</h3>
                                                </div>
                                                <div className="bg-white/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                    <code className="text-sm text-slate-300 font-black font-mono pl-2 truncate" title={rw.code}>{rw.code}</code>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: MONEDERO Y DONACIONES [REQ-FE-20] */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4">
                            <div className="bg-gradient-to-br from-[#ffce07] to-[#e6b800] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-[#ffce07]/20 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="relative z-10">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-3 opacity-70">Saldo Disponible</p>
                                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter">${Math.trunc(me?.wallet?.balance ?? 0)}.<span className="text-3xl opacity-60">{String(Math.round(((me?.wallet?.balance ?? 0) % 1) * 100)).padStart(2, '0')}</span> MXN</h2>
                                    <p className="text-[11px] text-slate-900 font-bold mt-4 flex items-center gap-2 bg-white/20 w-max px-3 py-1.5 rounded-full"><ShieldAlert className="w-3.5 h-3.5" /> {me?.wallet?.expiresAt ? `Saldo expira el ${fmtDate(me.wallet.expiresAt)}` : 'El saldo acreditado expira a los 12 meses'}</p>
                                </div>
                                <div className="relative z-10 bg-white/20 p-6 rounded-[2rem] backdrop-blur-md border border-white/30">
                                    <CreditCard className="w-12 h-12 text-slate-900 opacity-80" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#ffce07] rounded-full"></div>
                                    Movimientos del Ledger
                                </h3>
                                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-premium">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-slate-400"><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Fecha / Folio</th><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Concepto</th><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Monto</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(ledger ?? []).length === 0 && (
                                                <tr><td colSpan={3} className="px-8 py-8 text-center text-slate-400 font-medium text-sm">Sin movimientos todavía.</td></tr>
                                            )}
                                            {(ledger ?? []).map((tx) => (
                                                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-6 text-slate-500 font-medium">{fmtDate(tx.createdAt)} <span className="text-[10px] font-mono block text-slate-300">{(tx.orderId ?? tx.id).slice(0, 8).toUpperCase()}</span></td>
                                                    <td className="px-8 py-6 text-slate-900 font-black">{LEDGER_CONCEPT[tx.source] ?? tx.description ?? tx.source}</td>
                                                    {/* DEPOSIT (reembolsos) = verde + / WITHDRAWAL (compras) = rojo − */}
                                                    <td className={`px-8 py-6 text-right font-black ${tx.type === 'DEPOSIT' ? 'text-[#96c93e]' : 'text-[#ec1676]'}`}>{tx.type === 'DEPOSIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* [Fase 44] DIFERIDO: el backend no expone "mis donaciones"
                                (solo POST /api/donate, sin GET por usuario). Esta tarjeta
                                queda como maqueta hasta añadir ese endpoint (Fase 46). */}
                            <div className="pt-8 border-t border-slate-100">
                                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#ec1676] rounded-full"></div>
                                    Mis Aportaciones Sociales
                                </h3>
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center justify-between shadow-inner">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm"><HeartHandshake className="w-8 h-8 text-[#ec1676]" /></div>
                                        <div><p className="font-black text-slate-900 uppercase tracking-tight">Fondo de Reforestación</p><p className="text-xs text-slate-500 font-bold">01 Mayo 2026</p></div>
                                    </div>
                                    <p className="text-2xl font-black text-[#ec1676]">$30.00</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: CUPONES FOMO [REQ-FE-21] */}
                    {activeTab === 'coupons' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl flex shadow-inner group focus-within:border-[#03bbd3] transition-all">
                                <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Ingresa tu código promocional..." className="flex-1 bg-transparent px-5 text-slate-900 outline-none font-black font-mono uppercase placeholder:text-slate-300" />
                                <button disabled={redeemMutation.isPending || !couponInput.trim()} onClick={() => redeemMutation.mutate()} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#03bbd3]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">{redeemMutation.isPending ? 'Validando...' : 'Canjear'}</button>
                            </div>

                            {/* [Fase 44] Cupones VIGENTES reales · countdown vivo desde expires_at (BD) */}
                            {(coupons ?? []).length === 0 && (
                                <p className="text-sm text-slate-400 font-medium py-8 text-center">No hay promociones vigentes por ahora.</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
                                {(coupons ?? []).map((c) => (
                                <div key={c.code} className="bg-white border-2 border-[#96c93e]/30 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-[#96c93e] transition-all shadow-premium">
                                    <div className="absolute top-0 right-0 bg-[#96c93e] text-white text-[11px] font-black uppercase px-6 py-2 rounded-bl-2xl shadow-md">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `$${Number(c.discountValue).toFixed(0)} OFF`}</div>
                                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#96c93e]/5 rounded-full blur-2xl"></div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-2 mt-4 tracking-tighter">{c.code}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">{c.minPurchaseAmount ? `Compra mínima $${Number(c.minPurchaseAmount).toFixed(0)}` : 'Válido en toda la tienda'}</p>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center shadow-inner">
                                        <p className="text-xs font-black text-[#ec1676] flex items-center justify-center gap-2 animate-pulse uppercase tracking-widest"><Clock className="w-4 h-4" /> Expira en: <CouponCountdown expiresAt={c.expiresAt} /></p>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: WISHLIST FAVORITOS [REQ-FE-19] */}
                    {activeTab === 'wishlist' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mis Favoritos</h2>
                            {/* [Fase 44] Favoritos reales con STOCK VIVO (totalStock del backend) */}
                            {(wishlist ?? []).length === 0 && (
                                <p className="text-sm text-slate-400 font-medium py-8 text-center">Tu lista de favoritos está vacía. Toca el corazón de un producto para guardarlo aquí.</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {(wishlist ?? []).map((p) => (
                                    p.totalStock > 0 ? (
                                        <div key={p.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center hover:border-[#ec1676]/40 transition-all relative overflow-hidden group shadow-premium hover:shadow-xl">
                                            <button onClick={() => removeWishMutation.mutate(p.id)} disabled={removeWishMutation.isPending} className="absolute top-6 right-6 z-10 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#ec1676] hover:bg-white transition-all shadow-sm disabled:opacity-50"><Trash2 className="w-5 h-5" /></button>
                                            <div className="w-28 h-28 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-12 h-12 text-slate-300" />}</div>
                                            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight text-center">{p.name}</h3>
                                            <button onClick={() => quickAdd(p.id, showToast)} className="w-full bg-[#03bbd3] hover:bg-[#02a8be] text-white font-black py-4 rounded-2xl mt-6 transition-all shadow-lg shadow-[#03bbd3]/20 uppercase tracking-widest text-[10px]">Al Carrito</button>
                                        </div>
                                    ) : (
                                        <div key={p.id} className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center opacity-60 grayscale relative group">
                                            <span className="absolute top-6 left-6 bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-white">Agotado</span>
                                            <button onClick={() => removeWishMutation.mutate(p.id)} disabled={removeWishMutation.isPending} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-[#ec1676] transition-all disabled:opacity-50"><Trash2 className="w-5 h-5" /></button>
                                            <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mb-6 overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-12 h-12 text-slate-200" />}</div>
                                            <h3 className="font-black text-slate-400 text-lg uppercase tracking-tight text-center">{p.name}</h3>
                                            <button disabled className="w-full bg-slate-200 text-slate-400 font-black py-4 rounded-2xl mt-6 cursor-not-allowed uppercase tracking-widest text-[10px]">Sin Stock</button>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 6: NOTIFICACIONES IN-APP [REQ-FE-24] */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Notificaciones</h2>
                                <button onClick={() => readAllMutation.mutate()} disabled={readAllMutation.isPending} className="text-[10px] font-black text-[#03bbd3] hover:text-[#02a8be] uppercase tracking-widest border-b-2 border-[#03bbd3]/30 pb-1 transition-all disabled:opacity-50">Limpiar Bandeja</button>
                            </div>
                            {/* [Fase 45] Bandeja REAL: click en no leída → PATCH /:id/read →
                                el badge del notificationStore baja sincronizado (REQ-FE-24) */}
                            {(notifications ?? []).length === 0 && (
                                <p className="text-sm text-slate-400 font-medium py-8 text-center">No tienes notificaciones.</p>
                            )}
                            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-premium">
                                {(notifications ?? []).map((n) => (
                                <div key={n.id} onClick={() => { if (!n.isRead) readOneMutation.mutate(n.id); }} className={`p-6 border-b border-slate-50 flex gap-6 cursor-pointer hover:bg-white transition-all group ${n.isRead ? '' : 'bg-[#ec1676]/5'}`}>
                                    {!n.isRead && <div className="w-3 h-3 rounded-full bg-[#ec1676] mt-2 shrink-0 shadow-[0_0_10px_rgba(236,22,118,0.4)] animate-pulse"></div>}
                                    <div className="flex-1">
                                        <p className={`text-base font-black leading-tight ${n.isRead ? 'text-slate-400' : 'text-slate-900'}`}>{n.payload?.title ?? n.type}</p>
                                        {n.payload?.body && <p className="text-sm text-slate-500 mt-2 font-medium">{n.payload.body}</p>}
                                        <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> {timeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.isRead && (
                                        <button onClick={(e) => { e.stopPropagation(); readOneMutation.mutate(n.id); }} title="Marcar como leída" className="text-slate-300 hover:text-[#ec1676] transition-colors self-start"><CheckSquare className="w-5 h-5" /></button>
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 7: DIRECCIONES [REQ-FE-17] */}
                    {activeTab === 'addresses' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Mis Direcciones</h2><button onClick={() => setShowAddAddress(!showAddAddress)} className="bg-[#96c93e]/10 text-[#96c93e] text-xs font-black px-5 py-3 rounded-xl border border-[#96c93e]/20 flex items-center gap-2 hover:bg-[#96c93e] hover:text-white transition-all uppercase tracking-widest"><Plus className="w-4 h-4" /> Agregar</button></div>

                            {/* [Fase 45] Direcciones REALES (REQ-FE-17): ⚙ = marcar principal · 🗑 = eliminar */}
                            {(addresses ?? []).length === 0 && (
                                <p className="text-sm text-slate-400 font-medium py-8 text-center">Aún no tienes direcciones guardadas.</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                                {(addresses ?? []).map((a) => (
                                <div key={a.id} className={`bg-white border-2 rounded-[2.5rem] p-8 relative group transition-all shadow-premium ${a.isDefault ? 'border-[#96c93e]/30 hover:border-[#96c93e]' : 'border-slate-100 hover:border-[#03bbd3]/40'}`}>
                                    {a.isDefault && <span className="absolute top-6 right-6 bg-[#96c93e] text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">Principal</span>}
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><MapPin className={`w-7 h-7 ${a.isDefault ? 'text-[#96c93e]' : 'text-slate-400'}`} /></div>
                                    <p className="font-black text-slate-900 text-xl uppercase tracking-tight">{a.label}</p>
                                    <p className="text-sm text-slate-500 mt-3 leading-relaxed font-medium">{a.street} #{a.exteriorNumber}, {a.neighborhood}<br />{a.municipality}, {a.state}. CP {a.postalCode}</p>
                                    <div className="absolute bottom-6 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        {!a.isDefault && <button onClick={() => defaultAddrMutation.mutate(a.id)} title="Marcar como principal" className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-[#03bbd3] hover:bg-white shadow-sm transition-all border border-slate-100"><Settings className="w-5 h-5" /></button>}
                                        <button onClick={() => deleteAddrMutation.mutate(a.id)} title="Eliminar dirección" className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-[#ec1676] hover:bg-white shadow-sm transition-all border border-slate-100"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                ))}
                            </div>

                            {showAddAddress && (
                                <div className="bg-slate-50 border border-slate-100 p-10 rounded-[2.5rem] max-w-lg animate-in zoom-in-95 duration-300 shadow-premium relative">
                                    <button onClick={() => setShowAddAddress(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
                                    <h3 className="font-black text-slate-900 text-2xl mb-8 uppercase tracking-tighter">Nueva Dirección</h3>
                                    <form onSubmit={(e) => { e.preventDefault(); if (addrForm.cp.length !== 5) { showToast('El Código Postal debe tener 5 dígitos.', 'error'); return; } createAddrMutation.mutate(); }} className="space-y-6">
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiqueta</label><input type="text" required value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} placeholder="Ej. Casa Centro" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Postal</label><input type="text" required value={addrForm.cp} onChange={e => setAddrForm(f => ({ ...f, cp: e.target.value.replace(/\D/g, '').slice(0, 5) }))} placeholder="Ej. 97000" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label><input disabled value={addrAuto.state} placeholder="Esperando CP..." className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-400 font-bold" /></div>
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciudad</label><input disabled value={addrAuto.municipality} placeholder="Esperando CP..." className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-400 font-bold" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Colonia</label><input type="text" required value={addrForm.neighborhood} onChange={e => setAddrForm(f => ({ ...f, neighborhood: e.target.value }))} placeholder="Ej. Centro" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Exterior</label><input type="text" required value={addrForm.exteriorNumber} onChange={e => setAddrForm(f => ({ ...f, exteriorNumber: e.target.value }))} placeholder="Ej. 123-B" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        </div>
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Calle y Cruzamientos</label><input type="text" required value={addrForm.street} onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))} placeholder="Ej. Calle 60 x 45 y 47" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencias</label><input type="text" value={addrForm.references} onChange={e => setAddrForm(f => ({ ...f, references: e.target.value }))} placeholder="Color de casa, portón..." className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        <button type="submit" disabled={createAddrMutation.isPending} className="bg-[#03bbd3] text-white w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#03bbd3]/20 hover:bg-[#02a8be] transition-all transform hover:scale-[1.02] disabled:opacity-60">{createAddrMutation.isPending ? 'Guardando...' : 'Guardar Dirección'}</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 8: MÉTODOS DE PAGO PCI [REQ-FE-18] */}
                    {activeTab === 'payments' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Métodos de Pago</h2><button onClick={() => setShowAddCard(!showAddCard)} className="bg-[#03bbd3]/10 text-[#03bbd3] text-xs font-black px-5 py-3 rounded-xl border border-[#03bbd3]/20 flex items-center gap-2 hover:bg-[#03bbd3] hover:text-white transition-all uppercase tracking-widest"><Plus className="w-4 h-4" /> Agregar</button></div>
                            {/* [Fase 45] AVISO HONESTO: la bóveda PCI de tarjetas está DIFERIDA
                                (Fase 36 backend + claves de Stripe). Tarjetas demostrativas. */}
                            <div className="bg-[#ffce07]/10 border border-[#ffce07]/30 p-4 rounded-2xl flex gap-3 items-start">
                                <AlertTriangle className="w-5 h-5 text-[#ffce07] shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">Módulo en construcción: el guardado seguro de tarjetas (bóveda PCI vía Stripe) llegará con la integración de pagos reales. Las tarjetas mostradas son demostrativas.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 relative group shadow-xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                                    <button onClick={() => showToast('Tarjeta Eliminada', 'success')} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                                    <div className="w-12 h-8 bg-white/20 rounded-md mb-8"></div>
                                    <p className="text-xl font-mono text-white tracking-[0.2em] mb-8">•••• •••• •••• 4567</p>
                                    <div className="flex justify-between items-end"><div className="space-y-1"><p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Expira</p><p className="text-sm font-black text-white">12 / 28</p></div><p className="font-black text-white italic text-xl tracking-tighter">VISA</p></div>
                                </div>
                                <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 relative group shadow-premium opacity-60">
                                    <div className="flex justify-between items-start mb-10"><span className="bg-[#ec1676] text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Expirada</span><button onClick={() => showToast('Tarjeta Eliminada', 'success')} className="text-slate-300 hover:text-[#ec1676] transition-colors"><Trash2 className="w-5 h-5" /></button></div>
                                    <p className="text-xl font-mono text-slate-300 tracking-[0.2em] mb-8">•••• •••• •••• 9012</p>
                                    <div className="flex justify-between items-end"><div className="space-y-1"><p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Expira</p><p className="text-sm font-black text-slate-400">01 / 24</p></div><p className="font-black text-slate-300 italic text-xl tracking-tighter">MASTER</p></div>
                                </div>
                            </div>

                            {showAddCard && (
                                <div className="bg-slate-50 border border-slate-100 p-10 rounded-[2.5rem] max-w-sm animate-in zoom-in-95 duration-300 shadow-premium relative mt-12">
                                    <button onClick={() => setShowAddCard(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
                                    <h3 className="font-black text-slate-900 text-2xl mb-8 uppercase tracking-tighter">Nueva Tarjeta</h3>
                                    <form onSubmit={(e) => { e.preventDefault(); showToast('Disponible al integrar Stripe (módulo diferido).', 'warning'); setShowAddCard(false); }} className="space-y-5">
                                        <input type="text" required placeholder="Titular de la Tarjeta" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black uppercase tracking-tight" />
                                        <input type="text" required placeholder="•••• •••• •••• ••••" maxLength="16" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-mono text-lg font-bold" />
                                        <div className="grid grid-cols-2 gap-5">
                                            <input type="text" required placeholder="MM/YY" maxLength="5" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black text-center" />
                                            <input type="password" required placeholder="CVC" maxLength="4" className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black text-center" />
                                        </div>
                                        <button type="submit" className="bg-[#03bbd3] text-white w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#03bbd3]/20 hover:bg-[#02a8be] transition-all mt-4 transform hover:scale-[1.02]">Guardar Tarjeta</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 9: SETTINGS & OTP [REQ-FE-16] */}
                    {activeTab === 'settings' && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4 max-w-2xl">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Seguridad y Perfil</h2>

                            <form onSubmit={(e) => { e.preventDefault(); if (pwd.length > 0) { showToast('El cambio de contraseña llegará pronto (usa "Olvidé mi contraseña" por ahora).', 'warning'); } securityMutation.mutate(); }} className="space-y-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
                                    <h3 className="font-black text-slate-900 border-b border-slate-100 pb-5 mb-8 uppercase tracking-widest text-xs flex items-center gap-3"><div className="w-2 h-4 bg-[#03bbd3] rounded-full"></div> Información Básica</h3>
                                    <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner font-black" /></div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo de Contacto <span className="text-[#ec1676]">(Requiere OTP)</span></label>
                                        <div className="relative">
                                            <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-slate-900 outline-none transition-all shadow-inner font-black ${isProfileEmailValid ? 'border-slate-100 focus:border-[#96c93e]' : 'border-red-100 focus:border-[#ec1676]'}`} />
                                            <CheckCircle2 className={`absolute right-5 top-4.5 w-6 h-6 transition-colors ${isProfileEmailValid ? 'text-[#96c93e]' : 'text-slate-200'}`} />
                                        </div>
                                    </div>

                                    <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp / SMS <span className="text-[#ec1676]">(Requiere OTP)</span></label><input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner font-black" /></div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
                                    <h3 className="font-black text-slate-900 border-b border-slate-100 pb-5 mb-8 uppercase tracking-widest text-xs flex items-center gap-3"><div className="w-2 h-4 bg-[#ffce07] rounded-full"></div> Gestión de Acceso</h3>
                                    <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password Actual</label><input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner" /></div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nuevo Password</label>
                                        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-[#03bbd3] transition-all shadow-inner" />
                                        <div className="flex gap-1.5 mt-4 px-2">
                                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${pwdStrength >= 1 ? (pwdStrength === 1 ? 'bg-[#ec1676]' : pwdStrength === 2 ? 'bg-[#ffce07]' : 'bg-[#96c93e]') : 'bg-slate-100'}`}></div>
                                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${pwdStrength >= 2 ? (pwdStrength === 2 ? 'bg-[#ffce07]' : 'bg-[#96c93e]') : 'bg-slate-100'}`}></div>
                                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${pwdStrength >= 3 ? 'bg-[#96c93e]' : 'bg-slate-100'}`}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" disabled={securityMutation.isPending} className="w-full bg-[#96c93e] hover:bg-[#85b237] text-white font-black px-8 py-5 rounded-2xl transition-all shadow-lg shadow-[#96c93e]/20 uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">{securityMutation.isPending ? 'Procesando...' : 'Actualizar Perfil de Jugador'}</button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};



// ==========================================
// LEGAL VIEW SPA
// ==========================================

