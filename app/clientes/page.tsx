"use client";

import { useState } from "react";
import { useClientesStore, Cliente } from "@/store/useClientesStore";
import { MessageCircle, Gift, CalendarClock, User, Plus, Pencil, Trash2, Search, MoreVertical, Phone, Tag, Trash, Cake } from "lucide-react";
import { ModalCliente } from "@/components/clientes/ModalCliente";

export default function ClientesPage() {
  const { clientes, removeCliente } = useClientesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteEdit, setClienteEdit] = useState<Cliente | null>(null);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState<string | null>(null);

  const clientesFiltrados = clientes.filter(c => 
     c.nome.toLowerCase().includes(busca.toLowerCase()) || 
     c.telefone?.includes(busca)
  );

  const handleWhatsApp = (numero: string | undefined, textoInicial: string) => {
    const msg = encodeURIComponent(textoInicial);
    // Remove tudo que não é número do telefone
    const numLimpo = numero?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${numLimpo}?text=${msg}`, '_blank');
  };
  
  return (
    <div className="min-h-screen bg-[#0a0c12] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header - Dark Style */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Base de Clientes</h2>
            <p className="text-gray-500 text-sm font-medium">Controle total dos seus contatos</p>
          </div>
          <button 
            onClick={() => { setClienteEdit(null); setIsModalOpen(true); }} 
            className="bg-primary text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Novo Cliente</span>
          </button>
        </div>

        {/* Barra de Pesquisa - Dark Style */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Pesquisar por nome ou telefone..."
            className="w-full bg-[#161b26] border border-gray-800 rounded-3xl py-5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-200 shadow-inner"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Listagem Estilo Foto */}
        <div className="space-y-3 pb-20">
          {clientesFiltrados.length > 0 ? (
            clientesFiltrados.map(c => (
              <div key={c.id} className="relative bg-[#161b26] border border-gray-800/50 rounded-[24px] p-5 flex items-center gap-5 hover:border-primary/50 transition-all group overflow-visible">
                
                {/* Avatar Circle */}
                <div className="w-14 h-14 rounded-full bg-[#1c2436] flex items-center justify-center text-primary/80 shrink-0 border border-white/5 shadow-xl">
                  <User size={28} />
                </div>

                {/* Info Center */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-lg leading-tight truncate">{c.nome}</h4>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Tag size={12} className="text-gray-500" />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight truncate">
                      {c.notas || "sem etiqueta"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Phone size={12} className="text-primary/70" />
                    <span className="text-sm font-bold text-gray-400">
                      {c.telefone || "Não informado"}
                    </span>
                    {c.dataNascimento && (
                      <>
                        <span className="text-gray-700 select-none">•</span>
                        <Cake size={12} className="text-pink-400/80" />
                        <span className="text-sm font-bold text-gray-400">
                          {c.dataNascimento}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Botão de Menu (Trigger) */}
                <button 
                  onClick={() => setMenuAberto(menuAberto === c.id ? null : c.id)}
                  className={`p-3 rounded-xl transition-all ${menuAberto === c.id ? 'bg-primary text-white scale-90' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  <MoreVertical size={22} />
                </button>

                {/* DROPDOWN MENU - Estilo Dropdown Dark */}
                {menuAberto === c.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(null)} />
                    <div className="absolute right-6 top-16 w-56 bg-[#1f2636] border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right py-2">
                       <p className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 mb-1">Lembretes WhatsApp</p>
                       <button onClick={() => handleWhatsApp(c.telefone, 'Oi! Passando só pra confirmar sua sessão amanhã!')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-primary hover:text-white transition-all group/item">
                         <CalendarClock size={16} className="text-primary group-hover/item:text-white" /> 1 Dia Antes
                       </button>
                       <button onClick={() => handleWhatsApp(c.telefone, 'E aí, tudo pronto? Sua sessão é daqui a 1 hora!')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-primary hover:text-white transition-all group/item">
                         <CalendarClock size={16} className="text-orange-500 group-hover/item:text-white" /> 1 Hora Antes
                       </button>
                       <button onClick={() => handleWhatsApp(c.telefone, 'Parabéns pelo seu aniversário!')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-primary hover:text-white transition-all group/item">
                         <Gift size={16} className="text-pink-500 group-hover/item:text-white" /> Mensagem B-Day
                       </button>
                       <button onClick={() => handleWhatsApp(c.telefone, 'Olá!')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-primary hover:text-white transition-all group/item border-b border-white/5 mb-1 pb-4">
                         <MessageCircle size={16} className="text-green-500 group-hover/item:text-white" /> Iniciar Chat
                       </button>
                       <p className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Gestão</p>
                       <button onClick={() => { setMenuAberto(null); setClienteEdit(c); setIsModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-blue-600 hover:text-white transition-all">
                         <Pencil size={16} className="text-blue-400" /> Editar Cadastro
                       </button>
                       <button onClick={() => { if(confirm('Excluir este cliente?')) removeCliente(c.id); setMenuAberto(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition-all">
                         <Trash size={16} /> Excluir Cliente
                       </button>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-16 bg-[#161b26] border border-dashed border-gray-800 rounded-3xl">
              <User size={56} className="mx-auto text-gray-800 mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </div>

      <ModalCliente isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={clienteEdit} />
    </div>
  );
}
