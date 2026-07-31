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
import { createAddress } from '../../api/checkout';

/**
 * [REQ-FE-09] Autocompletado por CP: los CP de Yucatán inician con "97".
 * Regla local del prototipo; el backend guarda lo que se envíe.
 */
const resolveByCp = (cp) => {
    if (cp.length !== 5) return { state: '', municipality: '' };
    if (cp.startsWith('97')) return { state: 'Yucatán', municipality: 'Mérida' };
    return { state: 'Nacional', municipality: 'Foráneo' };
};

export const CheckoutAddressModal = ({ isOpen, close, showToast, onAddressReady }) => {
    const [cp, setCp] = useState('');
    const [street, setStreet] = useState('');
    const [exteriorNumber, setExteriorNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [references, setReferences] = useState('');
    const [countryCode, setCountryCode] = useState('MX');
    const [region, setRegion] = useState('');
    const [city, setCity] = useState('');

    const queryClient = useQueryClient();
    const auto = countryCode === 'MX' ? resolveByCp(cp) : { state: region, municipality: city };

    // POST /api/profile/addresses (Fase 42): crea la dirección REAL y entrega
    // el addressId al flujo de pago (checkoutStore) vía onAddressReady.
    const saveMutation = useMutation({
        mutationFn: () => createAddress({
            label: 'Principal',
            street,
            exteriorNumber,
            neighborhood,
            postalCode: cp,
            municipality: auto.municipality,
            state: auto.state,
            countryCode,
            references,
        }),
        onSuccess: (address) => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'addresses'] });
            showToast('Dirección guardada. Continuando al pago...', 'success');
            close();
            onAddressReady(address.id);
        },
        onError: (error) => {
            const msg = error?.response?.data?.message || 'No pudimos guardar la dirección.';
            showToast(msg, 'error');
        },
    });

    const submit = (e) => {
        e.preventDefault();
        if (!/^[A-Z]{2}$/.test(countryCode) || !auto.state.trim() || !auto.municipality.trim()) {
            showToast('Completa un país ISO, estado/región y ciudad válidos.', 'error');
            return;
        }
        if (countryCode === 'MX' && cp.length !== 5) {
            showToast('El Código Postal de México debe tener 5 dígitos.', 'error');
            return;
        }
        saveMutation.mutate();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <form onSubmit={submit} className="mobile-scroll-safe bg-slate-800 border border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-8 shadow-2xl relative animate-in zoom-in-95">
                <button type="button" onClick={close} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                <h2 className="font-bungee text-lg sm:text-xl text-white leading-tight mb-3">Completa tu Registro</h2>
                <p className="text-xs text-slate-400 mb-6">Un middleware ha detectado tu primera compra. Requerimos tu dirección de entrega por única vez.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">País (código ISO)</label>
                        <input required value={countryCode} onChange={e => setCountryCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))} type="text" placeholder="MX, JP, US…" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Código Postal</label>
                        <input required value={cp} onChange={e => setCp(countryCode === 'MX' ? e.target.value.replace(/\D/g, '').slice(0, 5) : e.target.value.toUpperCase().slice(0, 10))} type="text" placeholder="Ej. 97000" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado / Región</label>
                            <input required disabled={countryCode === 'MX'} value={auto.state} onChange={e => setRegion(e.target.value)} placeholder={countryCode === 'MX' ? 'Esperando CP...' : 'Ej. Tokio'} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm disabled:opacity-80" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ciudad / Municipio</label>
                            <input required disabled={countryCode === 'MX'} value={auto.municipality} onChange={e => setCity(e.target.value)} placeholder={countryCode === 'MX' ? 'Esperando CP...' : 'Ciudad'} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none text-sm disabled:opacity-80" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Colonia</label><input required value={neighborhood} onChange={e => setNeighborhood(e.target.value)} type="text" placeholder="Ej. Centro" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Número Exterior</label><input required value={exteriorNumber} onChange={e => setExteriorNumber(e.target.value)} type="text" placeholder="Ej. 123-B" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none" /></div>
                    </div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dirección Completa</label><input required value={street} onChange={e => setStreet(e.target.value)} type="text" placeholder="Calle, Número, Cruzamientos..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Referencias del Domicilio</label><textarea required value={references} onChange={e => setReferences(e.target.value)} placeholder="Color de casa, portón, indicaciones al chofer..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none resize-none"></textarea></div>
                </div>
                <button type="submit" disabled={saveMutation.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl mt-6 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {saveMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : 'Guardar y Continuar al Pago'}
                </button>
            </form>
        </div>
    );
};

// [REQ-FE-16] OTP Modal
