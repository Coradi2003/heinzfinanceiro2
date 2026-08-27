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

export const useAgendaStore = create<AgendaStore>()((set, get) => ({
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

     const { data: inserted, error } = await supabase.from('agendamentos').insert([{
        ...dataToInsert,
        user_id: userData.user.id
     }]).select().single();

     if (inserted) {
        set((state) => ({ agendamentos: [...state.agendamentos, inserted as Agendamento] }));

        // O sinal fica vinculado ao agendamento. A chave estrangeira garante
        // que ele seja removido automaticamente se o agendamento for excluído.
        if (dataToInsert.valorSinal > 0) {
          const hoje = new Date();
          const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}T12:00:00.000Z`;
          await useFinanceiroStore.getState().addTransacao({
            tipo: 'receita',
            categoria: 'Sinal de Procedimento',
            descricao: `Sinal - ${dataToInsert.clienteNome} (${dataToInsert.servico})`,
            valor: Number(dataToInsert.valorSinal),
            metodo: dataToInsert.metodoSinal || 'Pix',
            data: dataHoje,
            conta: 'Empresa',
            agendamento_id: inserted.id,
          });
        }
     } else if (error) {
        console.error("Erro ao adicionar agendamento:", error);
        throw error;
     }
  },

  updateAgendamento: async (id, dataToUpdate) => {
     const supabase = createClient();
     const current = get().agendamentos.find(a => a.id === id);
     const { error } = await supabase.from('agendamentos').update(dataToUpdate).eq('id', id);
     if (error) {
        console.error("Erro ao atualizar agendamento:", error);
        throw error;
     }
     
     // Ao editar o sinal, sincroniza o mesmo lançamento em vez de duplicá-lo.
     if (dataToUpdate.valorSinal !== undefined && current) {
       const novoSinal = Number(dataToUpdate.valorSinal) || 0;
       const clienteNome = dataToUpdate.clienteNome || current?.clienteNome || "Cliente";
       const servico = dataToUpdate.servico || current?.servico || "Procedimento";
       const metodoSinal = dataToUpdate.metodoSinal || current?.metodoSinal || 'Pix';
       const hoje = new Date();
       const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}T12:00:00.000Z`;

       const descricaoAntiga = `Sinal - ${current.clienteNome} (${current.servico})`;
       const transacaoVinculada = useFinanceiroStore.getState().transacoes.find(
         t => (t.agendamento_id === id || (!t.agendamento_id && t.descricao === descricaoAntiga))
           && (t.categoria === 'Sinal de Procedimento' || t.categoria === 'Sinal de Tatuagem')
       );

       if (novoSinal <= 0) {
         if (transacaoVinculada) {
           await useFinanceiroStore.getState().removeTransacao(transacaoVinculada.id);
         } else if (current.valorSinal > 0) {
           await supabase.from('transacoes').delete().eq('descricao', descricaoAntiga).eq('categoria', 'Sinal de Procedimento');
           await useFinanceiroStore.getState().carregarTransacoes();
         }
       } else if (transacaoVinculada) {
         await useFinanceiroStore.getState().updateTransacao(transacaoVinculada.id, {
           descricao: `Sinal - ${clienteNome} (${servico})`,
           valor: novoSinal,
           metodo: metodoSinal,
           agendamento_id: id,
         });
       } else {
         await useFinanceiroStore.getState().addTransacao({
           tipo: 'receita',
           categoria: 'Sinal de Procedimento',
           descricao: `Sinal - ${clienteNome} (${servico})`,
           valor: novoSinal,
           metodo: metodoSinal,
           data: dataHoje,
           conta: 'Empresa',
           agendamento_id: id,
         });
       }
     }

     set((state) => ({
       agendamentos: state.agendamentos.map(a => a.id === id ? { ...a, ...dataToUpdate } : a)
     }));
  },

  removeAgendamento: async (id) => {
     const supabase = createClient();
     const agendamento = get().agendamentos.find(a => a.id === id);

     // Compatibilidade com sinais criados antes de existir o vínculo por ID.
     if (agendamento) {
       const descricaoSinal = `Sinal - ${agendamento.clienteNome} (${agendamento.servico})`;
       const descricaoRestante = `Restante - ${agendamento.clienteNome} (${agendamento.servico})`;
       const valorRestante = Number(agendamento.valorTotal) - Number(agendamento.valorSinal || 0);
       const idsFinanceiros = useFinanceiroStore.getState().transacoes
         .filter(t =>
           t.agendamento_id === id ||
           (!t.agendamento_id && (
             (t.descricao === descricaoSinal && Math.abs(Number(t.valor) - Number(agendamento.valorSinal)) < 0.01) ||
             (t.descricao === descricaoRestante && Math.abs(Number(t.valor) - valorRestante) < 0.01)
           ))
         )
         .map(t => t.id);

       if (idsFinanceiros.length > 0) {
         await supabase.from('transacoes').delete().in('id', idsFinanceiros);
       }
     }

     const { error } = await supabase.from('agendamentos').delete().eq('id', id);
     if (error) throw error;
     set((state) => ({ agendamentos: state.agendamentos.filter(a => a.id !== id) }));
     await useFinanceiroStore.getState().carregarTransacoes();
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
          conta: 'Empresa',
          agendamento_id: id,
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
