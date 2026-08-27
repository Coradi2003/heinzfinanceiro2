"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Loader2,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ItemTabelaPreco, useTabelaPrecosStore } from "@/store/useTabelaPrecosStore";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function TabelaPrecosPage() {
  const { itens, carregando, adicionarItem, atualizarItem, removerItem, moverItem } = useTabelaPrecosStore();
  const tabelaRef = useRef<HTMLDivElement>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ItemTabelaPreco | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [duracao, setDuracao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setDescricao("");
    setValor("");
    setDuracao("");
    setModalAberto(true);
  };

  const abrirEdicao = (item: ItemTabelaPreco) => {
    setEditando(item);
    setNome(item.nome);
    setDescricao(item.descricao || "");
    setValor(String(item.valor));
    setDuracao(item.duracao || "");
    setModalAberto(true);
  };

  const salvarItem = async (event: FormEvent) => {
    event.preventDefault();
    const valorNumerico = Number(valor.replace(",", "."));
    if (!nome.trim() || !Number.isFinite(valorNumerico) || valorNumerico < 0) return;

    setSalvando(true);
    try {
      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        valor: valorNumerico,
        duracao: duracao.trim(),
      };
      if (editando) await atualizarItem(editando.id, dados);
      else await adicionarItem(dados);
      setModalAberto(false);
    } catch (error) {
      console.error(error);
      alert("Não foi possível salvar. Confirme se a tabela do Supabase foi criada.");
    } finally {
      setSalvando(false);
    }
  };

  const gerarImagem = async (): Promise<File | null> => {
    if (!tabelaRef.current || itens.length === 0) return null;
    setGerando(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(tabelaRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
      return blob ? new File([blob], "tabela-de-precos-paty-heinz.png", { type: "image/png" }) : null;
    } finally {
      setGerando(false);
    }
  };

  const compartilhar = async () => {
    const arquivo = await gerarImagem();
    if (!arquivo) return;
    if (navigator.share && navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({
        title: "Tabela de Preços - Studio Paty Heinz",
        text: "Confira nossa tabela de preços ✨",
        files: [arquivo],
      });
      return;
    }
    baixarArquivo(arquivo);
  };

  const baixar = async () => {
    const arquivo = await gerarImagem();
    if (arquivo) baixarArquivo(arquivo);
  };

  const baixarArquivo = (arquivo: File) => {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = arquivo.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tabela de Preços</h2>
          <p className="text-gray-500">Monte uma tabela personalizada para compartilhar com suas clientes.</p>
        </div>
        <button onClick={abrirNovo} className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-90 transition">
          <Plus size={20} /> Novo item
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px] gap-8 items-start">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden no-print">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Pencil size={18} className="text-primary" />
            <h3 className="font-bold text-gray-800">Itens da tabela</h3>
          </div>

          {carregando ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : itens.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles className="mx-auto text-primary/40 mb-3" size={36} />
              <p className="font-bold text-gray-700">Sua tabela ainda está vazia.</p>
              <p className="text-sm text-gray-500 mt-1">Adicione os serviços e preços que deseja divulgar.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {itens.map((item, indice) => (
                <div key={item.id} className="p-4 md:p-5 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div className="flex flex-col gap-1">
                    <button disabled={indice === 0} onClick={() => moverItem(item.id, "cima")} className="p-1 rounded text-gray-400 hover:text-primary disabled:opacity-20" title="Mover para cima"><ArrowUp size={16} /></button>
                    <button disabled={indice === itens.length - 1} onClick={() => moverItem(item.id, "baixo")} className="p-1 rounded text-gray-400 hover:text-primary disabled:opacity-20" title="Mover para baixo"><ArrowDown size={16} /></button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800">{item.nome}</p>
                    {(item.descricao || item.duracao) && <p className="text-xs text-gray-500 mt-1">{[item.descricao, item.duracao].filter(Boolean).join(" • ")}</p>}
                  </div>
                  <p className="font-black text-primary whitespace-nowrap">{moeda.format(item.valor)}</p>
                  <button onClick={() => abrirEdicao(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={17} /></button>
                  <button onClick={() => confirm(`Excluir ${item.nome}?`) && removerItem(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4 lg:sticky lg:top-6">
          <div ref={tabelaRef} className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary via-secondary to-[#6f3856] text-white p-7 shadow-2xl">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 15%, white 0 2px, transparent 3px), radial-gradient(circle at 80% 35%, white 0 1px, transparent 2px)", backgroundSize: "55px 55px" }} />
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#E38F85] border-2 border-white/60 shadow-lg shrink-0">
                  <Image src="/logo.jpeg" alt="Studio Paty Heinz" fill className="object-contain" sizes="64px" priority />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">Studio Paty Heinz</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/80">Invista em você</p>
                </div>
              </div>

              <p className="text-sm font-black uppercase tracking-[0.25em] mb-5">Tabela de preços</p>
              <div className="divide-y divide-white/25 border-y border-white/25">
                {itens.length === 0 ? (
                  <p className="py-10 text-center text-white/70 text-sm">Adicione itens para visualizar sua tabela.</p>
                ) : itens.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold leading-tight">{item.nome}</p>
                      {item.descricao && <p className="text-[11px] text-white/75 mt-1 leading-snug">{item.descricao}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black">{moeda.format(item.valor)}</p>
                      {item.duracao && <p className="text-[10px] text-white/70 mt-0.5">{item.duracao}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-center text-white/65 mt-6">Valores sujeitos a alteração. Consulte disponibilidade.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 no-print">
            <button onClick={baixar} disabled={gerando || itens.length === 0} className="bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-gray-50">
              {gerando ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Salvar imagem
            </button>
            <button onClick={compartilhar} disabled={gerando || itens.length === 0} className="bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90">
              {gerando ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />} Compartilhar
            </button>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm p-4 flex items-center justify-center">
          <form onSubmit={salvarItem} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">{editando ? "Editar item" : "Novo item"}</h3>
              <button type="button" onClick={() => setModalAberto(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block"><span className="text-sm font-bold text-gray-700">Nome *</span><input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Esmaltação em gel" className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" /></label>
              <label className="block"><span className="text-sm font-bold text-gray-700">Descrição opcional</span><textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes, pacote ou observação" rows={3} className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-sm font-bold text-gray-700">Valor *</span><input required type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="80,00" className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" /></label>
                <label className="block"><span className="text-sm font-bold text-gray-700">Duração</span><input value={duracao} onChange={(e) => setDuracao(e.target.value)} placeholder="Ex: 1h 30min" className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" /></label>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button disabled={salvando} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {salvando && <Loader2 size={18} className="animate-spin" />} {salvando ? "Salvando..." : "Salvar item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
