import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  notas: string;
  ultimaVisita: string;
  dataNascimento?: string | null;
}

interface ClientesStore {
  clientes: Cliente[];
  carregarClientes: () => Promise<void>;
  addCliente: (cliente: Omit<Cliente, 'id'>) => Promise<void>;
  updateCliente: (id: string, data: Partial<Cliente>) => Promise<void>;
  removeCliente: (id: string) => Promise<void>;
}

export const useClientesStore = create<ClientesStore>()((set) => ({
  clientes: [],
  
  carregarClientes: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('clientes').select('*').eq('user_id', userData.user.id);
    if (data) set({ clientes: data as Cliente[] });
  },

  addCliente: async (data) => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error('PWA Debug: Erro de usuário', userError);
      alert('Sua sessão expirou. Por favor, saia e entre novamente no app.');
      return;
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('clientes')
      .insert([{ ...data, user_id: userData.user.id }])
      .select()
      .single();

    if (insertError) {
      console.error('PWA Debug: Erro ao inserir cliente', insertError);
      alert('Erro ao salvar no banco: ' + insertError.message);
      return;
    }

    if (insertedData) {
      set((state) => ({ clientes: [...state.clientes, insertedData as Cliente] }));
    }
  },

  updateCliente: async (id, dataToUpdate) => {
    const supabase = createClient();
    const { error: updateError } = await supabase.from('clientes').update(dataToUpdate).eq('id', id);
    
    if (updateError) {
      console.error('PWA Debug: Erro ao atualizar', updateError);
      alert('Erro ao atualizar: ' + updateError.message);
      return;
    }

    set((state) => ({
      clientes: state.clientes.map(c => c.id === id ? { ...c, ...dataToUpdate } : c)
    }));
  },

  removeCliente: async (id) => {
    const supabase = createClient();
    await supabase.from('clientes').delete().eq('id', id);
    set((state) => ({ clientes: state.clientes.filter(c => c.id !== id) }));
  }
}));
