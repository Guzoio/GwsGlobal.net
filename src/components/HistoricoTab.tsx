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
  Code2,
  Target,
  CheckSquare,
  Layers,
} from 'lucide-react';
import { Licitacao, ItemLicitacao } from '../types';
import { formatarMoeda } from '../utils/numberToWordsPtBr';

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
}) => {
  const [busca, setBusca] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('Todos');
  const [licitacaoParaExcluir, setLicitacaoParaExcluir] = useState<Licitacao | null>(null);

  // Menu Dropdown da Engrenagem de Configurações
  const [menuConfigAberto, setMenuConfigAberto] = useState(false);

  // Modal para Gerenciar/Excluir Responsáveis
  const [modalGerenciarAberto, setModalGerenciarAberto] = useState(false);
  const [novoNomeModal, setNovoNomeModal] = useState('');
  const [responsavelParaExcluir, setResponsavelParaExcluir] = useState<string | null>(null);
  const [destinoTransferencia, setDestinoTransferencia] = useState<string>('');

  // Filtragem de licitações: busca por texto + filtro de responsável na caixa ao lado
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

      return matchTexto && matchResponsavel;
    });
  }, [licitacoes, busca, filtroResponsavel]);

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

  // Licitações e Itens dinâmicos pelo responsável selecionado em "Quem fez"
  const licitacoesDoFiltro = useMemo(() => {
    if (filtroResponsavel === 'Todos') {
      return licitacoes;
    }
    return licitacoes.filter(
      l => (l.responsavel || 'Gustavo').toLowerCase() === filtroResponsavel.toLowerCase()
    );
  }, [licitacoes, filtroResponsavel]);

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
            {filtroResponsavel !== 'Todos' && (
              <span className="text-[10px] font-semibold text-[#0F2C59] bg-[#0F2C59]/10 px-2 py-0.5 rounded-full">
                👤 {filtroResponsavel}
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalLicitacoesFiltradas}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {filtroResponsavel === 'Todos'
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
            {filtroResponsavel !== 'Todos' && (
              <span className="text-[10px] font-semibold text-[#0F2C59] bg-[#0F2C59]/10 px-2 py-0.5 rounded-full">
                👤 {filtroResponsavel}
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#0F2C59] tabular-nums">
            {formatarMoeda(valorTotalDisputa)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {itensDoFiltro.length} {itensDoFiltro.length === 1 ? 'item cotado' : 'itens cotados'}{' '}
            {filtroResponsavel === 'Todos' ? 'no total' : `por ${filtroResponsavel}`}
          </div>
        </div>

        {/* Card 3: Valores Vencidos (Itens Ganhos no Quadrinho) */}
        <div className="bg-white border border-emerald-200/90 bg-emerald-50/20 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Valores Vencidos (Ganhos)
            </div>
            {filtroResponsavel !== 'Todos' ? (
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                👤 {filtroResponsavel}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                Quadrinho Marcado
              </span>
            )}
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
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Caixa de Busca por Órgão ou Processo (Mantida Intacta) */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Órgão ou Processo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
            />
          </div>

          {/* Caixa ao Lado: Seletor de Quem Fez */}
          <div className="relative w-full sm:w-56">
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

                  <button
                    type="button"
                    onClick={() => {
                      setMenuConfigAberto(false);
                      onNavegarPara?.('python');
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                  >
                    <div className="p-1.5 rounded-md bg-blue-100 text-[#0F2C59] mt-0.5 shrink-0">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        Código Python / Streamlit
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Script completo com banco SQLite e extração
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
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {busca || filtroResponsavel !== 'Todos'
                ? 'Tente alterar os termos de busca ou o filtro de responsável selecionado.'
                : 'Cadastre sua primeira licitação para iniciar a montagem de propostas.'}
            </p>
            <button
              onClick={onNovaLicitacao}
              className="mt-4 px-4 py-2 bg-[#0F2C59] text-white text-xs font-semibold rounded-lg hover:bg-[#163c78] transition-colors cursor-pointer"
            >
              + Cadastrar Nova Licitação
            </button>
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
