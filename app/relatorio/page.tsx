"use client";

import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { useClientesStore } from "@/store/useClientesStore";
import { parseLocalDate } from "@/lib/dashboard/dashboardCalculations";
import { useSearchParams, useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, ArrowLeft, BarChart2, Wallet, QrCode, Banknote, CreditCard, MessageCircle, Loader2, Save, User, Search, X } from "lucide-react";
import { Suspense, useEffect, useRef, useState, useMemo } from "react";

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatDataNasc(data?: string | null): string {
  if (!data) return '—';
  if (data.includes('/')) return data;
  if (data.includes('-')) {
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  }
  return data;
}

function RelatorioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { agendamentos: rawAgendamentos } = useAgendaStore();
  const agendamentos = useMemo(() => rawAgendamentos.filter(a => a.valorTotal > 0), [rawAgendamentos]);
  const { transacoes } = useFinanceiroStore();
  const { clientes, carregarClientes } = useClientesStore();

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const tipo = searchParams.get("tipo") || "anual";
  // Quando o relatório foi aberto por um botão específico, o modo fica fixo
  const modoBloqueado = tipo === 'cliente' || tipo === 'anual';

  // Modos de Relatório: 'geral' | 'cliente'
  const [modoRelatorio, setModoRelatorio] = useState<'geral' | 'cliente'>(tipo === 'cliente' ? 'cliente' : 'geral');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('');
  const [searchClienteText, setSearchClienteText] = useState<string>('');
  const [metodoCliente, setMetodoCliente] = useState<'todos' | 'Pix' | 'Dinheiro' | 'Cartão' | 'cancelados'>('todos');

  const mesParam = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1));
  const anoParam = parseInt(searchParams.get("ano") || String(new Date().getFullYear()));
  const metodoFiltro = searchParams.get("metodo") || "todos";
  const contaFiltro = searchParams.get("conta") || "Empresa";

  const [tipoPeriodo, setTipoPeriodo] = useState<'anual' | 'mensal'>(tipo === 'anual' ? 'anual' : 'mensal');
  const [mes, setMes] = useState(mesParam);
  const [ano, setAno] = useState(anoParam);
  const [conta, setConta] = useState(contaFiltro);
  const [metodo, setMetodo] = useState(metodoFiltro);

  // Ao trocar de modo via navegação, sincroniza o estado fixo da página
  useEffect(() => {
    setModoRelatorio(tipo === 'cliente' ? 'cliente' : 'geral');
    setTipoPeriodo(tipo === 'anual' ? 'anual' : 'mensal');
  }, [tipo]);

  useEffect(() => {
    const root = document.documentElement;
    const wasDarkTheme = root.classList.contains('dark-theme');
    const wasStyleDark = root.classList.contains('dark');
    if (wasDarkTheme) root.classList.remove('dark-theme');
    if (wasStyleDark) root.classList.remove('dark');
    window.scrollTo(0, 0);
    return () => {
      if (wasDarkTheme) root.classList.add('dark-theme');
      if (wasStyleDark) root.classList.add('dark');
    };
  }, []);

  // Lista de clientes filtrada para o campo de busca
  const clientesFiltrados = useMemo(() => {
    if (!searchClienteText.trim()) return clientes;
    const term = searchClienteText.toLowerCase();
    return clientes.filter(c => c.nome.toLowerCase().includes(term) || (c.telefone || '').includes(term));
  }, [clientes, searchClienteText]);

  // Cliente selecionado atualmente
  const clienteObj = useMemo(() => {
    return clientes.find(c => c.id === clienteSelecionadoId) || null;
  }, [clientes, clienteSelecionadoId]);

  // Agendamentos do Cliente Escolhido (mais recente primeiro)
  const agendamentosDoCliente = useMemo(() => {
    if (!clienteObj) return [];
    const nome = clienteObj.nome.toLowerCase().trim();
    return agendamentos
      .filter(a => (a.clienteNome || '').toLowerCase().trim() === nome)
      .sort((a, b) => parseLocalDate(b.dataInicio).getTime() - parseLocalDate(a.dataInicio).getTime());
  }, [agendamentos, clienteObj]);

  // Totais do Cliente
  const concluidosCliente = useMemo(() => agendamentosDoCliente.filter(a => a.status === 'concluido'), [agendamentosDoCliente]);
  const pendentesCliente = useMemo(() => agendamentosDoCliente.filter(a => a.status === 'agendado' || a.status === 'pendente'), [agendamentosDoCliente]);
  const canceladosCliente = useMemo(() => agendamentosDoCliente.filter(a => a.status === 'cancelado'), [agendamentosDoCliente]);

  const totalGastoCliente = useMemo(() => {
    return agendamentosDoCliente
      .filter(a => a.status === 'concluido' || a.status === 'agendado' || a.status === 'pendente')
      .reduce((acc, a) => acc + (a.valorTotal || 0), 0);
  }, [agendamentosDoCliente]);

  // Valor efetivamente pago: total nas concluídas + sinal nas demais
  const totalPagoCliente = useMemo(() => {
    return agendamentosDoCliente.reduce((acc, a) => {
      if (a.status === 'concluido') return acc + (a.valorTotal || 0);
      return acc + (a.valorSinal || 0);
    }, 0);
  }, [agendamentosDoCliente]);

  // Em aberto (a receber) nas sessões futuras
  const totalEmAbertoCliente = useMemo(() => {
    return pendentesCliente.reduce((acc, a) => acc + ((a.valorTotal || 0) - (a.valorSinal || 0)), 0);
  }, [pendentesCliente]);

  const totalCanceladoCliente = useMemo(() => {
    return canceladosCliente.reduce((acc, a) => acc + (a.valorTotal || 0), 0);
  }, [canceladosCliente]);

  // Totais por forma de pagamento (com base nas receitas registradas no financeiro)
  const metodoNorm = (m?: string): 'Pix' | 'Dinheiro' | 'Cartão' | null => {
    if (!m) return null;
    const lower = m.toLowerCase().trim();
    if (lower.includes('pix')) return 'Pix';
    if (lower.includes('dinheiro')) return 'Dinheiro';
    if (lower.includes('cart')) return 'Cartão';
    return null;
  };

  const transacoesCliente = useMemo(() => {
    if (!clienteObj) return [];
    const nome = (clienteObj.nome || '').toLowerCase().trim();
    return transacoes.filter(t =>
      t.tipo === 'receita' &&
      (t.descricao || '').toLowerCase().includes(nome)
    );
  }, [transacoes, clienteObj]);

  const totalPixCliente = transacoesCliente.filter(t => metodoNorm(t.metodo) === 'Pix').reduce((acc, t) => acc + t.valor, 0);
  const totalDinheiroCliente = transacoesCliente.filter(t => metodoNorm(t.metodo) === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0);
  const totalCartaoCliente = transacoesCliente.filter(t => metodoNorm(t.metodo) === 'Cartão').reduce((acc, t) => acc + t.valor, 0);

  let startDate: Date;
  let endDate: Date;

  if (tipoPeriodo === "mensal") {
    const baseDate = new Date(ano, mes - 1, 1);
    startDate = startOfMonth(baseDate);
    endDate = endOfMonth(baseDate);
  } else {
    const baseDate = new Date(ano, 0, 1);
    startDate = startOfYear(baseDate);
    endDate = endOfYear(baseDate);
  }

  // Filtragem Geral de Transações
  let transactionsPeriod = transacoes.filter(t => {
    const d = parseLocalDate(t.data);
    const matchPeriod = tipoPeriodo === "mensal"
      ? (d.getFullYear() === ano && (d.getMonth() + 1) === mes)
      : d.getFullYear() === ano;
    return matchPeriod && t.conta === conta && t.tipo === 'receita';
  });

  if (metodo !== "todos") {
    transactionsPeriod = transactionsPeriod.filter(t => t.metodo === metodo);
  }

  const totalReceitasGeral = transactionsPeriod.reduce((acc, t) => acc + t.valor, 0);

  const porPixGeral = transactionsPeriod.filter(t => t.metodo === 'Pix').reduce((acc, t) => acc + t.valor, 0);
  const porDinheiroGeral = transactionsPeriod.filter(t => t.metodo === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0);
  const porCartaoGeral = transactionsPeriod.filter(t => t.metodo === 'Cartão').reduce((acc, t) => acc + t.valor, 0);

  // -- FATURAMENTO ANUAL POR MÊS E FORMA DE PAGAMENTO (Relatório Anual) --
  const faturamentoAnualPorMes = useMemo(() => {
    return MESES_PT.map((nome, i) => {
      const transMes = transacoes
        .filter(t => {
          const d = parseLocalDate(t.data);
          return d.getFullYear() === ano && d.getMonth() === i && t.conta === conta && t.tipo === 'receita';
        });
      return {
        mes: nome,
        todos: transMes.reduce((acc, t) => acc + t.valor, 0),
        Pix: transMes.filter(t => t.metodo === 'Pix').reduce((acc, t) => acc + t.valor, 0),
        Dinheiro: transMes.filter(t => t.metodo === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0),
        Cartão: transMes.filter(t => t.metodo === 'Cartão').reduce((acc, t) => acc + t.valor, 0),
      };
    });
  }, [transacoes, ano, conta]);

  const metodoAnual: 'todos' | 'Pix' | 'Dinheiro' | 'Cartão' =
    metodo === 'Pix' || metodo === 'Dinheiro' || metodo === 'Cartão' ? metodo : 'todos';
  const totalAnualSelecionado = faturamentoAnualPorMes.reduce((acc, m) => acc + (metodoAnual === 'todos' ? m.todos : m[metodoAnual]), 0);

  // Helper para gerar PDF
  const generatePDF = async () => {
    if (!reportRef.current) throw new Error('Elemento não encontrado');

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const el = reportRef.current;
    const prevWidth = el.style.width;
    const prevMaxWidth = el.style.maxWidth;
    const prevOverflow = el.style.overflow;
    el.style.width = '794px';
    el.style.maxWidth = '794px';
    el.style.overflow = 'visible';

    let canvas;
    try {
      canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });
    } finally {
      el.style.width = prevWidth;
      el.style.maxWidth = prevMaxWidth;
      el.style.overflow = prevOverflow;
    }

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const nameSlug = modoRelatorio === 'cliente' && clienteObj
      ? `cliente-${clienteObj.nome.toLowerCase().replace(/\s+/g, '-')}`
      : `geral-${tipoPeriodo}-${ano}`;

    const fileName = `relatorio-paty-heinz-${nameSlug}.pdf`;
    return { pdf, fileName };
  };

  const handleSharePDF = async () => {
    setIsSharing(true);
    try {
      const { pdf, fileName } = await generatePDF();

      if (navigator.share && navigator.canShare) {
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'Relatório Studio Paty Heinz', files: [file] });
          return;
        }
      }
      pdf.save(fileName);
      alert('PDF baixado! Anexe no WhatsApp.');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error(err);
        alert('Erro ao gerar PDF. Use o botão Imprimir.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleSavePDF = async () => {
    setIsSaving(true);
    try {
      const { pdf, fileName } = await generatePDF();
      const pdfBlob = pdf.output('blob');

      const showSaveFilePicker = (window as any).showSaveFilePicker;
      if (showSaveFilePicker) {
        try {
          const fileHandle = await showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar PDF.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => window.print();
  const isProcessing = isSharing || isSaving;

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-black overflow-y-auto h-screen w-screen selection:bg-black selection:text-white font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-10 flex flex-col min-h-full">
        <style jsx global>{`
          .fixed * { color: #000000 !important; border-color: #000000 !important; background-color: transparent !important; }
          .fixed .bg-black, .fixed .bg-black * { background-color: #000000 !important; color: #ffffff !important; }
          .fixed .bg-gray-50, .fixed .bg-gray-100 { background-color: #f9fafb !important; }
          .fixed button { border: 1px solid #000 !important; }
          @media print {
            @page { margin: 1cm; }
            body { background-color: white !important; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .fixed { position: static !important; overflow: visible !important; height: auto !important; width: auto !important; }
          }
        `}</style>

        {/* Barra Superior de Navegação e Ações */}
        <div className="flex justify-between items-center mb-6 no-print bg-gray-50 p-4 rounded-2xl border border-gray-200 gap-3 flex-wrap">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-900 font-bold px-4 py-2 rounded-xl transition hover:bg-gray-200 shrink-0 text-sm"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          {/* Seleção do Modo de Relatório (só quando aberto sem modo fixo) */}
          {!modoBloqueado && (
          <div className="flex bg-gray-200/80 p-1 rounded-xl">
            <button
              onClick={() => setModoRelatorio('geral')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${modoRelatorio === 'geral' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
            >
              <BarChart2 size={14} /> Geral / Anual
            </button>
            <button
              onClick={() => setModoRelatorio('cliente')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${modoRelatorio === 'cliente' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
            >
              <User size={14} /> Por Cliente
            </button>
          </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSharePDF}
              disabled={isProcessing}
              className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-600 transition disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {isSharing ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleSavePDF}
              disabled={isProcessing}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden sm:inline">Salvar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isProcessing}
              className="bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Filtros de Seleção (Tela) */}
        <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl no-print space-y-4">
          {modoRelatorio === 'cliente' ? (
            /* BUSCA E SELEÇÃO DE CLIENTE */
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">
                Selecione o Cliente Cadastrado para o Relatório:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                {/* Busca com lupa */}
                <div className="relative">
                  <Search size={18} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou telefone..."
                    value={searchClienteText}
                    onChange={(e) => setSearchClienteText(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-black shadow-sm"
                  />
                  {searchClienteText && (
                    <button
                      onClick={() => setSearchClienteText('')}
                      title="Limpar busca"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                {/* Seleção */}
                <div className="flex flex-col gap-1.5">
                  <select
                    value={clienteSelecionadoId}
                    onChange={(e) => { setClienteSelecionadoId(e.target.value); setSearchClienteText(''); }}
                    className="bg-white border-2 border-gray-300 rounded-xl px-3 py-3 text-sm font-bold text-gray-800 outline-none focus:border-black shadow-sm"
                  >
                    <option value="">-- Escolha um cliente --</option>
                    {clientesFiltrados.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.telefone ? `(${c.telefone})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] font-bold text-gray-500 pl-1">
                    {searchClienteText
                      ? `${clientesFiltrados.length} ${clientesFiltrados.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}`
                      : `${clientes.length} ${clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`}
                  </p>
                </div>
              </div>
              {/* Sugestões rápidas da busca */}
              {searchClienteText.trim() && clientesFiltrados.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {clientesFiltrados.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setClienteSelecionadoId(c.id); setSearchClienteText(''); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition ${
                        c.id === clienteSelecionadoId
                          ? 'bg-black text-white border-black'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-black hover:text-black'
                      }`}
                    >
                      <User size={13} />
                      <span className="truncate max-w-[180px]">{c.nome}</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Filtro por forma de pagamento */}
              <div className="flex flex-col gap-1.5 max-w-sm">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  Forma de Pagamento
                </label>
                <select
                  value={metodoCliente}
                  onChange={(e) => setMetodoCliente(e.target.value as 'todos' | 'Pix' | 'Dinheiro' | 'Cartão' | 'cancelados')}
                  className="bg-white border-2 border-gray-300 rounded-xl px-3 py-3 text-sm font-bold text-gray-800 outline-none focus:border-black shadow-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="Pix">Somente Pix</option>
                  <option value="Dinheiro">Somente Dinheiro</option>
                  <option value="Cartão">Somente Cartão</option>
                  <option value="cancelados">Somente Cancelados</option>
                </select>
              </div>
            </div>
          ) : (
            /* FILTROS DO RELATÓRIO GERAL */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tipo !== 'anual' && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Período</label>
                <select
                  value={tipoPeriodo}
                  onChange={(e) => setTipoPeriodo(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-black"
                >
                  <option value="anual">Anual Completo</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
              )}

              {tipoPeriodo === 'mensal' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Mês</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-black"
                  >
                    {MESES_PT.map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Ano</label>
                <select
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-black"
                >
                  {[2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Forma de Pagamento</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['todos', 'Pix', 'Dinheiro', 'Cartão'] as const).map(op => (
                    <button
                      key={op}
                      onClick={() => setMetodo(op)}
                      className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider border transition ${
                        metodo === op
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black'
                      }`}
                    >
                      {op === 'todos' ? 'Todas' : op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTEÚDO IMPRESSO E GERADO NO PDF */}
        <div ref={reportRef} className="space-y-10">

          {/* MODO CLIENTE */}
          {modoRelatorio === 'cliente' ? (
            clienteObj ? (
              <>
                {/* CABEÇALHO DO CLIENTE */}
                <div className="border-b-4 border-black pb-6 flex justify-between items-end gap-4">
                  <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">Relatório do Cliente</h1>
                    <p className="text-2xl font-black text-gray-900 uppercase tracking-tight">{clienteObj.nome}</p>
                    {clienteObj.telefone && <p className="text-xs font-bold text-gray-600 mt-1">Telefone: {clienteObj.telefone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest">Studio Paty Heinz</p>
                    <p className="text-[10px] font-bold text-gray-700">Emitido: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </div>

                {/* FICHA DO CLIENTE */}
                <div className="border border-black rounded-sm overflow-hidden">
                  <div className="bg-black text-white px-4 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest">Ficha do Cliente</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-t border-black text-xs">
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Telefone</p>
                      <p className="font-black">{clienteObj.telefone || '—'}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Nascimento</p>
                      <p className="font-black">{formatDataNasc(clienteObj.dataNascimento)}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Última Visita</p>
                      <p className="font-black">{clienteObj.ultimaVisita ? format(parseLocalDate(clienteObj.ultimaVisita), "dd/MM/yyyy") : '—'}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Registro</p>
                      <p className="font-black">#{clienteObj.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  {clienteObj.notas && (
                    <div className="border-t border-black px-4 py-3">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Observações / Notas</p>
                      <p className="text-xs font-bold whitespace-pre-wrap">{clienteObj.notas}</p>
                    </div>
                  )}
                </div>

                {/* RESUMO FINANCEIRO DO CLIENTE */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border-2 border-black p-4 rounded-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Contratado</p>
                    <p className="text-xl font-black">{totalGastoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="bg-black p-4 rounded-sm text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total Pago</p>
                    <p className="text-xl font-black">{totalPagoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="border-2 border-black p-4 rounded-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Em Aberto</p>
                    <p className="text-xl font-black">{totalEmAbertoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="border-2 border-black p-4 rounded-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Cancelados</p>
                    <p className="text-xl font-black">{totalCanceladoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>

                {/* CONTADORES DE SESSÕES */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-300 rounded-sm p-3 text-center">
                    <p className="text-2xl font-black">{concluidosCliente.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Sessões Concluídas</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-300 rounded-sm p-3 text-center">
                    <p className="text-2xl font-black">{pendentesCliente.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Agendadas / Pendentes</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-300 rounded-sm p-3 text-center">
                    <p className="text-2xl font-black">{canceladosCliente.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Cancelamentos</p>
                  </div>
                </div>

                {/* VALORES POR FORMA DE PAGAMENTO */}
                <div>
                  <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
                    <Wallet size={20} /> Valores por Forma de Pagamento
                  </h2>

                  {metodoCliente === 'todos' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border-2 border-black p-4 rounded-sm">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total via Pix</p>
                        <p className="text-xl font-black">{totalPixCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      <div className="border-2 border-black p-4 rounded-sm">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total via Dinheiro</p>
                        <p className="text-xl font-black">{totalDinheiroCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      <div className="border-2 border-black p-4 rounded-sm">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total via Cartão</p>
                        <p className="text-xl font-black">{totalCartaoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      <div className="bg-black p-4 rounded-sm text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total Cancelados</p>
                        <p className="text-xl font-black">{totalCanceladoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                      {metodoCliente === 'Pix' && (
                        <div className="border-2 border-black p-5 rounded-sm">
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total via Pix</p>
                          <p className="text-3xl font-black">{totalPixCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      )}
                      {metodoCliente === 'Dinheiro' && (
                        <div className="border-2 border-black p-5 rounded-sm">
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total via Dinheiro</p>
                          <p className="text-3xl font-black">{totalDinheiroCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      )}
                      {metodoCliente === 'Cartão' && (
                        <div className="border-2 border-black p-5 rounded-sm">
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total via Cartão</p>
                          <p className="text-3xl font-black">{totalCartaoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      )}
                      {metodoCliente === 'cancelados' && (
                        <div className="bg-black p-5 rounded-sm text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total Cancelados</p>
                          <p className="text-3xl font-black">{totalCanceladoCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {agendamentosDoCliente.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-gray-300 text-center font-bold text-gray-500">
                      Nenhum agendamento registrado para este cliente.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 border-2 border-dashed border-black text-center rounded-2xl no-print">
                <User size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-base font-black uppercase">Selecione um cliente acima para gerar o relatório individual</p>
                <p className="text-xs text-gray-500 mt-1">O histórico completo de datas, sinais e valores pagos pelo cliente será exibido aqui.</p>
              </div>
            )
          ) : (
            /* MODO GERAL / ANUAL */
            <>
              {/* CABEÇALHO GERAL */}
              <div className="border-b-4 border-black pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Relatório {conta}</h1>
                  <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    ESTÚDIO / {tipoPeriodo === 'mensal' ? `${format(startDate, 'MMMM yyyy', { locale: ptBR })}` : `ANO ${ano}`}
                    {tipoPeriodo === 'anual' && <span className="text-gray-500 ml-2">[{metodoAnual.toUpperCase()}]</span>}
                    {metodo !== 'todos' && tipoPeriodo !== 'anual' && <span className="text-gray-500 ml-2">[{metodo.toUpperCase()}]</span>}
                  </p>
                </div>
                <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-black pl-4 md:pr-4">
                  <p className="text-xs font-black uppercase tracking-widest">Studio Paty Heinz</p>
                  <p className="text-[10px] font-bold text-gray-800">Gerado: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>

              {tipoPeriodo === 'anual' ? (
                /* ---------- RELATÓRIO ANUAL (POR FORMA DE PAGAMENTO) ---------- */
                <>
                  {/* RESUMO ANUAL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
                      <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">
                        {metodoAnual === 'todos' ? 'Total no Ano' : `Total via ${metodoAnual} no Ano`}
                      </p>
                      <p className="text-3xl font-black truncate">{totalAnualSelecionado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="bg-black p-5 rounded-sm flex flex-col justify-center min-h-[100px] text-white">
                      <p className="text-[10px] font-black uppercase mb-1 opacity-80 tracking-widest">
                        {metodoAnual === 'todos' ? 'Média Mensal' : `Média Mensal de ${metodoAnual}`}
                      </p>
                      <p className="text-3xl font-black truncate">{(totalAnualSelecionado / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  </div>

                  {/* TABELA POR MÊS */}
                  <div>
                    <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 pb-1 tracking-tight">
                      {metodoAnual === 'todos' ? 'Faturamento por Mês' : `Faturamento ${metodoAnual} por Mês`}
                    </h2>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-black bg-gray-100">
                          <th className="p-3 uppercase font-black border border-black">Mês</th>
                          <th className="p-3 uppercase font-black border border-black text-right">
                            {metodoAnual === 'todos' ? 'Valor Total' : `Valor via ${metodoAnual}`}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {faturamentoAnualPorMes.map((m) => {
                          const valor = metodoAnual === 'todos' ? m.todos : m[metodoAnual];
                          return (
                            <tr key={m.mes} className="border-b border-black">
                              <td className="p-3 font-black border border-black uppercase">{m.mes}</td>
                              <td className={`p-3 text-right font-black text-sm border border-black whitespace-nowrap ${valor > 0 ? '' : 'text-gray-400'}`}>
                                {valor > 0
                                  ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                  : <span>R$ 0,00</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-black bg-gray-100">
                          <td className="p-3 uppercase font-black border border-black">Total do Ano</td>
                          <td className="p-3 text-right font-black text-base border border-black whitespace-nowrap">
                            {totalAnualSelecionado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                /* ---------- RELATÓRIO MENSAL (DETALHADO) ---------- */
                <>
                  {/* RESUMO RÁPIDO GERAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
                      <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">Total de Entradas</p>
                      <p className="text-2xl font-black truncate">{totalReceitasGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
                      <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">Total via Pix</p>
                      <p className="text-2xl font-black truncate">{porPixGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="border-2 border-black p-5 rounded-sm flex flex-col justify-center min-h-[100px]">
                      <p className="text-[10px] font-black uppercase mb-1 text-gray-500 tracking-widest">Total via Dinheiro</p>
                      <p className="text-2xl font-black truncate">{porDinheiroGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="bg-black p-5 rounded-sm flex flex-col justify-center min-h-[100px] text-white">
                      <p className="text-[10px] font-black uppercase mb-1 opacity-80 tracking-widest">Total via Cartão</p>
                      <p className="text-2xl font-black truncate">{porCartaoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  </div>

                  {/* DETALHAMENTO POR MEIO DE PAGAMENTO */}
                  <div>
                    <h2 className="text-xl font-black uppercase border-b-2 border-black mb-6 flex items-center gap-2 pb-1 tracking-tight">
                      <Wallet size={20} /> Detalhamento por Meio de Pagamento
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-black py-2">
                          <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><QrCode size={14}/> Pix</span>
                          <span className="font-black text-lg">{porPixGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex justify-between border-b border-black py-2">
                          <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><Banknote size={14}/> Dinheiro</span>
                          <span className="font-black text-lg">{porDinheiroGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex justify-between border-b border-black py-2">
                          <span className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><CreditCard size={14}/> Cartão</span>
                          <span className="font-black text-lg">{porCartaoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-5 border-l-4 border-black">
                        <p className="text-[10px] font-black uppercase text-black mb-2 tracking-widest underline">Nota Operacional</p>
                        <p className="text-xs leading-relaxed font-bold">
                          Relatório consolidado do mês de {format(startDate, 'MMMM yyyy', { locale: ptBR })}.
                          Volume total capturado nas entradas: <b>{totalReceitasGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MOVIMENTAÇÕES DE ENTRADA */}
                  <div className="overflow-x-auto">
                    <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4 pb-1 tracking-tight">Registro de Entradas</h2>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-black bg-gray-100">
                          <th className="p-3 uppercase font-black border border-black">Data</th>
                          <th className="p-3 uppercase font-black border border-black">Descrição</th>
                          <th className="p-3 uppercase font-black border border-black">Método</th>
                          <th className="p-3 uppercase font-black border border-black text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionsPeriod.map((t, idx) => (
                          <tr key={idx} className="border-b border-black">
                            <td className="p-3 font-bold border border-black whitespace-nowrap">{format(new Date(t.data), "dd/MM/yyyy")}</td>
                            <td className="p-3 font-bold border border-black">{t.descricao}</td>
                            <td className="p-3 uppercase text-[10px] font-black border border-black whitespace-nowrap">{t.metodo}</td>
                            <td className="p-3 text-right font-black text-sm border border-black whitespace-nowrap">
                              + {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* RODAPÉ DO DOCUMENTO */}
          <div className="mt-16 pt-8 border-t-2 border-black text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-black">Studio Paty Heinz - Documento de Validade Interna</p>
            <p className="text-[9px] text-gray-500 mt-1 italic">Gerado pelo sistema de gestão Studio Paty Heinz.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RelatorioPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Carregando relatório...</div>}>
      <RelatorioContent />
    </Suspense>
  );
}
