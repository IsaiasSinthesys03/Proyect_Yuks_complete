import React from 'react';
import {
    Gamepad2, Search, X, Package, User, ShoppingCart, Menu, ChevronRight, Plus, Terminal, FileText
} from 'lucide-react';
import { useHeaderNav } from '../../hooks/useHeaderNav';

interface HeaderProps {
    navigate: (view: string, payload?: any) => void;
    currentView: string;
    openCart: () => void;
    openProfile: () => void;
    openMobileMenu: () => void;
    isLoggedIn: boolean;
    setCartTotal: React.Dispatch<React.SetStateAction<number>>;
    cartTotal: number;
    showToast: (msg: string, type?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
    navigate,
    currentView,
    openCart,
    openProfile,
    openMobileMenu,
    isLoggedIn,
    setCartTotal,
    cartTotal,
    showToast
}) => {
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

    // Reemplazo de las clases CSS inyectadas por utilidades puras de Tailwind para Glassmorphism
    const getHeaderBg = () => {
        if (!scrolled && !showOmnibox) return 'bg-transparent py-6';
        const baseClass = 'backdrop-blur-xl py-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border-b border-white/30';
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
                <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">

                    <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => navigate('landing')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#03bbd3] to-[#502c84] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[0_10px_25px_-5px_rgba(3,187,211,0.2)]"><Gamepad2 className="w-6 h-6 text-white" /></div>
                        <span className="text-2xl font-black tracking-tight text-slate-900 hidden sm:block">Animayuks</span>
                    </div>

                    <nav className="hidden xl:flex items-center gap-8 font-bold text-sm text-slate-500">
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
                        <button className="hover:text-[#03bbd3] transition-colors">Colecciones</button>
                        <button className="hover:text-[#03bbd3] transition-colors flex items-center gap-1"><Gamepad2 className="w-4 h-4" /> Juega</button>
                    </nav>

                    {/* [ENTERPRISE] Omnibox Predictivo Search */}
                    <div className="flex-1 max-w-md relative hidden md:block">
                        <div className="relative">
                            <Search className={`absolute left-4 top-2.5 w-4 h-4 ${showOmnibox ? 'text-[#03bbd3]' : 'text-slate-400'}`} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar productos (Cmd+K)..."
                                className={`w-full bg-slate-100/80 backdrop-blur-sm border rounded-full pl-10 pr-4 py-2 text-sm text-slate-900 outline-none transition-all ${showOmnibox ? 'border-[#03bbd3] shadow-[0_0_15px_rgba(3,187,211,0.15)] bg-white' : 'border-slate-200 focus:border-[#03bbd3] focus:bg-white'}`}
                            />
                            {searchQuery && <button onClick={clearSearch} className="absolute right-4 top-2.5 text-slate-400 hover:text-slate-900"><X className="w-4 h-4" /></button>}
                        </div>

                        {/* Omnibox Dropdown */}
                        {showOmnibox && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] overflow-hidden z-[100] animate-in fade-in zoom-in-95">
                                <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500">Resultados para "{searchQuery}"</span>
                                    <span className="text-[10px] bg-[#03bbd3]/10 text-[#03bbd3] px-2 py-0.5 rounded border border-[#03bbd3]/20">Búsqueda Predictiva Algolia</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    {[1, 2].map(i => (
                                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group" onClick={() => { clearSearch(); navigate('product', i); }}>
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Package className="w-6 h-6 text-slate-400 group-hover:text-[#03bbd3] transition-colors" /></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#03bbd3] transition-colors">Playera Élite Neón {i}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500">$450.00</span>
                                                    <span className="text-[9px] bg-[#502c84]/10 text-[#502c84] px-1.5 py-0.5 rounded flex items-center gap-1"><Gamepad2 className="w-3 h-3" /> Skin Incluida</span>
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setCartTotal(prev => prev + 450); showToast('Agregado directo desde Omnibox', 'success'); clearSearch(); }} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#03bbd3] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-sm">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { clearSearch(); navigate('store'); }}>
                                    <span className="text-xs font-bold text-[#03bbd3]">Ver todos los resultados <ChevronRight className="w-3 h-3 inline" /></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-slate-500 shrink-0">
                        <button onClick={() => navigate('store')} className="hover:text-[#03bbd3] transition-colors md:hidden"><Search className="w-5 h-5" /></button>

                        <button onClick={openProfile} className={`hover:text-[#03bbd3] transition-colors relative flex items-center gap-2 ${isLoggedIn ? 'text-[#03bbd3]' : ''}`}>
                            <User className="w-5 h-5" />
                            {isLoggedIn && <span className="absolute -top-2 -right-2 bg-[#ec1676] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">3</span>}
                        </button>

                        <button onClick={openCart} className="hover:text-white transition-colors relative flex items-center gap-2 bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 px-3 py-1.5 rounded-full group">
                            <ShoppingCart className="w-4 h-4 text-slate-500 group-hover:text-[#03bbd3] transition-colors" />
                            <span className="text-xs font-bold text-[#03bbd3]">{cartTotal > 0 ? (cartTotal / 450) : 0}</span>
                        </button>

                        <button onClick={openMobileMenu} className="md:hidden hover:text-slate-900"><Menu className="w-6 h-6" /></button>
                    </div>
                </div>
            </header>
        </>
    );
};
