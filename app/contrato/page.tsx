"use client";

import { useState } from "react";
import { FileText, Printer, Send, UserCheck, ShieldCheck, Save, Loader2, CalendarClock } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { useEffect } from "react";

interface Variable {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'choice';
}

interface TemplateProps {
  id: string; // ID para salvar na store (ex: templateComprovante)
  title: string;
  description: string;
  icon: any;
  initialText: string;
  variables: Variable[];
}

function DocumentEditor({ id, title, description, icon: Icon, initialText, variables }: TemplateProps) {
  const { salvarConfiguracoes } = useConfigStore();
  const [vars, setVars] = useState<Record<string, string>>({});
  const [text, setText] = useState(initialText);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Atualizar o texto se o initialText mudar (vinda da store)
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    await salvarConfiguracoes({ [id]: text });
    setIsSavingTemplate(false);
  };

  const getPreview = () => {
    let preview = text;
    variables.forEach(v => {
      let val = vars[v.id] || "____";
      if (v.type === 'choice') {
        const isSim = vars[v.id] === 'Sim';
        const isNao = vars[v.id] === 'Não';
        val = `${isSim ? '[X]' : '[ ]'} Sim  ${isNao ? '[X]' : '[ ]'} Não`;
      }
      preview = preview.replaceAll(v.id, val);
    });
    return preview;
  };

  const previewTexto = getPreview();

  const handleWhatsApp = () => {
    const formatted = encodeURIComponent(previewTexto);
    window.open(`https://wa.me/?text=${formatted}`, '_blank');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - ${vars['NOME_COMPLETO'] || vars['NOME_CLIENTE'] || ''}</title>
            <style>
              body { 
                font-family: 'Inter', -apple-system, sans-serif; 
                padding: 40px; 
                line-height: 1.4; 
                color: #000;
                background: #fff;
                font-size: 11pt;
              }
              .content {
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              h1 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; font-size: 16pt; text-align: center; }
              @page { margin: 1.5cm; }
              .footer { margin-top: 30px; text-align: center; font-size: 8pt; color: #666; font-style: italic; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <h1>${title}</h1>
            <div class="content">${previewTexto}</div>
            <div class="footer">Documento gerado eletronicamente pelo Studio Paty Heinz</div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mb-12 no-print">
      <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Editor Area */}
          <div className="space-y-8 overflow-y-auto max-h-[800px] scrollbar-hide p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables.map(v => (
                <div key={v.id} className={v.type === 'choice' ? 'flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100' : (variables.length > 5 ? '' : 'md:col-span-2')}>
                  {v.type === 'choice' ? (
                    <>
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider transition-colors">
                        {v.label}
                      </span>
                      <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm shrink-0">
                        <button 
                          onClick={() => setVars({...vars, [v.id]: 'Sim'})}
                          className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${vars[v.id] === 'Sim' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >SIM</button>
                        <button 
                          onClick={() => setVars({...vars, [v.id]: 'Não'})}
                          className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${vars[v.id] === 'Não' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >NÃO</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1 block tracking-widest">
                        {v.label}
                      </label>
                      <input 
                        type="text" 
                        placeholder={v.placeholder || "..."}
                        value={vars[v.id] || ""} 
                        onChange={e => setVars({ ...vars, [v.id]: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/30 text-sm font-medium focus:border-primary outline-none transition-all" 
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    Texto Base (Modelo Oficial)
                  </label>
                  
                  <button 
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-primary transition-all bg-gray-50 hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"
                    title="Salvar alterações como padrão para sempre"
                  >
                    {isSavingTemplate ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    SALVAR MODELO OFICIAL
                  </button>
                </div>
                
                <textarea 
                  value={text} 
                  onChange={e => setText(e.target.value)} 
                  className="w-full h-64 p-5 rounded-[24px] border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:border-primary outline-none transition-all leading-relaxed shadow-inner"
                ></textarea>
              </div>
            </div>

          {/* Preview Area */}
          <div className="flex flex-col h-full sticky top-0">
            <div className="bg-gray-900 rounded-[32px] p-6 md:p-8 flex flex-col h-[600px] lg:h-full shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-all duration-1000"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">Preview para Impressão</span>
                <div className="flex gap-1">
                  <Printer size={12} className="text-gray-600" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-[24px] p-6 md:p-8 text-gray-200 text-xs md:text-sm whitespace-pre-wrap flex-1 overflow-y-auto font-medium leading-relaxed border border-white/10 relative z-10 scrollbar-hide">
                {previewTexto}
              </div>
              
              <div className="flex flex-col gap-3 mt-6">
                <button 
                  onClick={handlePrint}
                  className="w-full bg-black hover:bg-gray-800 text-white font-black py-4.5 rounded-[20px] shadow-xl transition-all flex items-center justify-center gap-3 relative z-10 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Printer size={16} />
                  </div>
                  GERAR IMPRESSÃO
                </button>

                <button 
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-black py-4.5 rounded-[20px] shadow-xl transition-all flex items-center justify-center gap-3 relative z-10 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Send size={14} className="ml-0.5" />
                  </div>
                  ENVIAR PELO WHATSAPP
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ContratoPage() {
  const { 
    carregarConfiguracao, 
    templateComprovante, 
    templateCompromisso, 
    templateAnamnese, 
    templateMenores 
  } = useConfigStore();

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
          Personalização de Documentos
        </h2>
        <p className="text-lg text-gray-500 font-medium leading-relaxed">
          Edite os modelos oficiais do estúdio. O que você alterar aqui será usado automaticamente no agendamento e nas mensagens de WhatsApp.
        </p>
      </div>

      <div className="space-y-16">
        
        {/* 1. Comprovante de Agendamento */}
        <DocumentEditor 
          id="templateComprovante"
          title="Comprovante de Agendamento"
          description="Enviado logo após marcar um horário. Contém endereço e dados da sessão."
          icon={CalendarClock}
          initialText={templateComprovante}
          variables={[
            { id: "NOME_CLIENTE", label: "Nome do Cliente", placeholder: "Ex: João Silva" },
            { id: "SERVICO_PROCEDIMENTO", label: "Procedimento", placeholder: "Ex: Manicure em gel" },
            { id: "DURACAO_SESSION", label: "Duração", placeholder: "Ex: 02h 30min" },
            { id: "VALOR_TOTAL", label: "Valor", placeholder: "Ex: 500,00" },
          ]}
        />

        {/* 2. Compromisso Geral */}
        <DocumentEditor 
          id="templateCompromisso"
          title="Compromisso de Sessão"
          description="Termos básicos de agendamento, retoque e cancelamento."
          icon={ShieldCheck}
          initialText={templateCompromisso}
          variables={[
            { id: "NOME_CLIENTE", label: "Nome do Cliente", placeholder: "Ex: João Silva" },
            { id: "SERVICO_PROCEDIMENTO", label: "Procedimento", placeholder: "Ex: Design de unhas" },
            { id: "VALOR_SERVICO", label: "Valor", placeholder: "Ex: R$ 500,00" },
          ]}
        />

        {/* 3. Autorização de Menores */}
        <DocumentEditor 
          id="templateMenores"
          title="Autorização de Menores"
          description="Autorização do responsável para procedimentos em clientes menores de idade."
          icon={UserCheck}
          initialText={templateMenores}
          variables={[
            { id: "NOME_RESPONSAVEL", label: "Nome do Responsável" },
            { id: "NASC_RESPONSAVEL", label: "Nascimento do Responsável" },
            { id: "IDADE_RESPONSAVEL", label: "Idade do Responsável" },
            { id: "ESTADO_CIVIL_RESPONSAVEL", label: "Estado Civil" },
            { id: "RG_RESPONSAVEL", label: "RG do Responsável" },
            { id: "TEL_RESPONSAVEL", label: "Telefone" },
            { id: "NOME_FILHO", label: "Nome do Menor" },
            { id: "NASC_FILHO", label: "Nascimento do Menor" },
            { id: "RG_FILHO", label: "RG do Menor" },
            { id: "CIDADE_UF_FILHO", label: "Cidade/UF do Menor" },
            { id: "DESENHO", label: "Descrição do Desenho" },
            { id: "DATA_ATUAL", label: "Data de Hoje" },
          ]}
        />

        {/* 4. Ficha de Anamnese */}
        <DocumentEditor 
          id="templateAnamnese"
          title="Ficha de Anamnese"
          description="Histórico de saúde completo e termo de responsabilidade."
          icon={FileText}
          initialText={templateAnamnese}
          variables={[
            {id: "NOME_COMPLETO", label: "Nome Completo" },
            { id: "RG_ANAM", label: "RG" },
            { id: "CPF_ANAM", label: "CPF" },
            { id: "NASC_ANAM", label: "Nascimento" },
            { id: "CONHECEU_ANAM", label: "Como conheceu" },
            { id: "WHATS_ANAM", label: "WhatsApp" },
            
            // Checks
            { id: "FUMANTE_CHECK", label: "Fumante?", type: 'choice' },
            { id: "ALERGIA_CHECK", label: "Alergia?", type: 'choice' },
            { id: "GRAVIDA_CHECK", label: "Grávida?", type: 'choice' },
            { id: "MENSTR_CHECK", label: "Menstruada?", type: 'choice' },
            { id: "HERPES_CHECK", label: "Possui herpes?", type: 'choice' },
            { id: "QUELOIDE_CHECK", label: "Quelóide?", type: 'choice' },
            { id: "DIABETES_CHECK", label: "Diabetes?", type: 'choice' },
            { id: "EPILEPSIA_CHECK", label: "Epilepsia?", type: 'choice' },
            { id: "CICATRIZA_CHECK", label: "Cicatriza mal?", type: 'choice' },
            { id: "ANEMIA_CHECK", label: "Anemia?", type: 'choice' },
            { id: "HEMOFILIA_CHECK", label: "Hemofilia?", type: 'choice' },
            { id: "DESMAIO_CHECK", label: "Desmaio?", type: 'choice' },
            { id: "VITILIGO_CHECK", label: "Vitiligo?", type: 'choice' },
            { id: "HIV_CHECK", label: "Portador de HIV?", type: 'choice' },
            { id: "MARCAPASSO_CHECK", label: "Marcapasso?", type: 'choice' },
            { id: "HEPATITE_CHECK", label: "Hepatite?", type: 'choice' },
            { id: "HIPERTENSAO_CHECK", label: "Hipertensão?", type: 'choice' },
            { id: "AUTOIMUNE_CHECK", label: "Doença auto-imune?", type: 'choice' },
            { id: "ALIM_CHECK", label: "Alimentou-se?", type: 'choice' },
            { id: "DROGAS_CHECK", label: "Drogas/Álcool?", type: 'choice' },
            { id: "BRONZE_CHECK", label: "Pele bronzeada?", type: 'choice' },
            { id: "CARDIACO_CHECK", label: "Problema cardíaco?", type: 'choice' },
            { id: "CANCER_CHECK", label: "Algum câncer?", type: 'choice' },
            { id: "PELE_CHECK", label: "Problema de pele?", type: 'choice' },
            { id: "MEDIC_CHECK", label: "Uso diário medic.?", type: 'choice' },
            { id: "TRATAM_CHECK", label: "Tratamento médico?", type: 'choice' },
            { id: "TRANSM_CHECK", label: "D. Transmissíveis?", type: 'choice' },
            { id: "OUTRO_CHECK", label: "Outro problema?", type: 'choice' },

            { id: "DATA_ATUAL_ANAM_ID", label: "Data de Hoje" },
            { id: "AREA_PROCEDIMENTO", label: "Área do procedimento" },
            { id: "TIPO_PROCEDIMENTO", label: "Tipo de procedimento" },
            { id: "OBS_PRO", label: "Observações" },
            { id: "PRO_PRO", label: "Profissional" },
            { id: "VALOR_PRO", label: "Valor" },
          ]}
        />

      </div>
    </div>
  );
}
