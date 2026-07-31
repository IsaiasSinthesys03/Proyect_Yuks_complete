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


export const GlobalStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --brand-primary: #03bbd3;
            --brand-secondary: #ec1676;
            --brand-warning: #ffce07;
            --brand-success: #96c93e;
            --brand-deep: #0a2e0d;
            --brand-deep-dark: #061f09;
            --brand-wood: #e6c59e;
            --brand-moss: #1a9a21;
            --bg-deep: #061f09;
        }
        
        .bg-brand-gradient {
            background:
                radial-gradient(circle at 82% -15%, rgba(3, 187, 211, 0.12), transparent 34%),
                radial-gradient(circle at 12% 110%, rgba(150, 201, 62, 0.14), transparent 38%),
                linear-gradient(145deg, #061f09 0%, #0a2e0d 48%, #061f09 100%);
        }

        .glass-sidebar {
            background: linear-gradient(180deg, rgba(10, 46, 13, 0.92) 0%, rgba(6, 31, 9, 0.97) 100%);
            backdrop-filter: blur(18px);
        }

        .brand-shadow {
            box-shadow: 0 18px 45px -18px rgba(3, 187, 211, 0.35);
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
        .custom-scrollbar::-webkit-scrollbar-track { background: #061f09; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a5521; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--brand-primary); }
    `}} />
);

// --- MAIN APP & STATE PROVIDER ---
