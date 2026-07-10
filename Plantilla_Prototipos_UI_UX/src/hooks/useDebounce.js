import { useState, useEffect } from 'react';

/**
 * useDebounce — retrasa la propagación de un valor hasta que deja de cambiar
 * durante `delay` ms (Fase 41). Se usa para NO bombardear el backend en cada
 * pulsación del Omnibox ni en cada movimiento del slider de precio: la query
 * de TanStack solo se dispara cuando el valor debounced se estabiliza.
 */
export function useDebounce(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
}
