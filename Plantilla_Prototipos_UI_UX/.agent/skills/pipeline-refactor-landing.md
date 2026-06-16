---
name: pipeline-refactor-landing
description: Instrucciones automáticas para la atomización y refactorización avanzada de la Landing Page y Tienda basándose en el SRS.
---

# Pipeline de Refactorización: E-Commerce Frontend

El agente debe tomar el archivo `landing_page.jsx` como prototipo monolítico básico y descomponerlo aplicando Clean Architecture, SOLID y los requerimientos estrictos de `md/SRS_v10.1.md`.

## 1. Extracción del Layout y Header Global
* **Destino:** `src/components/layout/Header.tsx` y `src/hooks/useHeaderNav.ts`.
* **Lógica:** Aislar el estado del scroll, la visibilidad del Omnibox y el control de la barra predictiva en el Custom Hook.
* **Requerimiento Estricto:** Implementar el Event Listener global para capturar el atajo `Cmd + K` o `Ctrl + K` [REQ-FE-12]. Al activarse, debe levantar el Omnibox predictivo.
* **UI/UX:** Reemplazar los estilos CSS inyectados por clases utilitarias puras de Tailwind CSS para el efecto *glassmorphism*.

## 2. Componentización del Hero Carousel [REQ-FE-01]
* **Destino:** `src/components/home/HeroCarousel.tsx`.
* **Estructura Multicapa:**
    * **Capa 1 (Fondo):** Etiqueta `<video>` con los atributos obligatorios `autoPlay loop muted playsInline` fusionada mediante la clase `mix-blend-screen` sobre el fondo oscuro del sistema.
    * **Capa 2 (Interacción):** Contenedor posicionado absolutamente con un `z-index` superior para las ilustraciones `.SVG` de los personajes, rompiendo los límites visuales del banner (efecto Pop-out 3D).
    * **Capa 3 (Contenido/CTA):** Placa de texto con legibilidad WCAG AA y un botón único apuntando estrictamente a Google Play.

## 3. Aislamiento del Carrito y Lógica Logística [REQ-FE-13]
* **Destino:** `src/components/cart/CartDrawer.tsx` y `src/hooks/useCart.ts`.
* **Lógica de Negocio:** El hook debe procesar de forma pura las operaciones matemáticas: `Subtotal`, `IVA (16%)`, el cálculo reactivo del umbral de envío gratis ($1,500.00 MXN) y la detección del Código Postal.
* **Regla Postal:** Si el CP inicia con "97", setear el tipo de entrega como "LOCAL" (Llega hoy); de lo contrario, mutar a "EXTERNAL_COURIER" (Paquetería).

## 4. Vitrina de Personajes Interactiva [REQ-FE-05]
* **Destino:** `src/components/home/CharacterGrid.tsx` y `src/components/ui/FlipCard.tsx`.
* **UI/UX:** Construir las tarjetas rotatorias en 3D utilizando exclusivamente clases de Tailwind para la transformación (`rotate-y-180`) y la propiedad `backface-visibility: hidden`. Al pasar el cursor o tocar en dispositivos móviles, la tarjeta debe girar 180 grados mostrando el reverso del Lore.