"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useClientesStore } from "@/store/useClientesStore";
import { Users, FileText, Wrench, Box, TrendingUp, TrendingDown, BarChart2, CheckCircle2, Clock, XCircle, QrCode, Banknote, CreditCard, Calendar, Gift, AlertTriangle, X, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/dashboard/dashboardCalculations";
import { ModalTransacao } from "@/components/financeiro/ModalTransacao";


const MESES = [
  { val: 1, label: "Janeiro" },
  { val: 2, label: "Fevereiro" },
  { val: 3, label: "Março" },
  { val: 4, label: "Abril" },
  { val: 5, label: "Maio" },
  { val: 6, label: "Junho" },
  { val: 7, label: "Julho" },
  { val: 8, label: "Agosto" },
  { val: 9, label: "Setembro" },
  { val: 10, label: "Outubro" },
  { val: 11, label: "Novembro" },
  { val: 12, label: "Dezembro" },
];

const ANOS = [2025, 2026, 2027, 2028];

export default function DashboardPage() {
  const { agendamentos: rawAgendamentos } = useAgendaStore();
  const agendamentos = rawAgendamentos.filter(a => a.valorTotal > 0);
  const { transacoes, despesasFixas } = useFinanceiroStore();
  const { produtos } = useProdutosStore();
  const { servicos } = useServicosStore();
  const { clientes } = useClientesStore();

  const hoje = new Date();
  const [mesGrafico, setMesGrafico] = useState<number>(hoje.getMonth() + 1);
  const [anoGrafico, setAnoGrafico] = useState<number>(hoje.getFullYear());
  const contaVisao = 'Empresa';
  const [modalListaStatus, setModalListaStatus] = useState<'pendente' | 'concluido' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalEntradaOpen, setIsModalEntradaOpen] = useState(false);


  // -- LOGICA DE FILTRO DE DATA POR MÊS/ANO SELECIONADO --
  // -- FINANCEIRO DO MÊS (Card de Saldo - usa anoGrafico e mesGrafico selecionados) --
  const baseTransMes = transacoes.filter(t => {
    const d = parseLocalDate(t.data);
    return d.getFullYear() === anoGrafico && (d.getMonth() + 1) === mesGrafico && t.conta === contaVisao;
  });

  const receitasMes = baseTransMes.filter(t => t.tipo === 'receita');

  // Normalização de nome de método de pagamento (insensível a maiúsculas/minúsculas e acentos)
  const getMetodoNorm = (m?: string): 'Pix' | 'Dinheiro' | 'Cartão' | null => {
    if (!m) return null;
    const lower = m.toLowerCase().trim();
    if (lower.includes('pix')) return 'Pix';
    if (lower.includes('dinheiro')) return 'Dinheiro';
    if (lower.includes('cart')) return 'Cartão';
    return null;
  };

  // Faturamento recebido no mês: usa exclusivamente os lançamentos financeiros.
  // Sinais e valores restantes já geram transações ao serem recebidos. Somar
  // também os agendamentos faria o mesmo pagamento aparecer no mês do recebimento
  // e novamente no mês em que a sessão foi marcada.
  const calcularFaturamentoMes = (mes: number, ano: number): number => {
    const receitasMesLoc = transacoes.filter(t => {
      const d = parseLocalDate(t.data);
      return d.getFullYear() === ano && (d.getMonth() + 1) === mes && t.conta === contaVisao && t.tipo === 'receita';
    });

    return receitasMesLoc.reduce((acc, t) => acc + t.valor, 0);
  };

  // 1. Somar por método a partir das transações do financeiro
  let porPix = 0;
  let porDinheiro = 0;
  let porCartao = 0;

  receitasMes.forEach(t => {
    const norm = getMetodoNorm(t.metodo);
    if (norm === 'Pix') porPix += t.valor;
    else if (norm === 'Dinheiro') porDinheiro += t.valor;
    else if (norm === 'Cartão') porCartao += t.valor;
  });

  const totalMetodos = Math.max(porPix + porDinheiro + porCartao, 1);
  const faturamento = calcularFaturamentoMes(mesGrafico, anoGrafico);
  const despesas = baseTransMes.filter(t => t.tipo === 'despesa').reduce((a,b) => a + b.valor, 0);
  const saldo = faturamento - despesas;

  // -- FINANCEIRO DO PERÍODO (Gráficos / Breakdown por Método - usa filtro de período) --
  const baseTrans = transacoes.filter(t => {
    const d = parseLocalDate(t.data);
    const matchData = d.getFullYear() === anoGrafico && (d.getMonth() + 1) === mesGrafico;
    const matchConta = t.conta === contaVisao;
    return matchData && matchConta;
  });
  
  const receitas = baseTrans.filter(t => t.tipo === 'receita');

  // -- EVOLUÇÃO (Agendamentos - Gráfico usa o período fechado) --
  const agndsPeriodo = agendamentos.filter(a => {
    const d = parseLocalDate(a.dataInicio);
    return d.getFullYear() === anoGrafico && (d.getMonth() + 1) === mesGrafico;
  });

  // -- CARDS DE STATUS --
  // Aprovados: O que foi concluído no período selecionado
  const aprovadosTot = agndsPeriodo.filter(a => a.status === 'concluido').reduce((acc, curr) => acc + Number(curr.valorTotal || 0), 0);
  
  // Pendentes: O que está agendado/pendente no período selecionado
  const agndsFuturos = agndsPeriodo.filter(a => a.status === 'agendado' || a.status === 'pendente');
  const pendentesTot = agndsFuturos.reduce(
    (acc, curr) => acc + Math.max(0, Number(curr.valorTotal || 0) - Number(curr.valorSinal || 0)),
    0
  );
  
  // Rejeitados: Cancelados no período selecionado
  const agndsRejeitados = agndsPeriodo.filter(a => a.status === 'cancelado');
  const rejeitadosTot = agndsRejeitados.reduce((acc, curr) => acc + Number(curr.valorTotal || 0), 0);

  // -- GRÁFICO ANUAL: receitas financeiras por mês do ano selecionado --
  const vendasPorMes = MESES.map(m => {
    return {
      mes: m.label.substring(0, 3),
      val: m.val,
      total: calcularFaturamentoMes(m.val, anoGrafico),
    };
  });
  const maxVendasMes = Math.max(...vendasPorMes.map(v => v.total), 1);

  const pendentesCount = agendamentos.filter(a => a.status === 'pendente' || a.status === 'agendado').length;
  const pendentesTotalGeral = agendamentos
    .filter(a => a.status === 'pendente' || a.status === 'agendado')
    .reduce((total, a) => total + Math.max(0, Number(a.valorTotal || 0) - Number(a.valorSinal || 0)), 0);
  const concluidosCount = agendamentos.filter(a => a.status === 'concluido').length;

  // -- ANIVERSARIANTES DO DIA --
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth() + 1;

  const aniversariantes = clientes.filter(c => {
    if (!c.dataNascimento) return false;
    let dia: number, mes: number;

    if (c.dataNascimento.includes('/')) {
      // Formato DD/MM/AAAA (salvo pelo ModalCliente com máscara)
      const parts = c.dataNascimento.split('/');
      if (parts.length !== 3) return false;
      dia = parseInt(parts[0]);
      mes = parseInt(parts[1]);
    } else if (c.dataNascimento.includes('-')) {
      // Formato YYYY-MM-DD (ISO)
      const parts = c.dataNascimento.split('-');
      if (parts.length !== 3) return false;
      mes = parseInt(parts[1]);
      dia = parseInt(parts[2]);
    } else {
      return false;
    }

    return dia === diaHoje && mes === mesHoje;
  });

  // -- LEMBRETE DE DESPESAS FIXAS PENDENTES --
  const despesasFixasJaLancadas = transacoes
    .filter(t => {
      const d = parseLocalDate(t.data);
      return d.getFullYear() === hoje.getFullYear() && (d.getMonth() + 1) === (hoje.getMonth() + 1);
    })
    .map(t => t.descricao.toLowerCase());

  const despesasFixasPendentes = despesasFixas.filter(df => !despesasFixasJaLancadas.includes(df.descricao.toLowerCase()));

  const [metodoRelatorio, setMetodoRelatorio] = useState<'todos' | 'Pix' | 'Dinheiro' | 'Cartão'>('todos');

  const agendamentosFiltrados = agendamentos
    .filter(a => {
      if (!modalListaStatus) return false;
      const matchStatus = modalListaStatus === 'pendente' 
        ? (a.status === 'pendente' || a.status === 'agendado')
        : a.status === 'concluido';
      
      const matchSearch = (a.clienteNome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.servico || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dataInicio || '').getTime();
      const dateB = new Date(b.dataInicio || '').getTime();
      return modalListaStatus === 'pendente' ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-lg mx-auto md:max-w-4xl space-y-4 mb-20 md:mb-0">
      {/* 0. Seletor de Período e Quick Actions */}
          <div className="bg-white border border-gray-100 p-4 rounded-[28px] shadow-sm space-y-4 no-print">
             {/* Seletor de Mês e Ano Geral */}
             <div className="flex items-center justify-between gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-2">📅 Período:</span>
                <div className="flex gap-2 flex-1 max-w-xs">
                  <select
                    value={mesGrafico}
                    onChange={(e) => setMesGrafico(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-primary flex-1 shadow-sm"
                  >
                    {MESES.map(m => (
                      <option key={m.val} value={m.val}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={anoGrafico}
                    onChange={(e) => setAnoGrafico(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-primary flex-1 shadow-sm"
                  >
                    {ANOS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
             </div>

             <div className="flex gap-2">
                <button
                  onClick={() => setIsModalEntradaOpen(true)}
                  className="flex-1 bg-emerald-600 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg active:scale-95 pointer-events-auto"
                >
                  <Plus size={16} /> Nova Entrada
                </button>
                <Link
                  href="/agenda"
                  className="flex-1 bg-violet-600 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition shadow-lg active:scale-95"
                >
                  <Calendar size={16} /> Agenda
                </Link>
             </div>
             <div className="flex gap-2">
                <Link 
                  href={`/relatorio?tipo=cliente&conta=${contaVisao}`}
                  className="flex-1 bg-gray-900 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg active:scale-95"
                >
                  <FileText size={14} /> Relatório por Cliente
                </Link>
                <Link 
                  href={`/relatorio?tipo=anual&ano=${anoGrafico}&conta=${contaVisao}`}
                  className="flex-1 bg-white border-2 border-gray-900 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition active:scale-95"
                >
                  <FileText size={14} /> Relatório Anual
                </Link>
             </div>
          </div>

      {/* 1. Header Card (Faturamento) */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-[28px] shadow-lg text-white relative overflow-hidden">
        <div className="absolute -right-4 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <p className="text-sm font-medium opacity-80 mb-1 z-10 relative">Faturamento ({MESES.find(m => m.val === mesGrafico)?.label} / {anoGrafico})</p>
        <h2 className="text-4xl font-bold mb-6 z-10 relative">{faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</h2>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-80 tracking-wider">Total de Entradas</p>
              <p className="text-sm font-bold">{faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 1.2 Alerta de Aniversário */}
      {aniversariantes.length > 0 && (
        <Link href="/clientes" className="block">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-[24px] shadow-md text-white flex items-center gap-4 animate-pulse-subtle hover:scale-[1.02] transition pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Gift size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Aniversariante(s) do Dia!</p>
              <h3 className="font-bold truncate">
                {aniversariantes.map(c => c.nome).join(", ")}
              </h3>
              <p className="text-[10px] opacity-80 mt-0.5 whitespace-nowrap">Clique para ver no cadastro!</p>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              Ver lista
            </div>
          </div>
        </Link>
      )}

      {/* 1.5 Bloco de Entradas por Método */}
      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100/50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Entradas do Mês por Forma de Pagamento</p>
        <div className="space-y-3">

          {/* PIX */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <QrCode size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">Pix</span>
                <span className="text-xs font-extrabold text-gray-900">{porPix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${(porPix/totalMetodos)*100}%` }}></div>
              </div>
            </div>
          </div>

          {/* DINHEIRO */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 shrink-0">
              <Banknote size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">Dinheiro</span>
                <span className="text-xs font-extrabold text-gray-900">{porDinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${(porDinheiro/totalMetodos)*100}%` }}></div>
              </div>
            </div>
          </div>

          {/* CARTÃO */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <CreditCard size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">Cartão</span>
                <span className="text-xs font-extrabold text-gray-900">{porCartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${(porCartao/totalMetodos)*100}%` }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Evolução dos Agendamentos */}
      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 mt-4">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <BarChart2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">Faturamento Anual</h3>
            <p className="text-xs text-gray-400">Vendas por mês — {anoGrafico}</p>
          </div>
        </div>

        {/* Cards de Status do mês selecionado */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-white/60 rounded-full p-1 mb-1">
               <CheckCircle2 size={12} className="text-green-600" />
            </div>
            <p className="text-[9px] font-bold text-green-700 uppercase mb-1 whitespace-nowrap">Concluídos</p>
            <p className="text-sm font-black text-green-900">{aprovadosTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>

          <div className="bg-[#fefce8] border border-[#fef08a] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-white/60 rounded-full p-1 mb-1">
               <Clock size={12} className="text-yellow-600" />
            </div>
            <p className="text-[9px] font-bold text-yellow-700 uppercase mb-1 whitespace-nowrap">Pendentes</p>
            <p className="text-sm font-black text-yellow-900">{pendentesTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>

          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-white/60 rounded-full p-1 mb-1">
               <XCircle size={12} className="text-red-500" />
            </div>
            <p className="text-[9px] font-bold text-red-700 uppercase mb-1 whitespace-nowrap">Cancelados</p>
            <p className="text-sm font-black text-red-900">{rejeitadosTot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
          </div>
        </div>

        {/* Gráfico de barras mensais do ano */}
        <div className="relative">
          {/* Linha base */}
          <div className="absolute bottom-6 left-0 right-0 h-[1px] bg-gray-100"></div>
          
          <div className="flex items-end justify-between gap-1 px-1 h-40">
            {vendasPorMes.map((item) => {
              const pct = maxVendasMes > 0 ? (item.total / maxVendasMes) * 100 : 0;
              const isCurrentMonth = item.val === mesGrafico;
              const hasValue = item.total > 0;
              return (
                <div key={item.val} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                  {/* Valor em cima */}
                  {hasValue && (
                    <span className={`text-[8px] font-black leading-none mb-1 text-center ${isCurrentMonth ? 'text-primary' : 'text-gray-500'}`}>
                      {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                  {!hasValue && <span className="text-[8px] text-gray-200 mb-1">—</span>}
                  {/* Barra */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-700 ${isCurrentMonth ? 'bg-primary shadow-md shadow-primary/20' : hasValue ? 'bg-gray-200' : 'bg-gray-100'}`}
                    style={{ height: `${Math.max(pct, hasValue ? 6 : 2)}%`, maxHeight: '120px', minHeight: hasValue ? '6px' : '2px' }}
                  />
                  {/* Nome do mês */}
                  <span className={`text-[8px] font-bold uppercase tracking-wide mt-1 ${isCurrentMonth ? 'text-primary' : 'text-gray-400'}`}>
                    {item.mes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Grid de Atributos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pt-2">
        
        <Link href="/clientes" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
            <Users size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{clientes.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Clientes</p>
        </Link>

        <button 
          onClick={() => setModalListaStatus('pendente')}
          className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition w-full"
        >
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
            <Clock size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{pendentesCount}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Pendentes</p>
          <p className="text-xs font-black text-yellow-700 mt-1">{pendentesTotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </button>

        <button 
          onClick={() => setModalListaStatus('concluido')}
          className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition w-full"
        >
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
            <CheckCircle2 size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{concluidosCount}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Concluídos</p>
        </button>

        <Link href="/servicos" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
            <Wrench size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{servicos.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Serviços</p>
        </Link>

        <Link href="/produtos" className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100/50 gap-2 hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500">
            <Box size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{produtos.length}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400">Produtos</p>
        </Link>
      </div>

      {modalListaStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh] transition-transform scale-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${modalListaStatus === 'pendente' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                  {modalListaStatus === 'pendente' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {modalListaStatus === 'pendente' ? 'Agendamentos Pendentes' : 'Agendamentos Concluídos'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {agendamentosFiltrados.length} {agendamentosFiltrados.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setModalListaStatus(null); setSearchQuery(""); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-gray-50/50 border-b border-gray-100">
              <input 
                type="text"
                placeholder="Buscar por cliente ou serviço..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-primary transition"
              />
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {agendamentosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Nenhum agendamento encontrado.</p>
                </div>
              ) : (
                agendamentosFiltrados.map(a => (
                  <div key={a.id} className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="font-bold text-gray-800 truncate">{a.clienteNome}</h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{a.servico}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                        {a.dataInicio ? format(parseISO(a.dataInicio), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400">Total</p>
                        <p className="text-sm font-extrabold text-primary">
                          {a.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      {a.telefone && (
                        <a 
                          href={`https://wa.me/55${a.telefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ModalTransacao isOpen={isModalEntradaOpen} onClose={() => setIsModalEntradaOpen(false)} />
    </div>
  );
}
