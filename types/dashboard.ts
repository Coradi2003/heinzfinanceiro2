export interface DashboardMetrics {
  compromissosMes: number; // Realizados + Projetados
  realizados: number;
  realizadosPorcentagem: number;
  projetados: number;
  projetadosPorcentagem: number;
  cancelamentos: number;
  cancelamentosPorcentagem: number;
  
  faturamento: number;
  horasTrabalho: number; // Meta hours (default 150)
  horasTrabalhadas: number; // Sum of durations of completed appointments
  taxaUtilizacao: number; // Horas Trabalhadas / Horas Trabalho * 100
}

export interface ClientClassification {
  novo: number;
  regular: number;
  inativo: number;
  listaNegra: number;
  retencaoRate: number;
  total: number;
}

export interface ChartDataPoint {
  dateLabel: string; // "dd/MM"
  receita: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  clients: ClientClassification;
  revenueHistory: ChartDataPoint[];
}

