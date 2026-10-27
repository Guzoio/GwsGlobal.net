import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Scale,
  Calculator,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Percent,
  TrendingUp,
  FileText,
  DollarSign,
  Loader2,
  Check,
  RefreshCw,
  Sliders,
  CheckSquare,
} from 'lucide-react';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig } from '../types';
import { formatarMoeda, formatarDataExtensoPtBr } from '../utils/numberToWordsPtBr';
import { LogoGwsGlobal } from './LogoGwsGlobal';
import {
  ItemCalculoExequibilidade,
  DadosExequibilidadeDocumento,
  gerarExequibilidadePdf,
  baixarBlobExequibilidade,
} from '../utils/exequibilidadePdf';

interface ModalExequibilidadeProps {
  aberto: boolean;
  onFechar: () => void;
  licitacoes: Licitacao[];
  itens: ItemLicitacao[];
  licitacaoInicial?: Licitacao | null;
  timbrado: PapelTimbradoConfig;
  onAtualizarItem?: (item: ItemLicitacao) => void;
  onAlternarSelecaoItem?: (itemId: number) => void;
  onAlternarTodosItens?: (licId: number, selecionarTodos: boolean) => void;
}

export const ModalExequibilidade: React.FC<ModalExequibilidadeProps> = ({
  aberto,
  onFechar,
  licitacoes,
  itens,
  licitacaoInicial,
  timbrado,
  onAtualizarItem,
  onAlternarSelecaoItem,
  onAlternarTodosItens,
}) => {
  const [licitacaoIdSelecionada, setLicitacaoIdSelecionada] = useState<number | ''>('');
  const [dataEmissao, setDataEmissao] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [cidadeEmissao, setCidadeEmissao] = useState<string>(
    timbrado.cidadeEmissao || 'Timóteo - MG'
  );

  // Estados locais para edição rápida de custos por item dentro da modal de exequibilidade
  // chave: itemId -> { valorGanho, custoFornecedor, aliquotaImposto, outrosCustos }
  const [custosLocais, setCustosLocais] = useState<
    Record<
      number,
      {
        valor_ganho: number;
        custo_fornecedor: number;
        aliquota_imposto: number;
        outros_custos: number;
      }
    >
  >({});

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [previaUrl, setPreviaUrl] = useState<string | null>(null);
  const [abaVisualizacao, setAbaVisualizacao] = useState<'formulario' | 'previa'>('formulario');
  const [salvandoItem, setSalvandoItem] = useState<number | null>(null);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);

  // Define licitação selecionada inicial
  useEffect(() => {
    if (!aberto) {
      if (previaUrl) {
        URL.revokeObjectURL(previaUrl);
        setPreviaUrl(null);
      }
      return;
    }

    if (licitacaoInicial && licitacaoInicial.id) {
      setLicitacaoIdSelecionada(Number(licitacaoInicial.id));
    } else if (licitacoes.length > 0) {
      setLicitacaoIdSelecionada(Number(licitacoes[0].id));
    }
  }, [aberto, licitacaoInicial, licitacoes]);

  // Licitação atual selecionada
  const licAtual = useMemo(() => {
    return licitacoes.find(l => Number(l.id) === Number(licitacaoIdSelecionada)) || null;
  }, [licitacoes, licitacaoIdSelecionada]);

  // Itens da licitação selecionada ordenados pelo número do item
  const itensLicitacao = useMemo(() => {
    if (!licitacaoIdSelecionada) return [];
    return itens
      .filter(i => Number(i.licitacao_id) === Number(licitacaoIdSelecionada))
      .sort((a, b) => a.num_item - b.num_item);
  }, [itens, licitacaoIdSelecionada]);

  // Apenas itens com a marcação do vezinho no quadradinho (selecionado === true)
  // Fallback seguro: se nenhum item da licitação foi explicitamente marcado ainda,
  // puxa por padrão todos os itens ativos (i.selecionado !== false) para que a prévia nunca fique vazia
  const itensGanhos = useMemo(() => {
    const comVezinho = itensLicitacao.filter(i => i.selecionado === true);
    if (comVezinho.length > 0) return comVezinho;
    return itensLicitacao.filter(i => i.selecionado !== false);
  }, [itensLicitacao]);

  // Inicializa ou atualiza os custos locais sempre que a licitação ou itens mudarem
  useEffect(() => {
    const mapa: Record<number, any> = {};
    itensGanhos.forEach(it => {
      mapa[it.id] = {
        valor_ganho:
          it.valor_ganho !== undefined && it.valor_ganho > 0
            ? it.valor_ganho
            : it.valor_unitario || 0,
        custo_fornecedor: it.custo_fornecedor || 0,
        aliquota_imposto: it.aliquota_imposto !== undefined ? it.aliquota_imposto : 10,
        outros_custos: it.outros_custos || 0,
      };
    });
    setCustosLocais(mapa);
  }, [itensGanhos]);

  // Itens formatados e com todos os cálculos de exequibilidade derivados
  const itensCalculados: ItemCalculoExequibilidade[] = useMemo(() => {
    return itensGanhos.map(it => {
      const c = custosLocais[it.id] || {
        valor_ganho:
          it.valor_ganho !== undefined && it.valor_ganho > 0
            ? it.valor_ganho
            : it.valor_unitario || 0,
        custo_fornecedor: it.custo_fornecedor || 0,
        aliquota_imposto: it.aliquota_imposto !== undefined ? it.aliquota_imposto : 10,
        outros_custos: it.outros_custos || 0,
      };

      const qtd = Math.max(1, it.quantidade || 1);
      const valorGanho = Number(c.valor_ganho) || 0;
      const custoFornecedor = Number(c.custo_fornecedor) || 0;
      const aliquota = Number(c.aliquota_imposto) || 0;
      const outrosCustos = Number(c.outros_custos) || 0;

      const totalGanho = valorGanho * qtd;
      const totalCustoFornecedor = custoFornecedor * qtd;
      const totalImposto = totalGanho * (aliquota / 100);
      const lucroLiquidoTotal = totalGanho - totalCustoFornecedor - totalImposto - outrosCustos;
      const lucroLiquidoUnit = qtd > 0 ? lucroLiquidoTotal / qtd : 0;
      const margemLiquidaPct = totalGanho > 0 ? (lucroLiquidoTotal / totalGanho) * 100 : 0;

      return {
        id: it.id,
        num_item: it.num_item,
        descricao_curta: it.descricao_curta,
        descricao_tecnica: it.descricao_tecnica,
        marca: it.marca,
        quantidade: qtd,
        valor_unitario: it.valor_unitario,
        valor_ganho: valorGanho,
        custo_fornecedor: custoFornecedor,
        aliquota_imposto: aliquota,
        outros_custos: outrosCustos,
        totalGanho,
        totalCustoFornecedor,
        totalImposto,
        lucroLiquidoTotal,
        lucroLiquidoUnit,
        margemLiquidaPct,
      };
    });
  }, [itensGanhos, custosLocais]);

  // Totais consolidados
  const totais = useMemo(() => {
    const totGanho = itensCalculados.reduce((acc, i) => acc + i.totalGanho, 0);
    const totFornec = itensCalculados.reduce((acc, i) => acc + i.totalCustoFornecedor, 0);
    const totImposto = itensCalculados.reduce((acc, i) => acc + i.totalImposto, 0);
    const totOutros = itensCalculados.reduce((acc, i) => acc + i.outros_custos, 0);
    const totLucro = itensCalculados.reduce((acc, i) => acc + i.lucroLiquidoTotal, 0);
    const margemMedia = totGanho > 0 ? (totLucro / totGanho) * 100 : 0;
    const ehExequivel = totLucro >= 0;

    return {
      totGanho,
      totFornec,
      totImposto,
      totOutros,
      totLucro,
      margemMedia,
      ehExequivel,
    };
  }, [itensCalculados]);

  if (!aberto) return null;

  // Atualiza um campo de custo localmente
  const handleChangeCusto = (
    itemId: number,
    campo: 'valor_ganho' | 'custo_fornecedor' | 'aliquota_imposto' | 'outros_custos',
    valorStr: string
  ) => {
    const num = parseFloat(valorStr.replace(',', '.')) || 0;
    setCustosLocais(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {
          valor_ganho: 0,
          custo_fornecedor: 0,
          aliquota_imposto: 10,
          outros_custos: 0,
        }),
        [campo]: num,
      },
    }));
  };

  // Salva os custos digitados diretamente no banco de itens
  const handleSalvarCustosNoItem = async (itCalc: ItemCalculoExequibilidade) => {
    if (!onAtualizarItem) return;
    setSalvandoItem(itCalc.id);
    try {
      const itOriginal = itens.find(i => i.id === itCalc.id);
      if (itOriginal) {
        onAtualizarItem({
          ...itOriginal,
          valor_ganho: itCalc.valor_ganho,
          custo_fornecedor: itCalc.custo_fornecedor,
          aliquota_imposto: itCalc.aliquota_imposto,
          outros_custos: itCalc.outros_custos,
        });
      }
      setMensagemStatus(`Custos do Item #${itCalc.num_item} salvos com sucesso!`);
      setTimeout(() => setMensagemStatus(null), 3000);
    } finally {
      setSalvandoItem(null);
    }
  };

  // Prepara o objeto de dados para o PDF
  const obterDadosDocumento = (): DadosExequibilidadeDocumento => {
    return {
      modalidade: licAtual?.modalidade || 'PREGÃO ELETRÔNICO',
      processoEdital: licAtual?.processo_pregao || 'Processo nº 001/2026',
      orgaoPublico: licAtual?.orgao || 'PREFEITURA MUNICIPAL',
      dataEmissao,
      cidadeEmissao,
      itensGanhos: itensCalculados,
    };
  };

  // Gerar e Baixar PDF
  const handleBaixarPdf = async () => {
    if (itensCalculados.length === 0) {
      alert('Selecione uma licitação com ao menos um produto ganho (marcado com vezinho).');
      return;
    }
    setGerandoPdf(true);
    try {
      const dadosDoc = obterDadosDocumento();
      const blob = await gerarExequibilidadePdf(dadosDoc, timbrado);
      const editalLimpo = (licAtual?.processo_pregao || 'Processo')
        .replace(/[^\w\d-]/g, '_')
        .slice(0, 30);
      const orgaoLimpo = (licAtual?.orgao || 'Orgao')
        .replace(/[^\w\d-]/g, '_')
        .slice(0, 30);
      const nomeArquivo = `Exequibilidade_${editalLimpo}_${orgaoLimpo}.pdf`;
      baixarBlobExequibilidade(blob, nomeArquivo);
      setMensagemStatus('PDF de Exequibilidade emitido e baixado com sucesso!');
      setTimeout(() => setMensagemStatus(null), 3500);
    } catch (err: any) {
      console.error('Erro ao gerar PDF de Exequibilidade:', err);
      alert('Ocorreu um erro ao gerar o documento PDF de Exequibilidade.');
    } finally {
      setGerandoPdf(false);
    }
  };

  // Pré-visualizar PDF no navegador
  const handleGerarPrevia = async () => {
    if (itensCalculados.length === 0) {
      setMensagemStatus('A licitação selecionada não possui itens cadastrados para exibir na exequibilidade.');
      setTimeout(() => setMensagemStatus(null), 3500);
      return;
    }
    setAbaVisualizacao('previa');
    setGerandoPdf(true);
    try {
      const dadosDoc = obterDadosDocumento();
      const blob = await gerarExequibilidadePdf(dadosDoc, timbrado);
      if (previaUrl) {
        URL.revokeObjectURL(previaUrl);
      }
      const url = URL.createObjectURL(blob);
      setPreviaUrl(url);
    } catch (err) {
      console.error('Erro ao gerar blob PDF:', err);
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-3.5 bg-[#0A1D37] text-white flex items-center justify-between border-b border-[#152B4D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Exequibilidade de Preços
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lei 14.133 • Art. 59
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Planilha oficial de composição de custos e margem líquida dos produtos arrematados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abas Alternar entre Formulário e Prévia */}
            <div className="flex items-center bg-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setAbaVisualizacao('formulario')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  abaVisualizacao === 'formulario'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Demonstrativo
              </button>
              <button
                type="button"
                onClick={handleGerarPrevia}
                disabled={itensCalculados.length === 0 || gerandoPdf}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  abaVisualizacao === 'previa'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white disabled:opacity-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Pré-visualizar PDF
              </button>
            </div>

            <button
              type="button"
              onClick={onFechar}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Notificação de Status */}
        {mensagemStatus && (
          <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-150 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensagemStatus}</span>
          </div>
        )}

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* SELETOR DE LICITAÇÃO & DADOS DO DOCUMENTO */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Dropdown de Licitação */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Licitação / Pregão de Origem *
                </label>
                <select
                  value={licitacaoIdSelecionada}
                  onChange={e => setLicitacaoIdSelecionada(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {licitacoes.map(lic => {
                    const seusItens = itens.filter(i => Number(i.licitacao_id) === Number(lic.id));
                    const ganhos = seusItens.filter(i => i.selecionado === true);
                    return (
                      <option key={lic.id} value={lic.id}>
                        {lic.processo_pregao} — {lic.orgao} ({ganhos.length} de {seusItens.length} itens com vezinho ✓)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Data de Emissão do Documento */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Data de Emissão
                </label>
                <input
                  type="date"
                  value={dataEmissao}
                  onChange={e => setDataEmissao(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                />
              </div>

              {/* Cidade de Emissão */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade de Emissão
                </label>
                <input
                  type="text"
                  value={cidadeEmissao}
                  onChange={e => setCidadeEmissao(e.target.value)}
                  placeholder="Ex: Timóteo - MG"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* SELETOR INTERATIVO DE ITENS: Apenas os com a marcação do vezinho (✓) no quadradinho */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Itens da Licitação (Somente os com vezinho ✓ são puxados):
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    itensGanhos.length > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  }`}>
                    {itensGanhos.length} de {itensLicitacao.length} marcados com vezinho (✓)
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (licAtual && onAlternarTodosItens) {
                        onAlternarTodosItens(licAtual.id, false);
                      }
                    }}
                    disabled={itensGanhos.length === 0}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                    title="Desmarcar todos os produtos para selecionar manualmente apenas os que você ganhou"
                  >
                    Desmarcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (licAtual && onAlternarTodosItens) {
                        onAlternarTodosItens(licAtual.id, true);
                      }
                    }}
                    disabled={itensGanhos.length === itensLicitacao.length}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-40"
                    title="Marcar todos os itens desta licitação com o vezinho (✓)"
                  >
                    ✓ Marcar Todos
                  </button>
                </div>
              </div>

              {/* Lista dos quadradinhos com checkbox para cada item da licitação */}
              {itensLicitacao.length === 0 ? (
                <p className="text-xs text-slate-500 py-1 italic">
                  Esta licitação ainda não possui produtos cadastrados.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                  {itensLicitacao.map(it => {
                    const estaMarcado = it.selecionado === true;

                    return (
                      <label
                        key={it.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          estaMarcado
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400/40'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={estaMarcado}
                          onChange={() => onAlternarSelecaoItem?.(it.id)}
                          className="mt-0.5 w-4 h-4 rounded text-emerald-600 accent-emerald-600 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                          title={
                            estaMarcado
                              ? 'Desmarcar produto (não puxar na Exequibilidade)'
                              : 'Marcar produto com vezinho (puxar na Exequibilidade)'
                          }
                        />
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="font-mono text-slate-600 dark:text-slate-400 shrink-0">
                              #{it.num_item}
                            </span>
                            <span
                              className={`truncate ${
                                estaMarcado
                                  ? 'text-slate-900 dark:text-white font-bold'
                                  : 'text-slate-500 dark:text-slate-400 line-through'
                              }`}
                            >
                              {it.descricao_curta}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            <span>
                              {it.quantidade} un. • {formatarMoeda(it.valor_unitario)}
                            </span>
                            {estaMarcado ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                ✓ Puxado
                              </span>
                            ) : (
                              <span className="text-slate-400">Não puxar</span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* VISUALIZAÇÃO: PRÉVIA DO DOCUMENTO (FOLHA A4 OFICIAL) OU FORMULÁRIO DOS QUADRINHOS */}
          {abaVisualizacao === 'previa' ? (
            <div className="space-y-4">
              {/* Barra de Ferramentas Superior da Prévia */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAbaVisualizacao('formulario')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>← Voltar aos Cálculos</span>
                  </button>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline">
                    Prévia Oficial da Folha de Exequibilidade ({itensCalculados.length} Itens)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGerarPrevia}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer px-2 py-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                  </button>
                  <button
                    type="button"
                    onClick={handleBaixarPdf}
                    disabled={gerandoPdf}
                    className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-950" />
                    <span>Baixar PDF</span>
                  </button>
                </div>
              </div>

              {/* Folha A4 Simulada (100% à prova de bloqueio por navegadores/iframes) */}
              <div className="bg-slate-200/90 dark:bg-slate-950 p-2 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-inner flex justify-center overflow-x-auto">
                <div
                  className="bg-white border-2 border-slate-300 rounded-xs shadow-xl p-6 sm:p-12 w-full max-w-[820px] text-slate-900 relative space-y-5"
                  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                >
                  {/* Marca d'água central translúcida */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
                    <div className="w-80 h-80 rounded-full border-[18px] border-[#0F2C59] flex items-center justify-center">
                      <span className="text-4xl font-black text-[#0F2C59]">GWS Global</span>
                    </div>
                  </div>

                  {/* 1. CABEÇALHO DO TIMBRADO */}
                  <div className="relative pb-3 border-b border-slate-200">
                    {timbrado.cabecalhoImagem && timbrado.cabecalhoImagem.startsWith('data:image') ? (
                      <img
                        src={timbrado.cabecalhoImagem}
                        alt="Cabeçalho Timbrado"
                        className="w-full object-contain max-h-24 mb-2"
                      />
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="flex items-center gap-3 shrink-0">
                          <LogoGwsGlobal className="w-11 h-11" />
                          <div>
                            <div className="text-base font-black text-[#0F2C59] tracking-tight">
                              GWS GLOBAL.net
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase">
                              Soluções em Licitações Públicas
                            </div>
                          </div>
                        </div>

                        <div className="text-center sm:text-right text-[10px] text-slate-600 leading-snug space-y-0.5">
                          <div>
                            <strong>Endereço:</strong> {timbrado.endereco || 'Rua Alpercata, nº 261, Bairro Ana Malaquias'}, {timbrado.cidadeEmissao || 'Timóteo - MG'}
                          </div>
                          <div>
                            <strong>CNPJ:</strong> {timbrado.cnpj || '53.080.207/0001-80'} • <strong>Insc. Est.:</strong> {timbrado.inscricaoEstadual || '47724530033'}
                          </div>
                          <div>
                            <strong>Contato:</strong> {timbrado.telefone || '(31) 98694-9588'} • <strong>E-mail:</strong> {timbrado.email || 'gwsgloballimitada@gmail.com'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. IDENTIFICAÇÃO DO CERTAME */}
                  <div className="space-y-0.5 text-slate-900">
                    <div className="text-xs font-bold text-[#0F2C59] tracking-wide">
                      {(licAtual?.modalidade || 'PREGÃO ELETRÔNICO').toUpperCase()} {licAtual?.processo_pregao || ''}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      ÓRGÃO: {(licAtual?.orgao || 'PREFEITURA MUNICIPAL').toUpperCase()}
                    </div>
                  </div>

                  {/* 3. FAIXA DE TÍTULO OFICIAL */}
                  <div className="bg-[#0F2C59] text-white py-2 px-3 rounded text-center">
                    <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase">
                      DECLARAÇÃO & DEMONSTRAÇÃO DE EXEQUIBILIDADE DE PREÇOS
                    </h3>
                    <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">
                      Fundamentação: Art. 59, III da Lei Federal nº 14.133/2021
                    </span>
                  </div>

                  {/* 4. PREÂMBULO JURÍDICO */}
                  <p className="text-[11px] text-justify leading-relaxed text-slate-800">
                    A empresa <strong>{timbrado.razaoSocial || 'GWS GLOBAL LIMITADA'}</strong>, inscrita no CNPJ sob o nº <strong>{timbrado.cnpj || '53.080.207/0001-80'}</strong>, sediada na {timbrado.endereco || 'Rua Alpercata, nº 261, Bairro Ana Malaquias'}, {timbrado.cidadeEmissao || 'Timóteo - MG'}, por intermédio de seu representante legal, apresenta tempestivamente a presente <strong>PLANILHA DE COMPOSIÇÃO DE CUSTOS E FORMAÇÃO DE PREÇOS</strong> dos itens arrematados/ganhos no certame em epígrafe, comprovando analiticamente a plena <strong>EXEQUIBILIDADE</strong> de sua proposta (art. 59, III da Lei Federal nº 14.133/2021). Demonstra-se que os preços pactuados cobrem com segurança todos os custos de aquisição, tributos e logística, assegurando a fiel entrega dos produtos.
                  </p>

                  {/* 5. CARDS ANALÍTICOS DE CADA PRODUTO */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-wider border-b border-slate-200 pb-1">
                      Composição Analítica dos Itens Arrematados ({itensCalculados.length}):
                    </div>

                    {itensCalculados.map(itCalc => {
                      const ehPositivo = itCalc.lucroLiquidoTotal >= 0;
                      return (
                        <div
                          key={itCalc.id}
                          className="border border-slate-300 rounded p-3 bg-slate-50/60 text-xs space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
                            <span className="font-bold text-slate-900">
                              Item #{itCalc.num_item} — {itCalc.descricao_curta}
                            </span>
                            <span className="font-mono text-[11px] text-slate-600">
                              Qtd: <strong>{itCalc.quantidade} un.</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Preço Ganho:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatarMoeda(itCalc.valor_ganho)}
                              </span>
                              <span className="text-[9px] text-slate-500 block">
                                Tot: {formatarMoeda(itCalc.totalGanho)}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px]">Custo Fornecedor:</span>
                              <span className="font-mono font-bold text-slate-700">
                                {formatarMoeda(itCalc.custo_fornecedor)}
                              </span>
                              <span className="text-[9px] text-slate-500 block">
                                Tot: {formatarMoeda(itCalc.totalCustoFornecedor)}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px]">Impostos ({itCalc.aliquota_imposto}%):</span>
                              <span className="font-mono font-bold text-rose-700">
                                -{formatarMoeda(itCalc.totalImposto)}
                              </span>
                              <span className="text-[9px] text-slate-500 block">
                                Frete: -{formatarMoeda(itCalc.outros_custos)}
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded border border-slate-200 text-right">
                              <span className="text-slate-500 block text-[10px]">Lucro Líquido:</span>
                              <span
                                className={`font-mono font-bold block ${
                                  ehPositivo ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {formatarMoeda(itCalc.lucroLiquidoTotal)}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  ehPositivo ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                Margem: {itCalc.margemLiquidaPct.toFixed(1)}% {ehPositivo ? '✓' : '⚠'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 6. SÍNTESE FINANCEIRA GLOBAL */}
                  <div className="border-2 border-emerald-600 bg-emerald-50/70 rounded p-3 text-xs">
                    <div className="font-bold text-emerald-950 uppercase text-[11px] mb-2 border-b border-emerald-200 pb-1 flex items-center justify-between">
                      <span>Síntese Consolidada de Exequibilidade</span>
                      <span className="text-emerald-800 font-bold">
                        {totais.ehExequivel ? '✓ PROPOSTA EXEQUÍVEL' : '⚠ ATENÇÃO'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-600 block text-[10px]">Faturamento Total:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatarMoeda(totais.totGanho)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">Custos Totais:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatarMoeda(totais.totFornec + totais.totOutros)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">Impostos Totais:</span>
                        <span className="font-mono font-bold text-rose-700">
                          -{formatarMoeda(totais.totImposto)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600 block text-[10px]">Lucro Líquido Global:</span>
                        <span className="font-mono font-black text-emerald-800 text-xs block">
                          {formatarMoeda(totais.totLucro)} ({totais.margemMedia.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 7. LOCAL E DATA POR EXTENSO */}
                  <div className="text-xs font-semibold text-slate-900 pt-1">
                    {cidadeEmissao}, {formatarDataExtensoPtBr(dataEmissao, cidadeEmissao)}
                  </div>

                  {/* 8. BLOCO DE ASSINATURA(S) */}
                  <div className="pt-4 border-t border-slate-200">
                    {timbrado.nomeRepresentante2?.trim() ? (
                      <div className="grid grid-cols-2 gap-8 text-center text-xs">
                        {/* Representante 1 */}
                        <div className="flex flex-col items-center">
                          {timbrado.assinaturaImagem && timbrado.assinaturaImagem.startsWith('data:image') && (
                            <img
                              src={timbrado.assinaturaImagem}
                              alt="Assinatura 1"
                              className="max-h-14 object-contain mb-1"
                            />
                          )}
                          <div className="w-48 border-t border-slate-800 mt-2 pt-1">
                            <div className="font-bold text-slate-900">
                              {(timbrado.nomeRepresentante || 'Gustavo Henrique').toUpperCase()}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {timbrado.cpfRepresentante ? `CPF: ${timbrado.cpfRepresentante}` : ''}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">
                              {timbrado.cargoRepresentante || 'Representante Legal'}
                            </div>
                          </div>
                        </div>

                        {/* Representante 2 */}
                        <div className="flex flex-col items-center">
                          {timbrado.assinaturaImagem2 && timbrado.assinaturaImagem2.startsWith('data:image') && (
                            <img
                              src={timbrado.assinaturaImagem2}
                              alt="Assinatura 2"
                              className="max-h-14 object-contain mb-1"
                            />
                          )}
                          <div className="w-48 border-t border-slate-800 mt-2 pt-1">
                            <div className="font-bold text-slate-900">
                              {timbrado.nomeRepresentante2.toUpperCase()}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {timbrado.cpfRepresentante2 ? `CPF: ${timbrado.cpfRepresentante2}` : ''}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">
                              {timbrado.cargoRepresentante2 || 'Representante Legal'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center text-xs">
                        {timbrado.assinaturaImagem && timbrado.assinaturaImagem.startsWith('data:image') && (
                          <img
                            src={timbrado.assinaturaImagem}
                            alt="Assinatura Representante"
                            className="max-h-14 object-contain mb-1"
                          />
                        )}
                        <div className="w-64 border-t border-slate-800 mt-2 pt-1">
                          <div className="font-bold text-slate-900">
                            {(timbrado.nomeRepresentante || 'Gustavo Henrique').toUpperCase()}
                          </div>
                          <div className="text-[10px] text-slate-600">
                            {timbrado.cpfRepresentante ? `CPF: ${timbrado.cpfRepresentante}` : ''}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            {timbrado.cargoRepresentante || 'Representante Legal'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 9. RODAPÉ OFICIAL COM PAGINAÇÃO */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                    <span>
                      {timbrado.razaoSocial || 'GWS GLOBAL LIMITADA'} • CNPJ: {timbrado.cnpj || '53.080.207/0001-80'}
                    </span>
                    <span>Documento Oficial de Exequibilidade • Lei 14.133/21</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* CARD SÍNTESE FINANCEIRO */}
              {itensCalculados.length > 0 && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    totais.ehExequivel
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-3 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Síntese Global de Exequibilidade ({itensCalculados.length} Itens Arrematados)
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        totais.ehExequivel
                          ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                          : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                      }`}
                    >
                      {totais.ehExequivel ? '✓ Proposta Totalmente Exequível' : '⚠ Atenção: Margem Global Negativa'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                      <span className="block text-[10px] font-semibold text-slate-500">
                        Faturamento Ganho:
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {formatarMoeda(totais.totGanho)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                      <span className="block text-[10px] font-semibold text-slate-500">
                        Custo Fornecedores:
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatarMoeda(totais.totFornec)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                      <span className="block text-[10px] font-semibold text-slate-500">
                        Total Impostos (-):
                      </span>
                      <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                        -{formatarMoeda(totais.totImposto)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                      <span className="block text-[10px] font-semibold text-slate-500">
                        Lucro Líquido & Margem:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-mono font-bold ${
                            totais.ehExequivel
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {formatarMoeda(totais.totLucro)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          ({totais.margemMedia.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LISTA DOS QUADRINHOS DE CUSTO POR PRODUTO GANHO */}
              {itensCalculados.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500 opacity-70" />
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    Nenhum produto marcado com o vezinho (✓) no quadradinho nesta licitação.
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Marque a caixinha com o vezinho (✓) acima ao lado de cada produto que sua empresa ganhou no pregão para calcular a exequibilidade e emitir o documento oficial.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Quadrinhos com os Cálculos de Cada Produto Ganho ({itensCalculados.length})
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Valores e custos editáveis em tempo real • Desmarque no quadradinho para remover
                    </span>
                  </div>

                  {itensCalculados.map(itCalc => {
                    const c = custosLocais[itCalc.id] || {
                      valor_ganho: itCalc.valor_ganho,
                      custo_fornecedor: itCalc.custo_fornecedor,
                      aliquota_imposto: itCalc.aliquota_imposto,
                      outros_custos: itCalc.outros_custos,
                    };
                    const ehPositivo = itCalc.lucroLiquidoTotal >= 0;

                    return (
                      <div
                        key={itCalc.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {/* Faixa superior do Quadrinho (Item, Descrição, Marca, Qtd) com quadradinho do vezinho */}
                        <div className="px-4 py-2.5 bg-[#0F2C59] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <label
                              className="flex items-center gap-1.5 cursor-pointer shrink-0"
                              title="Clique no quadradinho com o vezinho para desmarcar este item da Exequibilidade"
                            >
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => onAlternarSelecaoItem?.(itCalc.id)}
                                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                              />
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 shrink-0">
                                ITEM #{itCalc.num_item}
                              </span>
                            </label>
                            <span className="text-xs font-bold truncate">
                              {itCalc.descricao_curta}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 flex items-center gap-3 shrink-0">
                            <span>
                              Marca: <strong className="text-white">{itCalc.marca || 'Padrão'}</strong>
                            </span>
                            <span>
                              Qtd: <strong className="text-white">{itCalc.quantidade} un.</strong>
                            </span>
                          </div>
                        </div>

                        {/* Corpo do Quadrinho com 3 Seções: Entradas de Custo / Deduções / Resultado */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                          {/* Coluna 1: Campos de Entrada de Custos (da opção de porcentagem) */}
                          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                            {/* Valor Ganho Unitário */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Preço Ganho (Unit.) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={c.valor_ganho || ''}
                                  onChange={e =>
                                    handleChangeCusto(itCalc.id, 'valor_ganho', e.target.value)
                                  }
                                  className="w-full pl-7 pr-2 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                                  title="Preço arrematado unitário na licitação"
                                />
                              </div>
                              <span className="block text-[9px] text-slate-500 mt-0.5">
                                Tot: {formatarMoeda(itCalc.totalGanho)}
                              </span>
                            </div>

                            {/* Custo Fornecedor Unitário */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Custo Fornecedor *
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={c.custo_fornecedor || ''}
                                  onChange={e =>
                                    handleChangeCusto(itCalc.id, 'custo_fornecedor', e.target.value)
                                  }
                                  placeholder="0,00"
                                  className="w-full pl-7 pr-2 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                                  title="Preço de aquisição no fornecedor"
                                />
                              </div>
                              <span className="block text-[9px] text-slate-500 mt-0.5">
                                Tot: {formatarMoeda(itCalc.totalCustoFornecedor)}
                              </span>
                            </div>

                            {/* Alíquota de Imposto % */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Imposto (%)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={c.aliquota_imposto !== undefined ? c.aliquota_imposto : 10}
                                  onChange={e =>
                                    handleChangeCusto(itCalc.id, 'aliquota_imposto', e.target.value)
                                  }
                                  className="w-full pl-2 pr-5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                                  title="Percentual de impostos sobre faturamento"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                  %
                                </span>
                              </div>
                              <span className="block text-[9px] text-rose-600 mt-0.5">
                                -{formatarMoeda(itCalc.totalImposto)}
                              </span>
                            </div>

                            {/* Outros Custos / Frete */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Frete / Outros
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={c.outros_custos || ''}
                                  onChange={e =>
                                    handleChangeCusto(itCalc.id, 'outros_custos', e.target.value)
                                  }
                                  placeholder="0,00"
                                  className="w-full pl-7 pr-2 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                                  title="Custos adicionais com frete, logística e embalagem"
                                />
                              </div>
                              <span className="block text-[9px] text-slate-500 mt-0.5">
                                -{formatarMoeda(c.outros_custos || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Coluna 2: Demonstrativo de Resultados & Botão Salvar nos Itens */}
                          <div className="md:col-span-5 flex flex-col justify-between gap-2 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500 block text-[10px]">Lucro Líquido Unit:</span>
                                <span
                                  className={`font-mono font-bold ${
                                    ehPositivo ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {formatarMoeda(itCalc.lucroLiquidoUnit)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Lucro Líquido Total:</span>
                                <span
                                  className={`font-mono font-bold ${
                                    ehPositivo ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {formatarMoeda(itCalc.lucroLiquidoTotal)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Margem Líquida (%):</span>
                                <span
                                  className={`font-mono font-bold ${
                                    ehPositivo ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {itCalc.margemLiquidaPct.toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Parecer:</span>
                                <span
                                  className={`inline-block font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                    ehPositivo
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  }`}
                                >
                                  {ehPositivo ? '✓ Exequível' : '⚠ Prejuízo'}
                                </span>
                              </div>
                            </div>

                            {onAtualizarItem && (
                              <button
                                type="button"
                                onClick={() => handleSalvarCustosNoItem(itCalc)}
                                disabled={salvandoItem === itCalc.id}
                                className="w-full mt-1 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                title="Gravar estes parâmetros nos dados deste item no sistema"
                              >
                                {salvandoItem === itCalc.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Gravando...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Salvar custos no item
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé de Ações do Modal */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Documento emitido em conformidade com o Art. 59, III da Lei 14.133/2021.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {abaVisualizacao === 'formulario' && (
              <button
                type="button"
                onClick={handleGerarPrevia}
                disabled={itensCalculados.length === 0 || gerandoPdf}
                className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Pré-visualizar
              </button>
            )}

            <button
              type="button"
              onClick={handleBaixarPdf}
              disabled={itensCalculados.length === 0 || gerandoPdf}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              {gerandoPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Gerando Documento...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  Baixar PDF de Exequibilidade ({itensCalculados.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
