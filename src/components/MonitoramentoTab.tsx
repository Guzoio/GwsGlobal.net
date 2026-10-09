import React, { useState, useMemo } from 'react';
import {
  Radio,
  Eye,
  RefreshCw,
  Settings,
  Bell,
  BellOff,
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageSquare,
  Building2,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
  Inbox,
  Volume2,
  VolumeX,
  Trash2,
  Bot,
  Copy,
  Check,
  Zap,
  X,
} from 'lucide-react';
import { BllConfig, MensagemBll, PregaoMonitoradoBll, Licitacao } from '../types';
import { formatarMoeda } from '../utils/numberToWordsPtBr';
import { tocarAlertaConvocacao } from '../utils/bllService';

interface MonitoramentoTabProps {
  bllConfig: BllConfig;
  pregoes: PregaoMonitoradoBll[];
  mensagens: MensagemBll[];
  licitacoesCrm: Licitacao[];
  onAbrirConfigBll: () => void;
  onSincronizarAgora: () => Promise<void> | void;
  onMarcarMensagemLida: (id: string) => void;
  onExcluirMensagem?: (id: string) => Promise<void> | void;
  onLimparTodasMensagens?: () => Promise<void> | void;
  onSelecionarLicitacaoCrm?: (id: number) => void;
  carregando?: boolean;
}

export const MonitoramentoTab: React.FC<MonitoramentoTabProps> = ({
  bllConfig,
  pregoes,
  mensagens,
  licitacoesCrm,
  onAbrirConfigBll,
  onSincronizarAgora,
  onMarcarMensagemLida,
  onExcluirMensagem,
  onLimparTodasMensagens,
  onSelecionarLicitacaoCrm,
  carregando = false,
}) => {
  const [abaInterna, setAbaInterna] = useState<'mensagens' | 'pregoes'>('mensagens');
  const [busca, setBusca] = useState<string>('');
  const [filtroTipoMsg, setFiltroTipoMsg] = useState<string>('todos');
  const [filtroSituacaoPregao, setFiltroSituacaoPregao] = useState<string>('todos');
  const [somAtivo, setSomAtivo] = useState<boolean>(() => bllConfig.notificarSom !== false);
  const [pregaoSelecionadoFiltro, setPregaoSelecionadoFiltro] = useState<string | null>(null);

  // Estados do Modal do Conector Automático de Pregões BLL (Estilo Lance Fácil)
  const [modalConectorAberto, setModalConectorAberto] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [testandoRecebimento, setTestandoRecebimento] = useState<boolean>(false);
  const [feedbackTeste, setFeedbackTeste] = useState<string>('');

  // Contagem de métricas
  const totalNaoLidas = useMemo(() => {
    return mensagens.filter(m => !m.lida).length;
  }, [mensagens]);

  const totalConvocacoesUrgentes = useMemo(() => {
    return mensagens.filter(m => m.tipo === 'convocacao' && !m.lida).length;
  }, [mensagens]);

  const totalPregoesAtivos = useMemo(() => {
    return pregoes.filter(p => p.situacao !== 'homologado' && p.situacao !== 'suspenso').length;
  }, [pregoes]);

  const totalVencendo = useMemo(() => {
    return pregoes.filter(p => p.nossaParticipacao?.status === 'vencedor' || p.nossaParticipacao?.posicaoAtual === 1).length;
  }, [pregoes]);

  // Mensagens filtradas
  const mensagensFiltradas = useMemo(() => {
    return mensagens.filter(msg => {
      const matchBusca =
        !busca ||
        msg.orgao.toLowerCase().includes(busca.toLowerCase()) ||
        msg.numPregao.toLowerCase().includes(busca.toLowerCase()) ||
        msg.texto.toLowerCase().includes(busca.toLowerCase()) ||
        msg.remetente.toLowerCase().includes(busca.toLowerCase());

      const matchTipo =
        filtroTipoMsg === 'todos' ||
        (filtroTipoMsg === 'nao_lidas' && !msg.lida) ||
        msg.tipo === filtroTipoMsg;

      const matchPregao =
        !pregaoSelecionadoFiltro || msg.pregaoId === pregaoSelecionadoFiltro;

      return matchBusca && matchTipo && matchPregao;
    });
  }, [mensagens, busca, filtroTipoMsg, pregaoSelecionadoFiltro]);

  // Pregões filtrados
  const pregoesFiltrados = useMemo(() => {
    return pregoes.filter(p => {
      const matchBusca =
        !busca ||
        p.orgao.toLowerCase().includes(busca.toLowerCase()) ||
        p.numPregao.toLowerCase().includes(busca.toLowerCase()) ||
        p.objeto.toLowerCase().includes(busca.toLowerCase());

      const matchSituacao =
        filtroSituacaoPregao === 'todos' ||
        p.situacao === filtroSituacaoPregao;

      return matchBusca && matchSituacao;
    });
  }, [pregoes, busca, filtroSituacaoPregao]);

  // Mensagens urgentes em destaque (convocações não lidas)
  const convocacoesDestaque = useMemo(() => {
    return mensagens.filter(m => m.tipo === 'convocacao' && !m.lida);
  }, [mensagens]);

  const alternarSom = () => {
    const novo = !somAtivo;
    setSomAtivo(novo);
    if (novo) {
      tocarAlertaConvocacao();
    }
  };

  const getBadgeTipoMsg = (tipo: MensagemBll['tipo']) => {
    switch (tipo) {
      case 'convocacao':
        return {
          label: '🔴 Convocação de Proposta / Anexos',
          classes: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      case 'diligencia':
        return {
          label: '🟡 Diligência / Esclarecimento',
          classes: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'abertura':
        return {
          label: '⚡ Abertura de Fase / Lances',
          classes: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        };
      case 'homologacao':
        return {
          label: '🟢 Homologação / Adjudicado',
          classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'suspensao':
        return {
          label: '⏸️ Suspensão / Adiamento',
          classes: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        };
      default:
        return {
          label: '💬 Mensagem do Pregoeiro',
          classes: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
    }
  };

  const getBadgeSituacaoPregao = (sit: PregaoMonitoradoBll['situacao']) => {
    switch (sit) {
      case 'convocacao_aberta':
        return {
          label: '⚠️ Convocação Aberta',
          classes: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse',
        };
      case 'em_disputa':
        return {
          label: '⚡ Em Disputa de Lances',
          classes: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        };
      case 'julgamento':
        return {
          label: '⚖️ Julgamento de Propostas',
          classes: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
        };
      case 'habilitacao':
        return {
          label: '🔍 Fase de Habilitação',
          classes: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        };
      case 'homologado':
        return {
          label: '✓ Homologado / Concluído',
          classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        };
      case 'suspenso':
        return {
          label: '⏸️ Sessão Suspensa',
          classes: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        };
      default:
        return {
          label: 'Aguardando Abertura',
          classes: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Status e Controle do Radar BLL */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25 shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Central de Monitoramento BLL Compras
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                  Radar em Tempo Real
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                Acompanhamento contínuo de pregões, mensagens do pregoeiro, convocações de anexos e prazos oficiais.
              </p>
            </div>
          </div>

          {/* Controles de Ação Direta */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Status da Conexão */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                bllConfig.statusConexao === 'conectado'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : bllConfig.statusConexao === 'erro'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  bllConfig.statusConexao === 'conectado'
                    ? 'bg-emerald-500 animate-ping'
                    : bllConfig.statusConexao === 'erro'
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="truncate">
                {bllConfig.statusConexao === 'conectado'
                  ? 'Conectado ao BLL'
                  : bllConfig.statusConexao === 'erro'
                  ? 'Conexão BLL: Erro'
                  : 'BLL Não Configurado'}
              </span>
            </div>

            {/* Botão de Alerta Sonoro */}
            <button
              type="button"
              onClick={alternarSom}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                somAtivo
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={somAtivo ? 'Alertas sonoros ativados (Bip de convocação)' : 'Alertas sonoros desativados'}
            >
              {somAtivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Botão de Sincronizar Agora */}
            <button
              type="button"
              onClick={onSincronizarAgora}
              disabled={carregando}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Verificar novas mensagens e status no BLL Compras agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${carregando ? 'animate-spin' : ''}`} />
              <span>{carregando ? 'Checando...' : 'Verificar Agora'}</span>
            </button>

            {/* Botão Conector Robô BLL (Estilo Lance Fácil) */}
            <button
              type="button"
              onClick={() => setModalConectorAberto(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Conectar automação web para capturar o chat do pregão no BLL em tempo real"
            >
              <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Conectar ao Pregão Aberto</span>
            </button>

            {/* Botão Configurações BLL */}
            <button
              type="button"
              onClick={onAbrirConfigBll}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Acesso BLL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Destaque Urgente: Convocações Abertas com Prazo em Andamento */}
      {convocacoesDestaque.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {convocacoesDestaque.map(conv => (
            <div
              key={conv.id}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50 dark:from-rose-950/40 dark:via-rose-950/30 dark:to-amber-950/30 border-2 border-rose-400 dark:border-rose-600/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      🚨 CONVOCAÇÃO URGENTE DE ANEXOS / PROPOSTA
                    </span>
                    {conv.prazoResposta && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {conv.prazoResposta}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {conv.orgao} • {conv.numPregao}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed max-w-3xl">
                    "{conv.texto}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => onMarcarMensagemLida(conv.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                >
                  ✓ Marcar como Ciente
                </button>
                <a
                  href="https://bllcompras.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>Acessar BLL Compras</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards de Métricas do Radar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pregões Monitorados */}
        <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Processos em Acompanhamento
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
              {totalPregoesAtivos}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {pregoes.length} processos encontrados no BLL
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Convocações & Prazos Abertos */}
        <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Convocações & Prazos
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
              {totalConvocacoesUrgentes}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalConvocacoesUrgentes > 0 ? 'Atenção ao envio de anexos!' : 'Nenhum prazo pendente'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Mensagens do Pregoeiro */}
        <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mensagens do Pregoeiro
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
              {mensagens.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalNaoLidas > 0 ? `${totalNaoLidas} nova(s) não lida(s)` : 'Todas as mensagens lidas'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Ganhando / Homologadas */}
        <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Liderando / Vencendo
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {totalVencendo}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              1º lugar na etapa de propostas
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Seleção de Aba (Mural de Mensagens vs Painel de Pregões) */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Seletor de Visão */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAbaInterna('mensagens')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                abaInterna === 'mensagens'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mural de Mensagens & Chat</span>
              {totalNaoLidas > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {totalNaoLidas}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAbaInterna('pregoes')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                abaInterna === 'pregoes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Painel de Pregões BLL ({pregoes.length})</span>
            </button>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar órgão, pregão, mensagem..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Filtros Contextuais */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>

          {abaInterna === 'mensagens' ? (
            <>
              <button
                type="button"
                onClick={() => setFiltroTipoMsg('todos')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroTipoMsg === 'todos'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todas ({mensagens.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipoMsg('nao_lidas')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroTipoMsg === 'nao_lidas'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Não Lidas ({totalNaoLidas})
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipoMsg('convocacao')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroTipoMsg === 'convocacao'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                🔴 Convocações ({mensagens.filter(m => m.tipo === 'convocacao').length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipoMsg('diligencia')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroTipoMsg === 'diligencia'
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                🟡 Diligências
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFiltroSituacaoPregao('todos')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroSituacaoPregao === 'todos'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todos ({pregoes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroSituacaoPregao('convocacao_aberta')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroSituacaoPregao === 'convocacao_aberta'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                ⚠️ Convocação Aberta
              </button>
              <button
                type="button"
                onClick={() => setFiltroSituacaoPregao('em_disputa')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroSituacaoPregao === 'em_disputa'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                ⚡ Em Disputa
              </button>
              <button
                type="button"
                onClick={() => setFiltroSituacaoPregao('homologado')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroSituacaoPregao === 'homologado'
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                ✓ Homologados
              </button>
            </>
          )}

          {pregaoSelecionadoFiltro && (
            <button
              type="button"
              onClick={() => setPregaoSelecionadoFiltro(null)}
              className="ml-auto text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Remover filtro de pregão específico
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: MURAL DE MENSAGENS E CHAT DO PREGOEIRO */}
      {abaInterna === 'mensagens' && (
        <div className="space-y-4">
          {mensagensFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Mural de Mensagens do BLL Compras
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Não há novos comunicados ou convocações no momento. As mensagens aparecerão aqui automaticamente conforme forem recebidas e transmitidas no portal BLL Compras (chat de pregões, convocações de anexos e avisos do pregoeiro).
                </p>
              </div>

              {/* Box orientativo sobre BLL Compras */}
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-left text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <span className="font-bold text-blue-950 dark:text-blue-200 block">
                      Monitoramento Ativo do BLL Compras
                    </span>
                    <p className="text-[11px] text-blue-900/90 dark:text-blue-300/90 leading-relaxed">
                      O sistema monitora os pregões e processos em andamento. Sempre que houver uma convocação urgente de proposta/anexos, pedidos de diligência ou mensagens enviadas pelo pregoeiro no chat da sessão, elas serão sincronizadas diretamente para este painel, disparando os alertas sonoros da equipe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={onSincronizarAgora}
                  disabled={carregando}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
                  <span>{carregando ? 'Checando...' : 'Verificar Agora'}</span>
                </button>
                <button
                  type="button"
                  onClick={onAbrirConfigBll}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configurar Integração BLL</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Barra de Ações Rápidas do Mural */}
              {onLimparTodasMensagens && mensagens.length > 0 && (
                <div className="flex items-center justify-between px-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Mostrando {mensagensFiltradas.length} comunicado(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Deseja realmente limpar todos os comunicados do mural de mensagens?')) {
                        onLimparTodasMensagens();
                      }
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Mural Completo</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3.5">
                {mensagensFiltradas.map(msg => {
                  const badge = getBadgeTipoMsg(msg.tipo);
                  return (
                    <div
                      key={msg.id}
                      className={`bg-white dark:bg-[#0A162B] border rounded-2xl p-5 transition-all shadow-xs hover:shadow-md space-y-3 ${
                        !msg.lida
                          ? 'border-blue-400/80 dark:border-blue-600/80 bg-blue-50/20 dark:bg-blue-950/20'
                          : 'border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.classes}`}>
                            {badge.label}
                          </span>
                          {!msg.lida && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                              NOVA
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {msg.orgao}
                          </span>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                            ({msg.numPregao})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{msg.dataHora}</span>
                        </div>
                      </div>

                      {/* Mensagem e Remetente */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {msg.remetente}:
                        </div>
                        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-sans leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 select-text">
                          {msg.texto}
                        </div>
                      </div>

                      {/* Ações da Mensagem */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="text-[11px] text-slate-400">
                          {msg.prazoResposta && (
                            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Prazo oficial: {msg.prazoResposta}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!msg.lida ? (
                            <button
                              type="button"
                              onClick={() => onMarcarMensagemLida(msg.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              ✓ Marcar como lida
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Lida
                            </span>
                          )}

                          <a
                            href="https://bllcompras.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900 transition-colors flex items-center gap-1"
                          >
                            <span>Abrir no BLL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          {onExcluirMensagem && (
                            <button
                              type="button"
                              onClick={() => onExcluirMensagem(msg.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Remover comunicado do mural"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: PAINEL DE PREGÕES MONITORADOS */}
      {abaInterna === 'pregoes' && (
        <div className="space-y-4">
          {pregoesFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-slate-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nenhum pregão correspondente encontrado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Tente ajustar a busca ou os filtros de situação.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pregoesFiltrados.map(pregao => {
                const badge = getBadgeSituacaoPregao(pregao.situacao);
                const vinculadoCrm = licitacoesCrm.find(l => l.id === pregao.licitacaoCrmId);

                return (
                  <div
                    key={pregao.id}
                    className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.classes}`}>
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {pregao.modalidade}
                          </span>
                          {pregao.totalMensagensNaoLidas > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                              {pregao.totalMensagensNaoLidas} mensagem(ns) nova(s)
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {pregao.orgao}
                        </h3>
                        <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {pregao.numPregao}
                        </div>
                      </div>

                      {/* Card de Status da Nossa Participação */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center gap-4 text-xs">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Nossa Posição
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                            {pregao.nossaParticipacao.posicaoAtual === 1 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                🥇 1º Lugar ({pregao.nossaParticipacao.itensVencendo} itens)
                              </span>
                            ) : (
                              <span>
                                {pregao.nossaParticipacao.posicaoAtual}º Lugar ({pregao.nossaParticipacao.itensParticipando} itens)
                              </span>
                            )}
                          </div>
                        </div>

                        {pregao.nossaParticipacao.valorTotalProposta && (
                          <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                              Valor da Proposta
                            </div>
                            <div className="font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                              {formatarMoeda(pregao.nossaParticipacao.valorTotalProposta)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Objeto */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {pregao.objeto}
                    </p>

                    {/* Ações e Links */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {vinculadoCrm && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Vinculada ao CRM
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPregaoSelecionadoFiltro(pregao.id);
                            setAbaInterna('mensagens');
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ver Mensagens deste Pregão</span>
                        </button>

                        {vinculadoCrm && onSelecionarLicitacaoCrm && (
                          <button
                            type="button"
                            onClick={() => onSelecionarLicitacaoCrm(vinculadoCrm.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Abrir Proposta no CRM</span>
                          </button>
                        )}

                        <a
                          href={pregao.linkPortalBll || 'https://bllcompras.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all flex items-center gap-1.5"
                        >
                          <span>Portal BLL</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal do Conector Automático de Pregões BLL */}
      {modalConectorAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0A162B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Conector em Tempo Real do BLL
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Estilo Lance Fácil
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Captura automática do chat do pregoeiro, convocações de anexos e lances ao vivo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConectorAberto(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Explicação de Arquitetura */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Como ferramentas como Lance Fácil e Effecti funcionam:
                </div>
                <p className="text-[11px] text-blue-900/90 dark:text-blue-300/90 leading-relaxed">
                  O portal BLL Compras não possui API pública e transmite as mensagens do pregoeiro através de uma conexão privada <strong>ASP.NET SignalR (WebSocket)</strong> para a aba onde o licitante está logado. Plataformas de automação operam <strong>dentro do próprio navegador do usuário</strong>, capturando esses pacotes no momento exato em que chegam na tela.
                </p>
              </div>

              {/* Método 1: Conector de 1-Clique (Favorito / Script) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Conector de 1-Clique para a Aba do BLL Compras
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    Mais Rápido e Seguro
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Sempre que você estiver na tela de um pregão no BLL Compras, execute este conector. Ele se acopla à sala e transmite tudo para este painel em tempo real:
                </p>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Botão de Copiar */}
                    <button
                      type="button"
                      onClick={() => {
                        const scriptCode = `javascript:(function(){if(window.__GWS_BLL_ACTIVE){alert('Monitor GWS já ativo!');return;}window.__GWS_BLL_ACTIVE=true;var u='${window.location.origin}/api/bll/mensagens';var b=document.createElement('div');b.innerHTML='<div style="position:fixed;bottom:20px;right:20px;z-index:999999;background:#0f172a;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-family:sans-serif;font-size:12px;border:1.5px solid #3b82f6;display:flex;align-items:center;gap:10px;"><span style="width:10px;height:10px;background:#10b981;border-radius:50%;display:inline-block;"></span><b>GWS Radar:</b> Monitorando Pregão BLL...</div>';document.body.appendChild(b);var s=new Set();function env(t,r){t=String(t||'').trim();if(!t||t.length<4||s.has(t))return;s.add(t);fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texto:t,remetente:r||'Pregoeiro Oficial',numPregao:document.title||'Pregão BLL',capturadoPor:'RoboNavegador'})}).catch(console.warn);}new MutationObserver(function(m){m.forEach(function(x){x.addedNodes.forEach(function(n){if(n.nodeType===1){var txt=n.innerText||n.textContent||'';if(txt&&(txt.includes('CONVOCA')||txt.includes('ANEXO')||txt.includes('Pregoeiro')||txt.includes('Proposta')||txt.includes('Diligência')||txt.includes('Aviso'))){env(txt);}}});});}).observe(document.body,{childList:true,subtree:true});console.log('GWS Monitor BLL Ativo');})();`;
                        navigator.clipboard.writeText(scriptCode);
                        setCopiado(true);
                        setTimeout(() => setCopiado(false), 3000);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiado ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiado ? 'Código Copiado!' : 'Copiar Script do Conector'}</span>
                    </button>

                    {/* Bookmarklet arrastável */}
                    <a
                      href={`javascript:(function(){if(window.__GWS_BLL_ACTIVE){alert('Monitor GWS já ativo!');return;}window.__GWS_BLL_ACTIVE=true;var u='${typeof window !== 'undefined' ? window.location.origin : ''}/api/bll/mensagens';var b=document.createElement('div');b.innerHTML='<div style="position:fixed;bottom:20px;right:20px;z-index:999999;background:#0f172a;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-family:sans-serif;font-size:12px;border:1.5px solid #3b82f6;display:flex;align-items:center;gap:10px;"><span style="width:10px;height:10px;background:#10b981;border-radius:50%;display:inline-block;"></span><b>GWS Radar:</b> Monitorando Pregão BLL...</div>';document.body.appendChild(b);var s=new Set();function env(t,r){t=String(t||'').trim();if(!t||t.length<4||s.has(t))return;s.add(t);fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texto:t,remetente:r||'Pregoeiro Oficial',numPregao:document.title||'Pregão BLL',capturadoPor:'RoboNavegador'})}).catch(console.warn);}new MutationObserver(function(m){m.forEach(function(x){x.addedNodes.forEach(function(n){if(n.nodeType===1){var txt=n.innerText||n.textContent||'';if(txt&&(txt.includes('CONVOCA')||txt.includes('ANEXO')||txt.includes('Pregoeiro')||txt.includes('Proposta')||txt.includes('Diligência')||txt.includes('Aviso'))){env(txt);}}});});}).observe(document.body,{childList:true,subtree:true});console.log('GWS Monitor BLL Ativo');})();`}
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Para usar como favorito: Arraste este botão diretamente para a sua barra de favoritos do navegador (Ctrl+Shift+B).');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-grab"
                      title="Arraste este botão para a sua Barra de Favoritos do navegador"
                    >
                      <span>⭐ Arrastar para Favoritos ("Radar BLL")</span>
                    </a>
                  </div>

                  <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
                    {`javascript:(function(){if(window.__GWS_BLL_ACTIVE){alert('Monitor GWS já ativo!');return;}window.__GWS_BLL_ACTIVE=true;var u='${typeof window !== 'undefined' ? window.location.origin : ''}/api/bll/mensagens';/* Monitora chat e envia ao GWS Licitações */...})();`}
                  </div>
                </div>

                <div className="space-y-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Como usar no seu pregão:</div>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Arraste o botão acima para sua barra de favoritos do Chrome (ou copie o script).</li>
                    <li>Na aba do <strong>BLL Compras</strong> onde o seu pregão está aberto, clique no favorito (ou cole no console F12).</li>
                    <li>Um aviso flutuante verde confirmará que o radar está ativo. Qualquer aviso do pregoeiro toca o alarme aqui instantaneamente!</li>
                  </ol>
                </div>
              </div>

              {/* Botão de Teste de Conexão e Alarme */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs block">
                    Testar Recepção em Tempo Real
                  </span>
                  <span className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 block">
                    Dispara uma mensagem de teste para verificar se o painel e o alerta sonoro recebem perfeitamente.
                  </span>
                  {feedbackTeste && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block pt-1">
                      {feedbackTeste}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={testandoRecebimento}
                  onClick={async () => {
                    setTestandoRecebimento(true);
                    setFeedbackTeste('Enviando sinal de teste...');
                    try {
                      const res = await fetch('/api/bll/mensagens', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          orgao: 'PREFEITURA MUNICIPAL (TESTE AO VIVO)',
                          numPregao: 'Pregão Eletrônico Nº 0001/2026',
                          remetente: 'Pregoeira Oficial',
                          texto: 'CONVOCAÇÃO DE ANEXO: Convocamos a empresa melhor classificada para o envio da proposta adequada ao último lance no prazo de 2 (duas) horas através da aba Anexos do sistema.',
                          tipo: 'convocacao',
                          prazoResposta: '2 horas',
                          capturadoPor: 'TesteConectorBLL',
                        }),
                      });
                      if (res.ok) {
                        tocarAlertaConvocacao();
                        setFeedbackTeste('✓ Alerta recebido com sucesso no mural!');
                      } else {
                        setFeedbackTeste('Falha ao registrar mensagem de teste.');
                      }
                    } catch {
                      setFeedbackTeste('Erro ao conectar ao servidor.');
                    } finally {
                      setTestandoRecebimento(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
                >
                  {testandoRecebimento ? 'Disparando...' : 'Testar Alerta Agora'}
                </button>
              </div>
            </div>

            {/* Rodapé Modal */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setModalConectorAberto(false);
                  onAbrirConfigBll();
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurar Cookie de Sessão Ativa</span>
              </button>

              <button
                type="button"
                onClick={() => setModalConectorAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

