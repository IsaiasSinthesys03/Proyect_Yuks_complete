import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, Filter, Package, X, ChevronDown, ChevronLeft, ChevronRight, ArrowDownUp,
    Zap, Sparkles, TreePine, Leaf, Star, Flame, ShoppingBag, Gift, Tag,
    Shirt, Gamepad2, BookOpen, Utensils, Watch, ArrowLeft, User, ShoppingCart
} from 'lucide-react';
import { useProducts, useCategories, useTopProducts } from '../../api/products';
import { useBanners } from '../../api/banners';
import { useDebounce } from '../../hooks/useDebounce';
import { CatalogProductCard } from '../../components/store/CatalogProductCard';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

// ══════════════════════════════════════════════════════════════════
// HUB PRINCIPAL DE LA TIENDA ANIMAYUKS — 5 ZONAS
// ══════════════════════════════════════════════════════════════════
//
// Zona 1: Hero Banner Carousel  (banners del CMS)
// Zona 2: Quick Category Links  (tótems de personajes)
// Zona 3: Trending Top Carousel (top ventas horizontal)
// Zona 4: Promo Interstitial    (Pase de Temporada)
// Zona 5: Catálogo General      (sidebar + grid con filtros)
//
// ══════════════════════════════════════════════════════════════════

const PRICE_CAP = 1000;

// Banner estático por defecto cuando no hay banners activos en el CMS
const DEFAULT_BANNER = {
    title: 'Bienvenido al Bosque Mágico',
    description: 'Explora la colección completa de Animayuks. Ropa, accesorios y recompensas exclusivas del videojuego.',
    imageUrl: null,
    buttonText: 'Explorar Catálogo',
    accentColor: '#ffce07',
};

// ════════════════════════════════════════════════════════
// SVG DIVIDER — Liana ondulante reutilizable entre zonas
// ════════════════════════════════════════════════════════
const LianaDivider = ({ fillTop = '#3a2212', fillBottom = '#0a2e0d', flip = false }) => (
    <div className={`relative w-full h-[30px] pointer-events-none z-30 ${flip ? 'scale-y-[-1]' : ''}`}>
        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,20 C120,5 240,35 360,20 C480,5 600,30 720,15 C840,0 960,35 1080,20 C1200,5 1320,30 1440,15 L1440,40 L0,40 Z" fill={fillBottom} />
            <path d="M0,20 C120,5 240,35 360,20 C480,5 600,30 720,15 C840,0 960,35 1080,20 C1200,5 1320,30 1440,15" stroke="#251206" strokeWidth="3" />
        </svg>
    </div>
);

// ════════════════════════════════════════════════════════
// ZONA 1 — HERO BANNER CAROUSEL
// ════════════════════════════════════════════════════════
const HeroBannerCarousel = ({ navigate }) => {
    return (
        <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#0a2e0d] via-[#1a4c1e] to-[#0f5c14]">
            {/* Troncos laterales decorativos como marco general de la zona 1 */}
            <div className="absolute top-0 left-0 h-full w-[60px] md:w-[90px] pointer-events-none z-20 hidden lg:block opacity-60">
                <img src="/assets/imgWeb/Banner_Tienda/Tronco_Izq.png" alt="" className="h-full w-auto object-cover object-right" />
            </div>
            <div className="absolute top-0 right-0 h-full w-[60px] md:w-[90px] pointer-events-none z-20 hidden lg:block opacity-60">
                <img src="/assets/imgWeb/Banner_Tienda/Tronco_Drch.png" alt="" className="h-full w-auto object-cover object-left" />
            </div>
            
            <HeroCarousel />
            
            {/* Liana divisoria en la parte inferior de la zona 1 para conectar con la zona 2 */}
            <div className="absolute bottom-0 w-full z-30 translate-y-[2px]">
                <LianaDivider fillTop="transparent" fillBottom="#3a2212" />
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════
// ZONA 2 — QUICK CATEGORY LINKS
// ════════════════════════════════════════════════════════
const QuickCategoryLinks = ({ onSelectCategory }) => {
    const quickLinks = [
        { label: 'Ropa',       icon: <Shirt className="w-7 h-7 text-[#3a2212] drop-shadow-sm" />,      action: () => onSelectCategory('Ropa') },
        { label: 'Juguetes',   icon: <Gamepad2 className="w-7 h-7 text-[#3a2212] drop-shadow-sm" />,   action: () => onSelectCategory('Juguetes') },
        { label: 'Libros',     icon: <BookOpen className="w-7 h-7 text-[#3a2212] drop-shadow-sm" />,   action: () => onSelectCategory('Libros') },
        { label: 'Cocina',     icon: <Utensils className="w-7 h-7 text-[#3a2212] drop-shadow-sm" />,   action: () => onSelectCategory('Cocina') },
        { label: 'Accesorios', icon: <Watch className="w-7 h-7 text-[#3a2212] drop-shadow-sm" />,      action: () => onSelectCategory('Accesorios') },
    ];

    return (
        <div
            className="relative py-6 overflow-hidden"
            style={{
                backgroundColor: '#3a2212',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill='none' stroke='black' stroke-width='1.5' stroke-opacity='0.16'%3E%3Cpath d='M10 0 C 15 30, 5 70, 10 110 C 15 130, 25 145, 20 160'/%3E%3Cpath d='M70 0 C 65 30, 55 50, 55 70 C 55 90, 65 110, 70 160'/%3E%3Cpath d='M130 0 C 125 45, 140 85, 135 125 C 130 140, 135 150, 130 160'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
        >
            <div className="container mx-auto px-4 lg:px-12">
                <div className="flex items-center gap-3 md:gap-5 overflow-x-auto py-4 scrollbar-hide justify-start md:justify-center">
                    {quickLinks.map((link, idx) => (
                        <button
                            key={idx}
                            onClick={link.action}
                            className="flex flex-col items-center gap-2 shrink-0 group"
                            style={{ animation: `bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both`, animationDelay: `${idx * 60}ms` }}
                        >
                            <div className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-full border-[2.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_3px_0_#3a2212,0_4px_8px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-[0_5px_0_#3a2212,0_8px_12px_rgba(0,0,0,0.4)] group-active:translate-y-[2px] group-active:shadow-[0_1px_0_#3a2212] transition-all duration-200">
                                {/* Reflejo */}
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full z-10"></div>
                                {/* Musgo */}
                                <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#1a9a21] opacity-20 blur-[3px] rounded-full pointer-events-none"></div>

                                <div className="relative z-0 group-hover:scale-110 transition-transform duration-200">{link.icon}</div>
                            </div>
                            <span
                                className="text-[10px] md:text-[11px] font-black text-white/90 uppercase tracking-wider group-hover:text-[#ffce07] transition-colors"
                                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                            >
                                {link.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════
// ZONA 3 — TRENDING TOP CAROUSEL HORIZONTAL
// ════════════════════════════════════════════════════════
const TrendingCarousel = ({ navigate, showToast }) => {
    const { data: topProducts } = useTopProducts(8);
    const products = topProducts ?? [];
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const amount = 280;
        scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    if (products.length === 0) return null;

    return (
        <div
            className="relative py-10 md:py-14 overflow-hidden bg-gradient-to-b from-[#061f09] via-[#0a2e0d] to-[#061f09]"
        >


            {/* Hojas colgantes */}
            <div className="absolute -top-2 right-0 w-[50%] max-w-[500px] pointer-events-none z-10 hidden lg:block opacity-50">
                <img src="/assets/imgWeb/Banner_Tienda/Hojas_CATALOGO.png" alt="" className="w-full h-auto object-contain" />
            </div>

            <div className="relative z-20 container mx-auto px-6 lg:px-12">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="font-bungee text-xl sm:text-2xl md:text-3xl text-white leading-tight flex items-center gap-2" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                            <Flame className="w-6 h-6 md:w-7 md:h-7 text-[#ffce07]" />
                            Lo Más <span className="text-[#ffce07]">Vendido</span>
                        </h2>
                        <p className="text-white/70 mt-1 font-bold text-sm" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                            Los favoritos de la temporada en el bosque.
                        </p>
                    </div>

                    {/* Scroll Arrows */}
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="relative overflow-hidden w-9 h-9 rounded-xl border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_2px_0_#3a2212] flex items-center justify-center hover:brightness-110 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_0px_0_#3a2212] transition-all"
                        >
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl"></div>
                            <ChevronLeft className="w-4 h-4 text-[#3a2212] stroke-[2.5] relative z-10" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="relative overflow-hidden w-9 h-9 rounded-xl border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_2px_0_#3a2212] flex items-center justify-center hover:brightness-110 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_0px_0_#3a2212] transition-all"
                        >
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl"></div>
                            <ChevronRight className="w-4 h-4 text-[#3a2212] stroke-[2.5] relative z-10" />
                        </button>
                    </div>
                </div>

                {/* Horizontal Scroll */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 sm:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product, index) => (
                        <div
                            key={product.id}
                            className="shrink-0 w-[150px] sm:w-[200px] md:w-[240px] snap-start sm:snap-center"
                        >
                            <CatalogProductCard
                                product={product}
                                index={index}
                                navigate={navigate}
                                showToast={showToast}
                                isTrending={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════
// ZONA 4 — PROMO INTERSTITIAL (PASE DE TEMPORADA)
// ════════════════════════════════════════════════════════
const PromoInterstitial = () => (
    <div className="relative py-6 bg-[#3a2212]">
        <div className="container mx-auto px-6 lg:px-12">
            <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-[#251206] bg-gradient-to-r from-[#0f5c14] via-[#1a9a21] to-[#0f5c14] shadow-[0_5px_0_#251206,0_8px_20px_rgba(0,0,0,0.4)] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                {/* Reflejo */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl"></div>
                {/* Decoración */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#ffce07] opacity-10 blur-[40px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#1a9a21] opacity-20 blur-[30px] rounded-full pointer-events-none"></div>

                {/* Ícono */}
                <div className="relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl border-[2px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_3px_0_#3a2212,0_4px_8px_rgba(0,0,0,0.3)] flex items-center justify-center">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-2xl"></div>
                    <Zap className="w-10 h-10 md:w-12 md:h-12 text-[#ffce07] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                </div>

                {/* Text */}
                <div className="flex-1 text-center md:text-left relative z-10">
                    <h3
                        className="font-bungee text-lg md:text-2xl text-white leading-tight mb-2"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
                    >
                        Pase de Temporada <span className="text-[#ffce07]">Activo</span>
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm font-medium max-w-lg leading-relaxed">
                        Compra productos seleccionados y desbloquea el Pase de Batalla gratis. Skins exclusivas, descuentos y recompensas épicas te esperan.
                    </p>
                </div>

                {/* CTA */}
                <button className="relative shrink-0 px-6 py-4 rounded-2xl font-bungee text-[10px] uppercase tracking-wide text-[#3a2212] border-[2px] border-[#3a2212] bg-gradient-to-b from-[#ffce07] via-[#ffc107] to-[#e6a800] shadow-[0_3px_0_#3a2212,0_4px_8px_rgba(0,0,0,0.3)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_4px_0_#3a2212,0_6px_10px_rgba(0,0,0,0.4)] active:translate-y-[3px] active:shadow-[0_0px_0_#3a2212] transition-all overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-2xl"></div>
                    <span className="relative z-10 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Saber más
                    </span>
                </button>
            </div>
        </div>
    </div>
);

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — STORE HUB
// ════════════════════════════════════════════════════════
export const StoreView = ({ showToast, navigate, openCart, openProfile }) => {
    // ── Estado de filtros ──
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [maxPrice, setMaxPrice] = useState(PRICE_CAP);
    const searchText = useUiStore((s) => s.globalSearchQuery);
    const setSearchText = useUiStore((s) => s.setGlobalSearchQuery);
    const [sortOption, setSortOption] = useState('relevance');
    const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
    
    // Auth & Cart
    const isLoggedIn = useAuthStore(s => !!s.user);
    const cartCount = useCartStore(s => s.items.reduce((acc, item) => acc + item.quantity, 0));

    const debouncedSearch = useDebounce(searchText, 350);
    const debouncedMaxPrice = useDebounce(maxPrice, 350);

    const filters = useMemo(() => ({
        search: debouncedSearch || undefined,
        categoryId: selectedCategory || undefined,
        maxPrice: debouncedMaxPrice < PRICE_CAP ? debouncedMaxPrice : undefined,
        sortBy: sortOption === 'relevance' ? undefined : 'price',
        sortOrder: sortOption === 'priceAsc' ? 'asc' : sortOption === 'priceDesc' ? 'desc' : undefined,
        limit: 24,
    }), [debouncedSearch, selectedCategory, debouncedMaxPrice, sortOption]);

    const { data: pageData } = useProducts(filters);
    const products = pageData?.data ?? [];
    const { data: categories } = useCategories();
    const categoryOptions = [{ id: null, name: 'Todas' }, ...(categories ?? [])];

    const hasActiveFilters = selectedCategory || maxPrice < PRICE_CAP || searchText;
    const clearAllFilters = () => {
        setSelectedCategory(null);
        setMaxPrice(PRICE_CAP);
        setSearchText('');
        setSortOption('relevance');
    };

    // Handler para Quick Links de Zona 2: activa filtro por categoria + scroll a Zona 5
    const handleQuickCategory = (categoryName) => {
        const normalize = (s) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
        const target = normalize(categoryName);
        const cat = categories?.find(c => {
            const current = normalize(c.name);
            return current === target || current.includes(target) || target.includes(current);
        });
        
        if (cat) {
            setSelectedCategory(cat.id);
        }
        setTimeout(() => {
            const el = document.getElementById('catalogo-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // ═══ SIDEBAR DE FILTROS (reutilizado en desktop y mobile drawer) ═══
    const FilterContent = () => (
        <>
            <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_5px_0_#3a2212,0_8px_15px_rgba(0,0,0,0.3)] p-5">
                <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-xl"></div>
                <div className="absolute top-0 left-0 w-8 h-8 bg-[#1a9a21] opacity-20 blur-[6px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#1a9a21] opacity-15 blur-[8px] rounded-full pointer-events-none"></div>

                <h3 className="relative z-10 font-black text-[#3a2212] mb-5 flex items-center gap-2 uppercase tracking-widest text-[10px]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                    <Filter className="w-4 h-4 text-[#3a2212]" /> Filtros del Bosque
                </h3>

                <div className="space-y-5 relative z-10">
                    {/* Categoría */}
                    <div>
                        <p className="text-[10px] font-black text-[#3a2212]/70 mb-2.5 uppercase tracking-wider flex items-center gap-1.5" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                            <TreePine className="w-3 h-3" /> Categoría
                        </p>
                        <div className="space-y-1.5">
                            {categoryOptions.map(cat => (
                                <label key={cat.id ?? 'todas'} className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/20 transition-all duration-200" onClick={() => setSelectedCategory(cat.id)}>
                                    <div className={`w-4 h-4 rounded-md border-[1.5px] transition-all duration-200 flex items-center justify-center ${selectedCategory === cat.id ? 'border-[#1a9a21] bg-[#1a9a21] shadow-[0_0_6px_rgba(26,154,33,0.4)]' : 'border-[#3a2212]/40 bg-white/30 group-hover:border-[#1a9a21]/60'}`}>
                                        {selectedCategory === cat.id && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                                    </div>
                                    <span className="text-xs text-[#3a2212] group-hover:text-[#0f5c14] transition-colors font-bold" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}>{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-[#3a2212]/30 to-transparent"></div>

                    {/* Precio */}
                    <div>
                        <p className="text-[10px] font-black text-[#3a2212]/70 mb-3 uppercase tracking-wider" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                            Precio Máx: {maxPrice >= PRICE_CAP ? 'Sin límite' : `$${maxPrice}`}
                        </p>
                        <input type="range" min="0" max={PRICE_CAP} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="catalog-price-slider w-full" />
                        <div className="flex justify-between text-[9px] font-bold text-[#3a2212]/50 mt-1">
                            <span>$0</span><span>$1000+</span>
                        </div>
                    </div>

                    {/* Limpiar */}
                    {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="w-full relative overflow-hidden py-2 rounded-xl border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#f5e6d0] to-[#e6c59e] shadow-[0_2px_0_#3a2212] text-[10px] font-black text-[#3a2212] uppercase tracking-wider hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#3a2212] active:translate-y-[2px] active:shadow-[0_0px_0_#3a2212] transition-all">
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl"></div>
                            <span className="relative z-10 flex items-center justify-center gap-1.5"><X className="w-3 h-3" /> Limpiar Filtros</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    // ════════════════════════════════════════════════════════
    // RENDER — 5 ZONAS APILADAS VERTICALMENTE
    // ════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen flex flex-col">

            {/* ═══ BARRA DE BÚSQUEDA Y FILTROS (Arriba de los banners) ═══ */}
            <div className="w-full bg-[#0a2e0d] pt-3 sm:pt-4 pb-3 px-3 sm:px-4 lg:px-12 z-40 relative">
                <div className="container mx-auto max-w-[1400px] relative flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3 lg:gap-6">
                    
                    {/* Top Row / Far Left Container */}
                    <div className="order-1 w-full lg:w-auto flex shrink-0 items-center justify-between lg:justify-start gap-2 sm:gap-3 relative">
                        
                        {/* Mobile Profile Button (Left) */}
                        <button onClick={openProfile} aria-label={isLoggedIn ? 'Abrir perfil' : 'Iniciar sesión'} className={`flex lg:hidden relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:bg-white/20 hover:scale-105 hover:border-white/40 transition-all ${isLoggedIn ? 'text-[#03bbd3] border-[#03bbd3]/50' : 'text-white'}`}>
                            <User className="w-5 h-5 drop-shadow-md" />
                            {isLoggedIn && <span className="absolute -top-1.5 -right-1.5 bg-[#ec1676] text-white text-[10px] font-black min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-md border-[1.5px] border-[#0a2e0d] px-1">3</span>}
                        </button>
                        
                        {/* Logo Animayuks (Center on Mobile, Far Left on Desktop) */}
                        <img 
                            src="/assets/img/logo_animayuks.png" 
                            alt="Logo Animayuks" 
                            className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-0 lg:translate-x-0 h-8 sm:h-10 md:h-12 w-auto max-w-[120px] sm:max-w-[160px] object-contain drop-shadow-sm cursor-pointer" 
                            onClick={() => window.location.href = '/'} 
                        />

                        {/* Desktop Profile Button (Hidden on Mobile) */}
                        <button onClick={openProfile} aria-label={isLoggedIn ? 'Abrir perfil' : 'Iniciar sesión'} className={`hidden lg:flex shrink-0 w-12 h-12 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:bg-white/20 hover:scale-105 hover:border-white/40 transition-all relative ${isLoggedIn ? 'text-[#03bbd3] border-[#03bbd3]/50' : 'text-white'}`}>
                            <User className="w-6 h-6 drop-shadow-md" />
                            {isLoggedIn && <span className="absolute -top-1.5 -right-1.5 bg-[#ec1676] text-white text-[10px] font-black min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-md border-[1.5px] border-[#0a2e0d] px-1">3</span>}
                        </button>
                        
                        {/* Mobile Cart Button (Right) */}
                        <button onClick={openCart} aria-label="Abrir carrito" className="flex lg:hidden relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20">
                            <ShoppingCart className="w-5 h-5 drop-shadow-md -ml-0.5" />
                            <span className="absolute -top-1.5 -right-1.5 bg-[#ffce07] text-[#3a2212] text-[10px] font-black min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-md border-[1.5px] border-[#0a2e0d] px-1">{cartCount}</span>
                        </button>
                    </div>

                    {/* The Beige Bar (Center) */}
                    <div className="order-3 lg:order-2 basis-full lg:basis-auto lg:flex-1 relative rounded-2xl border-[2.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_4px_0_#3a2212,0_6px_10px_rgba(0,0,0,0.3)] p-2 sm:p-3.5 flex flex-row gap-1.5 sm:gap-3 items-center min-w-0">
                        <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-xl"></div>
                        
                        {/* Back & Filtros Buttons */}
                        <div className="relative shrink-0 z-10 flex items-center gap-1.5 sm:gap-2">
                            {hasActiveFilters && (
                                <button 
                                    onClick={clearAllFilters}
                                    className="shrink-0 w-10 h-10 bg-white/60 backdrop-blur-sm border-[1.5px] border-[#3a2212]/30 rounded-xl flex items-center justify-center text-[#3a2212] hover:bg-white/80 hover:text-[#0f5c14] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all"
                                    title="Volver al inicio"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div className="relative">
                                <button 
                                    onClick={() => setDesktopFiltersOpen(!desktopFiltersOpen)}
                                    className="relative overflow-hidden w-10 h-10 lg:w-32 bg-white/60 backdrop-blur-sm border-[1.5px] border-[#3a2212]/30 rounded-xl lg:px-3 lg:py-2.5 text-xs text-[#3a2212] font-bold outline-none cursor-pointer focus:border-[#1a9a21] focus:bg-white/80 hover:bg-white/80 transition-all flex items-center justify-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#3a2212]" />
                                        <span className="hidden lg:inline">Filtros {hasActiveFilters && '*'}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-[#3a2212]/50 transition-transform hidden lg:block ${desktopFiltersOpen ? 'rotate-180' : ''}`} />
                                    {/* Punto rojo móvil */}
                                    {hasActiveFilters && <div className="absolute top-1 right-1 w-2 h-2 bg-[#ffce07] rounded-full lg:hidden border border-[#3a2212]"></div>}
                                </button>
                                
                                {/* Desktop Filters Dropdown */}
                                {desktopFiltersOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <FilterContent />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 min-w-0 z-10">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a2212]/50" />
                            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Buscar..." className="w-full bg-white/60 backdrop-blur-sm border-[1.5px] border-[#3a2212]/30 rounded-xl pl-9 pr-2 py-2.5 text-xs text-[#3a2212] font-bold outline-none placeholder:text-[#3a2212]/40 focus:border-[#1a9a21] focus:bg-white/80 focus:shadow-[0_0_8px_rgba(26,154,33,0.2)] transition-all h-10 lg:h-auto" />
                        </div>

                        {/* Ordenar */}
                        <div className="relative shrink-0 lg:w-auto z-10 flex items-center gap-2">
                            <span className="text-[10px] font-black text-[#3a2212]/60 shrink-0 uppercase hidden md:inline-block" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}>Ordenar:</span>
                            <div className="relative w-10 h-10 lg:h-auto lg:w-36">
                                {/* Icono móvil */}
                                <div className="absolute inset-0 flex items-center justify-center lg:hidden pointer-events-none bg-white/60 backdrop-blur-sm border-[1.5px] border-[#3a2212]/30 rounded-xl text-[#3a2212]">
                                    <ArrowDownUp className="w-4 h-4" />
                                </div>
                                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="appearance-none bg-white/60 lg:bg-white/60 backdrop-blur-sm border-[1.5px] border-[#3a2212]/30 rounded-xl px-3 lg:pr-8 py-2.5 text-xs text-[#3a2212] font-bold outline-none cursor-pointer focus:border-[#1a9a21] focus:bg-white/80 transition-all w-full h-full opacity-0 lg:opacity-100 absolute lg:relative inset-0">
                                    <option value="relevance">Relevancia</option>
                                    <option value="priceAsc">Menor a Mayor</option>
                                    <option value="priceDesc">Mayor a Menor</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3a2212]/50 pointer-events-none hidden lg:block" />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Cart Button (Far Right) */}
                    <button onClick={openCart} aria-label="Abrir carrito" className="hidden lg:flex relative order-2 h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20 lg:order-3">
                        <ShoppingCart className="w-5 h-5 drop-shadow-md -ml-0.5" />
                        <span className="absolute -top-1.5 -right-1.5 bg-[#ffce07] text-[#3a2212] text-[10px] font-black min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-md border-[1.5px] border-[#0a2e0d] px-1">{cartCount}</span>
                    </button>

                </div>
            </div>
            {/* ═══ ZONAS DE LANDING (Se ocultan si hay filtros activos) ═══ */}
            {!hasActiveFilters && (
                <>
                    {/* ═══ ZONA 1: Hero Banner ═══ */}
                    <HeroBannerCarousel navigate={navigate} />

                    {/* ═══ ZONA 2: Quick Category Links ═══ */}
                    <QuickCategoryLinks onSelectCategory={handleQuickCategory} />

                    {/* Divider Liana */}
                    <LianaDivider fillTop="#3a2212" fillBottom="#0a2e0d" />

                    {/* ═══ ZONA 3: Trending Top Carousel ═══ */}
                    <TrendingCarousel navigate={navigate} showToast={showToast} />

                    {/* Divider Liana */}
                    <LianaDivider fillTop="#0a2e0d" fillBottom="#3a2212" />

                    {/* ═══ ZONA 4: Promo Interstitial ═══ */}
                    <PromoInterstitial />

                    {/* Divider Liana */}
                    <LianaDivider fillTop="#3a2212" fillBottom="#0a2e0d" />
                </>
            )}

            {/* ═══ ZONA 5: Catálogo General ═══ */}
            <section
                id="catalogo-grid"
                className="relative pb-20 overflow-hidden bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/imgWeb/Banner_Tienda/Fondo_2.png')" }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a2e0d]/75 via-[#0a2e0d]/55 to-[#3a2212]/80 pointer-events-none z-0"></div>

                {/* Hojas colgantes */}
                <div className="absolute -top-2 left-0 w-[55%] max-w-[650px] pointer-events-none z-10 hidden lg:block opacity-60">
                    <img src="/assets/imgWeb/Banner_Tienda/Hojas_CATALOGO.png" alt="" className="w-full h-auto object-contain scale-x-[-1]" />
                </div>

                {/* Encabezado de sección */}
                <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-12 pt-10 pb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div>
                            <h2 className="font-bungee text-xl sm:text-2xl md:text-3xl text-white leading-tight flex flex-wrap items-center gap-2" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                                <Leaf className="w-6 h-6 md:w-7 md:h-7 text-[#24b42b]" />
                                Explorar Todo el <span className="text-[#ffce07]">Catálogo</span>
                            </h2>
                            <p className="text-white/70 mt-1 font-bold text-sm" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                                Filtra, busca y encuentra lo que necesitas en el bosque mágico.
                            </p>
                        </div>
                        <div className="shrink-0 px-4 py-2 rounded-xl border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] to-[#d4ad82] shadow-[0_2px_0_#3a2212] text-[10px] font-black text-[#3a2212] uppercase tracking-wider" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                            {products.length} producto{products.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Layout: Grid */}
                <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row gap-6 md:gap-8">


                    {/* Main Content */}
                    <main className="flex-1 space-y-6 min-w-0">


                        {/* Product Grid */}
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                                {products.map((product, index) => (
                                    <CatalogProductCard key={product.id} product={product} index={index} navigate={navigate} showToast={showToast} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-28 h-28 rounded-full border-[3px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] to-[#b88d5e] shadow-[0_4px_0_#3a2212,0_6px_12px_rgba(0,0,0,0.3)] flex items-center justify-center mb-6 relative" style={{ animation: 'leaf-float 3s ease-in-out infinite' }}>
                                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full"></div>
                                    <Package className="w-12 h-12 text-[#3a2212]/40 relative z-10" />
                                </div>
                                <h3 className="font-bungee text-base sm:text-lg text-white leading-snug mb-3" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                                    ¡Los aventureros no encontraron productos!
                                </h3>
                                <p className="text-white/60 text-sm font-medium mb-5 max-w-sm">
                                    Intenta cambiar los filtros o buscar algo diferente en el bosque mágico.
                                </p>
                                {hasActiveFilters && (
                                    <button onClick={clearAllFilters} className="group relative px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white border-[2px] border-[#3a2212] bg-gradient-to-b from-[#24b42b] via-[#1a9a21] to-[#0f5c14] shadow-[0_3px_0_#3a2212,0_5px_8px_rgba(0,0,0,0.4)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_4px_0_#3a2212,0_6px_10px_rgba(0,0,0,0.5)] active:translate-y-[3px] active:shadow-[0_0.5px_0_#3a2212] transition-all overflow-hidden" style={{ textShadow: '0 2px 3px rgba(0,0,0,0.6)' }}>
                                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl"></div>
                                        <span className="relative z-10 flex items-center gap-2"><X className="w-3.5 h-3.5" /> Limpiar Filtros</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </main>
                </div>

                {/* Gradiente inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#3a2212] via-[#3a2212]/60 to-transparent z-10 pointer-events-none"></div>
            </section>
        </div>
    );
};
