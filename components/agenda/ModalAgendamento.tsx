"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAgendaStore, Agendamento } from "@/store/useAgendaStore";
import { useServicosStore } from "@/store/useServicosStore";
import { useClientesStore } from "@/store/useClientesStore";
import { useConfigStore } from "@/store/useConfigStore";
import { UserPlus, Check, Camera, X, Loader2, Image as ImageIcon, RotateCw, Send, CalendarCheck, ShieldCheck } from "lucide-react";
import { ModalCliente } from "@/components/clientes/ModalCliente";
import { createClient } from "@/lib/supabase";
import { format as formatDate } from "date-fns";

interface ModalAgendamentoProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Agendamento | null;
}

export function ModalAgendamento({ isOpen, onClose, initialData }: ModalAgendamentoProps) {
  const { agendamentos, addAgendamento, updateAgendamento } = useAgendaStore();
  const { servicos } = useServicosStore();
  const { clientes, addCliente } = useClientesStore();
  const { 
    carregarConfiguracao, 
    templateComprovante, 
    templateCompromisso 
  } = useConfigStore();
  
  // States - Tudo opcional
  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [duracao, setDuracao] = useState("01:00");
  const [valorTotal, setValorTotal] = useState("");
  const [valorSinal, setValorSinal] = useState("");
  const [metodoSinal, setMetodoSinal] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [cor, setCor] = useState("bg-primary");
  const [imagens, setImagens] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [showClientes, setShowClientes] = useState(false);
  const [showServicos, setShowServicos] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // States de Repetição
  const [repetir, setRepetir] = useState(false);
  const [frequencia, setFrequencia] = useState<'diario' | 'semanal' | 'mensal' | 'anual'>('semanal');
  const [repeticoes, setRepeticoes] = useState(1);

  useEffect(() => {
    if (initialData && isOpen) {
      setClienteNome(initialData.clienteNome);
      setTelefone(initialData.telefone || "");
      setServico(initialData.servico);
      setValorTotal(initialData.valorTotal.toString());
      setValorSinal(initialData.valorSinal.toString());
      setCor(initialData.cor || "bg-primary");
      
      const imgs = initialData.imagens || [];
      if (initialData.imagem && !imgs.includes(initialData.imagem)) {
        setImagens([initialData.imagem, ...imgs]);
      } else {
        setImagens(imgs);
      }
      
      // Extrai data e hora diretamente da string sem conversão de fuso
      const [data, horaRaw] = initialData.dataInicio.split('T');
      setDataInicio(data);
      const horaLimpa = horaRaw ? horaRaw.substring(0, 5) : '';
      if (horaLimpa) setHoraInicio(horaLimpa);

      // Calcula duração a partir das partes da string (sem new Date() que converte timezone)
      const [hIni, mIni] = (initialData.dataInicio.split('T')[1] || '00:00').split(':').map(Number);
      const [hFim, mFim] = (initialData.dataFim.split('T')[1] || '00:00').split(':').map(Number);
      let totalMinsInicio = hIni * 60 + mIni;
      let totalMinsFim = hFim * 60 + mFim;
      // Se o fim for no dia seguinte, adiciona 24h
      if (totalMinsFim < totalMinsInicio) totalMinsFim += 24 * 60;
      const diffMins = totalMinsFim - totalMinsInicio;
      const diffHrs = Math.floor(diffMins / 60);
      const diffRestMins = diffMins % 60;
      setDuracao(`${String(diffHrs).padStart(2, '0')}:${String(diffRestMins).padStart(2, '0')}`);
      
    } else if (isOpen) {
      setClienteNome(""); setTelefone(""); setServico("");
      setDataInicio(""); setHoraInicio(""); setDuracao("01:00");
      setValorTotal(""); setValorSinal("");
      setCor("bg-primary");
      setImagens([]);
      setRepetir(false);
      setRepeticoes(1);
      setIsSuccess(false);
    }

    if (isOpen) {
      carregarConfiguracao();
    }
  }, [initialData, isOpen, carregarConfiguracao]);

  const handleSave = async () => {
    // Monta string de data/hora diretamente (sem new Date() para evitar conversão de fuso)
    const hoje = formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    const dateTimeInicio = dataInicio && horaInicio ? `${dataInicio}T${horaInicio}:00` : hoje;
    
    // Calcula fim somando a duração puramente aritmética (sem new Date() que converte timezone)
    let dateTimeFim = dateTimeInicio;
    if (dataInicio && horaInicio && duracao) {
       const [dHours, dMins] = duracao.split(':').map(Number);
       const [baseDate, baseTimeRaw] = dateTimeInicio.split('T');
       const [bH, bM, bS] = baseTimeRaw.split(':').map(Number);
       const totalMins = bH * 60 + bM + dHours * 60 + dMins;
       const fimH = Math.floor(totalMins / 60) % 24;
       const fimM = totalMins % 60;
       // Se passar da meia-noite, avança o dia
       const diasExtra = Math.floor((bH * 60 + bM + dHours * 60 + dMins) / (24 * 60));
       let fimDate = baseDate;
       if (diasExtra > 0) {
         const d = new Date(`${baseDate}T00:00:00`);
         d.setDate(d.getDate() + diasExtra);
         fimDate = formatDate(d, 'yyyy-MM-dd');
       }
       dateTimeFim = `${fimDate}T${String(fimH).padStart(2,'0')}:${String(fimM).padStart(2,'0')}:${String(bS || 0).padStart(2,'0')}`;
    }
    
    const nomeFinal = clienteNome || "Cliente Avulso";
    const telefoneFinal = telefone || "";

    // -- VALIDAÇÃO DE CONFLITO --
    // IMPORTANTE: Usamos comparação direta de strings ISO (sem new Date()) para evitar
    // conversão de fuso horário. Strings no formato "YYYY-MM-DDThh:mm:ss" são comparáveis
    // lexicograficamente, o que garante ordem correta sem offset de UTC.
    const checkConflict = (startStr: string, endStr: string) => {
      return agendamentos.find(a => {
        // Ignorar se estivermos editando o próprio agendamento
        if (initialData && a.id === initialData.id) return false;
        // Ignorar cancelados
        if (a.status === 'cancelado') return false;

        // Normaliza para o mesmo formato (remove possível sufixo Z ou +00:00)
        const startEx = a.dataInicio.substring(0, 19);
        const endEx = a.dataFim.substring(0, 19);
        const startNew = startStr.substring(0, 19);
        const endNew = endStr.substring(0, 19);
        
        // Lógica de Sobreposição: (Inicio1 < Fim2) && (Fim1 > Inicio2)
        return (startNew < endEx) && (endNew > startEx);
      });
    };

    // Testar conflitos antes de começar a salvar
    // totalAdicionar = 1 agendamento original + N repetições extras
    const totalAdicionar = !initialData && repetir ? repeticoes + 1 : 1;
    const seriesData: {s: string, e: string}[] = [];

    // Helper: desloca uma data ISO (yyyy-MM-dd) por N dias, semanas, meses ou anos
    // sem usar Date objects para o offset principal (evita conversão de fuso horário)
    const offsetDateStr = (dateStr: string, n: number, freq: 'diario' | 'semanal' | 'mensal' | 'anual'): string => {
      const [yyyy, mm, dd] = dateStr.split('-').map(Number);
      if (freq === 'diario') {
        const d = new Date(yyyy, mm - 1, dd + n);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      } else if (freq === 'semanal') {
        const d = new Date(yyyy, mm - 1, dd + n * 7);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      } else if (freq === 'anual') {
        const newYear = yyyy + n;
        // Corrige 29/fev em anos não-bissextos
        const maxDay = new Date(newYear, mm, 0).getDate();
        const newDay = Math.min(dd, maxDay);
        return `${newYear}-${String(mm).padStart(2,'0')}-${String(newDay).padStart(2,'0')}`;
      } else {
        // mensal: incrementa mês, corrige overflow de dia (ex: 31/jan + 1 mês = 28/fev)
        const totalMonths = (mm - 1) + n;
        const newYear = yyyy + Math.floor(totalMonths / 12);
        const newMonth = totalMonths % 12; // 0-indexed month (0=jan, 11=dec)
        const maxDay = new Date(newYear, newMonth + 1, 0).getDate();
        const newDay = Math.min(dd, maxDay);
        return `${newYear}-${String(newMonth + 1).padStart(2,'0')}-${String(newDay).padStart(2,'0')}`;
      }
    };

    for (let i = 0; i < totalAdicionar; i++) {
        let s = dateTimeInicio;
        let e = dateTimeFim;
        if (i > 0) {
            const [startDate, startTime] = dateTimeInicio.split('T');
            const [endDate, endTime] = dateTimeFim.split('T');
            s = `${offsetDateStr(startDate, i, frequencia)}T${startTime}`;
            e = `${offsetDateStr(endDate, i, frequencia)}T${endTime}`;
        }
        
        const conflito = checkConflict(s, e);
        if (conflito) {
            const [sDate, sTime] = s.split('T');
            const [sy, sm, sd] = sDate.split('-');
            const dataFormatada = `${sd}/${sm} às ${sTime.substring(0,5)}`;
            const prosseguir = confirm(`CONFLITO DE HORÁRIO!\n\nNo dia ${dataFormatada} já existe um agendamento para "${conflito.clienteNome}".\n\nVocê realmente deseja agendar este horário assim mesmo?`);
            if (!prosseguir) return;
        }
        seriesData.push({ s, e });
    }

    // Cadastro Inteligente: só cria cliente em NOVO agendamento (não em edições)
    if (!initialData && clienteNome && clienteNome.trim() !== "" && clienteNome.trim() !== "Cliente Avulso") {
       const nomeNormalizado = clienteNome.trim().toLowerCase();
       const clientExists = clientes.some(c => c.nome.trim().toLowerCase() === nomeNormalizado);
       if (!clientExists) {
          addCliente({
            nome: clienteNome.trim(),
            telefone: telefoneFinal,
            notas: "Cadastrado automaticamente via agendamento.",
            ultimaVisita: new Date().toISOString()
          });
       }
    }

    setIsSaving(true);
    try {
      if (initialData) {
        await updateAgendamento(initialData.id, {
          clienteNome: nomeFinal,
          telefone: telefoneFinal,
          servico: servico || "Procedimento de Beleza",
          dataInicio: seriesData[0].s,
          dataFim: seriesData[0].e,
          valorTotal: Number(valorTotal) || 0,
          valorSinal: Number(valorSinal) || 0,
          metodoSinal,
          cor,
          imagens,
          imagem: imagens[0] || null
        });
      } else {
        for (let i = 0; i < seriesData.length; i++) {
          await addAgendamento({
            clienteNome: nomeFinal,
            telefone: telefoneFinal,
            servico: servico || "Procedimento de Beleza",
            dataInicio: seriesData[i].s,
            dataFim: seriesData[i].e,
            imagens,
            imagem: imagens[0] || null,
            valorTotal: Number(valorTotal) || 0,
            valorSinal: i === 0 ? (Number(valorSinal) || 0) : 0,
            status: "agendado",
            metodoSinal,
            cor
          });
        }
      }
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar agendamento. Verifique se rodou o comando SQL para adicionar a coluna 'imagem' na tabela 'agendamentos'.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Converter para WebP no navegador
      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Falha na conversão WebP"));
              }, 'image/webp', 0.8);
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      // 2. Upload para Supabase Storage
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sessão expirada");
      const fileName = `${userData.user.id}/${Date.now()}-${file.name.split('.')[0]}.webp`;
      const { data, error } = await supabase.storage
        .from('agendamentos')
        .upload(fileName, webpBlob, {
          contentType: 'image/webp'
        });

      if (error) throw error;

      // 3. Pegar URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('agendamentos')
        .getPublicUrl(fileName);

      setImagens(prev => [...prev, publicUrl]);
    } catch (err) {
      console.error("Erro no upload:", err);
      alert("Falha ao subir imagem. Verifique se criou o bucket 'agendamentos' no Supabase.");
    } finally {
      setIsUploading(false);
    }
  };

  // Monta a mensagem completa substituindo as variáveis dos templates
  const buildFullMsg = () => {
    let msgComprovante = templateComprovante;
    let msgCompromisso = templateCompromisso;

    // Formata data e hora para exibição amigável (ex: 15/04/2025 às 14:30)
    const dataFormatada = dataInicio
      ? dataInicio.split('-').reverse().join('/')
      : '—';
    const horaFormatada = horaInicio || '—';
    const duracaoFormatada = duracao
      ? duracao.replace(':', 'h') + 'min'
      : '—';
    const sinalFormatado = valorSinal && Number(valorSinal) > 0
      ? `R$ ${Number(valorSinal).toFixed(2)}`
      : 'Sem sinal';
    const totalFormatado = valorTotal ? `R$ ${Number(valorTotal).toFixed(2)}` : 'R$ 0,00';

    const substituir = (tpl: string) =>
      tpl
        .replaceAll('NOME_CLIENTE', clienteNome || 'Cliente')
        .replaceAll('SERVICO_PROCEDIMENTO', servico || 'Procedimento de Beleza')
        .replaceAll('DURACAO_SESSION', duracaoFormatada)
        .replaceAll('VALOR_TOTAL', totalFormatado)
        .replaceAll('VALOR_SERVICO', totalFormatado)
        .replaceAll('VALOR_SINAL', sinalFormatado)
        .replaceAll('DATA_SESSAO', dataFormatada)
        .replaceAll('HORA_SESSAO', horaFormatada)
        .replaceAll('METODO_SINAL', metodoSinal || 'Pix');

    return `${substituir(msgComprovante)}\n\n${substituir(msgCompromisso)}`;
  };

  // Formata o número para wa.me: remove tudo que não é dígito e
  // adiciona DDI 55 (Brasil) automaticamente se o número tiver 10 ou 11 dígitos
  const formatWhatsappNumber = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    // Já tem DDI (13 dígitos com 55 + DDD + número, ou 12 sem o 9)
    if (digits.length >= 12) return digits;
    // 10 dígitos (sem 9) ou 11 dígitos (com 9): adiciona DDI Brasil
    return `55${digits}`;
  };

  const handleSendAll = () => {
    const fullMsg = buildFullMsg();
    const encodedMsg = encodeURIComponent(fullMsg);
    const num = formatWhatsappNumber(telefone || '');
    window.open(`https://wa.me/${num}?text=${encodedMsg}`, '_blank');
  };

  const handleCopyMsg = async () => {
    const fullMsg = buildFullMsg();
    try {
      await navigator.clipboard.writeText(fullMsg);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback para navegadores sem Clipboard API
      const ta = document.createElement('textarea');
      ta.value = fullMsg;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Agendamento" : "Novo Agendamento"}>
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in-95 duration-300">
           <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100 animate-bounce">
              <CalendarCheck size={48} />
           </div>
           
           <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">
             {initialData ? "Alteração Salva!" : "Agendamento Confirmado!"}
           </h3>
           <p className="text-gray-500 mb-10 max-w-xs font-medium">
             As informações para <strong>{clienteNome || 'o cliente'}</strong> foram {initialData ? "atualizadas" : "reservadas"} com sucesso no calendário.
           </p>

           <div className="w-full space-y-3">
              <button 
                onClick={handleSendAll} 
                className="w-full bg-[#25D366] text-white font-black py-5 rounded-[22px] shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
              >
                <Send size={20} />
                Enviar pelo WhatsApp 🚀
              </button>

              <button
                onClick={handleCopyMsg}
                className={`w-full font-black py-4 rounded-[22px] border-2 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${
                  isCopied
                    ? 'bg-primary/10 border-primary text-primary scale-[1.01]'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary active:scale-95'
                }`}
              >
                {isCopied ? (
                  <><ShieldCheck size={20} /> Mensagem Copiada! ✓</>
                ) : (
                  <><Send size={20} className="rotate-[-45deg]" /> Copiar Mensagem</>
                )}
              </button>
              
              <button 
                onClick={onClose}
                className="w-full bg-gray-50 text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all text-sm uppercase tracking-widest"
              >
                Fechar e Voltar
              </button>
           </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            
            {/* Cliente & Serviço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Cliente</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={clienteNome} 
                    onChange={e => {
                       setClienteNome(e.target.value);
                       setShowClientes(e.target.value.length > 0);
                    }} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" 
                    placeholder="Buscar ou novo" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsClientModalOpen(true)}
                    className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition shrink-0"
                    title="Novo Cliente"
                  >
                    <UserPlus size={20} />
                  </button>
                </div>

                {/* Sugestões de Clientes */}
                {showClientes && (
                   <div className="absolute z-[60] left-0 right-14 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {clientes
                        .filter(c => c.nome.toLowerCase().includes(clienteNome.toLowerCase()))
                        .map(c => (
                           <button
                             key={c.id}
                             onClick={() => {
                                setClienteNome(c.nome);
                                setTelefone(c.telefone);
                                setShowClientes(false);
                             }}
                             className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0"
                           >
                              <span className="font-bold text-gray-800">{c.nome}</span>
                              <span className="text-xs text-gray-400">{c.telefone}</span>
                           </button>
                        ))
                      }
                      {clientes.filter(c => c.nome.toLowerCase().includes(clienteNome.toLowerCase())).length === 0 && (
                         <div className="px-4 py-3 text-xs text-gray-400 italic">Nenhum cliente encontrado.</div>
                      )}
                   </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Whatsapp</label>
                <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" placeholder="(00) 00000-0000" />
              </div>
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Serviço</label>
                <input 
                  type="text"
                  value={servico} 
                  onChange={e => {
                    setServico(e.target.value);
                    setShowServicos(e.target.value.length >= 0);
                    
                    // Auto-preencher valor se o que foi digitado bater EXATAMENTE com um serviço
                    const offSrv = servicos.find(s => s.nome.toLowerCase() === e.target.value.toLowerCase());
                    if (offSrv) setValorTotal(offSrv.valorBase.toString());
                  }} 
                  onFocus={() => setShowServicos(true)}
                  onBlur={() => {
                    // Pequeno delay para permitir o clique na sugestão antes de fechar
                    setTimeout(() => setShowServicos(false), 200);
                  }}
                  placeholder="Digite ou selecione um serviço..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                />
                
                {/* Sugestões de Serviços */}
                {showServicos && (
                  <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {servicos
                      .filter(s => s.nome.toLowerCase().includes(servico.toLowerCase()))
                      .map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setServico(s.nome);
                            setValorTotal(s.valorBase.toString());
                            setShowServicos(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                        >
                          <span className="font-bold text-gray-800">{s.nome}</span>
                          <span className="text-xs font-black text-primary">R$ {s.valorBase}</span>
                        </button>
                      ))
                    }
                    <div className="px-4 py-3 text-[10px] text-gray-400 bg-gray-50/50 italic border-t border-gray-50">
                      Dica: Você pode digitar qualquer nome personalizado acima.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Data e Hora */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white appearance-none min-w-0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Início</label>
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white appearance-none min-w-0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duração</label>
                <select 
                  value={duracao} 
                  onChange={e => setDuracao(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white appearance-none min-w-0"
                >
                  <option value="00:30">30 min</option>
                  <option value="01:00">1 hora</option>
                  <option value="02:00">2 horas</option>
                  <option value="03:00">3 horas</option>
                  <option value="04:00">4 horas</option>
                  <option value="05:00">5 horas</option>
                  <option value="06:00">6 horas</option>
                  <option value="07:00">7 horas</option>
                  <option value="08:00">8 horas</option>
                  <option value="09:00">9 horas</option>
                  <option value="10:00">10 horas</option>
                  <option value="12:00">12 horas</option>
                  <option value="15:00">15 horas</option>
                  <option value="18:00">18 horas</option>
                  <option value="24:00">24 horas</option>
                </select>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Total (R$)</label>
                <input type="number" value={valorTotal} onChange={e => setValorTotal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-medium text-primary" placeholder="0,00" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do Sinal (R$)</label>
                  <input type="number" value={valorSinal} onChange={e => setValorSinal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 font-medium text-green-600" placeholder="0,00" />
                </div>
                
                {Number(valorSinal) > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Forma de Pagamento do Sinal</label>
                    <div className="flex gap-2">
                      {['Pix', 'Dinheiro', 'Cartão'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMetodoSinal(m as any)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold transition ${metodoSinal === m ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400">O sinal entra logo como receita.</p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Upload de Referência / Imagem */}
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-2">Referências / Imagens do Projeto</label>
               
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                 {imagens.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100 shadow-sm">
                       <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                       <button 
                        onClick={() => setImagens(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"
                       >
                          <X size={14} />
                       </button>
                    </div>
                 ))}

                 {/* Botão de Upload Sempre Disponível */}
                 <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 hover:border-primary/30 transition cursor-pointer relative overflow-hidden">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-1 p-2 text-center">
                        <Loader2 size={24} className="text-primary animate-spin" />
                        <span className="text-[10px] font-bold text-gray-400">Convertendo...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Camera size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">Adicionar</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                 </label>
               </div>
               
               <p className="text-[10px] text-gray-300">Você pode enviar várias imagens. Elas serão convertidas automaticamente para WebP.</p>
            </div>

            <hr className="border-gray-100" />
            
            {/* Repetição */}
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <RotateCw size={16} />
                     </div>
                     <span className="text-sm font-bold text-gray-700">Repetir Agendamento</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={repetir} onChange={e => setRepetir(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
               </div>
               
               {repetir && (
                 <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                   <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Frequência</label>
                      <select 
                        value={frequencia} 
                        onChange={e => setFrequencia(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 outline-none focus:border-primary"
                      >
                        <option value="diario">Diário</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Quantas vezes repetir</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={50}
                        value={repeticoes} 
                        onChange={e => setRepeticoes(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 outline-none focus:border-primary"
                      />
                   </div>
                   <p className="col-span-2 text-[10px] text-gray-400 ml-1">Serão criados {repeticoes + 1} agendamentos no total (todo {frequencia === 'mensal' ? 'm\u00eas' : frequencia === 'semanal' ? 'semana' : frequencia === 'anual' ? 'ano' : 'dia'}, no mesmo dia e hor\u00e1rio).</p>
                 </div>
               )}
            </div>

            <hr className="border-gray-100" />

            {/* Cores */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Classificação de Cor</label>
              <div className="flex flex-wrap gap-3">
                {[
                  "bg-primary", 
                  "bg-white",
                  "bg-red-500", 
                  "bg-yellow-400", 
                  "bg-orange-500", 
                  "bg-blue-300", 
                  "bg-blue-600", 
                  "bg-blue-900",
                  "bg-green-500",
                  "bg-purple-500"
                ].map(c => (
                  <button 
                    key={c} 
                    onClick={() => setCor(c)} 
                    className={`w-10 h-10 rounded-full ${c} ${c === 'bg-white' ? 'border border-gray-200' : ''} ${cor === c ? 'ring-4 ring-offset-2 ring-primary/30 border-2 border-white' : 'opacity-80 hover:opacity-100 hover:scale-110'} transition flex items-center justify-center text-white`} 
                    type="button"
                    title={c}
                  >
                    {cor === c && <Check size={20} strokeWidth={3} className={c === 'bg-white' ? 'text-gray-400' : ''} />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Personalize a etiqueta desse serviço pra bater o olho fácil no calendário.</p>
            </div>

          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={onClose} disabled={isSaving} className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || isUploading}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-primary/20 hover:opacity-90 transition flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{initialData ? "Atualizar" : "Agendar"}</span>
              )}
            </button>
          </div>
        </>
      )}
      <ModalCliente isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />
    </Modal>
  );
}
