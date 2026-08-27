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

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new window.Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error("Não foi possível carregar a logo"));
    imagem.src = src;
  });
}

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, larguraMaxima: number): string[] {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [];
  const linhas: string[] = [];
  let linha = palavras[0];

  for (let i = 1; i < palavras.length; i++) {
    const teste = `${linha} ${palavras[i]}`;
    if (ctx.measureText(teste).width <= larguraMaxima) linha = teste;
    else {
      linhas.push(linha);
      linha = palavras[i];
    }
  }
  linhas.push(linha);
  return linhas;
}

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
    if (itens.length === 0) return null;
    setGerando(true);
    try {
      const largura = 1080;
      const alturaCabecalho = 330;
      const alturaRodape = 150;
      const alturasItens = itens.map((item) => 105 + (item.descricao ? 38 : 0));
      const altura = alturaCabecalho + alturasItens.reduce((soma, atual) => soma + atual, 0) + alturaRodape;
      const canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = altura;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas não disponível neste dispositivo");

      const gradiente = ctx.createLinearGradient(0, 0, largura, altura);
      gradiente.addColorStop(0, "#C9797F");
      gradiente.addColorStop(0.55, "#A66B82");
      gradiente.addColorStop(1, "#6F3856");
      ctx.fillStyle = gradiente;
      ctx.fillRect(0, 0, largura, altura);

      ctx.fillStyle = "rgba(255,255,255,0.07)";
      for (let y = 30; y < altura; y += 100) {
        for (let x = 40; x < largura; x += 120) {
          ctx.beginPath();
          ctx.arc(x + ((y / 100) % 2) * 35, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const logo = await carregarImagem("/logo.jpeg");
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(72, 62, 170, 170, 32);
      ctx.clip();
      ctx.drawImage(logo, 72, 62, 170, 170);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(72, 62, 170, 170, 32);
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 55px Arial, sans-serif";
      ctx.fillText("Studio Paty Heinz", 280, 135);
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.font = "700 25px Arial, sans-serif";
      ctx.fillText("INVISTA EM VOCÊ", 282, 184);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 31px Arial, sans-serif";
      ctx.fillText("TABELA DE PREÇOS", 72, 292);

      let y = alturaCabecalho;
      itens.forEach((item, indice) => {
        const alturaItem = alturasItens[indice];
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(72, y);
        ctx.lineTo(largura - 72, y);
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 31px Arial, sans-serif";
        const linhasNome = quebrarTexto(ctx, item.nome, 610);
        linhasNome.slice(0, 2).forEach((linha, linhaIndice) => {
          ctx.fillText(linha, 72, y + 48 + linhaIndice * 36);
        });

        ctx.textAlign = "right";
        ctx.font = "900 32px Arial, sans-serif";
        ctx.fillText(moeda.format(Number(item.valor)), largura - 72, y + 48);
        if (item.duracao) {
          ctx.fillStyle = "rgba(255,255,255,0.72)";
          ctx.font = "600 22px Arial, sans-serif";
          ctx.fillText(item.duracao, largura - 72, y + 82);
        }
        ctx.textAlign = "left";

        if (item.descricao) {
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.font = "400 22px Arial, sans-serif";
          const linhasDescricao = quebrarTexto(ctx, item.descricao, 610);
          ctx.fillText(linhasDescricao[0] || "", 72, y + 102);
        }
        y += alturaItem;
      });

      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.moveTo(72, y);
      ctx.lineTo(largura - 72, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.textAlign = "center";
      ctx.font = "500 21px Arial, sans-serif";
      ctx.fillText("Valores sujeitos a alteração. Consulte disponibilidade.", largura / 2, y + 72);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      return blob ? new File([blob], "tabela-de-precos-paty-heinz.png", { type: "image/png" }) : null;
    } catch (error) {
      console.error("Erro ao gerar tabela de preços:", error);
      alert("Não foi possível gerar a imagem. Atualize o aplicativo e tente novamente.");
      return null;
    } finally {
      setGerando(false);
    }
  };

  const compartilhar = async () => {
    const arquivo = await gerarImagem();
    if (!arquivo) return;
    try {
      if (navigator.share && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({
          title: "Tabela de Preços - Studio Paty Heinz",
          text: "Confira nossa tabela de preços ✨",
          files: [arquivo],
        });
        return;
      }
      baixarArquivo(arquivo);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Erro ao compartilhar:", error);
      baixarArquivo(arquivo);
    }
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
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
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
