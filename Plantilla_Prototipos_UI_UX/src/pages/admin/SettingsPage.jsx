import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard, ShoppingCart, Package, Image as ImageIcon,
    Gamepad2, Settings, ShieldAlert, FileText, HeartHandshake,
    LogOut, Lock, Search, Bell, Plus, Filter, MoreVertical,
    ChevronRight, GripVertical, AlertTriangle, CheckCircle2, CreditCard,
    Truck, ArrowRight, User, UploadCloud, ToggleRight, MonitorPlay,
    History, Eye, EyeOff, Save, Type, Bold, Italic, Link2,
    Users, Ticket, List, Menu, X, Code, Loader2, Database, Trash2, Ban, Clock,
    Wifi, ChevronLeft, Link as LinkIcon, Layers, MapPin
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../../lib/adminApi';

const errorMessage = (error) => error.response?.data?.message || error.response?.data?.error || 'No fue posible completar la operación.';

const YUCATAN_MUNICIPALITIES = [
    "Abalá", "Acanceh", "Akil", "Baca", "Bokobá", "Buctzotz", "Cacalchén", "Calotmul", "Cansahcab", "Cantamayec", "Celestún", "Cenotillo", "Chacsinkín", "Chankom", "Chapab", "Chemax", "Chicxulub Pueblo", "Chichimilá", "Chikindzonot", "Chocholá", "Chumayel", "Conkal", "Cuncunul", "Cuzamá", "Dzan", "Dzemul", "Dzidzantún", "Dzilam de Bravo", "Dzilam González", "Dzitás", "Dzoncauich", "Espita", "Halachó", "Hocabá", "Hoctún", "Homún", "Huhí", "Hunucmá", "Ixil", "Izamal", "Kanasín", "Kantunil", "Kaua", "Kinchil", "Kopomá", "Mama", "Maní", "Maxcanú", "Mayapán", "Mérida", "Mocochá", "Motul", "Muna", "Muxupip", "Opichén", "Oxkutzcab", "Panabá", "Peto", "Progreso", "Quintana Roo", "Río Lagartos", "Sacalum", "Samahil", "Sanahcat", "San Felipe", "Santa Elena", "Seyé", "Sinanché", "Sotuta", "Sucilá", "Sudzal", "Suma", "Tahdziú", "Tahmek", "Teabo", "Tecoh", "Tekal de Venegas", "Tekantó", "Tekax", "Tekit", "Tekom", "Telchac Pueblo", "Telchac Puerto", "Temax", "Temozón", "Tepakán", "Tetiz", "Teya", "Ticul", "Timucuy", "Tinum", "Tixcacalcupul", "Tixkokob", "Tixmehuac", "Tixpéhual", "Tizimín", "Tunkás", "Tzucacab", "Uayma", "Ucú", "Umán", "Valladolid", "Xocchel", "Yaxcabá", "Yaxkukul", "Yobaín"
];

const MEXICO_STATES = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const CONTINENTS = [
    { code: 'AF', label: 'África' }, { code: 'AS', label: 'Asia' },
    { code: 'EU', label: 'Europa' }, { code: 'NA', label: 'Norteamérica y Caribe' },
    { code: 'SA', label: 'Sudamérica' }, { code: 'OC', label: 'Oceanía' },
    { code: 'AN', label: 'Antártida' },
];

export const SettingsView = ({ showToast }) => {
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState({ 
        freeShippingThreshold: '', minPurchaseAmount: '', 
        localShippingCost: '', externalShippingCost: '', 
        baseState: '', nearbyMunicipalities: [],
        storeAddress: '', localEta: '', externalEta: '',
        blockedContinents: [], blockedCountries: [], blockedRegions: [],
        shippingUnavailableMessage: '',
        socialFacebookUrl: '', socialInstagramUrl: '', socialTwitterUrl: '',
        supportWhatsapp: '', supportEmail: ''
    });
    const [municipality, setMunicipality] = useState('');
    const [blockedCountry, setBlockedCountry] = useState('');
    const [regionCountry, setRegionCountry] = useState('');
    const [blockedRegion, setBlockedRegion] = useState('');
    const [savingSection, setSavingSection] = useState(null);
    const [newCode, setNewCode] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [showReauth, setShowReauth] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');

    const settingsQuery = useQuery({
        queryKey: ['admin', 'settings'],
        queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/settings')),
    });
    
    useEffect(() => {
        if (settingsQuery.data) {
            setSettings({
                ...settingsQuery.data,
                storeAddress: settingsQuery.data.storeAddress || '',
                localEta: settingsQuery.data.localEta || '',
                externalEta: settingsQuery.data.externalEta || '',
                blockedContinents: settingsQuery.data.blockedContinents || [],
                blockedCountries: settingsQuery.data.blockedCountries || [],
                blockedRegions: settingsQuery.data.blockedRegions || [],
                shippingUnavailableMessage: settingsQuery.data.shippingUnavailableMessage || '',
                socialFacebookUrl: settingsQuery.data.socialFacebookUrl || '',
                socialInstagramUrl: settingsQuery.data.socialInstagramUrl || '',
                socialTwitterUrl: settingsQuery.data.socialTwitterUrl || '',
                supportWhatsapp: settingsQuery.data.supportWhatsapp || '',
                supportEmail: settingsQuery.data.supportEmail || ''
            });
        }
    }, [settingsQuery.data]);

    const saveMutation = useMutation({
        mutationFn: async (payload) => unwrapAdmin(await adminApi.put('/api/admin/settings', payload)),
        onSuccess: (data) => {
            queryClient.setQueryData(['admin', 'settings'], data);
            showToast('Configuración global actualizada.', 'success');
        },
        onError: (error) => showToast(errorMessage(error), 'error'),
        onSettled: () => setSavingSection(null),
    });
    
    const developerCodeMutation = useMutation({
        mutationFn: async () => unwrapAdmin(await adminApi.put('/api/admin/settings/developer-code', { currentPassword, newCode })),
        onSuccess: () => {
            showToast('Código de desarrollador modificado con éxito.', 'success');
            setShowReauth(false);
            setCurrentPassword('');
            setNewCode('');
            setConfirmCode('');
        },
        onError: (error) => showToast(errorMessage(error), 'error'),
    });

    const updateField = (field, value) => setSettings((current) => ({ ...current, [field]: value }));
    
    const addMunicipality = (event) => {
        if (event && event.preventDefault) event.preventDefault();
        
        const value = municipality.trim();
        if (!value) return;

        if (!settings.nearbyMunicipalities.includes(value)) {
            updateField('nearbyMunicipalities', [...settings.nearbyMunicipalities, value]);
        } else {
            showToast('Ese municipio ya está en la lista.', 'error');
        }
        setMunicipality('');
    };

    const saveGeographicSettings = () => {
        setSavingSection('geographic');
        saveMutation.mutate({
            baseState: settings.baseState,
            nearbyMunicipalities: settings.nearbyMunicipalities,
            storeAddress: settings.storeAddress,
        });
    };

    const saveCoverageSettings = () => {
        const message = settings.shippingUnavailableMessage.trim();
        if (message.length < 20) {
            showToast('El mensaje para zonas sin cobertura debe tener al menos 20 caracteres.', 'error');
            return;
        }
        setSavingSection('coverage');
        saveMutation.mutate({
            blockedContinents: settings.blockedContinents,
            blockedCountries: settings.blockedCountries,
            blockedRegions: settings.blockedRegions,
            shippingUnavailableMessage: message,
        });
    };

    const saveFinancialSettings = () => {
        if (Number(settings.localShippingCost) < 0 || Number(settings.externalShippingCost) < 0) {
            showToast('Los costos de envío no pueden ser negativos.', 'error');
            return;
        }
        setSavingSection('financial');
        saveMutation.mutate({
            freeShippingThreshold: Number(settings.freeShippingThreshold),
            minPurchaseAmount: Number(settings.minPurchaseAmount),
            localShippingCost: Number(settings.localShippingCost),
            externalShippingCost: Number(settings.externalShippingCost),
            localEta: settings.localEta,
        });
    };

    const saveContactSettings = () => {
        setSavingSection('contact');
        saveMutation.mutate({
            socialFacebookUrl: settings.socialFacebookUrl,
            socialInstagramUrl: settings.socialInstagramUrl,
            socialTwitterUrl: settings.socialTwitterUrl,
            supportWhatsapp: settings.supportWhatsapp,
            supportEmail: settings.supportEmail,
        });
    };

    const requestDeveloperCodeChange = () => {
        if (newCode.length < 6 || newCode !== confirmCode) {
            showToast('El nuevo código debe tener al menos 6 caracteres y coincidir con su confirmación.', 'error');
            return;
        }
        setShowReauth(true);
    };

    // Filtramos los municipios para que no se muestren en el dropdown los que ya están agregados
    const availableMunicipalities = YUCATAN_MUNICIPALITIES.filter(m => !settings.nearbyMunicipalities.includes(m));

    const toggleContinent = (code) => updateField('blockedContinents',
        settings.blockedContinents.includes(code)
            ? settings.blockedContinents.filter((item) => item !== code)
            : [...settings.blockedContinents, code]);

    const addBlockedCountry = () => {
        const code = blockedCountry.trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(code)) return showToast('Escribe un código ISO de país de dos letras.', 'error');
        if (!settings.blockedCountries.includes(code)) updateField('blockedCountries', [...settings.blockedCountries, code]);
        setBlockedCountry('');
    };

    const addBlockedRegion = () => {
        const countryCode = regionCountry.trim().toUpperCase();
        const region = blockedRegion.trim();
        if (!/^[A-Z]{2}$/.test(countryCode) || !region) return showToast('La región necesita un país ISO y un nombre.', 'error');
        const duplicate = settings.blockedRegions.some((item) => item.countryCode === countryCode && item.region.toLowerCase() === region.toLowerCase());
        if (!duplicate) updateField('blockedRegions', [...settings.blockedRegions, { countryCode, region }]);
        setRegionCountry('');
        setBlockedRegion('');
    };

    return (
        <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto relative pb-12">
            <div>
                <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">Configuración Logística</h1>
                <p className="text-[#e6c59e]/70 mt-1">Parámetros geográficos y reglas comerciales.</p>
            </div>

            {settingsQuery.isPending && <p className="text-sm text-[#e6c59e]/70">Cargando configuración…</p>}
            {settingsQuery.isError && <p className="text-sm text-red-400">No fue posible cargar la configuración.</p>}

            {/* Tarjeta 1: Parámetros Geográficos */}
            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-[32px] p-8 shadow-2xl space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><MapPin className="w-5 h-5 text-indigo-400" /> Logística Geográfica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Dirección Física del Local</label>
                        <input type="text" value={settings.storeAddress} onChange={(e) => updateField('storeAddress', e.target.value)} placeholder="Ej: Calle 60 #123, Centro, Mérida..." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-[#03bbd3]/60 rounded-xl px-4 py-3 text-white outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Estado Base</label>
                        <select 
                            value={settings.baseState} 
                            onChange={(e) => updateField('baseState', e.target.value)} 
                            className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-[#03bbd3]/60 rounded-xl px-4 py-3 text-white outline-none transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">Selecciona un Estado...</option>
                            {MEXICO_STATES.map(state => (
                                <option key={state} value={state} className="bg-[#0a2e0d]">{state}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Matriz de Municipios Locales (Aplica Tarifa Local)</label>
                        <div className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                            {settings.nearbyMunicipalities.map(tag => (
                                <span key={tag} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 group transition-colors">
                                    {tag} 
                                    <button onClick={() => updateField('nearbyMunicipalities', settings.nearbyMunicipalities.filter((item) => item !== tag))} className="text-indigo-400/50 hover:text-red-400 transition-colors focus:outline-none">
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            ))}
                            <div className="flex w-full min-w-0 bg-[#061f09] rounded-lg overflow-hidden border border-[#1a9a21]/20 flex-1 sm:min-w-[250px]">
                                {settings.baseState && settings.baseState.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("yucatan") ? (
                                    <select 
                                        value={municipality} 
                                        onChange={(e) => setMunicipality(e.target.value)} 
                                        className="bg-transparent text-sm text-[#e6c59e]/90 outline-none px-4 py-2 w-full appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-[#0a2e0d]">Seleccionar municipio de Yucatán...</option>
                                        {availableMunicipalities.map(m => (
                                            <option key={m} value={m} className="bg-[#0a2e0d]">{m}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={municipality} 
                                        onChange={(e) => setMunicipality(e.target.value)} 
                                        onKeyDown={(e) => { if (e.key === 'Enter') addMunicipality(e); }} 
                                        placeholder="Escribe un municipio/ciudad..." 
                                        className="bg-transparent text-sm text-white outline-none px-4 py-2 w-full" 
                                    />
                                )}
                                <button type="button" onClick={addMunicipality} disabled={!municipality} className="bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 transition-colors flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-6 border-t border-[#1a9a21]/20">
                    <button disabled={saveMutation.isPending} type="button" onClick={saveGeographicSettings} className="bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] text-white px-10 py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingSection === 'geographic' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {savingSection === 'geographic' ? 'Guardando…' : 'Guardar Logística Geográfica'}
                    </button>
                </div>
            </div>

            {/* Política de cobertura territorial */}
            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-amber-500/10 rounded-[32px] p-8 shadow-2xl space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><Ban className="w-5 h-5 text-amber-400" /> Zonas sin cobertura</h2>
                    <p className="text-sm text-[#e6c59e]/70">Se validan contra el domicilio antes de reservar inventario o iniciar el pago.</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-3">Continentes bloqueados</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {CONTINENTS.map((continent) => {
                            const active = settings.blockedContinents.includes(continent.code);
                            return <button key={continent.code} type="button" onClick={() => toggleContinent(continent.code)} className={`border rounded-xl px-4 py-3 text-left transition-colors ${active ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'bg-[#0a2e0d] border-[#1a9a21]/20 text-[#e6c59e]/70 hover:border-[#1a9a21]/30'}`}><span className="text-xs font-black">{continent.label}</span><span className="block text-[10px] mt-1">{active ? 'Pedidos bloqueados' : 'Pedidos permitidos'}</span></button>;
                        })}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Países bloqueados individualmente</label>
                    <div className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                        {settings.blockedCountries.map((code) => <span key={code} className="bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">{code}<button type="button" onClick={() => updateField('blockedCountries', settings.blockedCountries.filter((item) => item !== code))} className="text-red-300/50 hover:text-red-300"><X className="w-4 h-4" /></button></span>)}
                        <input value={blockedCountry} onChange={(e) => setBlockedCountry(e.target.value.toUpperCase().slice(0, 2))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBlockedCountry(); } }} placeholder="ISO: JP, CN, US…" className="bg-transparent text-sm text-white outline-none px-3 py-2 flex-1 min-w-0 sm:min-w-[180px]" />
                        <button type="button" onClick={addBlockedCountry} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-[#e6c59e]/55 mt-2">Usa ISO-3166-1 de dos letras. El bloqueo de país se suma al de continente.</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Estados, provincias o regiones bloqueadas</label>
                    <div className="space-y-2 mb-3">
                        {settings.blockedRegions.map((item) => <div key={`${item.countryCode}-${item.region}`} className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between text-sm text-red-200"><span><strong>{item.countryCode}</strong> · {item.region}</span><button type="button" onClick={() => updateField('blockedRegions', settings.blockedRegions.filter((region) => region !== item))} className="text-red-300/50 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></div>)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-3">
                        <input value={regionCountry} onChange={(e) => setRegionCountry(e.target.value.toUpperCase().slice(0, 2))} placeholder="País ISO" className="bg-[#0a2e0d] border border-[#1a9a21]/20 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50" />
                        <input value={blockedRegion} onChange={(e) => setBlockedRegion(e.target.value)} placeholder="Estado, provincia o región" className="bg-[#0a2e0d] border border-[#1a9a21]/20 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50" />
                        <button type="button" onClick={addBlockedRegion} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-3 rounded-xl font-bold transition-colors">Agregar</button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Mensaje para el cliente</label>
                    <textarea rows="3" maxLength="500" value={settings.shippingUnavailableMessage} onChange={(e) => updateField('shippingUnavailableMessage', e.target.value)} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-amber-500/50 rounded-xl px-4 py-3 text-white outline-none transition-colors resize-none" />
                    <p className="text-xs text-[#e6c59e]/55 mt-2">{settings.shippingUnavailableMessage.length}/500 caracteres · aparece cuando el checkout rechaza el domicilio.</p>
                </div>
                <div className="flex justify-end pt-6 border-t border-[#1a9a21]/20">
                    <button disabled={saveMutation.isPending} type="button" onClick={saveCoverageSettings} className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingSection === 'coverage' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {savingSection === 'coverage' ? 'Guardando…' : 'Guardar Zonas sin Cobertura'}
                    </button>
                </div>
            </div>

            {/* Tarjeta 2: Parámetros Financieros & ETAs */}
            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-[32px] p-8 shadow-2xl space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5 text-emerald-400" /> Reglas Financieras y Tiempos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Costo Envío Local</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-[#e6c59e]/55 font-bold">$</span>
                            <input type="number" min="0" value={settings.localShippingCost} onChange={(e) => updateField('localShippingCost', e.target.value)} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-emerald-500/50 rounded-xl pl-8 pr-4 py-3 text-emerald-400 font-bold outline-none transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Costo Envío Foráneo</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-[#e6c59e]/55 font-bold">$</span>
                            <input type="number" min="0" value={settings.externalShippingCost} onChange={(e) => updateField('externalShippingCost', e.target.value)} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-emerald-500/50 rounded-xl pl-8 pr-4 py-3 text-emerald-400 font-bold outline-none transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Umbral Envío Gratis</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-[#e6c59e]/55 font-bold">$</span>
                            <input type="number" min="0" value={settings.freeShippingThreshold} onChange={(e) => updateField('freeShippingThreshold', e.target.value)} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-emerald-500/50 rounded-xl pl-8 pr-4 py-3 text-emerald-400 font-bold outline-none transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Mínimo de Compra</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-[#e6c59e]/55 font-bold">$</span>
                            <input type="number" min="0" value={settings.minPurchaseAmount} onChange={(e) => updateField('minPurchaseAmount', e.target.value)} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-emerald-500/50 rounded-xl pl-8 pr-4 py-3 text-emerald-400 font-bold outline-none transition-colors" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-[#1a9a21]/20 col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Definición ETA Local (Para entregas en estado base)</label>
                        <select 
                            value={settings.localEta} 
                            onChange={(e) => updateField('localEta', e.target.value)} 
                            className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-100 outline-none transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-[#0a2e0d] text-[#e6c59e]/70">Seleccionar tiempo estimado local...</option>
                            <option value="Llega hoy mismo" className="bg-[#0a2e0d]">Llega hoy mismo</option>
                            <option value="Llega mañana" className="bg-[#0a2e0d]">Llega mañana</option>
                            <option value="1 a 2 días hábiles" className="bg-[#0a2e0d]">1 a 2 días hábiles</option>
                            <option value="2 a 3 días hábiles" className="bg-[#0a2e0d]">2 a 3 días hábiles</option>
                            <option value="3 a 5 días hábiles" className="bg-[#0a2e0d]">3 a 5 días hábiles</option>
                        </select>
                        <p className="text-xs text-[#e6c59e]/55 mt-2">Nota: Para los envíos foráneos o internacionales, el tiempo de entrega se calculará dinámicamente mediante la paquetería correspondiente en el checkout.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-[#1a9a21]/20">
                    <button disabled={saveMutation.isPending} type="button" onClick={saveFinancialSettings} className="bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] text-white px-10 py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingSection === 'financial' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {savingSection === 'financial' ? 'Guardando…' : 'Guardar Reglas Financieras'}
                    </button>
                </div>
            </div>

            {/* Tarjeta de Contacto y Redes Sociales */}
            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-[32px] p-8 shadow-2xl space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><HeartHandshake className="w-5 h-5 text-pink-400" /> Contacto y Redes Sociales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Facebook URL</label>
                        <input type="text" value={settings.socialFacebookUrl} onChange={(e) => updateField('socialFacebookUrl', e.target.value)} placeholder="https://facebook.com/..." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-pink-500/50 rounded-xl px-4 py-3 text-white outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Instagram URL</label>
                        <input type="text" value={settings.socialInstagramUrl} onChange={(e) => updateField('socialInstagramUrl', e.target.value)} placeholder="https://instagram.com/..." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-pink-500/50 rounded-xl px-4 py-3 text-white outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Twitter/X URL</label>
                        <input type="text" value={settings.socialTwitterUrl} onChange={(e) => updateField('socialTwitterUrl', e.target.value)} placeholder="https://twitter.com/..." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-pink-500/50 rounded-xl px-4 py-3 text-white outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">WhatsApp de Soporte</label>
                        <input type="text" value={settings.supportWhatsapp} onChange={(e) => updateField('supportWhatsapp', e.target.value)} placeholder="+52 999 123 4567" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-pink-500/50 rounded-xl px-4 py-3 text-white outline-none transition-colors font-mono" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Correo de Soporte</label>
                        <input type="email" value={settings.supportEmail} onChange={(e) => updateField('supportEmail', e.target.value)} placeholder="hola@tienda.com" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/20 focus:border-pink-500/50 rounded-xl px-4 py-3 text-white outline-none transition-colors font-mono" />
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-[#1a9a21]/20">
                    <button disabled={saveMutation.isPending} type="button" onClick={saveContactSettings} className="bg-pink-600 hover:bg-pink-500 text-white px-10 py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingSection === 'contact' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {savingSection === 'contact' ? 'Guardando…' : 'Guardar Redes y Contacto'}
                    </button>
                </div>
            </div>

            {/* Tarjeta 3: Easter Egg / Rescate */}
            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-red-500/10 rounded-[32px] p-8 shadow-2xl">
                <label className="block text-xs font-bold text-red-400 uppercase mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Gestión de Credenciales de Rescate (Easter Egg)</label>
                <div className="flex flex-col md:flex-row gap-4 items-center bg-red-500/5 p-6 rounded-2xl border border-red-500/20">
                    <div className="flex-1 w-full"><input value={newCode} onChange={(e) => setNewCode(e.target.value)} type="password" placeholder="Nuevo Código" className="w-full bg-[#0a2e0d] border border-red-500/30 focus:border-red-500/60 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors" /></div>
                    <div className="flex-1 w-full"><input value={confirmCode} onChange={(e) => setConfirmCode(e.target.value)} type="password" placeholder="Confirmar Nuevo Código" className="w-full bg-[#0a2e0d] border border-red-500/30 focus:border-red-500/60 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors" /></div>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition-colors w-full md:w-auto" onClick={requestDeveloperCodeChange}>Actualizar</button>
                </div>
            </div>

            {/* Modal Re-Auth */}
            {showReauth && (
                <div className="fixed inset-0 bg-[#0a2e0d]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={(e) => { e.preventDefault(); developerCodeMutation.mutate(); }} className="mobile-scroll-safe bg-[#123d17] border border-[#1a9a21]/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-lg animate-in zoom-in-95 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">Re-Autenticación Administrativa</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-red-400 uppercase mb-1">Contraseña actual del administrador</label><input autoFocus required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="w-full bg-[#0a2e0d] border border-red-500/30 focus:border-red-500/60 rounded-xl px-4 py-3 text-white outline-none transition-colors" /></div>
                            <p className="text-xs text-[#e6c59e]/70">Esta acción sensible exige confirmar tu identidad antes de modificar la credencial de rescate.</p>
                        </div>
                        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3 sm:gap-4 mt-8">
                            <button type="button" onClick={() => { setShowReauth(false); setCurrentPassword(''); }} className="flex-1 text-[#e6c59e]/70 hover:text-white transition-colors">Cancelar</button>
                            <button disabled={developerCodeMutation.isPending} type="submit" className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors">{developerCodeMutation.isPending ? 'Verificando…' : 'Confirmar Cambio'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// 3.10 AUDIT LOG
