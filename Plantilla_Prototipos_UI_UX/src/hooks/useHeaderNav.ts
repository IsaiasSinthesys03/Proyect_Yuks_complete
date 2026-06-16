import { useState, useEffect, useRef, useCallback } from 'react';

export const useHeaderNav = () => {
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    // [ENTERPRISE] Omnibox Predictivo: se muestra a partir de 3 caracteres
    const showOmnibox = searchQuery.length >= 3;
    
    // Referencia al input de búsqueda para poder enfocarlo si se requiere
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Aislar el estado del scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        // Inicializar
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // [REQ-FE-12] Implementar el Event Listener global para capturar el atajo Cmd + K o Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsCommandOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    const closeCommand = useCallback(() => {
        setIsCommandOpen(false);
    }, []);

    return {
        scrolled,
        searchQuery,
        setSearchQuery,
        showOmnibox,
        clearSearch,
        isCommandOpen,
        setIsCommandOpen,
        closeCommand,
        searchInputRef
    };
};
