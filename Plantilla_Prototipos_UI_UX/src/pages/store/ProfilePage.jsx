import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, User, Menu, X, ChevronRight, ChevronLeft, Heart, Play,
    Search, Filter, ChevronDown, Package, MapPin, CreditCard,
    Ticket, Gamepad2, Copy, CheckCircle2, Truck, Box,
    Home, LogOut, HeartHandshake, Mail, Lock, ShieldAlert,
    AlertTriangle, Settings, Image as ImageIcon, Clock,
    Smartphone, FileText, Youtube, Cat, Coins,
    Facebook, Instagram, Twitter, Eye, EyeOff, Trash2, ArrowLeft, Plus, Loader2,
    Sparkles, Terminal, Eye as ViewIcon, Zap, Navigation, Star, Share2, ShieldCheck
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    useProfile, useOrders, useOrderDetail, cancelOrder, useRewards,
    useWalletLedger, useMyDonations, useAvailableCoupons, redeemCoupon, useWishlist, removeFromWishlist,
} from '../../api/profile';
import {
    useAddresses, createAddress, deleteAddress, setDefaultAddress,
    useCountries, useStates, useCities,
} from '../../api/checkout';
import { useCartStore } from '../../store/cartStore';
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
const queryErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
const statusBadgeClass = (status) => {
    if (status === 'DELIVERED') return 'bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/20';
    if (status === 'CANCELLED' || status === 'NEEDS_RECONCILIATION') return 'bg-[#ec1676]/10 text-[#ec1676] border-[#ec1676]/20';
    if (status === 'PAYMENT_PENDING') return 'bg-[#ffce07]/10 text-[#ffce07] border-[#ffce07]/20';
    return 'bg-[#03bbd3]/10 text-[#03bbd3] border-[#03bbd3]/20';
};

const QueryFeedback = ({ loading, error, loadingText, errorText }) => {
    if (loading) return <div className="py-10 flex items-center justify-center gap-3 text-sm text-[#e6c59e]/55 font-bold"><Loader2 className="w-5 h-5 animate-spin text-[#03bbd3]" /> {loadingText}</div>;
    if (error) return <div className="py-10 text-center text-sm text-[#ec1676] font-bold">{errorText}</div>;
    return null;
};

export const ProfileDashboard = ({ showToast, navigate }) => {
    const [activeTab, setActiveTab] = useState('orders');

    // States for interactive panels
    const [orderSubTab, setOrderSubTab] = useState('active');
    const [viewingOrder, setViewingOrder] = useState(null); // id del pedido abierto
    const [showAddAddress, setShowAddAddress] = useState(false);

    // ── [Fase 43] Datos REALES ──
    const queryClient = useQueryClient();
    const { data: me, isPending: profileLoading, isError: profileError, error: profileQueryError } = useProfile();
    const { data: orders, isPending: ordersLoading, isError: ordersError, error: ordersQueryError } = useOrders();
    const { data: orderDetail, isPending: orderDetailLoading, isError: orderDetailError } = useOrderDetail(viewingOrder);
    const { data: rewards } = useRewards(activeTab === 'rewards');

    // ── [Fase 44] Monedero · Cupones · Wishlist ──
    const { data: ledger, isPending: ledgerLoading, isError: ledgerError } = useWalletLedger(activeTab === 'wallet');
    const {
        data: myDonations,
        isPending: donationsLoading,
        isError: donationsError,
    } = useMyDonations(activeTab === 'wallet');
    const { data: coupons, isPending: couponsLoading, isError: couponsError } = useAvailableCoupons(activeTab === 'coupons');
    const { data: wishlist, isPending: wishlistLoading, isError: wishlistError } = useWishlist(activeTab === 'wishlist');
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
        onError: (error) => showToast(queryErrorMessage(error, 'Código inválido o expirado.'), 'error'),
    });

    // Quitar de favoritos (DELETE) + refetch de la lista
    const removeWishMutation = useMutation({
        mutationFn: (productId) => removeFromWishlist(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'wishlist'] });
            showToast('Eliminado de favoritos', 'success');
        },
        onError: (error) => showToast(queryErrorMessage(error, 'No se pudo eliminar de favoritos.'), 'error'),
    });
    const addWishToCartMutation = useMutation({
        mutationFn: (productId) => quickAdd(productId, showToast),
    });

    // Mapeo del ledger (REQ-FE-20): DEPOSIT=verde(+) / WITHDRAWAL=rojo(−)
    const LEDGER_CONCEPT = { CANCELLATION: 'Reembolso Pedido Cancelado', REFUND: 'Reembolso Aprobado', PURCHASE: 'Aplicado a Compra' };

    // ── [Fase 45] Direcciones ──
    const { data: addresses, isPending: addressesLoading, isError: addressesError } = useAddresses(activeTab === 'addresses');

    useEffect(() => {
        if (profileError) showToast(queryErrorMessage(profileQueryError, 'No se pudo cargar tu perfil.'), 'error');
        if (activeTab === 'orders' && ordersError) showToast(queryErrorMessage(ordersQueryError, 'No se pudieron cargar tus pedidos.'), 'error');
        if (activeTab === 'wallet' && (ledgerError || donationsError)) showToast('No se pudo cargar toda la información del monedero.', 'error');
        if (activeTab === 'coupons' && couponsError) showToast('No se pudieron cargar los cupones.', 'error');
        if (activeTab === 'wishlist' && wishlistError) showToast('No se pudo cargar tu wishlist.', 'error');
        if (activeTab === 'addresses' && addressesError) showToast('No se pudieron cargar tus direcciones.', 'error');
    }, [activeTab, profileError, profileQueryError, ordersError, ordersQueryError, ledgerError, donationsError, couponsError, wishlistError, addressesError]);

    // Direcciones: crear / eliminar / marcar principal (REQ-FE-17)
    const [addrForm, setAddrForm] = useState({ cp: '', street: '', exteriorNumber: '', neighborhood: '', label: '', references: '', countryCode: 'MX', stateCode: '', state: '', municipality: '' });
    const addrAuto = { state: addrForm.state.trim(), municipality: addrForm.municipality.trim() };
    const countriesQuery = useCountries(showAddAddress);
    const statesQuery = useStates(addrForm.countryCode, showAddAddress);
    const citiesQuery = useCities(addrForm.countryCode, addrForm.stateCode, showAddAddress);
    const createAddrMutation = useMutation({
        mutationFn: () => createAddress({
            label: addrForm.label || 'Dirección',
            street: addrForm.street,
            exteriorNumber: addrForm.exteriorNumber,
            neighborhood: addrForm.neighborhood,
            postalCode: addrForm.cp,
            municipality: addrAuto.municipality,
            state: addrAuto.state,
            countryCode: addrForm.countryCode,
            references: addrForm.references,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'addresses'] });
            setShowAddAddress(false);
            setAddrForm({ cp: '', street: '', exteriorNumber: '', neighborhood: '', label: '', references: '', countryCode: 'MX', stateCode: '', state: '', municipality: '' });
            showToast('Dirección Guardada', 'success');
        },
        onError: (e) => showToast(queryErrorMessage(e, 'No se pudo guardar la dirección.'), 'error'),
    });
    const deleteAddrMutation = useMutation({
        mutationFn: (id) => deleteAddress(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile', 'addresses'] }); showToast('Dirección eliminada', 'success'); },
        onError: (e) => showToast(queryErrorMessage(e, 'No se pudo eliminar.'), 'error'),
    });
    const defaultAddrMutation = useMutation({
        mutationFn: (id) => setDefaultAddress(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile', 'addresses'] }); showToast('Dirección marcada como principal', 'success'); },
        onError: (e) => showToast(queryErrorMessage(e, 'No se pudo actualizar.'), 'error'),
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
        onError: (error) => showToast(queryErrorMessage(error, 'No se pudo cancelar el pedido.'), 'error'),
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

    /*
    const [profileEmail, setProfileEmail] = useState('');

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

    */
    const tabs = [
        { id: 'orders', label: 'Historial Pedidos', icon: Package },
        { id: 'rewards', label: 'Recompensas (Juego)', icon: Gamepad2, color: 'text-[#03bbd3]' },
        { id: 'wallet', label: 'Monedero y Donaciones', icon: CreditCard, color: 'text-[#ffce07]' },
        { id: 'coupons', label: 'Cupones Promo', icon: Ticket },
        { id: 'wishlist', label: 'Wishlist', icon: Heart, color: 'text-[#ec1676]' },
        { id: 'addresses', label: 'Libreta Direcciones', icon: MapPin }
    ];

    return (
        <div className="w-full px-3 min-[390px]:px-4 sm:px-6 lg:px-12 py-5 sm:py-8 flex flex-col min-h-screen bg-[#061f09] text-[#e6c59e]">
            {/* Botón de Retroceso Global del Perfil */}
            <div className="mb-6">
                <button onClick={() => navigate('store')} className="bg-[#0a2e0d] hover:bg-[#071f0a] text-[#e6c59e]/75 hover:text-[#e6c59e] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors border border-[#1a9a21]/30 shadow-sm w-max">
                    <ArrowLeft className="w-4 h-4 text-[#03bbd3]" /> Retroceder
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-5 md:gap-8">
                {/* Sidebar Nav */}
                <aside className="w-full md:w-72 shrink-0 bg-[#0a2e0d]/95 border border-[#1a9a21]/30 rounded-3xl md:rounded-[2rem] p-4 sm:p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] h-max md:sticky md:top-24">
                    <h2 className="font-bungee text-xl sm:text-2xl text-[#e6c59e] mb-6 uppercase leading-tight">Mi Perfil</h2>

                    {/* [ENTERPRISE] Pase de Leyenda XP Bar */}
                    <div className="mb-6 bg-[#0a2e0d] border border-[#1a9a21]/30 p-5 rounded-3xl shadow-premium">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase text-[#ffce07] tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> {tierUi.label}</span>
                            <span className="text-[10px] font-bold text-[#e6c59e]/55">{progress.isMax ? `${progress.current} XP (MAX)` : `${progress.current} / ${progress.target} XP`}</span>
                        </div>
                        <div className="w-full h-2 bg-[#041506] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#96c93e] to-[#ffce07] transition-all duration-500" style={{ width: `${progress.pct}%` }}></div>
                        </div>
                    </div>

                    <nav className="grid grid-cols-2 min-[390px]:grid-cols-3 md:block gap-2 md:space-y-1">
                        {tabs.map(t => (
                            <button
                                key={t.id} onClick={() => { setActiveTab(t.id); setViewingOrder(null); }}
                                className={`flex min-h-12 w-full items-center justify-center text-center md:justify-start md:text-left gap-2 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition-all border ${activeTab === t.id ? 'bg-[#03bbd3]/20 text-[#03bbd3] shadow-lg shadow-[#03bbd3]/15 border-[#03bbd3]/40 scale-[1.02]' : 'bg-[#061f09]/60 text-[#e6c59e]/80 border-[#1a9a21]/20 hover:bg-[#1a9a21]/20 hover:text-[#03bbd3]'}`}
                            >
                                <t.icon className={`w-4 h-4 shrink-0 ${activeTab === t.id ? 'text-[#03bbd3]' : (t.color || 'text-[#e6c59e]/70')}`} />
                                <span className="leading-tight line-clamp-2">{t.label}</span>
                                {t.badge && unread > 0 && <span className="ml-auto bg-[#ec1676] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-[#1a9a21]/30">{unread}</span>}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 bg-[#061f09] border border-[#1a9a21]/30 rounded-3xl sm:rounded-[2.5rem] shadow-premium p-4 min-[390px]:p-5 sm:p-8 lg:p-12 backdrop-blur-md">

                    {/* TAB 1: PEDIDOS (Lista -> Detalle) [REQ-FE-23] */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="flex flex-wrap gap-6 bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] border border-[#e6c59e]/40 rounded-3xl px-6 pt-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                                <button onClick={() => { setOrderSubTab('active'); setViewingOrder(null); }} className={`font-black pb-4 transition-colors relative ${orderSubTab === 'active' ? 'text-[#06350b]' : 'text-[#3d2919]/65 hover:text-[#06350b]'}`}>
                                    Pedidos Activos ({activeOrders.length})
                                    {orderSubTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full shadow-[0_0_12px_rgba(3,187,211,0.8)]"></div>}
                                </button>
                                <button onClick={() => { setOrderSubTab('history'); setViewingOrder(null); }} className={`font-black pb-4 transition-colors relative ${orderSubTab === 'history' ? 'text-[#06350b]' : 'text-[#3d2919]/65 hover:text-[#06350b]'}`}>
                                    Historial Finalizados ({historyOrders.length})
                                    {orderSubTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full shadow-[0_0_12px_rgba(3,187,211,0.8)]"></div>}
                                </button>
                            </div>

                            <QueryFeedback loading={ordersLoading} error={ordersError} loadingText="Cargando tus pedidos..." errorText="No pudimos cargar tus pedidos." />
                            {(orderSubTab === 'active' || viewingOrder) ? (
                                !viewingOrder ? (
                                    <div className="space-y-4 animate-in fade-in">
                                        {!ordersLoading && !ordersError && activeOrders.length === 0 && (
                                            <p className="text-sm text-[#e6c59e]/55 font-medium py-8 text-center">No tienes pedidos activos por ahora.</p>
                                        )}
                                        {activeOrders.map((o) => (
                                        <div key={o.id} className="bg-[#071f0a] p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[#1a9a21]/30 hover:border-[#03bbd3]/30 cursor-pointer transition-all hover:shadow-sm" onClick={() => setViewingOrder(o.id)}>
                                            <div className="flex gap-5 items-center">
                                                <div className="flex -space-x-4">
                                                    <div className="w-14 h-14 bg-[#0a2e0d] rounded-2xl border border-[#1a9a21]/30 shadow-sm flex items-center justify-center relative z-10 overflow-hidden">{o.productThumbnail ? <img src={o.productThumbnail} alt="" className="w-full h-full object-cover" /> : <Package className="w-7 h-7 text-[#03bbd3]" />}</div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#e6c59e] text-lg">#{o.id.slice(0, 8).toUpperCase()}</p>
                                                    <p className="text-xs text-[#e6c59e]/65 font-medium">{fmtDate(o.createdAt)} • {o.itemCount} {o.itemCount === 1 ? 'artículo' : 'artículos'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0 sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                                                <p className="font-black text-[#e6c59e] text-xl">${Number(o.totalPaid).toFixed(2)}</p>
                                                <span className={`text-[10px] px-3 py-1 rounded-full font-black border uppercase ${statusBadgeClass(o.status)}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-right-8">
                                        <button onClick={() => setViewingOrder(null)} className="text-sm font-bold text-[#e6c59e]/55 hover:text-[#e6c59e] flex items-center gap-2 mb-8 transition-colors"><ArrowLeft className="w-4 h-4" /> Volver a mis pedidos</button>
                                        <QueryFeedback loading={orderDetailLoading} error={orderDetailError} loadingText="Cargando detalle del pedido..." errorText="No pudimos cargar el detalle del pedido." />

                                        {/* [Fase 43] El simulador de estatus del prototipo se eliminó:
                                            el estado del timeline ahora viene del pedido REAL del backend. */}
                                        {detailOrder && (
                                        <div className="bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-[2.5rem] p-8 md:p-10 shadow-premium flex flex-col md:flex-row gap-12 relative overflow-hidden">
                                            <div className="w-full md:w-2/5 md:border-r border-[#1a9a21]/30 md:pr-10">
                                                <div className="relative flex flex-col gap-10">
                                                    <div className="absolute top-0 left-6 w-1 h-full bg-[#071f0a] z-0 rounded-full"></div>
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
                                                                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-[#ffce07] border-[#ffce07] text-white shadow-lg shadow-[#ffce07]/20 scale-110' : isDone ? 'bg-[#96c93e] border-[#96c93e] text-white shadow-md' : 'bg-[#0a2e0d] border-[#1a9a21]/30 text-[#e6c59e]/40'}`}>
                                                                    <s.icon className="w-5 h-5" />
                                                                </div>
                                                                <div className="pt-2">
                                                                    <span className={`text-sm font-black uppercase tracking-tight ${isActive ? 'text-[#ffce07]' : isDone ? 'text-[#96c93e]' : 'text-[#e6c59e]/55'}`}>{s.label}</span>
                                                                    <p className="text-[11px] text-[#e6c59e]/65 font-medium mt-1 leading-tight">{s.desc}</p>
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
                                                            <h3 className="font-black text-[#e6c59e] text-2xl uppercase tracking-tighter">Pedido #{detailOrder.id.slice(0, 8).toUpperCase()}</h3>
                                                            <p className="text-xs text-[#e6c59e]/55 font-bold mt-1">Generado: {fmtDate(detailOrder.createdAt)}</p>
                                                        </div>
                                                        {detailOrder.status === 'PAID' ? (
                                                            /* REGLA BACKEND (REQ-FE-23): cancelación autónoma SOLO en "Pago Confirmado" */
                                                            <button disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()} className="bg-[#ec1676] hover:bg-[#d01467] text-white text-[10px] font-black px-5 py-3 rounded-xl shadow-lg shadow-[#ec1676]/20 transition-all uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">{cancelMutation.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Cancelando...</> : 'Cancelar'}</button>
                                                        ) : detailOrder.status === 'DELIVERED' ? (
                                                            <button onClick={() => showToast('La descarga de CFDI aún no está disponible.', 'warning')} className="bg-[#071f0a] text-[#03bbd3] text-[10px] font-black px-5 py-3 rounded-xl border border-[#1a9a21]/30 hover:border-[#03bbd3] transition-all flex items-center gap-2 uppercase tracking-widest"><FileText className="w-4 h-4" /> Factura CFDI</button>
                                                        ) : (
                                                            <span className="bg-[#ffce07]/10 text-[#ffce07] text-[10px] font-black px-4 py-2 rounded-full border border-[#ffce07]/20 uppercase tracking-widest">{STATUS_LABEL[detailOrder.status] ?? detailOrder.status}</span>
                                                        )}
                                                    </div>

                                                    {detailState === 4 && (
                                                        <div className="mb-8 bg-[#071f0a] p-6 rounded-3xl border border-[#03bbd3]/20 shadow-sm relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#03bbd3]/5 rounded-bl-full"></div>
                                                            {isOrderForaneo ? (
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div>
                                                                        <p className="text-[10px] text-[#03bbd3] font-black uppercase tracking-widest">Paquetería Externa</p>
                                                                        <p className="font-black text-[#e6c59e] text-lg">{detailOrder.trackingCompany ?? 'Por asignar'}</p>
                                                                        <p className="text-[11px] text-[#e6c59e]/65 mt-1 font-mono">Guía: {detailOrder.trackingNumber ?? 'pendiente'}</p>
                                                                    </div>
                                                                    <button className="bg-[#03bbd3] text-white text-xs font-black px-6 py-3 rounded-xl shadow-lg shadow-[#03bbd3]/20 flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"><Search className="w-4 h-4" /> Rastrear</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="w-16 h-16 bg-[#0a2e0d] rounded-2xl flex items-center justify-center border border-[#1a9a21]/30 shadow-sm"><User className="text-[#03bbd3] w-8 h-8" /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-[#03bbd3] font-black uppercase tracking-widest">Repartidor Local</p>
                                                                            <p className="font-black text-[#e6c59e] text-lg">{detailOrder.driverName ?? 'Por asignar'}</p>
                                                                            <p className="text-[11px] text-[#e6c59e]/65 font-bold uppercase tracking-tighter">{detailOrder.driverVehicle ?? 'Vehículo por asignar'}{detailOrder.driverPhone ? ` • ${detailOrder.driverPhone}` : ''}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button className="bg-[#0a2e0d] text-[#e6c59e]/75 text-xs font-black px-6 py-3 rounded-xl border border-[#1a9a21]/40 hover:border-[#03bbd3] hover:text-[#03bbd3] transition-all shadow-sm">Llamar</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-3 mt-auto">
                                                    {(orderDetail?.items ?? []).map((item) => (
                                                    <div key={item.id} className="bg-[#071f0a] p-5 rounded-2xl border border-[#1a9a21]/30 flex items-center gap-5 group hover:border-[#03bbd3]/30 transition-colors">
                                                        <div className="w-20 h-20 bg-[#0a2e0d] rounded-xl flex items-center justify-center border border-[#1a9a21]/30 group-hover:scale-105 transition-transform"><Package className="text-[#03bbd3] w-8 h-8" /></div>
                                                        <div>
                                                            <p className="font-black text-[#e6c59e] text-base uppercase tracking-tight">{item.productName}</p>
                                                            <p className="text-xs text-[#e6c59e]/65 font-bold">x{item.quantity} • ${Number(item.unitPrice).toFixed(2)} • SKU: {item.variantSku}</p>
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
                                    {!ordersLoading && !ordersError && historyOrders.length === 0 && (
                                        <p className="text-sm text-[#e6c59e]/55 font-medium py-8 text-center">Aún no hay pedidos finalizados.</p>
                                    )}
                                    {historyOrders.map((o) => (
                                    <div key={o.id} className="bg-[#0a2e0d] p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[#1a9a21]/30 shadow-sm hover:border-[#96c93e]/30 transition-all cursor-pointer" onClick={() => setViewingOrder(o.id)}>
                                        <div className="flex gap-5 items-center">
                                            <div className="w-14 h-14 bg-[#071f0a] rounded-2xl border border-[#1a9a21]/30 flex items-center justify-center grayscale overflow-hidden">{o.productThumbnail ? <img src={o.productThumbnail} alt="" className="w-full h-full object-cover" /> : <Package className="w-7 h-7 text-[#e6c59e]/55" />}</div>
                                            <div>
                                                <p className="font-black text-[#e6c59e] text-lg">#{o.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-xs text-[#e6c59e]/65 font-bold uppercase tracking-widest">{fmtDate(o.createdAt)} • {o.itemCount} {o.itemCount === 1 ? 'artículo' : 'artículos'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                                            <p className="font-black text-[#e6c59e] text-xl">${Number(o.totalPaid).toFixed(2)}</p>
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
                                    <h2 className="font-bungee text-2xl sm:text-3xl text-[#e6c59e] uppercase leading-tight">Inventario In-Game</h2>
                                    <p className="text-sm text-[#e6c59e]/65 font-medium">Recompensas desbloqueadas por tus compras físicas.</p>
                                </div>
                            </div>

                            {/* [Fase 43] UUIDs REALES: GET /api/profile/rewards (REQ-FE-22) */}
                            {(rewards ?? []).length === 0 && (
                                <p className="text-sm text-[#e6c59e]/55 font-medium py-8 text-center">Aún no tienes recompensas. Compra productos con skin incluida para desbloquearlas.</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {(rewards ?? []).map((rw) => (
                                    rw.status.includes('Listo') ? (
                                        <div key={rw.code} className="group relative h-[280px] w-full [perspective:1000px]">
                                            <div className="absolute inset-0 bg-[#0a2e0d] border-2 border-[#03bbd3]/30 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-premium transition-all duration-500 hover:border-[#03bbd3] overflow-hidden">
                                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#03bbd3]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                                                <div>
                                                    <span className="bg-[#96c93e]/10 text-[#96c93e] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-[#96c93e]/20 mb-4 inline-flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#96c93e] rounded-full animate-pulse"></div> Disponible</span>
                                                    <h3 className="text-2xl font-black text-[#e6c59e] uppercase tracking-tight">{rw.productName}</h3>
                                                    <p className="text-[11px] text-[#e6c59e]/55 font-bold uppercase tracking-widest mt-1">Cross-DB Link Sincronizado</p>
                                                </div>
                                                <div className="bg-[#071f0a] p-4 rounded-2xl border border-[#1a9a21]/30 flex items-center justify-between relative z-10 shadow-inner">
                                                    <code className="text-sm text-[#03bbd3] font-black font-mono pl-2 tracking-widest truncate" title={rw.code}>{rw.code}</code>
                                                    <button onClick={() => copyCode(rw.code)} className="bg-[#03bbd3] hover:bg-[#0295a8] text-white p-3 rounded-xl transition-all shadow-lg shadow-[#03bbd3]/20 active:scale-95 shrink-0"><Copy className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={rw.code} className="relative h-[280px] w-full grayscale opacity-60">
                                            <div className="absolute inset-0 bg-[#071f0a] border-2 border-dashed border-[#1a9a21]/40 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                                <div>
                                                    <span className="bg-[#123d16] text-[#e6c59e]/65 text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block tracking-widest">{rw.status.includes('Canjeado') ? 'Canjeado' : 'Revocado'}</span>
                                                    <h3 className="text-2xl font-black text-[#e6c59e]/55 uppercase tracking-tight">{rw.productName}</h3>
                                                </div>
                                                <div className="bg-[#0a2e0d]/70 p-4 rounded-2xl border border-[#1a9a21]/30 flex items-center justify-between">
                                                    <code className="text-sm text-[#e6c59e]/40 font-black font-mono pl-2 truncate" title={rw.code}>{rw.code}</code>
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
                            <div className="bg-gradient-to-br from-[#124f19] via-[#0a2e0d] to-[#041506] border border-[#96c93e]/40 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="relative z-10">
                                    <p className="text-xs font-black text-[#ffce07] uppercase tracking-[0.2em] mb-3">Saldo Disponible</p>
                                    <h2 className="font-bungee text-4xl sm:text-5xl lg:text-6xl text-white leading-none tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]">{profileLoading ? <Loader2 className="w-10 h-10 animate-spin" /> : profileError ? '—' : <>${Math.trunc(Number(me?.wallet?.balance ?? 0))}.<span className="text-3xl text-[#e6c59e]/70">{String(Math.round((Number(me?.wallet?.balance ?? 0) % 1) * 100)).padStart(2, '0')}</span> <span className="text-xl text-[#96c93e]">MXN</span></>}</h2>
                                    <p className="text-[11px] text-[#e6c59e] font-bold mt-4 flex items-center gap-2 bg-black/25 border border-[#96c93e]/20 w-max px-3 py-1.5 rounded-full"><ShieldAlert className="w-3.5 h-3.5 text-[#ffce07]" /> {me?.wallet?.expiresAt ? `Saldo expira el ${fmtDate(me.wallet.expiresAt)}` : 'El saldo acreditado expira a los 12 meses'}</p>
                                </div>
                                <div className="relative z-10 bg-[#ffce07]/10 p-6 rounded-[2rem] backdrop-blur-md border border-[#ffce07]/30 shadow-[0_0_35px_rgba(255,206,7,0.12)]">
                                    <CreditCard className="w-12 h-12 text-[#ffce07]" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-[#e6c59e] mb-6 uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#ffce07] rounded-full"></div>
                                    Movimientos del Ledger
                                </h3>
                                <div className="bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-3xl overflow-hidden shadow-premium">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#071f0a] border-b border-[#1a9a21]/30"><tr className="text-[#e6c59e]/55"><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Fecha / Folio</th><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Concepto</th><th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Monto</th></tr></thead>
                                        <tbody className="divide-y divide-[#1a9a21]/20">
                                            {ledgerLoading && (
                                                <tr><td colSpan={3} className="px-8 py-8 text-center text-[#e6c59e]/55 font-medium text-sm"><Loader2 className="w-5 h-5 animate-spin text-[#03bbd3] inline mr-2" /> Cargando movimientos...</td></tr>
                                            )}
                                            {ledgerError && (
                                                <tr><td colSpan={3} className="px-8 py-8 text-center text-[#ec1676] font-medium text-sm">No pudimos cargar los movimientos.</td></tr>
                                            )}
                                            {!ledgerLoading && !ledgerError && (ledger ?? []).length === 0 && (
                                                <tr><td colSpan={3} className="px-8 py-8 text-center text-[#e6c59e]/55 font-medium text-sm">Sin movimientos todavía.</td></tr>
                                            )}
                                            {(ledger ?? []).map((tx) => (
                                                <tr key={tx.id} className="hover:bg-[#071f0a] transition-colors">
                                                    <td className="px-8 py-6 text-[#e6c59e]/65 font-medium">{fmtDate(tx.createdAt)} <span className="text-[10px] font-mono block text-[#e6c59e]/40">{(tx.orderId ?? tx.id).slice(0, 8).toUpperCase()}</span></td>
                                                    <td className="px-8 py-6 text-[#e6c59e] font-black">{LEDGER_CONCEPT[tx.source] ?? tx.description ?? tx.source}</td>
                                                    {/* DEPOSIT (reembolsos) = verde + / WITHDRAWAL (compras) = rojo − */}
                                                    <td className={`px-8 py-6 text-right font-black ${tx.type === 'DEPOSIT' ? 'text-[#96c93e]' : 'text-[#ec1676]'}`}>{tx.type === 'DEPOSIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-[#1a9a21]/30">
                                <h3 className="text-xl font-black text-[#e6c59e] mb-6 uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#ec1676] rounded-full"></div>
                                    Mis Aportaciones Sociales
                                </h3>
                                {donationsLoading && (
                                    <div className="bg-[#071f0a] p-8 rounded-3xl border border-[#1a9a21]/30 text-center text-[#e6c59e]/65 font-bold shadow-inner">Cargando tus aportaciones...</div>
                                )}
                                {donationsError && (
                                    <div className="bg-[#071f0a] p-8 rounded-3xl border border-[#1a9a21]/30 text-center text-[#ec1676] font-bold shadow-inner">No pudimos cargar tus aportaciones en este momento.</div>
                                )}
                                {!donationsLoading && !donationsError && (myDonations ?? []).length === 0 && (
                                    <div className="bg-[#071f0a] p-8 rounded-3xl border border-[#1a9a21]/30 flex items-center gap-5 shadow-inner">
                                        <div className="w-16 h-16 bg-[#0a2e0d] rounded-2xl flex items-center justify-center border border-[#1a9a21]/30 shadow-sm"><HeartHandshake className="w-8 h-8 text-[#ec1676]" /></div>
                                        <div><p className="font-black text-[#e6c59e] uppercase tracking-tight">Aún no has realizado aportaciones</p><p className="text-xs text-[#e6c59e]/65 font-bold">Cuando realices una donación con tu sesión iniciada, aparecerá aquí.</p></div>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {(myDonations ?? []).map((donation) => (
                                        <div key={donation.id} className="bg-[#071f0a] p-8 rounded-3xl border border-[#1a9a21]/30 flex items-center justify-between shadow-inner">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-[#0a2e0d] rounded-2xl flex items-center justify-center border border-[#1a9a21]/30 shadow-sm"><HeartHandshake className="w-8 h-8 text-[#ec1676]" /></div>
                                                <div><p className="font-black text-[#e6c59e] uppercase tracking-tight">Aportación Social</p><p className="text-xs text-[#e6c59e]/65 font-bold">{fmtDate(donation.createdAt)} · {donation.status === 'COMPLETED' ? 'Completada' : donation.status === 'REFUNDED' ? 'Reembolsada' : 'Pendiente'}</p></div>
                                            </div>
                                            <p className={`text-2xl font-black ${donation.status === 'REFUNDED' ? 'text-[#e6c59e]/50' : donation.status === 'PENDING' ? 'text-[#ffce07]' : 'text-[#ec1676]'}`}>${Number(donation.amount).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: CUPONES FOMO [REQ-FE-21] */}
                    {activeTab === 'coupons' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="bg-[#071f0a] border-2 border-[#1a9a21]/30 p-3 rounded-2xl flex shadow-inner group focus-within:border-[#03bbd3] transition-all">
                                <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Ingresa tu código promocional..." className="flex-1 bg-transparent px-5 text-[#e6c59e] outline-none font-black font-mono uppercase placeholder:text-[#e6c59e]/40" />
                                <button disabled={redeemMutation.isPending || !couponInput.trim()} onClick={() => redeemMutation.mutate()} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#03bbd3]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">{redeemMutation.isPending ? 'Validando...' : 'Canjear'}</button>
                            </div>

                            {/* [Fase 44] Cupones VIGENTES reales · countdown vivo desde expires_at (BD) */}
                            <QueryFeedback loading={couponsLoading} error={couponsError} loadingText="Cargando promociones..." errorText="No pudimos cargar los cupones." />
                            {!couponsLoading && !couponsError && (coupons ?? []).length === 0 && (
                                <p className="text-sm text-[#e6c59e]/55 font-medium py-8 text-center">No hay promociones vigentes por ahora.</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
                                {(coupons ?? []).map((c) => (
                                <div key={c.code} className="bg-[#0a2e0d] border-2 border-[#96c93e]/30 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 relative overflow-hidden group hover:border-[#96c93e] transition-all shadow-premium">
                                    <div className="absolute top-0 right-0 bg-[#96c93e] text-white text-[11px] font-black uppercase px-6 py-2 rounded-bl-2xl shadow-md">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `$${Number(c.discountValue).toFixed(0)} OFF`}</div>
                                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#96c93e]/5 rounded-full blur-2xl"></div>
                                    <h3 className="text-3xl font-black text-[#e6c59e] mb-2 mt-4 tracking-tighter">{c.code}</h3>
                                    <p className="text-xs text-[#e6c59e]/55 font-bold uppercase tracking-widest mb-8">{c.minPurchaseAmount ? `Compra mínima $${Number(c.minPurchaseAmount).toFixed(0)}` : 'Válido en toda la tienda'}</p>
                                    <div className="bg-[#071f0a] p-4 rounded-2xl border border-[#1a9a21]/30 text-center shadow-inner">
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
                            <h2 className="font-bungee text-2xl sm:text-3xl text-[#e6c59e] uppercase leading-tight">Mis Favoritos</h2>
                            {/* [Fase 44] Favoritos reales con STOCK VIVO (totalStock del backend) */}
                            <QueryFeedback loading={wishlistLoading} error={wishlistError} loadingText="Cargando wishlist..." errorText="No pudimos cargar tus favoritos." />
                            {!wishlistLoading && !wishlistError && (wishlist ?? []).length === 0 && (
                                <p className="text-sm text-[#e6c59e]/55 font-medium py-8 text-center">Tu lista de favoritos está vacía. Toca el corazón de un producto para guardarlo aquí.</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {(wishlist ?? []).map((p) => (
                                    p.totalStock > 0 ? (
                                        <div key={p.id} className="bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col items-center hover:border-[#ec1676]/40 transition-all relative overflow-hidden group shadow-premium hover:shadow-xl">
                                            <button onClick={() => removeWishMutation.mutate(p.id)} disabled={removeWishMutation.isPending} className="absolute top-6 right-6 z-10 w-10 h-10 bg-[#071f0a] rounded-full flex items-center justify-center text-[#e6c59e]/55 hover:text-[#ec1676] hover:bg-[#0a2e0d] transition-all shadow-sm disabled:opacity-50"><Trash2 className="w-5 h-5" /></button>
                                            <div className="w-28 h-28 bg-[#071f0a] rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-12 h-12 text-[#e6c59e]/40" />}</div>
                                            <h3 className="font-black text-[#e6c59e] text-lg uppercase tracking-tight text-center">{p.name}</h3>
                                            <div className="w-full flex flex-col xl:flex-row gap-2 mt-6">
                                                <button onClick={() => navigate('product', p.id)} className="flex-1 bg-[#123d16] hover:bg-[#1a5c20] text-[#e6c59e] font-black py-3 rounded-2xl transition-all shadow-sm uppercase tracking-widest text-[10px]">Ver Detalles</button>
                                                <button disabled={addWishToCartMutation.isPending && addWishToCartMutation.variables === p.id} onClick={() => addWishToCartMutation.mutate(p.id)} className="flex-1 bg-[#03bbd3] hover:bg-[#02a8be] text-white font-black py-3 rounded-2xl transition-all shadow-lg shadow-[#03bbd3]/20 uppercase tracking-widest text-[10px]">{addWishToCartMutation.isPending && addWishToCartMutation.variables === p.id ? 'Agregando...' : 'Al Carrito'}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={p.id} className="bg-[#071f0a] border border-[#1a9a21]/30 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col items-center opacity-60 grayscale relative group">
                                            <span className="absolute top-6 left-6 bg-[#123d16] text-[#e6c59e]/65 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-[#1a9a21]/30">Agotado</span>
                                            <button onClick={() => removeWishMutation.mutate(p.id)} disabled={removeWishMutation.isPending} className="absolute top-6 right-6 z-10 w-10 h-10 bg-[#0a2e0d] rounded-full flex items-center justify-center text-[#e6c59e]/55 hover:text-[#ec1676] transition-all disabled:opacity-50"><Trash2 className="w-5 h-5" /></button>
                                            <div className="w-28 h-28 bg-[#0a2e0d] rounded-3xl flex items-center justify-center mb-6 overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-12 h-12 text-[#e6c59e]/25" />}</div>
                                            <h3 className="font-black text-[#e6c59e]/55 text-lg uppercase tracking-tight text-center">{p.name}</h3>
                                            <button disabled className="w-full bg-[#123d16] text-[#e6c59e]/55 font-black py-4 rounded-2xl mt-6 cursor-not-allowed uppercase tracking-widest text-[10px]">Sin Stock</button>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex flex-col min-[390px]:flex-row min-[390px]:justify-between min-[390px]:items-center gap-4 mb-8"><h2 className="font-bungee text-2xl sm:text-3xl text-[#e6c59e] uppercase leading-tight">Mis Direcciones</h2><button onClick={() => setShowAddAddress(!showAddAddress)} className="bg-[#96c93e]/10 text-[#96c93e] text-xs font-black px-5 py-3 rounded-xl border border-[#96c93e]/20 flex items-center justify-center gap-2 hover:bg-[#96c93e] hover:text-white transition-all uppercase tracking-widest"><Plus className="w-4 h-4" /> Agregar</button></div>

                            {/* [Fase 45] Direcciones REALES (REQ-FE-17): ⚙ = marcar principal · 🗑 = eliminar */}
                            <QueryFeedback loading={addressesLoading} error={addressesError} loadingText="Cargando direcciones..." errorText="No pudimos cargar tus direcciones." />
                            {!addressesLoading && !addressesError && (addresses ?? []).length === 0 && (
                                <p className="text-sm text-[#e6c59e]/55 font-medium py-8 text-center">Aún no tienes direcciones guardadas.</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                                {(addresses ?? []).map((a) => (
                                <div key={a.id} className={`bg-[#0a2e0d] border-2 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 pb-20 relative group transition-all shadow-premium ${a.isDefault ? 'border-[#96c93e]/30 hover:border-[#96c93e]' : 'border-[#1a9a21]/30 hover:border-[#03bbd3]/40'}`}>
                                    {a.isDefault && <span className="absolute top-6 right-6 bg-[#96c93e] text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">Principal</span>}
                                    <div className="w-14 h-14 bg-[#071f0a] rounded-2xl flex items-center justify-center mb-6 shadow-inner"><MapPin className={`w-7 h-7 ${a.isDefault ? 'text-[#96c93e]' : 'text-[#e6c59e]/55'}`} /></div>
                                    <p className="font-black text-[#e6c59e] text-xl uppercase tracking-tight">{a.label}</p>
                                    <p className="text-sm text-[#e6c59e]/65 mt-3 leading-relaxed font-medium">{a.street} #{a.exteriorNumber}, {a.neighborhood}<br />{a.municipality}, {a.state}. CP {a.postalCode}</p>
                                    <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-8 flex gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-y-2 md:group-hover:translate-y-0">
                                        {!a.isDefault && <button disabled={defaultAddrMutation.isPending} onClick={() => defaultAddrMutation.mutate(a.id)} title="Marcar como principal" className="p-2.5 bg-[#071f0a] rounded-xl text-[#e6c59e]/55 hover:text-[#03bbd3] hover:bg-[#0a2e0d] shadow-sm transition-all border border-[#1a9a21]/30"><Settings className="w-5 h-5" /></button>}
                                        <button disabled={deleteAddrMutation.isPending} onClick={() => deleteAddrMutation.mutate(a.id)} title="Eliminar dirección" className="p-2.5 bg-[#071f0a] rounded-xl text-[#e6c59e]/55 hover:text-[#ec1676] hover:bg-[#0a2e0d] shadow-sm transition-all border border-[#1a9a21]/30"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                ))}
                            </div>

                            {showAddAddress && (
                                <div className="bg-[#071f0a] border border-[#1a9a21]/30 p-4 min-[390px]:p-5 sm:p-8 lg:p-10 rounded-3xl sm:rounded-[2.5rem] max-w-lg animate-in zoom-in-95 duration-300 shadow-premium relative">
                                    <button onClick={() => setShowAddAddress(false)} className="absolute top-6 right-6 text-[#e6c59e]/40 hover:text-[#e6c59e]/75 transition-colors"><X className="w-6 h-6" /></button>
                                    <h3 className="font-black text-[#e6c59e] text-2xl mb-8 uppercase tracking-tighter">Nueva Dirección</h3>
                                    <form onSubmit={(e) => { e.preventDefault(); if (!/^[A-Z]{2}$/.test(addrForm.countryCode) || !addrForm.stateCode || !addrAuto.state || !addrAuto.municipality) { showToast('Selecciona un país, estado/región y ciudad válidos.', 'error'); return; } if (addrForm.countryCode === 'MX' && addrForm.cp.length !== 5) { showToast('El Código Postal de México debe tener 5 dígitos.', 'error'); return; } createAddrMutation.mutate(); }} className="space-y-6">
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Etiqueta</label><input type="text" required value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} placeholder="Ej. Casa Centro" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-[#e6c59e] outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">País</label>
                                                <select required value={addrForm.countryCode} disabled={countriesQuery.isPending || countriesQuery.isError} onChange={e => setAddrForm(f => ({ ...f, countryCode: e.target.value, stateCode: '', state: '', municipality: '', cp: '' }))} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-[#e6c59e] outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black disabled:opacity-60">
                                                    {countriesQuery.isPending && <option value="">Cargando países...</option>}
                                                    {countriesQuery.isError && <option value="">No disponibles</option>}
                                                    {(countriesQuery.data ?? []).map(country => <option key={country.code} value={country.code}>{country.name} ({country.code})</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Código Postal</label><input type="text" required value={addrForm.cp} onChange={e => setAddrForm(f => ({ ...f, cp: f.countryCode === 'MX' ? e.target.value.replace(/\D/g, '').slice(0, 5) : e.target.value.toUpperCase().slice(0, 10) }))} placeholder="Ej. 97000" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-[#e6c59e] outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Estado / Región</label>
                                                <select required value={addrForm.stateCode} disabled={!addrForm.countryCode || statesQuery.isPending || statesQuery.isError} onChange={e => { const selected = (statesQuery.data ?? []).find(state => state.code === e.target.value); setAddrForm(f => ({ ...f, stateCode: e.target.value, state: selected?.name ?? '', municipality: '' })); }} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-sm text-[#e6c59e]/55 font-bold outline-none focus:border-[#03bbd3] disabled:opacity-60">
                                                    <option value="">{statesQuery.isPending ? 'Cargando regiones...' : statesQuery.isError ? 'No disponibles' : 'Selecciona una región'}</option>
                                                    {(statesQuery.data ?? []).map(state => <option key={state.code} value={state.code}>{state.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Ciudad</label>
                                                <select required value={addrForm.municipality} disabled={!addrForm.stateCode || citiesQuery.isPending || citiesQuery.isError} onChange={e => setAddrForm(f => ({ ...f, municipality: e.target.value }))} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-sm text-[#e6c59e]/55 font-bold outline-none focus:border-[#03bbd3] disabled:opacity-60">
                                                    <option value="">{citiesQuery.isPending ? 'Cargando ciudades...' : citiesQuery.isError ? 'No disponibles' : 'Selecciona una ciudad'}</option>
                                                    {(citiesQuery.data ?? []).map(city => <option key={city} value={city}>{city}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#e6c59e]/45 font-bold">Datos geográficos actualizados desde Countries States Cities Database (ODbL).</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Colonia</label><input type="text" required value={addrForm.neighborhood} onChange={e => setAddrForm(f => ({ ...f, neighborhood: e.target.value }))} placeholder="Ej. Centro" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-[#e6c59e] outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                            <div className="space-y-2"><label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Nº Exterior</label><input type="text" required value={addrForm.exteriorNumber} onChange={e => setAddrForm(f => ({ ...f, exteriorNumber: e.target.value }))} placeholder="Ej. 123-B" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-[#e6c59e] outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        </div>
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Calle y Cruzamientos</label><input type="text" required value={addrForm.street} onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))} placeholder="Ej. Calle 60 x 45 y 47" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-[#e6c59e] outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        <div className="space-y-2"><label className="block text-[10px] font-black text-[#e6c59e]/55 uppercase tracking-widest">Referencias</label><input type="text" value={addrForm.references} onChange={e => setAddrForm(f => ({ ...f, references: e.target.value }))} placeholder="Color de casa, portón..." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl px-5 py-4 text-[#e6c59e] outline-none focus:border-[#03bbd3] transition-all shadow-sm font-black" /></div>
                                        {(countriesQuery.isError || statesQuery.isError || citiesQuery.isError) && <p className="text-xs text-[#ec1676] font-bold">No pudimos actualizar el catálogo geográfico. Reintenta en unos minutos.</p>}
                                        <button type="submit" disabled={createAddrMutation.isPending || countriesQuery.isPending || statesQuery.isPending || citiesQuery.isPending || countriesQuery.isError || statesQuery.isError || citiesQuery.isError} className="bg-[#03bbd3] text-white w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#03bbd3]/20 hover:bg-[#02a8be] transition-all transform hover:scale-[1.02] disabled:opacity-60">{createAddrMutation.isPending ? 'Guardando...' : 'Guardar Dirección'}</button>
                                    </form>
                                </div>
                            )}
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
