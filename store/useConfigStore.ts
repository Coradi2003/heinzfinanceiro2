import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

interface ConfigStore {
  corHexa: string;
  bgHexa: string;
  
  // Templates de Documentos
  templateComprovante: string;
  templateCompromisso: string;
  templateAnamnese: string;
  templateMenores: string;

  carregarConfiguracao: () => Promise<void>;
  salvarConfiguracoes: (updates: Partial<ConfigStore>) => Promise<void>;
}

const DEFAULT_TEMPLATES = {
  templateComprovante: `🌸 *Studio Paty Heinz - CONFIRMAÇÃO*

Olá *NOME_CLIENTE*, sua sessão foi agendada!

📅 *Data:* DATA_SESSAO
🕐 *Horário:* HORA_SESSAO
✨ *Procedimento:* SERVICO_PROCEDIMENTO
⏳ *Duração estimada:* DURACAO_SESSION
💰 *Valor total:* VALOR_TOTAL
💵 *Sinal pago:* VALOR_SINAL (METODO_SINAL)
📍 *Local:* confirme o endereço com o Studio Paty Heinz

*Por favor, tente chegar 10 minutos antes.*`,

  templateCompromisso: `📝 *ORIENTAÇÕES E COMPROMISSO*

1. Para remarcar, avise com pelo menos 24 horas de antecedência.
2. Em caso de falta sem aviso prévio de 24h, o valor do SINAL será perdido.
3. Se o studio necessitar cancelar, seu sinal poderá ser devolvido integralmente.

*Nos vemos na sua sessão!* 🤘✨`,

  templateAnamnese: `FICHA DE ANAMNESE E SAÚDE

DADOS PESSOAIS
Nome completo: NOME_COMPLETO
RG: RG_ANAM CPF: CPF_ANAM Data de nasc.: NASC_ANAM
Como nos conheceu: CONHECEU_ANAM WhatsApp: WHATS_ANAM

HISTÓRICO DE SAÚDE
Fumante? FUMANTE_CHECK
Alérgia? ALERGIA_CHECK
Grávida? GRAVIDA_CHECK
Menstruada? MENSTR_CHECK
Possui herpes? HERPES_CHECK
Quelóide? QUELOIDE_CHECK
Diabetes? DIABETES_CHECK
Epilepsia? EPILEPSIA_CHECK
Cicatriza mal? CICATRIZA_CHECK
Anemia? ANEMIA_CHECK
Hemofilia? HEMOFILIA_CHECK
Desmaio? DESMAIO_CHECK
Vitiligo? VITILIGO_CHECK
Portador de HIV? HIV_CHECK
Marcapasso? MARCAPASSO_CHECK
Hepatite? HEPATITE_CHECK
Hipertensão? HIPERTENSAO_CHECK
Doença auto-imune? AUTOIMUNE_CHECK
Alimentou-se nas últimas 24h? ALIM_CHECK
Está sob efeito de drogas/álcool? DROGAS_CHECK
Está com a pele bronzeada? BRONZE_CHECK
Possui alguma doença cardíaca? CARDIACO_CHECK
Possui algum tipo de câncer? CANCER_CHECK
Problema de pele/cicatrização? PELE_CHECK
Medicamente faz uso diário? MEDIC_CHECK
Está em tratamento médico? TRATAM_CHECK
Possui doenças transmissíveis? TRANSM_CHECK
Possui algum problema de saúde não citado? OUTRO_CHECK

TERMO DE RESPONSABILIDADE
Declaro que as informações acima são verdadeiras, não cabendo à profissional quaisquer responsabilidades por declarações omitidas nesta avaliação. Declaro realizar o procedimento estético por livre vontade. Estou ciente de que o procedimento poderá ocasionar sensibilidade ou reações temporárias, sendo necessário seguir todos os cuidados recomendados. Autorizo o registro fotográfico do trabalho realizado, conforme minha opção de uso para divulgação. Estou ciente de que os resultados podem variar de acordo com características individuais e cuidados posteriores.

Assinatura do cliente: ______________________________________
Data: DATA_ATUAL_ANAM

PROFISSIONAL
Área do procedimento: AREA_PROCEDIMENTO Tipo: TIPO_PROCEDIMENTO
Obs.: OBS_PRO
Profissional: PRO_PRO
Valor: VALOR_PRO`,

  templateMenores: `TERMO DE AUTORIZAÇÃO PARA PROCEDIMENTO ESTÉTICO
STUDIO: PATY HEINZ

Eu, NOME_RESPONSAVEL, nascido em NASC_RESPONSAVEL, idade IDADE_RESPONSAVEL, estado civil ESTADO_CIVIL_RESPONSAVEL, RG RG_RESPONSAVEL, telefone TEL_RESPONSAVEL, autorizo a profissional do Studio Paty Heinz a realizar no(a) menor NOME_FILHO, nascido(a) em NASC_FILHO, de CIDADE_UF_FILHO, portador(a) do RG RG_FILHO, o procedimento DESENHO. Declaro que fui informado(a) sobre os cuidados, possíveis reações e contraindicações, assumindo a responsabilidade pelas informações prestadas.

Data: DATA_ATUAL

Ass. Da Profissional: ________________________________
Ass. Do Menor: ____________________________________
Ass. Do Responsável: ________________________________

* Favor reconhecer firma da assinatura do responsável.`
};

export const useConfigStore = create<ConfigStore>()((set) => ({
  corHexa: 'bg-[#C9797F]',
  bgHexa: '#FFF7F7',
  ...DEFAULT_TEMPLATES,
  
  carregarConfiguracao: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('configuracoes').select('*').eq('user_id', userData.user.id).single();
    if (data) {
      // Auto-migração: se o template salvo não tiver as novas variáveis (DATA_SESSAO, HORA_SESSAO),
      // usa o novo template padrão automaticamente — sem precisar editar nas configurações
      const templateComprovante =
        data.template_comprovante && data.template_comprovante.includes('SERVICO_PROCEDIMENTO')
          ? data.template_comprovante
          : DEFAULT_TEMPLATES.templateComprovante;

      set({ 
        corHexa: data.cor_hexa || 'bg-[#C9797F]',
        bgHexa: data.fundo_hexa || '#FFF7F7',
        templateComprovante,
        templateCompromisso: data.template_compromisso || DEFAULT_TEMPLATES.templateCompromisso,
        templateAnamnese: data.template_anamnese || DEFAULT_TEMPLATES.templateAnamnese,
        templateMenores: data.template_menores || DEFAULT_TEMPLATES.templateMenores,
      });
    }
  },

  salvarConfiguracoes: async (updates) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    try {
      // Atualiza localmente o que foi enviado
      set(updates);

      // Pega estado atualizado para o upsert
      const state = useConfigStore.getState();

      const { error } = await supabase.from('configuracoes').upsert({
        user_id: userData.user.id,
        cor_hexa: state.corHexa,
        fundo_hexa: state.bgHexa,
        template_comprovante: state.templateComprovante,
        template_compromisso: state.templateCompromisso,
        template_anamnese: state.templateAnamnese,
        template_menores: state.templateMenores,
      }, { onConflict: 'user_id' });
      
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
    }
  }
}));
