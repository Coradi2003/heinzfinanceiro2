"use client";

import { useEffect } from "react";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useClientesStore } from "@/store/useClientesStore";
import { createClient } from "@/lib/supabase";

export function DataLoader() {
  const carregarAgendamentos = useAgendaStore(state => state.carregarAgendamentos);
  const carregarTransacoes = useFinanceiroStore(state => state.carregarTransacoes);
  const carregarDespesasFixas = useFinanceiroStore(state => state.carregarDespesasFixas);
  const carregarProdutos = useProdutosStore(state => state.carregarProdutos);
  const carregarServicos = useServicosStore(state => state.carregarServicos);
  const carregarConfiguracao = useConfigStore(state => state.carregarConfiguracao);
  const carregarClientes = useClientesStore(state => state.carregarClientes);

  useEffect(() => {
    const supabase = createClient();

    // Carrega dados SOMENTE quando a sessão estiver confirmada
    const carregarTudo = () => {
      carregarAgendamentos();
      carregarTransacoes();
      carregarDespesasFixas();
      carregarProdutos();
      carregarServicos();
      carregarConfiguracao();
      carregarClientes();
    };

    // Escuta mudanças de autenticação (login, refresh de token, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Sessão confirmada: carrega todos os dados
        carregarTudo();
      }
    });

    // Registro do Service Worker (PWA) - Robusto
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('PWA: Service Worker registrado!', reg.scope))
          .catch(err => console.warn('PWA: Erro ao registrar SW:', err));
      };

      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register);
    }

    // Limpa o listener ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
