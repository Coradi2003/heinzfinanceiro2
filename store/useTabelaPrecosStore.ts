import { create } from "zustand";
import { createClient } from "@/lib/supabase";

export interface ItemTabelaPreco {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  duracao: string;
  ordem: number;
}

interface TabelaPrecosStore {
  itens: ItemTabelaPreco[];
  carregando: boolean;
  carregarItens: () => Promise<void>;
  adicionarItem: (item: Omit<ItemTabelaPreco, "id" | "ordem">) => Promise<void>;
  atualizarItem: (id: string, item: Partial<Omit<ItemTabelaPreco, "id">>) => Promise<void>;
  removerItem: (id: string) => Promise<void>;
  moverItem: (id: string, direcao: "cima" | "baixo") => Promise<void>;
}

export const useTabelaPrecosStore = create<TabelaPrecosStore>()((set, get) => ({
  itens: [],
  carregando: false,

  carregarItens: async () => {
    set({ carregando: true });
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      set({ carregando: false });
      return;
    }

    const { data, error } = await supabase
      .from("tabela_precos")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("ordem", { ascending: true });

    if (error) console.error("Erro ao carregar tabela de preços:", error);
    set({ itens: (data || []) as ItemTabelaPreco[], carregando: false });
  },

  adicionarItem: async (item) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Sessão expirada");

    const proximaOrdem = Math.max(0, ...get().itens.map((i) => i.ordem)) + 1;
    const { data, error } = await supabase
      .from("tabela_precos")
      .insert([{ ...item, ordem: proximaOrdem, user_id: userData.user.id }])
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ itens: [...state.itens, data as ItemTabelaPreco] }));
  },

  atualizarItem: async (id, item) => {
    const supabase = createClient();
    const { error } = await supabase.from("tabela_precos").update(item).eq("id", id);
    if (error) throw error;
    set((state) => ({
      itens: state.itens.map((atual) => atual.id === id ? { ...atual, ...item } : atual),
    }));
  },

  removerItem: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("tabela_precos").delete().eq("id", id);
    if (error) throw error;
    set((state) => ({ itens: state.itens.filter((item) => item.id !== id) }));
  },

  moverItem: async (id, direcao) => {
    const itens = [...get().itens].sort((a, b) => a.ordem - b.ordem);
    const indice = itens.findIndex((item) => item.id === id);
    const destino = direcao === "cima" ? indice - 1 : indice + 1;
    if (indice < 0 || destino < 0 || destino >= itens.length) return;

    const atual = itens[indice];
    const vizinho = itens[destino];
    const ordemAtual = atual.ordem;
    atual.ordem = vizinho.ordem;
    vizinho.ordem = ordemAtual;

    set({ itens: [...itens].sort((a, b) => a.ordem - b.ordem) });

    const supabase = createClient();
    const resultados = await Promise.all([
      supabase.from("tabela_precos").update({ ordem: atual.ordem }).eq("id", atual.id),
      supabase.from("tabela_precos").update({ ordem: vizinho.ordem }).eq("id", vizinho.id),
    ]);
    const erro = resultados.find((resultado) => resultado.error)?.error;
    if (erro) {
      await get().carregarItens();
      throw erro;
    }
  },
}));
