import React, { useState } from 'react';
import { ShoppingCart, X, Truck, CheckCircle2, Package, MapPin, Trash2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useCartStore } from '../../store/cartStore';

interface CartDrawerProps {
    isOpen: boolean;
    close: () => void;
    showToast: (msg: string, type?: string) => void;
    requireAddress: () => void;
    isLoggedIn: boolean;
    openAuth: () => void;
    navigate: (view: string, payload?: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    close,
    showToast,
    requireAddress,
    isLoggedIn,
    openAuth,
    navigate
}) => {
    // Componente DUMB puro: Extrae TODO su estado del Hook useCart (Fase 42:
    // items reales del cartStore + umbral de envío dinámico por Tier).
    const {
        items,
        zipCode,
        handleCpChange,
        subtotal,
        iva,
        missingForFree,
        hasFreeShipping,
        shippingType,
        shippingCost,
        finalTotal,
        THRESHOLD_FREE_SHIPPING,
        tier,
        tierMultiplier
    } = useCart();

    const removeItem = useCartStore((s: any) => s.removeItem);
    const syncWithServer = useCartStore((s: any) => s.syncWithServer);
    
    // Check legal OBLIGATORIO (REQ-FE-14): sin aceptarlo no se procede al pago.
    const [legalAccepted, setLegalAccepted] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    React.useEffect(() => {
        if (isOpen && items.length > 0) {
            setIsValidating(true);
            import('../../api/checkout').then(({ validateCart }) => {
                validateCart(items).then((results) => {
                    const store = useCartStore.getState();
                    const stateBefore = store.items;
                    store.syncWithServer(results);
                    const stateAfter = useCartStore.getState().items;
                    
                    if (JSON.stringify(stateBefore) !== JSON.stringify(stateAfter)) {
                        showToast('Algunos productos se han agotado y han sido removidos o ajustados.', 'warning');
                    }
                    setIsValidating(false);
                }).catch(() => {
                    setIsValidating(false);
                });
            });
        }
    }, [isOpen]);

    const handleCheckout = () => {
        if (!isLoggedIn) {
            close();
            openAuth();
            showToast('Inicia sesión para pagar', 'warning');
            return;
        }
        if (!legalAccepted) {
            showToast('Debes aceptar las Políticas de Reembolso y Envío.', 'error');
            return;
        }
        close();
        requireAddress();
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity"
                    onClick={close}
                ></div>
            )}

            {/* Drawer Container - Estilo Selvático Profundo */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0a2e0d] border-l border-[#1a9a21]/30 z-[70] transform transition-transform duration-300 ease-in-out flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.8)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* ════ CABECERA (Madera) ════ */}
                <div className="p-4 sm:p-6 border-b-4 border-[#3a2212] flex justify-between items-center bg-gradient-to-b from-[#e6c59e] via-[#d4ad82] to-[#b88d5e] relative shadow-[0_4px_15px_rgba(0,0,0,0.5)] z-20">
                    <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
                    <h2 className="font-bungee text-lg text-[#3a2212] flex items-center gap-2 relative z-10" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                        <ShoppingCart className="w-6 h-6 drop-shadow-sm" /> Tu Carrito
                    </h2>
                    <button onClick={close} aria-label="Cerrar carrito" className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl text-[#3a2212]/60 hover:bg-white/20 hover:text-[#3a2212] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#1a9a21]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {subtotal === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#e6c59e]/50 space-y-4">
                            <ShoppingCart className="w-16 h-16 opacity-30 mb-2 drop-shadow-md" />
                            <p className="font-medium text-lg text-[#e6c59e]">Tu carrito está vacío</p>
                            <button
                                onClick={() => { close(); navigate('store'); }}
                                className="mt-4 border-2 border-[#1a9a21]/50 text-[#e6c59e] px-8 py-3 rounded-2xl font-bold hover:bg-[#1a9a21]/20 hover:border-[#1a9a21] hover:text-white transition-all shadow-md"
                            >
                                Explorar el Catálogo
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Panel de Umbral de Envío Gratis DINÁMICO POR TIER [REQ-FE-13 + M-17] */}
                            <div className="bg-[#061f09] p-4 rounded-xl border border-[#1a9a21]/30 shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                {!hasFreeShipping ? (
                                    <>
                                        <p className="text-xs font-bold text-[#e6c59e] mb-3 flex items-center justify-between">
                                            <span>Faltan <span className="text-[#03bbd3]">${missingForFree.toFixed(2)}</span> para envío gratis</span>
                                            <Truck className="w-4 h-4 text-[#96c93e]" />
                                        </p>
                                        <div className="w-full h-2 bg-[#0a2e0d] rounded-full overflow-hidden shadow-inner border border-[#1a9a21]/30">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#03bbd3] to-[#96c93e] transition-all duration-500 ease-out"
                                                style={{ width: `${Math.min(100, (subtotal / THRESHOLD_FREE_SHIPPING) * 100)}%` }}
                                            ></div>
                                        </div>
                                        {tierMultiplier < 1 && (
                                            <p className="text-[10px] text-[#ffce07] mt-2 font-bold drop-shadow-md">Beneficio {tier}: tu umbral bajó a ${THRESHOLD_FREE_SHIPPING.toFixed(2)}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-xs font-bold text-[#96c93e] flex items-center gap-2 drop-shadow-md">
                                        <CheckCircle2 className="w-4 h-4" /> ¡Felicidades! Tienes envío gratis.
                                    </p>
                                )}
                            </div>

                            {/* Lista de Productos REAL (cartStore, Fase 42) */}
                            <div className="space-y-4">
                                {items.map((item: any) => (
                                    <div key={item.variantId} className="flex gap-4 bg-[#061f09] p-3 rounded-xl border border-[#1a9a21]/20 hover:border-[#1a9a21]/50 transition-colors group shadow-md">
                                        <div className="w-20 h-20 bg-[#0a2e0d] rounded-lg border border-[#1a9a21]/10 flex items-center justify-center group-hover:bg-[#1a9a21]/20 transition-colors">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <Package className="text-[#1a9a21]/60 group-hover:text-[#96c93e]" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-[#e6c59e] group-hover:text-[#ffce07] transition-colors">{item.name}</h4>
                                            <p className="text-xs text-[#e6c59e]/60">Talla {item.size ?? 'Única'} · x{item.quantity}</p>
                                            <p className="text-[#96c93e] font-black mt-2">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                        <button
                                            onClick={() => { removeItem(item.variantId); showToast('Producto eliminado del carrito', 'warning'); }}
                                            title="Eliminar del carrito"
                                            className="text-[#e6c59e]/40 hover:text-[#ec1676] transition-colors self-start bg-[#0a2e0d] p-1.5 rounded-lg border border-transparent hover:border-[#ec1676]/30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Lógica Postal Dinámica (Consumiendo Hook Puro) [REQ-FE-13] */}
                            <div className="border-t border-[#1a9a21]/20 pt-6">
                                <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Código Postal de Envío</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        value={zipCode}
                                        onChange={(e) => handleCpChange(e.target.value)}
                                        maxLength={5}
                                        type="text"
                                        placeholder="Ej. 97000"
                                        className="w-full bg-[#061f09] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-[#e6c59e] outline-none focus:border-[#03bbd3] focus:ring-1 focus:ring-[#03bbd3]/50 transition-all text-sm font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal placeholder:text-[#e6c59e]/30 shadow-inner"
                                    />
                                </div>

                                {/* Alertas de Tipo de Envío dictadas por el Hook */}
                                {shippingType === 'LOCAL' && (
                                    <div className="bg-[#96c93e]/10 border border-[#96c93e]/30 p-3 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                        <MapPin className="w-5 h-5 text-[#96c93e] shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-[#96c93e]">Envío Local: Llega hoy mismo</p>
                                            <p className="text-[10px] text-[#96c93e]/70 mt-0.5">Tarifa reducida asignada a zona de cobertura.</p>
                                        </div>
                                    </div>
                                )}
                                {shippingType === 'EXTERNAL_COURIER' && (
                                    <div className="bg-[#03bbd3]/10 border border-[#03bbd3]/30 p-3 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                        <Truck className="w-5 h-5 text-[#03bbd3] shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-[#03bbd3]">Envío Foráneo por Paquetería</p>
                                            <p className="text-[10px] text-[#03bbd3]/70 mt-0.5">Llega de 3 a 5 días hábiles a todo el país.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ════ FOOTER FINANCIERO ════ */}
                <div className="p-4 sm:p-6 border-t-2 border-[#1a9a21]/20 bg-[#061f09] shadow-[0_-4px_15px_rgba(0,0,0,0.3)] z-10">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-[#e6c59e]/80 font-medium">
                            <span>Subtotal</span>
                            <span className="text-[#e6c59e]">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-[#e6c59e]/80 font-medium">
                            <span>IVA incluido (16%)</span>
                            <span className="text-[#e6c59e]">${iva.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-[#e6c59e]/80 font-medium">
                            <span>Costo de Envío</span>
                            <span className={shippingCost === 0 && subtotal > 0 ? 'text-[#96c93e] font-black uppercase tracking-wider drop-shadow-md' : 'text-[#e6c59e]'}>
                                {subtotal === 0 ? '$0.00' : shippingCost === 0 ? '¡GRATIS!' : `$${shippingCost.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-[#e6c59e] pt-4 border-t border-[#1a9a21]/20">
                            <span>Total Neto</span>
                            <span className="text-[#03bbd3] drop-shadow-sm">${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {subtotal > 0 && (
                        <label className="flex items-start gap-3 mt-4 mb-6 cursor-pointer group">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input type="checkbox" checked={legalAccepted} onChange={(e) => setLegalAccepted(e.target.checked)} required className="peer appearance-none w-4 h-4 border-2 border-[#1a9a21]/50 rounded bg-[#0a2e0d] checked:bg-[#96c93e] checked:border-[#96c93e] transition-colors cursor-pointer shadow-inner" />
                                <CheckCircle2 className="w-3 h-3 text-[#0a2e0d] absolute pointer-events-none opacity-0 peer-checked:opacity-100" />
                            </div>
                            <span className="text-[11px] text-[#e6c59e]/60 group-hover:text-[#e6c59e] leading-tight transition-colors">
                                He leído y acepto expresamente las <span className="text-[#03bbd3] underline decoration-[#03bbd3]/30 hover:decoration-[#03bbd3]">Políticas de Reembolso y Tiempos de Envío</span> comerciales.
                            </span>
                        </label>
                    )}

                    <button
                        disabled={subtotal === 0 || !legalAccepted || isValidating}
                        onClick={handleCheckout}
                        className="w-full bg-gradient-to-r from-[#03bbd3] to-[#02a8be] hover:from-[#02a8be] hover:to-[#0295a8] disabled:from-[#0a2e0d] disabled:to-[#061f09] disabled:text-[#e6c59e]/30 disabled:border-[#1a9a21]/20 disabled:border disabled:shadow-none text-white font-bungee py-5 rounded-xl shadow-[0_10px_20px_rgba(3,187,211,0.2)] hover:shadow-[0_15px_30px_rgba(3,187,211,0.3)] hover:-translate-y-0.5 transition-all duration-200 uppercase tracking-wide text-xs border border-transparent"
                    >
                        {isValidating ? 'Validando Stock...' : 'Proceder al Pago Seguro'}
                    </button>
                </div>
            </div>
        </>
    );
};
