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
