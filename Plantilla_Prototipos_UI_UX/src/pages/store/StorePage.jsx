import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useProducts, useCategories } from '../../api/products';
import { useDebounce } from '../../hooks/useDebounce';
import { quickAdd } from '../../lib/quickAdd';

// Personajes de la marca (mismos del CharacterGrid del Landing) para el filtro
// de Personaje (REQ-FE-12). El backend filtra por la columna `character`.
const BRAND_CHARACTERS = ['Fango', 'Lolita', 'Mila', 'Balam'];

// Tope del slider de precio. En el tope el filtro se desactiva (sin límite)
// para no excluir accidentalmente productos que cuesten más que el máximo.
const PRICE_CAP = 1000;

export const StoreView = ({ showToast, navigate }) => {
    // ── Estado de filtros (Fase 41) — la grilla reacciona a cada cambio ──
    const [selectedCategory, setSelectedCategory] = useState(null); // null = Todas
    const [selectedCharacter, setSelectedCharacter] = useState(null); // null = Todos
    const [maxPrice, setMaxPrice] = useState(PRICE_CAP);
    const [searchText, setSearchText] = useState('');
    const [sortOption, setSortOption] = useState('relevance');

    // Debounce: el slider y la búsqueda NO disparan una petición por pulsación.
    const debouncedSearch = useDebounce(searchText, 350);
    const debouncedMaxPrice = useDebounce(maxPrice, 350);

    const filters = useMemo(() => ({
        search: debouncedSearch || undefined,
        categoryId: selectedCategory || undefined,
        character: selectedCharacter || undefined,
        maxPrice: debouncedMaxPrice < PRICE_CAP ? debouncedMaxPrice : undefined,
        sortBy: sortOption === 'relevance' ? undefined : 'price',
        sortOrder: sortOption === 'priceAsc' ? 'asc' : sortOption === 'priceDesc' ? 'desc' : undefined,
        limit: 24,
    }), [debouncedSearch, selectedCategory, selectedCharacter, debouncedMaxPrice, sortOption]);

    // keepPreviousData: al mover un filtro la grilla conserva los resultados
    // previos mientras llega la nueva página → cero parpadeo, maqueta intacta.
    const { data: pageData } = useProducts(filters);
    const products = pageData?.data ?? [];

    const { data: categories } = useCategories();
    // 'Todas' + categorías reales de la BD (mismo diseño de lista del prototipo).
    const categoryOptions = [{ id: null, name: 'Todas' }, ...(categories ?? [])];

    return (
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row gap-12 pb-20">
            {/* [REQ-FE-05] Sidebar de Filtros Refinado */}
            <aside className="w-full md:w-64 shrink-0 space-y-8 animate-in slide-in-from-left-4">
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#03bbd3]/5 rounded-full blur-3xl"></div>
                    <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest text-[10px]"><Filter className="w-5 h-5 text-[#03bbd3]" /> Filtros de Catálogo</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase">Categoría</p>
                            <div className="space-y-2">
                                {categoryOptions.map(cat => (
                                    <label key={cat.id ?? 'todas'} className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedCategory(cat.id)}>
                                        <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-[#03bbd3] transition-colors flex items-center justify-center">
                                            <div className={`w-2 h-2 bg-[#03bbd3] rounded-sm transition-transform ${selectedCategory === cat.id ? 'scale-100' : 'scale-0 group-hover:scale-100'}`}></div>
                                        </div>
                                        <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors font-medium">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* [REQ-FE-12] Filtro por Personaje — mismo patrón visual que Categoría */}
                        <div className="pt-6 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase">Personaje</p>
                            <div className="space-y-2">
                                {[null, ...BRAND_CHARACTERS].map(ch => (
                                    <label key={ch ?? 'todos'} className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedCharacter(ch)}>
                                        <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-[#03bbd3] transition-colors flex items-center justify-center">
                                            <div className={`w-2 h-2 bg-[#03bbd3] rounded-sm transition-transform ${selectedCharacter === ch ? 'scale-100' : 'scale-0 group-hover:scale-100'}`}></div>
                                        </div>
                                        <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors font-medium">{ch ?? 'Todos'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase">Precio Máx: {maxPrice >= PRICE_CAP ? 'Sin límite' : `$${maxPrice}`}</p>
                            <input type="range" min="0" max={PRICE_CAP} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#03bbd3]" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#502c84] to-[#03bbd3] p-6 rounded-3xl text-white shadow-xl">
                    <Zap className="w-8 h-8 mb-4 text-[#ffce07]" />
                    <h4 className="font-black text-lg mb-2">Pase de Temporada</h4>
                    <p className="text-white/70 text-xs leading-relaxed mb-4">Compra productos seleccionados y desbloquea el Pase de Batalla gratis.</p>
                    <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 rounded-xl text-xs font-bold transition-colors">Saber más</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Buscar en el catálogo..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-[#03bbd3] transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">Ordenar:</span>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer focus:border-[#03bbd3] transition-colors w-full sm:w-auto">
                            <option value="relevance">Relevancia</option>
                            <option value="priceAsc">Precio: Menor a Mayor</option>
                            <option value="priceDesc">Precio: Mayor a Menor</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                    {products.map((product, index) => (
                        <div key={product.id} className="group bg-white/70 backdrop-blur-md rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-[#03bbd3] transition-all shadow-xl hover:shadow-[#03bbd3]/20">
                            <div onClick={() => navigate('product', product.id)} className="relative aspect-[4/5] bg-slate-50 p-6 flex flex-col justify-between overflow-hidden cursor-pointer">
                                <div className="flex justify-between items-start z-10 relative">
                                    {(index + 1) % 3 === 0 ? <span className="bg-[#96c93e] text-white text-[9px] font-black px-2 py-1 rounded uppercase shadow-lg shadow-[#96c93e]/20">Nuevo</span> : <span className="bg-[#ec1676] text-white text-[9px] font-black px-2 py-1 rounded uppercase shadow-lg shadow-[#ec1676]/20">Trending</span>}
                                    <button className="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-400 hover:text-[#ec1676] hover:bg-white transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); showToast('Añadido a favoritos', 'success'); }}><Heart className="w-4 h-4" /></button>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                    {product.imageUrl
                                        ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                        : <Package className="w-24 h-24 text-slate-200" />}
                                </div>
                                <div className="flex gap-1 z-10">
                                    {product.hasVirtualReward && <span className="bg-[#03bbd3] text-white text-[9px] font-black px-2 py-1 rounded border border-[#03bbd3]">Skin Incluida</span>}
                                </div>
                            </div>
                            <div className="p-5">
                                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">{product.categoryName}</p>
                                <h3 className="font-bold text-slate-900 group-hover:text-[#03bbd3] transition-colors cursor-pointer" onClick={() => navigate('product', product.id)}>{product.name}</h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-slate-900">${Number(product.price).toFixed(2)}</span>
                                    </div>
                                    <button onClick={() => quickAdd(product.id, showToast)} className="bg-slate-100 hover:bg-[#03bbd3] text-slate-500 hover:text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

// [NUEVO] VISTA INDIVIDUAL DE PRODUCTO + [ENTERPRISE] WebAR & FOMO
