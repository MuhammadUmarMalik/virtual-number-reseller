import { create } from "zustand";

interface WalletState {
  balance: string | null;
  setBalance: (balance: string) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
  clearWallet: () => set({ balance: null }),
}));
