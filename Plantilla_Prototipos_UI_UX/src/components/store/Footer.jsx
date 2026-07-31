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
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../../lib/api';

export const Footer = ({ navigate, showToast }) => {
    const { data: config } = useQuery({
        queryKey: ['store', 'config'],
        queryFn: async () => unwrap(await api.get('/api/content/store-config')),
        staleTime: 1000 * 60 * 60, // 1 hora
    });

    const socialFacebookUrl = config?.socialFacebookUrl || 'https://facebook.com';
    const socialInstagramUrl = config?.socialInstagramUrl || 'https://instagram.com';
    const socialTwitterUrl = config?.socialTwitterUrl || 'https://twitter.com';
    const supportWhatsapp = config?.supportWhatsapp || '+52 999 123 4567';
    const supportEmail = config?.supportEmail || 'hola@animayuks.com';

    return (
    <footer className="relative bg-gradient-to-b from-[#0e160a] to-[#04060b] pt-24 pb-12 overflow-hidden border-t-0 select-none">
        {/* Estilos CSS locales de animaciones y hovers */}
        <style dangerouslySetInnerHTML={{ __html: `
            @keyframes heartbeat {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px #ec1676); }
                50% { transform: scale(1.25); filter: drop-shadow(0 0 7px #ec1676); }
            }
            .heart-pulse {
                animation: heartbeat 1.3s infinite ease-in-out;
            }
            @keyframes button-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .shimmer-anim::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
                animation: button-shimmer 2.2s infinite linear;
            }
            .footer-link {
                transition: all 0.3s ease;
            }
            .footer-link:hover {
                transform: translateX(4px);
                color: #ffce07;
                text-shadow: 0 0 6px rgba(255, 206, 7, 0.5);
            }
            .footer-link-cyan {
                transition: all 0.3s ease;
            }
            .footer-link-cyan:hover {
                transform: translateX(4px);
                color: #03bbd3;
                text-shadow: 0 0 6px rgba(3, 187, 211, 0.5);
            }
        `}} />

        {/* Moldura Metálica Superior con Remaches 3D */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[#251206] z-10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
            {/* Bisel dorado superior */}
            <div 
                className="absolute top-[2px] inset-x-0 h-[6px]" 
                style={{
                    background: 'linear-gradient(90deg, #b38f00 0%, #ffce07 20%, #ffe57f 50%, #ffce07 80%, #b38f00 100%)'
                }}
            />
            {/* Remaches de metal distribuidos */}
            {[10, 30, 50, 70, 90].map((percent, idx) => (
                <div 
                    key={idx} 
                    className="absolute top-[8px] -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center"
                    style={{ left: `${percent}%` }}
                >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-[#7a4a00] via-[#ffc107] to-[#fff8d3] flex items-center justify-center">
                        <div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/>
                    </div>
                </div>
            ))}
        </div>

        {/* Brillos de Fondo sutiles */}
        <div className="absolute top-1/4 left-[-10%] w-[350px] h-[350px] rounded-full blur-[130px] bg-[#96c93e]/5 pointer-events-none" />
        <div className="absolute bottom-1/4 right-[-10%] w-[350px] h-[350px] rounded-full blur-[130px] bg-[#03bbd3]/5 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-9 md:gap-12 mb-12 sm:mb-16 relative z-20">
            {/* Columna 1: Info de la Marca */}
            <div className="space-y-6">
                <div>
                    <h2 className="font-bungee text-3xl md:text-4xl tracking-wider text-white uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        Animayuks<span className="text-[#96c93e]">.</span>
                    </h2>
                    <p className="text-slate-350 text-[16px] mt-4 leading-relaxed">
                        Trascendemos el E-commerce tradicional. Juega, gana recompensas y viste tu pasión en el mundo real e interactivo.
                    </p>
                </div>
                
                {/* Redes Sociales como Runas Metálicas */}
                <div className="space-y-3">
                    <h4 className="font-bungee text-white uppercase tracking-wide text-[10px] opacity-80">
                        Síguenos
                    </h4>
                    <div className="flex gap-4">
                        <a 
                            href={socialFacebookUrl} target="_blank" rel="noopener noreferrer"
                            className="w-12 h-12 bg-[#150800] border-2 border-[#ffce07]/40 hover:border-[#03bbd3] rounded-full flex items-center justify-center text-[#ffce07] hover:text-white hover:bg-[#03bbd3] hover:shadow-[0_0_15px_rgba(3,187,211,0.6)] hover:scale-110 active:scale-95 transition-all shadow-md"
                        >
                            <Facebook className="w-5.5 h-5.5" />
                        </a>
                        <a 
                            href={socialInstagramUrl} target="_blank" rel="noopener noreferrer"
                            className="w-12 h-12 bg-[#150800] border-2 border-[#ffce07]/40 hover:border-[#ec1676] rounded-full flex items-center justify-center text-[#ffce07] hover:text-white hover:bg-gradient-to-tr hover:from-[#ffce07] hover:to-[#ec1676] hover:shadow-[0_0_15px_rgba(236,22,118,0.6)] hover:scale-110 active:scale-95 transition-all shadow-md"
                        >
                            <Instagram className="w-5.5 h-5.5" />
                        </a>
                        <a 
                            href={socialTwitterUrl} target="_blank" rel="noopener noreferrer"
                            className="w-12 h-12 bg-[#150800] border-2 border-[#ffce07]/40 hover:border-[#03bbd3] rounded-full flex items-center justify-center text-[#ffce07] hover:text-white hover:bg-sky-500 hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.6)] hover:scale-110 active:scale-95 transition-all shadow-md"
                        >
                            <Twitter className="w-5.5 h-5.5" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Columna 2: Tienda y Soporte */}
            <div className="space-y-6">
                <h4 className="font-bungee text-white mb-6 uppercase tracking-wide text-base" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    Tienda y Soporte
                </h4>
                <ul className="space-y-4 text-[16px] text-slate-300 font-medium">
                    <li className="space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Soporte</span>
                        <span className="text-white hover:text-[#03bbd3] transition-colors font-black text-base">{supportWhatsapp}</span>
                    </li>
                    <li className="space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Directo</span>
                        <span className="text-white hover:text-[#03bbd3] transition-colors font-black text-base font-mono">{supportEmail}</span>
                    </li>
                </ul>
            </div>

            {/* Columna 3: Legal */}
            <div className="space-y-6">
                <h4 className="font-bungee text-white mb-6 uppercase tracking-wide text-base" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    Legal (Compliance)
                </h4>
                <ul className="space-y-4 text-[16px] text-slate-300 font-medium">
                    <li role="button" tabIndex={0} onClick={() => navigate('legal:privacy')} className="footer-link cursor-pointer flex min-h-11 items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Aviso de Privacidad
                    </li>
                    <li role="button" tabIndex={0} onClick={() => navigate('legal:terms')} className="footer-link cursor-pointer flex min-h-11 items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Términos y Condiciones
                    </li>
                    <li role="button" tabIndex={0} onClick={() => navigate('legal:shipping')} className="footer-link cursor-pointer flex min-h-11 items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Política de Envíos
                    </li>
                    <li role="button" tabIndex={0} onClick={() => navigate('legal:returns')} className="footer-link cursor-pointer flex min-h-11 items-center gap-2">
                        <span className="text-[#ffce07] text-sm">▶</span> Política de Devoluciones
                    </li>
                </ul>
            </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left text-sm text-slate-400 font-medium relative z-20">
            <p>© 2026 Animayuks. Todos los derechos reservados.</p>
            <p className="mt-3 md:mt-0 flex items-center gap-1.5">
                Diseñado con <Heart className="w-3.5 h-3.5 text-[#ec1676] heart-pulse fill-[#ec1676] inline" /> en Mérida, Yucatán.
            </p>
        </div>
    </footer>
    );
};

// --- Auth Modal ---
