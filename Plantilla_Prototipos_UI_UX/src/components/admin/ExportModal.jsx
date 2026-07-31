import React, { useState } from 'react';
import { X, Database, Loader2, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { generateReport, REPORT_ENTITIES } from '../../api/adminReports';

/**
 * ExportModal (Fase 48, CMS-FE-18) — Generador de reportes ASÍNCRONO.
 *
 * POST /api/admin/reports responde 202 con un jobId: la UI NO espera el
 * archivo (lo genera el worker de BullMQ). El aviso de "listo" llega por
 * WebSocket (`report:ready`) a la campana del header, donde se descarga.
 */
export const ExportModal = ({ isOpen, close, showToast }) => {
    const [reportType, setReportType] = useState('sales');
    const [format, setFormat] = useState('csv');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const exportMutation = useMutation({
        mutationFn: () => generateReport({ reportType, format, startDate: startDate || undefined, endDate: endDate || undefined }),
        onSuccess: (r) => {
            showToast(`Reporte encolado (job ${r.jobId.slice(0, 8)}…). La campana te avisará al terminar.`, 'success');
            close();
        },
        onError: (e) => showToast(e?.response?.data?.error || e?.response?.data?.message || 'No se pudo encolar el reporte.', 'error'),
    });

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-[#061f09]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={close}>
            <div className="mobile-scroll-safe bg-[#0a2e0d]/95 border border-[#1a9a21]/30 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl shadow-black/50 p-5 sm:p-8 animate-in zoom-in-95 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={close} className="absolute top-5 right-5 text-[#e6c59e]/55 hover:text-white"><X className="w-5 h-5" /></button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#03bbd3]/20 border border-[#03bbd3]/30 rounded-xl flex items-center justify-center"><Database className="w-5 h-5 text-[#03bbd3]" /></div>
                    <div>
                        <h2 className="text-lg font-black text-white tracking-tight">Exportar Reporte</h2>
                        <p className="text-[10px] text-[#e6c59e]/55 font-bold uppercase tracking-widest">Generación asíncrona (BullMQ)</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest">Entidad</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full bg-[#123d17] border border-[#1a9a21]/30 text-sm text-[#e6c59e] px-4 py-3 rounded-xl outline-none cursor-pointer focus:border-[#03bbd3]">
                            {REPORT_ENTITIES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest">Desde</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-[#123d17] border border-[#1a9a21]/30 text-sm text-[#e6c59e] px-4 py-3 rounded-xl outline-none focus:border-[#03bbd3]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest">Hasta</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-[#123d17] border border-[#1a9a21]/30 text-sm text-[#e6c59e] px-4 py-3 rounded-xl outline-none focus:border-[#03bbd3]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-[#e6c59e]/55 uppercase tracking-widest">Formato</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['csv', 'json'].map((f) => (
                                <button key={f} type="button" onClick={() => setFormat(f)}
                                    className={`py-3 rounded-xl font-black text-sm uppercase tracking-widest border transition-colors ${format === f ? 'bg-[#03bbd3] text-white border-[#03bbd3]' : 'bg-[#123d17] text-[#e6c59e]/70 border-[#1a9a21]/30 hover:text-white'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#ffce07]/10 border border-[#ffce07]/20 p-3 rounded-xl flex items-start gap-3">
                        <Clock className="w-4 h-4 text-[#ffce07] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#ffce07]/90 font-bold leading-relaxed uppercase tracking-tight">El archivo se genera en segundo plano. La campana 🔔 te avisará cuando esté listo para descargar.</p>
                    </div>
                    <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}
                        className="w-full bg-[#96c93e] hover:bg-[#85b237] text-[#061f09] font-black py-4 rounded-2xl transition-colors shadow-lg shadow-[#96c93e]/20 flex items-center justify-center gap-2 disabled:opacity-60 uppercase tracking-widest text-sm">
                        {exportMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Encolando…</> : <><Database className="w-4 h-4" /> Encolar Exportación</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
