import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, ShoppingCart, Package, Image as ImageIcon,
    Gamepad2, Settings, ShieldAlert, FileText, HeartHandshake,
    LogOut, Lock, Search, Bell, Plus, Filter, MoreVertical,
    ChevronRight, GripVertical, AlertTriangle, CheckCircle2, CreditCard,
    Truck, ArrowRight, User, UploadCloud, ToggleRight, MonitorPlay,
    History, Eye, EyeOff, Save, Type, Bold, Italic, Link2,
    Users, Ticket, List, Menu, X, Code, Loader2, Database, Trash2, Ban, Clock,
    Wifi, ChevronLeft, Layers, Edit3,
    Youtube, Link2 as LinkIcon, Play
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage, uploadBannerVideo } from '../../api/adminMedia';
import { useAdminYoutubeVideos, createYoutubeVideo, deleteYoutubeVideo, reorderYoutubeVideos } from '../../api/adminYoutube';
import { DEFAULT_BANNERS, HeroCarousel } from '../../components/home/HeroCarousel';

/**
 * MediaView (Fase 51, CMS-FE-03) — CRUD REAL de banners del Hero.
 * Toggle isActive, eliminación, reorden por arrastre (position) y creación
 * con URL directa de imagen (el upload S3 queda para cuando haya credenciales).
 */
export const MediaView = ({ showToast }) => {
    const [title, setTitle] = useState('');
    const [tag, setTag] = useState('');
    const [description, setDescription] = useState('');
    const [accentColor, setAccentColor] = useState('#03bbd3');
    const [isActive, setIsActive] = useState(true);
    const [buttonText, setButtonText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [dragId, setDragId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(null);
    const [activeTab, setActiveTab] = useState('banners'); // 'banners' | 'youtube'

    const queryClient = useQueryClient();
    const { data: banners } = useAdminBanners();
    const sorted = [...(banners ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
        queryClient.invalidateQueries({ queryKey: ['content', 'banners'] }); // el Hero del storefront
    };

    const createMutation = useMutation({
        mutationFn: (data) => createBanner(data),
    });

    const updateExistingMutation = useMutation({
        mutationFn: ({ id, patch }) => updateBanner(id, patch),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }) => updateBanner(id, { isActive }),
        onSuccess: (_, v) => { invalidate(); showToast(v.isActive ? 'Banner Activado' : 'Banner Desactivado temporalmente', v.isActive ? 'success' : 'warning'); },
        onError: (e) => showToast(e?.response?.data?.error || 'No se pudo actualizar.', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteBanner(id),
        onSuccess: () => { invalidate(); showToast('Banner eliminado.', 'success'); },
        onError: (e) => showToast(e?.response?.data?.error || 'No se pudo eliminar.', 'error'),
    });

    /** Reorden por arrastre: intercambia `position` de origen y destino (PUT ×2). */
    const handleDrop = async (targetId) => {
        if (!dragId || dragId === targetId) return;
        const a = sorted.find(b => b.id === dragId);
        const b = sorted.find(x => x.id === targetId);
        setDragId(null);
        try {
            await updateBanner(a.id, { position: b.position ?? 0 });
            await updateBanner(b.id, { position: a.position ?? 0 });
            invalidate();
            showToast('Orden del carrusel actualizado.', 'success');
        } catch {
            showToast('No se pudo reordenar.', 'error');
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) { showToast('El Título Interno es obligatorio.', 'error'); return; }
        if (!imageUrl.trim() && !videoUrl.trim() && !imageFile && !videoFile) { showToast('Ingresa la URL de la imagen, sube un archivo o pon un video.', 'error'); return; }
        
        try {
            setUploadingImage(true);
            let finalImageUrl = (imageUrl.trim());
            let finalVideoUrl = (videoUrl.trim());
            
            if (imageFile && !finalImageUrl) {
                 finalImageUrl = 'https://s3.placeholder/temporal.webp'; // Será reemplazado por la subida real
            }
            if (videoFile && !finalVideoUrl) {
                 finalVideoUrl = 'https://s3.placeholder/temporal.mp4';
            }
            
            let savedBannerId = editingId;
            if (editingId) {
                await updateExistingMutation.mutateAsync({
                    id: editingId,
                    patch: {
                        title,
                        linkUrl,
                        tag,
                        description,
                        videoUrl: finalVideoUrl,
                        accentColor,
                        buttonText,
                        imageUrl: finalImageUrl,
                        isActive
                    }
                });
            } else {
                const res = await createMutation.mutateAsync({
                    title: title || 'Nuevo Banner',
                    imageUrl: finalImageUrl,
                    linkUrl: linkUrl || '',
                    tag: tag || '',
                    description: description || '',
                    videoUrl: finalVideoUrl,
                    accentColor: accentColor || '#03bbd3',
                    buttonText: buttonText || '',
                    position: sorted.length,
                    isActive,
                });
                savedBannerId = res?.id || res?.data?.id || res;
            }

            if (imageFile) {
                 await uploadBannerImage(savedBannerId, imageFile);
            }
            if (videoFile) {
                 await uploadBannerVideo(savedBannerId, videoFile);
            }
            
            invalidate(); 
            setTitle('');
            setTag('');
            setDescription('');
            setAccentColor('#03bbd3');
            setButtonText('');
            setIsActive(true);
            setLinkUrl('');
            setImageUrl(''); setVideoUrl(''); setImageFile(null); setVideoFile(null);
            showToast('Banner guardado y añadido al carrusel.', 'success');
        } catch (e) {
             showToast(e?.response?.data?.error || 'No se pudo guardar el banner.', 'error');
        } finally {
             setUploadingImage(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            <div>
                <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">Media Manager</h1>
                <p className="text-[#e6c59e]/70 mt-1">Configuración del Hero Carousel 3D Multicapa y Videos Promocionales.</p>
            </div>

            <div className="flex gap-4 border-b border-[#1a9a21]/30 pb-2">
                <button
                    onClick={() => setActiveTab('banners')}
                    className={`font-bold pb-2 transition-colors ${activeTab === 'banners' ? 'text-[#03bbd3] border-b-2 border-[#03bbd3]' : 'text-[#e6c59e]/55 hover:text-[#e6c59e]/90'}`}
                >
                    Hero Banners
                </button>
                <button
                    onClick={() => setActiveTab('youtube')}
                    className={`font-bold pb-2 transition-colors ${activeTab === 'youtube' ? 'text-[#03bbd3] border-b-2 border-[#03bbd3]' : 'text-[#e6c59e]/55 hover:text-[#e6c59e]/90'}`}
                >
                    Videos YouTube
                </button>
            </div>

            {activeTab === 'banners' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">

                <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">Gestión de Banners</h3>
                        <button 
                            onClick={() => {
                                setTitle('');
                                setTag('');
                                setDescription('');
                                setAccentColor('#03bbd3');
                                setIsActive(true);
                                setLinkUrl('');
                                setImageUrl('');
                                setVideoUrl('');
                                setImageFile(null);
                                setVideoFile(null);
                                setEditingId(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 font-bungee text-[9px] leading-none bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] px-4 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(150,201,62,0.3)]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Nuevo Banner
                        </button>
                    </div>
                    <div className="space-y-3">
                        {sorted.length === 0 && (
                            <div className="text-center py-6 border border-dashed border-[#1a9a21]/30 rounded-2xl bg-[#0a2e0d]/30 mb-4">
                                <p className="text-xs text-[#e6c59e]/70 font-bold px-4">No hay banners agregados aún.</p>
                                <p className="text-[10px] text-[#e6c59e]/55 mt-2">Haz clic en <span className="text-[#03bbd3]">+ Nuevo Banner</span> para agregar el primero.</p>
                            </div>
                        )}
                        {sorted.map((b, i) => (
                            <div
                                key={b.id}
                                draggable
                                onDragStart={() => setDragId(b.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(b.id)}
                                className={`bg-[#0a2e0d] border border-[#1a9a21]/30 p-3 rounded-xl flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-[#03bbd3]/50 transition-colors ${b.isActive ? '' : 'opacity-60'}`}
                            >
                                <GripVertical className="text-[#e6c59e]/55" />
                                <div className="w-16 h-10 bg-[#123d17] rounded flex items-center justify-center relative overflow-hidden">
                                    {b.imageUrl && /\.(mp4|webm)($|\?)/i.test(b.imageUrl)
                                        ? <MonitorPlay className="w-5 h-5 text-[#e6c59e]/55" />
                                        : b.imageUrl
                                            ? <img src={b.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            : <ImageIcon className="w-5 h-5 text-[#e6c59e]/55" />}
                                    {b.isActive && <div className="absolute inset-0 border-2 border-[#03bbd3] rounded opacity-50"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{b.title}</p>
                                    <p className="text-[10px] text-[#e6c59e]/70 flex items-center gap-1 truncate"><LinkIcon className="w-3 h-3 shrink-0" /> {b.linkUrl || 'sin enlace'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setPreviewIndex(i)}
                                        className="flex items-center justify-center p-1.5 text-[#e6c59e]/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Vista Previa"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                            <button 
                                                onClick={() => {
                                                    setTitle(b.title || '');
                                                    setTag(b.tag || '');
                                                    setDescription(b.description || '');
                                                    setAccentColor(b.accentColor || '#03bbd3');
                                                    setButtonText(b.buttonText || '');
                                                    setIsActive(b.isActive !== false);
                                                    setLinkUrl(b.linkUrl || '');
                                                    setImageUrl(b.imageUrl || '');
                                                    setVideoUrl(b.videoUrl || '');
                                                    setEditingId(b.id);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="flex items-center justify-center p-1.5 text-[#e6c59e]/70 hover:text-[#03bbd3] hover:bg-[#03bbd3]/10 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                    <button
                                        onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                            b.isActive 
                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                            : 'bg-[#123d17] text-[#e6c59e]/70 hover:bg-[#1a9a21]/30'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-emerald-400' : 'bg-[#e6c59e]/40'}`}></div>
                                        {b.isActive ? 'Activo' : 'Oculto'}
                                    </button>
                                    <Trash2 onClick={() => deleteMutation.mutate(b.id)} className="w-4 h-4 text-[#e6c59e]/40 hover:text-red-400 cursor-pointer transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 space-y-6 shadow-2xl">
                    <h3 className="font-bold text-white border-b border-[#1a9a21]/30 pb-2 flex items-center gap-2"><Layers className="w-5 h-5 text-[#03bbd3]" /> Creador Multicapa 3D</h3>
                    <div className="space-y-4">

                        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#e6c59e]/70 mb-1 uppercase">Tag Superior</label>
                                <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="Ej. Lanzamiento Oficial" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#e6c59e]/70 mb-1 uppercase">Título Principal</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Viste tu Leyenda." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#e6c59e]/70 mb-1 uppercase">Descripción</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Párrafo corto del banner..." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none h-20 resize-none" />
                        </div>

                        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#e6c59e]/70 mb-1 uppercase">Color de Acento</label>
                                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-full h-[42px] bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl p-1 cursor-pointer outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#e6c59e]/70 mb-1 uppercase">Texto del Botón (Opcional)</label>
                                <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Ej: Descargar en Google Play" className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#03bbd3] transition-colors" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#e6c59e]/70 mb-1 uppercase">Enlace del Botón (URL)</label>
                                <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Ej: https://play.google.com/..." className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#03bbd3] transition-colors" />
                            </div>
                        </div>



                        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-[10px] font-bold text-[#e6c59e]/70 mb-1 uppercase text-center">Capa 1: Fondo Base (BG)</label>
                                <label className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${videoFile ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[#1a9a21]/35 bg-[#0a2e0d]/50 text-[#e6c59e]/55 hover:border-[#03bbd3]/50'}`}>
                                    {uploadingImage ? (
                                        <Loader2 className="w-6 h-6 animate-spin mb-1" />
                                    ) : videoFile ? (
                                        <CheckCircle2 className="w-6 h-6 mb-1" />
                                    ) : (
                                        <UploadCloud className="w-6 h-6 mb-1" />
                                    )}
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="video/mp4, video/webm, image/jpeg, image/png, image/webp" 
                                        onChange={e => {
                                            setVideoFile(e.target.files?.[0]);
                                            setVideoUrl(''); // Clear manual URL if any
                                        }}
                                        disabled={uploadingImage}
                                    />
                                    {videoFile ? (
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold block">¡Cargado con éxito!</span>
                                            <span className="text-[9px] truncate max-w-[120px] block opacity-80">{videoFile.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[9px] font-bold">Subir MP4 o Imagen</span>
                                    )}
                                </label>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#03bbd3] mb-1 uppercase text-center">Capa 2: SVG Frontal (3D)</label>
                                <label className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${imageFile ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[#03bbd3]/30 bg-[#03bbd3]/5 text-[#03bbd3] hover:border-[#03bbd3]/50'}`}>
                                    {uploadingImage ? (
                                        <Loader2 className="w-6 h-6 animate-spin mb-1" />
                                    ) : imageFile ? (
                                        <CheckCircle2 className="w-6 h-6 mb-1" />
                                    ) : (
                                        <UploadCloud className="w-6 h-6 mb-1" />
                                    )}
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="image/jpeg, image/png, image/webp" 
                                        onChange={e => {
                                            setImageFile(e.target.files?.[0]);
                                            setImageUrl(''); // Clear manual URL if any
                                        }}
                                        disabled={uploadingImage}
                                    />
                                    {imageFile ? (
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold block">¡Cargado con éxito!</span>
                                            <span className="text-[9px] truncate max-w-[120px] block opacity-80">{imageFile.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[9px] font-bold">Subir a Cloudflare R2</span>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-[#1a9a21]/30 flex items-center justify-between">
                            <div>
                                <label className="block text-xs font-bold text-white mb-0.5">Estatus del Banner</label>
                                <p className="text-[10px] text-[#e6c59e]/55">¿Visible para el público?</p>
                            </div>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    isActive 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-[#123d17] text-[#e6c59e]/70 border border-[#1a9a21]/30'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-[#e6c59e]/40'}`}></div>
                                {isActive ? 'Habilitado' : 'Deshabilitado'}
                            </button>
                        </div>

                        <button onClick={handleCreate} disabled={uploadingImage} className="w-full bg-[#03bbd3] hover:bg-[#02a8be] text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-[#03bbd3]/20 flex items-center justify-center gap-2 disabled:opacity-60">
                            {uploadingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : (editingId ? 'Guardar Cambios' : 'Añadir al Carrusel')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Vista Previa a Pantalla Completa para respetar medidas exactas */}
            {previewIndex !== null && (
                <div className="fixed inset-0 z-[100] animate-in fade-in bg-black">
                    <button 
                        onClick={() => setPreviewIndex(null)}
                        className="absolute top-6 right-6 text-white hover:text-[#03bbd3] bg-black/40 hover:bg-black/80 backdrop-blur-md p-4 rounded-full transition-all z-[110] shadow-2xl border border-[#1a9a21]/30"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    
                    <div className="w-full h-full relative bg-cover bg-top bg-no-repeat flex flex-col justify-center" style={{ backgroundImage: "url('/assets/imgWeb/Banner_Tienda/Fondo_2.png')" }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2e0d]/50 via-[#3a2212]/30 to-[#3a2212]/80 pointer-events-none z-0"></div>
                        <div className="relative z-10 w-full flex items-center justify-center">
                            {(() => {
                                const allPreviewBanners = sorted.map((b, i) => ({
                                    tag: b.tag || b.title,
                                    title: b.title,
                                    desc: b.description || "Consigue Skins exclusivas, descuentos reales y envíos gratis al vincular tu progreso del videojuego con nuestra tienda oficial.",
                                    video: b.videoUrl || "/assets/mp4/VID_Mario.mp4",
                                    accent: b.accentColor || '#03bbd3',
                                    char: b.title,
                                    image: b.imageUrl || undefined,
                                    buttonText: b.buttonText || undefined,
                                    videoClass: "absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 mix-blend-normal",
                                }));
                                return <HeroCarousel initialSlide={previewIndex} isSinglePreview={true} previewBanners={allPreviewBanners} />;
                            })()}
                        </div>
                    </div>
                </div>
            )}
                </>
            ) : (
                <YoutubeVideoManager showToast={showToast} />
            )}
        </div>
    );
};


const YoutubeVideoManager = ({ showToast }) => {
    const { data: videos, refetch } = useAdminYoutubeVideos();
    const sorted = [...(videos ?? [])].sort((a, b) => a.position - b.position);

    const queryClient = useQueryClient();
    
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [dragId, setDragId] = useState(null);

    const handleCreate = async () => {
        if (!youtubeUrl) {
            showToast('Ingresa un link de YouTube', 'error');
            return;
        }
        setLoading(true);
        try {
            await createYoutubeVideo({ youtube_url: youtubeUrl, title: title || undefined });
            refetch();
            setYoutubeUrl('');
            setTitle('');
            showToast('Video añadido', 'success');
        } catch (e) {
            const backendMsg = e.response?.data?.error || e.response?.data?.message;
            showToast(backendMsg || e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteYoutubeVideo(id);
            refetch();
            showToast('Video eliminado', 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    const handleDrop = async (targetId) => {
        if (!dragId || dragId === targetId) return;
        
        const draggedIndex = sorted.findIndex(v => v.id === dragId);
        const targetIndex = sorted.findIndex(v => v.id === targetId);
        
        const newSorted = [...sorted];
        const [draggedItem] = newSorted.splice(draggedIndex, 1);
        newSorted.splice(targetIndex, 0, draggedItem);
        
        // optimistic update
        queryClient.setQueryData(['admin', 'youtube'], newSorted.map((v, i) => ({ ...v, position: i })));

        const orders = newSorted.map((v, i) => ({ id: v.id, position: i }));
        setDragId(null);

        try {
            await reorderYoutubeVideos(orders);
            refetch();
            showToast('Orden actualizado', 'success');
        } catch (e) {
            showToast('Error al reordenar', 'error');
            refetch();
        }
    };

    return (
                <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Youtube className="text-red-500 w-6 h-6" /> Gestor de Videos YouTube
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Formulario */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 mb-1 uppercase">Link de YouTube</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e6c59e]/55" />
                            <input
                                type="text"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="Ej: https://www.youtube.com/watch?v=..."
                                className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#e6c59e]/70 mb-1 uppercase">Título (Opcional)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Tráiler Oficial"
                            className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Añadir Video</>}
                    </button>
                </div>

                {/* Lista */}
                <div>
                    <h3 className="text-sm font-bold text-[#e6c59e]/70 mb-4 uppercase">Carrusel de Videos</h3>
                    {sorted.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-[#1a9a21]/30 rounded-2xl bg-[#0a2e0d]/30">
                            <Youtube className="w-8 h-8 text-[#e6c59e]/40 mx-auto mb-2" />
                            <p className="text-sm text-[#e6c59e]/70 font-bold">Sin videos añadidos.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {sorted.map((v) => (
                                <div
                                    key={v.id}
                                    draggable
                                    onDragStart={() => setDragId(v.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(v.id)}
                                    className="bg-[#0a2e0d] border border-[#1a9a21]/30 p-3 rounded-xl flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-red-500/50 transition-colors group"
                                >
                                    <GripVertical className="text-[#e6c59e]/55" />
                                    <div className="w-24 aspect-video bg-black rounded overflow-hidden relative">
                                        <img src={`https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`} className="w-full h-full object-cover" alt={v.title} />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Play className="w-5 h-5 text-white opacity-80" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{v.title}</p>
                                        <p className="text-xs text-[#e6c59e]/55 truncate">ID: {v.video_id}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="p-2 text-[#e6c59e]/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 3.8 GAME BRIDGE
