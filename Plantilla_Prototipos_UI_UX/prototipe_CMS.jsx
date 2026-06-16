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

// --- COLOR PALETTE & GLOBAL STYLES ---
const GlobalStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --brand-primary: #03bbd3;
            --brand-secondary: #ec1676;
            --brand-warning: #ffce07;
            --brand-success: #96c93e;
            --brand-deep: #502c84;
            --bg-deep: #0a0b14;
        }
        
        .bg-brand-gradient {
            background: radial-gradient(circle at 50% -20%, #502c84 0%, #0a0b14 100%);
        }

        .glass-sidebar {
            background: linear-gradient(180deg, rgba(80, 44, 132, 0.15) 0%, rgba(10, 11, 20, 0.95) 100%);
            backdrop-filter: blur(10px);
        }

        .brand-shadow {
            box-shadow: 0 10px 30px -10px rgba(3, 187, 211, 0.3);
        }
            --brand-deep-dark: #3a1f61;
        }
        .bg-brand-primary { background-color: var(--brand-primary); }
        .text-brand-primary { color: var(--brand-primary); }
        .border-brand-primary { border-color: var(--brand-primary); }
        
        .bg-brand-secondary { background-color: var(--brand-secondary); }
        .text-brand-secondary { color: var(--brand-secondary); }
        
        .bg-brand-warning { background-color: var(--brand-warning); }
        .text-brand-warning { color: var(--brand-warning); }
        
        .bg-brand-success { background-color: var(--brand-success); }
        .text-brand-success { color: var(--brand-success); }
        
        .bg-brand-deep { background-color: var(--brand-deep); }
        .text-brand-deep { color: var(--brand-deep); }
        
        .shadow-brand-primary { shadow-color: var(--brand-primary); }
        
        /* Custom Scrollbar using brand colors */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0b1121; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--brand-primary); }
    `}} />
);

// --- MAIN APP & STATE PROVIDER ---
export default function AdminApp() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    return (
        <div className="min-h-screen bg-brand-gradient text-slate-200 font-sans selection:bg-[#03bbd3]/30">
            <GlobalStyles />
            {/* Global Toast */}
            {toast && (
                <div className={`fixed top-8 right-8 px-6 py-4 rounded-xl font-bold shadow-2xl animate-in slide-in-from-right-8 z-50 flex items-center gap-3 border ${toast.type === 'success' ? 'bg-slate-800 text-[#96c93e] border-[#96c93e]/30' : toast.type === 'warning' ? 'bg-slate-800 text-[#ffce07] border-[#ffce07]/30' : 'bg-slate-800 text-red-400 border-red-500/30'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    {toast.msg}
                </div>
            )}

            {!isAuthenticated ? (
                <LoginScreen onLogin={() => setIsAuthenticated(true)} showToast={showToast} />
            ) : (
                <AdminLayout onLogout={() => setIsAuthenticated(false)} showToast={showToast} />
            )}
        </div>
    );
}

// --- 1. LOGIN SCREEN ---
const LoginScreen = ({ onLogin, showToast }) => {
    const [showRegister, setShowRegister] = useState(false);
    const [devCode, setDevCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(3);
    const [isBlocked, setIsBlocked] = useState(false);

    const handleRegister = (e) => {
        e.preventDefault();
        if (isBlocked) return;

        if (devCode === '000000') {
            showToast('Modo Registro Desbloqueado', 'success');
            onLogin();
        } else {
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);
            if (newAttempts <= 0) {
                setIsBlocked(true);
                showToast('IP Bloqueada (Fail2Ban). Contacte a soporte.', 'error');
            } else {
                showToast(`Código inválido. ${newAttempts} intentos restantes.`, 'warning');
            }
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-brand-gradient relative overflow-hidden">
            {/* Elementos decorativos animados */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#03bbd3]/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ec1676]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#502c84]/30 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-[#0a0b14]/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] shadow-2xl brand-shadow">
                    <div className="text-center mb-10">
                        <div
                            onClick={() => setShowRegister(!showRegister)}
                            className="w-24 h-24 bg-gradient-to-tr from-[#03bbd3] to-[#502c84] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/20 rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                        >
                            <Lock className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">ANIMAYUKS<span className="text-[#03bbd3]">.</span>OS</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Portal de Gestión Logística</p>
                    </div>

                    {!showRegister ? (
                        <form onSubmit={(e) => { e.preventDefault(); showToast('Sesión Iniciada', 'success'); onLogin(); }} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Identificador Corporativo</label>
                                <input
                                    required type="email" defaultValue="admin@animayuks.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-white/10 transition-all font-bold"
                                    placeholder="Usuario"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Clave de Acceso</label>
                                <div className="relative">
                                    <input
                                        required type={showPassword ? "text" : "password"} defaultValue="password123"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-white/10 transition-all font-bold"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500 hover:text-[#03bbd3]">
                                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#03bbd3] to-[#502c84] hover:from-[#ec1676] hover:to-[#502c84] text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-xl shadow-cyan-500/10 active:scale-95 flex items-center justify-center gap-3"
                            >
                                ACCEDER AL SISTEMA <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in zoom-in-95">
                            <div className="bg-[#ffce07]/10 border border-[#ffce07]/20 p-5 rounded-2xl flex items-start gap-4 mb-4">
                                <AlertTriangle className="w-6 h-6 text-[#ffce07] shrink-0" />
                                <p className="text-[11px] leading-relaxed text-[#ffce07]/90 font-bold uppercase tracking-tight">Acceso forzado de administradores. Registro directo en BD NoSQL sin validación RBAC.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#ffce07] uppercase tracking-widest ml-2">Developer Key</label>
                                <input
                                    required type={showPassword ? "text" : "password"}
                                    value={devCode} onChange={(e) => setDevCode(e.target.value)}
                                    placeholder="000000" disabled={isBlocked}
                                    className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-white outline-none transition-all font-mono tracking-widest text-center text-xl ${isBlocked ? 'border-red-500/50 opacity-50' : 'border-[#ffce07]/30 focus:border-[#ffce07] focus:bg-[#ffce07]/5'}`}
                                />
                            </div>
                            <button
                                type="submit" disabled={isBlocked}
                                className={`w-full font-black py-5 rounded-2xl transition-all duration-300 shadow-xl ${isBlocked ? 'bg-red-500/20 text-red-500/50 cursor-not-allowed' : 'bg-[#ffce07] hover:bg-[#e6b906] text-slate-900 shadow-[#ffce07]/20 active:scale-95'}`}
                            >
                                DESBLOQUEAR REGISTRO
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 2. ADMIN LAYOUT & NAVIGATION ---
const AdminLayout = ({ onLogout, showToast }) => {
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
const DashboardView = () => {
    const topProducts = [
        { id: 'PRD-01', name: 'Playera Jaguar Neón', size: 'M', sales: 145, revenue: '$43,500', stock: 12, status: 'warning' },
        { id: 'PRD-02', name: 'Peluche Animayuk Base', size: 'Única', sales: 98, revenue: '$29,400', stock: 45, status: 'ok' },
        { id: 'PRD-03', name: 'Sudadera Gamer', size: 'L', sales: 67, revenue: '$40,200', stock: 3, status: 'danger' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Analítico</h1>
                    <p className="text-slate-400 mt-1">Gráficos dinámicos y métricas en tiempo real.</p>
                </div>
                <select defaultValue="Últimos 7 días" className="bg-slate-800 border border-slate-700 text-sm text-slate-200 px-4 py-2 rounded-xl outline-none cursor-pointer">
                    <option>Últimos 7 días</option><option>Mes Actual</option><option>YTD (Año actual)</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Ventas Totales', value: '$124,500', trend: '+14%', color: '#03bbd3' },
                    { title: 'Ticket Promedio', value: '$1,200', trend: '+5%', color: '#ec1676' },
                    { title: 'Donaciones', value: '$8,450', trend: '+12%', color: '#96c93e' },
                    { title: 'Usuarios Activos', value: '1,204', trend: '+22%', color: '#ffce07' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 p-6 rounded-[30px] relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -right-4 -top-4 w-20 h-20 blur-3xl rounded-full opacity-20 transition-all group-hover:scale-150" style={{ backgroundColor: kpi.color }}></div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{kpi.title}</p>
                        <div className="flex items-end gap-3 relative z-10"><h3 className="text-3xl font-black text-white tracking-tighter">{kpi.value}</h3><span className="text-[#96c93e] text-xs font-bold bg-[#96c93e]/10 px-2 py-0.5 rounded-full">{kpi.trend}</span></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 flex flex-col shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-2">Ingresos y Ticket Promedio (Chart.js View)</h3>
                    <p className="text-xs text-slate-400 mb-6">Últimos 7 días de rendimiento transaccional.</p>
                    <div className="h-64 w-full relative pt-4 pb-6 border-b border-l border-slate-700 flex items-end justify-between px-4">
                        <div className="absolute -left-2 top-0 h-full flex flex-col justify-between text-[10px] text-slate-500 items-end pb-6 pr-2 transform -translate-x-full">
                            <span>$100k</span><span>$75k</span><span>$50k</span><span>$25k</span><span>$0</span>
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-between pb-6 border-b border-transparent pointer-events-none">
                            <div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div><div className="w-full h-px bg-slate-800"></div>
                        </div>
                        {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                            <div key={i} className="w-12 relative group flex flex-col justify-end h-full z-10">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 z-20 shadow-lg border border-slate-700 transition-opacity whitespace-nowrap pointer-events-none">
                                    <span className="font-bold text-[#03bbd3]">${h},000</span>
                                </div>
                                <div className="bg-[#03bbd3] hover:bg-[#03bbd3]/80 rounded-t-sm w-full transition-all cursor-crosshair" style={{ height: `${h}%` }}></div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-mono">D{i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 flex flex-col justify-between shadow-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Embudo de Conversión</h3>
                        <p className="text-xs text-slate-400 mb-6">Usuarios App → Compra Fija (Top 10)</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-6 mt-4">
                        <div className="space-y-2 group">
                            <div className="flex justify-between text-xs text-slate-400 font-bold"><span>1. Usuarios App</span> <span className="group-hover:text-white transition-colors">10,000</span></div>
                            <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden"><div className="bg-slate-600 h-full rounded-full w-full"></div></div>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-slate-700 group">
                            <div className="flex justify-between text-xs text-[#03bbd3] font-bold"><span>2. Reclaman UUID</span> <span className="group-hover:text-white transition-colors">3,500</span></div>
                            <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden"><div className="bg-[#03bbd3] h-full rounded-full w-[35%]"></div></div>
                        </div>
                        <div className="space-y-2 pl-8 border-l-2 border-slate-700 group">
                            <div className="flex justify-between text-xs text-[#96c93e] font-bold"><span>3. Compran Físico</span> <span className="group-hover:text-white transition-colors">1,204</span></div>
                            <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden"><div className="bg-[#96c93e] h-full rounded-full w-[12%] shadow-[0_0_10px_rgba(150,201,62,0.4)]"></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 flex flex-col shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Top 10 Productos Más Vendidos (Tiempo Real)</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 border-b border-slate-700/50">
                                <th className="pb-3 font-medium">ID / Producto</th>
                                <th className="pb-3 font-medium">Variante</th>
                                <th className="pb-3 font-medium">Ventas</th>
                                <th className="pb-3 font-medium">Ingresos</th>
                                <th className="pb-3 font-medium">Stock Local</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {topProducts.map((p, i) => (
                                <tr key={i} className="group hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4">
                                        <p className="font-bold text-slate-200">{p.name}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{p.id}</p>
                                    </td>
                                    <td className="py-4 text-slate-300">{p.size}</td>
                                    <td className="py-4 font-bold text-[#96c93e]">{p.sales} un.</td>
                                    <td className="py-4 text-slate-300">{p.revenue}</td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                      ${p.status === 'ok' ? 'bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/20' :
                                                p.status === 'warning' ? 'bg-[#ffce07]/10 text-[#ffce07] border-[#ffce07]/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'}
                    `}>
                                            {p.stock} pts
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// 3.2 KANBAN
const KanbanView = ({ showToast }) => {
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
const CatalogView = ({ showToast }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState(['Ropa', 'Accesorios']);
    const [newCat, setNewCat] = useState('');

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => { setIsSaving(false); showToast('Producto guardado exitosamente (OCC Validado)', 'success'); }, 1500);
    };

    const addCategory = () => {
        if (newCat && !categories.includes(newCat)) {
            setCategories([...categories, newCat]);
            setNewCat('');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div><h1 className="text-3xl font-black text-white tracking-tight">Master CRUD de Catálogo</h1></div>
            <form onSubmit={handleSave} className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 space-y-8 relative shadow-2xl">
                <div className="absolute top-8 right-8 flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400">Estado de Visibilidad:</span>
                    <div className="flex items-center gap-2 bg-[#96c93e]/10 text-[#96c93e] px-3 py-1.5 rounded-lg border border-[#96c93e]/20 cursor-pointer">
                        <ToggleRight className="w-5 h-5" /> <span className="text-xs font-bold">ACTIVO</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2"><span className="w-6 h-6 rounded-full bg-[#03bbd3]/20 text-[#03bbd3] flex items-center justify-center text-xs">1</span> Campos Base y Fotografías</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Nombre</label><input type="text" required className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-black/40 transition-all" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Precio Base (Sin Envío)</label><div className="relative"><span className="absolute left-6 top-4 text-slate-500 font-bold">$</span><input type="number" required className="w-full bg-black/20 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-black/40 transition-all" /></div></div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Selector Creativo Dinámico de Categorías (UX Notion)</label>
                        <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                            {categories.map(cat => (
                                <span key={cat} className="bg-[#03bbd3]/20 text-[#03bbd3] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">{cat} <X className="w-3 h-3 cursor-pointer" onClick={() => setCategories(categories.filter(c => c !== cat))} /></span>
                            ))}
                            <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())} type="text" placeholder="Buscar o crear..." className="bg-transparent border-none text-sm text-white outline-none flex-1 min-w-[150px]" />
                            <button type="button" onClick={addCategory} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> + Crear "{newCat || 'Nombre_Nuevo'}"</button>
                        </div>
                    </div>

                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Editor WYSIWYG (Rich Text)</label>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-6">
                        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex gap-2"><button type="button" className="p-1.5 text-slate-400 hover:text-white bg-slate-700 rounded"><Bold className="w-4 h-4" /></button></div>
                        <textarea rows="4" className="w-full bg-transparent p-4 text-sm text-slate-300 outline-none resize-none" placeholder="Redactar descripciones de forma enriquecida..."></textarea>
                    </div>

                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Fotografías</label>
                    <div className="flex gap-4">
                        <div className="w-1/3 relative border-2 border-dashed border-[#96c93e]/50 bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center text-[#96c93e] cursor-pointer text-center">
                            <div className="absolute top-2 left-2 bg-[#96c93e] text-white text-[10px] font-bold px-2 py-0.5 rounded">PORTADA PRINCIPAL</div>
                            <UploadCloud className="w-8 h-8 mb-2 mt-4" />
                            <p className="text-xs font-bold">Subir Imagen</p>
                        </div>
                        <div className="w-2/3 border-2 border-dashed border-slate-600 bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 cursor-pointer text-center hover:border-slate-500">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <p className="text-xs font-bold">Subir Galería Secundaria</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-4"><h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#03bbd3]/20 text-[#03bbd3] flex items-center justify-center text-xs">2</span> Gestión de Variantes (Abismo de las Tallas)</h3></div>
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-3 overflow-x-auto">
                        <div className="flex items-center gap-3 min-w-[700px]">
                            <div className="w-32"><label className="block text-[10px] text-slate-500 uppercase mb-1">SKU</label><input type="text" defaultValue="PLY-JAG-M" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none" /></div>
                            <div className="w-32"><label className="block text-[10px] text-slate-500 uppercase mb-1">Talla y Color</label><input type="text" defaultValue="M - Color Rojo" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none" /></div>
                            <div className="w-24"><label className="block text-[10px] text-amber-500 font-bold uppercase mb-1">Stock Asignado</label><input type="number" defaultValue="15" className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold outline-none text-center" /></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2"><span className="w-6 h-6 rounded-full bg-[#502c84]/20 text-[#502c84] flex items-center justify-center text-xs">3</span> Game Linker Inteligente</h3>
                    <div className="bg-gradient-to-r from-[#502c84]/20 to-slate-900 border border-[#502c84]/30 p-6 rounded-xl flex gap-4">
                        <Gamepad2 className="w-8 h-8 text-[#502c84] shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-200 mb-1">Asociar recompensa virtual a producto físico</p>
                            <select defaultValue="skin_jaguar" className="w-full bg-slate-900 border border-[#502c84]/50 rounded-xl px-4 py-3 text-white outline-none mt-2">
                                <option value="">Ninguna recompensa</option><option value="skin_jaguar">🎮 Skin: Jaguar Dorado (Menú asíncrono)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-700">
                    <button type="submit" disabled={isSaving} className="bg-[#96c93e] hover:bg-[#86b537] disabled:bg-[#96c93e]/50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Producto
                    </button>
                </div>
            </form>
        </div>
    );
};

// 3.4 MONITOR GLOBAL DE INVENTARIO
const InventoryView = ({ showToast }) => {
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
const CrmView = ({ showToast, setSubBreadcrumb }) => {
    const [selectedUser, setSelectedUser] = useState(null);

    const openProfile = (u) => {
        setSelectedUser(u);
        setSubBreadcrumb(`Perfil: ${u.n}`);
    };

    const closeProfile = () => {
        setSelectedUser(null);
        setSubBreadcrumb('');
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto relative">
            <div className="flex justify-between items-end">
                <div><h1 className="text-3xl font-black text-white tracking-tight">Gestor CRM y Monederos</h1><p className="text-slate-400 mt-1">Administración y auditoría de usuarios registrados.</p></div>
            </div>

            {!selectedUser ? (
                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/80 border-b border-slate-700">
                            <tr className="text-slate-400">
                                <th className="px-6 py-4 font-bold">Cliente y Correo</th>
                                <th className="px-6 py-4 font-bold">Fecha de Registro</th>
                                <th className="px-6 py-4 font-bold">Historial de Compras</th>
                                <th className="px-6 py-4 font-bold text-[#ffce07]">Saldo del Monedero</th>
                                <th className="px-6 py-4 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {[{ n: 'Roberto Gómez', e: 'roberto.g@gmail.com', d: '10/May/2026', t: '4 tickets ($4,500)', w: '$150.00 MXN', ip: '201.145.23.1', v: 'v1.2', exp: '10/May/2027' }].map((c, i) => (
                                <tr key={i} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4"><p className="font-bold text-white">{c.n}</p><p className="text-xs text-slate-500">{c.e}</p></td>
                                    <td className="px-6 py-4 text-slate-400">{c.d}</td>
                                    <td className="px-6 py-4 text-[#96c93e] font-medium">{c.t}</td>
                                    <td className="px-6 py-4 text-[#ffce07] font-bold bg-slate-800/30">{c.w}</td>
                                    <td className="px-6 py-4"><button onClick={() => openProfile(c)} className="bg-slate-800 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 text-[#03bbd3]">Ver Perfil</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 animate-in slide-in-from-right-8">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-[#502c84] rounded-full flex items-center justify-center text-2xl font-black text-white/50">R</div>
                            <div><h2 className="text-2xl font-black text-white">{selectedUser.n}</h2><p className="text-slate-400">{selectedUser.e}</p></div>
                        </div>
                        <button onClick={closeProfile} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                            <h4 className="text-sm font-bold text-slate-400 mb-4">Trazabilidad Legal (Audit Trail)</h4>
                            <p className="text-sm text-slate-300">Términos aceptados: <span className="font-mono text-[#03bbd3] bg-[#03bbd3]/10 px-2 py-0.5 rounded">{selectedUser.v}</span></p>
                            <p className="text-sm text-slate-300 mt-2">IP Registro: <span className="font-mono text-slate-400">{selectedUser.ip}</span></p>
                        </div>
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                            <h4 className="text-sm font-bold text-slate-400 mb-4">Estado del Monedero</h4>
                            <p className="text-3xl font-black text-[#ffce07] mb-2">{selectedUser.w}</p>
                            <p className="text-xs text-red-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Expira legalmente el: {selectedUser.exp}</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-6 flex justify-end">
                        <button onClick={() => { showToast('Usuario bloqueado por posible fraude', 'error'); closeProfile(); }} className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
                            <Ban className="w-4 h-4" /> Suspender Cuenta (Bloqueo Fraude)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3.6 GESTOR DE CUPONES
const CouponsView = ({ showToast }) => {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto relative">
            <div className="flex justify-between items-end">
                <div><h1 className="text-3xl font-black text-white tracking-tight">Gestor de Cupones</h1><p className="text-slate-400 mt-1">Creación y administración de códigos de descuento.</p></div>
                <button onClick={() => setShowForm(true)} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20"><Plus className="w-5 h-5" /> NUEVO CUPÓN</button>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <div>
                        <div className="flex items-center gap-3"><span className="text-lg font-mono font-bold text-[#03bbd3] bg-[#03bbd3]/10 px-3 py-1 rounded border border-[#03bbd3]/20">VERANO26</span><span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">15% Dto.</span></div>
                        <p className="text-xs text-slate-400 mt-2">Fecha de expiración estricta: 30/Ago/2026 • Límite usos: 100</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#03bbd3]">ACTIVO</span>
                        <ToggleRight className="w-8 h-8 text-[#03bbd3] cursor-pointer" onClick={() => showToast('Campaña desactivada en tiempo real sin destruir registro histórico.', 'warning')} />
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={(e) => { e.preventDefault(); showToast('Cupón creado', 'success'); setShowForm(false); }} className="bg-slate-800 border border-slate-700 rounded-3xl p-8 w-full max-w-lg animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-6">Crear Código Promocional</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código (Alfanumérico)</label><input required type="text" placeholder="Ej. BUENFIN" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono uppercase outline-none" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo / Monto Directo</label>
                                    <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                                        <select defaultValue="%" className="bg-slate-800 text-white px-2 py-3 border-r border-slate-700 outline-none text-xs"><option value="%">%</option><option value="$ MXN">$ MXN</option></select>
                                        <input required type="number" className="flex-1 bg-transparent px-3 py-3 text-white outline-none" />
                                    </div>
                                </div>
                                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Límite usos globales</label><input required type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha de Expiración Estricta</label><input required type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 text-slate-400">Cancelar</button>
                            <button type="submit" className="flex-1 bg-[#03bbd3] text-white py-3 rounded-xl font-bold">Activar Cupón</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// 3.7 MEDIA VIEW
const MediaView = ({ showToast }) => {
    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Media Manager y Banners</h1>
                <p className="text-slate-400 mt-1">Configuración del Hero Carousel 3D Multicapa.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
                    <h3 className="font-bold text-white mb-4">Hero Carousel Actual</h3>
                    <div className="space-y-3">
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-4 cursor-grab hover:border-[#03bbd3]/50 transition-colors">
                            <GripVertical className="text-slate-500" />
                            <div className="w-16 h-10 bg-slate-800 rounded flex items-center justify-center relative overflow-hidden">
                                <ImageIcon className="w-5 h-5 text-slate-500" />
                                <div className="absolute inset-0 border-2 border-[#03bbd3] rounded opacity-50"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">Promo Jaguar (3D)</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> /descargar</p>
                            </div>
                            <ToggleRight className="text-[#03bbd3] w-6 h-6 cursor-pointer" onClick={() => showToast('Banner Desactivado temporalmente', 'warning')} />
                        </div>

                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-4 cursor-grab hover:border-[#03bbd3]/50 transition-colors opacity-60">
                            <GripVertical className="text-slate-500" />
                            <div className="w-16 h-10 bg-slate-800 rounded flex items-center justify-center"><MonitorPlay className="w-5 h-5 text-slate-500" /></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">Video Gameplay</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> youtube.com/watch</p>
                            </div>
                            <ToggleRight className="text-slate-600 w-6 h-6 rotate-180 cursor-pointer" onClick={() => showToast('Banner Activado', 'success')} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 space-y-6 shadow-2xl">
                    <h3 className="font-bold text-white border-b border-slate-700 pb-2 flex items-center gap-2"><Layers className="w-5 h-5 text-[#03bbd3]" /> Creador Multicapa 3D</h3>
                    <div className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Título Interno</label>
                                <input type="text" placeholder="Ej. Lanzamiento" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Hipervínculo al Clic</label>
                                <input type="text" placeholder="/producto/123" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase text-center">Capa 1: Fondo Base (BG)</label>
                                <div className="h-20 border-2 border-dashed border-slate-600 bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-500 cursor-pointer hover:border-[#03bbd3]/50 transition-colors">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#03bbd3] mb-1 uppercase text-center">Capa 2: SVG Frontal (3D)</label>
                                <div className="h-20 border-2 border-dashed border-[#03bbd3]/30 bg-[#03bbd3]/5 rounded-xl flex flex-col items-center justify-center text-[#03bbd3] cursor-pointer hover:border-[#03bbd3]/50 transition-colors">
                                    <UploadCloud className="w-5 h-5 mb-1" />
                                    <span className="text-[9px] font-bold">Pop-out Frontal</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700">
                            <label className="block text-xs font-bold text-slate-400 mb-2">Opcional: Video Dinámico (Fondo Invertido)</label>
                            <input type="text" placeholder="URL del video (Se reproducirá en loop sin sonido tipo GIF)" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                            <p className="text-[10px] text-slate-500 mt-1">Si se coloca un enlace, el video sustituirá a la Capa 1 de Fondo Base.</p>
                        </div>

                        <button onClick={() => showToast('Banner Multicapa 3D Guardado y Validado', 'success')} className="w-full bg-[#03bbd3] hover:bg-[#02a8be] text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-[#03bbd3]/20">Añadir al Carrusel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.8 GAME BRIDGE 
const GameBridgeView = ({ showToast }) => {
    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div><h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">Consola In-Game <span className="bg-[#96c93e]/20 text-[#96c93e] text-xs px-2 py-1 rounded-full border border-[#96c93e]/30 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#96c93e] animate-pulse"></div> DB Online</span></h1><p className="text-slate-400 mt-1">Lectura directa a BD NoSQL.</p></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between border-b border-slate-700 pb-4">
                        <span className="flex items-center gap-2"><Gamepad2 className="w-6 h-6 text-[#502c84]" /> Recompensas NoSQL</span>
                        <button className="bg-[#502c84] text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> Nueva</button>
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
                            <span className="font-medium text-slate-300">Skin Jaguar Dorado</span>
                            <div className="flex gap-2">
                                <button className="text-slate-500 hover:text-white border border-slate-700 p-1.5 rounded bg-slate-800">Edit</button>
                                <button onClick={() => showToast('Acción bloqueada: Impedido eliminar recompensa virtual (CMS-BE-03) por vínculo a producto activo en Tienda E-commerce.', 'error')} className="text-red-500 hover:bg-red-500/20 border border-slate-700 p-1.5 rounded bg-slate-800 flex items-center gap-1 px-2 text-xs font-bold"><Ban className="w-4 h-4" /> Delete Blocked</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Banner Manager del Juego</h2>
                    <div className="space-y-4">
                        <select defaultValue="PRD-01" className="w-full bg-slate-900 border border-[#03bbd3]/50 rounded-xl px-4 py-3 text-white outline-none">
                            <option value="PRD-01">Producto Físico a mostrar: PRD-01 (Playera Jaguar)</option>
                        </select>
                        <button onClick={() => showToast('Definido. La App NoSQL mostrará este producto físico SQL.', 'success')} className="w-full bg-[#03bbd3] text-white font-bold py-3 rounded-xl mt-4">Publicar en App</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.9 SETTINGS (Costo de Envío Local, Foráneo, Umbral y Mínimo de Compra Unificados)
const SettingsView = ({ showToast }) => {
    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div><h1 className="text-3xl font-black text-white tracking-tight">Configuración Global de Rutas</h1><p className="text-slate-400 mt-1">Definición de ETAs y operaciones comerciales.</p></div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 space-y-6 shadow-2xl">
                {/* NUEVA CUADRÍCULA (5 COLUMNAS PARA ACOMODAR TODOS LOS COSTOS) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 border-b border-slate-700 pb-6">
                    <div className="col-span-2 md:col-span-5">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dirección Física del Local</label>
                        <input type="text" defaultValue="Calle 60 #123 x 45 y 47, Centro, Mérida, Yucatán" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estado Base</label>
                        <input type="text" defaultValue="Yucatán" disabled className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-500" />
                    </div>

                    {/* NUEVO: Costo Envío Local */}
                    <div>
                        <label className="block text-xs font-bold text-[#03bbd3] uppercase mb-2">Costo Envío Local</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="49" className="w-full bg-slate-900 border border-[#03bbd3]/50 rounded-xl pl-8 pr-4 py-3 text-[#03bbd3] font-bold outline-none" /></div>
                    </div>

                    {/* Costo Envío Foráneo */}
                    <div>
                        <label className="block text-xs font-bold text-[#ffce07] uppercase mb-2">Costo Envío Foráneo</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="199" className="w-full bg-slate-900 border border-[#ffce07]/50 rounded-xl pl-8 pr-4 py-3 text-[#ffce07] font-bold outline-none" /></div>
                    </div>

                    {/* Umbral Envío Gratis */}
                    <div>
                        <label className="block text-xs font-bold text-[#96c93e] uppercase mb-2">Umbral Envío Gratis</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="1500" className="w-full bg-slate-900 border border-[#96c93e]/50 rounded-xl pl-8 pr-4 py-3 text-[#96c93e] font-bold outline-none" /></div>
                    </div>

                    {/* Mínimo de Compra */}
                    <div>
                        <label className="block text-xs font-bold text-[#502c84] uppercase mb-2">Mínimo de Compra</label>
                        <div className="relative"><span className="absolute left-4 top-3 text-slate-400 font-bold">$</span><input type="number" defaultValue="200" className="w-full bg-slate-900 border border-[#502c84]/50 rounded-xl pl-8 pr-4 py-3 text-[#502c84] font-bold outline-none" /></div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Matriz de Municipios Locales (Aplica Tarifa Local)</label>
                    <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-wrap gap-2">
                        {['Mérida', 'Progreso', 'Kanasín', 'Umán'].map(tag => (
                            <span key={tag} className="bg-[#03bbd3]/10 text-[#03bbd3] border border-[#03bbd3]/20 px-3 py-1 rounded-lg text-sm flex items-center gap-2">{tag} <span className="cursor-pointer">&times;</span></span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div><label className="block text-xs font-bold text-slate-400 mb-2">Definición ETA Local</label><input type="text" defaultValue="Llega hoy mismo" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                    <div><label className="block text-xs font-bold text-slate-400 mb-2">Definición ETA Paquetería</label><input type="text" defaultValue="3 a 5 días hábiles" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                </div>

                {/* Change Dev Code Secure */}
                <div className="pt-6 border-t border-slate-700 mt-6">
                    <label className="block text-xs font-bold text-red-400 uppercase mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Gestión de Credenciales de Rescate (Easter Egg)</label>
                    <div className="flex gap-4 items-center bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                        <div className="flex-1"><input type="password" placeholder="Código Actual" className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-2 text-white font-mono" /></div>
                        <div className="flex-1"><input type="password" placeholder="Confirmar Nuevo Código" className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-2 text-white font-mono" /></div>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold" onClick={() => showToast('Código de desarrollador modificado con éxito.', 'success')}>Actualizar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.10 AUDIT LOG 
const AuditView = () => {
    const [showJson, setShowJson] = useState(false);

    const logs = [
        { date: '2026-05-27 10:15', user: 'admin@animayuks.com', action: 'UPDATE', target: 'PRD-01 (Precio)', ip: '192.168.1.45' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto relative">
            <div className="flex justify-between items-end">
                <div><h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3"><History className="w-8 h-8 text-[#03bbd3]" /> Visor de Bitácora (Audit Log Grid)</h1><p className="text-slate-400 mt-1">Tabla inmutable de solo lectura con filtros avanzados.</p></div>
                <div className="flex gap-3">
                    <input type="date" className="bg-black/40 border border-white/10 text-sm text-slate-200 px-4 py-2 rounded-xl outline-none" />
                    <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" /><input type="text" placeholder="¿Qué hizo el administrador X?" className="bg-black/40 border border-white/10 text-sm rounded-xl pl-9 pr-4 py-2 text-white w-56 outline-none" /></div>
                    <select defaultValue="Todas las Acciones" className="bg-black/40 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-sm outline-none">
                        <option value="Todas las Acciones">Todas las Acciones</option><option value="CREATE">CREATE</option><option value="UPDATE">UPDATE</option><option value="SOFT_DELETE">SOFT_DELETE</option><option value="REFUND">REFUND</option>
                    </select>
                </div>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/80 border-b border-slate-700">
                        <tr className="text-slate-400">
                            <th className="px-6 py-4 font-bold">Timestamp</th>
                            <th className="px-6 py-4 font-bold">Admin</th>
                            <th className="px-6 py-4 font-bold">IP de Origen</th>
                            <th className="px-6 py-4 font-bold text-center">Payload Viejo/Nuevo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {logs.map((log, i) => (
                            <tr key={i} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.date}</td>
                                <td className="px-6 py-4 text-slate-200 font-bold">{log.user}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.ip}</td>
                                <td className="px-6 py-4 text-center"><button onClick={() => setShowJson(true)} className="text-slate-500 hover:text-[#96c93e] bg-slate-900 p-2 rounded-lg border border-slate-700 flex items-center justify-center mx-auto gap-2 text-xs"><Code className="w-4 h-4" /> Ver</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showJson && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between mb-4"><h3 className="text-white font-bold font-mono">Payload Diff Viewer</h3><button onClick={() => setShowJson(false)} className="text-slate-400"><X /></button></div>
                        <pre className="bg-slate-900 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-700">
                            {`{
  "action": "UPDATE",
  "table": "products",`}
                            <br /><span className="text-red-400 bg-red-500/10 block w-full px-2">{'- "old_value": { "price": 400.00 }'}</span><span className="text-[#96c93e] bg-[#96c93e]/10 block w-full px-2">{'+ "new_value": { "price": 450.00 }'}</span>{`}
`}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3.11 DONATIONS VIEW
const DonationsView = ({ showToast }) => {
    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Gestor del Modal de Donaciones</h1>
                <p className="text-[#ec1676] mt-1 font-bold uppercase tracking-widest text-[10px]">Módulo dedicado para modificar el panel del cliente.</p>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ec1676]/10 blur-[50px] pointer-events-none"></div>

                <div className="space-y-6 relative z-10">
                    <div className="flex gap-6">
                        <div className="w-1/3 flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Banner del Pop-Up Front</label>
                            <div className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-[#ec1676]/50 transition-colors cursor-pointer">
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <span className="text-xs font-bold text-center px-4">Subir Ilustración<br />(Ej. Temática Halloween)</span>
                            </div>
                        </div>

                        <div className="w-2/3 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#ec1676] uppercase mb-2">Botones de Acceso Rápido (Chips)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="relative"><span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">$</span><input type="number" defaultValue="10" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white outline-none" /></div>
                                    <div className="relative"><span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">$</span><input type="number" defaultValue="20" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white outline-none" /></div>
                                    <div className="relative"><span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">$</span><input type="number" defaultValue="30" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white outline-none" /></div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">El 4to botón siempre dirá "Otra cantidad" dinámicamente en el front.</p>
                            </div>

                            <div className="pt-2 border-t border-slate-700">
                                <label className="block text-xs font-bold text-[#ec1676] uppercase mb-2">Input Libre: Monto Mínimo Permitido (Antifraude)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                    <input type="number" defaultValue="10" className="w-full bg-slate-900 border-[#ec1676]/50 rounded-xl pl-8 pr-4 py-3 text-[#ec1676] font-bold outline-none" />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Evita errores de procesamiento de cobros mínimos en Stripe.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#96c93e]" /> Transparencia Fiscal Activada
                        </h4>
                        <p className="text-xs text-slate-400">Si un usuario anónimo intenta donar, el frontend le exigirá un correo electrónico obligatorio para enviar el recibo.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-700">
                        <button type="button" onClick={() => showToast('Modal de donaciones actualizado', 'success')} className="bg-[#ec1676] hover:bg-[#d11368] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg">
                            Actualizar Modal UI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3.12 LEGAL VIEW 
const LegalView = ({ showToast }) => {
    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Editor de Textos Legales (Compliance CMS)</h1>
                <p className="text-slate-400 mt-1">Interfaz exclusiva para modificar dinámicamente el contenido legal sin reprogramar la página.</p>
            </div>

            <div className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden flex flex-col h-[600px] relative shadow-2xl">
                <div className="flex bg-slate-900 border-b border-slate-700">
                    <button className="px-6 py-4 text-sm font-bold text-[#96c93e] border-b-2 border-[#96c93e] bg-slate-800">Aviso Privacidad</button>
                    <button className="px-6 py-4 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">Términos Venta</button>
                    <button className="px-6 py-4 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">Términos Juego</button>
                    <button className="px-6 py-4 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">Políticas de Seguridad</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-3/4 flex flex-col border-r border-slate-700">
                        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex gap-4">
                            <button className="p-1.5 text-white bg-slate-700 rounded"><Bold className="w-4 h-4" /></button>
                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Italic className="w-4 h-4" /></button>
                        </div>
                        <textarea className="flex-1 bg-transparent p-8 text-slate-300 outline-none resize-none custom-scrollbar leading-relaxed" defaultValue="Última actualización: 27 de Mayo de 2026.&#10;&#10;De conformidad con lo establecido en la Ley Federal de Protección de Datos Personales..."></textarea>
                    </div>

                    <div className="w-1/4 bg-slate-900 p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Historial Versiones</h4>
                        <div className="space-y-2">
                            <div className="p-2 bg-[#96c93e]/10 border border-[#96c93e]/30 rounded text-[#96c93e] text-xs font-bold">v1.2 (Actual) - 27 May</div>
                            <div className="p-2 border border-slate-700 rounded text-slate-500 text-xs cursor-pointer hover:bg-slate-800">v1.1 - 10 Ene</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border-t border-slate-700 p-4 flex justify-between items-center">
                    <p className="text-xs text-slate-500">Al guardar, el backend registrará esta versión para futuras ventas y la bitácora legal (Audit Trail).</p>
                    <button onClick={() => showToast('Versión v1.3 Publicada. Audit Log actualizado.', 'success')} className="bg-[#96c93e] hover:bg-[#86b537] text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" /> Publicar Versión v1.3
                    </button>
                </div>
            </div>
        </div>
    );
};