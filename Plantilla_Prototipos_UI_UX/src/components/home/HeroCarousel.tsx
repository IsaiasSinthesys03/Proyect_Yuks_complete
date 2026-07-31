import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, ImageIcon } from 'lucide-react';
import { useBanners } from '../../api/banners';

interface Banner {
    tag: string;
    title: string;
    desc: string;
    video: string;
    accent: string;
    char: string;
    image?: string;
    buttonText?: string;
    linkUrl?: string;
    videoClass?: string;
}
export const DEFAULT_BANNERS: Banner[] = [];

interface HeroCarouselProps {
    initialSlide?: number;
    isSinglePreview?: boolean;
    previewBanners?: Banner[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ initialSlide = 0, isSinglePreview = false, previewBanners }) => {
    const [activeSlide, setActiveSlide] = useState(isSinglePreview ? 0 : initialSlide);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // [Fase 39] Banners dirigidos por la BD (REQ-FE-01). El modelo del backend
    // (title/imageUrl/linkUrl) es más simple que el diseño del prototipo
    // (video/accent/desc): esos campos usan defaults del prototipo. Si NO hay
    // banners activos en el CMS, se conserva el diseño por defecto intacto.
    const { data: apiBanners } = useBanners();
    const ACCENTS = ["#ffce07", "#ec1676", "#03bbd3"];
    
    let activeApiBanners = apiBanners || [];
    let banners: Banner[] = [];
    
    if (previewBanners) {
        banners = previewBanners;
    } else {
        banners = activeApiBanners.map((b: any, i: number) => ({
            tag: b.tag || b.title,
            title: b.title,
            desc: b.description || "Consigue Skins exclusivas, descuentos reales y envíos gratis al vincular tu progreso del videojuego con nuestra tienda oficial.",
            video: b.videoUrl || "/assets/mp4/VID_Mario.mp4",
            accent: b.accentColor || ACCENTS[i % ACCENTS.length],
            char: b.title,
            image: b.imageUrl || undefined,
            buttonText: b.buttonText || undefined,
            linkUrl: b.linkUrl || "https://play.google.com",
            videoClass: "absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 mix-blend-normal",
        }));
    }

    const previewBanner = banners[initialSlide] || banners[0];
    const bannersToRender = isSinglePreview ? (previewBanner ? [previewBanner] : []) : banners;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    React.useEffect(() => {
        if (bannersToRender.length === 0) {
            if (activeSlide !== 0) setActiveSlide(0);
            return;
        }
        if (activeSlide >= bannersToRender.length) setActiveSlide(0);
    }, [activeSlide, bannersToRender.length]);

    React.useEffect(() => {
        if (isSinglePreview || bannersToRender.length <= 1) return;
        const interval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % bannersToRender.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [isSinglePreview, bannersToRender.length]);

    if (bannersToRender.length === 0) {
        return null;
    }

    const currentSlide = banners[activeSlide] || banners[0];
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

    const prevSlide = () => setActiveSlide(prev => (prev === 0 ? banners.length - 1 : prev - 1));
    const nextSlide = () => setActiveSlide(prev => (prev === banners.length - 1 ? 0 : prev + 1));

    return (
        <section 
            onMouseMove={handleMouseMove}
            className="relative mt-2 flex min-h-[280px] h-[45vh] sm:min-h-[350px] max-h-[720px] w-full items-center justify-center overflow-hidden sm:mt-4 md:h-[65vh] md:min-h-[520px]"
            style={{
                '--mouse-x': `${mousePos.x}px`,
                '--mouse-y': `${mousePos.y}px`
            } as React.CSSProperties}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {bannersToRender.map((slide, idx) => {
                    let position = 2; // 0: active, -1: prev, 1: next, 2: hidden
                    if (idx === activeSlide) position = 0;
                    else if (idx === activeSlide - 1 || (activeSlide === 0 && idx === bannersToRender.length - 1)) position = -1;
                    else if (idx === activeSlide + 1 || (activeSlide === bannersToRender.length - 1 && idx === 0)) position = 1;
                    
                    const isVisible = position === 0 || position === -1 || position === 1;

                    return (
                        <div 
                            key={idx} 
                            className={`absolute w-[calc(100%-1rem)] sm:w-[90%] md:w-[75%] max-w-[1100px] h-full flex items-center transition-all duration-700 ease-out origin-center rounded-2xl sm:rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden bg-slate-950 ${
                                position === 0 ? 'z-30 opacity-100 cursor-auto' : 'z-20 opacity-40 cursor-pointer hover:opacity-60'
                            } ${!isVisible ? 'opacity-0 pointer-events-none' : ''}`}
                            style={{
                                transform: position === 0 
                                    ? 'translateX(0) scale(1)' 
                                    : position === -1
                                    ? 'translateX(-28%) scale(0.85)'
                                    : 'translateX(28%) scale(0.85)',
                                // Critical WebKit fix for border-radius + opacity + transform clipping bug
                                WebkitMaskImage: '-webkit-radial-gradient(white, black)'
                            }}
                            onClick={() => {
                                if (position === -1) prevSlide();
                                if (position === 1) nextSlide();
                            }}
                        >
                        
                        <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden rounded-[2.5rem]" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
                            {slide.video && /\.(mp4|webm|ogg)($|\?)/i.test(slide.video) ? (
                                <video 
                                    ref={(el) => {
                                        if (el) {
                                            if (position === 0) {
                                                el.play().catch(() => {});
                                            } else {
                                                el.pause();
                                            }
                                        }
                                    }}
                                    src={slide.video} 
                                    loop 
                                    muted 
                                    playsInline 
                                    className={`${slide.videoClass || "absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60"} rounded-[2.5rem]`} 
                                />
                            ) : slide.video ? (
                                <img 
                                    src={slide.video} 
                                    className={`${slide.videoClass || "absolute inset-0 w-full h-full object-cover opacity-85 mix-blend-normal"} rounded-[2.5rem]`} 
                                    alt="Fondo"
                                />
                            ) : null}
                            {/* Gradiente para asegurar contraste en la Capa 3 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent mix-blend-multiply rounded-[2.5rem]"></div>
                            {/* Gradiente vertical inferior para fundir el video en negro en la base del slide */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-10 rounded-b-[2.5rem]"></div>
                        </div>

                        {/* ========================================================= */}
                        {/* CAPA 2 (Interacción): SVG Pop-out Personaje               */}
                        {/* ========================================================= */}
                        <div className="flex absolute right-[-5%] md:right-[-2%] bottom-0 h-[80%] md:h-[105%] w-[150px] min-[390px]:w-[170px] sm:w-[250px] md:w-[380px] 2xl:w-[440px] items-end justify-end z-[30] pointer-events-none transform translate-y-[2%] md:translate-y-[12%]">
                            {/* Halo de luz tras el personaje para darle profundidad */}
                            <div 
                                className="absolute bottom-16 md:bottom-32 right-10 md:right-20 w-[150px] md:w-[400px] h-[150px] md:h-[400px] rounded-full blur-[40px] md:blur-[100px] z-0 opacity-50 mix-blend-screen" 
                                style={{ backgroundColor: slide.accent }}
                            ></div>
                            
                            {slide.image ? (
                                <img
                                    src={slide.image}
                                    alt={slide.char}
                                    className="relative z-10 w-full h-full object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] pointer-events-auto hover:scale-110 transition-transform duration-[1s] ease-out origin-bottom"
                                />
                            ) : (
                                <div className="relative z-10 w-[350px] h-[450px] mb-20 mr-12 border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center text-white/50 backdrop-blur-md shadow-2xl overflow-hidden group pointer-events-auto bg-black/20 hidden md:flex">
                                    <ImageIcon className="w-12 h-12 mb-4 text-white/30 z-20" />
                                    <p className="font-bold text-white text-xs bg-black/60 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">{slide.char}</p>
                                    <p className="text-[10px] mt-2 text-white/40 uppercase tracking-widest">Placeholder Capa 2</p>
                                </div>
                            )}
                        </div>

                        {/* ========================================================= */}
                        {/* CAPA 3 (Contenido/CTA): UI Accesible y Botón Único        */}
                        {/* ========================================================= */}
                        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-20 flex items-center h-full pt-4 sm:pt-10 pointer-events-none">
                            <div className="max-w-[70%] sm:max-w-2xl xl:max-w-[58%] p-2 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] pointer-events-auto transition-all duration-500 bg-transparent border border-transparent shadow-none backdrop-blur-none">
                                
                                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white font-bold text-[9px] sm:text-xs border border-white/10 mb-2 sm:mb-4 shadow-md">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: slide.accent, color: slide.accent }}></div> {slide.tag}
                                </span>
                                
                                <h1 className="font-bungee text-lg min-[390px]:text-xl sm:text-4xl lg:text-5xl 2xl:text-6xl text-white leading-[1.1] mb-2 sm:mb-5 drop-shadow-xl tracking-tight break-words">
                                    {slide.title.split('. ')[0]}. <br />
                                    <span style={{ color: slide.accent }} className="drop-shadow-lg">
                                        {slide.title.split('. ')[1]}
                                    </span>
                                </h1>
                                
                                {/* Contraste WCAG AA asegurado por el fondo backdrop-blur-xl y bg-slate-900/40 */}
                                <p className="text-[10px] sm:text-base text-slate-200 mb-3 sm:mb-8 leading-snug sm:leading-relaxed font-medium drop-shadow-md pr-4 sm:pr-0">
                                    {slide.desc}
                                </p>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 relative z-20">
                                    {/* Botón Único apuntando a Google Play [REQ-FE-01] */}
                                    <a 
                                        href={slide.linkUrl || "https://play.google.com"} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-fit px-3 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden text-slate-900 bg-white shadow-lg shadow-white/20 hover:shadow-white/40 pointer-events-auto"
                                        aria-label={slide.buttonText || 'Descargar en Google Play'}
                                    >  <div className="absolute inset-0 w-full h-full opacity-10 bg-gradient-to-r from-transparent via-black to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                        <Play className="w-6 h-6 transition-transform group-hover:scale-110" style={{ color: slide.accent }} /> 
                                        <span>{slide.buttonText || 'Descargar en Google Play'}</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        </div>
                    );
                })}
            </div>

            {/* Controles del Carousel */}
            {!isSinglePreview && (
                <>
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
                </>
            )}

            {/* Paginación Simple (Dots) */}
            {!isSinglePreview && (
                <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center gap-2 sm:gap-3">
                    {banners.map((_, dotIdx) => {
                    const isActive = dotIdx === activeSlide;
                    return (
                        <button
                            key={dotIdx}
                            onClick={() => setActiveSlide(dotIdx)}
                            className="flex h-11 w-11 items-center justify-center rounded-full"
                            title={`Ir a diapositiva ${dotIdx + 1}`}
                            aria-label={`Ir a diapositiva ${dotIdx + 1}`}
                        >
                            <span className={`block rounded-full transition-all duration-300 ${
                                isActive
                                    ? 'h-2.5 w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                    : 'h-2.5 w-2.5 bg-white/50 hover:bg-white/80'
                            }`} />
                        </button>
                    );
                })}
                </div>
            )}
        </section>
    );
};
