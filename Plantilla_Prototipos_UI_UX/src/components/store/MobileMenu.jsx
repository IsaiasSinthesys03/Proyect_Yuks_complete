import React from 'react';
import { FileText, Gamepad2, Home, Package, X } from 'lucide-react';

export const MobileMenu = ({ isOpen, close, navigate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex md:hidden">
            <button
                type="button"
                aria-label="Cerrar menú"
                className="absolute inset-0 h-full w-full bg-slate-950/70 backdrop-blur-sm"
                onClick={close}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Menú principal"
                className="relative flex h-full w-4/5 max-w-sm flex-col overflow-y-auto border-r border-[#1a9a21]/30 bg-[#061f09] p-5 shadow-2xl animate-in slide-in-from-left sm:p-6"
            >
                <button
                    type="button"
                    onClick={close}
                    aria-label="Cerrar menú principal"
                    className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl text-[#e6c59e]/60 transition-colors hover:bg-[#1a9a21]/20 hover:text-[#03bbd3]"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="mb-10 flex min-h-11 items-center gap-2 pr-12">
                    <Gamepad2 className="h-6 w-6 text-[#03bbd3]" />
                    <span className="font-bungee text-xl text-[#e6c59e]">Animayuks</span>
                </div>

                <nav className="flex flex-col gap-2 font-quicksand font-bold text-[#e6c59e]/75">
                    <button onClick={() => { navigate('landing'); close(); }} className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left transition-colors hover:bg-[#1a9a21]/20 hover:text-[#03bbd3]"><Home className="h-5 w-5" /> Inicio</button>
                    <button onClick={() => { navigate('store'); close(); }} className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left transition-colors hover:bg-[#1a9a21]/20 hover:text-[#03bbd3]"><Package className="h-5 w-5" /> Catálogo</button>
                    <button onClick={() => { navigate('legal'); close(); }} className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left transition-colors hover:bg-[#1a9a21]/20 hover:text-[#03bbd3]"><FileText className="h-5 w-5" /> Legal</button>
                </nav>
            </div>
        </div>
    );
};
