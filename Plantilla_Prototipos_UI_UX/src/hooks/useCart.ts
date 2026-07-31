import { useState, useMemo } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useCheckoutConfig } from '../api/checkout';

export type ShippingType = 'LOCAL' | 'EXTERNAL_COURIER' | null;

// Fallbacks SOLO mientras carga la config real (GET /api/checkout/config).
const FALLBACK_THRESHOLD = 1500;
const FALLBACK_LOCAL_RATE = 49;
const FALLBACK_EXTERNAL_RATE = 199;
const IVA_RATE = 0.16;

/**
 * useCart (Fase 42) — estado REAL del carrito.
 *
 * - Items/subtotal: del `cartStore` (Zustand), ya no del mock `cartTotal`.
 * - Umbral de envío gratis DINÁMICO por Tier (REQ-FE-13 + M-17): el backend
 *   expone `freeShippingThreshold` y los multiplicadores por tier en
 *   `/api/checkout/config`; el tier viene del perfil autenticado (`authStore`).
 *   Ej. GOLD (×0.75): umbral $1500 → $1125.
 * - IVA: los precios del catálogo son "IVA Incluido" y el backend NO lo suma
 *   (total = subtotal + envío). La línea de IVA es un DESGLOSE informativo
 *   del impuesto contenido, no un cargo adicional (paridad con el backend).
 */
export const useCart = () => {
    const [zipCode, setZipCode] = useState<string>('');

    const items = useCartStore((s: any) => s.items);
    const user = useAuthStore((s: any) => s.user);
    const { data: config } = useCheckoutConfig();

    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

    // Umbral efectivo = umbral base × multiplicador del tier del usuario.
    const baseThreshold = config?.freeShippingThreshold ?? FALLBACK_THRESHOLD;
    const tier = user?.tierLevel ?? 'BRONZE';
    const tierMultiplier = config?.tierMultipliers?.[tier] ?? 1.0;
    const THRESHOLD_FREE_SHIPPING = baseThreshold * tierMultiplier;

    const LOCAL_RATE = config?.localShippingCost ?? FALLBACK_LOCAL_RATE;
    const EXTERNAL_RATE = config?.externalShippingCost ?? FALLBACK_EXTERNAL_RATE;

    // IVA incluido (desglose dinámico): parte del subtotal que corresponde al impuesto.
    const vatPercentage = config?.vatPercentage ?? 16;
    const vatRate = vatPercentage / 100;
    const iva = vatRate > 0 ? subtotal - subtotal / (1 + vatRate) : 0;
    const missingForFree = Math.max(0, THRESHOLD_FREE_SHIPPING - subtotal);
    const hasFreeShipping = subtotal >= THRESHOLD_FREE_SHIPPING;

    // Regla Postal Pura y Funcional [REQ-FE-13]
    const shippingInfo = useMemo(() => {
        if (zipCode.length < 5) {
            return { type: null as ShippingType, cost: 0 };
        }

        // Si el CP inicia con "97", el tipo es LOCAL. De lo contrario, EXTERNAL_COURIER.
        const isLocal = zipCode.startsWith('97');
        const baseCost = isLocal ? LOCAL_RATE : EXTERNAL_RATE;
        const finalType: ShippingType = isLocal ? 'LOCAL' : 'EXTERNAL_COURIER';

        // Si supera o iguala el umbral, el envío muta a 0 de forma inmutable.
        return {
            type: finalType,
            cost: hasFreeShipping ? 0 : baseCost
        };
    }, [zipCode, hasFreeShipping, LOCAL_RATE, EXTERNAL_RATE]);

    // Total = subtotal (IVA incluido) + envío. El backend es el autoritativo.
    const finalTotal = subtotal + shippingInfo.cost;

    const handleCpChange = (val: string) => {
        // Limpiamos la entrada para aceptar únicamente caracteres numéricos
        const cleanVal = val.replace(/\D/g, '').slice(0, 5);
        setZipCode(cleanVal);
    };

    return {
        items,
        zipCode,
        handleCpChange,
        subtotal,
        iva,
        missingForFree,
        hasFreeShipping,
        shippingType: shippingInfo.type,
        shippingCost: shippingInfo.cost,
        finalTotal,
        THRESHOLD_FREE_SHIPPING,
        tier,
        tierMultiplier,
        vatPercentage
    };
};
