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


import { GlobalStyles } from '../../components/admin/GlobalStyles';
import { LoginScreen } from '../../components/admin/LoginScreen';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminAuthStore } from '../../store/adminAuthStore';

export default function AdminApp() {
    // [Fase 47] EL MURO: la sesión admin vive SOLO en memoria (adminAuthStore).
    // Sin accessToken (JWT verificado con TOTP) jamás se monta el AdminLayout.
    // Recargar la pestaña pierde el token a propósito → re-login con 2FA.
    const isAuthenticated = useAdminAuthStore((s) => !!s.accessToken);
    const adminLogout = useAdminAuthStore((s) => s.logout);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    return (
        <div className="min-h-screen bg-brand-gradient text-[#e6c59e] font-quicksand selection:bg-[#03bbd3]/30">
            <GlobalStyles />
            {/* Global Toast */}
            {toast && (
                <div className={`fixed top-8 right-8 px-6 py-4 rounded-xl font-bold shadow-2xl animate-in slide-in-from-right-8 z-50 flex items-center gap-3 border ${toast.type === 'success' ? 'bg-[#123d17] text-[#96c93e] border-[#96c93e]/30' : toast.type === 'warning' ? 'bg-[#123d17] text-[#ffce07] border-[#ffce07]/30' : 'bg-[#123d17] text-red-400 border-red-500/30'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    {toast.msg}
                </div>
            )}

            {!isAuthenticated ? (
                <LoginScreen onLogin={() => { /* la sesión ya quedó en el adminAuthStore */ }} showToast={showToast} />
            ) : (
                <AdminLayout onLogout={() => { adminLogout(); showToast('Sesión cerrada', 'success'); }} showToast={showToast} />
            )}
        </div>
    );
}

// --- 1. LOGIN SCREEN ---
