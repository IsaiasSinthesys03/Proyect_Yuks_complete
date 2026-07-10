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
import { verifyOtp } from '../../api/profile';
import { useUiStore } from '../../store/uiStore';

/**
 * OtpModal (Fase 45, REQ-FE-16) — verificación REAL del código de 6 dígitos.
 *
 * Flujo: la pestaña Seguridad invoca POST /api/auth/otp/request (el backend
 * envía el código AL CORREO ACTUAL) y abre este modal con el `purpose` en el
 * uiStore. Aquí el usuario teclea los 6 dígitos (auto-avance de foco) y se
 * llama POST /api/auth/otp/verify con el JWT — el backend aplica el cambio.
 */
export const OtpModal = ({ isOpen, close, showToast }) => {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const inputsRef = useRef([]);
    const otpPurpose = useUiStore((s) => s.otpPurpose);
    const queryClient = useQueryClient();

    // Al abrir: limpiar y enfocar el primer dígito.
    useEffect(() => {
        if (isOpen) {
            setDigits(['', '', '', '', '', '']);
            setTimeout(() => inputsRef.current[0]?.focus(), 50);
        }
    }, [isOpen]);

    const verifyMutation = useMutation({
        mutationFn: () => verifyOtp(otpPurpose, digits.join('')),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
            close();
            showToast('Modificación de datos segura completada', 'success');
        },
        // 401 código incorrecto · 400 expirado/sin OTP vigente · 429 rate limit
        onError: (error) => {
            showToast(error?.response?.data?.message || 'Código incorrecto. Verifica e intenta de nuevo.', 'error');
            setDigits(['', '', '', '', '', '']);
            inputsRef.current[0]?.focus();
        },
    });

    const handleDigit = (i, val) => {
        const v = val.replace(/\D/g, '').slice(-1);
        setDigits((prev) => {
            const next = [...prev];
            next[i] = v;
            return next;
        });
        if (v && i < 5) inputsRef.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
    };

    const code = digits.join('');

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center relative">
                <button onClick={close} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                <ShieldAlert className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-white mb-2">Verificación OTP</h2>
                <p className="text-xs text-slate-400 mb-6">Enviamos un código de 6 dígitos a tu correo actual para autorizar la modificación de datos de seguridad.</p>
                <div className="flex gap-2 justify-center mb-6">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <input
                            key={i}
                            ref={(el) => { inputsRef.current[i] = el; }}
                            value={digits[i]}
                            onChange={(e) => handleDigit(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            className="w-10 h-12 bg-slate-900 border border-slate-700 rounded-lg text-center text-white font-black text-xl outline-none focus:border-emerald-500"
                        />
                    ))}
                </div>
                <button
                    onClick={() => verifyMutation.mutate()}
                    disabled={code.length !== 6 || verifyMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {verifyMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : 'Verificar y Guardar'}
                </button>
            </div>
        </div>
    );
};

// [REQ-FE-27] Donation Modal (Con validación reactiva)
