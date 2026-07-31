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
import QRCode from 'qrcode';
import { adminLogin, setup2fa, enable2fa, verify2fa, registerAdmin } from '../../api/adminAuth';
import { useAdminAuthStore } from '../../store/adminAuthStore';

/**
 * LoginScreen del CMS (Fase 47) — EL MURO DEL 2FA (REQ-SEC-09, ineludible).
 *
 * Pasos:
 *   'login'  → credenciales → el backend decide:
 *              requiresSetup → 'setup' (QR + primer código) — SIN sesión
 *              requires2fa   → 'verify' (código TOTP)        — SIN sesión
 *   'setup'  → POST /2fa/setup (setupToken) → QR → POST /2fa/enable →
 *              re-login automático → 'verify'
 *   'verify' → POST /2fa/verify (tempToken + código) → accessToken → panel
 * Registro (Easter Egg, click en el logo): formulario completo + Developer Key.
 */
export const LoginScreen = ({ onLogin, showToast }) => {
    const [showRegister, setShowRegister] = useState(false);
    const [step, setStep] = useState('login'); // 'login' | 'verify' | 'setup'
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Credenciales (se retienen en memoria SOLO para el re-login post-setup)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 2FA
    const [totpCode, setTotpCode] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [manualSecret, setManualSecret] = useState('');

    // Easter Egg (registro)
    const [devCode, setDevCode] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [attempts, setAttempts] = useState(3);
    const [isBlocked, setIsBlocked] = useState(false);

    const setTempToken = useAdminAuthStore((s) => s.setTempToken);
    const setSetupToken = useAdminAuthStore((s) => s.setSetupToken);
    const setSession = useAdminAuthStore((s) => s.setSession);
    const tempToken = useAdminAuthStore((s) => s.tempToken);
    const setupToken = useAdminAuthStore((s) => s.setupToken);

    const errMsg = (e, fb) => {
        if (!e?.response) return 'Error de red: El servidor backend está apagado o inalcanzable.';
        return e.response?.data?.message || e.response?.data?.error || fb;
    };

    /** Paso 1: credenciales. El backend jamás da sesión sin TOTP. */
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await adminLogin(email.trim(), password);
            if (res.requiresSetup) {
                // 2FA INELUDIBLE: primer acceso → configurar TOTP (solo setupToken)
                setSetupToken(res.setupToken);
                const setup = await setup2fa(res.setupToken);
                setManualSecret(setup.secret);
                setQrDataUrl(await QRCode.toDataURL(setup.otpauthUri, { width: 220, margin: 1 }));
                setStep('setup');
                showToast('Configura tu 2FA para continuar (obligatorio).', 'warning');
            } else if (res.requires2fa) {
                setTempToken(res.tempToken);
                setStep('verify');
            } else if (res.accessToken) {
                // Ruta legacy del backend (no debería ocurrir con 2FA ineludible)
                setSession(res.accessToken, res.user);
                showToast('Sesión Iniciada', 'success');
                onLogin();
            }
        } catch (err) {
            showToast(errMsg(err, 'Credenciales inválidas.'), 'error');
        } finally {
            setLoading(false);
        }
    };

    /** Confirmar el primer código → habilita 2FA → re-login → paso verify. */
    const handleEnable2fa = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await enable2fa(setupToken, totpCode.trim());
            showToast('2FA habilitado. Verifica tu código para entrar.', 'success');
            setTotpCode('');
            // Re-login automático: ahora el backend exigirá el TOTP (tempToken)
            const res = await adminLogin(email.trim(), password);
            if (res.requires2fa) {
                setTempToken(res.tempToken);
                setStep('verify');
            } else {
                setStep('login');
            }
        } catch (err) {
            showToast(errMsg(err, 'Código incorrecto. Escanea de nuevo e intenta.'), 'error');
            setTotpCode('');
        } finally {
            setLoading(false);
        }
    };

    /** Paso 2 del login: TOTP → accessToken (JWT 8h) → panel. */
    const handleVerify2fa = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await verify2fa(tempToken, totpCode.trim());
            setSession(res.accessToken, res.user);
            showToast('Sesión Iniciada', 'success');
            onLogin();
        } catch (err) {
            showToast(errMsg(err, 'Código 2FA incorrecto.'), 'error');
            setTotpCode('');
        } finally {
            setLoading(false);
        }
    };

    /** Easter Egg: registro de administrador con Developer Key (Q21). */
    const handleRegister = async (e) => {
        e.preventDefault();
        if (isBlocked) return;
        setLoading(true);
        try {
            await registerAdmin({ email: regEmail.trim(), password: regPassword, firstName: regFirstName.trim(), lastName: regLastName.trim(), developerCode: devCode });
            showToast('Administrador registrado. Inicia sesión.', 'success');
            setEmail(regEmail.trim());
            setShowRegister(false);
            setDevCode(''); setRegPassword('');
        } catch (err) {
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);
            if (newAttempts <= 0) {
                setIsBlocked(true);
                showToast('Registro bloqueado localmente. Contacte a soporte.', 'error');
            } else {
                showToast(`${errMsg(err, 'Código inválido.')} ${newAttempts} intentos restantes.`, 'warning');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full bg-white/5 border border-[#1a9a21]/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-white/10 transition-all font-bold";

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-brand-gradient relative overflow-x-hidden overflow-y-auto">
            {/* Elementos decorativos animados */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#03bbd3]/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ec1676]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#1a9a21]/30 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md p-3 sm:p-6 md:p-8 relative z-10">
                <div className="bg-[#0a2e0d]/80 backdrop-blur-2xl border border-[#1a9a21]/30 p-5 min-[390px]:p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[40px] shadow-2xl brand-shadow">
                    <div className="text-center mb-10">
                        <div
                            onClick={() => { if (step === 'login') setShowRegister(!showRegister); }}
                            className="w-24 h-24 bg-gradient-to-tr from-[#03bbd3] to-[#1a9a21] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/20 rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                        >
                            <Lock className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="font-bungee text-3xl sm:text-4xl text-white leading-tight mb-3">ANIMAYUKS<span className="text-[#03bbd3]">.</span>OS</h1>
                        <p className="text-[#e6c59e]/70 font-bold uppercase tracking-[0.2em] text-[10px]">Portal de Gestión Logística</p>
                    </div>

                    {step === 'setup' ? (
                        /* ── SETUP OBLIGATORIO DE 2FA (QR + primer código) ── */
                        <form onSubmit={handleEnable2fa} className="space-y-6 animate-in fade-in zoom-in-95">
                            <div className="bg-[#03bbd3]/10 border border-[#03bbd3]/20 p-5 rounded-2xl flex items-start gap-4">
                                <ShieldAlert className="w-6 h-6 text-[#03bbd3] shrink-0" />
                                <p className="text-[11px] leading-relaxed text-[#03bbd3]/90 font-bold uppercase tracking-tight">2FA obligatorio (REQ-SEC-09). Escanea el QR con tu app autenticadora y confirma el primer código.</p>
                            </div>
                            {qrDataUrl && (
                                <div className="bg-white p-4 rounded-2xl w-max mx-auto shadow-xl">
                                    <img src={qrDataUrl} alt="QR de configuración TOTP" className="w-[180px] h-[180px]" />
                                </div>
                            )}
                            <p className="text-[10px] text-[#e6c59e]/55 text-center font-mono break-all">Clave manual: <span className="text-[#e6c59e]/90">{manualSecret}</span></p>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest ml-2">Código de 6 dígitos</label>
                                <input
                                    required value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000" inputMode="numeric" autoFocus
                                    className="w-full bg-white/5 border border-[#1a9a21]/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-white/10 transition-all font-mono tracking-widest text-center text-xl"
                                />
                            </div>
                            <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full bg-gradient-to-r from-[#03bbd3] to-[#1a9a21] hover:from-[#ec1676] hover:to-[#1a9a21] text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-xl shadow-cyan-500/10 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ACTIVAR 2FA Y CONTINUAR <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                    ) : step === 'verify' ? (
                        /* ── SEGUNDO PASO DEL LOGIN (código TOTP) ── */
                        <form onSubmit={handleVerify2fa} className="space-y-6 animate-in fade-in zoom-in-95">
                            <div className="bg-[#1a9a21]/20 border border-[#1a9a21]/40 p-5 rounded-2xl flex items-start gap-4">
                                <ShieldAlert className="w-6 h-6 text-[#a78bfa] shrink-0" />
                                <p className="text-[11px] leading-relaxed text-[#c4b5fd] font-bold uppercase tracking-tight">Verificación en dos pasos. Ingresa el código de tu app autenticadora.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest ml-2">Código de 6 dígitos</label>
                                <input
                                    required value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000" inputMode="numeric" autoFocus
                                    className="w-full bg-white/5 border border-[#1a9a21]/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-white/10 transition-all font-mono tracking-widest text-center text-xl"
                                />
                            </div>
                            <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full bg-gradient-to-r from-[#03bbd3] to-[#1a9a21] hover:from-[#ec1676] hover:to-[#1a9a21] text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-xl shadow-cyan-500/10 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>VERIFICAR Y ENTRAR <ArrowRight className="w-5 h-5" /></>}
                            </button>
                            <button type="button" onClick={() => { setStep('login'); setTotpCode(''); }} className="text-[10px] text-[#e6c59e]/55 underline text-center block w-full hover:text-white">Volver al inicio de sesión</button>
                        </form>
                    ) : !showRegister ? (
                        /* ── PASO 1: CREDENCIALES ── */
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest ml-2">Identificador Corporativo</label>
                                <input
                                    required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className={inputCls}
                                    placeholder="admin@animayuks.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest ml-2">Clave de Acceso</label>
                                <div className="relative">
                                    <input
                                        required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                        className={inputCls}
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-[#e6c59e]/55 hover:text-[#03bbd3]">
                                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-[#03bbd3] to-[#1a9a21] hover:from-[#ec1676] hover:to-[#1a9a21] text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-xl shadow-cyan-500/10 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ACCEDER AL SISTEMA <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                    ) : (
                        /* ── EASTER EGG: REGISTRO DE ADMIN (Developer Key) ── */
                        <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in zoom-in-95">
                            <div className="bg-[#ffce07]/10 border border-[#ffce07]/20 p-5 rounded-2xl flex items-start gap-4 mb-2">
                                <AlertTriangle className="w-6 h-6 text-[#ffce07] shrink-0" />
                                <p className="text-[11px] leading-relaxed text-[#ffce07]/90 font-bold uppercase tracking-tight">Alta de administradores. Requiere el Código de Desarrollador (verificado contra hash Argon2id).</p>
                            </div>
                            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3">
                                <input required value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} placeholder="Nombre" disabled={isBlocked} className={inputCls + ' text-sm px-4 py-3'} />
                                <input required value={regLastName} onChange={(e) => setRegLastName(e.target.value)} placeholder="Apellido" disabled={isBlocked} className={inputCls + ' text-sm px-4 py-3'} />
                            </div>
                            <input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Correo corporativo" disabled={isBlocked} className={inputCls + ' text-sm px-4 py-3'} />
                            <input required type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Contraseña" disabled={isBlocked} className={inputCls + ' text-sm px-4 py-3'} />
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#ffce07] uppercase tracking-widest ml-2">Developer Key</label>
                                <input
                                    required type={showPassword ? "text" : "password"}
                                    value={devCode} onChange={(e) => setDevCode(e.target.value)}
                                    placeholder="••••••" disabled={isBlocked}
                                    className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-white outline-none transition-all font-mono tracking-widest text-center text-xl ${isBlocked ? 'border-red-500/50 opacity-50' : 'border-[#ffce07]/30 focus:border-[#ffce07] focus:bg-[#ffce07]/5'}`}
                                />
                            </div>
                            <button
                                type="submit" disabled={isBlocked || loading}
                                className={`w-full font-black py-5 rounded-2xl transition-all duration-300 shadow-xl flex items-center justify-center gap-2 ${isBlocked ? 'bg-red-500/20 text-red-500/50 cursor-not-allowed' : 'bg-[#ffce07] hover:bg-[#e6b906] text-[#061f09] shadow-[#ffce07]/20 active:scale-95'}`}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'DESBLOQUEAR REGISTRO'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 2. ADMIN LAYOUT & NAVIGATION ---
