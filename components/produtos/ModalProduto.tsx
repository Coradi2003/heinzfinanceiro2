"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useProdutosStore, Produto } from "@/store/useProdutosStore";

interface Props { isOpen: boolean; onClose: () => void; initialData?: Produto | null; }

export function ModalProduto({ isOpen, onClose, initialData }: Props) {
  const { addProduto, updateProduto } = useProdutosStore();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome);
      setValor(initialData.valor.toString());
    } else {
      setNome(""); setValor("");
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (initialData) {
      updateProduto(initialData.id, { nome, valor: Number(valor) });
    } else {
      addProduto({ nome: nome || "Novo Produto", valor: Number(valor) || 0 });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Produto" : "Adicionar ao Catálogo"}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Nome do Produto</label>
          <input type="text" placeholder="Beard Oil..." value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
        <div>
           <label className="block text-sm font-semibold mb-1 text-gray-700">Preço (R$)</label>
           <input type="number" placeholder="50.00" value={valor} onChange={e => setValor(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-primary outline-none" />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-600">Cancelar</button>
        <button onClick={handleSave} disabled={!nome || !valor} className="bg-primary text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">{initialData ? "Atualizar Produto" : "Salvar Produto"}</button>
      </div>
    </Modal>
  );
}
