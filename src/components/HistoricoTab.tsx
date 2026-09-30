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
} from 'lucide-react';
import { Licitacao, ItemLicitacao } from '../types';
import { formatarMoeda } from '../utils/numberToWordsPtBr';

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
}

export const HistoricoTab: React.FC<HistoricoTabProps> = ({
  licitacoes,
  itens,
  responsaveis,
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
}) => {
  const [busca, setBusca] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('Todos');
  const [filtroData, setFiltroData] = useState<string>(''); // formato YYYY-MM-DD
  const [filtroAcompanhamento, setFiltroAcompanhamento] = useState<'todos' | 'acompanhar' | 'homologadas'>('todos');
  const [licitacaoParaExcluir, setLicitacaoParaExcluir] = useState<Licitacao | null>(null);

  // Menu Dropdown da Engrenagem de Configurações
  const [menuConfigAberto, setMenuConfigAberto] = useState(false);

  // Modal para Gerenciar/Excluir Responsáveis
  const [modalGerenciarAberto, setModalGerenciarAberto] = useState(false);
  const [novoNomeModal, setNovoNomeModal] = useState('');
  const [responsavelParaExcluir, setResponsavelParaExcluir] = useState<string | null>(null);
  const [destinoTransferencia, setDestinoTransferencia] = useState<string>('');

  // Filtragem de licitações: busca por texto + responsável + data de cadastro
  const licitacoesFiltradas = useMemo(() => {
    return licitacoes.filter(lic => {
      const matchTexto =
        lic.orgao.toLowerCase().includes(busca.toLowerCase()) ||
        lic.processo_pregao.toLowerCase().includes(busca.toLowerCase()) ||
        lic.modalidade.toLowerCase().includes(busca.toLowerCase());

      const respLic = lic.responsavel || 'Gustavo';
      const matchResponsavel =
        filtroResponsavel === 'Todos' ||
        respLic.toLowerCase() === filtroResponsavel.toLowerCase();

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
    responsaveis.forEach(r => {
      mapa[r] = 0;
    });
    licitacoes.forEach(l => {
      const r = l.responsavel || 'Gustavo';
      mapa[r] = (mapa[r] || 0) + 1;
    });
    return mapa;
  }, [licitacoes, responsaveis]);

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
    <div className="space-y-6">
      {/* Cards de Métricas: Total de Licitações, Valores em Disputa e Valores Vencidos (Quadrinho Marcado) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total de Licitações */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Total de Licitações
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {filtroData && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {normalizarData(filtroData)}
                </span>
              )}
              {filtroResponsavel !== 'Todos' && (
                <span className="text-[10px] font-semibold text-[#0F2C59] bg-[#0F2C59]/10 px-2 py-0.5 rounded-full">
                  👤 {filtroResponsavel}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalLicitacoesFiltradas}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {filtroData
              ? `Cadastradas em ${normalizarData(filtroData)}`
              : filtroResponsavel === 'Todos'
              ? `${licitacoes.length} no total da empresa`
              : `Processos de ${filtroResponsavel}`}
          </div>
        </div>

        {/* Card 2: Valores em Disputa (Itens Cotados) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[#0F2C59] uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#0F2C59]" /> Valores em Disputa
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {filtroData && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {normalizarData(filtroData)}
                </span>
              )}
              {filtroResponsavel !== 'Todos' && (
                <span className="text-[10px] font-semibold text-[#0F2C59] bg-[#0F2C59]/10 px-2 py-0.5 rounded-full">
                  👤 {filtroResponsavel}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#0F2C59] tabular-nums">
            {formatarMoeda(valorTotalDisputa)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {itensDoFiltro.length} {itensDoFiltro.length === 1 ? 'item cotado' : 'itens cotados'}{' '}
            {filtroData ? `nesta data` : filtroResponsavel === 'Todos' ? 'no total' : `por ${filtroResponsavel}`}
          </div>
        </div>

        {/* Card 3: Valores Vencidos (Itens Ganhos no Quadrinho) */}
        <div className="bg-white border border-emerald-200/90 bg-emerald-50/20 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Valores Vencidos (Ganhos)
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {filtroData && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {normalizarData(filtroData)}
                </span>
              )}
              {filtroResponsavel !== 'Todos' && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  👤 {filtroResponsavel}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatarMoeda(valorTotalVencidos)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>
              {itensVencidosDoFiltro.length} de {itensDoFiltro.length} itens ganhos
            </span>
            {valorTotalDisputa > 0 && (
              <span className="font-semibold text-emerald-700 font-mono text-[11px]">
                {((valorTotalVencidos / valorTotalDisputa) * 100).toFixed(0)}% do valor
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca com Gerenciador de Nomes ao Lado */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          {/* Caixa de Busca por Órgão ou Processo */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Órgão ou Processo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
            />
          </div>

          {/* Filtro por Data de Cadastro */}
          <div className="relative w-full sm:w-auto flex items-center gap-1.5">
            <div className="relative w-full sm:w-44">
              <Calendar className="w-4 h-4 text-[#0F2C59] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={filtroData}
                onChange={e => setFiltroData(e.target.value)}
                className="w-full pl-9 pr-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] cursor-pointer"
                title="Filtrar por data de cadastro da licitação"
              />
            </div>
            {filtroData && (
              <button
                type="button"
                onClick={() => setFiltroData('')}
                className="p-2 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Limpar filtro de data (mostrar todas as datas)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Caixa ao Lado: Seletor de Quem Fez */}
          <div className="relative w-full sm:w-52">
            <User className="w-4 h-4 text-[#0F2C59] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] cursor-pointer appearance-none"
              title="Filtrar por quem fez a licitação"
            >
              <option value="Todos">👤 Quem fez: Todos</option>
              {responsaveis.map(resp => (
                <option key={resp} value={resp}>
                  👤 {resp} ({contagemPorResponsavel[resp] || 0})
                </option>
              ))}
              <option value="__GERENCIAR__">⚙️ Gerenciar / Excluir nomes...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Botão de Atalho para Gerenciar / Excluir Nomes */}
          <button
            type="button"
            onClick={() => setModalGerenciarAberto(true)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Adicionar ou excluir nomes de responsáveis"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-600" />
            Gerenciar Nomes
          </button>

          {/* Filtro Rápido por Status: Todas / Acompanhar / Homologadas */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFiltroAcompanhamento('todos')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filtroAcompanhamento === 'todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mostrar todas as licitações"
            >
              Todas ({licitacoes.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroAcompanhamento('acompanhar')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                filtroAcompanhamento === 'acompanhar'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
              title="Filtrar licitações marcadas para acompanhamento"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Acompanhar ({contagemAcompanhar})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroAcompanhamento('homologadas')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                filtroAcompanhamento === 'homologadas'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
              title="Filtrar licitações concluídas ou homologadas"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Homologadas ({contagemHomologadas})</span>
            </button>
          </div>

          {/* Engrenagem de Configuração (Papel Timbrado e Código Python) */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setMenuConfigAberto(prev => !prev)}
              className={`w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                menuConfigAberto
                  ? 'bg-slate-200 text-[#0F2C59] border-slate-300 shadow-xs'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Configurações do Papel Timbrado e Código Python"
            >
              <Settings
                className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${
                  menuConfigAberto ? 'rotate-90 text-[#0F2C59]' : ''
                }`}
              />
              <span>Configurações</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {menuConfigAberto && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuConfigAberto(false)}
                />
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center gap-1.5">
                    <Settings className="w-3 h-3 text-slate-400" />
                    Opções de Configuração
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuConfigAberto(false);
                      onNavegarPara?.('timbrado');
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                  >
                    <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 mt-0.5 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        Configurações do Papel Timbrado
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Logotipo, cabeçalho, rodapé e dados da empresa
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuConfigAberto(false);
                      onAbrirSeguranca?.();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                  >
                    <div className="p-1.5 rounded-md bg-purple-100 text-purple-700 mt-0.5 shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        Segurança e Acesso
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                          Senha
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Alterar ID de usuário e senha do sistema
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botão de Atalho Rápido para Criar Nova Licitação */}
        <button
          onClick={onNovaLicitacao}
          className="w-full sm:w-auto px-4 py-2 bg-[#0F2C59] hover:bg-[#163c78] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
          Nova Licitação
        </button>
      </div>

      {/* Tabela de Licitações */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
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
                className="px-4 py-2 bg-[#0F2C59] text-white text-xs font-semibold rounded-lg hover:bg-[#163c78] transition-colors cursor-pointer"
              >
                + Cadastrar Nova Licitação
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-xs">
                {licitacoesFiltradas.map(lic => {
                  const itensDaLic = itens.filter(i => i.licitacao_id === lic.id);
                  const totalLic = itensDaLic.reduce((acc, it) => acc + (it.valor_total || 0), 0);
                  const responsavelAtual = lic.responsavel || 'Gustavo';

                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
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
                            className="px-2.5 py-1.5 bg-[#0F2C59]/5 hover:bg-[#0F2C59]/10 text-[#0F2C59] font-medium text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            title="Montar ou Editar Proposta"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            Montar Proposta
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
    </div>
  );
};
