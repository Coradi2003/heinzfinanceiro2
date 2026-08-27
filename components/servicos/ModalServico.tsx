"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useServicosStore, Servico } from "@/store/useServicosStore";

interface Props { isOpen: boolean; onClose: () => void; initialData?: Servico | null; }

export function ModalServico({ isOpen, onClose, initialData }: Props) {
  const { addServico, updateServico } = useServicosStore();
  const [nome, setNome] = useState("");
  const [tempo, setTempo] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome);
      setTempo(initialData.tempo);
      setValor(initialData.valorBase.toString());
    } else {
      setNome(""); setTempo(""); setValor("");
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (initialData) {
      updateServico(initialData.id, { nome, tempo, valorBase: Number(valor) });
    } else {
      addServico({ nome: nome || "Estilo Personalizado", tempo: tempo || "A Combinar", valorBase: Number(valor) || 0 });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Serviço" : "Cadastrar Serviço de Beleza"}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Nome do Estilo/Serviço</label>
          <input type="text" placeholder="Realismo Sombreado..." value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
        <div>
           <label className="block text-sm font-semibold mb-1 text-gray-700">Tempo Estimado</label>
           <input type="text" placeholder="2 Sessões..." value={tempo} onChange={e => setTempo(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
        <div>
           <label className="block text-sm font-semibold mb-1 text-gray-700">Valor Reto (Base)</label>
           <input type="number" placeholder="800.00" value={valor} onChange={e => setValor(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-600">Cancelar</button>
        <button onClick={handleSave} disabled={!nome || !valor} className="bg-primary text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">{initialData ? "Atualizar Serviço" : "Salvar Serviço"}</button>
      </div>
    </Modal>
  );
}
