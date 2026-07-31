import React from 'react';
import { ChevronRight, Heart, Package, ShoppingCart } from 'lucide-react';
import { useTopProducts } from '../../api/products';
import { quickAdd } from '../../lib/quickAdd';
import { useWishlistToggle } from '../../hooks/useWishlistToggle';
import { CatalogProductCard } from '../store/CatalogProductCard';

interface TrendingTopProps {
    navigate: (view: string, id?: any) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const TrendingTop: React.FC<TrendingTopProps> = ({ navigate, showToast }) => {
    const wishlist = useWishlistToggle(showToast);
    // [Fase 39] Top Ventas desde la BD (REQ-FE-02, cacheado en Redis 1h por el backend).
    // Mientras carga, `products` está vacío → la grilla se puebla al llegar la data
    // (sin skeleton, no rompe la maqueta; el encabezado de la sección permanece).
    const { data: topProducts } = useTopProducts(4);
    const products: any[] = topProducts ?? [];

    return (
        <section
            id="tienda"
            className="relative py-8 sm:py-12 overflow-hidden"
        >

            {/* Hojas Colgantes (Invertidas, más grandes y posicionadas orgánicamente en la esquina) */}
            <div className="absolute -top-2 left-0 w-[100%] max-w-[1020px] pointer-events-none z-10 hidden lg:block">
                <img
                    src="/assets/imgWeb/Banner_Tienda/Hojas_CATALOGO.png"
                    alt=""
                    className="w-full h-auto object-contain scale-x-[-1]"
                />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-20">
                <div className="flex flex-col min-[390px]:flex-row min-[390px]:justify-between min-[390px]:items-end gap-5 mb-8 sm:mb-12">
                    <div>
                        <h2 className="font-bungee text-3xl md:text-4xl text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            Trending <span className="text-[#ffce07]">Top</span>
                        </h2>
                        <p className="text-white/90 mt-2 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                            Los más reclamados de la temporada.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('store')}
                        className="group relative w-full min-[390px]:w-auto justify-center px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bungee text-[9px] md:text-xs uppercase tracking-wide text-white border-[2px] sm:border-[2.5px] border-[#3a2212] bg-gradient-to-b from-[#24b42b] via-[#1a9a21] to-[#0f5c14] shadow-[0_3px_0_#3a2212,0_4px_8px_rgba(0,0,0,0.4)] sm:shadow-[0_4px_0_#3a2212,0_6px_10px_rgba(0,0,0,0.4)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_4px_0_#3a2212,0_6px_10px_rgba(0,0,0,0.5)] sm:hover:shadow-[0_5px_0_#3a2212,0_8px_12px_rgba(0,0,0,0.5)] active:translate-y-[3px] sm:active:translate-y-[3.5px] active:shadow-[0_0.5px_0_#3a2212,0_2px_4px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2 overflow-hidden"
                        style={{
                            textShadow: '0 2px 3px rgba(0,0,0,0.6)'
                        }}
                    >
                        {/* Reflejo brillante de cristal */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl"></div>
                        
                        {/* Shimmer de luz que pasa rápido en hover */}
                        <div className="absolute inset-0 w-full h-full opacity-10 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>

                        {/* Pequeño detalle de hoja rústica en la esquina */}
                        <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#e6c59e]/20 blur-[1px] rounded-full pointer-events-none"></div>

                        <span className="relative z-10">Ver todo el catálogo</span>
                        
                        <ChevronRight className="relative z-10 w-4.5 h-4.5 text-white stroke-[3] group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                </div>

                <div 
                    className="flex lg:grid gap-3 sm:gap-5 lg:gap-8 overflow-x-auto lg:overflow-visible lg:grid-cols-4 pb-4 lg:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product, index) => (
                        <div key={product.id} className="shrink-0 w-[150px] sm:w-[200px] lg:w-auto snap-start sm:snap-center lg:snap-align-none">
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

            {/* 2. Divisor de Transición Orgánica (Funde el bosque en el color café #3a2212) */}
            {/* Vignette de gradiente inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#3a2212] via-[#3a2212]/80 to-transparent z-10 pointer-events-none" />

            {/* Borde ondulado estilo caricatura (Mano alzada) con contorno oscuro */}
            <div className="absolute bottom-0 left-0 right-0 w-full h-[30px] z-20 pointer-events-none translate-y-[2px]">
                <svg
                    viewBox="0 0 1440 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full scale-y-125"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,20 C120,5 240,35 360,20 C480,5 600,30 720,15 C840,0 960,35 1080,20 C1200,5 1320,30 1440,15 L1440,40 L0,40 Z"
                        fill="#3a2212"
                    />
                    <path
                        d="M0,20 C120,5 240,35 360,20 C480,5 600,30 720,15 C840,0 960,35 1080,20 C1200,5 1320,30 1440,15"
                        stroke="#251206"
                        strokeWidth="3.5"
                    />
                </svg>
            </div>
        </section>
    );
};
