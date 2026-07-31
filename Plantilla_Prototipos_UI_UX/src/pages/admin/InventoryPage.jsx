import React, { useState, useEffect } from 'react';
import { Search, Filter, Box, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useInventory } from '../../api/adminInventory';

const LIMIT = 10;
const fmtMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;

export const InventoryView = ({ showToast }) => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const { data, isLoading, isFetching } = useInventory(page, LIMIT, debouncedSearch, statusFilter);
    const rows = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;

    const variantLabel = (r) => {
        const parts = [r.size, r.color].filter(Boolean);
        return parts.length ? `${r.productName} (${parts.join(' · ')})` : `${r.productName} (Única)`;
    };

    const desde = total === 0 ? 0 : (page - 1) * LIMIT + 1;
    const hasta = Math.min(page * LIMIT, total);

    return (
        <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
                <div>
                    <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight flex items-center gap-3">
                        <Box className="w-8 h-8 text-[#96c93e]" />
                        Monitor de Inventario
                    </h1>
                    <p className="text-[#e6c59e]/70 mt-1">Vista macroestructural de solo lectura. Modifique el stock desde el CRUD de Productos.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[#e6c59e]/70 group-focus-within:text-[#96c93e] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a2e0d]/80 border border-[#1a9a21]/30 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#e6c59e]/35 focus:outline-none focus:border-[#96c93e] focus:ring-1 focus:ring-[#96c93e] transition-all shadow-inner"
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative group w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-[#e6c59e]/70 group-focus-within:text-[#96c93e] transition-colors" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="w-full sm:w-auto appearance-none bg-[#0a2e0d]/80 border border-[#1a9a21]/30 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#96c93e] focus:ring-1 focus:ring-[#96c93e] transition-all cursor-pointer shadow-inner"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="ACTIVO">Activo</option>
                            <option value="STOCK_BAJO">Stock Bajo</option>
                            <option value="AGOTADO">Agotado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* DataGrid */}
            <div className="bg-[#0a2e0d]/60 backdrop-blur-xl border border-[#1a9a21]/30 rounded-[24px] overflow-hidden flex flex-col flex-1 shadow-2xl relative">
                
                {/* Loader Overlay for subsequent fetches */}
                {isFetching && !isLoading && (
                    <div className="absolute inset-0 bg-[#0a2e0d]/40 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in">
                        <div className="w-8 h-8 border-4 border-[#96c93e] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(150,201,62,0.5)]"></div>
                    </div>
                )}

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="font-quicksand w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#0a2e0d]/80 backdrop-blur-md border-b border-[#1a9a21]/30 sticky top-0 z-10 shadow-sm">
                            <tr className="text-[#e6c59e]/70">
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">SKU</th>
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Producto y Variante</th>
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-[#03bbd3]">Precio</th>
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-center border-l border-r border-[#1a9a21]/20 bg-[#123d17]/20">Stock</th>
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a9a21]/20 relative">
                            {isLoading ? (
                                /* Skeleton Loading */
                                Array.from({ length: LIMIT }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-[#123d17]/50 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-[#123d17]/50 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-[#123d17]/50 rounded w-12"></div></td>
                                        <td className="px-6 py-4 border-l border-r border-[#1a9a21]/20"><div className="h-6 bg-[#123d17]/50 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-[#123d17]/50 rounded-full w-20"></div></td>
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                /* Empty State */
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-[#e6c59e]/55 animate-in zoom-in-95 duration-500">
                                            <Box className="w-16 h-16 mb-4 opacity-20" />
                                            <p className="font-bold text-base text-[#e6c59e]/70">No se encontraron variantes</p>
                                            <p className="text-sm mt-1">Ajusta los filtros o la búsqueda para encontrar lo que necesitas.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r, idx) => (
                                    <tr 
                                        key={r.variantId} 
                                        className="hover:bg-white/[0.02] transition-colors group animate-in slide-in-from-bottom-2 duration-300"
                                        style={{ animationFillMode: 'both', animationDelay: `${idx * 30}ms` }}
                                    >
                                        <td className="px-6 py-4 font-mono text-xs text-[#e6c59e]/70 group-hover:text-[#e6c59e]/90 transition-colors">{r.sku}</td>
                                        <td className="px-6 py-4 font-bold text-[#e6c59e]">
                                            {variantLabel(r)}
                                            {r.isDeleted && <span className="ml-2 text-[9px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">Descontinuado</span>}
                                        </td>
                                        <td className="px-6 py-4 text-[#03bbd3] font-medium">{fmtMoney(r.price)}</td>
                                        <td className="px-6 py-4 border-l border-r border-[#1a9a21]/20 bg-[#0a2e0d]/30 text-center">
                                            <span className="font-bold text-lg text-white">
                                                {r.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Premium Badges */}
                                            {r.status === 'ACTIVO' && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/20 shadow-[inset_0_0_8px_rgba(150,201,62,0.1)]">
                                                    <CheckCircle2 className="w-3 h-3" /> Activo
                                                </div>
                                            )}
                                            {r.status === 'STOCK_BAJO' && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border bg-[#ffce07]/10 text-[#ffce07] border-[#ffce07]/20 shadow-[inset_0_0_8px_rgba(255,206,7,0.1)]">
                                                    <AlertTriangle className="w-3 h-3" /> Stock Bajo
                                                </div>
                                            )}
                                            {r.status === 'AGOTADO' && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border bg-red-500/10 text-red-400 border-red-500/20 shadow-[inset_0_0_8px_rgba(239,68,68,0.1)] animate-pulse">
                                                    <XCircle className="w-3 h-3" /> Agotado
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                <div className="bg-[#0a2e0d]/80 p-4 border-t border-[#1a9a21]/20 flex flex-col sm:flex-row justify-between items-center text-sm text-[#e6c59e]/70 gap-4 shrink-0">
                    <span>Mostrando <strong className="text-white">{desde}-{hasta}</strong> de <strong className="text-white">{total}</strong> variantes</span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page <= 1} 
                            className={`px-3 py-1.5 bg-[#123d17]/80 border border-[#1a9a21]/30 rounded-lg hover:bg-[#1a9a21]/30 hover:text-white transition-all ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Anterior
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .slice(Math.max(0, page - 2), Math.max(0, page - 2) + 3)
                                .map(n => (
                                <button 
                                    key={n} 
                                    onClick={() => setPage(n)} 
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-all ${n === page ? 'bg-gradient-to-b from-[#96c93e] to-[#75a32b] text-white shadow-lg shadow-[#96c93e]/20 border-t border-[#b8eb5f]' : 'bg-[#123d17]/50 border border-[#1a9a21]/20 hover:bg-[#1a9a21]/30 hover:text-white'}`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            disabled={page >= totalPages} 
                            className={`px-3 py-1.5 bg-[#123d17]/80 border border-[#1a9a21]/30 rounded-lg hover:bg-[#1a9a21]/30 hover:text-white transition-all ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
