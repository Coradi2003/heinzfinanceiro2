"use client";

import { createClient } from "@/lib/supabase";
import { LogOut, Palette, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useConfigStore } from "@/store/useConfigStore";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const supabase = createClient();
  const salvarConfiguracoes = useConfigStore(state => state.salvarConfiguracoes);
  const corSalva = useConfigStore(state => state.corHexa);
  const bgSalvo = useConfigStore(state => state.bgHexa);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const cores = [
    { nome: "Rosé Paty", bg: "bg-[#C9797F]" },
    { nome: "Rosa Queimado", bg: "bg-[#B76E79]" },
    { nome: "Malva Elegante", bg: "bg-[#9B6B8E]" },
    { nome: "Lavanda", bg: "bg-[#8B7AB8]" },
    { nome: "Ameixa", bg: "bg-[#7A466A]" },
    { nome: "Terracota", bg: "bg-[#C86B5A]" },
    { nome: "Champagne", bg: "bg-[#B58B57]" },
    { nome: "Rosa Antigo", bg: "bg-[#A95F72]" },
  ];
  
  const [corAtiva, setCorAtiva] = useState(cores[0].bg);
  
  const fundos = [
    { nome: "Blush Suave", bg: "#FFF7F7" },
    { nome: "Rosa Névoa", bg: "#FDF0F1" },
    { nome: "Creme Delicado", bg: "#FFF9F3" },
    { nome: "Lavanda Clara", bg: "#FAF7FC" },
    { nome: "Nude", bg: "#F8F1ED" },
    { nome: "Pérola", bg: "#FCFAF8" },
  ];
  const [fundoAtivo, setFundoAtivo] = useState(fundos[0].bg);

  useEffect(() => {
    if (corSalva) setCorAtiva(corSalva);
    if (bgSalvo) setFundoAtivo(bgSalvo);
  }, [corSalva, bgSalvo]);

  // Mostra a cor de fundo imediatamente enquanto a pessoa escolhe.
  // Se sair sem salvar, o tema persistido volta a ser aplicado.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--app-background", fundoAtivo);

    return () => {
      root.style.setProperty("--app-background", bgSalvo || "#FFF7F7");
    };
  }, [fundoAtivo, bgSalvo]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveColor = async () => {
    setLoadingConfig(true);
    try {
      await salvarConfiguracoes({
        corHexa: corAtiva,
        bgHexa: fundoAtivo
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações</h2>
        <p className="text-gray-500">Ajustes gerais do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Bloco de Cores */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold text-lg">
            <Palette size={20} className="text-primary" /> Cor Principal
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {cores.map(c => (
              <div 
                key={c.bg}
                onClick={() => setCorAtiva(c.bg)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${corAtiva === c.bg ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${c.bg}`}></div>
                  <span className="text-sm font-semibold text-gray-700">{c.nome}</span>
                </div>
                {corAtiva === c.bg && <CheckCircle2 size={16} className="text-primary" />}
              </div>
            ))}
          </div>

        </div>

        {/* Bloco de Fundos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold text-lg">
            <Palette size={20} className="text-gray-500" /> Cor do Fundo Mestre
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {fundos.map(f => (
              <button
                type="button"
                key={f.bg}
                onClick={() => setFundoAtivo(f.bg)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition text-left ${fundoAtivo === f.bg ? 'border-primary ring-1 ring-primary' : 'border-gray-100 hover:border-gray-200'}`}
                style={{
                  background: `linear-gradient(135deg, ${f.bg} 0%, ${f.bg} 58%, #FFFFFF 58%, #FFFFFF 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-8 rounded-lg border border-gray-300 shadow-inner shrink-0"
                    style={{ backgroundColor: f.bg }}
                  ></div>
                  <span className="text-sm font-semibold text-gray-700">{f.nome}</span>
                </div>
                {fundoAtivo === f.bg && <CheckCircle2 size={16} className="text-primary" />}
              </button>
            ))}
          </div>

          <div
            className="rounded-2xl border border-gray-200 p-4 mb-6 transition-colors duration-300"
            style={{ backgroundColor: fundoAtivo }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Prévia do fundo</p>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="font-bold text-gray-800">Studio Paty Heinz</p>
              <p className="text-xs text-gray-500 mt-1">Assim os cartões aparecerão sobre o fundo escolhido.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveColor}
            disabled={loadingConfig}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl transition hover:opacity-90 disabled:opacity-60"
          >
            {loadingConfig ? "Salvando..." : "Salvar Cores do Aplicativo"}
          </button>
        </div>

        {/* Zona de Perigo / Conta */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <div className="mb-4">
               <h3 className="text-lg font-bold text-gray-800">Conta do Estúdio</h3>
               <p className="text-sm text-gray-500">Se precisar fechar o sistema após o expediente.</p>
             </div>
             
             {/* Botão Sair - Less Accessible (menos chamativo e com ícone perigoso) */}
             <div className="pt-4 border-t border-gray-50">
               <button 
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-xl transition hover:bg-red-100 flex items-center justify-center gap-2"
               >
                 <LogOut size={18} />
                 Encerrar Sessão
               </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
