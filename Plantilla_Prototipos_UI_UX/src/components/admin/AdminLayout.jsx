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


import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { connectAdminRealtime, disconnectAdminRealtime } from '../../lib/adminWs';
import { ExportModal } from './ExportModal';
import { NotificationBell } from './NotificationBell';
import { DashboardView } from '../../pages/admin/DashboardPage';
import { KanbanView } from '../../pages/admin/KanbanPage';
import { CatalogView } from '../../pages/admin/CatalogPage';
import { InventoryView } from '../../pages/admin/InventoryPage';
import { CrmView } from '../../pages/admin/CrmPage';
import { CouponsView } from '../../pages/admin/CouponsPage';
import { MediaView } from '../../pages/admin/MediaPage';
import { GameBridgeView } from '../../pages/admin/GameBridgePage';
import { SettingsView } from '../../pages/admin/SettingsPage';
import { AuditView } from '../../pages/admin/AuditPage';
import { DonationsView } from '../../pages/admin/DonationsPage';
import { LegalView } from '../../pages/admin/LegalAdminPage';

/** Decodifica el `exp` (epoch s) del JWT sin verificarlo (solo para el contador visual). */
const jwtExpSeconds = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload.exp === 'number' ? payload.exp : null;
    } catch { return null; }
};

export const AdminLayout = ({ onLogout, showToast }) => {
    // [Fase 47] La vista actual vive en la URL del router de Vite (/admin/:module).
    const navigate = useNavigate();
    const location = useLocation();
    const currentView = location.pathname.match(/^\/admin\/?([\w-]*)/)?.[1] || 'dashboard';

    const [sidebarOpen, setSidebarOpen] = useState(() => (
        typeof window !== 'undefined' && window.innerWidth >= 1024
    ));
    const [subBreadcrumb, setSubBreadcrumb] = useState('');
    // [Fase 47] Countdown REAL: segundos hasta el `exp` del JWT admin (8h backend).
    const accessToken = useAdminAuthStore((s) => s.accessToken);
    const adminUser = useAdminAuthStore((s) => s.user);
    const exp = accessToken ? jwtExpSeconds(accessToken) : null;
    const [jwtTime, setJwtTime] = useState(() => (exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 28800));

    // [Fase 47] Command Palette del CMS (Cmd/Ctrl+K): salto rápido entre módulos.
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [paletteQuery, setPaletteQuery] = useState('');

    // [Fase 48] Modal de exportación asíncrona + WebSocket del canal admin.
    const [isExportOpen, setIsExportOpen] = useState(false);
    useEffect(() => {
        connectAdminRealtime(); // handshake con el JWT admin (?token=) → canal admin
        return () => disconnectAdminRealtime();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setJwtTime(prev => {
                if (prev === 300) showToast('Atención: La sesión expirará en 5 minutos.', 'warning');
                if (prev <= 1) { clearInterval(timer); onLogout(); }
                return prev > 0 ? prev - 1 : 0;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onLogout, showToast]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsPaletteOpen(prev => !prev);
                setPaletteQuery('');
            }
            if (e.key === 'Escape') setIsPaletteOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const handleNavigate = (view) => {
        navigate(`/admin/${view}`);
        setSubBreadcrumb('');
        setIsPaletteOpen(false);
        if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
    };

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Analítico', group: 'Analítica' },
        { id: 'crm', icon: Users, label: 'Gestor CRM (Clientes)', group: 'Operaciones' },
        { id: 'kanban', icon: Truck, label: 'Logística y Pedidos', group: 'Operaciones' },
        { id: 'inventory', icon: List, label: 'Monitor de Inventario', group: 'Catálogo' },
        { id: 'catalogo', icon: Package, label: 'CRUD Productos', group: 'Catálogo' },
        { id: 'coupons', icon: Ticket, label: 'Gestor de Cupones', group: 'Marketing' },
        { id: 'media', icon: ImageIcon, label: 'Media & Banners', group: 'Marketing' },
        { id: 'game', icon: Gamepad2, label: 'Game Bridge (NoSQL)', group: 'Integraciones' },
        { id: 'donaciones', icon: HeartHandshake, label: 'Gestor Donaciones', group: 'Integraciones' },
        { id: 'settings', icon: Settings, label: 'Config. Logística', group: 'Sistema' },
        { id: 'legal', icon: FileText, label: 'Textos Legales (Legal)', group: 'Sistema' },
        { id: 'audit', icon: ShieldAlert, label: 'Bitácora (Audit Log)', group: 'Sistema' },
    ];

    // Normaliza para que "logi" encuentre "Logística" (insensible a acentos)
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const filteredModules = menuItems.filter(i =>
        !paletteQuery.trim() || norm(i.label).includes(norm(paletteQuery)) || norm(i.group).includes(norm(paletteQuery))
    );

    return (
        <div className="flex h-screen overflow-hidden bg-brand-gradient">
            {/* [Fase 47] Command Palette (Cmd/Ctrl+K): salto rápido entre módulos */}
            {isPaletteOpen && (
                <div className="fixed inset-0 bg-[#061f09]/80 backdrop-blur-md z-[100] flex items-start justify-center pt-[18vh] p-4 animate-in fade-in" onClick={() => setIsPaletteOpen(false)}>
                    <div className="bg-[#0a2e0d]/95 border border-[#1a9a21]/30 rounded-3xl w-full max-w-xl shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 p-4 border-b border-[#1a9a21]/20">
                            <Search className="w-5 h-5 text-[#03bbd3]" />
                            <input
                                autoFocus value={paletteQuery} onChange={(e) => setPaletteQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && filteredModules[0]) handleNavigate(filteredModules[0].id); }}
                                placeholder="Saltar a un módulo del panel..."
                                className="flex-1 bg-transparent text-white outline-none placeholder:text-[#e6c59e]/40 font-bold"
                            />
                            <span className="bg-[#123d17] text-[#e6c59e]/55 px-2 py-1 rounded text-[10px] font-bold border border-[#1a9a21]/30">ESC</span>
                        </div>
                        <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {filteredModules.length === 0 && <p className="text-xs text-[#e6c59e]/55 font-bold text-center py-6">Sin coincidencias.</p>}
                            {filteredModules.map((item) => (
                                <button key={item.id} onClick={() => handleNavigate(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold text-left ${currentView === item.id ? 'bg-[#03bbd3]/15 text-[#03bbd3] border border-[#03bbd3]/20' : 'text-[#e6c59e]/70 hover:bg-[#1a9a21]/20 hover:text-[#e6c59e]'}`}>
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    <span className="text-[9px] uppercase tracking-widest text-[#e6c59e]/40">{item.group}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Cerrar navegación administrativa"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-[#061f09]/75 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-40 flex w-[85vw] max-w-72 flex-col glass-sidebar border-r border-[#1a9a21]/30 shadow-2xl shadow-black/40 transition-all duration-300 lg:relative lg:z-20 lg:max-w-none ${sidebarOpen ? 'translate-x-0 lg:w-72' : '-translate-x-full lg:w-20 lg:translate-x-0'}`}>
                <div className="p-5 flex items-center justify-between border-b border-[#1a9a21]/20 h-20 shrink-0">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3 animate-in fade-in">
                            <div className="w-8 h-8 bg-[#03bbd3] rounded-lg flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-white" />
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="font-bungee text-base text-white leading-tight truncate">Animayuks OS</h2>
                                <p className="text-[10px] text-[#03bbd3] font-mono tracking-widest uppercase">Admin Global</p>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'} className="flex h-11 w-11 items-center justify-center bg-black/20 hover:bg-[#1a9a21]/20 border border-[#1a9a21]/20 rounded-xl text-[#e6c59e]/70 hover:text-[#03bbd3] transition-colors mx-auto">
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar font-quicksand">
                    {menuItems.map((item, idx) => {
                        const isNewGroup = idx === 0 || menuItems[idx - 1].group !== item.group;
                        return (
                            <React.Fragment key={item.id}>
                                {isNewGroup && sidebarOpen && <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-[#e6c59e]/55 uppercase tracking-wider">{item.group}</p>}
                                <button
                                    onClick={() => handleNavigate(item.id)}
                                    title={!sidebarOpen ? item.label : ''}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold group
                    ${currentView === item.id ? 'bg-[#03bbd3]/15 text-[#03bbd3] border border-[#03bbd3]/30 shadow-lg shadow-[#03bbd3]/10' : 'text-[#e6c59e]/70 border border-transparent hover:bg-[#1a9a21]/20 hover:text-[#e6c59e]'}
                    ${!sidebarOpen ? 'justify-center' : ''}`}
                                >
                                    <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-[#03bbd3]' : 'text-[#e6c59e]/55'}`} />
                                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#1a9a21]/20 shrink-0 space-y-2">
                    {sidebarOpen && (
                        <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#e6c59e]/55 bg-[#0a2e0d] p-2 rounded-lg border border-[#1a9a21]/20">
                            <Clock className="w-3 h-3 text-[#ffce07]" /> Expira JWT: {formatTime(jwtTime)}
                        </div>
                    )}
                    <button onClick={onLogout} title={!sidebarOpen ? "Cerrar Sesión" : ''} className={`w-full flex items-center gap-3 p-3 text-[#e6c59e]/70 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-sm font-medium ${!sidebarOpen ? 'justify-center' : ''}`}>
                        <LogOut className="w-5 h-5 shrink-0" />
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
                <header className="h-16 sm:h-20 bg-[#0a2e0d]/75 backdrop-blur-xl border-b border-[#1a9a21]/30 flex items-center justify-between px-3 sm:px-4 md:px-8 z-10 shrink-0">
                    <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegación administrativa" className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#1a9a21]/30 bg-black/20 text-[#e6c59e] lg:hidden">
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="hidden md:flex items-center gap-2 text-sm min-w-0">
                        <span className="text-[#e6c59e]/55 font-medium">Panel Admin</span>
                        <ChevronRight className="w-4 h-4 text-[#e6c59e]/40" />
                        <span className={subBreadcrumb ? 'text-[#e6c59e]/70 font-medium cursor-pointer hover:text-white transition-colors' : 'text-[#03bbd3] font-bold'} onClick={() => setSubBreadcrumb('')}>
                            {menuItems.find(i => i.id === currentView)?.label}
                        </span>
                        {subBreadcrumb && (
                            <>
                                <ChevronRight className="w-4 h-4 text-[#e6c59e]/40" />
                                <span className="text-[#03bbd3] font-bold">{subBreadcrumb}</span>
                            </>
                        )}
                    </div>

                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-3 md:gap-6 ml-auto">
                        <button aria-label="Exportar reporte" className="flex h-11 w-11 sm:w-auto items-center justify-center gap-2 bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] sm:px-4 rounded-2xl text-sm font-black transition-colors shadow-lg shadow-[#96c93e]/20" onClick={() => setIsExportOpen(true)}>
                            <Database className="w-4 h-4" /> <span className="hidden xl:inline">Exportar Reporte</span>
                        </button>
                        {/* [Fase 48] Campana: escucha `report:ready` del WS admin */}
                        <NotificationBell showToast={showToast} />
                        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 md:pl-6 border-l border-[#1a9a21]/20">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">{adminUser ? `${adminUser.firstName} ${adminUser.lastName}`.trim() : 'Administrador'}</p>
                                <p className="text-xs text-[#03bbd3]">{adminUser?.email ?? 'Admin Global'}</p>
                            </div>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-[#1a9a21]/20 rounded-xl sm:rounded-2xl border border-[#03bbd3]/30 flex items-center justify-center text-[#03bbd3] font-black shadow-lg shadow-[#03bbd3]/10">{(adminUser?.firstName?.[0] ?? 'A').toUpperCase()}</div>
                        </div>
                    </div>
                </header>

                {/* [Fase 48] Export asíncrono: 202 + jobId; el aviso llega por la campana */}
                <ExportModal isOpen={isExportOpen} close={() => setIsExportOpen(false)} showToast={showToast} />

                <div className="flex-1 overflow-y-auto p-3 min-[390px]:p-4 sm:p-5 md:p-8 custom-scrollbar">
                    {currentView === 'dashboard' && <DashboardView />}
                    {currentView === 'crm' && <CrmView showToast={showToast} setSubBreadcrumb={setSubBreadcrumb} />}
                    {currentView === 'kanban' && <KanbanView showToast={showToast} />}
                    {currentView === 'inventory' && <InventoryView showToast={showToast} />}
                    {currentView === 'catalogo' && <CatalogView showToast={showToast} />}
                    {currentView === 'coupons' && <CouponsView showToast={showToast} />}
                    {currentView === 'media' && <MediaView showToast={showToast} />}
                    {currentView === 'game' && <GameBridgeView showToast={showToast} />}
                    {currentView === 'donaciones' && <DonationsView showToast={showToast} />}
                    {currentView === 'settings' && <SettingsView showToast={showToast} />}
                    {currentView === 'legal' && <LegalView showToast={showToast} />}
                    {currentView === 'audit' && <AuditView showToast={showToast} />}
                </div>
            </main>
        </div>
    );
};

// --- 3. VIEWS (MODULES) ---

// 3.1 DASHBOARD
