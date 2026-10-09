import { BllConfig, MensagemBll, PregaoMonitoradoBll } from '../types';

const BLL_CONFIG_STORAGE_KEY = 'gws_bll_config_v1';

export const BLL_CONFIG_PADRAO: BllConfig = {
  usuario: '',
  senhaMascarada: false,
  cnpj: '',
  metodoAutenticacao: 'emulacao_robo',
  cookieSessao: '',
  cookieMascarado: false,
  tokenApi: '',
  ambiente: 'producao',
  intervaloMinutos: 5,
  notificarSom: true,
  notificarUrgentes: true,
  statusConexao: 'desconectado',
  mensagemStatus: 'Aguardando configuração de acesso.',
};

/**
 * Obtém configuração do BLL armazenada localmente
 */
export function obterBllConfigLocal(): BllConfig {
  try {
    const data = localStorage.getItem(BLL_CONFIG_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...BLL_CONFIG_PADRAO, ...parsed };
    }
  } catch (err) {
    console.warn('Aviso ao ler BllConfig do storage:', err);
  }
  return { ...BLL_CONFIG_PADRAO };
}

/**
 * Salva configuração no cache local
 */
export function salvarBllConfigLocal(config: BllConfig): void {
  try {
    // Nunca persiste senha nem cookie sensível em plain-text no localStorage
    const segura = { ...config, senha: '', cookieSessao: '' };
    localStorage.setItem(BLL_CONFIG_STORAGE_KEY, JSON.stringify(segura));
  } catch (err) {
    console.warn('Aviso ao salvar BllConfig no storage:', err);
  }
}

/**
 * Carrega a configuração do BLL do servidor (onde as credenciais e status ficam protegidos)
 */
export async function carregarBllConfigServidor(): Promise<BllConfig> {
  try {
    const res = await fetch('/api/bll/config');
    if (res.ok) {
      const data = await res.json();
      const config: BllConfig = {
        ...BLL_CONFIG_PADRAO,
        ...data,
      };
      salvarBllConfigLocal(config);
      return config;
    }
  } catch (err) {
    console.warn('Aviso ao carregar config BLL do servidor:', err);
  }
  return obterBllConfigLocal();
}

/**
 * Salva a configuração no servidor de forma segura
 */
export async function salvarBllConfigServidor(config: BllConfig): Promise<{ sucesso: boolean; mensagem?: string }> {
  try {
    const res = await fetch('/api/bll/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const resp = await res.json();
      salvarBllConfigLocal(resp.config || config);
      return { sucesso: true };
    }
    const err = await res.json().catch(() => ({}));
    return { sucesso: false, mensagem: err?.erro || 'Erro ao salvar configuração no servidor.' };
  } catch (err: any) {
    salvarBllConfigLocal(config);
    return { sucesso: false, mensagem: err?.message || 'Erro de conexão com o servidor.' };
  }
}

/**
 * Executa o teste de conexão oficial contra o portal BLL Compras
 */
export async function testarConexaoBll(dadosParaTeste?: Partial<BllConfig>): Promise<{
  sucesso: boolean;
  status: 'conectado' | 'erro';
  mensagem: string;
  tempoRespostaMs?: number;
}> {
  try {
    const res = await fetch('/api/bll/testar-conexao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosParaTeste || {}),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        sucesso: Boolean(data.sucesso),
        status: data.sucesso ? 'conectado' : 'erro',
        mensagem: data.mensagem || 'Conexão testada com sucesso.',
        tempoRespostaMs: data.tempoRespostaMs,
      };
    }

    const err = await res.json().catch(() => ({}));
    return {
      sucesso: false,
      status: 'erro',
      mensagem: err?.mensagem || err?.erro || 'Falha ao conectar aos servidores do BLL Compras.',
    };
  } catch (err: any) {
    return {
      sucesso: false,
      status: 'erro',
      mensagem: `Não foi possível comunicar com o serviço de teste: ${err?.message}`,
    };
  }
}

/**
 * Obtém os processos e mensagens monitorados no BLL Compras
 */
export async function obterDadosMonitoramentoBll(): Promise<{
  pregoes: PregaoMonitoradoBll[];
  mensagens: MensagemBll[];
  ultimaChecagem: string;
  statusConexao: string;
}> {
  try {
    const res = await fetch('/api/bll/monitoramento');
    if (res.ok) {
      const data = await res.json();
      return {
        pregoes: data.pregoes || [],
        mensagens: data.mensagens || [],
        ultimaChecagem: data.ultimaChecagem || new Date().toISOString(),
        statusConexao: data.statusConexao || 'conectado',
      };
    }
  } catch (err) {
    console.warn('Aviso ao obter monitoramento BLL:', err);
  }

  return {
    pregoes: [],
    mensagens: [],
    ultimaChecagem: new Date().toISOString(),
    statusConexao: 'desconectado',
  };
}

/**
 * Marca uma mensagem do pregoeiro como lida
 */
export async function marcarMensagemLida(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bll/mensagens/${id}/lida`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Registra manualmente ou via importação uma mensagem do pregoeiro
 */
export async function adicionarMensagemBll(dados: {
  pregaoId?: string;
  numPregao?: string;
  orgao: string;
  remetente?: string;
  texto: string;
  tipo?: MensagemBll['tipo'];
  prazoResposta?: string;
}): Promise<MensagemBll | null> {
  try {
    const res = await fetch('/api/bll/mensagens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (res.ok) {
      const data = await res.json();
      return data.mensagem;
    }
  } catch (err) {
    console.error('Erro ao adicionar mensagem BLL:', err);
  }
  return null;
}

/**
 * Remove uma mensagem ou limpa todas ('todas')
 */
export async function excluirMensagemBll(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bll/mensagens/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Força uma verificação imediata de novas mensagens e status de pregões
 */
export async function sincronizarAgoraBll(): Promise<{
  novasMensagens: number;
  totalPregoes: number;
}> {
  try {
    const res = await fetch('/api/bll/sincronizar', {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao forçar sincronização BLL:', err);
  }
  return { novasMensagens: 0, totalPregoes: 0 };
}

/**
 * Emite alerta sonoro de convocação do pregoeiro usando Web Audio API sem arquivos externos
 */
export function tocarAlertaConvocacao(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const agora = ctx.currentTime;

    // Primeiro tom (sino agudo)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, agora); // Nota A5
    gain1.gain.setValueAtTime(0.3, agora);
    gain1.gain.exponentialRampToValueAtTime(0.001, agora + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(agora);
    osc1.stop(agora + 0.35);

    // Segundo tom (confirmação alegre e urgente)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, agora + 0.15); // Nota E6
    gain2.gain.setValueAtTime(0.35, agora + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, agora + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(agora + 0.15);
    osc2.stop(agora + 0.55);
  } catch (err) {
    console.warn('Alerta sonoro não disponível no navegador:', err);
  }
}
