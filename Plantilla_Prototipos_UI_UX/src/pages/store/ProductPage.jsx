import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft, CheckCircle2, ChevronRight, CreditCard, Heart, Loader2,
    Minus, Package, Plus, Share2, ShieldCheck, ShoppingCart, Star, Truck, Zap,
} from 'lucide-react';
import { useProductDetail } from '../../api/products';
import { useWishlistToggle } from '../../hooks/useWishlistToggle';
import { useCartStore } from '../../store/cartStore';

const money = (value) => Number(value ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
});

export const ProductView = ({ productId, navigate, showToast }) => {
    const { data: detail, isPending, isError } = useProductDetail(productId);
    const product = detail?.product;
    const variants = detail?.variants ?? [];

    const hasAnySize = variants.some((variant) => variant.size != null);
    const hasAnyColor = variants.some((variant) => variant.color != null);

    const sizes = useMemo(
        () => [...new Set(variants.filter((variant) => variant.size != null).map((variant) => variant.size))],
        [variants],
    );
    const colors = useMemo(
        () => [...new Set(variants.filter((variant) => variant.color != null).map((variant) => variant.color))],
        [variants],
    );
    const gallery = useMemo(
        () => [...new Set([product?.imageUrl, ...(product?.galleryUrls ?? [])].filter(Boolean))],
        [product?.imageUrl, product?.galleryUrls],
    );

    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        setActiveImage(product?.imageUrl ?? product?.galleryUrls?.[0] ?? null);
        setQuantity(1);
    }, [product?.id]);

    useEffect(() => {
        if (!sizes.length) {
            setSelectedSize(null);
            return;
        }
        const firstAvailable = sizes.find((size) => variants.some((variant) => (
            variant.size === size
            && (!hasAnyColor || selectedColor == null || variant.color === selectedColor)
            && variant.stock > 0
        )));
        if (!selectedSize || !sizes.includes(selectedSize)) setSelectedSize(firstAvailable ?? sizes[0]);
    }, [sizes, variants, hasAnyColor, selectedColor, selectedSize]);

    useEffect(() => {
        if (!colors.length) {
            setSelectedColor(null);
            return;
        }
        const firstAvailable = colors.find((color) => variants.some((variant) => (
            variant.color === color
            && (!hasAnySize || selectedSize == null || variant.size === selectedSize)
            && variant.stock > 0
        )));
        if (!selectedColor || !colors.includes(selectedColor)) setSelectedColor(firstAvailable ?? colors[0]);
    }, [colors, variants, hasAnySize, selectedSize, selectedColor]);

    const selectedVariant = useMemo(() => {
        if (!variants.length) return null;
        return variants.find((variant) => (
            (!hasAnySize || variant.size === selectedSize)
            && (!hasAnyColor || variant.color === selectedColor)
        )) ?? null;
    }, [variants, selectedSize, selectedColor, hasAnySize, hasAnyColor]);

    useEffect(() => {
        setQuantity((current) => Math.max(1, Math.min(current, selectedVariant?.stock || 1)));
    }, [selectedVariant?.id, selectedVariant?.stock]);

    const addItem = useCartStore((state) => state.addItem);
    const wishlist = useWishlistToggle(showToast);
    const isAvailable = (selectedVariant?.stock ?? 0) > 0;

    /* const handleFavoriteLegacy = async () => {
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
    }; */
    const handleFavorite = () => wishlist.toggle(product);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: product.name, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                showToast('Enlace copiado', 'success');
            }
        } catch (error) {
            if (error?.name !== 'AbortError') showToast('No se pudo compartir el producto.', 'error');
        }
    };

    const addToCart = () => {
        if (!selectedVariant) {
            showToast('Selecciona una combinación disponible.', 'error');
            return;
        }
        if (!isAvailable) {
            showToast('Esta variante está agotada. Elige otra disponible.', 'error');
            return;
        }
        addItem({
            variantId: selectedVariant.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: activeImage || product.imageUrl,
            quantity,
            size: selectedVariant.size,
            color: selectedVariant.color,
            sku: selectedVariant.sku,
        });
        showToast(`${quantity} ${quantity === 1 ? 'producto agregado' : 'productos agregados'} al carrito`, 'success');
    };

    return (
        <main className="min-h-screen bg-[#061f09] text-[#e6c59e]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pb-24 pt-8">
                <button
                    onClick={() => navigate('store')}
                    className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-[#1a9a21]/20 bg-[#0a2e0d]/70 px-4 py-2.5 text-sm font-bold text-[#e6c59e]/70 transition-all hover:border-[#03bbd3]/40 hover:bg-[#1a9a21]/20 hover:text-[#03bbd3] group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Retroceder
                </button>

                {isPending && (
                    <div className="flex min-h-[55vh] items-center justify-center rounded-[2rem] border border-[#1a9a21]/20 bg-[#0a2e0d]/50">
                        <Loader2 className="h-10 w-10 animate-spin text-[#03bbd3]" />
                    </div>
                )}

                {isError && (
                    <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-[2rem] border border-[#ec1676]/30 bg-[#0a2e0d]/70 p-8 text-center">
                        <Package className="mb-4 h-14 w-14 text-[#ec1676]" />
                        <h1 className="font-bungee text-xl sm:text-2xl text-white leading-tight">No pudimos cargar este producto</h1>
                        <p className="mt-2 text-[#e6c59e]/70">Regresa al catálogo e inténtalo nuevamente.</p>
                    </div>
                )}

                {product && (
                    <>
                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] xl:gap-12">
                            <section aria-label="Galería del producto" className="min-w-0">
                                <div className="flex flex-col-reverse gap-4 sm:flex-row">
                                    {gallery.length > 1 && (
                                        <div className="grid grid-cols-4 gap-3 sm:flex sm:w-20 sm:flex-col">
                                            {gallery.map((url, index) => (
                                                <button
                                                    key={url}
                                                    type="button"
                                                    onClick={() => setActiveImage(url)}
                                                    aria-label={`Ver imagen ${index + 1}`}
                                                    aria-pressed={activeImage === url}
                                                    className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-[#0a2e0d] p-1 transition-all ${activeImage === url
                                                            ? 'border-[#03bbd3] shadow-[0_0_20px_rgba(3,187,211,0.25)]'
                                                            : 'border-[#1a9a21]/20 opacity-70 hover:border-[#03bbd3]/50 hover:opacity-100'
                                                        }`}
                                                >
                                                    <img src={url} alt="" className="h-full w-full rounded-xl object-contain" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="relative flex aspect-square min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[2rem] border border-[#1a9a21]/30 bg-gradient-to-br from-[#123d17] via-[#0a2e0d] to-[#061f09] shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:rounded-[2.5rem]">
                                        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(150,201,62,0.25),transparent_58%)]" />
                                        {activeImage ? (
                                            <img
                                                src={activeImage}
                                                alt={product.name}
                                                className="relative z-10 h-full w-full object-contain p-3 sm:p-6"
                                            />
                                        ) : (
                                            <Package className="relative z-10 h-36 w-36 text-[#e6c59e]/20" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleFavorite}
                                            aria-label="Agregar a favoritos"
                                            className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1a9a21]/30 bg-[#061f09]/80 text-[#e6c59e]/70 shadow-xl backdrop-blur-md transition-all hover:border-[#ec1676]/50 hover:text-[#ec1676]"
                                        >
                                            {wishlist.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={`h-5 w-5 ${wishlist.isFavorite(product.id) ? 'fill-[#ec1676] text-[#ec1676]' : ''}`} />}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <aside className="lg:sticky lg:top-24">
                                <div className="rounded-[2rem] border border-[#1a9a21]/30 bg-[#0a2e0d]/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-7">
                                    <div className="mb-5 flex flex-wrap items-center gap-2">
                                        {(product.categoryNames ?? []).map((category) => (
                                            <span key={category} className="rounded-full border border-[#03bbd3]/25 bg-[#03bbd3]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#03bbd3]">
                                                {category}
                                            </span>
                                        ))}
                                        <div className="flex items-center gap-1 text-[#ffce07]" aria-label="5 de 5 estrellas">
                                            {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="h-3.5 w-3.5 fill-current" />)}
                                            <span className="ml-1 text-[11px] font-bold text-[#e6c59e]/55">Producto verificado</span>
                                        </div>
                                    </div>

                                    <h1 className="font-bungee text-2xl leading-[1.18] text-white sm:text-3xl xl:text-4xl">{product.name}</h1>
                                    <p className="mt-4 line-clamp-3 leading-relaxed text-[#e6c59e]/70">{product.description}</p>

                                    <div className="my-6 border-y border-[#1a9a21]/20 py-5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e6c59e]/55">Precio oficial</p>
                                        <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
                                            <span className="font-bungee text-3xl leading-none tracking-tight text-[#e6c59e] sm:text-4xl xl:text-5xl">{money(product.price)}</span>
                                            <span className="pb-1 text-xs font-black uppercase tracking-widest text-[#96c93e]">IVA incluido</span>
                                        </div>
                                    </div>

                                    {product.hasVirtualReward && (
                                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#03bbd3]/25 bg-[#03bbd3]/10 p-4">
                                            <Zap className="h-6 w-6 shrink-0 text-[#03bbd3]" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#03bbd3]">Recompensa digital incluida</p>
                                                <p className="text-sm font-bold text-[#e6c59e]">Desbloquea contenido exclusivo dentro del juego.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-5">
                                        {hasAnyColor && (
                                            <fieldset>
                                                <legend className="mb-3 text-xs font-black uppercase tracking-widest text-[#e6c59e]/60">Color: <span className="text-[#03bbd3]">{selectedColor}</span></legend>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {colors.map((color) => {
                                                        const hasStock = variants.some((variant) => (
                                                            variant.color === color
                                                            && (!hasAnySize || variant.size === selectedSize)
                                                            && variant.stock > 0
                                                        ));
                                                        return (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => hasStock && setSelectedColor(color)}
                                                                disabled={!hasStock}
                                                                className={`min-h-11 rounded-2xl border px-4 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-35 ${color === selectedColor
                                                                        ? 'border-[#03bbd3] bg-[#03bbd3]/15 text-[#03bbd3]'
                                                                        : 'border-[#1a9a21]/30 bg-black/20 text-[#e6c59e]/70 hover:bg-[#1a9a21]/20'
                                                                    }`}
                                                            >
                                                                {color}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </fieldset>
                                        )}

                                        {hasAnySize && (
                                            <fieldset>
                                                <legend className="mb-3 text-xs font-black uppercase tracking-widest text-[#e6c59e]/60">Talla: <span className="text-[#03bbd3]">{selectedSize}</span></legend>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {sizes.map((size) => {
                                                        const hasStock = variants.some((variant) => (
                                                            variant.size === size
                                                            && (!hasAnyColor || variant.color === selectedColor)
                                                            && variant.stock > 0
                                                        ));
                                                        return (
                                                            <button
                                                                key={size}
                                                                type="button"
                                                                onClick={() => hasStock && setSelectedSize(size)}
                                                                disabled={!hasStock}
                                                                className={`flex h-12 min-w-12 items-center justify-center rounded-2xl border px-3 font-black transition-all disabled:cursor-not-allowed disabled:opacity-35 ${size === selectedSize
                                                                        ? 'border-[#03bbd3] bg-[#03bbd3] text-[#061f09] shadow-lg shadow-[#03bbd3]/20'
                                                                        : 'border-[#1a9a21]/30 bg-black/20 text-[#e6c59e]/70 hover:bg-[#1a9a21]/20'
                                                                    }`}
                                                            >
                                                                {size}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </fieldset>
                                        )}
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#e6c59e]/55">Disponibilidad</p>
                                            {selectedVariant && isAvailable ? (
                                                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-black text-[#96c93e]">
                                                    <CheckCircle2 className="h-4 w-4" /> {selectedVariant.stock} en stock
                                                </span>
                                            ) : (
                                                <span className="mt-1 inline-flex text-sm font-black text-[#ec1676]">Variante agotada</span>
                                            )}
                                        </div>
                                        <div className="flex items-center rounded-2xl border border-[#1a9a21]/30 bg-black/20 p-1">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                                                disabled={quantity <= 1}
                                                aria-label="Reducir cantidad"
                                                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#e6c59e] transition-colors hover:bg-[#1a9a21]/20 disabled:opacity-30"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-11 text-center text-sm font-black text-white" aria-live="polite">{quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity((current) => Math.min(selectedVariant?.stock || 1, current + 1))}
                                                disabled={!isAvailable || quantity >= selectedVariant.stock}
                                                aria-label="Aumentar cantidad"
                                                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#e6c59e] transition-colors hover:bg-[#1a9a21]/20 disabled:opacity-30"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={addToCart}
                                            disabled={!isAvailable}
                                            className="flex min-h-[4.5rem] flex-1 items-center justify-center gap-3 rounded-2xl bg-[#96c93e] px-5 py-5 font-bungee text-xs sm:text-sm leading-none text-[#061f09] shadow-[0_12px_30px_rgba(150,201,62,0.25)] transition-all hover:bg-[#85b237] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            <ShoppingCart className="h-6 w-6" />
                                            {isAvailable ? 'Agregar al carrito' : 'Agotado'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleShare}
                                            aria-label="Compartir producto"
                                            className="flex w-16 items-center justify-center rounded-2xl border border-[#1a9a21]/30 bg-black/20 text-[#e6c59e]/70 transition-all hover:border-[#03bbd3]/40 hover:text-[#03bbd3]"
                                        >
                                            <Share2 className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                        {[
                                            [ShieldCheck, 'Garantía', 'Compra protegida', '#96c93e'],
                                            [Truck, 'Envío', 'Entrega rastreable', '#03bbd3'],
                                            [CreditCard, 'Pago', '100% seguro', '#ffce07'],
                                        ].map(([Icon, title, copy, color]) => (
                                            <div key={title} className="flex items-center gap-2.5 rounded-2xl border border-[#1a9a21]/20 bg-black/20 p-3">
                                                <Icon className="h-5 w-5 shrink-0" style={{ color }} />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-[#e6c59e]">{title}</p>
                                                    <p className="text-[10px] text-[#e6c59e]/50">{copy}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <section className="mt-16 overflow-hidden rounded-[2rem] border border-[#1a9a21]/30 bg-[#0a2e0d]/70 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-md">
                            <div className="flex items-center gap-3 border-b border-[#1a9a21]/20 bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] px-6 py-5 text-[#061f09] sm:px-8">
                                <Package className="h-5 w-5" />
                                <h2 className="font-bungee text-xs sm:text-sm uppercase tracking-wide">Descripción del producto</h2>
                                <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                            </div>
                            <div className="p-6 sm:p-8 lg:p-10">
                                <p className="max-w-4xl whitespace-pre-wrap text-base leading-8 text-[#e6c59e]/75 sm:text-lg">
                                    {product.description || 'Este producto todavía no tiene una descripción ampliada.'}
                                </p>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
};
