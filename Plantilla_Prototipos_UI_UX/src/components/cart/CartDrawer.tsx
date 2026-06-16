import React from 'react';
import { ShoppingCart, X, Truck, CheckCircle2, Package, MapPin } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

interface CartDrawerProps {
    isOpen: boolean;
    close: () => void;
    total: number;
    showToast: (msg: string, type?: string) => void;
    requireAddress: () => void;
    isLoggedIn: boolean;
    openAuth: () => void;
    navigate: (view: string, payload?: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    close,
    total,
    showToast,
    requireAddress,
    isLoggedIn,
    openAuth,
    navigate
}) => {
    // Componente DUMB puro: Extrae TODO su estado del Hook useCart
    const {
        zipCode,
        handleCpChange,
        subtotal,
        iva,
        missingForFree,
        hasFreeShipping,
        shippingType,
        shippingCost,
        finalTotal,
        THRESHOLD_FREE_SHIPPING
    } = useCart(total);

    const handleCheckout = () => {
        if (!isLoggedIn) {
            close(); 
            openAuth(); 
            showToast('Inicia sesión para pagar', 'warning'); 
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
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] transition-opacity" 
                    onClick={close}
                ></div>
            )}
            
            {/* Drawer Container con Transiciones Tailwind Puras */}
            <div 
                className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0b1121] border-l border-slate-800 z-[70] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> Tu Carrito
                    </h2>
                    <button onClick={close} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {subtotal === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <ShoppingCart className="w-16 h-16 opacity-20 mb-2" />
                            <p className="font-medium text-lg text-slate-400">Tu carrito está vacío</p>
                            <button 
                                onClick={() => { close(); navigate('store'); }} 
                                className="mt-4 border border-slate-700 px-8 py-3 rounded-full font-bold hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all shadow-md"
                            >
                                Ir al Catálogo
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Panel de Umbral de Envío Gratis [REQ-FE-13] */}
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-inner">
                                {!hasFreeShipping ? (
                                    <>
                                        <p className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                                            <span>Faltan <span className="text-[#03bbd3]">${missingForFree.toFixed(2)}</span> para envío gratis</span>
                                            <Truck className="w-4 h-4 text-slate-500" />
                                        </p>
                                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#03bbd3] to-[#96c93e] transition-all duration-500 ease-out" 
                                                style={{ width: `${Math.min(100, (subtotal / THRESHOLD_FREE_SHIPPING) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs font-bold text-[#96c93e] flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> ¡Felicidades! Tienes envío gratis.
                                    </p>
                                )}
                            </div>

                            {/* Lista de Productos (Hardcoded Placeholder Mantenido según requerimiento) */}
                            <div className="space-y-4">
                                <div className="flex gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group">
                                    <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                                        <Package className="text-slate-600 group-hover:text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white group-hover:text-[#03bbd3] transition-colors">Playera Élite</h4>
                                        <p className="text-xs text-slate-500">Talla M - Rojo</p>
                                        <p className="text-[#96c93e] font-black mt-2">$450.00</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lógica Postal Dinámica (Consumiendo Hook Puro) [REQ-FE-13] */}
                            <div className="border-t border-slate-800 pt-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Código Postal de Envío</label>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        value={zipCode} 
                                        onChange={(e) => handleCpChange(e.target.value)} 
                                        maxLength={5} 
                                        type="text" 
                                        placeholder="Ej. 97000" 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-[#03bbd3] focus:ring-1 focus:ring-[#03bbd3] transition-all text-sm font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal" 
                                    />
                                </div>
                                
                                {/* Alertas de Tipo de Envío dictadas por el Hook */}
                                {shippingType === 'LOCAL' && (
                                    <div className="bg-[#96c93e]/10 border border-[#96c93e]/30 p-3 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                                        <MapPin className="w-5 h-5 text-[#96c93e] shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-[#96c93e]">Envío Local: Llega hoy mismo</p>
                                            <p className="text-[10px] text-[#96c93e]/70 mt-0.5">Tarifa reducida asignada a zona de cobertura.</p>
                                        </div>
                                    </div>
                                )}
                                {shippingType === 'EXTERNAL_COURIER' && (
                                    <div className="bg-[#03bbd3]/10 border border-[#03bbd3]/30 p-3 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
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

                {/* Footer Financiero y CTA */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-slate-400 font-medium">
                            <span>Subtotal</span>
                            <span className="text-white">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400 font-medium">
                            <span>IVA (16%)</span>
                            <span className="text-white">${iva.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400 font-medium">
                            <span>Costo de Envío</span>
                            <span className={shippingCost === 0 && subtotal > 0 ? 'text-[#96c93e] font-black uppercase tracking-wider' : 'text-white'}>
                                {subtotal === 0 ? '$0.00' : shippingCost === 0 ? '¡GRATIS!' : `$${shippingCost.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-white pt-4 border-t border-slate-800">
                            <span>Total Neto</span>
                            <span className="text-[#03bbd3]">${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {subtotal > 0 && (
                        <label className="flex items-start gap-3 mt-4 mb-6 cursor-pointer group">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input type="checkbox" required className="peer appearance-none w-4 h-4 border-2 border-slate-600 rounded bg-slate-900 checked:bg-[#96c93e] checked:border-[#96c93e] transition-colors cursor-pointer" />
                                <CheckCircle2 className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100" />
                            </div>
                            <span className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-tight transition-colors">
                                He leído y acepto expresamente las <span className="text-[#03bbd3] underline decoration-[#03bbd3]/30 hover:decoration-[#03bbd3]">Políticas de Reembolso y Tiempos de Envío</span> comerciales.
                            </span>
                        </label>
                    )}

                    <button 
                        disabled={subtotal === 0} 
                        onClick={handleCheckout} 
                        className="w-full bg-gradient-to-r from-[#03bbd3] to-[#02a8be] hover:from-[#02a8be] hover:to-[#0295a8] disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none text-white font-bold py-4 rounded-xl shadow-[0_10px_20px_rgba(3,187,211,0.2)] hover:shadow-[0_15px_30px_rgba(3,187,211,0.3)] hover:-translate-y-0.5 transition-all duration-200 uppercase tracking-wide text-sm"
                    >
                        Proceder al Pago Seguro
                    </button>
                </div>
            </div>
        </>
    );
};
