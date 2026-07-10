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


export const MobileMenu = ({ isOpen, close, navigate }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] md:hidden flex">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={close}></div>
            <div className="relative w-64 bg-slate-50 h-full border-r border-slate-200 flex flex-col p-6 animate-in slide-in-from-left shadow-2xl">
                <button onClick={close} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
                <div className="flex items-center gap-2 mb-12">
                    <Gamepad2 className="w-6 h-6 text-[#03bbd3]" />
                    <span className="text-xl font-black text-slate-900">Animayuks</span>
                </div>
                <nav className="flex flex-col gap-6 font-bold text-slate-600">
                    <button onClick={() => { navigate('landing'); close(); }} className="text-left flex items-center gap-3 hover:text-[#03bbd3] transition-colors"><Home className="w-5 h-5" /> Inicio</button>
                    <button onClick={() => { navigate('store'); close(); }} className="text-left flex items-center gap-3 hover:text-[#03bbd3] transition-colors"><Package className="w-5 h-5" /> Catálogo</button>
                    <button onClick={() => { navigate('legal'); close(); }} className="text-left flex items-center gap-3 hover:text-[#03bbd3] transition-colors"><FileText className="w-5 h-5" /> Legal</button>
                </nav>
            </div>
        </div>
    );
};

