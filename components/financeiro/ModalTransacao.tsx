"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useFinanceiroStore, Transacao } from "@/store/useFinanceiroStore";

interface Props { isOpen: boolean; onClose: () => void; initialData?: Transacao | null;}

export function ModalTransacao({ isOpen, onClose, initialData }: Props) {
  const { addTransacao, updateTransacao } = useFinanceiroStore();
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [cat, setCat] = useState("Venda Genérica");
  const conta = 'Empresa';
  const [metodo, setMetodo] = useState<'Dinheiro' | 'Cartão' | 'Pix'>('Pix');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (initialData) {
      setTipo(initialData.tipo);
      setDesc(initialData.descricao);
      setValor(initialData.valor.toString());
      setCat(initialData.categoria);
      setMetodo(initialData.metodo);
      setData(initialData.data.slice(0, 10));
    } else {
      setTipo('receita');
      setDesc("");
      setValor("");
      setCat("Venda Genérica");
      setMetodo('Pix');
      setData(new Date().toISOString().slice(0, 10));
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    // Save as midday UTC so the local date stays correct in any timezone (UTC-11 to UTC+11).
    // Using "T12:00:00.000Z" avoids the bug where a local evening transaction
    // (e.g. 21:30 BRT = 00:30+1day UTC) shifts to the next day.
    const dataISO = data + 'T12:00:00.000Z';

    if (initialData) {
      updateTransacao(initialData.id, {
        tipo,
        descricao: desc,
        valor: Number(valor),
        categoria: cat,
        conta,
        metodo,
        data: dataISO
      });
    } else {
      addTransacao({
        tipo,
        categoria: cat,
        descricao: desc || "Registro Avulso",
        valor: Number(valor) || 0,
        conta,
        metodo,
        data: dataISO
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Registro" : "Novo Registro Manual"}>
      <div className="space-y-3">

        {/* Tipo (Fixo Entrada) */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de Registro</label>
          <div className="w-full px-4 py-3 rounded-xl border border-green-200 text-green-700 bg-green-50 font-bold flex items-center gap-2">
            <span>📈 Entrada (Receita)</span>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descrição</label>
          <input
            type="text"
            placeholder="Ex: Venda de produto, Serviço avulso..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Categoria</label>
          <input
            type="text"
            placeholder="Ex: Serviços, Venda Genérica..."
            value={cat}
            onChange={e => setCat(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800"
          />
        </div>

        {/* Valor e Método */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Valor (R$)</label>
            <input
              type="number"
              placeholder="0,00"
              value={valor}
              onChange={e => setValor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Método</label>
            <select
              value={metodo}
              onChange={e => setMetodo(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white font-semibold"
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
            </select>
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 font-semibold"
          />
        </div>

      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-600">Cancelar</button>
        <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">
          {initialData ? "Atualizar" : "Salvar e Lançar"}
        </button>
      </div>
    </Modal>
  );
}
