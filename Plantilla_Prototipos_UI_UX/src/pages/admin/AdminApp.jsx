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
