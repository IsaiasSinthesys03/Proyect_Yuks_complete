import { create } from 'zustand';

/**
 * notificationStore — Bandeja in-app + contador de no leídas (Fase 38, scaffold).
 * Se alimenta de `GET /api/profile/notifications` y de eventos WebSocket (Fase 54).
 */
export const useNotificationStore = create((set) => ({
  items: [],
  unreadCount: 0,

  setItems: (items) => set({ items }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  /** Empujar una notificación entrante en tiempo real (WS). */
  pushRealtime: (notification) =>
    set((state) => ({ items: [notification, ...state.items], unreadCount: state.unreadCount + 1 })),
  markAllRead: () => set({ unreadCount: 0 }),
}));
