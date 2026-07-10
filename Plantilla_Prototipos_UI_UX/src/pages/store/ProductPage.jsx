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
import { useProductDetail } from '../../api/products';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { addToWishlist } from '../../api/profile';

export const ProductView = ({ productId, navigate, showToast }) => {
    // [Fase 41] Detalle REAL: GET /api/products/:id → { product, variants[] }.
    // Cada variante trae su stock actual. Mientras carga, se renderiza solo el
    // encabezado con el botón de retorno (carga graciosa, sin romper la maqueta).
    const { data: detail } = useProductDetail(productId);
    const product = detail?.product;
    const variants = detail?.variants ?? [];

    // Tallas únicas (variantes sin talla — p.ej. accesorios — se muestran como "Única").
    const sizes = useMemo(() => {
        const seen = new Set();
        return variants
            .map(v => ({ ...v, sizeLabel: v.size ?? 'Única' }))
            .filter(v => (seen.has(v.sizeLabel) ? false : seen.add(v.sizeLabel)));
    }, [variants]);

    const [selectedSize, setSelectedSize] = useState(null);
    // Al llegar las variantes, preseleccionar la primera talla CON stock.
    useEffect(() => {
        if (sizes.length && !selectedSize) {
            const firstAvailable = sizes.find(v => v.stock > 0) ?? sizes[0];
            setSelectedSize(firstAvailable.sizeLabel);
        }
    }, [sizes, selectedSize]);

    const selectedVariant = sizes.find(v => v.sizeLabel === selectedSize) ?? null;

    const addItem = useCartStore((s) => s.addItem);
    const isLoggedIn = useAuthStore((s) => !!s.user);

    // [Fase 44] Corazón del PDP → POST /api/profile/wishlist (REQ-FE-19)
    const handleFavorite = async () => {
        if (!isLoggedIn) {
            showToast('Inicia sesión para guardar favoritos', 'warning');
            return;
        }
        try {
            await addToWishlist(product.id);
            showToast('Añadido a favoritos', 'success');
        } catch (error) {
            showToast(error?.response?.data?.message || 'No se pudo agregar a favoritos.', 'error');
        }
    };

    const addToCart = () => {
        if (!selectedVariant) {
            showToast('Este producto no tiene variantes disponibles.', 'error');
            return;
        }
        if (selectedVariant.stock <= 0) {
            showToast('Talla agotada. Elige otra disponible.', 'error');
            return;
        }
        // Fase 42: carrito REAL — si la variante ya existe, el cartStore
        // incrementa la cantidad (no duplica la línea).
        addItem({
            variantId: selectedVariant.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            size: selectedVariant.size,
            sku: selectedVariant.sku,
        });
        showToast('Agregado con éxito', 'success');
    };

    return (
        <div className="container mx-auto px-6 lg:px-12 pb-20">
            <button onClick={() => navigate('store')} className="flex items-center gap-2 text-slate-500 hover:text-[#03bbd3] font-bold text-sm mb-12 transition-colors group">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Volver al catálogo
            </button>

            {product && (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Product Images */}
                <div className="space-y-6">
                    <div className="aspect-square bg-white border border-slate-100 rounded-[3rem] shadow-premium flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50"></div>
                        {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover z-10" />
                            : <Package className="w-48 h-48 text-slate-200 group-hover:scale-110 transition-transform duration-700 z-10" />}
                        <button onClick={handleFavorite} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#ec1676] transition-all shadow-md z-20"><Heart className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-[#03bbd3] transition-all shadow-sm">
                                <ImageIcon className="w-6 h-6 text-slate-300" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#03bbd3]/10 text-[#03bbd3] text-[10px] font-bold px-2 py-1 rounded-full border border-[#03bbd3]/20">{product.categoryName}</span>
                            <div className="flex items-center gap-1 text-[#ffce07]">
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-slate-400 text-[10px] ml-1">(120 reseñas)</span>
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">{product.name}</h1>
                        <p className="text-slate-500 mt-6 leading-relaxed max-w-md">{product.description}</p>
                    </div>

                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Oficial</span>
                            <span className="text-3xl font-black text-slate-900">${Number(product.price).toFixed(2)} <span className="text-sm text-[#96c93e] ml-2">IVA Incluido</span></span>
                        </div>
                        {product.hasVirtualReward && (
                        <>
                        <div className="h-10 w-px bg-slate-200"></div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#502c84] flex items-center gap-1 uppercase tracking-tighter"><Zap className="w-3 h-3" /> Recompensas</span>
                            <span className="text-sm font-black text-slate-600">Skin del juego incluida</span>
                        </div>
                        </>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Seleccionar Talla{selectedVariant ? ` · ${selectedVariant.stock > 0 ? `${selectedVariant.stock} disponibles` : 'Agotada'}` : ''}</p>
                            <div className="flex gap-3">
                                {sizes.map(v => (
                                    <button
                                        key={v.sizeLabel}
                                        onClick={() => setSelectedSize(v.sizeLabel)}
                                        title={v.stock > 0 ? `Stock: ${v.stock}` : 'Agotada'}
                                        className={`w-14 h-14 rounded-2xl border-2 font-black transition-all flex items-center justify-center ${v.sizeLabel === selectedSize ? 'border-[#03bbd3] bg-[#03bbd3] text-white shadow-lg shadow-[#03bbd3]/20' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-900'} ${v.stock <= 0 ? 'opacity-40' : ''}`}
                                    >{v.sizeLabel}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={addToCart} className="flex-1 bg-[#03bbd3] hover:bg-[#02a8be] text-white font-black py-4 rounded-2xl shadow-brand transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Agregar al Carrito
                        </button>
                        <button className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#ec1676] hover:border-[#ec1676]/20 transition-all shadow-sm"><Share2 className="w-6 h-6" /></button>
                    </div>

                    <div className="pt-8 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white border border-slate-100 p-4 rounded-2xl shadow-premium"><ShieldCheck className="w-5 h-5 text-[#96c93e]" /> Garantía de Calidad</div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white border border-slate-100 p-4 rounded-2xl shadow-premium"><Zap className="w-5 h-5 text-[#ffce07]" /> Envío Express</div>
                    </div>
                </div>
            </div>

            {/* Tabs for Info */}
            <div className="mt-24">
                <div className="flex gap-12 border-b border-slate-200 mb-12">
                    {['Descripción', 'Especificaciones', 'Reseñas', 'Skins Asociadas'].map((tab, i) => (
                        <button key={tab} className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${i === 0 ? 'text-[#03bbd3]' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab}
                            {i === 0 && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#03bbd3] rounded-t-full"></div>}
                        </button>
                    ))}
                </div>
                <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-premium">
                    <p className="text-slate-500 leading-relaxed text-lg italic">{product.description || '"Esta prenda no solo es una declaración de estilo, es la llave a un mundo donde lo físico y lo digital colisionan."'}</p>
                </div>
            </div>
            </>
            )}
        </div>
    );
};
