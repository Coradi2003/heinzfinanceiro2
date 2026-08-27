"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useClientesStore, Cliente } from "@/store/useClientesStore";

interface Props { isOpen: boolean; onClose: () => void; initialData?: Cliente | null; }

export function ModalCliente({ isOpen, onClose, initialData }: Props) {
  const { addCliente, updateCliente } = useClientesStore();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [notas, setNotas] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const handleDataNascimento = (value: string) => {
    // Máscara automática: DD/MM/AAAA
    const nums = value.replace(/\D/g, '').slice(0, 8);
    let masked = nums;
    if (nums.length > 2) masked = nums.slice(0,2) + '/' + nums.slice(2);
    if (nums.length > 4) masked = nums.slice(0,2) + '/' + nums.slice(2,4) + '/' + nums.slice(4);
    setDataNascimento(masked);
  };

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome);
      setTelefone(initialData.telefone || "");
      setNotas(initialData.notas || "");
      setDataNascimento(initialData.dataNascimento || "");
    } else {
      setNome(""); setTelefone(""); setNotas(""); setDataNascimento("");
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (initialData) {
      updateCliente(initialData.id, { nome, telefone, notas, dataNascimento });
    } else {
      addCliente({ nome, telefone, notas, dataNascimento, ultimaVisita: new Date().toISOString() });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Cliente" : "Novo Cliente"}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Nome do Cliente</label>
          <input type="text" placeholder="Fulano Silva" value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
        <div>
           <label className="block text-sm font-semibold mb-1 text-gray-700">Whatsapp (Opcional)</label>
           <input type="text" placeholder="(00) 00000-0000" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
        <div>
           <label className="block text-sm font-semibold mb-1 text-gray-700">Data de Nascimento</label>
           <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" value={dataNascimento} onChange={e => handleDataNascimento(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
        <div>
           <label className="block text-sm font-semibold mb-1 text-gray-700">Anotações / Preferências</label>
           <textarea placeholder="Gosta de realismo, não gosta de dor..." value={notas} onChange={e => setNotas(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none h-24" />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-600">Cancelar</button>
        <button onClick={handleSave} disabled={!nome} className="bg-primary text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">{initialData ? "Atualizar" : "Salvar Cliente"}</button>
      </div>
    </Modal>
  );
}
