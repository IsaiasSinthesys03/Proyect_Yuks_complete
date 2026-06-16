import React, { useState } from 'react';
import { Play, Youtube } from 'lucide-react';

interface AboutExperienceProps {
    navigate: (view: string) => void;
}

const AboutExperience: React.FC<AboutExperienceProps> = ({ navigate }) => {
    const [playVideo, setPlayVideo] = useState(false);

    return (
        <>
            {/* Estilos responsivos locales para banner-cinta-yt replicando la v1 exactamente */}
            <style>{`
                .banner-cinta-yt {
                    padding-top: 5rem;
                    padding-bottom: 6rem;
                    padding-left: 1.5rem;
                    padding-right: 1.5rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @media (min-width: 1280px) {
                    .banner-cinta-yt {
                        padding-top: 22%;
                        padding-bottom: 32%;
                        padding-left: 14%;
                        padding-right: 14%;
                    }
                }
            `}</style>

            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 relative z-30 mt-[-60px] md:mt-[-80px] xl:mt-[-100px] scroll-mt-24">
                <div id="quienes-somos" className="relative flex flex-col xl:flex-row gap-12 items-center w-full group banner-cinta-yt">

                    {/* ============================================================== */}
                    {/* 🔴 CONTROL DE IMAGEN DE FONDO (PIEDRA) 🔴 */}
                    {/* ============================================================== */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            backgroundImage: `url('/assets/imgWeb/Banner_Lore/Cinta_YT.png')`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                            zIndex: 0,

                            // 📏 DIMENSIONES DE LA IMAGEN
                            width: '125%',
                            height: '120%',

                            // 📍 POSICIONAMIENTO (Coordenadas X, Y)
                            left: '-175px',
                            top: '-150px',

                            // 🔄 AJUSTE DE ESCALA Y TRASLACIÓN REFINADO
                            transform: 'translate(0px, 0px) scale(1.0)',

                            // 🎨 MODO DE REDIMENSIONADO:
                            backgroundSize: '100% 100%'
                        }}
                    ></div>

                    {/* CONTENIDO - Lado Izquierdo (Texto Reducido y Mejor Posicionado) */}
                    <div className="w-full xl:w-5/12 space-y-4 xl:space-y-5 relative z-20 text-center xl:text-left"
                        style={{
                            // 🔴 CONTROL DE COORDENADAS: BLOQUE DE TEXTO ENTERO 🔴
                            transform: 'translate(-50px, -25px)'
                        }}>
                        <h2 className="text-3xl md:text-4xl xl:text-[2.6rem] 2xl:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] tracking-tight">
                            No somos una marca, <br />
                            <span className="text-[#96c93e] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                                somos una experiencia.
                            </span>
                        </h2>
                        <p className="text-slate-200 leading-relaxed text-sm md:text-base xl:text-[1rem] 2xl:text-base font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            Animayuks nace para revolucionar cómo vives la cultura. Creamos ropa premium y la conectamos con un universo digital donde tus compras tienen impacto en un videojuego interactivo.
                        </p>
                        {/* ============================================================== */}
                        {/* 🔴 CONTROL DE COORDENADAS: BOTÓN 🔴 */}
                        {/* ============================================================== */}
                        <div className="pt-2 xl:pt-4" style={{ transform: 'translate(-15px, -15px)' }}>
                            <button onClick={() => navigate('store')} className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#96c93e] to-[#7ab02b] text-slate-900 px-8 py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(150,201,62,0.3)] hover:shadow-[0_0_35px_rgba(150,201,62,0.6)] hover:scale-105 transition-all w-full md:w-auto uppercase tracking-wider text-sm md:text-base mx-auto xl:mx-0">
                                <span>Explorar Lore</span>
                                <Play className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* CINTA DE VIDEOS - Lado Derecho */}
                    <div className="w-full xl:w-7/12 overflow-hidden relative z-20 xl:pl-8"
                        style={{
                            // 🔴 CONTROL DE COORDENADAS: CINTA DE VIDEOS 🔴
                            transform: 'translate(-30px, -25px)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                            maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                        }}>
                        <div className="animate-marquee flex gap-6 py-4 items-center">
                            {[1, 2, 3, 4, 5, 6].map(v => (
                                <div key={v} onClick={() => setPlayVideo(true)} className="w-60 md:w-80 shrink-0 aspect-[16/10] bg-slate-900/80 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl border border-white/10 hover:border-[#96c93e]/50 transition-all">
                                    {!playVideo ? (
                                        <>
                                            <img src={`https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80`} alt="Trailer" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#96c93e]/90 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-[#96c93e] transition-all duration-300 shadow-[0_0_15px_rgba(150,201,62,0.4)]">
                                                <Play className="w-5 h-5 md:w-6 md:h-6 text-slate-900 ml-1" />
                                            </div>
                                            <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                                                <span className="bg-slate-900/90 text-[#96c93e] border border-[#96c93e]/30 text-xs md:text-sm font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">Trailer {v}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-black flex flex-col items-center justify-center text-slate-500">
                                            <Youtube className="w-10 h-10 md:w-12 md:h-12 text-red-600 mb-2 animate-pulse" />
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Cargando Cinemática...</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {/* Duplicación para el efecto infinito */}
                            {[1, 2, 3, 4, 5, 6].map(v => (
                                <div key={`dup-${v}`} onClick={() => setPlayVideo(true)} className="w-60 md:w-80 shrink-0 aspect-[16/10] bg-slate-900/80 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl border border-white/10 hover:border-[#96c93e]/50 transition-all">
                                    {!playVideo ? (
                                        <>
                                            <img src={`https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80`} alt="Trailer" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#96c93e]/90 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-[#96c93e] transition-all duration-300 shadow-[0_0_15px_rgba(150,201,62,0.4)]">
                                                <Play className="w-5 h-5 md:w-6 md:h-6 text-slate-900 ml-1" />
                                            </div>
                                            <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                                                <span className="bg-slate-900/90 text-[#96c93e] border border-[#96c93e]/30 text-xs md:text-sm font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">Trailer {v}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-black flex flex-col items-center justify-center text-slate-500">
                                            <Youtube className="w-10 h-10 md:w-12 md:h-12 text-red-600 mb-2 animate-pulse" />
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Cargando Cinemática...</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default AboutExperience;
