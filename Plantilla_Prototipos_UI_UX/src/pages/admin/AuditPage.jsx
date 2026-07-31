import React, { useState } from 'react';
import {
    History, Search, X, Code, Loader2, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, FileDiff
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../../lib/adminApi';

// --- DICCIONARIOS DE TRADUCCIÓN ---
const ACTION_DICT = {
    'CREATE': 'Creó registro',
    'UPDATE': 'Actualizó información',
    'SOFT_DELETE': 'Envió a papelera',
    'RESTORE': 'Restauró',
    'DELETE': 'Eliminó permanentemente',
    'LOGIN': 'Inició sesión',
    'LOGOUT': 'Cerró sesión',
    'BAN': 'Baneó usuario',
    'REFUND': 'Reembolsó pago'
};

const ENTITY_DICT = {
    'products': 'Producto',
    'orders': 'Pedido',
    'users': 'Usuario',
    'legal_documents': 'Documento Legal',
    'coupons': 'Cupón',
    'site_config': 'Configuración del Sitio',
    'inventory': 'Inventario',
    'donations': 'Donación',
    'banners': 'Banner Promocional',
    'youtube_videos': 'Video de YouTube'
};

const KEY_DICT = {
    'id': 'ID',
    'name': 'Nombre',
    'title': 'Título',
    'description': 'Descripción',
    'price': 'Precio',
    'price_mxn': 'Precio (MXN)',
    'stock_quantity': 'Cantidad en Stock',
    'stock': 'Inventario',
    'is_active': 'Estado Activo',
    'status': 'Estado',
    'pdfUrl': 'Enlace del PDF',
    'created_at': 'Fecha de Creación',
    'updated_at': 'Fecha de Actualización',
    'deleted_at': 'Fecha de Eliminación',
    'email': 'Correo Electrónico',
    'role': 'Rol de Usuario',
    'amount': 'Monto'
};

// Utilidad para formatear valores booleanos o vacíos
const formatValue = (val) => {
    if (val === true) return 'Sí';
    if (val === false) return 'No';
    if (val === null || val === undefined) return 'Vacio / Ninguno';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

// Utilidad para formatear llaves usando el diccionario
const formatKey = (key) => {
    if (KEY_DICT[key]) return KEY_DICT[key];
    // Formato fallback: de 'esto_es_una_llave' a 'Esto Es Una Llave'
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const DiffViewer = ({ oldValue, newValue }) => {
    const oldObj = oldValue || {};
    const newObj = newValue || {};
    const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
    
    // Ignorar campos del sistema que no interesan al usuario final
    const ignoredKeys = ['created_at', 'updated_at', 'deleted_at'];
    const validKeys = keys.filter(k => !ignoredKeys.includes(k));
    
    const diffs = validKeys.filter(k => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]));

    if (diffs.length === 0) {
         return (
            <div className="text-[#e6c59e]/70 text-sm text-center py-12 bg-[#061f09] rounded-xl border border-dashed border-[#1a9a21]/20">
                No hay diferencias registradas o los cambios son internos del sistema.
            </div>
         );
    }

    return (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-[#e6c59e]/55 mb-2 px-2 sticky top-0 bg-[#0a2e0d] py-2 border-b border-[#1a9a21]/20">
                <div>Valor Anterior (Antes)</div>
                <div>Valor Nuevo (Después)</div>
            </div>
            {diffs.map(key => {
                const oldVal = formatValue(oldObj[key]);
                const newVal = formatValue(newObj[key]);
                const displayKey = formatKey(key);
                
                return (
                    <div key={key} className="grid grid-cols-2 gap-4 text-xs border-b border-[#1a9a21]/15 pb-3 mb-1">
                        <div className="bg-red-950/30 text-red-400 p-3 rounded-lg border border-red-900/20 overflow-x-auto whitespace-pre-wrap">
                            <span className="font-bold text-red-500 mb-1 block">{displayKey}:</span> 
                            <span className="line-through opacity-80">{oldVal}</span>
                        </div>
                        <div className="bg-green-950/30 text-green-400 p-3 rounded-lg border border-green-900/20 overflow-x-auto whitespace-pre-wrap">
                            <span className="font-bold text-green-500 mb-1 block">{displayKey}:</span> 
                            <span>{newVal}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const SimpleViewer = ({ payload }) => {
    const obj = payload || {};
    const keys = Object.keys(obj).filter(k => !['created_at', 'updated_at', 'deleted_at'].includes(k));
    
    if (keys.length === 0) {
        return (
            <div className="text-[#e6c59e]/70 text-sm text-center py-12 bg-[#061f09] rounded-xl border border-dashed border-[#1a9a21]/20">
                No hay detalles adicionales para esta acción.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {keys.map(key => (
                <div key={key} className="bg-[#061f09]/50 p-3 rounded-lg border border-[#1a9a21]/20 flex flex-col md:flex-row md:items-center gap-2">
                    <span className="font-bold text-[#e6c59e]/70 text-xs md:w-1/3">{formatKey(key)}:</span>
                    <span className="text-[#e6c59e] text-sm">{formatValue(obj[key])}</span>
                </div>
            ))}
        </div>
    );
};

export const AuditView = () => {
    const [selectedLog, setSelectedLog] = useState(null);
    const [date, setDate] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [action, setAction] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    const logsQuery = useQuery({
        queryKey: ['admin', 'audit-logs', adminEmail, action, date, page],
        queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/audit-logs', { 
            params: { 
                page, 
                limit, 
                adminEmail: adminEmail || undefined, 
                action: action || undefined,
                date: date || undefined
            } 
        })),
        keepPreviousData: true
    });

    const logs = logsQuery.data?.data ?? [];
    const totalPages = logsQuery.data?.totalPages ?? 1;

    const handleClearFilters = () => {
        setDate('');
        setAdminEmail('');
        setAction('');
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto relative pb-20 px-2 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight flex items-center gap-3">
                        <History className="w-8 h-8 text-[#03bbd3]" /> Historial de Actividad
                    </h1>
                    <p className="text-[#e6c59e]/70 mt-1">Registro detallado de todas las acciones importantes realizadas por el equipo.</p>
                </div>
                <div className="grid w-full grid-cols-1 min-[390px]:grid-cols-[auto_1fr] gap-3 md:flex md:w-auto md:flex-wrap md:items-center">
                    <button 
                        onClick={handleClearFilters}
                        title="Limpiar filtros"
                        className="bg-[#123d17] hover:bg-[#1a9a21]/30 text-[#e6c59e]/90 p-2.5 rounded-xl transition-colors border border-[#1a9a21]/30 shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <input
                        value={date} 
                        onChange={(e) => { setDate(e.target.value); setPage(1); }} 
                        type="date" 
                        className="w-full bg-black/40 border border-[#1a9a21]/30 text-sm text-[#e6c59e] px-4 py-2.5 rounded-xl outline-none focus:border-[#03bbd3]/50 transition-colors"
                    />
                    <div className="relative col-span-full md:col-auto">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-[#e6c59e]/55" />
                        <input 
                            value={adminEmail} 
                            onChange={(e) => { setAdminEmail(e.target.value); setPage(1); }} 
                            type="text" 
                            placeholder="Buscar por correo..." 
                            className="bg-black/40 border border-[#1a9a21]/30 text-sm rounded-xl pl-9 pr-4 py-2.5 text-white w-full md:w-48 lg:w-64 outline-none focus:border-[#03bbd3]/50 transition-colors"
                        />
                    </div>
                    <select 
                        value={action} 
                        onChange={(e) => { setAction(e.target.value); setPage(1); }} 
                        className="col-span-full w-full bg-black/40 border border-[#1a9a21]/30 text-[#e6c59e]/90 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#03bbd3]/50 transition-colors md:col-auto md:w-auto"
                    >
                        <option value="">Todas las Acciones</option>
                        {Object.entries(ACTION_DICT).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="font-quicksand w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#0a2e0d]/80 border-b border-[#1a9a21]/30">
                            <tr className="text-[#e6c59e]/70">
                                <th className="px-6 py-4 font-bold">Fecha y Hora</th>
                                <th className="px-6 py-4 font-bold">Administrador responsable</th>
                                <th className="px-6 py-4 font-bold">Dispositivo/Ubicación (IP)</th>
                                <th className="px-6 py-4 font-bold text-center">Detalle del Cambio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a9a21]/20">
                            {logsQuery.isPending && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-[#e6c59e]/70">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#03bbd3]" />
                                        Consultando historial...
                                    </td>
                                </tr>
                            )}
                            {logsQuery.isError && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-red-400">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                        No fue posible cargar el historial. Revisa tu conexión.
                                    </td>
                                </tr>
                            )}
                            {!logsQuery.isPending && !logsQuery.isError && logs.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-[#e6c59e]/55">
                                        <History className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                        No se encontraron registros para estos filtros.
                                    </td>
                                </tr>
                            )}
                            {logs.map((log) => {
                                const actionText = ACTION_DICT[log.action] || log.action;
                                const entityText = ENTITY_DICT[log.entityType] || formatKey(log.entityType);
                                
                                return (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-[#e6c59e]/70 font-mono text-xs">
                                            {new Date(log.createdAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 text-[#e6c59e] font-bold">
                                            {log.adminEmail}
                                            <div className="text-xs font-mono text-[#03bbd3] mt-1.5 flex items-center gap-1.5">
                                                <span className="bg-[#03bbd3]/10 text-[#03bbd3] px-2 py-0.5 rounded font-bold">{actionText}</span>
                                                <span className="text-[#e6c59e]/55">en</span>
                                                <span className="text-[#e6c59e]/90 font-medium">{entityText}</span>
                                                <span className="text-[#e6c59e]/40 truncate max-w-[120px] inline-block align-bottom" title={`ID: ${log.entityId}`}>
                                                    (Ref: {log.entityId.slice(0, 8)}...)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#e6c59e]/55 font-mono text-xs">
                                            {log.ipAddress}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setSelectedLog({ ...log, actionText, entityText })} 
                                                className="text-[#e6c59e]/70 hover:text-white bg-[#123d17] hover:bg-[#1a9a21]/30 px-4 py-2 rounded-xl border border-[#1a9a21]/30 flex items-center justify-center mx-auto gap-2 text-xs font-bold transition-colors shadow-sm"
                                            >
                                                <FileDiff className="w-4 h-4" /> Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Paginación */}
                <div className="bg-[#0a2e0d]/50 border-t border-[#1a9a21]/30 p-4 flex flex-col min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between gap-3">
                    <div className="text-xs text-[#e6c59e]/70 font-medium">
                        Mostrando página <span className="text-white font-bold">{page}</span> de <span className="text-white font-bold">{totalPages}</span>
                        {logsQuery.data?.total ? ` (${logsQuery.data.total} registros en total)` : ''}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            disabled={page <= 1} 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="p-2 bg-[#123d17] text-[#e6c59e]/90 rounded-lg hover:bg-[#1a9a21]/30 disabled:opacity-50 disabled:cursor-not-allowed border border-[#1a9a21]/30 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            disabled={page >= totalPages} 
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-[#123d17] text-[#e6c59e]/90 rounded-lg hover:bg-[#1a9a21]/30 disabled:opacity-50 disabled:cursor-not-allowed border border-[#1a9a21]/30 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {selectedLog && (
                <div className="fixed inset-0 bg-[#061f09]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 lg:p-8">
                    <div className="bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start gap-3 p-4 sm:p-6 border-b border-[#1a9a21]/20">
                            <div>
                                <h3 className="text-xl text-white font-black flex items-center gap-2">
                                    <History className="w-5 h-5 text-[#03bbd3]" />
                                    Detalle de Auditoría
                                </h3>
                                <p className="text-sm text-[#e6c59e]/70 font-medium mt-1">
                                    <span className="text-white">{selectedLog.adminEmail}</span> {selectedLog.actionText.toLowerCase()} <span className="text-white">{selectedLog.entityText.toLowerCase()}</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-[#e6c59e]/55 hover:text-white bg-[#123d17] hover:bg-[#1a9a21]/30 p-2.5 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-hidden flex flex-col flex-1">
                            {['UPDATE', 'CREATE', 'SOFT_DELETE', 'RESTORE'].includes(selectedLog.action) ? (
                                <DiffViewer oldValue={selectedLog.oldValue} newValue={selectedLog.newValue} />
                            ) : (
                                <SimpleViewer payload={selectedLog.newValue || selectedLog.oldValue || {}} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
