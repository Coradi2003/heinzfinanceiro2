import { Cliente } from "@/store/useClientesStore";
import { Agendamento } from "@/store/useAgendaStore";
import { Transacao } from "@/store/useFinanceiroStore";
import { 
  DashboardData, 
  DashboardMetrics, 
  ClientClassification, 
  ChartDataPoint 
} from "@/types/dashboard";

// Helper function to parse dates in a timezone-safe local manner.
// - Pure date strings "YYYY-MM-DD" are treated as local (no UTC shift).
// - Full ISO timestamps "YYYY-MM-DDTHH:mm:ss..." are parsed via new Date()
//   which gives the correct local time, and we then extract local day/month/year.
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Check if it's a pure date-only string (no time component)
  const isDateOnly = dateStr.length === 10 && dateStr[4] === '-' && dateStr[7] === '-';
  if (isDateOnly) {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(5, 7), 10);
    const day = parseInt(dateStr.substring(8, 10), 10);
    return new Date(year, month - 1, day);
  }

  // For full ISO timestamps (with time / timezone), parse natively so the
  // JS engine converts UTC → local correctly, then return a midnight-local
  // Date at the resulting local day so comparisons work uniformly.
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  // Return a clean local-midnight Date using the local year/month/day
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Maps raw database categories & descriptions to standard dashboard expense groups
export function mapToExpenseCategory(categoria: string = "", descricao: string = ""): string {
  const cat = categoria.toLowerCase().trim();
  const desc = descricao.toLowerCase().trim();

  // 1. Suprimentos (Insumos, Sabonete neutro, suprimentos, agulhas, etc.)
  if (
    cat.includes("insumo") || cat.includes("suprimento") || cat.includes("sabonete") ||
    desc.includes("insumo") || desc.includes("suprimento") || desc.includes("sabonete") || desc.includes("agulha")
  ) {
    return "Suprimentos";
  }

  // 2. Materiais (Materiais, tintas, luvas, produtos, etc.)
  if (
    cat.includes("material") || cat.includes("produto") ||
    desc.includes("material") || desc.includes("tintas") || desc.includes("luvas") || desc.includes("produto")
  ) {
    return "Materiais";
  }

  // 3. Ferramentas e equipamentos (Melhoria, aquecedor, maquina, laser, etc.)
  if (
    cat.includes("melhoria") || cat.includes("equipamento") || cat.includes("ferramenta") || cat.includes("maquina") || cat.includes("laser") ||
    desc.includes("melhoria") || desc.includes("equipamento") || desc.includes("ferramenta") || desc.includes("maquina") || desc.includes("laser") || desc.includes("aquecedor")
  ) {
    return "Ferramentas e equipamentos";
  }

  // 4. Aluguel (Aluguel, Luz, Agua, Internet, Fixo, energia, etc.)
  if (
    cat.includes("fixo") || cat.includes("aluguel") || cat.includes("luz") || cat.includes("agua") || cat.includes("água") || cat.includes("internet") || cat.includes("energia") || cat.includes("telefone") ||
    desc.includes("fixo") || desc.includes("aluguel") || desc.includes("luz") || desc.includes("agua") || desc.includes("água") || desc.includes("internet") || desc.includes("energia") || desc.includes("telefone")
  ) {
    return "Aluguel";
  }

  // 5. Anúncios e promoções (Marketing, anuncios, publicidade, facebook, instagram, trafego)
  if (
    cat.includes("anuncio") || cat.includes("anúncio") || cat.includes("marketing") || cat.includes("propaganda") || cat.includes("promo") || cat.includes("publicidade") ||
    desc.includes("anuncio") || desc.includes("anúncio") || desc.includes("marketing") || desc.includes("propaganda") || desc.includes("promo") || desc.includes("publicidade") || desc.includes("facebook") || desc.includes("instagram") || desc.includes("trafego") || desc.includes("tráfego")
  ) {
    return "Anúncios e promoções";
  }

  // 6. Outras categorias
  return "Outras categorias";
}

const CATEGORY_COLORS: Record<string, string> = {
  "Suprimentos": "#EAB308", // Yellow-500
  "Materiais": "#22C55E", // Green-500
  "Ferramentas e equipamentos": "#EF4444", // Red-500
  "Aluguel": "#3B82F6", // Blue-500
  "Anúncios e promoções": "#4F46E5", // Indigo-500
  "Outras categorias": "#6B7280", // Gray-500
};

export function calculateDashboardData(
  agendamentos: Agendamento[],
  clientes: Cliente[],
  transacoes: Transacao[],
  mes: number, // 1-12
  ano: number,
  horasMeta: number = 150,
  conta: string = "Empresa"
): DashboardData {
  // 1. FILTER APPOINTMENTS FOR THE SELECTED MONTH/YEAR
  const agendamentosMes = agendamentos.filter(a => {
    const d = parseLocalDate(a.dataInicio);
    return d.getFullYear() === ano && (d.getMonth() + 1) === mes;
  });

  const realizadosCount = agendamentosMes.filter(a => a.status === 'concluido').length;
  const projetadosCount = agendamentosMes.filter(a => a.status === 'agendado' || a.status === 'pendente').length;
  const cancelamentosCount = agendamentosMes.filter(a => a.status === 'cancelado').length;
  const compromissosMes = realizadosCount + projetadosCount;
  
  const totalAgendaStatus = realizadosCount + projetadosCount + cancelamentosCount;
  const realizadosPorcentagem = totalAgendaStatus > 0 ? (realizadosCount / totalAgendaStatus) * 100 : 0;
  const projetadosPorcentagem = totalAgendaStatus > 0 ? (projetadosCount / totalAgendaStatus) * 100 : 0;
  const cancelamentosPorcentagem = totalAgendaStatus > 0 ? (cancelamentosCount / totalAgendaStatus) * 100 : 0;

  // 2. FILTER TRANSACTIONS FOR THE SELECTED MONTH/YEAR & ACCOUNT
  const transacoesMes = transacoes.filter(t => {
    const d = parseLocalDate(t.data);
    return d.getFullYear() === ano && (d.getMonth() + 1) === mes && t.conta === conta;
  });

  const receitasMes = transacoesMes.filter(t => t.tipo === 'receita');
  const despesasMes = transacoesMes.filter(t => t.tipo === 'despesa');

  const faturamento = receitasMes.reduce((acc, t) => acc + t.valor, 0);
  const despesas = despesasMes.reduce((acc, t) => acc + t.valor, 0);
  const lucroLiquido = faturamento - despesas;

  // 3. PERFORMANCE METRICS
  // Calculate completed hours worked
  const horasTrabalhadas = agendamentosMes
    .filter(a => a.status === 'concluido')
    .reduce((acc, a) => {
      const start = parseLocalDate(a.dataInicio).getTime();
      const end = parseLocalDate(a.dataFim).getTime();
      const diffHours = (end - start) / (1000 * 60 * 60);
      return acc + (isNaN(diffHours) || diffHours < 0 ? 0 : diffHours);
    }, 0);

  const taxaUtilizacao = horasMeta > 0 ? (horasTrabalhadas / horasMeta) * 100 : 0;
  const lucroMedio = realizadosCount > 0 ? lucroLiquido / realizadosCount : 0;
  const salarioHora = horasTrabalhadas > 0 ? lucroLiquido / horasTrabalhadas : 0;

  // Financial values
  const realizadosValor = agendamentosMes
    .filter(a => a.status === 'concluido')
    .reduce((acc, a) => acc + (a.valorTotal || 0), 0);

  const projetadosValor = agendamentosMes
    .filter(a => a.status === 'agendado' || a.status === 'pendente')
    .reduce((acc, a) => acc + ((a.valorTotal || 0) - (a.valorSinal || 0)), 0);

  const cancelamentosValor = agendamentosMes
    .filter(a => a.status === 'cancelado')
    .reduce((acc, a) => acc + (a.valorTotal || 0), 0);

  const metrics: DashboardMetrics = {
    compromissosMes,
    realizados: realizadosValor,
    realizadosPorcentagem: Math.round(realizadosPorcentagem),
    projetados: projetadosValor,
    projetadosPorcentagem: Math.round(projetadosPorcentagem),
    cancelamentos: cancelamentosValor,
    cancelamentosPorcentagem: Math.round(cancelamentosPorcentagem),
    faturamento,
    horasTrabalho: horasMeta,
    horasTrabalhadas: parseFloat(horasTrabalhadas.toFixed(2)),
    taxaUtilizacao: parseFloat(taxaUtilizacao.toFixed(2)),
  };

  // 4. CLIENT CLASSIFICATION
  let novo = 0;
  let regular = 0;
  let inativo = 0;
  let listaNegra = 0;

  const hoje = new Date();

  // Index completed appointments by client name
  const clientCompletedAgnds: Record<string, Agendamento[]> = {};
  agendamentos.forEach(a => {
    if (a.status === 'concluido') {
      const name = a.clienteNome.toLowerCase().trim();
      if (!clientCompletedAgnds[name]) {
        clientCompletedAgnds[name] = [];
      }
      clientCompletedAgnds[name].push(a);
    }
  });

  clientes.forEach(c => {
    const nome = c.nome.toLowerCase().trim();
    const notas = (c.notas || "").toLowerCase();

    // 1. Blacklist / Lista Negra
    if (
      notas.includes("lista negra") || 
      notas.includes("blacklist") || 
      notas.includes("bloqueado") || 
      notas.includes("não atender") ||
      notas.includes("nao atender")
    ) {
      listaNegra++;
      return;
    }

    const completed = clientCompletedAgnds[nome] || [];
    let isClientInativo = false;

    if (completed.length === 0) {
      const lastVisitDate = new Date(c.ultimaVisita);
      const diffTime = Math.abs(hoje.getTime() - lastVisitDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        isClientInativo = true;
      }
    } else {
      const lastAgndDateStr = completed.reduce((latest, a) => {
        return a.dataInicio > latest ? a.dataInicio : latest;
      }, completed[0].dataInicio);

      const lastAgndDate = parseLocalDate(lastAgndDateStr);
      const diffTime = Math.abs(hoje.getTime() - lastAgndDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        isClientInativo = true;
      }
    }

    if (isClientInativo) {
      inativo++;
      return;
    }

    // 2. Regular: 2 or more completed appointments
    if (completed.length >= 2) {
      regular++;
      return;
    }

    // 3. Novo: 0 or 1 completed appointment, active in last 90 days
    novo++;
  });

  const totalClientsClassification = regular + novo + inativo + listaNegra;
  // Retention Rate is computed as Regulars / (Regulars + Novos)
  const activeCount = regular + novo;
  const retencaoRate = activeCount > 0 ? (regular / activeCount) * 100 : 0;

  const clients: ClientClassification = {
    novo,
    regular,
    inativo,
    listaNegra,
    retencaoRate: Math.round(retencaoRate),
    total: clientes.length,
  };

  // 5. REVENUE HISTORY (Daily totals for the selected month to render the chart)
  // Create an array for all days of the selected month
  const daysInMonth = new Date(ano, mes, 0).getDate();
  const dailyRevenues: Record<number, number> = {};
  for (let i = 1; i <= daysInMonth; i++) {
    dailyRevenues[i] = 0;
  }

  receitasMes.forEach(t => {
    const day = parseLocalDate(t.data).getDate();
    if (dailyRevenues[day] !== undefined) {
      dailyRevenues[day] += t.valor;
    }
  });

  const revenueHistory: ChartDataPoint[] = Object.keys(dailyRevenues).map(d => {
    const dayNum = Number(d);
    // Format label as "dd/MM"
    const label = `${String(dayNum).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
    return {
      dateLabel: label,
      receita: dailyRevenues[dayNum],
    };
  });

  return {
    metrics,
    clients,
    revenueHistory,
  };
}
