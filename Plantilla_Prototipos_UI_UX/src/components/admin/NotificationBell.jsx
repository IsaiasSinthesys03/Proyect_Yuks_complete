import React, { useState, useEffect, useRef } from 'react';
import { Bell, Download, FileText, Loader2 } from 'lucide-react';
import { onAdminRealtimeEvent } from '../../lib/adminWs';
import { downloadReport, REPORT_ENTITIES } from '../../api/adminReports';

/**
 * NotificationBell (Fase 48, CMS-FE-19) — Campana del header del CMS.
 *
 * Escucha `report:ready` en el canal ADMIN del WebSocket (publicado por el
 * worker de reportes vía Redis Pub/Sub). Cada evento enciende el contador y
 * agrega una entrada al dropdown con su botón de descarga autenticada (blob).
 */
export const NotificationBell = ({ showToast }) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]); // { jobId, reportType, format, rowCount, at }
    const [unseen, setUnseen] = useState(0);
    const [downloading, setDownloading] = useState(null);
    // Idempotencia por jobId: el MISMO evento no se procesa dos veces
    // (reconexiones del WS, o doble socket transitorio en dev/StrictMode).
    const seenJobs = useRef(new Set());

    useEffect(() => {
        const off = onAdminRealtimeEvent('report:ready', (p) => {
            if (seenJobs.current.has(p.jobId)) return; // ya notificado
            seenJobs.current.add(p.jobId);
            setItems((prev) => [{ jobId: p.jobId, reportType: p.reportType, format: p.format, rowCount: p.rowCount, at: new Date() }, ...prev].slice(0, 10));
            setUnseen((n) => n + 1);
            showToast(`Reporte "${p.reportType}" listo (${p.rowCount} filas).`, 'success');
        });
        return off;
    }, [showToast]);

    const entityLabel = (v) => REPORT_ENTITIES.find((e) => e.value === v)?.label ?? v;

    const handleDownload = async (item) => {
        setDownloading(item.jobId);
        try {
            await downloadReport(item.jobId, `reporte-${item.reportType}`);
            showToast('Descarga iniciada.', 'success');
        } catch (e) {
            showToast(e?.response?.status === 404 ? 'El archivo aún no está disponible.' : 'No se pudo descargar el reporte.', 'error');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => { setOpen(!open); if (!open) setUnseen(0); }}
                className="relative p-2.5 bg-[#123d17] hover:bg-[#1a9a21]/30 rounded-xl text-[#e6c59e]/70 hover:text-white transition-colors"
                title="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {unseen > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#ec1676] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a2e0d] animate-pulse">{unseen}</span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-3 w-96 bg-[#0a2e0d]/95 border border-[#03bbd3]/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-4 border-b border-[#1a9a21]/20 flex items-center justify-between">
                        <p className="text-sm font-black text-white">Notificaciones</p>
                        <span className="text-[9px] text-[#03bbd3] font-bold uppercase tracking-widest">Canal Admin · WS</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {items.length === 0 && <p className="text-xs text-[#e6c59e]/55 font-bold text-center py-8">Sin notificaciones. Los reportes listos aparecerán aquí.</p>}
                        {items.map((it) => (
                            <div key={it.jobId} className="p-4 border-b border-[#1a9a21]/20 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                <div className="w-9 h-9 bg-[#96c93e]/15 border border-[#96c93e]/30 rounded-lg flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-[#96c93e]" /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-white truncate">Reporte {entityLabel(it.reportType)} listo</p>
                                    <p className="text-[10px] text-[#e6c59e]/55 font-mono">{it.rowCount} filas · {String(it.format).toUpperCase()} · {it.at.toLocaleTimeString('es-MX')}</p>
                                </div>
                                <button
                                    onClick={() => handleDownload(it)}
                                    disabled={downloading === it.jobId}
                                    className="p-2 bg-[#03bbd3] hover:bg-[#02a8be] rounded-lg text-white transition-colors shadow-lg shadow-[#03bbd3]/20 disabled:opacity-60"
                                    title="Descargar"
                                >
                                    {downloading === it.jobId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
