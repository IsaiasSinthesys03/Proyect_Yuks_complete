import React, { useState } from 'react';
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
import { useMutation } from '@tanstack/react-query';
import { api, login as apiLogin } from '../../lib/api';

/**
 * Traduce un error de Axios a un mensaje legible para el Toast (Fase 40).
 * El backend responde `{ statusCode, error, message }`; se prioriza ese mensaje
 * (ya viene en español y cubre 400/401/403/409/422). Fallbacks para red caída.
 */
const readError = (error, fallback) => {
    const msg = error?.response?.data?.message;
    if (msg) return msg;
    if (error?.code === 'ERR_NETWORK') return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    return fallback;
};

export const AuthModal = ({ isOpen, close, showToast }) => {
    const [authTab, setAuthTab] = useState('login');

    // --- Estado del formulario de Login ---
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPwd, setLoginPwd] = useState('');

    // --- Estado del formulario de Registro ---
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [pwd, setPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [terms, setTerms] = useState(false);

    // --- Estado del formulario de Recuperación ---
    const [recoverEmail, setRecoverEmail] = useState('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const pwdStrength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;

    // ── Login (POST /api/auth/login) → guarda accessToken (memoria) + user en authStore ──
    const loginMutation = useMutation({
        mutationFn: () => apiLogin(loginEmail, loginPwd),
        onSuccess: (user) => {
            showToast(`Bienvenido de vuelta${user?.firstName ? `, ${user.firstName}` : ''}`, 'success');
            setLoginPwd('');
            close();
        },
        // 401 credenciales inválidas · 403 usuario baneado · 400 body inválido
        onError: (error) => showToast(readError(error, 'No pudimos iniciar sesión. Verifica tus datos.'), 'error'),
    });

    // ── Registro (POST /api/auth/register) ──
    // Fase 33 backend: `phone` (≥8 dígitos) y `termsAccepted: true` son OBLIGATORIOS.
    // El registro NO abre sesión (no devuelve tokens) → al éxito pasamos a Login.
    const registerMutation = useMutation({
        mutationFn: () => api.post('/api/auth/register', {
            email,
            password: pwd,
            firstName,
            lastName,
            phone,
            termsAccepted: true, // el checkbox de privacidad ya se validó en el submit
        }),
        onSuccess: () => {
            showToast('Cuenta creada con éxito. Ahora inicia sesión.', 'success');
            setLoginEmail(email); // precargar el correo en el login para comodidad
            setPwd('');
            setConfirmPwd('');
            setTerms(false);
            setAuthTab('login');
        },
        // 409 email ya registrado · 422 teléfono/términos inválidos · 400 schema
        onError: (error) => showToast(readError(error, 'No pudimos crear tu cuenta.'), 'error'),
    });

    // ── Recuperación (POST /api/auth/forgot-password) ──
    // ANTI-ENUMERACIÓN: el backend responde SIEMPRE 202, exista o no el correo.
    const forgotMutation = useMutation({
        mutationFn: () => api.post('/api/auth/forgot-password', { email: recoverEmail }),
        onSuccess: () => {
            showToast('Si el correo existe, te enviamos un enlace de recuperación.', 'success');
            setAuthTab('login');
        },
        onError: (error) => showToast(readError(error, 'No pudimos procesar la solicitud.'), 'error'),
    });

    const submitLogin = (e) => {
        e.preventDefault();
        loginMutation.mutate();
    };

    const submitRegister = (e) => {
        e.preventDefault();
        // Validaciones de cliente antes de tocar el backend.
        if (pwd !== confirmPwd) {
            showToast('Las contraseñas no coinciden.', 'error');
            return;
        }
        if (!terms) {
            showToast('Debes aceptar el Aviso de Privacidad y los Términos.', 'error');
            return;
        }
        registerMutation.mutate();
    };

    const submitRecover = (e) => {
        e.preventDefault();
        forgotMutation.mutate();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
                <button onClick={close} className="absolute top-6 right-6 text-slate-500 hover:text-[#03bbd3]"><X className="w-6 h-6" /></button>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-[#03bbd3]/20 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-[#03bbd3]/30"><User className="text-[#03bbd3] w-6 h-6" /></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{authTab === 'login' ? 'Acceder' : authTab === 'register' ? 'Unirse' : 'Recuperar'}</h2>
                </div>

                {authTab === 'login' && (
                    <form onSubmit={submitLogin} className="space-y-4 animate-in fade-in">
                        <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Correo Electrónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
                        <input type="password" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} placeholder="Contraseña" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />

                        <div className="flex justify-end"><span onClick={() => setAuthTab('recover')} className="text-xs text-emerald-400 hover:underline cursor-pointer">¿Olvidaste tu contraseña?</span></div>

                        <button type="submit" disabled={loginMutation.isPending} className="w-full bg-[#96c93e] hover:bg-[#85b237] text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
                            {loginMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Ingresando...</> : 'Ingresar'}
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">O ingresa con</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        {/* [REQ-FE-07] Botón Nativo Google */}
                        <button type="button" onClick={() => showToast('Redirigiendo a Google OAuth...', 'success')} className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            Continuar con Google
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-4 cursor-pointer hover:text-white" onClick={() => setAuthTab('register')}>¿No tienes cuenta? <span className="font-bold text-[#96c93e]">Regístrate</span></p>
                    </form>
                )}

                {authTab === 'register' && (
                    <form onSubmit={submitRegister} className="space-y-4 animate-in fade-in h-max max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombres" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellidos" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                        </div>

                        <div className="relative">
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo Electrónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                            {email.length > 0 && <CheckCircle2 className={`absolute right-3 top-3 w-5 h-5 ${isEmailValid ? 'text-emerald-500' : 'text-slate-600'}`} />}
                        </div>

                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Número Telefónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />

                        <div>
                            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Contraseña Fuerte" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />
                            <div className="flex gap-1 mt-2 px-1">
                                <div className={`h-1.5 flex-1 rounded-full ${pwdStrength >= 1 ? (pwdStrength === 1 ? 'bg-red-500' : pwdStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${pwdStrength >= 2 ? (pwdStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${pwdStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                            </div>
                        </div>

                        <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirmar Contraseña" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm" />

                        <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} required className="mt-1 accent-emerald-500 w-4 h-4 shrink-0" />
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 leading-tight">He leído y acepto el <span className="text-emerald-400 underline">Aviso de Privacidad</span> y los <span className="text-emerald-400 underline">Términos y Condiciones</span> de venta.</span>
                        </label>

                        <button type="submit" disabled={registerMutation.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
                            {registerMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Creando...</> : 'Crear Cuenta'}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-4 cursor-pointer hover:text-white" onClick={() => setAuthTab('login')}>Ya tengo cuenta. <span className="font-bold text-emerald-400">Ingresar</span></p>
                    </form>
                )}

                {authTab === 'recover' && (
                    <form onSubmit={submitRecover} className="space-y-4 animate-in fade-in">
                        <p className="text-xs text-slate-400 text-center mb-4">Ingresa tu correo y te enviaremos un enlace temporal seguro.</p>
                        <input type="email" value={recoverEmail} onChange={e => setRecoverEmail(e.target.value)} placeholder="Correo Electrónico" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" />
                        <button type="submit" disabled={forgotMutation.isPending} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {forgotMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : 'Enviar Enlace'}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-4 cursor-pointer hover:text-white" onClick={() => setAuthTab('login')}>Volver a Iniciar Sesión</p>
                    </form>
                )}
            </div>
        </div>
    );
};

// [REQ-FE-09] Checkout Modal / CP Auto-complete
