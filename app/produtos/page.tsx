"use client";

import { useState } from "react";
import { Package, Plus, Zap, ShoppingCart, Pencil, Trash2 } from "lucide-react";
import { useProdutosStore, Produto } from "@/store/useProdutosStore";
import { ModalProduto } from "@/components/produtos/ModalProduto";
import { useUIStore } from "@/store/useUIStore";

export default function ProdutosPage() {
  const { produtos, removeProduto } = useProdutosStore();
  const openVendaRapida = useUIStore(state => state.openVendaRapida);
  
  const [isModalProdutoOpen, setIsModalProdutoOpen] = useState(false);
  const [produtoEdit, setProdutoEdit] = useState<Produto | null>(null);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Produtos</h2>
          <p className="text-gray-500">Gestão de catálogo e venda rápida</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setProdutoEdit(null); setIsModalProdutoOpen(true); }} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition">
            <Plus size={20} />
            <span>Adicionar</span>
          </button>
          <button 
            onClick={openVendaRapida}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-md shadow-primary/20"
          >
            <Zap size={20} className="text-yellow-400" fill="currentColor" />
            <span>Venda Rápida</span>
          </button>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
           <Package size={20} className="text-primary" />
           <h3 className="text-lg font-bold text-gray-800">Seu Catálogo</h3>
        </div>
        
        <div className="grid grid-cols-1 mb-0">
          <div className="divide-y divide-gray-50">
            {produtos.map(p => (
              <div key={p.id} className="flex justify-between items-center p-6 hover:bg-gray-50 transition group">
                <div>
                  <h4 className="font-bold text-gray-800">{p.nome}</h4>
                  <p className="text-sm text-gray-400">Estoque ilimitado</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mt-4 md:mt-0">
                  <div className="font-bold text-primary text-xl">
                    R$ {p.valor}
                  </div>
                  <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition">
                    <button onClick={() => { setProdutoEdit(p); setIsModalProdutoOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={18} /></button>
                    <button onClick={() => { if(confirm('Excluir produto?')) removeProduto(p.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      <ModalProduto isOpen={isModalProdutoOpen} onClose={() => setIsModalProdutoOpen(false)} initialData={produtoEdit} />

    </div>
  );
}
