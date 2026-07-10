import { create } from 'zustand';

/**
 * uiStore — Estado de UI transversal del storefront (Fase 38, scaffold).
 * Toasts, banners y flags de modales/drawers. Se poblará al conectar vistas.
 */
export const useUiStore = create((set) => ({
  toast: null, // { msg, type }
  isCartOpen: false,
  isProfileOpen: false,
  isAuthModalOpen: false,
  isDonationOpen: false,
  showCookieBanner: true,
  /**
   * [Fase 45] Contexto del flujo OTP (REQ-FE-16): propósito del cambio
   * pendiente ('email_change' | 'phone_change') mientras el OtpModal está
   * abierto. El modal lo lee para invocar POST /api/auth/otp/verify.
   */
  otpPurpose: null,
  setOtpPurpose: (otpPurpose) => set({ otpPurpose }),

  showToast: (msg, type = 'success') => {
    set({ toast: { msg, type } });
    setTimeout(() => set({ toast: null }), 4000);
  },
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false }),
  openAuth: () => set({ isAuthModalOpen: true }),
  closeAuth: () => set({ isAuthModalOpen: false }),
  openDonation: () => set({ isDonationOpen: true }),
  closeDonation: () => set({ isDonationOpen: false }),
  dismissCookieBanner: () => set({ showCookieBanner: false }),
}));
