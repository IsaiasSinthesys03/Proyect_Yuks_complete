import React, { useState, useEffect, useRef } from 'react';
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


export const LegalView = ({ navigate }) => {
    return (
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl pt-8 pb-20">
            {/* Botón de Retroceso Premium */}
            <div className="mb-10">
                <button
                    onClick={() => navigate('landing')}
                    className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all font-bold"
                >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                        <ArrowLeft className="w-5 h-5 text-[#03bbd3]" />
                    </div>
                    <span>Volver al Inicio</span>
                </button>
            </div>

            <div className="bg-slate-50/80 border border-white rounded-[2.5rem] p-10 md:p-16 shadow-premium relative overflow-hidden backdrop-blur-sm">
                {/* Elementos Decorativos de Marca */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#03bbd3]/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>

                <header className="relative mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldAlert className="w-6 h-6 text-[#03bbd3]" />
                        <span className="text-[10px] font-black text-[#03bbd3] uppercase tracking-[0.3em]">Compliance & Safety</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">Políticas y Términos Legales</h1>
                    <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <span>Última actualización: 27 de Mayo de 2026</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span className="text-[#03bbd3]">Versión v1.3</span>
                    </div>
                </header>

                <div className="space-y-12 relative">
                    <section className="group">
                        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#03bbd3] rounded-full group-hover:scale-y-125 transition-transform"></div>
                            1. Aviso de Privacidad
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            De conformidad con lo establecido en la <span className="font-bold text-slate-900">Ley Federal de Protección de Datos Personales</span>, Animayuks informa que los datos recabados en nuestra plataforma web y aplicación móvil serán utilizados de manera confidencial exclusivamente para procesar sus pedidos, personalizar su experiencia de juego y sincronizar sus recompensas Jaguar XP.
                        </p>
                    </section>

                    <section className="group">
                        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#ec1676] rounded-full group-hover:scale-y-125 transition-transform"></div>
                            2. Políticas de Reembolso
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Todo reembolso solicitado por el usuario dentro del periodo válido generará saldo en el <span className="font-bold text-[#ec1676]">Monedero Virtual</span> de la plataforma. Para devoluciones directas a la tarjeta de crédito o débito, el cliente deberá iniciar un proceso de reclamación que puede tomar hasta 15 días hábiles, sujeto a las políticas de la pasarela de pago.
                        </p>
                    </section>

                    <section className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] relative group hover:border-[#03bbd3]/30 transition-colors">
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                                <CheckSquare className="w-6 h-6 text-[#96c93e]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
                                    Aceptación del Usuario
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Al registrar una cuenta y marcar la casilla de verificación correspondiente durante el Checkout, usted certifica haber leído y aceptado este documento íntegro. El sistema registrará su dirección IP y Timestamp para auditorías de seguridad, prevención de fraude y cumplimiento de normativas PCI-DSS.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Animayuks Legal Department</p>
                    <button onClick={() => window.print()} className="text-[10px] font-black text-[#03bbd3] hover:text-[#502c84] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                        <FileText className="w-4 h-4" /> Descargar Versión PDF
                    </button>
                </footer>
            </div>
        </div>
    );
};
