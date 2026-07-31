import React from 'react';
import { Gamepad2, Clock } from 'lucide-react';


export const GameBridgeView = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in max-w-2xl mx-auto py-12">
            <div className="w-20 h-20 rounded-3xl bg-[#1a9a21]/20 border border-[#1a9a21]/40 flex items-center justify-center text-[#96c93e] shadow-[0_0_50px_rgba(150,201,62,0.15)] mb-2">
                <Gamepad2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
                <span className="bg-[#96c93e]/20 text-[#96c93e] text-xs font-black px-4 py-1.5 rounded-full border border-[#96c93e]/30 uppercase tracking-widest inline-block mb-3">
                    Integración NoSQL
                </span>
                <h1 className="font-bungee text-3xl md:text-4xl text-white leading-tight">
                    Game Bridge
                </h1>
                <p className="text-[#e6c59e]/70 mt-3 text-lg max-w-md mx-auto">
                    La consola de sincronización in-game estará disponible próximamente.
                </p>
            </div>

            <div className="bg-[#0a2e0d]/60 border border-[#1a9a21]/20 rounded-2xl p-6 text-[#e6c59e]/70 text-sm max-w-md w-full backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 text-[#e6c59e]/90 font-bold mb-2">
                    <Clock className="w-4 h-4 text-[#03bbd3]" /> Próximamente en v2.1
                </div>
                <p className="text-xs text-[#e6c59e]/55">
                    Estamos trabajando en la conexión bidireccional con el videojuego para sincronizar recompensas y cosméticos virtuales.
                </p>
            </div>
        </div>
    );
};

// 3.9 SETTINGS (Costo de Envío Local, Foráneo, Umbral y Mínimo de Compra Unificados)
