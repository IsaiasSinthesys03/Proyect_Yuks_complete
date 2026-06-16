import { useState, useMemo } from 'react';

export type ShippingType = 'LOCAL' | 'EXTERNAL_COURIER' | null;

export const useCart = (total: number) => {
    const [zipCode, setZipCode] = useState<string>('');

    // Constantes de negocio [REQ-FE-13]
    const THRESHOLD_FREE_SHIPPING = 1500;
    const IVA_RATE = 0.16;
    const LOCAL_RATE = 49;
    const EXTERNAL_RATE = 199;

    // Cálculos matemáticos y financieros reactivos
    const subtotal = total;
    const iva = subtotal * IVA_RATE;
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
    }, [zipCode, hasFreeShipping]);

    const finalTotal = subtotal + iva + shippingInfo.cost;

    const handleCpChange = (val: string) => {
        // Limpiamos la entrada para aceptar únicamente caracteres numéricos
        const cleanVal = val.replace(/\D/g, '').slice(0, 5);
        setZipCode(cleanVal);
    };

    return {
        zipCode,
        handleCpChange,
        subtotal,
        iva,
        missingForFree,
        hasFreeShipping,
        shippingType: shippingInfo.type,
        shippingCost: shippingInfo.cost,
        finalTotal,
        THRESHOLD_FREE_SHIPPING
    };
};
