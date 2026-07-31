import React, { useState, useEffect } from 'react';
import { Play, Youtube } from 'lucide-react';
import { api, unwrap } from '../../lib/api';

interface AboutExperienceProps {
    navigate: (view: string) => void;
}

interface YoutubeVideo {
    id: string;
    title: string;
    video_id: string;
}

const AboutExperience: React.FC<AboutExperienceProps> = ({ navigate }) => {
    const [playVideoId, setPlayVideoId] = useState<string | null>(null);
    const [videos, setVideos] = useState<YoutubeVideo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = unwrap(await api.get('/api/content/home-videos'));
                setVideos(response);
            } catch (error) {
                console.error("Error fetching youtube videos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const displayVideos = videos;

    return (
        <>
            <style>{`
                @media (min-width: 1280px) {
                    .banner-cinta-yt-desktop {
                        padding-top: 22%;
                        padding-bottom: 32%;
                        padding-left: 14%;
                        padding-right: 14%;
                    }
                }
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Margen superior mt-6 en móvil para dar espacio con las tarjetas (CharacterGrid), y mt-[-100px] en desktop */}
            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 relative z-30 mt-6 sm:mt-10 xl:mt-[-100px] mb-8 xl:mb-0 scroll-mt-24">

                {/* CONTENEDOR PRINCIPAL */}
                <div id="quienes-somos" className="relative flex flex-col xl:flex-row gap-6 xl:gap-12 items-center w-full group banner-cinta-yt-desktop">

                    {/* IMAGEN DE FONDO (PIEDRA) — Solo activa como fondo global en DESKTOP (xl) */}
                    <div
                        className="hidden xl:block absolute pointer-events-none z-0"
                        style={{
                            backgroundImage: `url('/assets/imgWeb/Banner_Lore/Cinta_YT.png')`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                            zIndex: 0,
                            width: '125%',
                            height: '120%',
                            left: '-175px',
                            top: '-150px',
                            transform: 'translate(0px, 0px) scale(1.0)',
                            backgroundSize: '100% 100%'
                        }}
                    ></div>

                    {/* BLOQUE DE TEXTO Y BOTÓN */}
                    {/* En móvil: Libre sobre la madera con espacio adecuado */}
                    <div className="w-full xl:w-5/12 space-y-4 xl:space-y-5 relative z-20 text-center xl:text-left xl:-translate-x-[50px] xl:-translate-y-[25px]">
                        <h2 className="font-bungee text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl text-white leading-[1.2] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] tracking-tight">
                            No somos una marca, <br />
                            <span className="text-[#96c93e] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                                somos una experiencia.
                            </span>
                        </h2>
                        <p className="text-slate-200 leading-relaxed text-xs sm:text-base xl:text-[1rem] 2xl:text-base font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-xl mx-auto xl:mx-0 px-2 sm:px-0">
                            Animayuks nace para revolucionar cómo vives la cultura. Creamos ropa premium y la conectamos con un universo digital donde tus compras tienen impacto en un videojuego interactivo.
                        </p>

                        {/* BOTÓN EXPLORAR LORE */}
                        <div className="pt-2 xl:pt-4 xl:-translate-x-4 xl:-translate-y-4">
                            <button onClick={() => navigate('store')} className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#96c93e] to-[#7ab02b] text-slate-900 px-6 py-3.5 sm:px-8 sm:py-5 rounded-2xl font-bungee shadow-[0_0_20px_rgba(150,201,62,0.3)] hover:shadow-[0_0_35px_rgba(150,201,62,0.6)] hover:scale-105 transition-all w-auto uppercase tracking-wide text-xs md:text-sm leading-none mx-auto xl:mx-0">
                                <span>Explorar Lore</span>
                                <Play className="w-4 h-4 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* CINTA DE VIDEOS */}
                    {/* En móvil: Tarjetas compactas (w-44 / w-60) totalmente enmarcadas en la piedra sin tocar el footer */}
                    {displayVideos.length > 0 && (
                        <div className="w-full xl:w-7/12 relative z-20 xl:pl-8 xl:translate-x-[140px] xl:-translate-y-[25px] mt-4 xl:mt-0">

                            {/* Marco de Piedra DEDICADO para los videos en MÓVIL (Desplazado hacia abajo) */}
                            <div className="xl:hidden absolute inset-0 -mx-16 -my-24 sm:-mx-24 sm:-my-32 translate-y-4 xl:translate-y-0 pointer-events-none z-0"
                                style={{
                                    backgroundImage: `url('/assets/imgWeb/Banner_Lore/Cinta_YT.png')`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center center',
                                    backgroundSize: '100% 100%'
                                }}
                            ></div>

                            {/* Contenedor de Marquesina */}
                            <div className="overflow-hidden relative z-10 py-14 px-2 xl:py-0 xl:px-0"
                                style={{
                                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                                    maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
                                }}>
                                <div className="animate-marquee flex gap-3 sm:gap-6 py-2 xl:py-4 items-center">
                                    {displayVideos.map(v => (
                                        <div key={v.id} onClick={() => {
                                            setPlayVideoId(v.id);
                                            window.open(`https://www.youtube.com/watch?v=${v.video_id}`, '_blank');
                                            setTimeout(() => setPlayVideoId(null), 1000);
                                        }} className="w-36 sm:w-52 xl:w-80 shrink-0 aspect-[16/10] bg-slate-900/80 backdrop-blur-sm rounded-[1rem] xl:rounded-[2rem] flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden shadow-xl border border-[#96c93e]/30 hover:border-[#96c93e]/50 transition-all">
                                            {playVideoId !== v.id ? (
                                                <>
                                                    <img src={`https://img.youtube.com/vi/${v.video_id}/maxresdefault.jpg`} onError={(e) => {
                                                        e.currentTarget.src = `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`;
                                                    }} alt={v.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                                                    <div className="w-9 h-9 xl:w-16 xl:h-16 bg-[#96c93e]/90 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-[#96c93e] transition-all duration-300 shadow-[0_0_15px_rgba(150,201,62,0.4)]">
                                                        <Play className="w-3.5 h-3.5 xl:w-6 xl:h-6 text-slate-900 ml-0.5 xl:ml-1" />
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 xl:bottom-4 xl:left-4 right-2 truncate">
                                                        <span className="bg-slate-900/90 text-[#96c93e] border border-[#96c93e]/30 text-[9px] xl:text-sm font-black px-2 py-0.5 xl:px-3 xl:py-1.5 rounded-md xl:rounded-lg tracking-wider xl:tracking-widest uppercase">{v.title}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-black flex flex-col items-center justify-center text-slate-500">
                                                    <Youtube className="w-7 h-7 xl:w-12 xl:h-12 text-red-600 mb-1 xl:mb-2 animate-pulse" />
                                                    <span className="text-[8px] xl:text-xs font-bold uppercase tracking-wider">Abriendo YouTube...</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {/* Duplication for infinite effect */}
                                    {displayVideos.map(v => (
                                        <div key={`dup-${v.id}`} onClick={() => {
                                            setPlayVideoId(`dup-${v.id}`);
                                            window.open(`https://www.youtube.com/watch?v=${v.video_id}`, '_blank');
                                            setTimeout(() => setPlayVideoId(null), 1000);
                                        }} className="w-36 sm:w-52 xl:w-80 shrink-0 aspect-[16/10] bg-slate-900/80 backdrop-blur-sm rounded-[1rem] xl:rounded-[2rem] flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden shadow-xl border border-[#96c93e]/30 hover:border-[#96c93e]/50 transition-all">
                                            {playVideoId !== `dup-${v.id}` ? (
                                                <>
                                                    <img src={`https://img.youtube.com/vi/${v.video_id}/maxresdefault.jpg`} onError={(e) => {
                                                        e.currentTarget.src = `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`;
                                                    }} alt={v.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                                                    <div className="w-9 h-9 xl:w-16 xl:h-16 bg-[#96c93e]/90 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-[#96c93e] transition-all duration-300 shadow-[0_0_15px_rgba(150,201,62,0.4)]">
                                                        <Play className="w-3.5 h-3.5 xl:w-6 xl:h-6 text-slate-900 ml-0.5 xl:ml-1" />
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 xl:bottom-4 xl:left-4 right-2 truncate">
                                                        <span className="bg-slate-900/90 text-[#96c93e] border border-[#96c93e]/30 text-[9px] xl:text-sm font-black px-2 py-0.5 xl:px-3 xl:py-1.5 rounded-lg tracking-wider xl:tracking-widest uppercase">{v.title}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-black flex flex-col items-center justify-center text-slate-500">
                                                    <Youtube className="w-7 h-7 xl:w-12 xl:h-12 text-red-600 mb-1 xl:mb-2 animate-pulse" />
                                                    <span className="text-[8px] xl:text-xs font-bold uppercase tracking-wider">Abriendo YouTube...</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AboutExperience;
