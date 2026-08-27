import { create } from 'zustand';

interface UIStore {
  isVendaRapidaOpen: boolean;
  openVendaRapida: () => void;
  closeVendaRapida: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  isVendaRapidaOpen: false,
  openVendaRapida: () => set({ isVendaRapidaOpen: true }),
  closeVendaRapida: () => set({ isVendaRapidaOpen: false }),
}));
