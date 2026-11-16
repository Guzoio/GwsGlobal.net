import React, { useState, useMemo } from 'react';
import { Licitacao, ItemLicitacao, ContatoPrefeitura } from '../types';
import { compilarAnalises, ResumoEstado, ESTADOS_BRASIL_OPCOES, detectarEstado } from '../utils/geoBrasil';
import { MapaBrasilInterativo } from './MapaBrasilInterativo';
import { GraficosAnalise } from './GraficosAnalise';
import { formatarMoeda } from '../utils/numberToWordsPtBr';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Building2,
  DollarSign,
  Award,
  CheckCircle2,
  Eye,
  Filter,
  X,
  Search,
  ArrowUpRight,
  Percent,
  Layers,
} from 'lucide-react';

interface AnaliseTabProps {
  licitacoes: Licitacao[];
  itens: ItemLicitacao[];
  contatos: ContatoPrefeitura[];
  onSelecionarLicitacao?: (id: number) => void;
  onNavegarPara?: (aba: string) => void;
}

export const AnaliseTab: React.FC<AnaliseTabProps> = ({
  licitacoes,
  itens,
  contatos,
  onSelecionarLicitacao,
  onNavegarPara,
}) => {
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null);
  const [buscaTabela, setBuscaTabela] = useState('');

  // Compila todas as métricas geográficas, financeiras e temporais
  const analises = useMemo(() => {
    return compilarAnalises(licitacoes, itens, contatos);
  }, [licitacoes, itens, contatos]);

  // Licitações filtradas pelo estado selecionado no mapa ou na busca
  const licitacoesFiltradas = useMemo(() => {
    return licitacoes.filter(l => {
      // Filtro de estado
      if (estadoFiltro) {
        const ufLic = l.uf || detectarEstado(l.orgao, contatos);
        if (ufLic !== estadoFiltro) {
          return false;
        }
      }

      // Busca na tabela
      if (buscaTabela.trim()) {
        const termo = buscaTabela.toLowerCase();
        return (
          l.orgao.toLowerCase().includes(termo) ||
          l.processo_pregao.toLowerCase().includes(termo) ||
          (l.responsavel && l.responsavel.toLowerCase().includes(termo))
        );
      }

      return true;
    });
  }, [licitacoes, estadoFiltro, buscaTabela, contatos]);

  // Informações do estado selecionado
  const infoEstadoSelecionado = useMemo(() => {
    if (!estadoFiltro) return null;
    return analises.listaEstados.find(e => e.sigla === estadoFiltro) || null;
  }, [estadoFiltro, analises]);

  return (
    <div className="space-y-5 pb-12">
      {/* Header Principal da Aba */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-md bg-blue-600 text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Painel de Análise & Estatísticas de Licitações
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                GWS BI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mapa do Brasil, lucros apurados, gráficos de distribuição e estados que mais atendemos
            </p>
          </div>
        </div>

        {/* Indicador de filtro ativo */}
        {estadoFiltro && (
          <div className="flex items-center gap-2 p-1.5 px-3 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">
              Filtrado por: {infoEstadoSelecionado?.nome} ({estadoFiltro})
            </span>
            <button
              type="button"
              onClick={() => setEstadoFiltro(null)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded cursor-pointer"
              title="Remover filtro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cards de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total de Licitações */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Licitações
            </span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {analises.kpis.totalLicitacoes}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              {analises.kpis.totalHomologadas} homologadas
            </span>
            <span className="font-mono">({analises.kpis.taxaSucesso}%)</span>
          </div>
        </div>

        {/* Estados Atendidos */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Estados Atendidos
            </span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {analises.kpis.totalEstadosAtendidos} <span className="text-xs text-slate-400 font-normal">/ 27 UFs</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {analises.estadosMaisAtendidos[0]
              ? `Líder: ${analises.estadosMaisAtendidos[0].nome}`
              : 'Nenhum estado'}
          </div>
        </div>

        {/* Faturamento Proposto */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Valor Proposto
            </span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tabular-nums truncate">
            {formatarMoeda(analises.kpis.faturamentoGlobal)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Soma de todas as propostas
          </div>
        </div>

        {/* Lucro Líquido Apurado */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Lucro Líquido
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums truncate">
            {formatarMoeda(analises.kpis.lucroLiquidoGlobal)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Livre de custos e impostos
          </div>
        </div>

        {/* Margem Média de Lucro */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Margem Líquida
            </span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono tabular-nums">
            {analises.kpis.margemMediaGlobal}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Rentabilidade líquida média
          </div>
        </div>
      </div>

      {/* Seção Principal: Mapa do Brasil + Ranking dos Estados Mais Atendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Mapa Interativo (7 colunas no desktop) */}
        <div className="lg:col-span-7">
          <MapaBrasilInterativo
            estadosResumo={analises.listaEstados}
            estadoSelecionado={estadoFiltro}
            onSelecionarEstado={setEstadoFiltro}
          />
        </div>

        {/* Ranking dos Estados Que Mais Atendemos (5 colunas no desktop) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Estados Que Mais Atendemos</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ranking por volume de prefeituras e valor licitado
                </p>
              </div>

              <span className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400">
                {analises.estadosMaisAtendidos.length} ativos
              </span>
            </div>

            {/* Lista de Estados Atendidos */}
            <div className="mt-3 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {analises.estadosMaisAtendidos.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhuma prefeitura com estado identificado ainda.
                </div>
              ) : (
                analises.estadosMaisAtendidos.map((est, index) => {
                  const isSelecionado = estadoFiltro === est.sigla;
                  const maxLics = analises.estadosMaisAtendidos[0]?.totalLicitacoes || 1;
                  const pctBarra = Math.round((est.totalLicitacoes / maxLics) * 100);

                  return (
                    <div
                      key={est.sigla}
                      onClick={() =>
                        setEstadoFiltro(estadoFiltro === est.sigla ? null : est.sigla)
                      }
                      className={`p-3 rounded-md border transition-colors cursor-pointer ${
                        isSelecionado
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-extrabold font-mono shrink-0 ${
                              index === 0
                                ? 'bg-amber-500 text-white'
                                : index === 1
                                ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white'
                                : index === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {est.nome} ({est.sigla})
                            </h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                              Região {est.regiao} • {est.prefeituras.length}{' '}
                              {est.prefeituras.length === 1 ? 'órgão' : 'órgãos'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono tabular-nums">
                            {est.totalLicitacoes}{' '}
                            {est.totalLicitacoes === 1 ? 'licitação' : 'licitações'}
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono tabular-nums">
                            {formatarMoeda(est.totalValorProposta)}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Relativa */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${pctBarra}%` }}
                        />
                      </div>

                      {/* Lucro Estimado no Estado */}
                      {est.totalLucroLiquido > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400">Lucro apurado:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                            {formatarMoeda(est.totalLucroLiquido)} ({est.margemMedia}%)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dica de interação */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Clique para filtrar os dados deste estado</span>
            {estadoFiltro && (
              <button
                type="button"
                onClick={() => setEstadoFiltro(null)}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Limpar seleção
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos de Evolução Mês a Mês e Distribuição */}
      <GraficosAnalise
        meses={analises.mesesOrdenados}
        modalidades={analises.modalidades}
        responsaveis={analises.responsaveis}
        topEstados={analises.estadosMaisAtendidos}
      />

      {/* Tabela de Licitações & Órgãos Filtrados com Detalhamento de Lucro */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        {/* Topo da Tabela com Barra de Pesquisa */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Detalhamento dos Processos & Prefeituras</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {estadoFiltro
                ? `Mostrando processos de ${infoEstadoSelecionado?.nome} (${licitacoesFiltradas.length} encontrados)`
                : `Todos os processos cadastrados no sistema (${licitacoesFiltradas.length} encontrados)`}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={buscaTabela}
              onChange={e => setBuscaTabela(e.target.value)}
              placeholder="Pesquisar órgão, pregao..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Órgão / Prefeitura</th>
                <th className="py-3 px-4">Estado (UF)</th>
                <th className="py-3 px-4">Processo / Pregão</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {licitacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Nenhuma licitação encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                licitacoesFiltradas.map(lic => {
                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {lic.orgao}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs inline-block">
                          {lic.uf || detectarEstado(lic.orgao, contatos)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {lic.processo_pregao}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {lic.data_cadastro}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {lic.responsavel}
                      </td>
                      <td className="py-3 px-4">
                        {lic.homologada ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Homologada</span>
                          </span>
                        ) : lic.acompanhamento ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Acompanhamento</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Em andamento</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelecionarLicitacao) onSelecionarLicitacao(lic.id);
                            if (onNavegarPara) onNavegarPara('montar');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>Ver Proposta</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
