"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";

const VARIAVEIS_COMPROVANTE = [
  ["NOME_CLIENTE", "Nome da cliente"],
  ["DATA_SESSAO", "Data"],
  ["HORA_SESSAO", "Horário"],
  ["SERVICO_PROCEDIMENTO", "Procedimento"],
  ["DURACAO_SESSION", "Duração"],
  ["VALOR_TOTAL", "Valor total"],
  ["VALOR_SINAL", "Sinal"],
  ["METODO_SINAL", "Forma de pagamento"],
] as const;

export default function DocumentosPage() {
  const templateComprovanteSalvo = useConfigStore((state) => state.templateComprovante);
  const templateCompromissoSalvo = useConfigStore((state) => state.templateCompromisso);
  const salvarConfiguracoes = useConfigStore((state) => state.salvarConfiguracoes);
  const carregarConfiguracao = useConfigStore((state) => state.carregarConfiguracao);

  const [comprovante, setComprovante] = useState(templateComprovanteSalvo);
  const [politicas, setPoliticas] = useState(templateCompromissoSalvo);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    carregarConfiguracao();
  }, [carregarConfiguracao]);

  useEffect(() => {
    setComprovante(templateComprovanteSalvo);
    setPoliticas(templateCompromissoSalvo);
  }, [templateComprovanteSalvo, templateCompromissoSalvo]);

  const inserirVariavel = (variavel: string) => {
    setComprovante((texto) => `${texto}${texto.endsWith("\n") ? "" : " "}${variavel}`);
    setSalvo(false);
  };

  const salvar = async () => {
    setSalvando(true);
    setSalvo(false);
    try {
      await salvarConfiguracoes({
        templateComprovante: comprovante,
        templateCompromisso: politicas,
      });
      setSalvo(true);
      window.setTimeout(() => setSalvo(false), 2500);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Documentos</h2>
        <p className="text-gray-500">Tabela de preços, confirmação e políticas de agendamento.</p>
      </div>

      <Link
        href="/tabela-precos"
        className="group bg-gradient-to-r from-primary to-secondary text-white rounded-3xl p-6 mb-8 flex items-center justify-between gap-4 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <BadgeDollarSign size={26} />
          </div>
          <div>
            <h3 className="text-xl font-black">Tabela de Preços</h3>
            <p className="text-sm text-white/80">Crie, organize, salve e compartilhe sua tabela com as clientes.</p>
          </div>
        </div>
        <ChevronRight className="group-hover:translate-x-1 transition-transform shrink-0" />
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><CalendarCheck size={21} /></div>
            <div>
              <h3 className="font-black text-gray-900">Comprovante de agendamento</h3>
              <p className="text-xs text-gray-500 mt-0.5">Mensagem com os dados específicos do horário.</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              value={comprovante}
              onChange={(event) => { setComprovante(event.target.value); setSalvo(false); }}
              rows={16}
              className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm leading-relaxed outline-none focus:border-primary resize-y"
            />
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Inserir informação automática</p>
              <div className="flex flex-wrap gap-2">
                {VARIAVEIS_COMPROVANTE.map(([variavel, rotulo]) => (
                  <button
                    type="button"
                    key={variavel}
                    onClick={() => inserirVariavel(variavel)}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition"
                    title={variavel}
                  >
                    + {rotulo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><ShieldCheck size={21} /></div>
            <div>
              <h3 className="font-black text-gray-900">Políticas de agendamento</h3>
              <p className="text-xs text-gray-500 mt-0.5">Regras sobre sinal, faltas, cancelamentos e remarcações.</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              value={politicas}
              onChange={(event) => { setPoliticas(event.target.value); setSalvo(false); }}
              rows={16}
              className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm leading-relaxed outline-none focus:border-primary resize-y"
            />
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
              <MessageCircle size={19} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Este texto é anexado ao comprovante enviado pelo WhatsApp. Você pode informar livremente quando o sinal é exigido ou quando não será cobrado.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText size={17} /> Salve uma vez e este modelo será usado automaticamente nos próximos agendamentos.
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="w-full sm:w-auto min-w-52 bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
        >
          {salvando ? <Loader2 size={18} className="animate-spin" /> : salvo ? <CheckCircle2 size={18} /> : null}
          {salvando ? "Salvando..." : salvo ? "Salvo para os próximos" : "Salvar para os próximos agendamentos"}
        </button>
      </div>
    </div>
  );
}
