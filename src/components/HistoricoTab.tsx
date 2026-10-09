import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  FileEdit,
  Building2,
  User,
  ChevronDown,
  AlertTriangle,
  X,
  PlusCircle,
  Users,
  Settings,
  Settings2,
  UserPlus,
  ArrowRightLeft,
  Image as ImageIcon,
  Target,
  CheckSquare,
  Layers,
  Calendar,
  Shield,
  Eye,
  Check,
  FileText,
  FileCheck,
  ScrollText,
  Calculator,
  TrendingUp,
  Percent,
  Receipt,
  DollarSign,
  Landmark,
  Coins,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig } from '../types';
import { formatarMoeda } from '../utils/numberToWordsPtBr';
import { obterPapelTimbradoConfig } from '../utils/storage';
import { ModalDeclaracaoUnificada } from './ModalDeclaracaoUnificada';

// Funções utilitárias para conversão e comparação de datas
function normalizarData(dataStr: string): string {
  if (!dataStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
    const [ano, mes, dia] = dataStr.slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr.slice(0, 10);
}

function dataParaInput(dataBr: string): string {
  if (!dataBr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dataBr)) {
    const [dia, mes, ano] = dataBr.split('/');
    return `${ano}-${mes}-${dia}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dataBr)) {
    return dataBr.slice(0, 10);
  }
  return '';
}

interface HistoricoTabProps {
  licitacoes: Licitacao[];
  itens: ItemLicitacao[];
  responsaveis: string[];
  timbradoConfig?: PapelTimbradoConfig;
  onAdicionarResponsavel: (nome: string) => boolean;
  onExcluirResponsavel: (nome: string, transferirPara?: string) => void;
  onAtualizarResponsavel: (id: number, novoResponsavel: string) => void;
  onExcluirLicitacao: (id: number) => void;
  onSelecionarLicitacao: (id: number) => void;
  onNovaLicitacao: () => void;
  onNavegarPara?: (aba: string) => void;
  onAbrirSeguranca?: () => void;
  onToggleAcompanhamento?: (id: number) => void;
  onToggleHomologada?: (id: number) => void;
  onAbrirCalculadora?: () => void;
  onAbrirDeclaracao?: (lic?: Licitacao) => void;
}

export const HistoricoTab: React.FC<HistoricoTabProps> = ({
  licitacoes,
  itens,
  responsaveis,
  timbradoConfig,
  onAdicionarResponsavel,
  onExcluirResponsavel,
  onAtualizarResponsavel,
  onExcluirLicitacao,
  onSelecionarLicitacao,
  onNovaLicitacao,
  onNavegarPara,
  onAbrirSeguranca,
  onToggleAcompanhamento,
  onToggleHomologada,
  onAbrirCalculadora,
  onAbrirDeclaracao,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('Todos');
  const [filtroData, setFiltroData] = useState<string>(''); // formato YYYY-MM-DD
  const [filtroAcompanhamento, setFiltroAcompanhamento] = useState<'todos' | 'acompanhar' | 'homologadas'>('todos');
  const [licitacaoParaExcluir, setLicitacaoParaExcluir] = useState<Licitacao | null>(null);

  // Modal de Declaração Unificada (Lei 14.133/2021)
  const [modalDeclaracaoAberto, setModalDeclaracaoAberto] = useState(false);
  const [licParaDeclaracao, setLicParaDeclaracao] = useState<Licitacao | null>(null);

  // Modal para Gerenciar/Excluir Responsáveis
  const [modalGerenciarAberto, setModalGerenciarAberto] = useState(false);
  const [novoNomeModal, setNovoNomeModal] = useState('');
  const [responsavelParaExcluir, setResponsavelParaExcluir] = useState<string | null>(null);
  const [destinoTransferencia, setDestinoTransferencia] = useState<string>('');

  // Lista unificada de responsáveis conhecidos (da config + das licitações existentes)
  const listaCompletaResponsaveis = useMemo(() => {
    const nomes = new Set(responsaveis.map(r => r.trim()).filter(Boolean));
    licitacoes.forEach(l => {
      if (l.responsavel && l.responsavel.trim()) {
        const rNome = l.responsavel.trim();
        const jaExiste = Array.from(nomes).some(n => n.toLowerCase() === rNome.toLowerCase());
        if (!jaExiste) {
          nomes.add(rNome);
        }
      }
    });
    return Array.from(nomes);
  }, [responsaveis, licitacoes]);

  // Filtragem de licitações: busca por texto + responsável + data de cadastro
  const licitacoesFiltradas = useMemo(() => {
    return licitacoes.filter(lic => {
      const matchTexto =
        lic.orgao.toLowerCase().includes(busca.toLowerCase()) ||
        lic.processo_pregao.toLowerCase().includes(busca.toLowerCase()) ||
        lic.modalidade.toLowerCase().includes(busca.toLowerCase());

      const respLic = (lic.responsavel || 'Gustavo').trim();
      const matchResponsavel =
        filtroResponsavel === 'Todos' ||
        respLic.toLowerCase() === filtroResponsavel.trim().toLowerCase();

      let matchData = true;
      if (filtroData) {
        const inputDaLic = dataParaInput(lic.data_cadastro);
        const brDaLic = normalizarData(lic.data_cadastro);
        const brDoFiltro = normalizarData(filtroData);
        matchData = inputDaLic === filtroData || brDaLic === brDoFiltro;
      }

      let matchAcompanhamento = true;
      if (filtroAcompanhamento === 'acompanhar') {
        matchAcompanhamento = !!lic.acompanhamento;
      } else if (filtroAcompanhamento === 'homologadas') {
        matchAcompanhamento = !!lic.homologada;
      }

      return matchTexto && matchResponsavel && matchData && matchAcompanhamento;
    });
  }, [licitacoes, busca, filtroResponsavel, filtroData, filtroAcompanhamento]);

  // Contagem de licitações por acompanhamento e concluídas
  const contagemAcompanhar = useMemo(() => {
    return licitacoes.filter(l => !!l.acompanhamento).length;
  }, [licitacoes]);

  const contagemHomologadas = useMemo(() => {
    return licitacoes.filter(l => !!l.homologada).length;
  }, [licitacoes]);

  // Contagem de licitações por responsável
  const contagemPorResponsavel = useMemo(() => {
    const mapa: Record<string, number> = {};
    listaCompletaResponsaveis.forEach(r => {
      mapa[r] = 0;
    });
    licitacoes.forEach(l => {
      const respLic = (l.responsavel || 'Gustavo').trim();
      const match = listaCompletaResponsaveis.find(r => r.toLowerCase() === respLic.toLowerCase()) || respLic;
      mapa[match] = (mapa[match] || 0) + 1;
    });
    return mapa;
  }, [licitacoes, listaCompletaResponsaveis]);

  // Licitações e Itens dinâmicos que respeitam todos os filtros
  const licitacoesDoFiltro = useMemo(() => {
    return licitacoesFiltradas;
  }, [licitacoesFiltradas]);

  const itensDoFiltro = useMemo(() => {
    const idsLic = new Set(licitacoesDoFiltro.map(l => l.id));
    return itens.filter(i => idsLic.has(i.licitacao_id));
  }, [itens, licitacoesDoFiltro]);

  const itensVencidosDoFiltro = useMemo(() => {
    return itensDoFiltro.filter(i => i.selecionado !== false);
  }, [itensDoFiltro]);

  const totalLicitacoesFiltradas = licitacoesDoFiltro.length;

  const valorTotalDisputa = useMemo(() => {
    return itensDoFiltro.reduce(
      (acc, it) => acc + (it.valor_total || (it.quantidade * it.valor_unitario) || 0),
      0
    );
  }, [itensDoFiltro]);

  const valorTotalVencidos = useMemo(() => {
    return itensVencidosDoFiltro.reduce(
      (acc, it) => acc + (it.valor_total || (it.quantidade * it.valor_unitario) || 0),
      0
    );
  }, [itensVencidosDoFiltro]);

  // Quadro Técnico: Consolidação de Lucro Líquido Real, Impostos e Custo com Fornecedores
  const metricasTecnicasLucro = useMemo(() => {
    const itensComLucro = itensDoFiltro.filter(
      i => i.custo_fornecedor !== undefined && i.custo_fornecedor > 0
    );

    let totalFaturamentoGanho = 0;
    let totalCustoFornecedores = 0;
    let totalImpostos = 0;
    let totalOutrosCustos = 0;
    let totalLucroLiquido = 0;

    itensComLucro.forEach(it => {
      const qtd = Math.max(1, it.quantidade || 1);
      const valorGanhoUnit =
        it.valor_ganho !== undefined && it.valor_ganho > 0
          ? it.valor_ganho
          : it.lance_minimo !== undefined && it.lance_minimo > 0
          ? it.lance_minimo
          : it.valor_unitario;

      const faturamentoItem = valorGanhoUnit * qtd;
      const custoFornecItem = (it.custo_fornecedor || 0) * qtd;
      const aliquota = it.aliquota_imposto !== undefined ? it.aliquota_imposto : 10;
      const impostoItem = faturamentoItem * (aliquota / 100);
      const outrosItem = it.outros_custos || 0;
      const lucroItem = faturamentoItem - custoFornecItem - impostoItem - outrosItem;

      totalFaturamentoGanho += faturamentoItem;
      totalCustoFornecedores += custoFornecItem;
      totalImpostos += impostoItem;
      totalOutrosCustos += outrosItem;
      totalLucroLiquido += lucroItem;
    });

    const margemLiquidaMedia =
      totalFaturamentoGanho > 0 ? (totalLucroLiquido / totalFaturamentoGanho) * 100 : 0;
    const retornoSobreCusto =
      totalCustoFornecedores > 0 ? (totalLucroLiquido / totalCustoFornecedores) * 100 : 0;
    const aliquotaMediaPonderada =
      totalFaturamentoGanho > 0 ? (totalImpostos / totalFaturamentoGanho) * 100 : 10;

    return {
      quantidadeItensAnalisados: itensComLucro.length,
      totalFaturamentoGanho,
      totalCustoFornecedores,
      totalImpostos,
      totalOutrosCustos,
      totalLucroLiquido,
      margemLiquidaMedia,
      retornoSobreCusto,
      aliquotaMediaPonderada,
      ehLucroPositivo: totalLucroLiquido >= 0,
    };
  }, [itensDoFiltro]);

  // Handlers do Modal de Gerenciamento
  const handleAdicionarNoModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeModal.trim()) return;
    const ok = onAdicionarResponsavel(novoNomeModal.trim());
    if (ok) {
      setNovoNomeModal('');
    }
  };

  const iniciarExclusaoResponsavel = (nome: string) => {
    setResponsavelParaExcluir(nome);
    const outros = responsaveis.filter(r => r !== nome);
    setDestinoTransferencia(outros[0] || 'Gustavo');
  };

  const confirmarExclusaoResponsavel = () => {
    if (!responsavelParaExcluir) return;
    onExcluirResponsavel(responsavelParaExcluir, destinoTransferencia);
    setResponsavelParaExcluir(null);
  };

  return (
    <div className="space-y-5">
      {/* Cards de Métricas: Total de Licitações, Valores em Disputa e Valores Vencidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total de Licitações */}
        <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0 shadow-2xs">
              <Landmark className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Total de Licitações
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {totalLicitacoesFiltradas}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {filtroData
                  ? `Cadastradas em ${normalizarData(filtroData)}`
                  : filtroResponsavel === 'Todos'
                  ? `${licitacoes.length} no total da empresa`
                  : `Processos de ${filtroResponsavel}`}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
        </div>

        {/* Card 2: Valores em Disputa */}
        <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shrink-0 shadow-2xs">
              <Coins className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Valores em Disputa
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {formatarMoeda(valorTotalDisputa)}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {itensDoFiltro.length} itens cotados no total
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
        </div>

        {/* Card 3: Valores Vencidos (Ganhos) */}
        <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0 shadow-2xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate">
                Valores Vencidos (Ganhos)
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                {formatarMoeda(valorTotalVencidos)}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {itensVencidosDoFiltro.length} de {itensDoFiltro.length} itens ganhos
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {valorTotalDisputa > 0 && (
              <span className="hidden sm:inline-block bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {((valorTotalVencidos / valorTotalDisputa) * 100).toFixed(0)}%
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* QUADRO TÉCNICO: ANÁLISE DE LUCRO LÍQUIDO & IMPOSTOS                 */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="space-y-4">
          {/* Cabeçalho do Quadro Técnico limpo e direto */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                Quadro Técnico: Lucro Líquido & Impostos
              </h3>
            </div>

            <div className="shrink-0">
              <span className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-mono font-medium">
                {metricasTecnicasLucro.quantidadeItensAnalisados} itens com custo
              </span>
            </div>
          </div>

          {/* Cards de Métricas Técnicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Lucro Líquido Total */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-3.5 flex items-start gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0 shadow-2xs mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Lucro Líquido Total
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                    Líquido
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatarMoeda(metricasTecnicasLucro.totalLucroLiquido)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Margem Média: +{metricasTecnicasLucro.margemLiquidaMedia.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 2. Total de Impostos Deduzidos */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-3.5 flex items-start gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 shadow-2xs mt-0.5">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Impostos Totais
                  </span>
                  <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                    Tributos
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
                  {formatarMoeda(metricasTecnicasLucro.totalImpostos)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Alíquota Efetiva: {metricasTecnicasLucro.aliquotaMediaPonderada.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 3. Custo com Fornecedores */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-3.5 flex items-start gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Custo Fornecedores
                  </span>
                  <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                    Compras
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                  {formatarMoeda(metricasTecnicasLucro.totalCustoFornecedores)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Retorno s/ Custo (ROI): +{metricasTecnicasLucro.retornoSobreCusto.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 4. Faturamento Ganho Analisado */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-3.5 flex items-start gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-2xs mt-0.5">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Faturamento Ganho
                  </span>
                  <span className="text-[9px] font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                    Arrematados
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
                  {formatarMoeda(metricasTecnicasLucro.totalFaturamentoGanho)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Outros Custos / Frete: {formatarMoeda(metricasTecnicasLucro.totalOutrosCustos)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca (Organizada e Limpa SaaS) */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col xl:flex-row gap-3.5 items-stretch xl:items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 flex-1">
          {/* Caixa de Busca por Órgão ou Processo */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Órgão ou Processo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9.5 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Data de Cadastro */}
          <div className="relative w-full sm:w-auto flex items-center gap-1.5">
            <div className="relative w-full sm:w-44">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={filtroData}
                onChange={e => setFiltroData(e.target.value)}
                className="w-full pl-9 pr-2.5 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                title="Filtrar por data de cadastro da licitação"
              />
            </div>
            {filtroData && (
              <button
                type="button"
                onClick={() => setFiltroData('')}
                className="p-2 text-slate-500 hover:text-red-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Limpar filtro de data (mostrar todas as datas)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletor de Quem Fez */}
          <div className="relative w-full sm:w-52">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filtroResponsavel}
              onChange={e => {
                const val = e.target.value;
                if (val === '__GERENCIAR__') {
                  setModalGerenciarAberto(true);
                } else {
                  setFiltroResponsavel(val);
                }
              }}
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer appearance-none"
              title="Filtrar por quem fez a licitação"
            >
              <option value="Todos">👤 Quem fez: Todos</option>
              {listaCompletaResponsaveis.map(resp => (
                <option key={resp} value={resp}>
                  👤 {resp} ({contagemPorResponsavel[resp] || 0})
                </option>
              ))}
              <option value="__GERENCIAR__">⚙️ Gerenciar / Excluir nomes...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro Rápido por Status: Todas / Acompanhar / Homologadas */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFiltroAcompanhamento('todos')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filtroAcompanhamento === 'todos'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Mostrar todas as licitações"
            >
              Todas ({licitacoes.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroAcompanhamento('acompanhar')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filtroAcompanhamento === 'acompanhar'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-800 dark:hover:text-amber-300'
              }`}
              title="Filtrar licitações marcadas para acompanhamento"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Acompanhar ({contagemAcompanhar})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroAcompanhamento('homologadas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filtroAcompanhamento === 'homologadas'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300'
              }`}
              title="Filtrar licitações concluídas ou homologadas"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Homologadas ({contagemHomologadas})</span>
            </button>
          </div>
        </div>

        {/* Botão de Atalho Rápido para Criar Nova Licitação */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onNovaLicitacao}
            className="w-full sm:w-auto px-4 py-2 bg-[#0A1D37] hover:bg-[#122A4E] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-98"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            Nova Licitação
          </button>
        </div>
      </div>

      {/* Tabela de Licitações */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {licitacoesFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">Nenhuma licitação encontrada</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {busca || filtroResponsavel !== 'Todos' || filtroData ? (
                <>
                  Nenhuma licitação corresponde aos filtros aplicados{' '}
                  {filtroData && (
                    <span className="font-semibold text-slate-700">
                      (Data: {normalizarData(filtroData)})
                    </span>
                  )}
                  .
                </>
              ) : (
                'Cadastre sua primeira licitação para iniciar a montagem de propostas.'
              )}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              {(busca || filtroResponsavel !== 'Todos' || filtroData) && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    setFiltroResponsavel('Todos');
                    setFiltroData('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Limpar Todos os Filtros
                </button>
              )}
              <button
                onClick={onNovaLicitacao}
                className="px-4 py-2 bg-[#0F2C59] hover:bg-[#163c78] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                + Cadastrar Nova Licitação
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Órgão Público</th>
                  <th className="py-3 px-4">Processo / Pregão</th>
                  <th className="py-3 px-4">Modalidade</th>
                  <th className="py-3 px-4">Data Cad.</th>
                  <th className="py-3 px-4">Itens / Total</th>
                  <th className="py-3 px-4">Quem Fez</th>
                  <th className="py-3 px-4 text-center w-28">Acompanhamento</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {licitacoesFiltradas.map(lic => {
                  const itensDaLic = itens.filter(i => i.licitacao_id === lic.id);
                  const totalLic = itensDaLic.reduce((acc, it) => acc + (it.valor_total || 0), 0);
                  const responsavelAtual = lic.responsavel || 'Gustavo';

                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/80 dark:hover:bg-[#162238] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 font-medium tabular-nums">
                        #{lic.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {lic.orgao}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {lic.processo_pregao}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {lic.modalidade}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono tabular-nums">
                        {lic.data_cadastro}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 font-mono tabular-nums">
                          {formatarMoeda(totalLic)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {itensDaLic.length} {itensDaLic.length === 1 ? 'item' : 'itens'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={responsavelAtual}
                            onChange={e => onAtualizarResponsavel(lic.id, e.target.value)}
                            className={`text-xs font-semibold py-1 pl-2.5 pr-6 rounded-md border cursor-pointer focus:outline-hidden transition-colors ${
                              responsavelAtual.toLowerCase().includes('gustavo')
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : responsavelAtual.toLowerCase().includes('victor')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                            title="Alterar responsável pela licitação"
                          >
                            {responsaveis.map(resp => (
                              <option key={resp} value={resp}>
                                👤 {resp}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      {/* Coluna de Acompanhamento (👁 Acompanhar e ✓ Concluída/Homologada) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botão Acompanhar (Olho) */}
                          <button
                            type="button"
                            onClick={() => onToggleAcompanhamento?.(lic.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                              lic.acompanhamento
                                ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200 shadow-xs ring-1 ring-amber-300'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200'
                            }`}
                            title={
                              lic.acompanhamento
                                ? 'Licitação em acompanhamento (aguardando homologação / resultado) — Clique para desmarcar'
                                : 'Marcar para acompanhamento (aguardando homologação / resultado)'
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Botão Concluída / Homologada (Check) */}
                          <button
                            type="button"
                            onClick={() => onToggleHomologada?.(lic.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                              lic.homologada
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200 shadow-xs ring-1 ring-emerald-300'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                            }`}
                            title={
                              lic.homologada
                                ? 'Licitação concluída / homologada — Clique para desmarcar'
                                : 'Marcar como concluída / homologada'
                            }
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelecionarLicitacao(lic.id)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0F2C59] dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-blue-200 dark:border-blue-400/40"
                            title="Editar Licitação / Montar Proposta"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-blue-700 dark:text-amber-300" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setLicitacaoParaExcluir(lic)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Excluir Licitação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE GERENCIAMENTO E EXCLUSÃO DE NOMES DE RESPONSÁVEIS */}
      {/* ========================================================================= */}
      {modalGerenciarAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => {
            setModalGerenciarAberto(false);
            setResponsavelParaExcluir(null);
          }}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setModalGerenciarAberto(false);
                setResponsavelParaExcluir(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0F2C59]" />
              Gerenciar Responsáveis (Quem Fez)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adicione novos membros da equipe ou exclua nomes existentes do sistema.
            </p>

            {/* Formulário para Adicionar Novo Nome */}
            <form onSubmit={handleAdicionarNoModal} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <UserPlus className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={novoNomeModal}
                  onChange={e => setNovoNomeModal(e.target.value)}
                  placeholder="Nome do novo responsável (ex: Rafael, Mariana)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0F2C59] hover:bg-[#163c78] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                Adicionar
              </button>
            </form>

            {/* Sub-painel de Confirmação de Exclusão (caso clicou na lixeira de algum nome) */}
            {responsavelParaExcluir && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 flex-1">
                    <p className="font-bold">
                      Confirmar exclusão de "{responsavelParaExcluir}"?
                    </p>
                    {contagemPorResponsavel[responsavelParaExcluir] > 0 ? (
                      <p className="mt-1 text-slate-700 leading-relaxed">
                        Existem <strong>{contagemPorResponsavel[responsavelParaExcluir]}</strong> licitação(ões) vinculada(s) a este nome. Escolha para quem transferi-las antes de excluir:
                      </p>
                    ) : (
                      <p className="mt-1 text-slate-700">
                        Nenhuma licitação vinculada no momento. O nome será removido da lista do sistema.
                      </p>
                    )}
                  </div>
                </div>

                {contagemPorResponsavel[responsavelParaExcluir] > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <ArrowRightLeft className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 shrink-0">Transferir para:</span>
                    <select
                      value={destinoTransferencia}
                      onChange={e => setDestinoTransferencia(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold cursor-pointer focus:outline-hidden"
                    >
                      {responsaveis
                        .filter(r => r !== responsavelParaExcluir)
                        .map(r => (
                          <option key={r} value={r}>
                            👤 {r}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setResponsavelParaExcluir(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarExclusaoResponsavel}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Nome
                  </button>
                </div>
              </div>
            )}

            {/* Lista dos Nomes Cadastrados com Botão de Excluir */}
            <div className="mt-4 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {responsaveis.map(resp => {
                const totalDeste = contagemPorResponsavel[resp] || 0;
                const estaSendoExcluido = responsavelParaExcluir === resp;

                return (
                  <div
                    key={resp}
                    className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                      estaSendoExcluido ? 'bg-rose-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0F2C59]/10 text-[#0F2C59] flex items-center justify-center font-bold text-xs">
                        {resp.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          {resp}
                          {resp === 'Gustavo' || resp === 'Victor' ? (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Padrão
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {totalDeste} {totalDeste === 1 ? 'licitação vinculada' : 'licitações vinculadas'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={responsaveis.length <= 1}
                      onClick={() => iniciarExclusaoResponsavel(resp)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                        responsaveis.length <= 1
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={
                        responsaveis.length <= 1
                          ? 'Mantenha pelo menos um responsável'
                          : `Excluir "${resp}" do sistema`
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px]">Excluir</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalGerenciarAberto(false);
                  setResponsavelParaExcluir(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE LICITAÇÃO */}
      {/* ========================================================================= */}
      {licitacaoParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setLicitacaoParaExcluir(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLicitacaoParaExcluir(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Excluir Licitação?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir permanentemente o processo{' '}
                  <strong className="text-slate-900 font-semibold">{licitacaoParaExcluir.processo_pregao}</strong> ({licitacaoParaExcluir.orgao})?
                </p>
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                  ⚠️ <strong>Atenção:</strong> Todos os itens, descrições técnicas e cotações vinculadas a esta licitação serão removidos.
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLicitacaoParaExcluir(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const idParaDeletar = licitacaoParaExcluir.id;
                  setLicitacaoParaExcluir(null);
                  onExcluirLicitacao(idParaDeletar);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE DECLARAÇÃO UNIFICADA (LEI 14.133/2021) */}
      {/* ========================================================================= */}
      <ModalDeclaracaoUnificada
        aberto={modalDeclaracaoAberto}
        onFechar={() => {
          setModalDeclaracaoAberto(false);
          setLicParaDeclaracao(null);
        }}
        licitacoes={licitacoes}
        licitacaoInicial={licParaDeclaracao}
        timbrado={timbradoConfig || obterPapelTimbradoConfig()}
      />
    </div>
  );
};
