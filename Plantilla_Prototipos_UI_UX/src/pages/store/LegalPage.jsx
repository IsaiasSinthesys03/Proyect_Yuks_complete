import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../../lib/api';
import {
    ShoppingCart, User, Menu, X, ChevronRight, ChevronLeft, Heart, Play,
    Search, Filter, ChevronDown, Package, MapPin, CreditCard,
    Ticket, Gamepad2, Bell, Copy, CheckCircle2, Truck, Box,
    Home, LogOut, HeartHandshake, Mail, Lock, ShieldAlert,
    AlertTriangle, Settings, Image as ImageIcon, Clock,
    Smartphone, FileText, CheckSquare, Youtube, Cat, Coins,
    Facebook, Instagram, Twitter, Eye, EyeOff, Trash2, ArrowLeft, Plus, Loader2,
    Sparkles, Terminal, Eye as ViewIcon, Zap, Navigation, Star, Share2, ShieldCheck, ExternalLink
} from 'lucide-react';


export const LegalView = ({ navigate, initialSlug = 'terms' }) => {
    const legalDocuments = [
        { slug: 'privacy', label: 'Aviso de Privacidad' },
        { slug: 'returns', label: 'Política de Devoluciones' },
        { slug: 'shipping', label: 'Política de Envíos' },
        { slug: 'terms', label: 'Términos y Condiciones' },
    ];
    const [selectedSlug, setSelectedSlug] = useState(initialSlug);

    useEffect(() => {
        setSelectedSlug(initialSlug);
    }, [initialSlug]);

    const documentQuery = useQuery({
        queryKey: ['content', 'legal', selectedSlug],
        queryFn: async () => unwrap(await api.get(`/api/content/legal/${selectedSlug}`)),
    });
    const document = documentQuery.data;

    return (
        <div className="container mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-12 max-w-4xl pt-5 sm:pt-8 pb-16 sm:pb-20">
            {/* Botón de Retroceso Premium */}
            <div className="mb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all font-bold"
                >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                        <ArrowLeft className="w-5 h-5 text-[#03bbd3]" />
                    </div>
                    <span>Volver Atrás</span>
                </button>
            </div>

            <div className="bg-slate-50/80 border border-white rounded-3xl sm:rounded-[2.5rem] p-4 min-[390px]:p-5 sm:p-8 md:p-12 lg:p-16 shadow-premium relative overflow-hidden backdrop-blur-sm">
                {/* Elementos Decorativos de Marca */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#03bbd3]/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>

                <header className="relative mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldAlert className="w-6 h-6 text-[#03bbd3]" />
                        <span className="text-[10px] font-black text-[#03bbd3] uppercase tracking-[0.3em]">Compliance & Safety</span>
                    </div>
                    <h1 className="font-bungee text-3xl md:text-4xl text-slate-900 mb-6 leading-tight tracking-tight">{document?.title || 'Políticas y Términos Legales'}</h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <span>Última actualización: {document?.updatedAt ? new Date(document.updatedAt).toLocaleDateString('es-MX', { dateStyle: 'long' }) : 'Consultando...'}</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span className="text-[#03bbd3]">Versión {document?.version || '—'}</span>
                    </div>
                </header>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10">
                    {legalDocuments.map((item) => (
                        <button key={item.slug} onClick={() => setSelectedSlug(item.slug)} className={`w-full sm:w-auto px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all text-center leading-tight flex items-center justify-center ${selectedSlug === item.slug ? 'bg-[#03bbd3] text-white shadow-lg shadow-[#03bbd3]/25 scale-[1.02]' : 'bg-white text-slate-600 border border-slate-200/80 hover:text-[#03bbd3] hover:border-[#03bbd3]/40'}`}>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-12 relative">
                    {documentQuery.isPending && (
                        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#03bbd3]" />
                            <p className="font-bold">Consultando documento oficial...</p>
                        </div>
                    )}

                    {documentQuery.isError && (
                        <div className="py-12 text-center text-red-500 font-bold">No fue posible consultar este documento.</div>
                    )}

                    {document && (
                        <section className="group">
                            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#03bbd3] rounded-full group-hover:scale-y-125 transition-transform"></div>
                                Documento vigente
                            </h3>
                            {document.pdfUrl ? (
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#03bbd3]/10 border border-slate-200/60 bg-white group/pdf transition-all duration-300 hover:shadow-[#03bbd3]/20">
                                    {/* Barra superior de diseño (Mac style) */}
                                    <div className="bg-slate-50/80 backdrop-blur-md px-5 py-3 flex items-center justify-between border-b border-slate-200/60">
                                        <div className="flex gap-2 w-20">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-[#03bbd3]" /> {document.title} — Documento Oficial
                                        </div>
                                        <div className="w-20"></div> {/* Spacer para centrar el título */}
                                    </div>
                                    <iframe
                                        src={`${document.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                                        className="w-full h-[65vh] min-h-[480px] md:h-[800px] border-0 bg-slate-100/50"
                                        title={document.title}
                                    ></iframe>
                                    
                                    {/* Botón flotante para descargar / abrir en grande */}
                                    <div className="p-3 sm:p-0 sm:absolute sm:bottom-6 sm:right-6 opacity-100 sm:opacity-0 sm:group-hover/pdf:opacity-100 transition-opacity duration-300">
                                        <a 
                                            href={document.pdfUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-3 bg-[#03bbd3] hover:bg-[#02a0b5] text-white px-4 sm:px-6 py-3 rounded-2xl font-black text-sm shadow-[0_10px_30px_rgba(3,187,211,0.4)] transition-transform hover:scale-105 hover:-translate-y-1"
                                        >
                                            <ExternalLink className="w-5 h-5" /> Abrir en pantalla completa
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">{document.content}</div>
                            )}
                        </section>
                    )}

                    <section className="bg-slate-50 border border-slate-100 p-4 sm:p-8 rounded-3xl sm:rounded-[2rem] relative group hover:border-[#03bbd3]/30 transition-colors">
                        <div className="flex flex-col min-[390px]:flex-row items-start gap-4 sm:gap-5">
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
                    {document?.pdfUrl ? (
                        <a href={document.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-[#03bbd3] hover:text-[#502c84] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                            <FileText className="w-4 h-4" /> Ver Versión PDF Oficial
                        </a>
                    ) : (
                        <button onClick={() => window.print()} disabled={!document} className="text-[10px] font-black text-[#03bbd3] hover:text-[#502c84] disabled:text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                            <FileText className="w-4 h-4" /> Imprimir Versión Web
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};
