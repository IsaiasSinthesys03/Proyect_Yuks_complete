import React from 'react';
import { ChevronRight, Heart, Package, ShoppingCart } from 'lucide-react';

interface TrendingTopProps {
    navigate: (view: string, id?: any) => void;
    setCartTotal: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const TrendingTop: React.FC<TrendingTopProps> = ({ navigate, setCartTotal, showToast }) => {
    const products = [1, 2, 3, 4];

    return (
        <section
            id="tienda"
            className="relative py-28 border-y border-[#3a2212]/30 overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: "url('/assets/imgWeb/Banner_Tienda/Fondo_2.png')"
            }}
        >

            {/* Hojas Colgantes (Invertidas, más grandes y posicionadas orgánicamente en la esquina) */}
            <div className="absolute -top-2 left-0 w-[100%] max-w-[1020px] pointer-events-none z-10 hidden lg:block">
                <img
                    src="/assets/imgWeb/Banner_Tienda/Hojas_CATALOGO.png"
                    alt=""
                    className="w-full h-auto object-contain scale-x-[-1]"
                />
            </div>

            <div className="container mx-auto px-6 lg:px-12 relative z-20">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            Trending <span className="text-[#ffce07]">Top</span>
                        </h2>
                        <p className="text-white/90 mt-2 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                            Los más reclamados de la temporada.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('store')}
                        className="group relative px-7 py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider text-white border-[2.5px] border-[#3a2212] bg-gradient-to-b from-[#24b42b] via-[#1a9a21] to-[#0f5c14] shadow-[0_4px_0_#3a2212,0_6px_10px_rgba(0,0,0,0.4)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_5px_0_#3a2212,0_8px_12px_rgba(0,0,0,0.5)] active:translate-y-[3.5px] active:shadow-[0_0.5px_0_#3a2212,0_2px_4px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2.5 overflow-hidden"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((i, index) => {
                        const isEven = index % 2 === 0;
                        const frameImage = isEven
                            ? '/assets/imgWeb/Banner_Tienda/Producto_1.png'
                            : '/assets/imgWeb/Banner_Tienda/Producto_2.png';

                        // Estilos de recorte para reescalar la imagen de 1920x1080 
                        // de modo que el marco real ocupe exactamente las dimensiones del contenedor.
                        const imageStyle: React.CSSProperties = isEven
                            ? {
                                width: '391%',
                                height: '157%',
                                left: '-64.4%',
                                top: '-31.7%',
                                position: 'absolute',
                                objectFit: 'fill',
                            }
                            : {
                                width: '404%',
                                height: '154%',
                                left: '-170.5%',
                                top: '-28.7%',
                                position: 'absolute',
                                objectFit: 'fill',
                            };

                        return (
                            <div
                                key={i}
                                className="group relative w-full overflow-hidden drop-shadow-xl hover:drop-shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                                style={{ aspectRatio: '3 / 4.35' }}
                                onClick={() => navigate('product', i)}
                            >
                                {/* 1. Imagen del marco asimétrico (Fondo de borde de la tarjeta) */}
                                <div className="absolute inset-0 w-full h-full z-10 overflow-hidden pointer-events-none">
                                    <img
                                        src={frameImage}
                                        alt={`Tarjeta de Producto ${i}`}
                                        className="max-w-none"
                                        style={imageStyle}
                                    />
                                </div>

                                {/* 2. Contenedor de Contenido (Perfectamente alineado dentro del recorte del marco) */}
                                <div className="absolute inset-0 z-20 flex flex-col justify-between pt-[10%] pb-[12%] px-[12%]">

                                    {/* Sección Superior: Insignias, botón de favoritos e ícono del producto */}
                                    <div className="relative flex-1 flex flex-col min-h-0">

                                        {/* Botones superiores dentro del marco */}
                                        <div className={`flex justify-end items-start w-full z-30 pt-5 px-1 ${isEven ? 'pr-4' : 'pr-1'}`}>
                                            {/* Botón Corazón - Rombo de Madera Tallada (Elegante y Profesional) */}
                                            <button
                                                className="relative group/heart w-9 h-9 rounded-xl border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_3px_0_#3a2212,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center rotate-[-4deg] hover:rotate-0 hover:scale-105 hover:shadow-[0_4px_0_#3a2212,0_5px_8px_rgba(0,0,0,0.2)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#3a2212,0_2px_4px_rgba(0,0,0,0.1)] transition-all z-30 overflow-hidden"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    showToast('Añadido a favoritos', 'success');
                                                }}
                                                title="Añadir a favoritos"
                                            >
                                                {/* Reflejo superior suave */}
                                                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-xl"></div>
                                                
                                                {/* Toque de musgo muy sutil y limpio en la esquina inferior */}
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#1a9a21] opacity-35 blur-[1.5px] rounded-full pointer-events-none"></div>

                                                <Heart className="relative z-10 w-4.5 h-4.5 text-[#3a2212] stroke-[2.5] fill-transparent group-hover/heart:fill-[#1a9a21] group-hover/heart:text-[#1a9a21] transition-colors duration-300" />
                                            </button>
                                        </div>

                                        {/* Ícono de Producto (Centrado en la parte superior sin chocar con el texto) */}
                                        <div className="flex-1 flex items-center justify-center min-h-0 group-hover:scale-110 transition-transform duration-500 pb-2">
                                            <Package className="w-20 h-20 text-[#1a9a21]/15" />
                                        </div>

                                    </div>

                                    {/* Sección Inferior: Información del Producto (Alineada verticalmente al centro con el botón) */}
                                    <div
                                        className="flex items-center justify-between relative z-30 px-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Bloque de texto alineado y con contorno blanco grueso de 1.5px */}
                                        <div
                                            className="space-y-0.5"
                                            style={{
                                                textShadow: '1.5px 1.5px 0px #fff, -1.5px -1.5px 0px #fff, 1.5px -1.5px 0px #fff, -1.5px 1.5px 0px #fff, 0 2px 4px rgba(255,255,255,0.7)'
                                            }}
                                        >
                                            <h3 className="font-extrabold text-slate-950 text-xs md:text-sm leading-tight">
                                                Playera Élite v.{i}
                                            </h3>
                                            <p className="text-[#0f5c14] text-[9px] font-black uppercase tracking-wider">
                                                Edición Especial
                                            </p>
                                            <div className="text-sm md:text-base font-black text-slate-950 leading-none mt-0.5">
                                                $450
                                            </div>
                                        </div>

                                        {/* Botón Agregar a puro código - Estilo Madera Clara (Solo Ícono) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCartTotal(prev => prev + 450);
                                                showToast('Agregado al carrito', 'success');
                                            }}
                                            title="Agregar al carrito"
                                            className="relative group flex items-center justify-center w-10 h-10 mr-3 overflow-hidden rounded-full border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_3px_0_#3a2212,0_4px_6px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#3a2212,0_5px_8px_rgba(0,0,0,0.3)] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_0px_0_#3a2212,0_1px_2px_rgba(0,0,0,0.2)]"
                                        >
                                            {/* Reflejo superior suave */}
                                            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-full"></div>

                                            <ShoppingCart className="relative z-10 w-5 h-5 text-[#3a2212] stroke-[2.5] -ml-0.5" />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
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
