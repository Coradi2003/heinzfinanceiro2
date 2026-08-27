"use client";

import React, { useMemo } from "react";
import { 
  CalendarCheck2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Hourglass,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  X
} from "lucide-react";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useClientesStore } from "@/store/useClientesStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { calculateDashboardData } from "@/lib/dashboard/dashboardCalculations";
import { useDashboardStore } from "@/store/dashboard/useDashboardStore";
import { DashboardCard } from "./DashboardCard";
import { ClientRetentionGauge } from "./ClientRetentionGauge";
import { RevenueChart } from "./RevenueChart";
import { UtilizationChart } from "./UtilizationChart";

interface DashboardSectionProps {
  contaVisao: string;
  onClose: () => void;
}

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

export function DashboardSection({ contaVisao, onClose }: DashboardSectionProps) {
  const { 
    mesSelected, 
    anoSelected, 
    setMesSelected, 
    setAnoSelected, 
    horasMeta, 
    setHorasMeta 
  } = useDashboardStore();

  const { agendamentos: rawAgendamentos } = useAgendaStore();
  const agendamentos = useMemo(() => rawAgendamentos.filter(a => a.valorTotal > 0), [rawAgendamentos]);
  const { clientes } = useClientesStore();
  const { transacoes } = useFinanceiroStore();

  // Compute dashboard metrics based on selected month/year/hours goal/account
  const data = useMemo(() => {
    return calculateDashboardData(agendamentos, clientes, transacoes, mesSelected, anoSelected, horasMeta, contaVisao);
  }, [agendamentos, clientes, transacoes, mesSelected, anoSelected, horasMeta, contaVisao]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
            📊 Painel Analítico <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full normal-case font-bold">{contaVisao}</span>
          </h3>
          <p className="text-xs text-gray-400 font-medium">Relatórios e desempenho detalhados</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Month Dropdown */}
          <select
            value={mesSelected}
            onChange={(e) => setMesSelected(Number(e.target.value))}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-primary flex-1 sm:flex-initial"
          >
            {MESES.map(m => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={anoSelected}
            onChange={(e) => setAnoSelected(Number(e.target.value))}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-primary flex-1 sm:flex-initial"
          >
            {ANOS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-white rounded-xl transition"
            title="Fechar Painel Analítico"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 2. Commitments Row */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">
          Compromissos ({MESES.find(m => m.val === mesSelected)?.label})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Compromissos"
            value={data.metrics.compromissosMes}
            icon={<CalendarCheck2 size={20} />}
            subtitle="Ativos neste mês"
          />
          <DashboardCard
            title="Realizados"
            value={data.metrics.realizados.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            icon={<CheckCircle2 size={20} className="text-green-500" />}
            subtitle={`${data.metrics.realizadosPorcentagem}% do total`}
          />
          <DashboardCard
            title="Projetados"
            value={data.metrics.projetados.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            icon={<Clock size={20} className="text-yellow-500" />}
            subtitle={`${data.metrics.projetadosPorcentagem}% do total`}
          />
          <DashboardCard
            title="Cancelamentos"
            value={data.metrics.cancelamentos.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            icon={<XCircle size={20} className="text-red-500" />}
            subtitle={`${data.metrics.cancelamentosPorcentagem}% do total`}
          />
        </div>
      </div>

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevenueChart data={data.revenueHistory} />
        <ClientRetentionGauge data={data.clients} />
      </div>

      {/* 4. Performance & Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column - Cards */}
        <div className="grid grid-cols-1 gap-4 md:col-span-2">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">
            Desempenho Comercial
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DashboardCard
              title="Faturamento do Mês"
              value={data.metrics.faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
              icon={<DollarSign size={20} className="text-emerald-500" />}
              subtitle="Entradas acumuladas"
            />
            <DashboardCard
              title="Horas Trabalhadas"
              value={`${data.metrics.horasTrabalhadas}h`}
              icon={<Hourglass size={20} className="text-blue-500" />}
              subtitle={`Taxa de ocupação: ${data.metrics.taxaUtilizacao}%`}
            />
          </div>
        </div>

        {/* Right column - Utilization */}
        <div className="flex flex-col">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1 mb-2">
            Meta de Horas
          </h4>
          <div className="flex-1">
            <UtilizationChart
              horasMeta={data.metrics.horasTrabalho}
              horasTrabalhadas={data.metrics.horasTrabalhadas}
              taxaUtilizacao={data.metrics.taxaUtilizacao}
              onMetaChange={setHorasMeta}
            />
          </div>
        </div>
        
      </div>
      
    </div>
  );
}
