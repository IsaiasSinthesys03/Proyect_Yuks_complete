import React, { useEffect, useState, useRef } from 'react';
import {
    ShieldAlert, FileText, Loader2, AlertTriangle, CheckCircle2,
    History, UploadCloud, FileCheck, FileDown, ExternalLink
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../../lib/adminApi';

const errorMessage = (error) => error.response?.data?.details || error.response?.data?.error || error.response?.data?.message || 'No fue posible completar la operación.';

export const LegalView = ({ showToast }) => {
    const queryClient = useQueryClient();
    const [slug, setSlug] = useState(null);

    const documentsQuery = useQuery({
        queryKey: ['admin', 'legal'],
        queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/legal')),
    });

    useEffect(() => {
        if (!slug && documentsQuery.data?.length) setSlug(documentsQuery.data[0].slug);
    }, [documentsQuery.data, slug]);

    const documentQuery = useQuery({
        queryKey: ['admin', 'legal', slug],
        queryFn: async () => unwrapAdmin(await adminApi.get(`/api/admin/legal/${slug}`)),
        enabled: Boolean(slug),
    });

    const fileInputRef = useRef(null);
    const uploadPdfMutation = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            return unwrapAdmin(await adminApi.post(`/api/admin/legal/${slug}/pdf`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }));
        },
        onSuccess: (document) => {
            queryClient.setQueryData(['admin', 'legal', slug], document);
            queryClient.invalidateQueries({ queryKey: ['admin', 'legal'], exact: true });
            showToast(`PDF oficial publicado en la versión ${document.version}.`, 'success');
        },
        onError: (error) => showToast(errorMessage(error), 'error'),
    });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                showToast('Solo se permiten archivos PDF', 'error');
                e.target.value = '';
                return;
            }
            if (file.size > 8 * 1024 * 1024) {
                showToast('El PDF no debe superar los 8MB', 'error');
                e.target.value = '';
                return;
            }
            uploadPdfMutation.mutate(file);
        }
        e.target.value = '';
    };

    const documents = documentsQuery.data ?? [];
    const current = documentQuery.data;

    return (
        <>
            {uploadPdfMutation.isPending && (
                <div className="fixed inset-0 z-[100] bg-[#0a2e0d]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-16 h-16 text-[#03bbd3] animate-spin mb-4" />
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Subiendo documento...</h2>
                    <p className="text-[#e6c59e]/90 text-center max-w-sm">Por favor espera un momento mientras procesamos y aseguramos tu documento oficial. No cierres esta ventana.</p>
                </div>
            )}
            <div className="space-y-4 animate-in fade-in w-full flex flex-col px-2 lg:px-6 pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8 text-[#96c93e]" />
                            Documentos Legales (PDF)
                        </h1>
                        <p className="text-[#e6c59e]/70 mt-1">Sube y reemplaza las políticas oficiales de la tienda en formato PDF.</p>
                    </div>
                </div>

                <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-2xl flex flex-col shadow-2xl">
                    {/* Tabs de Documentos */}
                    <div className="flex bg-[#0a2e0d] border-b border-[#1a9a21]/30 overflow-x-auto custom-scrollbar rounded-t-2xl">
                        {documents.map((document) => (
                            <button
                                key={document.slug}
                                onClick={() => setSlug(document.slug)}
                                className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${document.slug === slug ? 'text-[#96c93e] border-b-2 border-[#96c93e] bg-[#123d17]/50' : 'text-[#e6c59e]/70 hover:bg-[#123d17] hover:text-white'}`}
                            >
                                <FileText className="w-4 h-4" />
                                {document.title}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col xl:flex-row">
                        {/* Panel Izquierdo: Visor / Uploader de PDF */}
                        <div className="flex-1 min-w-0 flex flex-col xl:border-r border-[#1a9a21]/30 relative">
                            {documentQuery.isPending && (
                                <div className="flex-1 flex flex-col items-center justify-center text-[#e6c59e]/70 py-32">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                    <p>Cargando información...</p>
                                </div>
                            )}

                            {documentQuery.isError && (
                                <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-8 text-center py-32">
                                    <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                                    <p>No fue posible cargar el documento.</p>
                                </div>
                            )}

                            {!documentQuery.isPending && !documentQuery.isError && current && (
                                <div className="flex-1 flex flex-col bg-[#0a2e0d]/20 p-2">
                                    {current.pdfUrl ? (
                                        <div className="flex flex-col bg-[#0a2e0d]/50 rounded-xl border border-[#1a9a21]/30 overflow-hidden">
                                            <div className="bg-[#123d17]/80 px-4 py-3 border-b border-[#1a9a21]/30 flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-white font-semibold">
                                                    <FileCheck className="w-5 h-5 text-[#96c93e]" />
                                                    Vista previa del PDF actual
                                                </div>
                                                <a href={current.pdfUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 hover:text-white border border-indigo-500/30">
                                                    <ExternalLink className="w-4 h-4" /> Abrir en nueva pestaña
                                                </a>
                                            </div>
                                            <div className="w-full bg-[#e6c59e] flex flex-col">
                                                <iframe src={`${current.pdfUrl}#view=FitH&toolbar=0`} className="w-full h-[70vh] min-h-[520px] xl:h-[2500px] border-none" title={`PDF de ${current.title}`} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#1a9a21]/30 rounded-xl bg-[#0a2e0d]/20">
                                            <div className="w-20 h-20 bg-[#123d17] rounded-full flex items-center justify-center mb-6 shadow-inner">
                                                <FileDown className="w-10 h-10 text-[#e6c59e]/70" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Aún no hay un PDF subido</h3>
                                            <p className="text-[#e6c59e]/70 max-w-md text-center mb-8">
                                                Este documento legal no tiene ningún archivo PDF asociado. Sube uno para que sea visible públicamente en la tienda.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Panel Derecho: Info y Versiones */}
                        <div className="w-full xl:w-80 bg-[#0a2e0d]/50 border-t xl:border-t-0 xl:border-l border-[#1a9a21]/30 relative">
                            <div className="p-4 sm:p-6 flex flex-col xl:sticky xl:top-6 h-fit">
                                <h4 className="text-xs font-bold text-[#e6c59e]/70 uppercase mb-4 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Estado y Versión
                                </h4>
                                
                                <div className="space-y-4 flex-1">
                                    {current ? (
                                        <div className="p-4 bg-[#96c93e]/10 border border-[#96c93e]/30 rounded-xl shadow-inner">
                                            <div className="text-[#96c93e] text-sm font-black mb-1">Versión {current.version}</div>
                                            <div className="text-xs text-[#96c93e]/70 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Activo en tienda
                                            </div>
                                            <div className="text-xs text-[#e6c59e]/70 mt-3 pt-3 border-t border-[#96c93e]/20">
                                                Última modificación:<br />
                                                <span className="text-white font-medium">{new Date(current.updatedAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-[#123d17] border border-[#1a9a21]/30 rounded-xl text-[#e6c59e]/70 text-sm">
                                            Selecciona un documento
                                        </div>
                                    )}

                                    <div className="p-4 bg-[#123d17]/40 border border-[#1a9a21]/20 rounded-xl text-xs text-[#e6c59e]/70 leading-relaxed">
                                        <strong className="text-white block mb-1">Formato requerido:</strong>
                                        Solo se admiten documentos en formato <strong>.PDF</strong>.<br /><br />
                                        El tamaño máximo permitido es de <strong>8MB</strong> por archivo.
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    disabled={!current || uploadPdfMutation.isPending}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] disabled:bg-[#123d17] disabled:text-[#e6c59e]/40 disabled:border-[#1a9a21]/30 disabled:border text-white px-6 py-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:shadow-none"
                                >
                                    {uploadPdfMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                    {uploadPdfMutation.isPending ? 'Subiendo...' : (current?.pdfUrl ? 'Reemplazar PDF' : 'Subir Nuevo PDF')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
