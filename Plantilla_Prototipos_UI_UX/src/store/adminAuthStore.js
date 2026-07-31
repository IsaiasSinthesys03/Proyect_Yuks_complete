import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Custom storage que expira a la hora (3600000 ms)
const expirableStorage = {
    getItem: (name) => {
        const str = localStorage.getItem(name);
        if (!str) return null;
        try {
            const data = JSON.parse(str);
            if (Date.now() - data.state.timestamp > 3600000) {
                localStorage.removeItem(name);
                return null;
            }
            return JSON.stringify(data);
        } catch (e) {
            return null;
        }
    },
    setItem: (name, value) => {
        const data = JSON.parse(value);
        data.state.timestamp = Date.now();
        localStorage.setItem(name, JSON.stringify(data));
    },
    removeItem: (name) => localStorage.removeItem(name),
};

export const useAdminAuthStore = create(
    persist(
        (set, get) => ({
            accessToken: null,
            tempToken: null,
            setupToken: null,
            user: null,
            timestamp: null,

            setTempToken: (tempToken) => set({ tempToken }),
            setSetupToken: (setupToken) => set({ setupToken }),
            setSession: (accessToken, user) => set({ accessToken, user, tempToken: null, setupToken: null, timestamp: Date.now() }),
            logout: () => set({ accessToken: null, tempToken: null, setupToken: null, user: null, timestamp: null }),
            getToken: () => get().accessToken,
        }),
        {
            name: 'admin-auth-storage',
            storage: createJSONStorage(() => expirableStorage),
        }
    )
);
