import React, { useState } from 'react';
import { Check, Heart, Loader2, ShoppingCart, Package } from 'lucide-react';
import { quickAdd } from '../../lib/quickAdd';
import { useWishlistToggle } from '../../hooks/useWishlistToggle';

/**
 * CatalogProductCard — Réplica exacta de la tarjeta del TrendingTop.
 *
 * Mismos marcos asimétricos de madera (Producto_1.png / Producto_2.png),
 * misma ventana de producto, botón corazón tallado, botón carrito madera,
 * tipografía con contorno blanco grueso.
 *
 * Props:
 *  - product:   { id, name, price, imageUrl, categoryName, hasVirtualReward }
 *  - index:     Posición en la grilla (determina frame par/impar)
 *  - navigate:  (view, id?) => void
 *  - showToast: (msg, type) => void
 */
export const CatalogProductCard = ({ product, index, navigate, showToast, setIsProcessing = undefined, isTrending = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [wasAdded, setWasAdded] = useState(false);
    const wishlist = useWishlistToggle(showToast);
    const favorite = wishlist.isFavorite(product.id);
    const isEven = index % 2 === 0;
    const frameImage = isEven
        ? '/assets/imgWeb/Banner_Tienda/Producto_1.png'
        : '/assets/imgWeb/Banner_Tienda/Producto_2.png';

    // Estilos de recorte para reescalar la imagen de 1920x1080
    // de modo que el marco real ocupe exactamente las dimensiones del contenedor.
    const imageStyle = isEven
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

    // Cada PNG de madera tiene una ventana interior distinta.
    const productWindowStyle = isEven
        ? { top: '12%', right: '10%', bottom: '25.5%', left: '12%' }
        : { top: '13%', right: '8%', bottom: '25%', left: '10%' };

    // Stagger animation delay basado en posición
    const animDelay = `${index * 80}ms`;

    return (
        <div
            className="group relative w-full overflow-hidden drop-shadow-xl hover:drop-shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer"
            style={{
                aspectRatio: '3 / 4.35',
                animation: `bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                animationDelay: animDelay,
            }}
            onClick={() => navigate('product', product.id)}
        >
            {/* 0. Fondo blanco y Producto (Detrás de la madera) */}
            <div
                className="absolute z-0 pointer-events-none overflow-hidden bg-white"
                style={productWindowStyle}
            >
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="block w-full h-full max-w-full max-h-full object-contain object-center p-[4%] group-hover:scale-[1.02] transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center shadow-inner">
                        <Package className="w-20 h-20 text-[#1a9a21]/15" />
                    </div>
                )}
            </div>

            {/* 1. Imagen del marco asimétrico (Fondo de borde de la tarjeta) */}
            <div className="absolute inset-0 w-full h-full z-10 overflow-hidden pointer-events-none">
                <img
                    src={frameImage}
                    alt={product.name}
                    className="max-w-none"
                    style={imageStyle}
                />
            </div>

            {/* 2. Contenedor de Contenido (Perfectamente alineado dentro del recorte del marco) */}
            <div className={`absolute inset-0 z-20 flex flex-col justify-between pt-[9%] px-[10%] sm:px-[12%] ${isTrending ? 'pb-[11%]' : 'pb-[16%]'}`}>

                {/* Sección Superior: botón de favoritos */}
                <div className="relative flex-1 flex flex-col min-h-0">
                    <div className={`flex justify-end items-start w-full z-30 pt-3 md:pt-5 px-0.5 ${isEven ? 'pr-2 md:pr-4' : 'pr-1'}`}>
                        {/* Botón Corazón - Rombo de Madera Tallada */}
                        <button
                            className="relative group/heart w-8 h-8 md:w-11 md:h-11 min-w-[32px] min-h-[32px] md:min-w-[44px] md:min-h-[44px] aspect-square flex-none rounded-lg md:rounded-xl border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_2px_0_#3a2212,0_3px_5px_rgba(0,0,0,0.15)] md:shadow-[0_3px_0_#3a2212,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center rotate-[-4deg] hover:rotate-0 hover:scale-105 transition-all z-30 overflow-hidden"
                            onClick={(e) => {
                                e.stopPropagation();
                                wishlist.toggle(product);
                            }}
                            title="Añadir a favoritos"
                        >
                            {/* Reflejo superior suave */}
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-lg md:rounded-t-xl"></div>
                            {/* Toque de musgo */}
                            <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-[#1a9a21] opacity-35 blur-[1px] md:blur-[1.5px] rounded-full pointer-events-none"></div>
                            <Heart className={`relative z-10 w-3.5 h-3.5 md:w-4.5 md:h-4.5 stroke-[2.5] transition-colors duration-300 ${favorite ? 'fill-[#ec1676] text-[#ec1676]' : 'text-[#3a2212] fill-transparent group-hover/heart:fill-[#1a9a21] group-hover/heart:text-[#1a9a21]'}`} />
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 pointer-events-none"></div>
                </div>

                {/* Sección Inferior: Información del Producto */}
                <div
                    className="flex items-center justify-between relative z-30 px-0.5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Bloque de texto con contorno blanco grueso de 1.5px */}
                    <div
                        className="space-y-0.5 ml-2 md:ml-5 flex-1 min-w-0 pr-0.5"
                        style={{
                            textShadow: '1.5px 1.5px 0px #fff, -1.5px -1.5px 0px #fff, 1.5px -1.5px 0px #fff, -1.5px 1.5px 0px #fff, 0 2px 4px rgba(255,255,255,0.7)'
                        }}
                    >
                        <h3 className="font-extrabold text-slate-950 text-[10px] md:text-sm leading-tight line-clamp-2 break-words">
                            {product.name}
                        </h3>
                        <div className="text-xs md:text-base font-black text-slate-950 leading-none mt-0.5">
                            ${product.price}
                        </div>
                    </div>

                    {/* Botón Agregar — Estilo Madera Clara (Solo Ícono) */}
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (setIsProcessing) setIsProcessing(true);
                            setIsAdding(true);
                            const added = await quickAdd(product.id, showToast);
                            setWasAdded(added);
                            if (added) setTimeout(() => setWasAdded(false), 1400);
                            setIsAdding(false);
                            if (setIsProcessing) setIsProcessing(false);
                        }}
                        title="Agregar al carrito"
                        className="relative group flex-none items-center justify-center w-8 h-8 md:w-11 md:h-11 min-w-[32px] min-h-[32px] md:min-w-[44px] md:min-h-[44px] aspect-square flex mr-1 sm:mr-3 overflow-hidden rounded-full border-[1.5px] border-[#3a2212] bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] shadow-[0_2px_0_#3a2212,0_3px_5px_rgba(0,0,0,0.2)] md:shadow-[0_3px_0_#3a2212,0_4px_6px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-[2px]"
                    >
                        {/* Reflejo superior suave */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-full"></div>
                        {isAdding ? <Loader2 className="relative z-10 w-3.5 h-3.5 md:w-5 md:h-5 text-[#3a2212] animate-spin" /> : wasAdded ? <Check className="relative z-10 w-3.5 h-3.5 md:w-5 md:h-5 text-[#0f5c14]" /> : <ShoppingCart className="relative z-10 w-3.5 h-3.5 md:w-5 md:h-5 text-[#3a2212] stroke-[2.5] -ml-0.5" />}
                    </button>
                </div>

            </div>
        </div>
    );
};
