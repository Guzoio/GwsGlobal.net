import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  FileText,
  Calendar,
  Building2,
  Truck,
  Edit2,
  Trash2,
  ChevronRight,
  ExternalLink,
  X,
  ArrowUpDown,
  Sparkles,
  LayoutGrid,
  List,
  Check,
  AlertCircle,
  TrendingUp,
  User,
} from 'lucide-react';
import { Cobranca, Licitacao, ContatoPrefeitura, TipoContagemDias, EventoInicioLiquidacao, EventoInicioPagamento } from '../types';
import {
  analisarCobranca,
  formatarDataPtBr,
  paraFormatoIsoData,
  diferencaEmDiasParaHoje,
} from '../utils/cobrancasCalculo';
import { formatarMoeda } from '../utils/numberToWordsPtBr';

interface CobrancasTabProps {
  cobrancas: Cobranca[];
  licitacoes: Licitacao[];
  contatos: ContatoPrefeitura[];
  responsaveis?: string[];
  onAdicionarResponsavel?: (nome: string) => void;
  cobrancaDestaqueId?: string | null;
  onSalvarCobranca: (cobranca: Cobranca) => Promise<void> | void;
  onExcluirCobranca: (cobrancaId: string) => Promise<void> | void;
  onLimparDestaque?: () => void;
}

export const CobrancasTab: React.FC<CobrancasTabProps> = ({
  cobrancas,
  licitacoes,
  contatos,
  responsaveis = ['Gustavo', 'Victor', 'Junto'],
  onAdicionarResponsavel,
  cobrancaDestaqueId,
  onSalvarCobranca,
  onExcluirCobranca,
  onLimparDestaque,
}) => {
  // Estados de interface
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'tabela'>('cards');
  const [modalAberto, setModalAberto] = useState(false);
  const [cobrancaEmEdicao, setCobrancaEmEdicao] = useState<Cobranca | null>(null);
  const [cobrancaParaExcluir, setCobrancaParaExcluir] = useState<Cobranca | null>(null);

  // Responsável pela cobrança
  const [formResponsavel, setFormResponsavel] = useState<string>(responsaveis[0] || 'Gustavo');
  const [isModoOutroResponsavel, setIsModoOutroResponsavel] = useState<boolean>(false);
  const [responsavelCustom, setResponsavelCustom] = useState<string>('');

  // Modais de ação rápida (Registrar Entrega, NF, Liquidação ou Pagamento com 1 clique)
  const [acaoRapida, setAcaoRapida] = useState<{
    tipo: 'entrega' | 'nota' | 'liquidacao' | 'pagamento';
    cobranca: Cobranca;
  } | null>(null);
  const [dataAcaoRapida, setDataAcaoRapida] = useState(paraFormatoIsoData(new Date()));
  const [numeroNotaRapido, setNumeroNotaRapido] = useState('');

  // Formulário de Cadastro / Edição
  const [formPrefeitura, setFormPrefeitura] = useState('');
  const [formProcesso, setFormProcesso] = useState('');
  const [formLicitacaoId, setFormLicitacaoId] = useState<number | undefined>(undefined);
  const [formOrdemFornecimento, setFormOrdemFornecimento] = useState('');
  const [formNumeroNota, setFormNumeroNota] = useState('');
  const [formProduto, setFormProduto] = useState('');
  const [formQuantidade, setFormQuantidade] = useState<number | ''>('');
  const [formValorNota, setFormValorNota] = useState<number | ''>('');
  const [formObservacoes, setFormObservacoes] = useState('');

  // Datas
  const [formDataEnvioProdutos, setFormDataEnvioProdutos] = useState('');
  const [formDataPrevisaoEntrega, setFormDataPrevisaoEntrega] = useState('');
  const [formDataRealEntrega, setFormDataRealEntrega] = useState('');
  const [formProdutoRecebido, setFormProdutoRecebido] = useState(false);

  const [formDataEnvioNota, setFormDataEnvioNota] = useState('');
  const [formNotaEnviada, setFormNotaEnviada] = useState(false);

  // Regras de Liquidação
  const [formDiasLiquidacao, setFormDiasLiquidacao] = useState<number>(7);
  const [formTipoDiasLiquidacao, setFormTipoDiasLiquidacao] = useState<TipoContagemDias>('uteis');
  const [formEventoInicioLiquidacao, setFormEventoInicioLiquidacao] = useState<EventoInicioLiquidacao>('entrega');
  const [formDataRealLiquidacao, setFormDataRealLiquidacao] = useState('');
  const [formLiquidado, setFormLiquidado] = useState(false);

  // Regras de Pagamento
  const [formDiasPagamento, setFormDiasPagamento] = useState<number>(5);
  const [formTipoDiasPagamento, setFormTipoDiasPagamento] = useState<TipoContagemDias>('corridos');
  const [formEventoInicioPagamento, setFormEventoInicioPagamento] = useState<EventoInicioPagamento>('liquidacao');
  const [formDataRealPagamento, setFormDataRealPagamento] = useState('');
  const [formPago, setFormPago] = useState(false);

  // Auto-rolagem para cobrança em destaque
  useEffect(() => {
    if (cobrancaDestaqueId) {
      const el = document.getElementById(`cobranca_card_${cobrancaDestaqueId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [cobrancaDestaqueId]);

  // Abre modal para nova cobrança
  const handleNovaCobranca = () => {
    setCobrancaEmEdicao(null);
    setFormPrefeitura('');
    setFormResponsavel(responsaveis[0] || 'Gustavo');
    setIsModoOutroResponsavel(false);
    setResponsavelCustom('');
    setFormProcesso('');
    setFormLicitacaoId(undefined);
    setFormOrdemFornecimento('');
    setFormNumeroNota('');
    setFormProduto('');
    setFormQuantidade('');
    setFormValorNota('');
    setFormObservacoes('');

    setFormDataEnvioProdutos(paraFormatoIsoData(new Date()));
    setFormDataPrevisaoEntrega('');
    setFormDataRealEntrega('');
    setFormProdutoRecebido(false);

    setFormDataEnvioNota('');
    setFormNotaEnviada(false);

    setFormDiasLiquidacao(7);
    setFormTipoDiasLiquidacao('uteis');
    setFormEventoInicioLiquidacao('entrega');
    setFormDataRealLiquidacao('');
    setFormLiquidado(false);

    setFormDiasPagamento(5);
    setFormTipoDiasPagamento('corridos');
    setFormEventoInicioPagamento('liquidacao');
    setFormDataRealPagamento('');
    setFormPago(false);

    setModalAberto(true);
  };

  // Abre modal para editar cobrança
  const handleEditarCobranca = (c: Cobranca) => {
    setCobrancaEmEdicao(c);
    setFormPrefeitura(c.prefeitura);
    setFormResponsavel(c.responsavel || responsaveis[0] || 'Gustavo');
    const ehOutro = Boolean(c.responsavel && !responsaveis.includes(c.responsavel));
    setIsModoOutroResponsavel(ehOutro);
    setResponsavelCustom(ehOutro ? c.responsavel || '' : '');
    setFormProcesso(c.processo || '');
    setFormLicitacaoId(c.licitacaoId);
    setFormOrdemFornecimento(c.ordemFornecimento || '');
    setFormNumeroNota(c.numeroNota || '');
    setFormProduto(c.produto);
    setFormQuantidade(c.quantidade ?? '');
    setFormValorNota(c.valorNota);
    setFormObservacoes(c.observacoes || '');

    setFormDataEnvioProdutos(c.dataEnvioProdutos || '');
    setFormDataPrevisaoEntrega(c.dataPrevisaoEntrega || '');
    setFormDataRealEntrega(c.dataRealEntrega || '');
    setFormProdutoRecebido(Boolean(c.produtoRecebido));

    setFormDataEnvioNota(c.dataEnvioNota || '');
    setFormNotaEnviada(Boolean(c.notaEnviada));

    setFormDiasLiquidacao(c.diasLiquidacao || 7);
    setFormTipoDiasLiquidacao(c.tipoDiasLiquidacao || 'uteis');
    setFormEventoInicioLiquidacao(c.eventoInicioLiquidacao || 'entrega');
    setFormDataRealLiquidacao(c.dataRealLiquidacao || '');
    setFormLiquidado(Boolean(c.liquidado));

    setFormDiasPagamento(c.diasPagamento || 5);
    setFormTipoDiasPagamento(c.tipoDiasPagamento || 'corridos');
    setFormEventoInicioPagamento(c.eventoInicioPagamento || 'liquidacao');
    setFormDataRealPagamento(c.dataRealPagamento || '');
    setFormPago(Boolean(c.pago));

    setModalAberto(true);
  };

  // Selecionar prefeitura/licitação pré-existente
  const handleVincularLicitacao = (licIdStr: string) => {
    if (!licIdStr) return;
    const lic = licitacoes.find(l => String(l.id) === licIdStr);
    if (lic) {
      setFormPrefeitura(lic.orgao);
      setFormProcesso(lic.processo_pregao);
      setFormLicitacaoId(lic.id);
      if (lic.responsavel) {
        setFormResponsavel(lic.responsavel);
        const ehOutro = !responsaveis.includes(lic.responsavel);
        setIsModoOutroResponsavel(ehOutro);
        if (ehOutro) setResponsavelCustom(lic.responsavel);
      }
    }
  };

  // Salvar formulário completo
  const handleSalvarForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrefeitura.trim() || !formProduto.trim()) return;

    let responsavelFinal = formResponsavel;
    if (isModoOutroResponsavel) {
      const nomeDigitado = responsavelCustom.trim();
      if (nomeDigitado) {
        responsavelFinal = nomeDigitado;
        if (onAdicionarResponsavel) {
          onAdicionarResponsavel(nomeDigitado);
        }
      }
    }

    const valor = typeof formValorNota === 'number' ? formValorNota : Number(formValorNota) || 0;
    const qtd = typeof formQuantidade === 'number' ? formQuantidade : Number(formQuantidade) || undefined;

    const novaCobranca: Cobranca = {
      id: cobrancaEmEdicao
        ? cobrancaEmEdicao.id
        : `cobranca_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      prefeitura: formPrefeitura.trim(),
      responsavel: responsavelFinal,
      processo: formProcesso.trim() || undefined,
      licitacaoId: formLicitacaoId,
      ordemFornecimento: formOrdemFornecimento.trim() || undefined,
      numeroNota: formNumeroNota.trim() || undefined,
      produto: formProduto.trim(),
      quantidade: qtd,
      valorNota: valor,
      observacoes: formObservacoes.trim() || undefined,

      dataEnvioProdutos: formDataEnvioProdutos || undefined,
      dataPrevisaoEntrega: formDataPrevisaoEntrega || undefined,
      dataRealEntrega: formDataRealEntrega || undefined,
      produtoRecebido: formProdutoRecebido || Boolean(formDataRealEntrega),

      dataEnvioNota: formDataEnvioNota || undefined,
      notaEnviada: formNotaEnviada || Boolean(formDataEnvioNota),

      diasLiquidacao: Number(formDiasLiquidacao) || 7,
      tipoDiasLiquidacao: formTipoDiasLiquidacao,
      eventoInicioLiquidacao: formEventoInicioLiquidacao,
      dataRealLiquidacao: formDataRealLiquidacao || undefined,
      liquidado: formLiquidado || Boolean(formDataRealLiquidacao),

      diasPagamento: Number(formDiasPagamento) || 5,
      tipoDiasPagamento: formTipoDiasPagamento,
      eventoInicioPagamento: formEventoInicioPagamento,
      dataRealPagamento: formDataRealPagamento || undefined,
      pago: formPago || Boolean(formDataRealPagamento),

      criadoEm: cobrancaEmEdicao ? cobrancaEmEdicao.criadoEm : new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    await onSalvarCobranca(novaCobranca);
    setModalAberto(false);
  };

  // Salvar Ação Rápida
  const handleSalvarAcaoRapida = async () => {
    if (!acaoRapida) return;
    const { tipo, cobranca } = acaoRapida;
    const atualizada: Cobranca = { ...cobranca };

    if (tipo === 'entrega') {
      atualizada.dataRealEntrega = dataAcaoRapida;
      atualizada.produtoRecebido = true;
    } else if (tipo === 'nota') {
      atualizada.dataEnvioNota = dataAcaoRapida;
      if (numeroNotaRapido.trim()) {
        atualizada.numeroNota = numeroNotaRapido.trim();
      }
      atualizada.notaEnviada = true;
    } else if (tipo === 'liquidacao') {
      atualizada.dataRealLiquidacao = dataAcaoRapida;
      atualizada.liquidado = true;
    } else if (tipo === 'pagamento') {
      atualizada.dataRealPagamento = dataAcaoRapida;
      atualizada.pago = true;
    }

    atualizada.atualizadoEm = new Date().toISOString();
    await onSalvarCobranca(atualizada);
    setAcaoRapida(null);
  };

  // Análise e filtragem de cobranças
  const cobrancasComAnalise = useMemo(() => {
    return cobrancas.map(c => ({
      cobranca: c,
      analise: analisarCobranca(c),
    }));
  }, [cobrancas]);

  // Cálculos de KPI Top Cards
  const kpis = useMemo(() => {
    let valorTotalReceber = 0;
    let valorTotalPago = 0;
    let totalAtrasadas = 0;
    let totalProximas = 0;
    let totalAguardandoLiq = 0;
    let totalAguardandoPag = 0;
    let totalConcluidas = 0;

    for (const item of cobrancasComAnalise) {
      const c = item.cobranca;
      const a = item.analise;

      if (c.pago) {
        valorTotalPago += c.valorNota || 0;
        totalConcluidas++;
      } else {
        valorTotalReceber += c.valorNota || 0;
        if (a.status === 'liquidacao_atrasada' || a.status === 'pagamento_atrasado') {
          totalAtrasadas++;
        } else if (a.status === 'proximo_vencimento') {
          totalProximas++;
        }

        if (a.status === 'aguardando_liquidacao') totalAguardandoLiq++;
        if (a.status === 'aguardando_pagamento') totalAguardandoPag++;
      }
    }

    return {
      valorTotalReceber,
      valorTotalPago,
      totalAtrasadas,
      totalProximas,
      totalAguardandoLiq,
      totalAguardandoPag,
      totalConcluidas,
      totalAtivas: cobrancas.length - totalConcluidas,
    };
  }, [cobrancasComAnalise, cobrancas.length]);

  // Filtragem da lista
  const listaFiltrada = useMemo(() => {
    return cobrancasComAnalise.filter(item => {
      const c = item.cobranca;
      const a = item.analise;

      // Filtro por status
      if (filtroStatus === 'atrasadas') {
        if (a.status !== 'liquidacao_atrasada' && a.status !== 'pagamento_atrasado') return false;
      } else if (filtroStatus === 'proximo') {
        if (a.status !== 'proximo_vencimento') return false;
      } else if (filtroStatus === 'entrega') {
        if (c.produtoRecebido || c.dataRealEntrega) return false;
      } else if (filtroStatus === 'liquidacao') {
        if (c.liquidado || !a.etapaLiquidacao.ativa) return false;
      } else if (filtroStatus === 'pagamento') {
        if (c.pago || !a.etapaPagamento.ativa) return false;
      } else if (filtroStatus === 'concluidas') {
        if (!c.pago) return false;
      }

      // Filtro por responsável (quem fez)
      if (filtroResponsavel !== 'todos') {
        const respCob = (c.responsavel || '').toLowerCase().trim();
        if (respCob !== filtroResponsavel.toLowerCase().trim()) return false;
      }

      // Filtro por texto
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        c.prefeitura.toLowerCase().includes(termo) ||
        c.produto.toLowerCase().includes(termo) ||
        (c.numeroNota && c.numeroNota.toLowerCase().includes(termo)) ||
        (c.processo && c.processo.toLowerCase().includes(termo)) ||
        (c.ordemFornecimento && c.ordemFornecimento.toLowerCase().includes(termo)) ||
        (c.responsavel && c.responsavel.toLowerCase().includes(termo))
      );
    });
  }, [cobrancasComAnalise, busca, filtroStatus, filtroResponsavel]);

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-150">
      {/* Topo Limpo com Ação Nova Cobrança */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Painel de Cobranças
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            {cobrancas.length} cadastradas
          </span>
        </div>

        <button
          type="button"
          onClick={handleNovaCobranca}
          className="px-4 py-2 rounded-md bg-[#0F2C59] hover:bg-[#163C78] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Cobrança</span>
        </button>
      </div>

      {/* KPI Cards / Indicadores Rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>A Receber</span>
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {formatarMoeda(kpis.valorTotalReceber)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {kpis.totalAtivas} cobrança(s) em andamento
          </div>
        </div>

        <div className="bg-rose-50/40 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold">
            <span>Atrasadas</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-1.5 font-mono tabular-nums">
            {kpis.totalAtrasadas}
          </div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            Liquidação ou pagamento atrasado
          </div>
        </div>

        <div className="bg-amber-50/40 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/60">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
            <span>Próximo do Vencimento</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono tabular-nums">
            {kpis.totalProximas}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            Vence hoje ou em até 3 dias
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span>Total Recebido / Pago</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono tabular-nums">
            {formatarMoeda(kpis.valorTotalPago)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {kpis.totalConcluidas} cobrança(s) concluída(s)
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white dark:bg-[#0F172A] rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Pesquisar prefeitura, produto, nota fiscal ou processo..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500 transition-colors"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Seletor de Quem Fez (Responsável) */}
        <div className="relative min-w-[160px]">
          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filtroResponsavel}
            onChange={e => setFiltroResponsavel(e.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500 cursor-pointer appearance-none"
            title="Filtrar por quem fez a cobrança"
          >
            <option value="todos">👤 Quem fez: Todos</option>
            {responsaveis.map(resp => (
              <option key={resp} value={resp}>👤 {resp}</option>
            ))}
          </select>
        </div>

        {/* Chips de Filtros Rápidos */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setFiltroStatus('todos')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filtroStatus === 'todos'
                ? 'bg-[#0F2C59] dark:bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Todas ({cobrancas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('atrasadas')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filtroStatus === 'atrasadas'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400'
            }`}
          >
            🔴 Atrasadas ({kpis.totalAtrasadas})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('liquidacao')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filtroStatus === 'liquidacao'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            ⏳ Liquidação
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('pagamento')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filtroStatus === 'pagamento'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            💰 Pagamento
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('concluidas')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filtroStatus === 'concluidas'
                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            ✅ Pagas ({kpis.totalConcluidas})
          </button>

          {/* Alternador de Modo de Exibição */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              type="button"
              onClick={() => setModoVisualizacao('cards')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                modoVisualizacao === 'cards'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Exibição em Cards Detalhados"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao('tabela')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                modoVisualizacao === 'tabela'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Exibição em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Cobranças */}
      {listaFiltrada.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] rounded-lg p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/40">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhuma cobrança encontrada
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {busca || filtroStatus !== 'todos'
              ? 'Tente remover ou alterar seus termos de pesquisa e filtros.'
              : 'Comece cadastrando sua primeira cobrança para acompanhar entregas, notas, liquidações e pagamentos automaticamente.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleNovaCobranca}
              className="px-4 py-2 rounded-md bg-[#0F2C59] hover:bg-[#163C78] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Nova Cobrança</span>
            </button>
          </div>
        </div>
      ) : modoVisualizacao === 'cards' ? (
        <div className="grid grid-cols-1 gap-4">
          {listaFiltrada.map(({ cobranca, analise }) => {
            const ehDestaque = cobrancaDestaqueId === cobranca.id;

            return (
              <div
                key={cobranca.id}
                id={`cobranca_card_${cobranca.id}`}
                className={`bg-white dark:bg-[#0F172A] rounded-lg border transition-colors p-4 sm:p-5 flex flex-col justify-between gap-4 ${
                  ehDestaque
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Topo do Card: Prefeitura + Valor + Badges + Ações */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {cobranca.prefeitura}
                        </h3>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${analise.statusCor}`}
                        >
                          {analise.statusIcone} {analise.statusRotulo}
                        </span>
                        {cobranca.responsavel && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                              cobranca.responsavel.toLowerCase().includes('gustavo')
                                ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                : cobranca.responsavel.toLowerCase().includes('victor')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                            }`}
                            title="Responsável pela cobrança"
                          >
                            <User className="w-3 h-3" />
                            <span>{cobranca.responsavel}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {cobranca.produto}
                        </span>
                        {cobranca.quantidade && (
                          <span>• Qtd: {cobranca.quantidade}</span>
                        )}
                        {cobranca.numeroNota && (
                          <span className="font-mono text-blue-600 dark:text-blue-400">
                            • NF: {cobranca.numeroNota}
                          </span>
                        )}
                        {cobranca.processo && (
                          <span>• Processo: {cobranca.processo}</span>
                        )}
                        {cobranca.ordemFornecimento && (
                          <span>• OF: {cobranca.ordemFornecimento}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Valor da Nota & Botões de Ação */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-slate-400 font-medium">
                        Valor da Cobrança
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                        {formatarMoeda(cobranca.valorNota)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-md border border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleEditarCobranca(cobranca)}
                        title="Editar cobrança"
                        className="p-1.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCobrancaParaExcluir(cobranca)}
                        title="Excluir cobrança"
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linha de Tempo Encadeada: As 4 Etapas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Etapa 1: Entrega dos Produtos */}
                  <div
                    className={`p-3 rounded-md border text-xs flex flex-col justify-between transition-colors ${
                      analise.etapaEntrega.concluida
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                        : analise.etapaEntrega.statusBadge === 'atrasado'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                        : analise.etapaEntrega.statusBadge === 'atencao'
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-blue-500" />
                          <span>1. Entrega</span>
                        </span>
                        {analise.etapaEntrega.concluida && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <p className="text-[11px] mt-1.5 leading-snug">
                        {analise.etapaEntrega.mensagem}
                      </p>
                      {cobranca.dataPrevisaoEntrega && !analise.etapaEntrega.concluida && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Previsão: {formatarDataPtBr(cobranca.dataPrevisaoEntrega)}
                        </div>
                      )}
                    </div>

                    {!analise.etapaEntrega.concluida && (
                      <div className="pt-2 mt-2 border-t border-slate-200/70 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setAcaoRapida({ tipo: 'entrega', cobranca });
                            setDataAcaoRapida(paraFormatoIsoData(new Date()));
                          }}
                          className="w-full py-1 px-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Marcar Entregue</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Etapa 2: Envio da Nota Fiscal */}
                  <div
                    className={`p-3 rounded-md border text-xs flex flex-col justify-between transition-colors ${
                      analise.etapaNota.concluida
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                        : analise.etapaNota.ativa
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>2. Nota Fiscal</span>
                        </span>
                        {analise.etapaNota.concluida && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <p className="text-[11px] mt-1.5 leading-snug">
                        {analise.etapaNota.mensagem}
                      </p>
                    </div>

                    {!analise.etapaNota.concluida && (
                      <div className="pt-2 mt-2 border-t border-slate-200/70 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setAcaoRapida({ tipo: 'nota', cobranca });
                            setDataAcaoRapida(paraFormatoIsoData(new Date()));
                            setNumeroNotaRapido(cobranca.numeroNota || '');
                          }}
                          className="w-full py-1 px-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Registrar Envio da NF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Etapa 3: Liquidação */}
                  <div
                    className={`p-3 rounded-md border text-xs flex flex-col justify-between transition-colors ${
                      analise.etapaLiquidacao.concluida
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                        : analise.etapaLiquidacao.statusBadge === 'atrasado'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                        : analise.etapaLiquidacao.statusBadge === 'atencao'
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          <span>3. Liquidação</span>
                        </span>
                        {analise.etapaLiquidacao.concluida && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        Regra: {cobranca.diasLiquidacao} dias {cobranca.tipoDiasLiquidacao} (a partir de {cobranca.eventoInicioLiquidacao === 'entrega' ? 'entrega' : 'envio nota'})
                      </div>
                      <p className="text-[11px] mt-1.5 font-medium leading-snug">
                        {analise.etapaLiquidacao.mensagem}
                      </p>
                    </div>

                    {!analise.etapaLiquidacao.concluida && (
                      <div className="pt-2 mt-2 border-t border-slate-200/70 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setAcaoRapida({ tipo: 'liquidacao', cobranca });
                            setDataAcaoRapida(paraFormatoIsoData(new Date()));
                          }}
                          className="w-full py-1 px-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Marcar como Liquidado</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Etapa 4: Pagamento */}
                  <div
                    className={`p-3 rounded-md border text-xs flex flex-col justify-between transition-colors ${
                      analise.etapaPagamento.concluida
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                        : analise.etapaPagamento.statusBadge === 'atrasado'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                        : analise.etapaPagamento.statusBadge === 'atencao'
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>4. Pagamento</span>
                        </span>
                        {analise.etapaPagamento.concluida && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        Regra: {cobranca.diasPagamento} dias {cobranca.tipoDiasPagamento} (a partir de {cobranca.eventoInicioPagamento})
                      </div>
                      <p className="text-[11px] mt-1.5 font-medium leading-snug">
                        {analise.etapaPagamento.mensagem}
                      </p>
                    </div>

                    {!analise.etapaPagamento.concluida && (
                      <div className="pt-2 mt-2 border-t border-slate-200/70 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setAcaoRapida({ tipo: 'pagamento', cobranca });
                            setDataAcaoRapida(paraFormatoIsoData(new Date()));
                          }}
                          className="w-full py-1 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Registrar Pagamento</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações da Cobrança se existirem */}
                {cobranca.observacoes && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800">
                    <strong>Obs:</strong> {cobranca.observacoes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Modo Tabela */
        <div className="bg-white dark:bg-[#0F172A] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Prefeitura & Produto</th>
                  <th className="py-3 px-4">Quem Fez</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Entrega</th>
                  <th className="py-3 px-4">Nota Fiscal</th>
                  <th className="py-3 px-4">Liquidação</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {listaFiltrada.map(({ cobranca, analise }) => (
                  <tr
                    key={cobranca.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {cobranca.prefeitura}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cobranca.produto}
                        {cobranca.numeroNota && ` • NF: ${cobranca.numeroNota}`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cobranca.responsavel ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                            cobranca.responsavel.toLowerCase().includes('gustavo')
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : cobranca.responsavel.toLowerCase().includes('victor')
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                          }`}
                        >
                          <User className="w-3 h-3" />
                          <span>{cobranca.responsavel}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${analise.statusCor}`}>
                        {analise.statusIcone} {analise.statusRotulo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {formatarMoeda(cobranca.valorNota)}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {cobranca.produtoRecebido || cobranca.dataRealEntrega ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {formatarDataPtBr(cobranca.dataRealEntrega)}
                        </span>
                      ) : cobranca.dataPrevisaoEntrega ? (
                        <span>Prev: {formatarDataPtBr(cobranca.dataPrevisaoEntrega)}</span>
                      ) : (
                        <span className="text-slate-400">Pendente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {cobranca.notaEnviada || cobranca.dataEnvioNota ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {formatarDataPtBr(cobranca.dataEnvioNota)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pendente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {cobranca.liquidado || cobranca.dataRealLiquidacao ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {formatarDataPtBr(cobranca.dataRealLiquidacao)}
                        </span>
                      ) : analise.etapaLiquidacao.dataLimite ? (
                        <span className={analise.etapaLiquidacao.statusBadge === 'atrasado' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          Limite: {formatarDataPtBr(analise.etapaLiquidacao.dataLimite)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {cobranca.pago || cobranca.dataRealPagamento ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {formatarDataPtBr(cobranca.dataRealPagamento)}
                        </span>
                      ) : analise.etapaPagamento.dataLimite ? (
                        <span className={analise.etapaPagamento.statusBadge === 'atrasado' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          Limite: {formatarDataPtBr(analise.etapaPagamento.dataLimite)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditarCobranca(cobranca)}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCobrancaParaExcluir(cobranca)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Ação Rápida (1 clique para confirmar entrega, nota, liquidação ou pagamento) */}
      {acaoRapida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white dark:bg-[#0F172A] rounded-lg border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {acaoRapida.tipo === 'entrega' && '📦 Registrar Entrega Realizada'}
                {acaoRapida.tipo === 'nota' && '🧾 Registrar Envio da Nota Fiscal'}
                {acaoRapida.tipo === 'liquidacao' && '✅ Registrar Liquidação da Nota'}
                {acaoRapida.tipo === 'pagamento' && '💰 Registrar Pagamento Realizado'}
              </h3>
              <button
                type="button"
                onClick={() => setAcaoRapida(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Prefeitura:{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {acaoRapida.cobranca.prefeitura}
              </strong>{' '}
              • Item: {acaoRapida.cobranca.produto}
            </div>

            {acaoRapida.tipo === 'nota' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número da Nota Fiscal
                </label>
                <input
                  type="text"
                  value={numeroNotaRapido}
                  onChange={e => setNumeroNotaRapido(e.target.value)}
                  placeholder="Ex: 12345"
                  className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {acaoRapida.tipo === 'entrega' && 'Data real da entrega:'}
                {acaoRapida.tipo === 'nota' && 'Data de envio da nota:'}
                {acaoRapida.tipo === 'liquidacao' && 'Data da liquidação realizada:'}
                {acaoRapida.tipo === 'pagamento' && 'Data do pagamento realizado:'}
              </label>
              <input
                type="date"
                value={dataAcaoRapida}
                onChange={e => setDataAcaoRapida(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                required
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAcaoRapida(null)}
                className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarAcaoRapida}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar e Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Cobrança */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white dark:bg-[#0F172A] rounded-lg border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0F172A] z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[#0F2C59] dark:text-blue-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {cobrancaEmEdicao ? 'Editar Cobrança' : 'Cadastrar Nova Cobrança'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Controle de fornecimento, entregas, liquidações e pagamentos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSalvarForm} className="p-4 sm:p-5 space-y-5">
              {/* Vínculo opcional com Licitação do CRM */}
              {licitacoes.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Preencher a partir de uma licitação do CRM (opcional):
                  </label>
                  <select
                    value={formLicitacaoId || ''}
                    onChange={e => handleVincularLicitacao(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                  >
                    <option value="">Selecione para preencher automaticamente...</option>
                    {licitacoes.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.orgao} — {l.processo_pregao}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Seção 1: Dados Principais */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#0F2C59] dark:text-blue-400" />
                  <span>Dados Principais</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0F2C59] dark:text-blue-400" />
                      <span>Quem Fez / Responsável pela Cobrança</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {responsaveis.map(resp => (
                        <button
                          key={resp}
                          type="button"
                          onClick={() => {
                            setFormResponsavel(resp);
                            setIsModoOutroResponsavel(false);
                          }}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                            !isModoOutroResponsavel && formResponsavel === resp
                              ? 'bg-[#0F2C59] dark:bg-blue-600 text-white border-[#0F2C59] dark:border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>👤 {resp}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setIsModoOutroResponsavel(true)}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors cursor-pointer ${
                          isModoOutroResponsavel
                            ? 'bg-[#0F2C59] dark:bg-blue-600 text-white border-[#0F2C59] dark:border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        + Outro...
                      </button>
                    </div>
                    {isModoOutroResponsavel && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={responsavelCustom}
                          onChange={e => setResponsavelCustom(e.target.value)}
                          placeholder="Digite o nome do novo responsável..."
                          className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Prefeitura / Órgão <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formPrefeitura}
                      onChange={e => setFormPrefeitura(e.target.value)}
                      placeholder="Ex: Prefeitura Municipal de Cerqueira César"
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Produto / Item Fornecido <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formProduto}
                      onChange={e => setFormProduto(e.target.value)}
                      placeholder="Ex: Pneu 175/70 R14, Cesta Básica, etc."
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor da Nota (R$) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formValorNota}
                      onChange={e => setFormValorNota(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0,00"
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={formQuantidade}
                      onChange={e => setFormQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 50"
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Número do Processo / Licitação
                    </label>
                    <input
                      type="text"
                      value={formProcesso}
                      onChange={e => setFormProcesso(e.target.value)}
                      placeholder="Ex: Pregão 045/2026"
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ordem de Fornecimento (OF), se houver
                    </label>
                    <input
                      type="text"
                      value={formOrdemFornecimento}
                      onChange={e => setFormOrdemFornecimento(e.target.value)}
                      placeholder="Ex: OF 2026/89"
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Número da Nota Fiscal
                    </label>
                    <input
                      type="text"
                      value={formNumeroNota}
                      onChange={e => setFormNumeroNota(e.target.value)}
                      placeholder="Ex: 12345"
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Datas de Envio e Entrega */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#0F2C59] dark:text-blue-400" />
                  <span>Envio e Entrega dos Produtos</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de envio dos produtos
                    </label>
                    <input
                      type="date"
                      value={formDataEnvioProdutos}
                      onChange={e => setFormDataEnvioProdutos(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1">
                      <span>📦 Data prevista para chegada</span>
                    </label>
                    <input
                      type="date"
                      value={formDataPrevisaoEntrega}
                      onChange={e => setFormDataPrevisaoEntrega(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 font-semibold"
                    />
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                      Gera alerta e aviso sonoro na data.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data real da entrega
                    </label>
                    <input
                      type="date"
                      value={formDataRealEntrega}
                      onChange={e => {
                        setFormDataRealEntrega(e.target.value);
                        if (e.target.value) setFormProdutoRecebido(true);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                    />
                    <label className="inline-flex items-center gap-2 mt-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formProdutoRecebido}
                        onChange={e => setFormProdutoRecebido(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:outline-hidden"
                      />
                      <span>✅ Produto recebido</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Seção 3: Envio da Nota Fiscal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Envio da Nota Fiscal</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de envio da nota fiscal
                    </label>
                    <input
                      type="date"
                      value={formDataEnvioNota}
                      onChange={e => {
                        setFormDataEnvioNota(e.target.value);
                        if (e.target.value) setFormNotaEnviada(true);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formNotaEnviada}
                        onChange={e => setFormNotaEnviada(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:outline-hidden"
                      />
                      <span>🧾 Nota fiscal enviada à prefeitura</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Seção 4: Regras de Liquidação */}
              <div className="space-y-3 bg-purple-50 dark:bg-purple-950/15 p-3.5 rounded-md border border-purple-200 dark:border-purple-900/40">
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Regras e Prazo para Liquidação</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantidade de dias
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formDiasLiquidacao}
                      onChange={e => setFormDiasLiquidacao(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-600 dark:focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de contagem
                    </label>
                    <select
                      value={formTipoDiasLiquidacao}
                      onChange={e => setFormTipoDiasLiquidacao(e.target.value as TipoContagemDias)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-600 dark:focus:border-purple-500"
                    >
                      <option value="uteis">Dias úteis</option>
                      <option value="corridos">Dias corridos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Início da contagem
                    </label>
                    <select
                      value={formEventoInicioLiquidacao}
                      onChange={e => setFormEventoInicioLiquidacao(e.target.value as EventoInicioLiquidacao)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-600 dark:focus:border-purple-500"
                    >
                      <option value="entrega">Data da entrega dos produtos</option>
                      <option value="envio_nota">Data de envio da nota fiscal</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-200 dark:border-purple-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data real da liquidação (quando realizada)
                    </label>
                    <input
                      type="date"
                      value={formDataRealLiquidacao}
                      onChange={e => {
                        setFormDataRealLiquidacao(e.target.value);
                        if (e.target.value) setFormLiquidado(true);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-600 dark:focus:border-purple-500"
                    />
                  </div>
                  <div className="pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formLiquidado}
                        onChange={e => setFormLiquidado(e.target.checked)}
                        className="rounded border-slate-300 text-purple-600 focus:outline-hidden"
                      />
                      <span>✅ Marcar como liquidado pela prefeitura</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Seção 5: Regras de Pagamento (Contagem Encadeada) */}
              <div className="space-y-3 bg-emerald-50 dark:bg-emerald-950/15 p-3.5 rounded-md border border-emerald-200 dark:border-emerald-900/40">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Regras e Prazo para Pagamento</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantidade de dias
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formDiasPagamento}
                      onChange={e => setFormDiasPagamento(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-600 dark:focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de contagem
                    </label>
                    <select
                      value={formTipoDiasPagamento}
                      onChange={e => setFormTipoDiasPagamento(e.target.value as TipoContagemDias)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-600 dark:focus:border-emerald-500"
                    >
                      <option value="corridos">Dias corridos</option>
                      <option value="uteis">Dias úteis</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Início da contagem
                    </label>
                    <select
                      value={formEventoInicioPagamento}
                      onChange={e => setFormEventoInicioPagamento(e.target.value as EventoInicioPagamento)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-600 dark:focus:border-emerald-500"
                    >
                      <option value="liquidacao">Data da liquidação realizada</option>
                      <option value="envio_nota">Data de envio da nota fiscal</option>
                      <option value="entrega">Data da entrega dos produtos</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data real do pagamento (quando pago)
                    </label>
                    <input
                      type="date"
                      value={formDataRealPagamento}
                      onChange={e => {
                        setFormDataRealPagamento(e.target.value);
                        if (e.target.value) setFormPago(true);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                  <div className="pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formPago}
                        onChange={e => setFormPago(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:outline-hidden"
                      />
                      <span>✅ Pagamento realizado / recebido na conta</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações e Contatos Internos
                </label>
                <textarea
                  rows={2}
                  value={formObservacoes}
                  onChange={e => setFormObservacoes(e.target.value)}
                  placeholder="Informações sobre empenho, setor responsável, ramal contábil, etc."
                  className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500 resize-none"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-[#0F2C59] hover:bg-[#163C78] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{cobrancaEmEdicao ? 'Salvar Alterações' : 'Cadastrar Cobrança'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {cobrancaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white dark:bg-[#0F172A] rounded-lg border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Excluir Cobrança?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir a cobrança de{' '}
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {cobrancaParaExcluir.prefeitura}
                  </strong>{' '}
                  referente a {cobrancaParaExcluir.produto} ({formatarMoeda(cobrancaParaExcluir.valorNota)})?
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCobrancaParaExcluir(null)}
                className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const idExcluir = cobrancaParaExcluir.id;
                  setCobrancaParaExcluir(null);
                  await onExcluirCobranca(idExcluir);
                }}
                className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
