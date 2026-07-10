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

export const AdminLayout = ({ onLogout, showToast }) => {
    const [currentView, setCurrentView] = useState('settings'); // Settings por defecto para ver los cambios
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [subBreadcrumb, setSubBreadcrumb] = useState('');
    const [jwtTime, setJwtTime] = useState(28800);

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

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const handleNavigate = (view) => {
        setCurrentView(view);
        setSubBreadcrumb('');
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

    return (
        <div className="flex h-screen overflow-hidden bg-brand-gradient">
            <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 glass-sidebar border-r border-[#502c84]/30 flex flex-col z-20 relative shadow-2xl`}>
                <div className="p-5 flex items-center justify-between border-b border-slate-800 h-20 shrink-0">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3 animate-in fade-in">
                            <div className="w-8 h-8 bg-[#03bbd3] rounded-lg flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-white" />
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="text-lg font-black text-white tracking-tight truncate">Animayuks OS</h2>
                                <p className="text-[10px] text-[#03bbd3] font-mono tracking-widest uppercase">Admin Global</p>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors mx-auto">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    {menuItems.map((item, idx) => {
                        const isNewGroup = idx === 0 || menuItems[idx - 1].group !== item.group;
                        return (
                            <React.Fragment key={item.id}>
                                {isNewGroup && sidebarOpen && <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.group}</p>}
                                <button
                                    onClick={() => handleNavigate(item.id)}
                                    title={!sidebarOpen ? item.label : ''}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold group
                    ${currentView === item.id ? 'bg-[#03bbd3] text-white shadow-lg shadow-[#03bbd3]/40' : 'text-slate-400 hover:bg-[#502c84]/30 hover:text-white'}
                    ${!sidebarOpen ? 'justify-center' : ''}`}
                                >
                                    <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-white' : 'text-slate-500'}`} />
                                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 shrink-0 space-y-2">
                    {sidebarOpen && (
                        <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500 bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <Clock className="w-3 h-3 text-[#ffce07]" /> Expira JWT: {formatTime(jwtTime)}
                        </div>
                    )}
                    <button onClick={onLogout} title={!sidebarOpen ? "Cerrar Sesión" : ''} className={`w-full flex items-center gap-3 p-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-sm font-medium ${!sidebarOpen ? 'justify-center' : ''}`}>
                        <LogOut className="w-5 h-5 shrink-0" />
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-hidden">
                <header className="h-20 bg-[#0a0b14]/60 backdrop-blur-xl border-b border-[#03bbd3]/20 flex items-center justify-between px-8 z-10 shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 font-medium">Panel Admin</span>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                        <span className={subBreadcrumb ? 'text-slate-400 font-medium cursor-pointer hover:text-white transition-colors' : 'text-[#03bbd3] font-bold'} onClick={() => setSubBreadcrumb('')}>
                            {menuItems.find(i => i.id === currentView)?.label}
                        </span>
                        {subBreadcrumb && (
                            <>
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                                <span className="text-[#03bbd3] font-bold">{subBreadcrumb}</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 bg-[#03bbd3] hover:bg-[#02a8be] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-[#03bbd3]/20" onClick={() => showToast('Exportación enviada a cola asíncrona (BullMQ)', 'success')}>
                            <Database className="w-4 h-4" /> Exportar Reporte
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">Braulio Bernal</p>
                                <p className="text-xs text-[#03bbd3]">Tech Lead</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-700 rounded-full border-2 border-slate-600 flex items-center justify-center text-slate-300 font-bold">B</div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
