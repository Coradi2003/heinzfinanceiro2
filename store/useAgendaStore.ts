import { create } from 'zustand';
import { createClient } from '@/lib/supabase';
import { useFinanceiroStore } from './useFinanceiroStore';

export interface Agendamento {
  id: string;
  clienteNome: string;
  servico: string;
  dataInicio: string; // ISO String
  dataFim: string; // ISO String
  imagem: string | null;
  imagens?: string[]; // Nova galeria
  valorTotal: number;
  valorSinal: number;
  status: 'agendado' | 'pendente' | 'concluido' | 'cancelado';
  cor?: string;
  telefone?: string;
  metodoSinal?: 'Dinheiro' | 'Cartão' | 'Pix';
}

interface AgendaStore {
  agendamentos: Agendamento[];
  carregarAgendamentos: () => Promise<void>;
  addAgendamento: (agendamento: Omit<Agendamento, 'id'>) => Promise<void>;
  updateAgendamento: (id: string, data: Partial<Agendamento>) => Promise<void>;
  removeAgendamento: (id: string) => Promise<void>;
  concluirAtendimento: (id: string, metodo: 'Dinheiro' | 'Cartão' | 'Pix') => Promise<void>;
}

export const useAgendaStore = create<AgendaStore>()((set) => ({
  agendamentos: [],
  
  carregarAgendamentos: async () => {
     const supabase = createClient();
     const { data: userData } = await supabase.auth.getUser();
     if (!userData.user) return;

     const { data } = await supabase.from('agendamentos').select('*').eq('user_id', userData.user.id);
     if (data) set({ agendamentos: data as Agendamento[] });
  },

  addAgendamento: async (dataToInsert) => {
     const supabase = createClient();
     const { data: userData } = await supabase.auth.getUser();
     if (!userData.user) return;

     // Se tiver sinal, lança de imediato lá no Financeiro
     if (dataToInsert.valorSinal > 0) {
        // Usar meio-dia UTC para evitar o bug de virada de dia em fusos negativos (BRT -3h)
        const hoje = new Date();
        const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}T12:00:00.000Z`;
        await useFinanceiroStore.getState().addTransacao({
          tipo: 'receita',
          categoria: 'Sinal de Procedimento',
          descricao: `Sinal - ${dataToInsert.clienteNome} (${dataToInsert.servico})`,
          valor: dataToInsert.valorSinal,
          metodo: dataToInsert.metodoSinal || 'Pix',
          data: dataHoje,
          conta: 'Empresa'
        });
     }

     const { data: inserted, error } = await supabase.from('agendamentos').insert([{
        ...dataToInsert,
        user_id: userData.user.id
     }]).select().single();

     if (inserted) {
        set((state) => ({ agendamentos: [...state.agendamentos, inserted as Agendamento] }));
     } else if (error) {
        console.error("Erro ao adicionar agendamento:", error);
        throw error;
     }
  },

  updateAgendamento: async (id, dataToUpdate) => {
     const supabase = createClient();
     const { error } = await supabase.from('agendamentos').update(dataToUpdate).eq('id', id);
     if (error) {
        console.error("Erro ao atualizar agendamento:", error);
        throw error;
     }
     
     // Se atualizou o sinal e ele é > 0, garante a transação no financeiro
     if (dataToUpdate.valorSinal && dataToUpdate.valorSinal > 0) {
       const state = useAgendaStore.getState();
       const current = state.agendamentos.find(a => a.id === id);
       const clienteNome = dataToUpdate.clienteNome || current?.clienteNome || "Cliente";
       const servico = dataToUpdate.servico || current?.servico || "Procedimento";
       const metodoSinal = dataToUpdate.metodoSinal || current?.metodoSinal || 'Pix';
       
       const hoje = new Date();
       const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}T12:00:00.000Z`;
       
       const transacoes = useFinanceiroStore.getState().transacoes;
       const jaExiste = transacoes.some(t => t.descricao.toLowerCase().includes(clienteNome.toLowerCase()) && Math.abs(t.valor - dataToUpdate.valorSinal!) < 0.01);
       if (!jaExiste) {
         await useFinanceiroStore.getState().addTransacao({
           tipo: 'receita',
           categoria: 'Sinal de Procedimento',
           descricao: `Sinal - ${clienteNome} (${servico})`,
           valor: dataToUpdate.valorSinal,
           metodo: metodoSinal,
           data: dataHoje,
           conta: 'Empresa'
         });
       }
     }

     set((state) => ({
       agendamentos: state.agendamentos.map(a => a.id === id ? { ...a, ...dataToUpdate } : a)
     }));
  },

  removeAgendamento: async (id) => {
     const supabase = createClient();
     await supabase.from('agendamentos').delete().eq('id', id);
     set((state) => ({ agendamentos: state.agendamentos.filter(a => a.id !== id) }));
  },

  concluirAtendimento: async (id, metodo: 'Dinheiro' | 'Cartão' | 'Pix') => {
     const state = useAgendaStore.getState();
     const agendamento = state.agendamentos.find(a => a.id === id);
     if (!agendamento || agendamento.status === 'concluido') return;

     // Lança a receita restante
     const valorRestante = agendamento.valorTotal - agendamento.valorSinal;
     if (valorRestante > 0) {
        // Usar meio-dia UTC para evitar o bug de virada de dia em fusos negativos (BRT -3h)
        const hoje = new Date();
        const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}T12:00:00.000Z`;
        await useFinanceiroStore.getState().addTransacao({
          tipo: 'receita',
          categoria: 'Sessão Concluída',
          descricao: `Restante - ${agendamento.clienteNome} (${agendamento.servico})`,
          valor: valorRestante,
          metodo: metodo || 'Pix',
          data: dataHoje,
          conta: 'Empresa'
        });
     }

     // Atualiza no banco
     const supabase = createClient();
     await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id);
     
     // Atualiza estado local
     set((s) => ({
       agendamentos: s.agendamentos.map(a => a.id === id ? { ...a, status: 'concluido' as const } : a)
     }));
  }
}));
