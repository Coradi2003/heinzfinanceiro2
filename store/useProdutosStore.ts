import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

export interface Produto {
  id: string;
  nome: string;
  valor: number;
}

interface ProdutosStore {
  produtos: Produto[];
  carregarProdutos: () => Promise<void>;
  addProduto: (produto: Omit<Produto, 'id'>) => Promise<void>;
  updateProduto: (id: string, data: Partial<Produto>) => Promise<void>;
  removeProduto: (id: string) => Promise<void>;
}

export const useProdutosStore = create<ProdutosStore>()((set) => ({
  produtos: [],
  
  carregarProdutos: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('produtos').select('*').eq('user_id', userData.user.id);
    if (data) set({ produtos: data as Produto[] });
  },

  addProduto: async (data) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: insertedData, error } = await supabase
      .from('produtos')
      .insert([{ ...data, user_id: userData.user.id }])
      .select()
      .single();

    if (error) {
      alert("ERRO AO SALVAR PRODUTO: " + error.message);
      console.error(error);
    } else if (insertedData) {
      set((state) => ({ produtos: [...state.produtos, insertedData as Produto] }));
    }
  },

  updateProduto: async (id, dataToUpdate) => {
    const supabase = createClient();
    await supabase.from('produtos').update(dataToUpdate).eq('id', id);
    set((state) => ({
      produtos: state.produtos.map(p => p.id === id ? { ...p, ...dataToUpdate } : p)
    }));
  },

  removeProduto: async (id) => {
    const supabase = createClient();
    await supabase.from('produtos').delete().eq('id', id);
    set((state) => ({ produtos: state.produtos.filter(p => p.id !== id) }));
  }
}));
