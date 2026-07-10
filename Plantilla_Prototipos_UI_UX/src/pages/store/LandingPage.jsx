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


import { HeroCarousel } from '../../components/home/HeroCarousel';
import { CharacterGrid } from '../../components/home/CharacterGrid';
import { TrendingTop } from '../../components/home/TrendingTop';
import AboutExperience from '../../components/home/AboutExperience';

export const LandingView = ({ navigate, showToast }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const observerRef = useRef(null);
    const videoCarouselRef = useRef(null);
    const [playVideo, setPlayVideo] = useState(false);

    // [NUEVO] Simulación de Banners de Campaña
    const banners = [
        {
            tag: "Lanzamiento Oficial v2.0",
            title: "Viste tu Leyenda. Gana Jugando.",
            desc: "Consigue Skins exclusivas, descuentos reales y envíos gratis al vincular tu progreso del videojuego con nuestra tienda oficial.",
            btnPrimary: "Comprar Físico",
            btnSecondary: "Google Play",
            video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
            color: "from-[#96c93e]/40 via-[#96c93e]/10 to-transparent",
            accent: "#96c93e",
            char: "Balam - El Guardián"
        },
        {
            tag: "Colección Mística",
            title: "Ixchel: Sabiduría en cada Fibra.",
            desc: "Explora la nueva línea de ropa inspirada en la diosa Ixchel. Prendas premium que desbloquean cosméticos legendarios en el campo de batalla.",
            btnPrimary: "Ver Catálogo",
            btnSecondary: "YouTube Trailer",
            video: "https://www.w3schools.com/html/mov_bbb.mp4",
            color: "from-[#ec1676]/30 via-[#ec1676]/10 to-transparent",
            accent: "#ec1676",
            char: "Ixchel - La Tejedora"
        },
        {
            tag: "Torneo Estacional",
            title: "Kukul te desafía al Cenote.",
            desc: "Inscríbete al torneo relámpago de esta semana. Premios en efectivo, UUIDs únicos y el rango 'Jaguar' te esperan.",
            btnPrimary: "Participar",
            btnSecondary: "Ver Reglas",
            video: "https://www.w3schools.com/html/movie.mp4",
            color: "from-[#03bbd3]/30 via-[#03bbd3]/10 to-transparent",
            accent: "#03bbd3",
            char: "Kukul - El Místico"
        }
    ];

    // [NUEVO] Auto-scroll para carrusel de trailers y auto-slide para Hero
    useEffect(() => {
        // Intervalo para Hero Slider
        const heroInterval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % 3);
        }, 8000);

        return () => {
            clearInterval(heroInterval);
        };
    }, [playVideo]);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
        }, { threshold: 0.2 });
        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, []);

    // Función para Quick Navigation (Scroll suave)
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-0">

            {/* Quick Action Navigation */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-200 rounded-full px-2 py-1.5 shadow-xl animate-in slide-in-from-top-8">
                <button onClick={() => scrollToSection('tienda')} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-[#96c93e] hover:bg-[#96c93e]/5 rounded-full transition-colors flex items-center gap-1"><Package className="w-3 h-3" /> Tendencias</button>
                <button onClick={() => scrollToSection('personajes')} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-[#96c93e] hover:bg-[#96c93e]/5 rounded-full transition-colors flex items-center gap-1"><Gamepad2 className="w-3 h-3" /> Personajes</button>
                <button onClick={() => scrollToSection('quienes-somos')} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-[#96c93e] hover:bg-[#96c93e]/5 rounded-full transition-colors flex items-center gap-1"><Navigation className="w-3 h-3" /> Quiénes Somos</button>
            </div>

            <HeroCarousel />

            <TrendingTop navigate={navigate} showToast={showToast} />

            <CharacterGrid>
                <AboutExperience navigate={navigate} />
            </CharacterGrid>
        </div>
    );
};

// ==========================================
// 3. STORE CATALOG VIEW [REQ-FE-11 a 13]
// ==========================================

