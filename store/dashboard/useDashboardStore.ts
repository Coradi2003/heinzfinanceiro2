import { create } from 'zustand';

interface DashboardState {
  mesSelected: number;
  anoSelected: number;
  horasMeta: number;
  setMesSelected: (mes: number) => void;
  setAnoSelected: (ano: number) => void;
  setHorasMeta: (horas: number) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => {
  const hoje = new Date();
  
  // Read from localStorage safely on first load
  let initialHoras = 150;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('paty_heinz_dashboard_horas_meta');
    if (saved) {
      initialHoras = parseInt(saved, 10) || 150;
    }
  }

  return {
    mesSelected: hoje.getMonth() + 1,
    anoSelected: hoje.getFullYear(),
    horasMeta: initialHoras,
    setMesSelected: (mesSelected) => set({ mesSelected }),
    setAnoSelected: (anoSelected) => set({ anoSelected }),
    setHorasMeta: (horasMeta) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('paty_heinz_dashboard_horas_meta', String(horasMeta));
      }
      set({ horasMeta });
    }
  };
});
