import { useAgendaStore } from "@/store/useAgendaStore";
import { useClientesStore } from "@/store/useClientesStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { calculateDashboardData } from "./dashboardCalculations";
import { DashboardData } from "@/types/dashboard";

export const getDashboardData = (
  mes: number,
  ano: number,
  horasMeta: number,
  conta: "Empresa" | "Particular" = "Empresa"
): DashboardData => {
  const agendamentos = useAgendaStore.getState().agendamentos;
  const clientes = useClientesStore.getState().clientes;
  const transacoes = useFinanceiroStore.getState().transacoes;

  return calculateDashboardData(
    agendamentos,
    clientes,
    transacoes,
    mes,
    ano,
    horasMeta,
    conta
  );
};
