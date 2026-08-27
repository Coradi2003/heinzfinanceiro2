"use client";

import { useState } from "react";
import { Zap, ShoppingCart, QrCode, CreditCard, Banknote, Plus, Minus, Trash2, PackagePlus, Check, Search } from "lucide-react";
import { useProdutosStore } from "@/store/useProdutosStore";
import { useFinanceiroStore } from "@/store/useFinanceiroStore";
import { Modal } from "@/components/ui/Modal";

interface ModalVendaRapidaProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemCarrinho {
  id: string; // unique key per item
  nome: string;
  valorUnitario: number;
  quantidade: number;
  salvarNoCatalogo?: boolean;
  isNovo?: boolean;
}

export function ModalVendaRapida({ isOpen, onClose }: ModalVendaRapidaProps) {
  const { produtos, addProduto } = useProdutosStore();
  const addTransacao = useFinanceiroStore(state => state.addTransacao);

  const [busca, setBusca] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [sucesso, setSucesso] = useState(false);

  // Sugestões do catálogo
  const sugestoes = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) && busca !== ""
  );

  const isProdutoNovo = busca.length > 2 && !produtos.some(p =>
    p.nome.toLowerCase() === busca.toLowerCase()
  );

  // Adiciona produto do catálogo ao carrinho
  const handleSelecionarSugestao = (p: { id: string; nome: string; valor: number }) => {
    setCarrinho(prev => {
      const existente = prev.find(item => item.nome.toLowerCase() === p.nome.toLowerCase());
      if (existente) {
        return prev.map(item =>
          item.nome.toLowerCase() === p.nome.toLowerCase()
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, {
        id: `${p.id}-${Date.now()}`,
        nome: p.nome,
        valorUnitario: p.valor,
        quantidade: 1,
        isNovo: false,
      }];
    });
    setBusca("");
    setShowSuggestions(false);
  };

  // Adiciona produto novo (digitado manualmente) ao carrinho
  const handleAdicionarNovo = () => {
    if (!busca) return;
    setCarrinho(prev => {
      const existente = prev.find(item => item.nome.toLowerCase() === busca.toLowerCase());
      if (existente) {
        return prev.map(item =>
          item.nome.toLowerCase() === busca.toLowerCase()
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, {
        id: `novo-${Date.now()}`,
        nome: busca,
        valorUnitario: 0,
        quantidade: 1,
        isNovo: true,
        salvarNoCatalogo: false,
      }];
    });
    setBusca("");
    setShowSuggestions(false);
  };

  const alterarQuantidade = (id: string, delta: number) => {
    setCarrinho(prev =>
      prev.map(item => item.id === id
        ? { ...item, quantidade: Math.max(1, item.quantidade + delta) }
        : item
      )
    );
  };

  const alterarValor = (id: string, valor: string) => {
    setCarrinho(prev =>
      prev.map(item => item.id === id
        ? { ...item, valorUnitario: Number(valor) || 0 }
        : item
      )
    );
  };

  const removerItem = (id: string) => {
    setCarrinho(prev => prev.filter(item => item.id !== id));
  };

  const toggleSalvarCatalogo = (id: string) => {
    setCarrinho(prev =>
      prev.map(item => item.id === id
        ? { ...item, salvarNoCatalogo: !item.salvarNoCatalogo }
        : item
      )
    );
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.valorUnitario * item.quantidade, 0);

  const handleConcluirVenda = async () => {
    if (carrinho.length === 0) return;
    const dataISO = new Date().toISOString();

    for (const item of carrinho) {
      // Salva no catálogo se solicitado
      if (item.isNovo && item.salvarNoCatalogo) {
        await addProduto({ nome: item.nome, valor: item.valorUnitario });
      }

      // Lança uma transação por item (com quantidade na descrição)
      await addTransacao({
        tipo: 'receita',
        categoria: 'Venda Rápida',
        descricao: item.quantidade > 1
          ? `Venda Rápida - ${item.nome} (x${item.quantidade})`
          : `Venda Rápida - ${item.nome}`,
        metodo: metodoPagamento,
        valor: item.valorUnitario * item.quantidade,
        data: dataISO,
        conta: 'Empresa',
      });
    }

    setSucesso(true);
    setTimeout(() => {
      setSucesso(false);
      setCarrinho([]);
      setBusca("");
      setMetodoPagamento("Pix");
      onClose();
    }, 1200);
  };

  const metodos = [
    { id: 'Pix', icon: QrCode, label: 'Pix' },
    { id: 'Cartão', icon: CreditCard, label: 'Cartão' },
    { id: 'Dinheiro', icon: Banknote, label: 'Dinheiro' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ Venda Rápida">
      <div className="space-y-5">
        <p className="text-sm text-gray-500">Adicione um ou mais produtos e conclua a venda instantaneamente.</p>

        {/* Campo de busca */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar produto do catálogo</label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Digite o nome do produto ou serviço..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-700"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isProdutoNovo) handleAdicionarNovo();
                }}
              />
            </div>
            {isProdutoNovo && (
              <button
                onClick={handleAdicionarNovo}
                className="shrink-0 px-4 bg-primary text-white rounded-2xl font-bold text-sm flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus size={16} /> Adicionar
              </button>
            )}
          </div>

          {/* Dropdown de sugestões */}
          {showSuggestions && sugestoes.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Produtos no seu catálogo</span>
              </div>
              {sugestoes.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelecionarSugestao(p)}
                  className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition text-left group"
                >
                  <span className="font-bold text-gray-800 group-hover:text-primary transition-colors">{p.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-gray-400">R$ {p.valor.toFixed(2)}</span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Plus size={10} /> Adicionar
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Carrinho de itens */}
        {carrinho.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              🛒 Itens da venda <span className="text-primary font-black">({carrinho.length})</span>
            </label>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {carrinho.map(item => (
                <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-2">
                  {/* Linha principal: nome + quantidade + remover */}
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-bold text-gray-800 text-sm truncate">{item.nome}</span>

                    {/* Seletor de quantidade */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0">
                      <button
                        onClick={() => alterarQuantidade(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-90"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center font-black text-gray-800 text-sm select-none">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => alterarQuantidade(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 transition active:scale-90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => removerItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-xl transition active:scale-90 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Valor unitário + subtotal */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-gray-400">R$</span>
                      <input
                        type="number"
                        value={item.valorUnitario || ""}
                        onChange={e => alterarValor(item.id, e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-green-600 outline-none focus:border-primary"
                      />
                    </div>
                    {item.quantidade > 1 && (
                      <span className="text-xs font-black text-gray-500 shrink-0">
                        = R$ {(item.valorUnitario * item.quantidade).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Opção de salvar no catálogo (apenas produtos novos) */}
                  {item.isNovo && (
                    <div
                      onClick={() => toggleSalvarCatalogo(item.id)}
                      className="flex items-center gap-2 cursor-pointer mt-1"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${item.salvarNoCatalogo ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white'}`}>
                        {item.salvarNoCatalogo && <Check size={11} strokeWidth={4} />}
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                        <PackagePlus size={11} className="text-primary" />
                        Salvar no catálogo
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-100 rounded-2xl">
              <span className="text-sm font-bold text-gray-600">Total da venda</span>
              <span className="text-xl font-black text-green-600">R$ {totalCarrinho.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Método de pagamento */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pagamento</label>
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full">
            {metodos.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetodoPagamento(m.id as any)}
                className={`flex-1 py-3 px-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${metodoPagamento === m.id ? 'bg-white shadow-md text-primary ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <m.icon size={16} />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botão concluir */}
        <button
          onClick={handleConcluirVenda}
          disabled={carrinho.length === 0 || carrinho.some(i => !i.valorUnitario) || sucesso}
          className={`w-full font-black py-5 rounded-[22px] shadow-xl disabled:bg-gray-200 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${sucesso ? 'bg-green-500 shadow-green-200 text-white' : 'bg-primary text-white shadow-primary/20'}`}
        >
          {sucesso ? (
            <><Check size={20} /> Venda Registrada!</>
          ) : (
            <><ShoppingCart size={20} /> Concluir Venda{carrinho.length > 0 && ` • R$ ${totalCarrinho.toFixed(2)}`} ⚡</>
          )}
        </button>
      </div>
    </Modal>
  );
}
