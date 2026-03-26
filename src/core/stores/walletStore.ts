import { create } from 'zustand';

interface WalletStore {
  walletId: string | null;
  balance: number;
  currency: string;
  isLoading: boolean;
  setWalletId: (id: string) => void;
  setBalance: (balance: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  walletId: null,
  balance: 0,
  currency: 'EGP',
  isLoading: false,
  setWalletId: (walletId) => set({ walletId }),
  setBalance: (balance) => set({ balance }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ walletId: null, balance: 0, isLoading: false }),
}));
