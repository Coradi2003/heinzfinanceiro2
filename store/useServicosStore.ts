import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

export interface Servico {
  id: string;
  nome: string;
  tempo: string;
  valorBase: number;
}

interface ServicosStore {
  servicos: Servico[];
  carregarServicos: () => Promise<void>;
  addServico: (servico: Omit<Servico, 'id'>) => Promise<void>;
  updateServico: (id: string, data: Partial<Servico>) => Promise<void>;
  removeServico: (id: string) => Promise<void>;
}

export const useServicosStore = create<ServicosStore>()((set) => ({
  servicos: [],
  
  carregarServicos: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('servicos').select('*').eq('user_id', userData.user.id);
    if (data) set({ servicos: data as Servico[] });
  },

  addServico: async (data) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: insertedData } = await supabase
      .from('servicos')
      .insert([{ ...data, user_id: userData.user.id }])
      .select()
      .single();

    if (insertedData) {
      set((state) => ({ servicos: [...state.servicos, insertedData as Servico] }));
    }
  },

  updateServico: async (id, dataToUpdate) => {
    const supabase = createClient();
    await supabase.from('servicos').update(dataToUpdate).eq('id', id);
    set((state) => ({
      servicos: state.servicos.map(s => s.id === id ? { ...s, ...dataToUpdate } : s)
    }));
  },

  removeServico: async (id) => {
    const supabase = createClient();
    await supabase.from('servicos').delete().eq('id', id);
    set((state) => ({ servicos: state.servicos.filter(s => s.id !== id) }));
  }
}));
