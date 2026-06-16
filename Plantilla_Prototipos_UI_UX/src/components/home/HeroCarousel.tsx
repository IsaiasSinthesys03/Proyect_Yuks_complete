import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, ImageIcon } from 'lucide-react';

interface Banner {
    tag: string;
    title: string;
    desc: string;
    video: string;
    accent: string;
    char: string;
    image?: string;
    videoClass?: string;
}

export const HeroCarousel: React.FC = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const banners: Banner[] = [
        {
            tag: "Lanzamiento Oficial v2.0",
            title: "Viste tu Leyenda. Gana Jugando.",
            desc: "Consigue Skins exclusivas, descuentos reales y envíos gratis al vincular tu progreso del videojuego con nuestra tienda oficial.",
            video: "/assets/mp4/VID_Mario.mp4",
            accent: "#ffce07", // Amarillo/Dorado
            char: "Mila - Cazadora Veloz",
            image: "/assets/imgWeb/personajes_SVG/milapose.png",
            videoClass: "absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 mix-blend-normal"
        },
        {
            tag: "Colección Mística",
            title: "Ixchel: Sabiduría. En cada Fibra.",
            desc: "Explora la nueva línea de ropa inspirada en la diosa Ixchel. Prendas premium que desbloquean cosméticos legendarios en el campo de batalla.",
            video: "https://www.w3schools.com/html/mov_bbb.mp4",
            accent: "#ec1676", // Magenta
            char: "Ixchel - La Tejedora",
            videoClass: "absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
        },
        {
            tag: "Torneo Estacional",
            title: "Kukul te desafía. Al Cenote.",
            desc: "Inscríbete al torneo relámpago de esta semana. Premios en efectivo, UUIDs únicos y el rango 'Jaguar' te esperan.",
            video: "https://www.w3schools.com/html/movie.mp4",
            accent: "#03bbd3", // Cian
            char: "Kukul - El Místico",
            videoClass: "absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
        }
    ];

    const prevSlide = () => setActiveSlide(prev => (prev === 0 ? banners.length - 1 : prev - 1));
    const nextSlide = () => setActiveSlide(prev => (prev === banners.length - 1 ? 0 : prev + 1));

    const currentSlide = banners[activeSlide];
    const gemColors = {
        "#ffce07": {
            light: "#ffe57f",
            mid: "#ffc107",
            dark: "#b38f00",
            glow: "#ffce07"
        },
        "#ec1676": {
            light: "#ff8ab8",
            mid: "#ec1676",
            dark: "#9e0047",
            glow: "#ec1676"
        },
        "#03bbd3": {
            light: "#a0f3ff",
            mid: "#03bbd3",
            dark: "#007c8f",
            glow: "#03bbd3"
        }
    }[currentSlide.accent] || {
        light: "#ffe57f",
        mid: "#ffc107",
        dark: "#b38f00",
        glow: "#ffce07"
    };

    const renderCorner = (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
        let posClass = "";
        let scaleClass = "";
        switch (position) {
            case 'top-left':
                posClass = "top-0 left-0";
                scaleClass = "";
                break;
            case 'top-right':
                posClass = "top-0 right-0";
                scaleClass = "scale-x-[-1]";
                break;
            case 'bottom-left':
                posClass = "bottom-0 left-0";
                scaleClass = "scale-y-[-1]";
                break;
            case 'bottom-right':
                posClass = "bottom-0 right-0";
                scaleClass = "scale-x-[-1] scale-y-[-1]";
                break;
        }

        return (
            <div key={position} className={`absolute ${posClass} w-[72px] h-[72px] pointer-events-none z-50 ${scaleClass}`}>
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id={`gold-c-base-${activeSlide}-${position}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#d4ad82" />
                            <stop offset="50%" stopColor="#b88d5e" />
                            <stop offset="100%" stopColor="#8c6239" />
                        </linearGradient>
                        <linearGradient id={`gold-c-accent-${activeSlide}-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e6c59e" />
                            <stop offset="50%" stopColor="#d4ad82" />
                            <stop offset="100%" stopColor="#b88d5e" />
                        </linearGradient>
                        <linearGradient id={`gem-grad-${activeSlide}-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={gemColors.light} />
                            <stop offset="50%" stopColor={gemColors.mid} />
                            <stop offset="100%" stopColor={gemColors.dark} />
                        </linearGradient>
                    </defs>
                    <path d="M 0,0 L 64,0 C 66,0 68,2 68,4 L 68,16 L 20,16 L 20,64 C 20,66 18,68 16,68 L 4,68 C 2,68 0,66 0,64 Z" fill="#251206" />
                    <path d="M 3,3 L 60,3 L 60,12 L 16,12 L 16,60 L 3,60 Z" fill={`url(#gold-c-base-${activeSlide}-${position})`} />
                    <path d="M 5,5 L 56,5 L 56,8 L 12,8 L 12,56 L 5,56 Z" fill={`url(#gold-c-accent-${activeSlide}-${position})`} />
                    
                    <path d="M 0,0 L 32,0 L 32,12 L 12,32 L 0,32 Z" fill="#3a2212" />
                    <path d="M 2,2 L 29,2 L 29,10 L 10,29 L 2,29 Z" fill={`url(#gold-c-accent-${activeSlide}-${position})`} />
                    
                    {/* Musgo/Liana decorativa en la esquina */}
                    <path d="M 0,0 C 20,10 40,5 50,0 C 45,15 30,25 0,20 Z" fill="#658d1b" opacity="0.85" />
                    <path d="M 0,0 C 10,20 5,40 0,50 C 15,45 25,30 20,0 Z" fill="#658d1b" opacity="0.85" />
                    
                    <circle cx="16" cy="16" r="9.5" fill="#251206" />
                    <circle cx="16" cy="16" r="8" fill={`url(#gold-c-base-${activeSlide}-${position})`} />
                    <circle cx="16" cy="16" r="6" fill="#150800" />
                    
                    <polygon 
                        points="16,10 21,13 21,19 16,22 11,19 11,13" 
                        fill={`url(#gem-grad-${activeSlide}-${position})`}
                        style={{
                            filter: `drop-shadow(0 0 3px ${gemColors.glow})`,
                            transform: 'scale(1)',
                            transformOrigin: '16px 16px',
                            animation: 'gem-pulse 3s infinite ease-in-out',
                            ['--gem-glow' as any]: gemColors.glow
                        }}
                    />
                    <polygon points="16,10 16,16 21,13" fill="#ffffff" opacity="0.35" />
                    <polygon points="21,19 16,16 16,22" fill="#000000" opacity="0.3" />
                    <circle cx="14" cy="14" r="1.2" fill="#ffffff" />
                </svg>
                
                <div 
                    className="absolute top-[8px] left-[8px] w-5 h-5 pointer-events-none z-50 mix-blend-screen"
                    style={{
                        animation: 'sparkle-rotate 4s infinite ease-in-out',
                        color: gemColors.light
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12,2 L14,10 L22,12 L14,14 L12,22 L10,14 L2,12 L10,10 Z" />
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <section 
            onMouseMove={handleMouseMove}
            className="relative h-[85vh] w-full overflow-hidden z-10 bg-slate-950"
            style={{
                '--mouse-x': `${mousePos.x}px`,
                '--mouse-y': `${mousePos.y}px`
            } as React.CSSProperties}
        >
            <div 
                className="flex h-full w-full transition-transform duration-1000 ease-in-out" 
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
                {banners.map((slide, idx) => (
                    <div key={idx} className="min-w-full h-full relative flex items-center">
                        
                        <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
                            <video 
                                src={slide.video} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className={slide.videoClass || "absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60"} 
                            />
                            {/* Gradiente para asegurar contraste en la Capa 3 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent mix-blend-multiply"></div>
                            {/* Gradiente vertical inferior para fundir el video en negro en la base del slide */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-10"></div>
                        </div>

                        {/* ========================================================= */}
                        {/* CAPA 2 (Interacción): SVG Pop-out Personaje               */}
                        {/* ========================================================= */}
                        <div className="hidden md:flex absolute right-[2%] bottom-0 h-[115%] w-[50%] lg:w-[600px] items-end justify-end z-[30] pointer-events-none transform translate-y-[15%]">
                            {/* Halo de luz tras el personaje para darle profundidad */}
                            <div 
                                className="absolute bottom-32 right-20 w-[400px] h-[400px] rounded-full blur-[100px] z-0 opacity-50 mix-blend-screen" 
                                style={{ backgroundColor: slide.accent }}
                            ></div>
                            
                            {slide.image ? (
                                <img
                                    src={slide.image}
                                    alt={slide.char}
                                    className="relative z-10 w-full h-full object-contain object-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] pointer-events-auto hover:scale-110 transition-transform duration-[1s] ease-out origin-bottom"
                                />
                            ) : (
                                <div className="relative z-10 w-[350px] h-[450px] mb-20 mr-12 border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center text-white/50 backdrop-blur-md shadow-2xl overflow-hidden group pointer-events-auto bg-black/20">
                                    <ImageIcon className="w-12 h-12 mb-4 text-white/30 z-20" />
                                    <p className="font-bold text-white text-xs bg-black/60 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">{slide.char}</p>
                                    <p className="text-[10px] mt-2 text-white/40 uppercase tracking-widest">Placeholder Capa 2</p>
                                </div>
                            )}
                        </div>

                        {/* ========================================================= */}
                        {/* CAPA 3 (Contenido/CTA): UI Accesible y Botón Único        */}
                        {/* ========================================================= */}
                        <div className="container mx-auto px-6 lg:px-12 relative z-20 flex items-center h-full pt-16 pointer-events-none">
                            <div className={`max-w-2xl p-8 rounded-[2.5rem] pointer-events-auto transition-all duration-500 ${
                                idx === 0 
                                    ? 'bg-transparent border border-transparent shadow-none backdrop-blur-none' 
                                    : 'bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50'
                            }`}>
                                
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white font-bold text-xs border border-white/10 mb-6 shadow-md">
                                    <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: slide.accent, color: slide.accent }}></div> {slide.tag}
                                </span>
                                
                                <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-xl tracking-tight">
                                    {slide.title.split('. ')[0]}. <br />
                                    <span style={{ color: slide.accent }} className="drop-shadow-lg">
                                        {slide.title.split('. ')[1]}
                                    </span>
                                </h1>
                                
                                {/* Contraste WCAG AA asegurado por el fondo backdrop-blur-xl y bg-slate-900/40 */}
                                <p className="text-lg text-slate-200 mb-10 max-w-lg leading-relaxed font-medium drop-shadow-md">
                                    {slide.desc}
                                </p>

                                <div className="flex items-center gap-4">
                                    {/* Botón Único apuntando a Google Play [REQ-FE-01] */}
                                    <a 
                                        href="https://play.google.com" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="group relative overflow-hidden bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.25)] flex items-center gap-3 border border-transparent"
                                    >
                                        <div className="absolute inset-0 w-full h-full opacity-10 bg-gradient-to-r from-transparent via-black to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                        <Play className="w-6 h-6 transition-transform group-hover:scale-110" style={{ color: slide.accent }} /> 
                                        <span>Descargar en Google Play</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {/* Controles del Carousel */}
            <button 
                onClick={prevSlide} 
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-[40] bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md p-3.5 rounded-full text-white transition-all hover:scale-110 shadow-2xl hidden md:flex items-center justify-center"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
                onClick={nextSlide} 
                className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-[40] bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md p-3.5 rounded-full text-white transition-all hover:scale-110 shadow-2xl hidden md:flex items-center justify-center"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* ========================================================= */}
            {/* MARCO DORADO INTERACTIVO Y ANIMADO PRO-MAX (Game UI Style) */}
            {/* ========================================================= */}
            
            {/* Estilos CSS Inline para Animaciones Reutilizables */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes conduit-flow-right-${activeSlide} {
                    0% { stroke-dashoffset: 1000; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes conduit-flow-left-${activeSlide} {
                    0% { stroke-dashoffset: -1000; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes gem-pulse {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px var(--gem-glow)) brightness(1); }
                    50% { transform: scale(1.08); filter: drop-shadow(0 0 12px var(--gem-glow)) brightness(1.25); }
                }
                @keyframes sparkle-rotate {
                    0% { transform: rotate(0deg) scale(0.7); opacity: 0.3; }
                    50% { transform: rotate(180deg) scale(1.1); opacity: 0.9; }
                    100% { transform: rotate(360deg) scale(0.7); opacity: 0.3; }
                }
                @keyframes particle-drift {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { transform: translateY(-130px) translateX(var(--drift-x)); opacity: 0; }
                }
                @keyframes border-flash-${activeSlide} {
                    0% { opacity: 0.85; filter: brightness(1.5); }
                    100% { opacity: 0; filter: brightness(1); }
                }
            `}} />

            {/* Flash de transición al cambiar de slide */}
            <div 
                key={`flash-${activeSlide}`} 
                className="absolute inset-0 pointer-events-none z-[48] mix-blend-screen"
                style={{
                    boxShadow: `inset 0 0 50px ${gemColors.glow}`,
                    border: `4px solid ${gemColors.glow}`,
                    animation: `border-flash-${activeSlide} 0.8s ease-out 1 forwards`
                }}
            />

            {/* Contenedor Base del Marco con Borde de Metal Oscuro Grueso */}
            <div className="absolute inset-0 pointer-events-none z-[45] border-[8px] border-[#251206] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                
                {/* Reflejo Metálico Interactivo (Cursor Follow) */}
                <div 
                    className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-80"
                    style={{
                        background: `radial-gradient(circle 240px at var(--mouse-x) var(--mouse-y), ${gemColors.light}25 0%, transparent 70%)`
                    }}
                />

                {/* Bisel de Madera de Fondo del Marco */}
                <div 
                    className="absolute inset-[2px] border-[5px] border-solid" 
                    style={{
                        borderImage: 'linear-gradient(135deg, #e6c59e 0%, #b88d5e 50%, #3a2212 100%) 5',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                    }}
                />

                {/* Doble Conducto de Energía Mágica Animada */}
                <div className="absolute inset-[7px] pointer-events-none">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="none"
                            stroke={currentSlide.accent}
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray="140 380"
                            style={{
                                filter: `drop-shadow(0 0 5px ${currentSlide.accent})`,
                                animation: `conduit-flow-right-${activeSlide} 12s linear infinite`
                            }}
                        />
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="none"
                            stroke={currentSlide.accent}
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray="90 320"
                            style={{
                                filter: `drop-shadow(0 0 4px ${currentSlide.accent})`,
                                animation: `conduit-flow-left-${activeSlide} 15s linear infinite`
                            }}
                        />
                    </svg>
                </div>

                {/* --- Remaches de Musgo Luminoso 3D --- */}
                {/* Remaches Superior */}
                <div className="absolute left-[20%] top-[4px] -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>
                <div className="absolute left-[80%] top-[4px] -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>

                {/* Remaches Inferior */}
                <div className="absolute left-[20%] bottom-[4px] translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>
                <div className="absolute left-[80%] bottom-[4px] translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>

                {/* Remaches Izquierda */}
                <div className="absolute top-[25%] left-[4px] -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>
                <div className="absolute top-[75%] left-[4px] -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>

                {/* Remaches Derecha */}
                <div className="absolute top-[25%] right-[4px] translate-x-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>
                <div className="absolute top-[75%] right-[4px] translate-x-1/2 w-4.5 h-4.5 rounded-full bg-[#150800] border border-[#251206] flex items-center justify-center z-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#2e4705] via-[#658d1b] to-[#96c93e] shadow-sm flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-white/70 -translate-x-[0.5px] -translate-y-[0.5px]"/></div>
                </div>

                {/* --- Placas de Anclaje Centrales (Crestas) --- */}
                {/* Placa Superior */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[10px] pointer-events-none z-50 w-40 h-10 flex items-center justify-center">
                    <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id={`gold-p-base-${activeSlide}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#d4ad82" />
                                <stop offset="50%" stopColor="#b88d5e" />
                                <stop offset="100%" stopColor="#8c6239" />
                            </linearGradient>
                            <linearGradient id={`gold-p-light-${activeSlide}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e6c59e" />
                                <stop offset="50%" stopColor="#d4ad82" />
                                <stop offset="100%" stopColor="#b88d5e" />
                            </linearGradient>
                        </defs>
                        <path d="M 12,4 L 148,4 L 160,18 L 148,32 L 80,40 L 12,32 L 0,18 Z" fill="#251206" />
                        <path d="M 14,6 L 146,6 L 156,18 L 146,30 L 80,37 L 14,30 L 4,18 Z" fill={`url(#gold-p-base-${activeSlide})`} />
                        <path d="M 16,8 L 144,8 L 152,18 L 144,28 L 80,34 L 16,28 L 8,18 Z" fill={`url(#gold-p-light-${activeSlide})`} />
                        
                        <rect x="74" y="12" width="12" height="12" rx="2" transform="rotate(45 80 18)" fill="#251206" />
                        <rect x="76" y="14" width="8" height="8" rx="1" transform="rotate(45 80 18)" fill={gemColors.mid} />
                        <circle cx="79" cy="16" r="1.2" fill="#ffffff" />
                        
                        <circle cx="24" cy="18" r="2.5" fill="#251206" />
                        <circle cx="136" cy="18" r="2.5" fill="#251206" />
                    </svg>
                </div>

                {/* Soporte Lateral Izquierdo */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[10px] pointer-events-none z-50 w-8 h-24 flex items-center justify-center">
                    <svg width="32" height="96" viewBox="0 0 32 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 4,12 L 4,84 L 18,96 L 32,84 L 32,12 L 18,0 Z" fill="#251206" />
                        <path d="M 6,14 L 6,82 L 18,92 L 30,82 L 30,14 L 18,4 Z" fill={`url(#gold-p-base-${activeSlide})`} />
                        <path d="M 8,16 L 8,80 L 18,88 L 28,80 L 28,16 L 18,8 Z" fill={`url(#gold-p-light-${activeSlide})`} />
                        <circle cx="18" cy="48" r="4.5" fill="#251206" />
                        <circle cx="18" cy="48" r="2.5" fill={gemColors.light} />
                    </svg>
                </div>

                {/* Soporte Lateral Derecho */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[10px] pointer-events-none z-50 w-8 h-24 flex items-center justify-center scale-x-[-1]">
                    <svg width="32" height="96" viewBox="0 0 32 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 4,12 L 4,84 L 18,96 L 32,84 L 32,12 L 18,0 Z" fill="#251206" />
                        <path d="M 6,14 L 6,82 L 18,92 L 30,82 L 30,14 L 18,4 Z" fill={`url(#gold-p-base-${activeSlide})`} />
                        <path d="M 8,16 L 8,80 L 18,88 L 28,80 L 28,16 L 18,8 Z" fill={`url(#gold-p-light-${activeSlide})`} />
                        <circle cx="18" cy="48" r="4.5" fill="#251206" />
                        <circle cx="18" cy="48" r="2.5" fill={gemColors.light} />
                    </svg>
                </div>

                {/* --- Esquineros del Marco --- */}
                {renderCorner('top-left')}
                {renderCorner('top-right')}
                {renderCorner('bottom-left')}
                {renderCorner('bottom-right')}
            </div>

            {/* Placa Controladora de Navegación Runas (Bottom Center) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[12px] pointer-events-auto z-[60] flex items-center justify-center">
                <div className="relative h-12 w-48 flex items-center justify-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 15,2 L 177,2 L 192,20 L 177,38 L 96,46 L 15,38 L 0,20 Z" fill="#251206" />
                        <path d="M 17,4 L 175,4 L 188,20 L 175,35 L 96,43 L 17,35 L 4,20 Z" fill={`url(#gold-p-base-${activeSlide})`} />
                        <path d="M 19,6 L 173,6 L 184,20 L 173,32 L 96,40 L 19,32 L 8,20 Z" fill={`url(#gold-p-light-${activeSlide})`} />
                    </svg>
                    
                    {/* Runas de Navegación Interactivas */}
                    <div className="relative z-10 flex gap-6 justify-center items-center">
                        {banners.map((_, dotIdx) => {
                            const isActive = dotIdx === activeSlide;
                            return (
                                <button
                                    key={dotIdx}
                                    onClick={() => setActiveSlide(dotIdx)}
                                    className="group/rune relative w-6.5 h-6.5 flex items-center justify-center transition-all duration-300"
                                    title={`Ir a diapositiva ${dotIdx + 1}`}
                                >
                                    <div className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                                        isActive 
                                            ? 'border-[#251206] bg-[#150800] scale-115 shadow-[0_0_12px_rgba(255,255,255,0.35)]' 
                                            : 'border-[#3a2212] bg-[#251206]/85 hover:bg-[#3a2212] hover:scale-110'
                                    }`}>
                                        <div 
                                            className="absolute inset-[3px] rounded-full transition-all duration-500 flex items-center justify-center font-black text-[10px]"
                                            style={{
                                                backgroundColor: isActive ? gemColors.mid : '#251206',
                                                color: isActive ? '#ffffff' : '#d4ad82',
                                                boxShadow: isActive ? `0 0 10px ${gemColors.glow}, inset 0 0 4px #ffffff` : 'none',
                                                textShadow: isActive ? '0 0 2px #fff' : 'none'
                                            }}
                                        >
                                            {dotIdx + 1}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Partículas Mágicas Flotantes en la Base del Marco */}
            <div className="absolute inset-x-0 bottom-0 top-[75%] pointer-events-none overflow-hidden z-20">
                {[...Array(6)].map((_, i) => {
                    const delays = ['0s', '1.5s', '3s', '0.7s', '2.2s', '3.7s'];
                    const lefts = ['12%', '32%', '52%', '72%', '45%', '88%'];
                    const driftX = ['25px', '-35px', '45px', '-25px', '20px', '-20px'];
                    return (
                        <div
                            key={i}
                            className="absolute bottom-2.5 w-1.5 h-1.5 rounded-full"
                            style={{
                                left: lefts[i],
                                backgroundColor: gemColors.glow,
                                filter: `drop-shadow(0 0 4px ${gemColors.glow})`,
                                animation: `particle-drift 4.5s infinite linear`,
                                animationDelay: delays[i],
                                '--drift-x': driftX[i],
                            } as React.CSSProperties}
                        />
                    );
                })}
            </div>
        </section>
    );
};
