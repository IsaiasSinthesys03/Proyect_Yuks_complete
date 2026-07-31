import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, ShoppingCart, Package, Image as ImageIcon,
    Gamepad2, Settings, ShieldAlert, FileText, HeartHandshake,
    LogOut, Lock, Search, Bell, Plus, Filter, MoreVertical,
    ChevronRight, GripVertical, AlertTriangle, CheckCircle2, CreditCard,
    Truck, ArrowRight, User, UploadCloud, ToggleRight, ToggleLeft, MonitorPlay,
    History, Eye, EyeOff, Save, Type, Bold, Italic, Link2,
    Users, Ticket, List, Menu, X, Code, Loader2, Database, Trash2, Ban, Clock,
    Wifi, ChevronLeft, Link as LinkIcon, Layers, Pencil
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../lib/api';
import { useCategories } from '../../api/products';
import {
    useAdminProducts, createProduct, updateProduct, softDeleteProduct,
    createVariant, updateVariant, setAbsoluteVariantStock, findOrCreateCategory, uploadProductImage,
    uploadProductGalleryImage, deleteProductGalleryImage, getAdminProductDetail
} from '../../api/adminCatalog';

const STANDARD_SIZES = ['Unitalla', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const STANDARD_COLORS = [
    { name: 'Rojo', hex: '#ef4444' },
    { name: 'Azul', hex: '#3b82f6' },
    { name: 'Verde', hex: '#22c55e' },
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#ffffff' },
    { name: 'Amarillo', hex: '#eab308' },
    { name: 'Naranja', hex: '#f97316' },
    { name: 'Gris', hex: '#64748b' },
    { name: 'Rosa', hex: '#ec4899' },
    { name: 'Morado', hex: '#a855f7' }
];

const fmtMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;

const fmtDate = (d) => {
    if (!d) return '---';
    return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/**
 * CatalogView (Fase 50, CMS-FE-06/07) — Master CRUD con OCC.
 *
 * Vista de LISTADO (tabla real, incluye descontinuados) ⇄ FORMULARIO
 * (crear/editar). El PUT SIEMPRE viaja con `version`; un 409 significa que
 * otro admin guardó primero → aviso claro, jamás sobrescritura a ciegas.
 */
export const CatalogView = ({ showToast }) => {
    const [mode, setMode] = useState('list'); // 'list' | 'form'
    const [editing, setEditing] = useState(null); // producto en edición (null = crear)
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, DRAFT, ARCHIVED
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // ── Formulario ──
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [hasVirtualReward, setHasVirtualReward] = useState(false);
    // Categorías Múltiples (N:M)
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [catInput, setCatInput] = useState('');
    // Variantes: {key, id?, sku, size, color, stock, isNew}
    const [variants, setVariants] = useState([]);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [galleryFiles, setGalleryFiles] = useState([]);
    
    // ── Shopify-style Variants Builder ──
    const [hasVariants, setHasVariants] = useState(false);
    const [useSize, setUseSize] = useState(false);
    const [useColor, setUseColor] = useState(false);
    const [simpleSku, setSimpleSku] = useState('');
    const [simpleStock, setSimpleStock] = useState(0);
    const [sizeOptions, setSizeOptions] = useState([]);
    const [sizeInput, setSizeInput] = useState('');
    const [colorOptions, setColorOptions] = useState([]);
    const [colorInput, setColorInput] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file); // Mostrar la preview inmediatamente y encolar para guardar
        e.target.value = '';
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setGalleryFiles(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const removeGalleryImage = async (url) => {
        if (!editing) return;
        try {
            await deleteProductGalleryImage(editing.id, url);
            showToast('Imagen eliminada de la galería.', 'success');
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            // Cargar de nuevo
            openEdit(editing);
        } catch (err) {
            showToast(err.message || 'Error al eliminar', 'error');
        }
    };

    const queryClient = useQueryClient();
    const { data: pageResult, isFetching } = useAdminProducts(page, 20, search, activeTab);
    const { data: categories } = useCategories();

    const products = pageResult?.data || [];
    const totalPages = pageResult?.totalPages || 1;

    const resetForm = () => {
        setName(''); setPrice(''); setDescription(''); setHasVirtualReward(false); setStatus('ACTIVE');
        setSelectedCategories([]); setCatInput('');
        setVariants([]);
        setEditing(null);
        setImageFile(null);
        setGalleryFiles([]);
        setHasVariants(false);
        setUseSize(false); setUseColor(false);
        setSimpleSku(''); setSimpleStock(0);
        setSizeOptions([]); setSizeInput('');
        setColorOptions([]); setColorInput('');
    };

    const openCreate = () => { resetForm(); setMode('form'); };

    /** Cargar el producto (con variantes y su `version` para el OCC). */
    const openEdit = async (p) => {
        try {
            const detail = await getAdminProductDetail(p.id);
            const prod = detail.product;
            setEditing(prod); // conserva prod.version — la llave del OCC
            setName(prod.name);
            setPrice(String(prod.price));
            setDescription(prod.description ?? '');
            setStatus(prod.status ?? 'ACTIVE');
            setHasVirtualReward(!!prod.hasVirtualReward);
            
            // Map the multiple categories from the backend response
            if (prod.categoryNames && Array.isArray(prod.categoryNames) && prod.categoryNames.length > 0) {
                setSelectedCategories(prod.categoryNames);
            } else if (prod.categories && Array.isArray(prod.categories)) {
                setSelectedCategories(prod.categories.map(c => c.name));
            } else {
                setSelectedCategories([]);
            }
            
            // Logic to determine if it has variants or is simple
            const loadedVariants = detail.variants.map(v => ({ key: v.id, id: v.id, sku: v.sku, size: v.size ?? '', color: v.color ?? '', stock: v.stock, originalStock: v.stock, isNew: false }));
            setVariants(loadedVariants);

            if (loadedVariants.length === 1 && !loadedVariants[0].size && !loadedVariants[0].color) {
                // Producto simple
                setHasVariants(false);
                setUseSize(false); setUseColor(false);
                setSimpleSku(loadedVariants[0].sku);
                setSimpleStock(loadedVariants[0].stock);
            } else if (loadedVariants.length > 0) {
                // Producto con variantes
                setHasVariants(true);
                const uniqueSizes = [...new Set(loadedVariants.filter(v => v.size).map(v => v.size))];
                const uniqueColors = [...new Set(loadedVariants.filter(v => v.color).map(v => v.color))];
                setUseSize(uniqueSizes.length > 0);
                setUseColor(uniqueColors.length > 0);
                setSizeOptions(uniqueSizes);
                setColorOptions(uniqueColors);
            }

            setMode('form');
        } catch {
            showToast('No se pudo cargar el producto.', 'error');
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => softDeleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            showToast('Producto descontinuado (soft delete).', 'success');
        },
        onError: (e) => showToast(e?.response?.data?.error || 'No se pudo descontinuar.', 'error'),
    });

    const addVariantRow = () => setVariants(v => [...v, { key: crypto.randomUUID(), sku: '', size: '', color: '', stock: 0, isNew: true }]);
    const removeVariantRow = (key) => setVariants(v => v.filter(x => x.key !== key || !x.isNew)); // solo filas nuevas se quitan
    const patchRow = (key, field, value) => setVariants(v => v.map(x => x.key === key ? { ...x, [field]: value } : x));

    const [showCustomSize, setShowCustomSize] = useState(false);
    const [showCustomColor, setShowCustomColor] = useState(false);

    // ── Generador Automático de Matriz ──
    useEffect(() => {
        if (!hasVariants) return;
        
        setVariants(prev => {
            const newCombinations = [];
            const hasSizes = sizeOptions.length > 0;
            const hasColors = colorOptions.length > 0;

            if (!hasSizes && !hasColors) return prev; // No options yet

            if (hasSizes && hasColors) {
                sizeOptions.forEach(s => colorOptions.forEach(c => newCombinations.push({ size: s, color: c })));
            } else if (hasSizes) {
                sizeOptions.forEach(s => newCombinations.push({ size: s, color: '' }));
            } else if (hasColors) {
                colorOptions.forEach(c => newCombinations.push({ size: '', color: c }));
            }

            // Merge con los anteriores para no perder stock/sku
            const merged = newCombinations.map((combo, index) => {
                const existing = prev.find(v => (v.size || '') === (combo.size || '') && (v.color || '') === (combo.color || ''));
                if (existing) return existing;
                
                // Si es la primera variante generada y había stock simple, lo hereda
                const initialStock = (prev.length === 0 && index === 0 && simpleStock > 0) ? simpleStock : 0;
                
                return { key: crypto.randomUUID(), sku: '', size: combo.size, color: combo.color, stock: initialStock, isNew: true };
            });

            // Si es igual al actual, no actualizamos
            if (merged.length === prev.length && merged.every(m => prev.some(p => (p.size||'') === (m.size||'') && (p.color||'') === (m.color||'')))) {
                return prev;
            }
            return merged;
        });
    }, [sizeOptions, colorOptions, hasVariants, simpleStock]);

    const toggleOption = (type, value) => {
        if (type === 'size') {
            setSizeOptions(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
        } else {
            setColorOptions(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
        }
    };

    const addCustomOption = (type, value) => {
        const val = value.trim();
        if (!val) {
            if (type === 'size') setShowCustomSize(false);
            if (type === 'color') setShowCustomColor(false);
            return;
        }
        if (type === 'size') {
            if (!sizeOptions.includes(val)) setSizeOptions(prev => [...prev, val]);
            setSizeInput('');
            setShowCustomSize(false);
        } else {
            if (!colorOptions.includes(val)) setColorOptions(prev => [...prev, val]);
            setColorInput('');
            setShowCustomColor(false);
        }
    };

    const removeOption = (type, value) => {
        if (type === 'size') setSizeOptions(prev => prev.filter(x => x !== value));
        else setColorOptions(prev => prev.filter(x => x !== value));
    };

    const generateSku = (baseName, size, color) => {
        const prefix = (baseName.trim() || 'PROD').slice(0, 4).toUpperCase();
        const rand = crypto.randomUUID().split('-')[0].toUpperCase().slice(0, 4);
        return [prefix, size, color, rand].filter(Boolean).join('-').replace(/\s+/g, '').slice(0, 20);
    };

    /** Guardado completo: categorías (find-or-create) → producto → variantes. */
    const handleSave = async (e) => {
        e.preventDefault();
        
        // Add pending input if any
        let finalCategories = [...selectedCategories];
        if (catInput.trim() && !finalCategories.includes(catInput.trim())) {
            finalCategories.push(catInput.trim());
        }

        if (finalCategories.length === 0) { showToast('Selecciona o crea al menos una categoría.', 'error'); return; }
        
        let validVariants = [];
        if (!hasVariants) {
            // Construir una variante plana, autogenerar SKU si está vacío
            const existingId = editing ? variants[0]?.id : null;
            const originalStock = editing ? (variants[0]?.originalStock ?? 0) : 0;
            const finalSku = simpleSku.trim() || generateSku(name, '', '');
            validVariants = [{ id: existingId, sku: finalSku, size: '', color: '', stock: Number(simpleStock), originalStock, isNew: !existingId }];
        } else {
            // Autogenerar SKUs vacíos en la matriz y filtrar deshabilitadas
            validVariants = variants.filter(v => !v.disabled).map(v => ({
                ...v,
                sku: v.sku.trim() || generateSku(name, v.size, v.color)
            }));
            if (validVariants.length === 0) { showToast('Genera al menos una variante y habilítala.', 'error'); return; }
        }

        setSaving(true);
        try {
            // 1) Categorías creatables: find-or-create idempotente en el backend
            const categoryIds = [];
            for (const catName of finalCategories) {
                const category = await findOrCreateCategory(catName);
                categoryIds.push(category.id);
            }

            const base = { categoryIds, name: name.trim(), description: description.trim() || null, price: Number(price), status, hasVirtualReward };

            let finalProductId = editing ? editing.id : null;

            if (!editing) {
                // 2a) CREAR: producto + variantes en secuencia
                const prod = await createProduct(base);
                finalProductId = prod.id;
                for (const v of validVariants) {
                    await createVariant(prod.id, { sku: v.sku.trim(), size: v.size.trim() || null, color: v.color.trim() || null, stock: Number(v.stock) || 0 });
                }
                showToast('Producto creado con sus variantes.', 'success');
            } else {
                // 2b) EDITAR: PUT con `version` — ▓ OCC ▓ 409 si otro admin ganó
                await updateProduct(editing.id, { ...base, version: editing.version });
                // PUT variantes existentes / POST nuevas...
                for (const v of validVariants) {
                    if (v.isNew) {
                        await createVariant(editing.id, { sku: v.sku.trim(), size: v.size.trim() || null, color: v.color.trim() || null, stock: Number(v.stock) || 0 });
                    } else {
                        await updateVariant(editing.id, v.id, { sku: v.sku.trim(), size: v.size.trim() || null, color: v.color.trim() || null });
                        
                        // Ajustar stock si fue modificado en la interfaz usando valor absoluto
                        const newStock = Number(v.stock) || 0;
                        const originalStock = Number(v.originalStock) || 0;
                        if (newStock !== originalStock) {
                            await setAbsoluteVariantStock(editing.id, v.id, newStock);
                        }
                    }
                }
                showToast('Producto actualizado (OCC validado).', 'success');
            }
            
            // 3) Subir la imagen principal
            if (imageFile && finalProductId) {
                try {
                    await uploadProductImage(finalProductId, imageFile);
                    showToast('Imagen principal subida con éxito.', 'success');
                } catch (e) {
                    showToast('El producto se guardó, pero hubo un error al subir la imagen principal.', 'warning');
                }
            }

            // 4) Subir galería secundaria pendiente
            if (galleryFiles.length > 0 && finalProductId) {
                try {
                    let successCount = 0;
                    for (const file of galleryFiles) {
                        try {
                            await uploadProductGalleryImage(finalProductId, file);
                            successCount++;
                        } catch (e) {
                            console.error('Error subiendo imagen de galería', e);
                        }
                    }
                    if (successCount === galleryFiles.length) {
                        showToast(`Se subieron ${successCount} imágenes a la galería.`, 'success');
                    } else if (successCount > 0) {
                        showToast(`Se subieron ${successCount} de ${galleryFiles.length} imágenes a la galería.`, 'warning');
                    } else {
                        showToast('Error al subir las imágenes de la galería.', 'error');
                    }
                } catch (e) {
                    showToast('Error procesando la galería.', 'error');
                }
            }

            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setMode('list');
            resetForm();
        } catch (err) {
            if (err?.response?.status === 409) {
                // ▓ CONFLICTO OCC (o SKU duplicado) — el mensaje del backend distingue
                const msg = err?.response?.data?.error ?? '';
                if (/versión|version|concurren/i.test(msg)) {
                    showToast('⚠ Otro administrador modificó este producto mientras editabas. Recarga para ver los cambios — NO se sobrescribió nada.', 'error');
                    // Refrescar el listado de inmediato: al volver, el admin ve la
                    // versión REAL (no la caché stale previa al conflicto).
                    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
                } else {
                    showToast(msg || 'Conflicto: SKU duplicado.', 'error');
                }
            } else {
                showToast(err?.response?.data?.error || 'No se pudo guardar el producto.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    // ══════════════ VISTA LISTADO ══════════════
    if (mode === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-end gap-5">
                    <div><h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">Master CRUD de Catálogo</h1><p className="text-[#e6c59e]/70 mt-1">Productos, variantes y categorías con control de concurrencia.</p></div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full 2xl:w-auto">
                        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="relative w-full min-w-0 sm:flex-1 sm:min-w-[220px]">
                            <input
                                type="text"
                                placeholder="Buscar SKU o nombre..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                className="w-full bg-[#123d17]/50 border border-[#1a9a21]/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#03bbd3]"
                            />
                            <Search className="w-4 h-4 text-[#e6c59e]/55 absolute left-3 top-2" />
                            {searchInput && <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="absolute right-3 top-2.5 opacity-50 hover:opacity-100"><X className="w-3 h-3 text-white" /></button>}
                        </form>
                        <div className="flex flex-wrap bg-[#123d17]/50 rounded-xl p-1">
                            {['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setPage(1); }}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === tab ? 'bg-[#1a5521] text-white shadow' : 'text-[#e6c59e]/70 hover:text-white'}`}
                                >
                                    {tab === 'ALL' ? 'Todos' : tab === 'ACTIVE' ? 'Habilitados' : tab === 'DRAFT' ? 'Deshabilitados' : 'Archivados'}
                                </button>
                            ))}
                        </div>
                        <button onClick={openCreate} className="bg-[#96c93e] hover:bg-[#86b537] text-[#061f09] px-5 py-3.5 rounded-xl font-bungee flex items-center gap-2 text-[10px] leading-none shadow-lg shadow-[#96c93e]/20"><Plus className="w-4 h-4" /> Nuevo Producto</button>
                    </div>
                </div>

                <div className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-5 md:p-8 shadow-2xl overflow-x-auto custom-scrollbar">
                    <table className="font-quicksand w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-[#1a9a21]/20 border-b border-[#1a9a21]/20">
                            <tr className="text-[#e6c59e]/70 border-b border-[#1a9a21]/20">
                                <th className="pb-3 font-medium">Producto</th>
                                <th className="pb-3 font-medium text-center">Precio</th>
                                <th className="pb-3 font-medium text-center">Última Actualización</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a9a21]/20">
                            {(products ?? []).length === 0 && (
                                <tr><td colSpan={5} className="py-8 text-center text-[#e6c59e]/55 font-bold text-xs">Sin productos. Crea el primero.</td></tr>
                            )}
                            {(products ?? []).map(p => (
                                <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4">
                                        <p className="font-bold text-[#e6c59e]">{p.name}</p>
                                        <p className="text-xs text-[#e6c59e]/55 font-mono mt-0.5">{p.id.slice(0, 8)}</p>
                                    </td>
                                    <td className="py-4 text-[#e6c59e]/90 font-bold text-center">{fmtMoney(p.price)}</td>
                                    <td className="py-4 text-xs text-[#e6c59e]/70 font-mono text-center">{fmtDate(p.updatedAt || p.createdAt)}</td>
                                    <td className="py-4 text-center">
                                        {p.isDeleted
                                            ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold border bg-red-500/10 text-red-400 border-red-500/20">DESCONTINUADO</span>
                                            : p.status === 'ACTIVE'
                                                ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold border bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/20">HABILITADO</span>
                                                : <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold border bg-[#e6c59e]/10 text-[#e6c59e]/70 border-[#1a9a21]/20">DESHABILITADO</span>}
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(p)} className="px-3 py-1.5 bg-[#03bbd3]/10 border border-[#03bbd3]/30 hover:bg-[#03bbd3] rounded-lg text-[#03bbd3] hover:text-white transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm" title="Editar Producto"><Pencil className="w-3.5 h-3.5" /> Editar</button>
                                            {!p.isDeleted && (
                                                <button onClick={() => deleteMutation.mutate(p.id)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm" title="Descontinuar"><Trash2 className="w-3.5 h-3.5" /> Bajar</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4">
                        <p className="text-sm text-[#e6c59e]/70">Página <span className="font-bold text-white">{page}</span> de {totalPages}</p>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-[#123d17] text-[#e6c59e]/90 rounded hover:bg-[#1a9a21]/30 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-[#123d17] text-[#e6c59e]/90 rounded hover:bg-[#1a9a21]/30 disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ══════════════ VISTA FORMULARIO ══════════════
    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="font-bungee text-2xl sm:text-3xl text-white leading-tight">{editing ? `Editar: ${editing.name}` : 'Nuevo Producto'}</h1>
                <button onClick={() => { setMode('list'); resetForm(); }} className="text-sm font-bold text-[#e6c59e]/70 hover:text-white flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Volver al listado</button>
            </div>
            <form onSubmit={handleSave} className="bg-[#0a2e0d]/60 backdrop-blur-md border border-[#1a9a21]/20 rounded-3xl md:rounded-[40px] p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-8 relative shadow-2xl">
                {/* ▓ PANTALLA DE ESPERA / OVERLAY DE GUARDADO ▓ */}
                {saving && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[40px]">
                        <div className="flex flex-col items-center p-8 bg-[#0a2e0d] border border-[#03bbd3]/30 rounded-3xl shadow-[0_0_40px_rgba(3,187,211,0.2)]">
                            <Loader2 className="w-12 h-12 animate-spin text-[#03bbd3] mb-4" />
                            <p className="text-white font-black text-xl mb-1">{editing ? 'Actualizando producto...' : 'Creando producto...'}</p>
                            <p className="text-[#e6c59e]/70 text-sm font-medium">Por favor, no cierres esta ventana.</p>
                        </div>
                    </div>
                )}

                <div className="absolute top-8 right-8 flex items-center gap-3">
                    {editing && <span className="text-xs font-mono bg-[#03bbd3]/10 text-[#03bbd3] px-2 py-1 rounded" title="Versión OCC cargada">v{editing.version}</span>}
                    {editing?.isDeleted ? (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-red-500/10 text-red-400 border-red-500/20`}>
                            <ToggleLeft className="w-5 h-5 opacity-50" /> <span className="text-xs font-bold">DESCONTINUADO</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setStatus(s => s === 'ACTIVE' ? 'DRAFT' : 'ACTIVE')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${status === 'ACTIVE' ? 'bg-[#96c93e]/10 text-[#96c93e] border-[#96c93e]/30 hover:bg-[#96c93e]/20' : 'bg-[#e6c59e]/10 text-[#e6c59e]/70 border-[#1a9a21]/30 hover:bg-[#e6c59e]/20'}`}
                        >
                            {status === 'ACTIVE' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                            <span className="text-xs font-bold">{status === 'ACTIVE' ? 'HABILITADO' : 'DESHABILITADO'}</span>
                        </button>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-[#1a9a21]/30 pb-2"><span className="w-6 h-6 rounded-full bg-[#03bbd3]/20 text-[#03bbd3] flex items-center justify-center text-xs">1</span> Campos Base y Fotografías</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div><label className="block text-xs font-bold text-[#e6c59e]/55 uppercase tracking-widest mb-2 ml-2">Nombre</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 border border-[#1a9a21]/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-black/40 transition-all" /></div>
                        <div><label className="block text-xs font-bold text-[#e6c59e]/55 uppercase tracking-widest mb-2 ml-2">Precio Base (Sin Envío)</label><div className="relative"><span className="absolute left-6 top-4 text-[#e6c59e]/55 font-bold">$</span><input type="number" step="0.01" min="0" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/20 border border-[#1a9a21]/30 rounded-2xl pl-10 pr-6 py-4 text-white outline-none focus:border-[#03bbd3] focus:bg-black/40 transition-all" /></div></div>
                    </div>

                    {/* Selector creatable de categorías (Múltiples) */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Categorías (elige una o varias, o créalas al vuelo)</label>
                        <div className="w-full bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                            {selectedCategories.map(cat => (
                                <span key={cat} className="bg-[#03bbd3]/20 text-[#03bbd3] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                    {cat} <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))} />
                                </span>
                            ))}
                            {(categories ?? []).filter(c => !selectedCategories.includes(c.name) && (!catInput.trim() || c.name.toLowerCase().includes(catInput.toLowerCase()))).map(c => (
                                <span key={c.id} onClick={() => { setSelectedCategories(prev => [...prev, c.name]); setCatInput(''); }} className="bg-[#123d17] hover:bg-[#03bbd3]/20 text-[#e6c59e]/90 hover:text-[#03bbd3] text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors">{c.name}</span>
                            ))}
                            <input value={catInput} onChange={e => setCatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (catInput.trim() && !selectedCategories.includes(catInput.trim())) { setSelectedCategories(prev => [...prev, catInput.trim()]); setCatInput(''); } } }} type="text" placeholder="Buscar o crear..." className="bg-transparent border-none text-sm text-white outline-none flex-1 min-w-[150px]" />
                            {catInput.trim() && !selectedCategories.includes(catInput.trim()) && (
                                <button type="button" onClick={() => { setSelectedCategories(prev => [...prev, catInput.trim()]); setCatInput(''); }} className="bg-[#03bbd3] hover:bg-[#02a8be] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> Crear "{catInput.trim()}"</button>
                            )}
                        </div>
                    </div>

                    <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Descripción</label>
                    <div className="bg-[#0a2e0d] border border-[#1a9a21]/30 rounded-xl overflow-hidden mb-6">
                        <div className="bg-[#123d17] px-4 py-2 border-b border-[#1a9a21]/30 flex gap-2"><button type="button" className="p-1.5 text-[#e6c59e]/70 hover:text-white bg-[#1a5521] rounded"><Bold className="w-4 h-4" /></button></div>
                        <textarea rows="4" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-transparent p-4 text-sm text-[#e6c59e]/90 outline-none resize-none" placeholder="Redactar descripciones de forma enriquecida..."></textarea>
                    </div>

                    <label className="block text-xs font-bold text-[#e6c59e]/70 uppercase mb-2">Fotografías</label>
                    <div className="flex gap-4">
                        <label className={`w-full md:w-1/2 relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer border-[#96c93e]/50 bg-[#0a2e0d]/50 text-[#96c93e] hover:border-[#96c93e]`}>
                            <div className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded bg-[#96c93e]">PORTADA PRINCIPAL</div>
                            
                            {uploadingImage ? (
                                <Loader2 className="w-8 h-8 mb-2 mt-4 animate-spin" />
                            ) : imageFile || editing?.imageUrl ? (
                                <img 
                                    src={imageFile ? URL.createObjectURL(imageFile) : editing.imageUrl} 
                                    alt="Preview" 
                                    className="w-full h-32 object-contain mb-2 mt-4 rounded"
                                />
                            ) : (
                                <UploadCloud className="w-8 h-8 mb-2 mt-4" />
                            )}
                            <p className="text-xs font-bold">
                                {imageFile ? imageFile.name : (editing?.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen')}
                            </p>
                            
                            <input 
                                type="file" 
                                hidden 
                                accept="image/jpeg, image/png, image/webp" 
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                            />
                        </label>

                        {/* GALERÍA SECUNDARIA */}
                        <div className={`w-full md:w-1/2 relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-start text-center border-[#1a9a21]/35 bg-[#0a2e0d]/50`}>
                            <div className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded bg-[#236b2b]">GALERÍA SECUNDARIA</div>
                            
                            <label className="cursor-pointer bg-[#123d17] hover:bg-[#1a9a21]/30 text-white text-xs font-bold px-4 py-2 rounded-lg mt-6 mb-4 transition-colors flex items-center gap-2">
                                {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                Subir Imágenes Extra
                                <input 
                                    type="file" 
                                    hidden 
                                    multiple
                                    accept="image/jpeg, image/png, image/webp" 
                                    onChange={handleGalleryUpload}
                                    disabled={uploadingGallery}
                                />
                            </label>

                            <div className="w-full grid grid-cols-1 min-[390px]:grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-40 sm:max-h-32 pr-2">
                                {/* Imágenes ya guardadas en backend */}
                                {editing?.galleryUrls?.map((url, i) => (
                                    <div key={i} className="relative group rounded bg-black/50 aspect-square overflow-hidden">
                                        <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <button type="button" onClick={() => removeGalleryImage(url)} className="absolute top-1 right-1 bg-red-500/80 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Imágenes pendientes de subir (solo crear) */}
                                {galleryFiles.map((file, i) => (
                                    <div key={`new-${i}`} className="relative group rounded bg-black/50 aspect-square overflow-hidden border-2 border-[#96c93e]/50">
                                        <img src={URL.createObjectURL(file)} alt={`New Gallery ${i}`} className="w-full h-full object-cover opacity-90" />
                                        <button type="button" onClick={() => setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500/80 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between border-b border-[#1a9a21]/30 pb-2 mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#03bbd3]/20 text-[#03bbd3] flex items-center justify-center text-xs">2</span> 
                            Inventario y Variantes
                        </h3>
                    </div>

                    <div className="bg-[#0a2e0d]/50 border border-[#1a9a21]/30 rounded-xl p-6">
                        <div className="mb-6">
                            {(!hasVariants || (!useSize && !useColor)) && (
                                <div>
                                    <label className="block text-xs font-bold text-amber-500 uppercase mb-2">
                                        Stock Inicial
                                    </label>
                                    <input type="number" min="0" value={simpleStock} onChange={e => setSimpleStock(e.target.value)} title="Modificar stock" className="w-full md:w-1/2 bg-black/20 border border-amber-500/50 rounded-2xl px-5 py-3 text-amber-400 font-bold outline-none focus:border-amber-500 focus:bg-black/40 transition-all" />
                                </div>
                            )}
                        </div>
                        
                        <label className="flex items-center gap-3 p-4 border border-[#1a9a21]/30 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                            <input type="checkbox" checked={hasVariants} onChange={e => {
                                setHasVariants(e.target.checked);
                                if (!e.target.checked) {
                                    setUseSize(false); setSizeOptions([]);
                                    setUseColor(false); setColorOptions([]);
                                }
                            }} className="w-5 h-5 accent-[#03bbd3]" />
                            <div>
                                <p className="text-sm font-bold text-white">Este producto tiene opciones, como tallas o colores</p>
                                <p className="text-xs text-[#e6c59e]/70 mt-0.5">Activa esta casilla para generar múltiples variantes.</p>
                            </div>
                        </label>
                    </div>

                    {hasVariants && (
                        <div className="space-y-6 mt-6">
                            <div className="bg-[#0a2e0d] border border-[#03bbd3]/30 rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#03bbd3]/5 blur-3xl rounded-full"></div>
                                <div className="mb-6">
                                    <h4 className="text-md font-bold text-white">Opciones del Producto</h4>
                                    <p className="text-xs text-[#e6c59e]/70 mt-1">Agrega únicamente las opciones que correspondan a este producto.</p>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    {useSize && (
                                        <div className="bg-black/20 border border-[#1a9a21]/30 rounded-xl p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="block text-xs font-bold text-[#e6c59e]/90 uppercase">Opción: Tallas</label>
                                                <button type="button" onClick={() => { setUseSize(false); setSizeOptions([]); }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Eliminar</button>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {STANDARD_SIZES.map(s => {
                                                    const active = sizeOptions.includes(s);
                                                    return (
                                                        <button key={s} type="button" onClick={() => toggleOption('size', s)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${active ? 'bg-[#03bbd3] border-[#03bbd3] text-black shadow-[0_0_10px_rgba(3,187,211,0.3)]' : 'bg-[#123d17] border-[#1a9a21]/35 text-[#e6c59e]/90 hover:border-[#e6c59e]/40'}`}>
                                                            {s}
                                                        </button>
                                                    );
                                                })}
                                                {sizeOptions.filter(s => !STANDARD_SIZES.includes(s)).map(s => (
                                                    <button key={s} type="button" onClick={() => toggleOption('size', s)} className="px-4 py-2 rounded-lg text-sm font-bold transition-all border bg-[#03bbd3] border-[#03bbd3] text-black shadow-[0_0_10px_rgba(3,187,211,0.3)]">
                                                        {s} <X className="w-3 h-3 inline ml-1 opacity-50 hover:opacity-100"/>
                                                    </button>
                                                ))}
                                                {showCustomSize ? (
                                                    <input type="text" autoFocus value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomOption('size', sizeInput); } }} onBlur={() => addCustomOption('size', sizeInput)} placeholder="Ej: 42" className="bg-[#123d17] border border-[#03bbd3] rounded-lg text-sm text-white px-3 py-2 outline-none shadow-[0_0_10px_rgba(3,187,211,0.2)] w-24" />
                                                ) : (
                                                    <button type="button" onClick={() => setShowCustomSize(true)} className="px-4 py-2 rounded-lg text-sm font-bold text-[#e6c59e]/70 bg-black/20 border border-dashed border-[#1a9a21]/35 hover:text-white hover:border-[#e6c59e]/40 transition-colors">
                                                        + Otra
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {useColor && (
                                        <div className="bg-black/20 border border-[#1a9a21]/30 rounded-xl p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="block text-xs font-bold text-[#e6c59e]/90 uppercase">Opción: Colores</label>
                                                <button type="button" onClick={() => { setUseColor(false); setColorOptions([]); }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Eliminar</button>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {STANDARD_COLORS.map(c => {
                                                    const active = colorOptions.includes(c.name);
                                                    return (
                                                        <button key={c.name} type="button" onClick={() => toggleOption('color', c.name)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all border ${active ? 'bg-[#123d17] border-[#03bbd3] text-white shadow-[0_0_10px_rgba(3,187,211,0.2)]' : 'bg-black/40 border-[#1a9a21]/30 text-[#e6c59e]/70 hover:border-[#1a9a21]/40'}`}>
                                                            <div className="w-4 h-4 rounded-full border border-[#1a9a21]/40 shadow-sm" style={{ backgroundColor: c.hex }}></div>
                                                            {c.name}
                                                        </button>
                                                    );
                                                })}
                                                {colorOptions.filter(c => !STANDARD_COLORS.some(sc => sc.name === c)).map(c => (
                                                    <button key={c} type="button" onClick={() => toggleOption('color', c)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all border bg-[#123d17] border-[#03bbd3] text-white shadow-[0_0_10px_rgba(3,187,211,0.2)]">
                                                        <div className="w-4 h-4 rounded-full border border-[#1a9a21]/40" style={{ backgroundImage: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}></div>
                                                        {c} <X className="w-3 h-3 inline opacity-50 hover:opacity-100"/>
                                                    </button>
                                                ))}
                                                {showCustomColor ? (
                                                    <input type="text" autoFocus value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomOption('color', colorInput); } }} onBlur={() => addCustomOption('color', colorInput)} placeholder="Ej: Dorado" className="bg-[#123d17] border border-[#03bbd3] rounded-lg text-sm text-white px-3 py-2 outline-none shadow-[0_0_10px_rgba(3,187,211,0.2)] w-32" />
                                                ) : (
                                                    <button type="button" onClick={() => setShowCustomColor(true)} className="px-4 py-2 rounded-lg text-sm font-bold text-[#e6c59e]/70 bg-black/20 border border-dashed border-[#1a9a21]/35 hover:text-white hover:border-[#e6c59e]/40 transition-colors">
                                                        + Otro
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(!useSize || !useColor) && (
                                        <div className="flex gap-3 pt-2">
                                            {!useSize && <button type="button" onClick={() => setUseSize(true)} className="bg-[#123d17] hover:bg-[#03bbd3] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-[#1a9a21]/35 hover:border-[#03bbd3]">+ Añadir Tallas</button>}
                                            {!useColor && <button type="button" onClick={() => setUseColor(true)} className="bg-[#123d17] hover:bg-[#03bbd3] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-[#1a9a21]/35 hover:border-[#03bbd3]">+ Añadir Colores</button>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(useSize || useColor) && (
                                <div className="bg-[#0a2e0d]/50 border border-[#1a9a21]/30 rounded-xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-[#1a9a21]/30 bg-[#123d17]/50 flex justify-between items-center">
                                        <h4 className="font-bold text-[#e6c59e]">Matriz de Variantes Generada</h4>
                                        <span className="bg-[#03bbd3]/20 text-[#03bbd3] text-xs font-bold px-2 py-1 rounded">{variants.length} variantes</span>
                                    </div>
                                <div className="overflow-x-auto">
                                    <table className="font-quicksand w-full text-left text-sm">
                                        <thead className="bg-[#1a9a21]/20 border-b border-[#1a9a21]/20">
                                            <tr className="text-[#e6c59e]/55 border-b border-[#1a9a21]/20 text-xs uppercase tracking-widest bg-black/20">
                                                {sizeOptions.length > 0 && <th className="px-5 py-3 font-bold w-1/4">Talla</th>}
                                                {colorOptions.length > 0 && <th className="px-5 py-3 font-bold w-1/4">Color</th>}
                                                <th className="px-5 py-3 font-bold w-1/4">Stock Inicial</th>
                                                <th className="px-5 py-3 font-bold w-[10%] text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1a9a21]/20">
                                            {variants.length === 0 && (
                                                <tr><td colSpan={4} className="py-8 text-center text-[#e6c59e]/55 text-xs">Agrega opciones arriba para generar las combinaciones.</td></tr>
                                            )}
                                            {variants.map((v) => (
                                                <tr key={v.key} className={`hover:bg-[#123d17]/30 transition-opacity ${v.disabled ? 'opacity-40' : ''}`}>
                                                    {sizeOptions.length > 0 && (
                                                        <td className="px-5 py-3 font-bold text-[#e6c59e]/90">
                                                            {v.size ? <span className="bg-[#123d17] px-3 py-1.5 rounded-lg text-sm border border-[#1a9a21]/30">{v.size}</span> : <span className="text-[#e6c59e]/40">-</span>}
                                                        </td>
                                                    )}
                                                    {colorOptions.length > 0 && (
                                                        <td className="px-5 py-3 font-bold text-[#e6c59e]/90">
                                                            {v.color ? <span className="bg-[#123d17] px-3 py-1.5 rounded-lg text-sm border border-[#1a9a21]/30">{v.color}</span> : <span className="text-[#e6c59e]/40">-</span>}
                                                        </td>
                                                    )}
                                                    <td className="px-5 py-3">
                                                        <input type="number" min="0" disabled={v.disabled} value={v.stock} onChange={e => patchRow(v.key, 'stock', e.target.value)} title="Modificar stock" className="w-24 bg-black/20 border border-amber-500/30 rounded px-3 py-1.5 text-sm text-amber-400 font-bold text-center outline-none focus:border-amber-500 disabled:opacity-50" />
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <button type="button" onClick={() => patchRow(v.key, 'disabled', !v.disabled)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${v.disabled ? 'bg-[#96c93e]/10 text-[#96c93e] hover:bg-[#96c93e]/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`} title={v.disabled ? "Habilitar Variante" : "Deshabilitar Variante (no se guardará)"}>
                                                            {v.disabled ? 'Habilitar' : 'Excluir'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-[#1a9a21]/30 pb-2"><span className="w-6 h-6 rounded-full bg-[#1a9a21]/20 text-[#1a9a21] flex items-center justify-center text-xs">3</span> Game Linker Inteligente</h3>
                    <div className="bg-gradient-to-r from-[#1a9a21]/20 to-[#061f09] border border-[#1a9a21]/30 p-6 rounded-xl flex gap-4">
                        <Gamepad2 className="w-8 h-8 text-[#1a9a21] shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#e6c59e] mb-1">Asociar recompensa virtual a producto físico</p>
                            <select value={hasVirtualReward ? 'skin' : ''} onChange={e => setHasVirtualReward(e.target.value === 'skin')} className="w-full bg-[#0a2e0d] border border-[#1a9a21]/50 rounded-xl px-4 py-3 text-white outline-none mt-2">
                                <option value="">Ninguna recompensa</option><option value="skin">🎮 Incluye recompensa virtual (genera UUID al comprar)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-[#1a9a21]/30">
                    <button type="submit" disabled={saving} className="bg-[#96c93e] hover:bg-[#86b537] disabled:bg-[#96c93e]/50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Producto
                    </button>
                </div>
            </form>
        </div>
    );
};

// 3.4 MONITOR GLOBAL DE INVENTARIO
