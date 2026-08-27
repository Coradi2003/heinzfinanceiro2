import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

export interface Transacao {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  metodo: 'Dinheiro' | 'Cartão' | 'Pix';
  data: string; // ISO String
  conta: string;
  agendamento_id?: string | null;
}

export interface DespesaFixa {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  vencimento: number;
  conta: string;
}

interface FinanceiroStore {
  transacoes: Transacao[];
  despesasFixas: DespesaFixa[];
  carregarTransacoes: () => Promise<void>;
  addTransacao: (transacao: Omit<Transacao, 'id'>) => Promise<void>;
  updateTransacao: (id: string, data: Partial<Transacao>) => Promise<void>;
  removeTransacao: (id: string) => Promise<void>;
  
  // Despesas Fixas
  carregarDespesasFixas: () => Promise<void>;
  addDespesaFixa: (despesa: Omit<DespesaFixa, 'id'>) => Promise<void>;
  removeDespesaFixa: (id: string) => Promise<void>;
}

export const useFinanceiroStore = create<FinanceiroStore>()((set) => ({
  transacoes: [],
  despesasFixas: [],
  
  carregarTransacoes: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', userData.user.id)
      .not('valor', 'is', null)
      .gt('valor', 0)
      .order('data', { ascending: false });
    if (data) set({ transacoes: data as Transacao[] });
  },

  addTransacao: async (transacaoData) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: insertedData, error } = await supabase
      .from('transacoes')
      .insert([{ ...transacaoData, user_id: userData.user.id }])
      .select()
      .single();
    
    if (insertedData) {
      set((state) => ({ transacoes: [insertedData as Transacao, ...state.transacoes] }));
    } else if (error) {
       console.error(error);
       throw error;
    }
  },

  updateTransacao: async (id, dataToUpdate) => {
    const supabase = createClient();
    await supabase.from('transacoes').update(dataToUpdate).eq('id', id);
    set((state) => ({
      transacoes: state.transacoes.map(t => t.id === id ? { ...t, ...dataToUpdate } : t)
    }));
  },

  removeTransacao: async (id) => {
    const supabase = createClient();
    await supabase.from('transacoes').delete().eq('id', id);
    set((state) => ({ transacoes: state.transacoes.filter(t => t.id !== id) }));
  },

  carregarDespesasFixas: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase.from('despesas_fixas').select('*').eq('user_id', userData.user.id).order('vencimento', { ascending: true });
    if (data) set({ despesasFixas: data as DespesaFixa[] });
  },

  addDespesaFixa: async (despesaData) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: insertedData, error } = await supabase
      .from('despesas_fixas')
      .insert([{ ...despesaData, user_id: userData.user.id }])
      .select()
      .single();
    
    if (insertedData) {
      set((state) => ({ despesasFixas: [...state.despesasFixas, insertedData as DespesaFixa] }));
    }
  },

  removeDespesaFixa: async (id) => {
    const supabase = createClient();
    await supabase.from('despesas_fixas').delete().eq('id', id);
    set((state) => ({ despesasFixas: state.despesasFixas.filter(d => d.id !== id) }));
  }
}));
