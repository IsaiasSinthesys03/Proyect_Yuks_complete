import { create } from 'zustand';

/**
 * checkoutStore — Estado del flujo de checkout (Fase 38, scaffold).
 * Dirección, cupón, monto de monedero e Idempotency Key. Se conecta en la Fase 44.
 */
export const useCheckoutStore = create((set) => ({
  addressId: null,
  couponCode: '',
  walletAmount: 0,
  termsAccepted: false,
  idempotencyKey: null, // se genera al iniciar el pago (REQ-BE-01)

  setAddress: (addressId) => set({ addressId }),
  setCoupon: (couponCode) => set({ couponCode }),
  setWalletAmount: (walletAmount) => set({ walletAmount }),
  setTermsAccepted: (termsAccepted) => set({ termsAccepted }),
  newIdempotencyKey: () => {
    const key = (crypto?.randomUUID?.() || `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    set({ idempotencyKey: key });
    return key;
  },
  reset: () => set({ addressId: null, couponCode: '', walletAmount: 0, termsAccepted: false, idempotencyKey: null }),
}));
