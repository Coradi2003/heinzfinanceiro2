"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function VendasPage() {
  const { agendamentos: rawAgendamentos } = useAgendaStore();
  const agendamentos = rawAgendamentos.filter(a => a.valorTotal > 0);

  const confirmadas = agendamentos.filter(a => a.status === 'concluido');
  const aReceber = agendamentos.filter(a => (a.status === 'agendado' || a.status === 'pendente') && (a.valorTotal - a.valorSinal > 0));
  const canceladas = agendamentos.filter(a => a.status === 'cancelado');

  const totalConfirmado = confirmadas.reduce((sum, a) => sum + a.valorTotal, 0);
  const totalAReceber = aReceber.reduce((sum, a) => sum + (a.valorTotal - a.valorSinal), 0);
  const totalSinalAReceber = aReceber.reduce((sum, a) => sum + a.valorSinal, 0); // O sinal já foi recebido

  const RenderCard = ({ v }: { v: any }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition mb-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-800">{v.clienteNome}</h4>
        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
          {format(parseISO(v.dataInicio), "dd MMM", { locale: ptBR })}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-3">{v.servico}</p>
      <div className="flex justify-between items-center pt-3 border-t border-gray-50">
        {v.valorSinal > 0 && (
          <div className="text-xs text-gray-400">
            Sinal pago: R$ {v.valorSinal}
          </div>
        )}
        <div className="font-bold text-primary">
          R$ {v.valorTotal}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Vendas & Orçamentos</h2>
        <p className="text-gray-500">Acompanhe o status financeiro de cada trabalho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Coluna: A Receber */}
        <div className="flex flex-col h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2 text-yellow-600 font-bold">
              <Clock size={20} /> A Receber
            </div>
            <div className="text-sm font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              R$ {totalAReceber}
            </div>
          </div>
          <div className="bg-gray-50 rounded-3xl p-4 flex-1 overflow-y-auto border border-gray-100">
            {aReceber.length === 0 ? <p className="text-sm text-gray-400 text-center mt-4">Nenhuma pendência.</p> : null}
            {aReceber.map(v => <RenderCard key={v.id} v={v} />)}
          </div>
        </div>

        {/* Coluna: Confirmadas */}
        <div className="flex flex-col h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <CheckCircle2 size={20} /> Confirmadas (Pagas)
            </div>
            <div className="text-sm font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              R$ {totalConfirmado}
            </div>
          </div>
          <div className="bg-green-50/30 rounded-3xl p-4 flex-1 overflow-y-auto border border-green-100/50">
            {confirmadas.length === 0 ? <p className="text-sm text-gray-400 text-center mt-4">Nenhuma venda concluída ainda.</p> : null}
            {confirmadas.map(v => <RenderCard key={v.id} v={v} />)}
          </div>
        </div>

        {/* Coluna: Canceladas */}
        <div className="flex flex-col h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <XCircle size={20} /> Canceladas
            </div>
            <div className="text-sm font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {canceladas.length}
            </div>
          </div>
          <div className="bg-red-50/30 rounded-3xl p-4 flex-1 overflow-y-auto border border-red-100/50">
            {canceladas.length === 0 ? <p className="text-sm text-gray-400 text-center mt-4">Nenhum cancelamento.</p> : null}
            {canceladas.map(v => <RenderCard key={v.id} v={v} />)}
          </div>
        </div>

      </div>
    </div>
  );
}
