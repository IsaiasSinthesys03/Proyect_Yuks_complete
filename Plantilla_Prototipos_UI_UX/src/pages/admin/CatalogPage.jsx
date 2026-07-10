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


export const CatalogView = ({ showToast }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState(['Ropa', 'Accesorios']);
    const [newCat, setNewCat] = useState('');

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => { setIsSaving(false); showToast('Producto guardado exitosamente (OCC Validado)', 'success'); }, 1500);
    };

    const addCategory = () => {
        if (newCat && !categories.includes(newCat)) {
            setCategories([...categories, newCat]);
            setNewCat('');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div><h1 className="text-3xl font-black text-white tracking-tight">Master CRUD de Catálogo</h1></div>
            <form onSubmit={handleSave} className="bg-[#0a0b14]/60 backdrop-blur-md border border-white/5 rounded-[40px] p-10 space-y-8 relative shadow-2xl">
                <div className="absolute top-8 right-8 flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400">Estado de Visibilidad:</span>
                    <div className="flex items-center gap-2 bg-[#96c93e]/10 text-[#96c93e] px-3 py-1.5 rounded-lg border border-[#96c93e]/20 cursor-pointer">
                        <ToggleRight className="w-5 h-5" /> <span className="text-xs font-bold">ACTIVO</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2"><span className="w-6 h-6 rounded-full bg-[#03bbd3]/20 text-[#03bbd3] flex items-center justify-center text-xs">1</span> Campos Base y Fotografías</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Nombre</label><input type="text" required className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-black/40 transition-all" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Precio Base (Sin Envío)</label><div className="relative"><span className="absolute left-6 top-4 text-slate-500 font-bold">$</span><input type="number" required className="w-full bg-black/20 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-black/40 transition-all" /></div></div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Selector Creativo Dinámico de Categorías (UX Notion)</label>
                        <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                            {categories.map(cat => (
                                <span key={cat} className="bg-[#03bbd3]/20 text-[#03bbd3] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">{cat} <X className="w-3 h-3 cursor-pointer" onClick={() => setCategories(categories.filter(c => c !== cat))} /></span>
                            ))}
                            <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())} type="text" placeholder="Buscar o crear..." className="bg-transparent border-none text-sm text-white outline-none flex-1 min-w-[150px]" />
                            <button type="button" onClick={addCategory} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> + Crear "{newCat || 'Nombre_Nuevo'}"</button>
                        </div>
                    </div>

                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Editor WYSIWYG (Rich Text)</label>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-6">
                        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex gap-2"><button type="button" className="p-1.5 text-slate-400 hover:text-white bg-slate-700 rounded"><Bold className="w-4 h-4" /></button></div>
                        <textarea rows="4" className="w-full bg-transparent p-4 text-sm text-slate-300 outline-none resize-none" placeholder="Redactar descripciones de forma enriquecida..."></textarea>
                    </div>

                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Fotografías</label>
                    <div className="flex gap-4">
                        <div className="w-1/3 relative border-2 border-dashed border-[#96c93e]/50 bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center text-[#96c93e] cursor-pointer text-center">
                            <div className="absolute top-2 left-2 bg-[#96c93e] text-white text-[10px] font-bold px-2 py-0.5 rounded">PORTADA PRINCIPAL</div>
                            <UploadCloud className="w-8 h-8 mb-2 mt-4" />
                            <p className="text-xs font-bold">Subir Imagen</p>
                        </div>
                        <div className="w-2/3 border-2 border-dashed border-slate-600 bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 cursor-pointer text-center hover:border-slate-500">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <p className="text-xs font-bold">Subir Galería Secundaria</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-4"><h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#03bbd3]/20 text-[#03bbd3] flex items-center justify-center text-xs">2</span> Gestión de Variantes (Abismo de las Tallas)</h3></div>
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-3 overflow-x-auto">
                        <div className="flex items-center gap-3 min-w-[700px]">
                            <div className="w-32"><label className="block text-[10px] text-slate-500 uppercase mb-1">SKU</label><input type="text" defaultValue="PLY-JAG-M" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none" /></div>
                            <div className="w-32"><label className="block text-[10px] text-slate-500 uppercase mb-1">Talla y Color</label><input type="text" defaultValue="M - Color Rojo" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none" /></div>
                            <div className="w-24"><label className="block text-[10px] text-amber-500 font-bold uppercase mb-1">Stock Asignado</label><input type="number" defaultValue="15" className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold outline-none text-center" /></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2"><span className="w-6 h-6 rounded-full bg-[#502c84]/20 text-[#502c84] flex items-center justify-center text-xs">3</span> Game Linker Inteligente</h3>
                    <div className="bg-gradient-to-r from-[#502c84]/20 to-slate-900 border border-[#502c84]/30 p-6 rounded-xl flex gap-4">
                        <Gamepad2 className="w-8 h-8 text-[#502c84] shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-200 mb-1">Asociar recompensa virtual a producto físico</p>
                            <select defaultValue="skin_jaguar" className="w-full bg-slate-900 border border-[#502c84]/50 rounded-xl px-4 py-3 text-white outline-none mt-2">
                                <option value="">Ninguna recompensa</option><option value="skin_jaguar">🎮 Skin: Jaguar Dorado (Menú asíncrono)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-700">
                    <button type="submit" disabled={isSaving} className="bg-[#96c93e] hover:bg-[#86b537] disabled:bg-[#96c93e]/50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Producto
                    </button>
                </div>
            </form>
        </div>
    );
};

// 3.4 MONITOR GLOBAL DE INVENTARIO
