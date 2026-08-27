"use client";

import { Scissors, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useServicosStore, Servico } from "@/store/useServicosStore";
import { ModalServico } from "@/components/servicos/ModalServico";

export default function ServicosPage() {
  const { servicos, removeServico } = useServicosStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servicoEdit, setServicoEdit] = useState<Servico | null>(null);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Serviços Predeterminados</h2>
          <p className="text-gray-500">Base flexível. Você pode mudar tempo e valor direto lá no Agendamento.</p>
        </div>
        <button onClick={() => { setServicoEdit(null); setIsModalOpen(true); }} className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-md shadow-primary/20">
          <Plus size={20} />
          <span>Novo Serviço</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
           <Scissors size={20} className="text-primary" />
           <h3 className="text-lg font-bold text-gray-800">Seus Estilos e Trabalhos</h3>
        </div>
        
        <div className="divide-y divide-gray-50">
          {servicos.map(s => (
            <div key={s.id} className="flex justify-between items-center p-6 hover:bg-gray-50 transition group">
              <div>
                <h4 className="font-bold text-gray-800">{s.nome}</h4>
                <p className="text-sm text-gray-400">Tempo estimado: {s.tempo}</p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mt-4 md:mt-0">
                <div className="font-bold text-primary text-xl">
                  R$ {s.valorBase} <span className="text-xs text-gray-400 block md:text-right font-normal">Valor base</span>
                </div>
                <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition">
                  <button onClick={() => { setServicoEdit(s); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={18} /></button>
                  <button onClick={() => { if(confirm('Excluir serviço?')) removeServico(s.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ModalServico isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={servicoEdit} />
    </div>
  );
}
