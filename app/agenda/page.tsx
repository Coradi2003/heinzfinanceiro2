"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, User, CheckCircle2, MessageCircle, Trash2, LayoutDashboard } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendaStore } from "@/store/useAgendaStore";
import { ModalAgendamento } from "@/components/agenda/ModalAgendamento";
import { ModalDiaSelecionado } from "@/components/agenda/ModalDiaSelecionado";
import { getFeriadoDoDia } from "@/lib/feriados";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalDiaOpen, setIsModalDiaOpen] = useState(false);

  // Store
  const { agendamentos, concluirAtendimento, removeAgendamento } = useAgendaStore();

  // Lógica do Calendário Mensal
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Exemplos visuais parciais
  const statusColors = {
    cheio: "bg-red-500",
    livre: "bg-green-500",
    parcial: "bg-yellow-500",
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Agenda</h2>
          <p className="text-gray-500">Seus horários e visões do mês</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm"
          >
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-md shadow-primary/20"
          >
            <Plus size={20} />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Calendário Mensal */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 transition">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-400 py-2">
                {day}
              </div>
            ))}
            
            {/* Espaços vazios no início do mês para alinhar dias da semana */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-xl border border-dashed border-gray-100 bg-gray-50/50"></div>
            ))}

            {monthDays.map((day) => {
              const dayAgendamentos = agendamentos.filter(a => isSameDay(parseISO(a.dataInicio), day));
              const qty = dayAgendamentos.length;
              const feriado = getFeriadoDoDia(day);
              const isFeriado = !!feriado;
              
              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => { setSelectedDate(day); setIsModalDiaOpen(true); }}
                  className={`h-20 md:h-24 rounded-xl border p-1 md:p-2 flex flex-col justify-between cursor-pointer transition relative group
                    ${isFeriado && !isSameDay(selectedDate, day) ? 'bg-orange-50 border-orange-200 hover:border-orange-400' : ''}
                    ${isSameDay(selectedDate, day) ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/5' : !isFeriado ? 'border-gray-100 hover:border-primary/50 hover:shadow-md bg-white' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-xs md:text-sm font-bold ${isToday(day) ? 'text-white bg-primary w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shrink-0' : isSameMonth(day, currentDate) ? (isFeriado ? 'text-orange-700' : 'text-gray-700') : 'text-gray-300'}`}>
                      {format(day, 'd')}
                    </span>
                    {/* Nome do Feriado */}
                    {isFeriado && (
                      <span
                        title={feriado.nome}
                        className="text-[7px] md:text-[8px] font-black leading-tight text-orange-700 bg-orange-100 rounded px-1 py-px truncate max-w-[60px] md:max-w-[80px] text-right"
                      >
                        {feriado.nome.split('(')[0].trim()}
                      </span>
                    )}
                  </div>

                  {/* Indicadores de cor dos agendamentos empilhados verticalmente */}
                  {qty > 0 && (
                    <div className="mt-1 w-full space-y-0.5 overflow-hidden">
                        {dayAgendamentos
                          .sort((a,b) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime())
                          .slice(0, 3)
                          .map(a => (
                            <div 
                              key={a.id} 
                              className={`w-full text-[8px] font-black text-white px-1 py-0.5 rounded cursor-pointer truncate shadow-sm transition-transform hover:scale-105 ${(a.status === 'concluido' || a.status === 'cancelado') ? 'bg-gray-400 opacity-60' : (a.cor || 'bg-primary')}`}
                            >
                              {(a.dataInicio.split('T')[1] || '').substring(0, 5)} {a.status === 'cancelado' ? '✕' : ''}
                            </div>
                          ))
                        }
                        {qty > 3 && <p className="text-[8px] font-bold text-gray-400 text-center">+{qty - 3}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Dia Livre</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Poucos Horários</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> Dia Cheio</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div> Feriado Nacional</div>
          </div>
        </div>

      </div>

      <ModalAgendamento isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <ModalDiaSelecionado 
        isOpen={isModalDiaOpen} 
        onClose={() => setIsModalDiaOpen(false)} 
        selectedDate={selectedDate}
        agendamentos={agendamentos}
        concluirAtendimento={concluirAtendimento}
        removeAgendamento={removeAgendamento}
      />
    </div>
  );
}
