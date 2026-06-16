---
name: pipeline-refactor-cms
description: Instrucciones automáticas para la desarticulación del prototipo CMS masivo en una arquitectura de SPA modular para Next.js Enterprise.
---

# Pipeline de Refactorización: Panel Administrativo CMS

El agente debe tomar el archivo `prototipe_CMS.jsx` y modularizar sus vistas operativas en componentes altamente mantenibles, eliminando el enrutamiento simulado por strings.

## 1. Arquitectura de Navegación Avanzada [CMS-FE-17]
* **Destino:** `src/components/cms/CmsLayout.tsx` y `src/components/cms/Sidebar.tsx`.
* **Diseño:** Implementar el Sidebar colapsable para maximizar el viewport horizontal de las tablas de datos complejas.
* **Agrupación:** Agrupar categóricamente los accesos del menú por unidades de negocio: Analítica, Operaciones, Catálogo, Marketing, Integraciones y Sistema.
* **Contexto:** Inyectar Breadcrumbs dinámicas en la cabecera superior para rastrear la profundidad de navegación del administrador.

## 2. Kanban de Pedidos en Tiempo Real [CMS-FE-04]
* **Destino:** `src/components/cms/KanbanBoard.tsx` y `src/components/cms/KanbanCard.tsx`.
* **Lógica:** Simular la escucha activa de WebSockets mediante un indicador visual de "Socket Live" (Semáforo intermitente) en la cabecera.
* **Datos Críticos:** Cada tarjeta expuesta en las columnas debe renderizar visiblemente el teléfono, dirección, Código Postal y las referencias del domicilio para mitigar pérdidas logísticas del reparto.
* **Acción Última Milla:** Al arrastrar un pedido a la columna "En Reparto", disparar automáticamente un Modal Express para capturar los datos del chofer (Local) o la empresa y guía de rastreo (Paquetería).

## 3. Monitor de Abastecimiento con Edición Inline [CMS-FE-07 / CMS-FE-16]
* **Destino:** `src/components/cms/InventoryDataGrid.tsx`.
* **Estructura:** Tabla paginada desde el servidor (Server-side pagination) que liste de forma simultánea las variantes por SKU único.
* **Edición Inline:** La celda numérica del campo "Stock" debe reaccionar a un doble clic estricto, transformándose en un input activo. Al presionar `Enter` o perder el foco (`onBlur`), debe enviar una petición PATCH silenciosa al servidor para actualizar el inventario físico de la bodega al instante.