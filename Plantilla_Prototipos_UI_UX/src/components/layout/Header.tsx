import React from 'react';
import {
    Gamepad2, Search, X, Package, User, ShoppingCart, Menu, ChevronRight, Plus, Terminal, FileText, Heart
} from 'lucide-react';
import { useHeaderNav } from '../../hooks/useHeaderNav';
import { useDebounce } from '../../hooks/useDebounce';
import { useProductSearch } from '../../api/products';
import { useCartStore } from '../../store/cartStore';
import { quickAdd } from '../../lib/quickAdd';
import { useWishlist } from '../../api/profile';

interface HeaderProps {
    navigate: (view: string, payload?: any) => void;
    currentView: string;
    openCart: () => void;
    openProfile: () => void;
    openMobileMenu: () => void;
    isLoggedIn: boolean;
    showToast: (msg: string, type?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
    navigate,
    currentView,
    openCart,
    openProfile,
    openMobileMenu,
    isLoggedIn,
    showToast
}) => {
    // Fase 42: badge del carrito REAL (número de piezas del cartStore).
    const cartCount = useCartStore((s: any) => s.items.reduce((n: number, i: any) => n + i.quantity, 0));
    const { data: wishlist = [] } = useWishlist(isLoggedIn);
    const {
        scrolled,
        searchQuery,
        setSearchQuery,
        showOmnibox,
        clearSearch,
        isCommandOpen,
        closeCommand,
        searchInputRef
    } = useHeaderNav();

    // [Fase 41] Omnibox predictivo REAL: el término viaja debounced (350ms) para
    // no bombardear el backend en cada pulsación. El backend aplica la búsqueda
    // FUZZY de la Fase 33 (pg_trgm): "pikchu" encuentra "Pikachu".
    const debouncedQuery = useDebounce(searchQuery, 350);
    const { data: searchData } = useProductSearch(debouncedQuery);
    const searchResults: any[] = searchData?.data ?? [];

    // Reemplazo de las clases CSS inyectadas por utilidades puras de Tailwind para Glassmorphism
    const getHeaderBg = () => {
        if (!scrolled && !showOmnibox) return 'bg-transparent py-3 sm:py-4 lg:py-6';
        const baseClass = 'backdrop-blur-xl py-2.5 sm:py-3 lg:py-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border-b border-white/30';
        if (currentView === 'landing' || currentView === 'profile') return `${baseClass} bg-[#d4ecb8]/80`;
        return `${baseClass} bg-[#c2e9f0]/80`;
    };

    return (
        <>
            {/* [ENTERPRISE] Command Palette (Cmd+K) migrado al Header global */}
            {isCommandOpen && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[200] flex items-start justify-center pt-[20vh] p-4 animate-in fade-in">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                            <Terminal className="w-5 h-5 text-[#03bbd3]" />
                            <input autoFocus type="text" placeholder="Buscar productos, órdenes o navegar... (Ej. 'Playera' o 'Ir a Legal')" className="flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 text-lg font-light" />
                            <button onClick={closeCommand} className="bg-white text-slate-400 hover:text-slate-900 px-2 py-1 rounded text-xs font-bold border border-slate-200 shadow-sm">ESC</button>
                        </div>
                        <div className="p-4 space-y-2 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <p className="text-xs font-bold text-slate-400 uppercase px-3 py-1">Accesos Rápidos</p>
                            <button onClick={() => { navigate('store'); closeCommand(); }} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 text-slate-600 hover:text-[#03bbd3] transition-colors"><Search className="w-4 h-4 text-slate-400" /> Buscar en Catálogo</button>
                            <button onClick={() => { navigate('profile'); closeCommand(); }} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 text-slate-600 hover:text-[#03bbd3] transition-colors"><Package className="w-4 h-4 text-slate-400" /> Rastrear mis Pedidos</button>
                            <button onClick={() => { navigate('legal'); closeCommand(); }} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 text-slate-600 hover:text-[#03bbd3] transition-colors"><FileText className="w-4 h-4 text-slate-400" /> Documentación Legal</button>
                        </div>
                    </div>
                </div>
            )}

            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${getHeaderBg()}`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-2 sm:gap-4">

                    <button type="button" aria-label="Ir al inicio" className="flex min-h-11 min-w-11 items-center gap-2 cursor-pointer group shrink-0" onClick={() => navigate('landing')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#03bbd3] to-[#502c84] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[0_10px_25px_-5px_rgba(3,187,211,0.2)]"><Gamepad2 className="w-6 h-6 text-white" /></div>
                        <span className="text-xl lg:text-2xl font-bungee tracking-tight text-slate-900 hidden sm:block">Animayuks</span>
                    </button>

                    <nav className="hidden md:flex items-center gap-2 lg:gap-6 font-quicksand font-bold text-sm text-slate-500">
                        <button
                            onClick={() => navigate('landing')}
                            className={`transition-all px-4 py-1.5 rounded-lg ${currentView === 'landing' ? 'bg-white/80 backdrop-blur-sm border border-[#96c93e]/30 text-[#96c93e] shadow-sm' : 'hover:text-[#96c93e]'}`}
                        >
                            Inicio
                        </button>
                        <button
                            onClick={() => navigate('store')}
                            className={`transition-all px-4 py-1.5 rounded-lg ${currentView === 'store' ? 'bg-white/80 backdrop-blur-sm border border-[#03bbd3]/30 text-[#03bbd3] shadow-sm' : 'hover:text-[#03bbd3]'}`}
                        >
                            Catálogo
                        </button>
                    </nav>

                    <div className="flex items-center gap-3 sm:gap-4 text-slate-500 shrink-0">
                        {/* Botones de usuario y carrito eliminados por solicitud del usuario */}
                        <button type="button" onClick={openMobileMenu} aria-label="Abrir menú principal" className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/50 hover:text-slate-900"><Menu className="w-6 h-6" /></button>
                    </div>
                </div>
            </header>
        </>
    );
};
