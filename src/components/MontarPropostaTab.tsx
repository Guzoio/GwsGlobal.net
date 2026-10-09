import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers,
  Globe,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileDown,
  Eye,
  Check,
  AlertCircle,
  Plus,
  Sliders,
  Target,
  Edit3,
  X,
  CheckSquare,
  Square,
  Filter,
  Calendar,
  StickyNote,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Save,
  Loader2,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Calculator,
  Percent,
  ClipboardPaste,
  MapPin,
} from 'lucide-react';
import { Licitacao, ItemLicitacao } from '../types';
import { formatarMoeda, valorPorExtensoPtBr, converterParaFormatoInputDate } from '../utils/numberToWordsPtBr';
import { limparTextoDescricaoTecnica } from '../utils/sanitizarDescricao';
import { redimensionarEComprimirImagem } from '../utils/storage';
import { ModalLucroItem } from './ModalLucroItem';
import { ESTADOS_BRASIL_OPCOES, detectarEstado } from '../utils/geoBrasil';

interface MontarPropostaTabProps {
  licitacoes: Licitacao[];
  licitacaoSelecionadaId: number | null;
  onSelecionarLicitacao: (id: number) => void;
  itens: ItemLicitacao[];
  onAdicionarItem: (item: Omit<ItemLicitacao, 'id'>) => void;
  onAtualizarItem?: (item: ItemLicitacao) => void;
  onAlternarSelecaoItem?: (itemId: number) => void;
  onAlternarTodosItens?: (licId: number, selecionarTodos: boolean) => void;
  onExcluirItem: (itemId: number) => void;
  onAtualizarDataProposta?: (licId: number, novaData: string) => void;
  onGerarPdf: () => void;
  onVisualizarPdf: () => void;
  onIrParaTimbrado?: () => void;
  onForcarSalvarProposta?: (licId: number) => Promise<boolean>;
  onAtualizarUfLicitacao?: (licId: number, novaUf: string) => void;
}

export const MontarPropostaTab: React.FC<MontarPropostaTabProps> = ({
  licitacoes,
  licitacaoSelecionadaId,
  onSelecionarLicitacao,
  itens,
  onAdicionarItem,
  onAtualizarItem,
  onAlternarSelecaoItem,
  onAlternarTodosItens,
  onExcluirItem,
  onAtualizarDataProposta,
  onGerarPdf,
  onVisualizarPdf,
  onIrParaTimbrado,
  onForcarSalvarProposta,
  onAtualizarUfLicitacao,
}) => {
  const licitacaoAtual = licitacoes.find(l => l.id === licitacaoSelecionadaId) || licitacoes[0];
  const itensAtuais = useMemo(() => {
    if (!licitacaoAtual) return [];
    return itens
      .filter(i => Number(i.licitacao_id) === Number(licitacaoAtual.id))
      .sort((a, b) => a.num_item - b.num_item);
  }, [itens, licitacaoAtual]);

  // Itens selecionados para ir ao PDF (por padrão todos com selecionado !== false)
  const itensSelecionados = useMemo(() => {
    return itensAtuais.filter(i => i.selecionado !== false);
  }, [itensAtuais]);

  const todosEstaoSelecionados =
    itensAtuais.length > 0 && itensAtuais.every(i => i.selecionado !== false);
  const nenhumEstaSelecionado = itensSelecionados.length === 0;

  // Form State
  const proximoNumeroItem = (itensAtuais.length > 0 ? Math.max(...itensAtuais.map(i => i.num_item)) : 0) + 1;
  const [numItem, setNumItem] = useState<number>(proximoNumeroItem);
  const [linkProduto, setLinkProduto] = useState('');
  const [descricaoCurta, setDescricaoCurta] = useState('');
  const [descricaoTecnica, setDescricaoTecnica] = useState('');
  const [marca, setMarca] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [valorUnitario, setValorUnitario] = useState<number>(150.0);
  const [lanceMinimo, setLanceMinimo] = useState<string>('');
  const [lanceLote, setLanceLote] = useState<string>('');
  const [imagemBase64, setImagemBase64] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [mostrarObservacoes, setMostrarObservacoes] = useState<boolean>(false);
  const [novoLinkInput, setNovoLinkInput] = useState<string>('');
  const [mostrarCampoColarMultiplos, setMostrarCampoColarMultiplos] = useState<boolean>(false);
  const [modalObservacaoItem, setModalObservacaoItem] = useState<ItemLicitacao | null>(null);
  const [linkCopiadoFeedback, setLinkCopiadoFeedback] = useState<string | null>(null);
  const [notificacao, setNotificacao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [salvandoManual, setSalvandoManual] = useState<boolean>(false);
  const [ultimoSalvoTimestamp, setUltimoSalvoTimestamp] = useState<string | null>(null);
  const [feedbackSalvar, setFeedbackSalvar] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  // Forçar salvamento garantido na nuvem e no armazenamento local
  const handleForcarSalvar = async () => {
    if (!licitacaoAtual) return;
    setSalvandoManual(true);
    setFeedbackSalvar(null);
    try {
      if (onForcarSalvarProposta) {
        await onForcarSalvarProposta(licitacaoAtual.id);
      }
      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setUltimoSalvoTimestamp(agora);
      setFeedbackSalvar({
        tipo: 'sucesso',
        mensagem: `✓ Salvo com sucesso às ${agora}! Todos os ${itensAtuais.length} itens sincronizados para todos os computadores.`,
      });
      setNotificacao({
        tipo: 'sucesso',
        texto: `✓ Salvo com sucesso às ${agora}!`,
      });
    } catch (err: any) {
      const msgErro = err?.message || 'Falha de conexão';
      setFeedbackSalvar({
        tipo: 'erro',
        mensagem: `❌ Erro ao salvar: ${msgErro}. Verifique a conexão com a internet.`,
      });
      setNotificacao({
        tipo: 'erro',
        texto: '❌ Erro ao salvar.',
      });
    } finally {
      setSalvandoManual(false);
    }
  };

  // Copiar link para área de transferência com feedback visual temporário
  const handleCopiarLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setLinkCopiadoFeedback(url);
    setTimeout(() => {
      setLinkCopiadoFeedback(prev => (prev === url ? null : prev));
    }, 2200);
  };

  // Extrai nome amigável/domínio do link para exibição ultra-compacta
  const extrairDominio = (url: string): string => {
    try {
      const semProtocolo = url.trim();
      const urlObj = new URL(semProtocolo.startsWith('http') ? semProtocolo : `https://${semProtocolo}`);
      let host = urlObj.hostname.replace(/^www\./, '');
      if (host.length > 22) {
        host = host.slice(0, 20) + '…';
      }
      return host;
    } catch {
      return 'Link';
    }
  };

  // Extrai lista única de links válidos da string armazenada
  const extrairListaLinks = (texto?: string): string[] => {
    if (!texto) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = texto.match(urlRegex);
    if (!matches) return [];
    return Array.from(new Set(matches.map(l => l.trim())));
  };

  const linksAtuaisFormulario = useMemo(() => {
    return extrairListaLinks(observacoes);
  }, [observacoes]);

  const handleAdicionarLink = () => {
    let linkLimpo = novoLinkInput.trim();
    if (!linkLimpo) return;
    if (!linkLimpo.startsWith('http://') && !linkLimpo.startsWith('https://')) {
      linkLimpo = `https://${linkLimpo}`;
    }
    const linksExistentes = extrairListaLinks(observacoes);
    if (!linksExistentes.includes(linkLimpo)) {
      const novos = [...linksExistentes, linkLimpo];
      setObservacoes(novos.join('\n'));
    }
    setNovoLinkInput('');
  };

  const handleRemoverLink = (linkParaRemover: string) => {
    const linksExistentes = extrairListaLinks(observacoes);
    const filtrados = linksExistentes.filter(l => l !== linkParaRemover);
    setObservacoes(filtrados.join('\n'));
  };

  const handleColarMultiplosLinks = (textoColado: string) => {
    const linksDetectados = extrairListaLinks(textoColado);
    if (linksDetectados.length === 0) return;
    const linksExistentes = extrairListaLinks(observacoes);
    const combinados = Array.from(new Set([...linksExistentes, ...linksDetectados]));
    setObservacoes(combinados.join('\n'));
  };

  // Referência para rolar até o formulário ao clicar em editar
  const formularioItemRef = useRef<HTMLDivElement>(null);

  // Estado para indicar se estamos editando um item já existente
  const [idItemEditando, setIdItemEditando] = useState<number | null>(null);

  // Modal para editar apenas lances de um item existente na tabela
  const [itemEditandoLances, setItemEditandoLances] = useState<ItemLicitacao | null>(null);
  const [editLanceMinimo, setEditLanceMinimo] = useState<string>('');
  const [editLanceLote, setEditLanceLote] = useState<string>('');

  // Modal para análise de Lucro Líquido & Margem (%) de um item da proposta
  const [itemParaCalculoLucro, setItemParaCalculoLucro] = useState<ItemLicitacao | null>(null);

  const handleSalvarLucroItem = (
    itemId: number,
    dados: {
      valor_ganho: number;
      custo_fornecedor: number;
      aliquota_imposto: number;
      outros_custos?: number;
    }
  ) => {
    const itemExistente = itens.find(i => Number(i.id) === Number(itemId));
    if (itemExistente && onAtualizarItem) {
      onAtualizarItem({
        ...itemExistente,
        valor_ganho: dados.valor_ganho > 0 ? dados.valor_ganho : undefined,
        custo_fornecedor: dados.custo_fornecedor > 0 ? dados.custo_fornecedor : undefined,
        aliquota_imposto: dados.aliquota_imposto,
        outros_custos: dados.outros_custos,
      });
      setNotificacao({
        tipo: 'sucesso',
        texto: `Análise de lucro do Item #${itemExistente.num_item} salva com sucesso!`,
      });
    }
  };

  // Cancelar a edição do item e restaurar formulário para cadastro
  const handleCancelarEdicao = () => {
    setIdItemEditando(null);
    const proxNum = (itensAtuais.length > 0 ? Math.max(...itensAtuais.map(i => i.num_item)) : 0) + 1;
    setNumItem(proxNum);
    setLinkProduto('');
    setDescricaoCurta('');
    setDescricaoTecnica('');
    setMarca('');
    setQuantidade(1);
    setValorUnitario(150.0);
    setLanceMinimo('');
    setLanceLote('');
    setImagemBase64('');
    setObservacoes('');
    setNovoLinkInput('');
    setMostrarCampoColarMultiplos(false);
    setMostrarObservacoes(false);
  };

  // Carregar os dados completos do item no formulário para edição
  const handleCarregarItemParaEdicao = (item: ItemLicitacao) => {
    setIdItemEditando(item.id);
    setNumItem(item.num_item);
    setLinkProduto(item.link_produto || '');
    setDescricaoCurta(item.descricao_curta);
    setDescricaoTecnica(item.descricao_tecnica);
    setMarca(item.marca);
    setQuantidade(item.quantidade);
    setValorUnitario(item.valor_unitario);
    setLanceMinimo(item.lance_minimo !== undefined ? String(item.lance_minimo) : '');
    setLanceLote(item.lance_lote !== undefined ? String(item.lance_lote) : '');
    setImagemBase64(item.caminho_imagem || '');
    setObservacoes(item.observacoes || '');
    setNovoLinkInput('');
    setMostrarCampoColarMultiplos(false);
    const temLinks = extrairListaLinks(item.observacoes).length > 0;
    setMostrarObservacoes(temLinks);

    // Rola suavemente até o formulário
    formularioItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setNotificacao({
      tipo: 'sucesso',
      texto: `Item #${item.num_item} carregado no formulário acima. Faça as alterações e clique em "Salvar Alterações".`,
    });
  };

  // Real-time item calculation
  const valorTotalLinha = (quantidade || 0) * (valorUnitario || 0);

  // O total da proposta e o valor por extenso refletem os itens selecionados para o PDF
  const totalGeral = useMemo(() => {
    return itensSelecionados.reduce((acc, it) => acc + (it.valor_total || it.quantidade * it.valor_unitario), 0);
  }, [itensSelecionados]);

  const extensoGeral = useMemo(() => {
    return valorPorExtensoPtBr(totalGeral);
  }, [totalGeral]);

  // Função centralizada para processar e comprimir qualquer imagem (upload ou colada via Ctrl+V)
  const processarArquivoImagem = async (file: File | Blob) => {
    try {
      const compactBase64 = await redimensionarEComprimirImagem(file);
      setImagemBase64(compactBase64);
      return true;
    } catch {
      return new Promise<boolean>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagemBase64(reader.result as string);
          resolve(true);
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
      });
    }
  };

  // Image upload handler para arquivos selecionados do computador
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotificacao({ tipo: 'erro', texto: 'Selecione uma imagem válida no formato PNG ou JPG.' });
      return;
    }

    await processarArquivoImagem(file);
    setNotificacao({ tipo: 'sucesso', texto: 'Foto do produto anexada com sucesso!' });
    // Reseta o input para permitir selecionar o mesmo arquivo novamente se necessário
    e.target.value = '';
  };

  // Handler para colar imagem diretamente da Área de Transferência (botão Colar)
  const handleColarImagemClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find(t => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            await processarArquivoImagem(blob);
            setNotificacao({
              tipo: 'sucesso',
              texto: 'Foto do produto colada com sucesso da área de transferência!',
            });
            return;
          }
        }
        setNotificacao({
          tipo: 'erro',
          texto: 'Nenhuma imagem copiada encontrada na área de transferência. Copie uma imagem primeiro (com botão direito "Copiar Imagem" ou PrintScreen / Snipping Tool / Ctrl+C).',
        });
      } else {
        setNotificacao({
          tipo: 'erro',
          texto: 'Use o atalho Ctrl+V no teclado para colar a imagem diretamente nesta tela.',
        });
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setNotificacao({
        tipo: 'erro',
        texto: 'Para colar direto pelo navegador, você também pode pressionar Ctrl+V no teclado.',
      });
    }
  };

  // Listener global de teclado (Ctrl + V) para colar imagem de forma instantânea
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await processarArquivoImagem(file);
            setNotificacao({
              tipo: 'sucesso',
              texto: 'Foto do produto colada com sucesso via atalho Ctrl+V!',
            });
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Form submit (salva novo item ou atualiza item existente)
  const handleSalvarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licitacaoAtual) {
      setNotificacao({ tipo: 'erro', texto: 'Selecione uma licitação válida.' });
      return;
    }
    if (!descricaoCurta.trim() || !descricaoTecnica.trim() || !marca.trim()) {
      setNotificacao({ tipo: 'erro', texto: 'Preencha a descrição curta, técnica e marca do produto.' });
      return;
    }

    const descTecnicaLimpa = limparTextoDescricaoTecnica(descricaoTecnica).trim();

    const parsedMinimo = lanceMinimo ? parseFloat(lanceMinimo.replace(',', '.')) : undefined;
    const parsedLote = lanceLote ? parseFloat(lanceLote.replace(',', '.')) : undefined;
    const qtdInteira = Math.max(1, Math.round(Number(quantidade)));
    const vUnit = Number(valorUnitario);

    // SE ESTIVER EM MODO DE EDIÇÃO DE ITEM EXISTENTE:
    if (idItemEditando) {
      const itemExistente = itens.find(i => Number(i.id) === Number(idItemEditando));
      if (itemExistente && onAtualizarItem) {
        onAtualizarItem({
          ...itemExistente,
          num_item: numItem,
          link_produto: linkProduto.trim() || undefined,
          descricao_curta: descricaoCurta.trim(),
          descricao_tecnica: descTecnicaLimpa,
          marca: marca.trim(),
          quantidade: qtdInteira,
          valor_unitario: vUnit,
          valor_total: qtdInteira * vUnit,
          caminho_imagem: imagemBase64 || undefined,
          lance_minimo: parsedMinimo !== undefined && !isNaN(parsedMinimo) ? parsedMinimo : undefined,
          lance_lote: parsedLote !== undefined && !isNaN(parsedLote) ? parsedLote : undefined,
          observacoes: observacoes.trim() || undefined,
        });

        setNotificacao({
          tipo: 'sucesso',
          texto: `Item #${numItem} atualizado com sucesso na proposta!`,
        });
        handleCancelarEdicao();
        return;
      }
    }

    // MODO DE CRIAÇÃO DE NOVO ITEM:
    onAdicionarItem({
      licitacao_id: Number(licitacaoAtual.id),
      num_item: numItem,
      link_produto: linkProduto.trim() || undefined,
      descricao_curta: descricaoCurta.trim(),
      descricao_tecnica: descTecnicaLimpa,
      marca: marca.trim(),
      quantidade: qtdInteira,
      valor_unitario: vUnit,
      valor_total: qtdInteira * vUnit,
      caminho_imagem: imagemBase64 || undefined,
      lance_minimo: parsedMinimo !== undefined && !isNaN(parsedMinimo) ? parsedMinimo : undefined,
      lance_lote: parsedLote !== undefined && !isNaN(parsedLote) ? parsedLote : undefined,
      selecionado: true, // Por padrão quando salvar proposta esse quadrinho já vem marcado
      observacoes: observacoes.trim() || undefined,
    });

    // Reset for next item
    setNumItem(numItem + 1);
    setLinkProduto('');
    setDescricaoCurta('');
    setDescricaoTecnica('');
    setMarca('');
    setLanceMinimo('');
    setLanceLote('');
    setImagemBase64('');
    setObservacoes('');
    setMostrarObservacoes(false);
    setNotificacao({ tipo: 'sucesso', texto: `Item #${numItem} salvo com sucesso na licitação!` });
  };

  const abrirModalEditarLances = (item: ItemLicitacao) => {
    setItemEditandoLances(item);
    setEditLanceMinimo(item.lance_minimo !== undefined ? String(item.lance_minimo) : '');
    setEditLanceLote(item.lance_lote !== undefined ? String(item.lance_lote) : '');
  };

  const handleSalvarEdicaoLances = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditandoLances || !onAtualizarItem) return;

    const parsedMinimo = editLanceMinimo ? parseFloat(editLanceMinimo.replace(',', '.')) : undefined;
    const parsedLote = editLanceLote ? parseFloat(editLanceLote.replace(',', '.')) : undefined;

    const itemAtualizado: ItemLicitacao = {
      ...itemEditandoLances,
      lance_minimo: parsedMinimo !== undefined && !isNaN(parsedMinimo) ? parsedMinimo : undefined,
      lance_lote: parsedLote !== undefined && !isNaN(parsedLote) ? parsedLote : undefined,
    };

    onAtualizarItem(itemAtualizado);
    setItemEditandoLances(null);
    setNotificacao({
      tipo: 'sucesso',
      texto: `Lances do Item #${itemEditandoLances.num_item} atualizados com sucesso!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificacao && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200 ${
            notificacao.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificacao.tipo === 'sucesso' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notificacao.texto}</span>
          </div>
          <button
            onClick={() => setNotificacao(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CARD 1: SELETOR DE LICITAÇÃO ATIVA & DATA DA PROPOSTA */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Seletor de Licitação */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              1. Selecione a Licitação para Montar a Proposta:
            </label>
            <div className="relative">
              <select
                value={licitacaoSelecionadaId ?? ''}
                onChange={e => onSelecionarLicitacao(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
              >
                {licitacoes.map(lic => {
                  const itensDesta = itens.filter(i => Number(i.licitacao_id) === Number(lic.id));
                  const itensMarcados = itensDesta.filter(i => i.selecionado !== false);
                  return (
                    <option key={lic.id} value={lic.id}>
                      Processo: {lic.processo_pregao} | {lic.orgao} ({lic.modalidade}) • [{itensMarcados.length}/{itensDesta.length} itens marcados]
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Campo de Data Específica Desta Licitação para o PDF */}
          {licitacaoAtual && (
            <div className="w-full lg:w-56 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-2.5 shrink-0">
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Data no Documento PDF:
              </label>
              <input
                type="date"
                value={converterParaFormatoInputDate(licitacaoAtual.data_proposta || licitacaoAtual.data_cadastro)}
                onChange={e => onAtualizarDataProposta?.(licitacaoAtual.id, e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                title="Data específica impressa na proposta desta licitação"
              />
            </div>
          )}

          {licitacaoAtual && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-3 lg:pt-0 lg:pl-4">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Modalidade:</span>
                <span>{licitacaoAtual.modalidade}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Responsável:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  👤 {licitacaoAtual.responsavel || 'Gustavo'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">No PDF da Proposta:</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {itensSelecionados.length} de {itensAtuais.length} itens
                </span>
              </div>

              {/* Seletor de UF (Estado da Licitação) */}
              <div className="flex flex-col items-start gap-1 shrink-0">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Estado da Licitação (UF):</span>
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={licitacaoAtual.uf || detectarEstado(licitacaoAtual.orgao)}
                    onChange={e => {
                      const novaUf = e.target.value;
                      if (onAtualizarUfLicitacao) {
                        onAtualizarUfLicitacao(licitacaoAtual.id, novaUf);
                      }
                      setNotificacao({
                        tipo: 'sucesso',
                        texto: `Estado da licitação atualizado para ${novaUf}! Refletido na aba de Análise.`,
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-xs font-mono"
                    title="Selecione o estado (UF) desta prefeitura/órgão para mapeamento nas análises e mapa do Brasil"
                  >
                    {ESTADOS_BRASIL_OPCOES.map(est => (
                      <option key={est.sigla} value={est.sigla}>
                        {est.nome}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-700/60 shadow-2xs">
                    {licitacaoAtual.uf || detectarEstado(licitacaoAtual.orgao)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* CARD 2: FORMULÁRIO DE CADASTRO OU EDIÇÃO COMPLETA DE ITEM */}
      {/* ==================================================================== */}
      <div
        ref={formularioItemRef}
        className={`bg-white dark:bg-[#0A162B] border rounded-2xl p-6 shadow-xs transition-all ${
          idItemEditando
            ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
            : 'border-slate-200/80 dark:border-slate-800'
        }`}
      >
        <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {idItemEditando ? (
                <Edit3 className="w-4 h-4 text-amber-600" />
              ) : (
                <Layers className="w-4 h-4 text-[#0F2C59]" />
              )}
              <h3 className="text-sm font-bold text-slate-900">
                {idItemEditando
                  ? `Editar Item #${numItem} do Catálogo e Proposta`
                  : 'Adicionar Novo Item ao Catálogo e Proposta'}
              </h3>
              {idItemEditando && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                  Editando Item
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {idItemEditando
                ? 'Altere quaisquer dados deste item (descrição, fotos, marca, valores) e clique em Salvar Alterações.'
                : 'Cadastre as especificações do produto, valores de cotação e lances de pregão.'}
            </p>
          </div>

          {idItemEditando && (
            <button
              type="button"
              onClick={handleCancelarEdicao}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSalvarItem} className="space-y-4">
          {/* Linha 1: Item nº, Marca, Link */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Nº *
              </label>
              <input
                type="number"
                min="1"
                required
                value={numItem}
                onChange={e => setNumItem(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 font-bold"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marca / Modelo do Fabricante *
              </label>
              <input
                type="text"
                required
                value={marca}
                onChange={e => setMarca(e.target.value)}
                placeholder="Ex: Dell Latitude 5440 / Lenovo T14"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link da Loja / Fabricante (Opcional)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={linkProduto}
                  onChange={e => setLinkProduto(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20"
                />
              </div>
            </div>
          </div>

          {/* Descrição Curta (Para a Tabela de Proposta do Edital) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição Curta do Produto (Para a Tabela do Anexo I) *
            </label>
            <input
              type="text"
              required
              value={descricaoCurta}
              onChange={e => setDescricaoCurta(e.target.value)}
              placeholder="Ex: Notebook Corporativo Core i7 16GB SSD 512GB 14 FHD Windows 11 Pro"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20"
            />
          </div>

          {/* Descrição Técnica Formatada (Para o Catálogo Ilustrativo) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Descrição Técnica Completa (Para o Catálogo Ilustrativo e Termo de Referência) *
              </label>
              <button
                type="button"
                onClick={() => setMostrarObservacoes(prev => !prev)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  mostrarObservacoes || linksAtuaisFormulario.length > 0
                    ? 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
                title="Abrir diretório de links reservas deste item"
              >
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Links Reservas</span>
                {linksAtuaisFormulario.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-tight">
                    {linksAtuaisFormulario.length}
                  </span>
                )}
              </button>
            </div>
            <textarea
              required
              rows={5}
              value={descricaoTecnica}
              onChange={e => setDescricaoTecnica(limparTextoDescricaoTecnica(e.target.value))}
              placeholder="Cole aqui a descrição técnica formatada do produto para o catálogo ilustrado..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 leading-relaxed font-sans"
            />

            {/* Diretório de Links Reservas */}
            {mostrarObservacoes && (
              <div className="bg-slate-50 border border-blue-200 rounded-xl p-3.5 mt-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-200">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Diretório de Links Reservas (Fornecedores & Cotações)
                  </span>
                </div>

                {/* Barra de Adicionar Link */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={novoLinkInput}
                      onChange={e => setNovoLinkInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAdicionarLink();
                        }
                      }}
                      placeholder="Cole aqui o link do fornecedor reserva (ex: Mercado Livre, Amazon, Distribuidor...)"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 shadow-2xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAdicionarLink}
                    disabled={!novoLinkInput.trim()}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarCampoColarMultiplos(prev => !prev)}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Colar vários links de uma vez"
                  >
                    {mostrarCampoColarMultiplos ? 'Fechar lote' : 'Colar em lote'}
                  </button>
                </div>

                {/* Área opcional para colar múltiplos links de uma só vez */}
                {mostrarCampoColarMultiplos && (
                  <div className="mb-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg animate-in fade-in duration-150">
                    <span className="text-[11px] font-bold text-blue-950 block mb-1">
                      Colar múltiplos links de uma vez:
                    </span>
                    <textarea
                      rows={3}
                      placeholder={"Cole aqui uma lista de links (um por linha ou no meio de um texto):\nhttps://produto.mercadolivre.com.br/...\nhttps://kabum.com.br/..."}
                      onChange={e => {
                        handleColarMultiplosLinks(e.target.value);
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-md focus:outline-hidden text-slate-900 font-mono shadow-2xs"
                    />
                    <span className="text-[10px] text-blue-700 mt-1 block">
                      Os links serão identificados e adicionados imediatamente à lista abaixo.
                    </span>
                  </div>
                )}

                {/* Lista de Links Catalogados no Diretório */}
                {linksAtuaisFormulario.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs bg-white border border-dashed border-slate-200 rounded-lg">
                    Nenhum link reserva adicionado ainda. Cole uma URL acima para catalogar fornecedores reservas.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {linksAtuaisFormulario.map((link, idx) => {
                      const dominio = extrairDominio(link);
                      const foiCopiado = linkCopiadoFeedback === link;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 shrink-0">
                              {dominio}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono truncate max-w-sm sm:max-w-md" title={link}>
                              {link}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Abrir link no navegador"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-500" />
                              <span>Abrir</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopiarLink(link)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded border cursor-pointer flex items-center gap-1 transition-colors ${
                                foiCopiado
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold'
                                  : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'
                              }`}
                              title="Copiar link"
                            >
                              {foiCopiado ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoverLink(link)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer ml-0.5"
                              title="Remover este link do diretório"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cálculos por Linha e Imagem */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade (Inteiro) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantidade}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  const novaQtd = isNaN(val) ? 1 : Math.max(1, val);
                  setQuantidade(novaQtd);
                  if (lanceMinimo && !lanceLote) {
                    const numMin = parseFloat(lanceMinimo.replace(',', '.'));
                    if (!isNaN(numMin)) {
                      setLanceLote((numMin * novaQtd).toFixed(2));
                    }
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Unitário (R$) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={valorUnitario}
                onChange={e => setValorUnitario(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Valor Total por Linha (Cálculo)
              </label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold font-mono tabular-nums text-slate-800 text-xs">
                {formatarMoeda(valorTotalLinha)}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Foto do Produto (Catálogo)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <label
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer text-xs text-slate-700 dark:text-slate-300 transition-colors"
                  title="Selecionar imagem salva no computador"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">{imagemBase64 ? 'Arquivo' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleColarImagemClipboard}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 rounded-lg cursor-pointer text-xs font-semibold text-[#0F2C59] dark:text-blue-300 transition-colors"
                  title="Colar imagem diretamente da área de transferência (Ctrl+V) sem precisar salvar arquivo no computador"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Colar</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* CAMPOS: LANCE MÍNIMO E LANCE LOTE (LANCES DE PREGÃO) */}
          {/* ==================================================================== */}
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-700/40 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-400">
              <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Lances de Pregão
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lance Mínimo (R$){' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (Unitário mínimo aceito no pregão)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-mono font-semibold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={lanceMinimo}
                    onChange={e => {
                      const val = e.target.value;
                      setLanceMinimo(val);
                      if (val && !lanceLote) {
                        const num = parseFloat(val.replace(',', '.'));
                        if (!isNaN(num) && quantidade > 0) {
                          setLanceLote((num * quantidade).toFixed(2));
                        }
                      }
                    }}
                    placeholder="Ex: 120,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lance Lote (R$){' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (Total do lote mínimo aceito)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-mono font-semibold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={lanceLote}
                    onChange={e => setLanceLote(e.target.value)}
                    placeholder="Ex: 3000,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Imagem prévia caso exista */}
          {imagemBase64 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-16 h-14 bg-slate-200 dark:bg-slate-800 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                  <img src={imagemBase64} alt="Prévia" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 block">Foto do Produto Anexada</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Será incluída no Catálogo de Especificações Técnicas do PDF oficial. Você também pode colar outra com <strong>Ctrl+V</strong> a qualquer momento.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleColarImagemClipboard}
                  className="px-2.5 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Substituir foto colando da área de transferência (Ctrl+V)"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Colar outra
                </button>
                <button
                  type="button"
                  onClick={() => setImagemBase64('')}
                  className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 font-medium cursor-pointer transition-colors"
                >
                  Remover foto
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2">
            {idItemEditando && (
              <button
                type="button"
                onClick={handleCancelarEdicao}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className={`px-5 py-2.5 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                idItemEditando
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#0F2C59] hover:bg-[#163c78] dark:bg-blue-600 dark:hover:bg-blue-500'
              }`}
            >
              {idItemEditando ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Salvar Alterações do Item #{numItem}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-amber-400" />
                  Salvar Item na Licitação
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ==================================================================== */}
      {/* TABELA DE PRÉ-VISUALIZAÇÃO DA PROPOSTA EM TEMPO REAL COM QUADRINHOS */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Tabela de Pré-visualização da Proposta Comercial
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Marque ou desmarque os itens para definir exatamente o que sairá no PDF após o pregão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onIrParaTimbrado && (
              <button
                onClick={onIrParaTimbrado}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Configurar Imagem do Cabeçalho e Rodapé"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                Papel Timbrado
              </button>
            )}
            <button
              onClick={onVisualizarPdf}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              Ver Modelo PDF
            </button>
            <button
              onClick={onGerarPdf}
              disabled={nenhumEstaSelecionado}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider active:scale-98"
              title={
                nenhumEstaSelecionado
                  ? 'Marque ao menos um item no quadrinho para gerar o PDF'
                  : `Gerar PDF com os ${itensSelecionados.length} itens marcados`
              }
            >
              <FileDown className="w-3.5 h-3.5 text-slate-950" />
              GERAR E BAIXAR DOCUMENTO EM PDF ({itensSelecionados.length})
            </button>
          </div>
        </div>

        {/* Barra de Aviso quando houver itens desmarcados (após o pregão) */}
        {itensAtuais.length > 0 && itensSelecionados.length < itensAtuais.length && (
          <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>
                <strong>{itensAtuais.length - itensSelecionados.length} item(ns) desmarcado(s):</strong> O PDF e o catálogo serão gerados apenas com os <strong>{itensSelecionados.length} itens marcados</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onAlternarTodosItens?.(licitacaoAtual.id, true)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer self-start sm:self-auto shrink-0"
            >
              ✓ Marcar todos novamente
            </button>
          </div>
        )}

        {itensAtuais.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Nenhum item cadastrado para esta licitação ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A1D37] text-white text-[11px] font-semibold uppercase tracking-wider">
                  {/* QUADRINHO GERAL: SELECIONAR TODOS */}
                  <th className="py-3 px-3 text-center w-12" title="Marcar / Desmarcar todos os itens para o PDF">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <input
                        type="checkbox"
                        checked={todosEstaoSelecionados}
                        onChange={e => onAlternarTodosItens?.(licitacaoAtual.id, e.target.checked)}
                        title={
                          todosEstaoSelecionados
                            ? 'Desmarcar todos os itens'
                            : 'Marcar todos os itens para o PDF'
                        }
                        className="w-4 h-4 rounded text-[#0F2C59] accent-[#0F2C59] bg-white border-slate-300 focus:ring-2 focus:ring-amber-400 cursor-pointer"
                      />
                      <span className="text-[9px] font-bold tracking-tight uppercase text-white/90">
                        PDF
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center w-14">Item</th>
                  <th className="py-3 px-4">Descrição do Produto</th>
                  <th className="py-3 px-4">Marca / Modelo</th>
                  <th className="py-3 px-4 text-center w-16">Qtd.</th>
                  <th className="py-3 px-4 text-right w-32">Valor Unit.</th>
                  <th className="py-3 px-4 text-right w-36">Valor Total</th>
                  <th className="py-3 px-4 text-center w-16">Catálogo</th>
                  <th className="py-3 px-4 text-right w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {itensAtuais.map((it, idx) => {
                  const estaMarcado = it.selecionado !== false;

                  return (
                    <tr
                      key={it.id}
                      className={`transition-colors ${
                        idItemEditando === it.id
                          ? 'bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-400/60 dark:ring-amber-500/60 font-medium'
                          : !estaMarcado
                          ? 'bg-slate-100/60 dark:bg-slate-950/40 opacity-60 text-slate-500 dark:text-slate-400'
                          : idx % 2 === 1
                          ? 'bg-slate-50/70 dark:bg-[#0c1424]'
                          : 'bg-white dark:bg-slate-900'
                      } hover:bg-slate-100/80 dark:hover:bg-[#162238]`}
                    >
                      {/* QUADRINHO INDIVIDUAL POR ITEM */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={estaMarcado}
                          onChange={() => onAlternarSelecaoItem?.(it.id)}
                          title={
                            estaMarcado
                              ? 'Desmarcar item (não irá para o PDF da proposta)'
                              : 'Marcar item para incluir no PDF da proposta'
                          }
                          className="w-4 h-4 rounded text-[#0F2C59] accent-[#0F2C59] border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#0F2C59] cursor-pointer"
                        />
                      </td>

                      <td className={`py-3 px-4 text-center font-mono font-medium tabular-nums ${!estaMarcado ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-500 dark:text-slate-400'}`}>
                        {it.num_item}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${!estaMarcado ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                            {it.descricao_curta}
                          </span>
                          {!estaMarcado && (
                            <span className="inline-flex items-center text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 px-1.5 py-0.2 rounded shrink-0">
                              Não vai para o PDF
                            </span>
                          )}
                        </div>

                        {it.link_produto && (
                          <a
                            href={it.link_produto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs block mt-0.5"
                          >
                            {it.link_produto}
                          </a>
                        )}

                        {/* Exibição discreta dos Lances Salvos em baixo do produto */}
                        {(it.lance_minimo !== undefined && it.lance_minimo > 0) ||
                        (it.lance_lote !== undefined && it.lance_lote > 0) ? (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">Lances:</span>
                            {it.lance_minimo !== undefined && it.lance_minimo > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded shadow-2xs"
                                title="Lance Mínimo Unitário Aceito"
                              >
                                <Target className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                Mín: {formatarMoeda(it.lance_minimo)}
                              </span>
                            ) : null}
                            {it.lance_lote !== undefined && it.lance_lote > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded shadow-2xs"
                                title="Lance Mínimo por Lote"
                              >
                                <Layers className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                Lote: {formatarMoeda(it.lance_lote)}
                              </span>
                            ) : null}
                            {onAtualizarItem && (
                              <button
                                type="button"
                                onClick={() => abrirModalEditarLances(it)}
                                className="text-[10px] text-slate-400 hover:text-[#0F2C59] dark:hover:text-blue-400 cursor-pointer ml-1 inline-flex items-center gap-0.5 hover:underline"
                                title="Editar Lances"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                editar
                              </button>
                            )}
                          </div>
                        ) : (
                          onAtualizarItem && (
                            <button
                              type="button"
                              onClick={() => abrirModalEditarLances(it)}
                              className="text-[10px] text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 cursor-pointer mt-1 inline-flex items-center gap-1 hover:underline"
                              title="Definir Lance Mínimo e Lance Lote para este item"
                            >
                              <Target className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                              + definir lances
                            </button>
                          )
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{it.marca}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-800 dark:text-slate-200">{it.quantidade}</td>

                      {/* Valor Unitário com Lance Mínimo pequeno embaixo */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                        <div>{formatarMoeda(it.valor_unitario)}</div>
                        {it.lance_minimo !== undefined && it.lance_minimo > 0 && (
                          <div
                            className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold font-mono tracking-tight mt-0.5"
                            title="Lance Mínimo Unitário"
                          >
                            Mín: {formatarMoeda(it.lance_minimo)}
                          </div>
                        )}
                      </td>

                      {/* Valor Total com Lance Lote pequeno embaixo e Badge de Lucro se houver */}
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        <div>{formatarMoeda(it.valor_total)}</div>
                        {it.lance_lote !== undefined && it.lance_lote > 0 && (
                          <div
                            className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold font-mono tracking-tight mt-0.5"
                            title="Lance Total do Lote"
                          >
                            Lote: {formatarMoeda(it.lance_lote)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {it.caminho_imagem ? (
                          <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                            <ImageIcon className="w-3 h-3 mr-1" /> Com Foto
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Sem Foto</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* BOTÃO DE PORCENTAGEM (%) PARA CÁLCULO DE LUCRO LÍQUIDO */}
                          <button
                            type="button"
                            onClick={() => setItemParaCalculoLucro(it)}
                            className={`p-1.5 rounded transition-all cursor-pointer ${
                              it.custo_fornecedor && it.custo_fornecedor > 0
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 ring-1 ring-emerald-300 dark:ring-emerald-700 font-bold'
                                : 'text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={
                              it.custo_fornecedor && it.custo_fornecedor > 0
                                ? `Lucro Configurado: Ver/Editar Análise de Lucro Líquido do Item #${it.num_item}`
                                : `Calcular Lucro Líquido & Margem do Item #${it.num_item} (%)`
                            }
                          >
                            <Percent className="w-3.5 h-3.5" />
                          </button>

                          {(() => {
                            const linksDoItem = extrairListaLinks(it.observacoes);
                            if (linksDoItem.length === 0) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => setModalObservacaoItem(it)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title={`Diretório de Links Reservas do Item #${it.num_item} (${linksDoItem.length} link${linksDoItem.length > 1 ? 's' : ''})`}
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>
                            );
                          })()}
                          {onAtualizarItem && (
                            <button
                              type="button"
                              onClick={() => handleCarregarItemParaEdicao(it)}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                idItemEditando === it.id
                                  ? 'text-amber-800 bg-amber-200/80 ring-1 ring-amber-400 font-bold'
                                  : 'text-slate-500 hover:text-[#0F2C59] hover:bg-slate-100'
                              }`}
                              title={`Editar dados completos do Item #${it.num_item} (descrição, fotos, marca, valores)`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (idItemEditando === it.id) {
                                handleCancelarEdicao();
                              }
                              onExcluirItem(it.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Remover Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* LINHA DE DESTAQUE: TOTAL GERAL DOS ITENS MARCADOS */}
                <tr className="bg-slate-200/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 font-bold">
                  <td colSpan={6} className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    VALOR TOTAL DA PROPOSTA ({itensSelecionados.length} DE {itensAtuais.length} ITENS MARCADOS):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-[#0F2C59] dark:text-blue-400 tabular-nums">
                    {formatarMoeda(totalGeral)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4"></td>
                </tr>

                {/* LINHA DE VALOR POR EXTENSO */}
                <tr className="bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <td colSpan={9} className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white mr-2">Valor por Extenso (Itens Marcados):</span>
                    <span className="italic font-medium text-[#0F2C59] dark:text-blue-300">{extensoGeral}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ==================================================================== */}
        {/* RODAPÉ DA PRÉ-VISUALIZAÇÃO: BOTÃO MAIOR DE SALVAR NO CANTO DIREITO   */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Mensagem de Confirmação ou Erro */}
          <div className="flex-1 w-full sm:w-auto">
            {feedbackSalvar?.tipo === 'sucesso' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-lg shadow-2xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackSalvar.mensagem}</span>
              </div>
            )}
            {feedbackSalvar?.tipo === 'erro' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-300 px-3.5 py-2 rounded-lg shadow-2xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{feedbackSalvar.mensagem}</span>
              </div>
            )}
          </div>

          {/* Botão no Canto Direito Inferior Só Escrito "Salvar" */}
          <div className="flex items-center justify-end w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleForcarSalvar}
              disabled={salvandoManual}
              className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              title="Salvar alterações na nuvem e no armazenamento local"
            >
              {salvandoManual ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-200" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL RÁPIDO PARA EDITAR / AJUSTAR LANCES DE UM ITEM EXISTENTE */}
      {/* ==================================================================== */}
      {itemEditandoLances && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setItemEditandoLances(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setItemEditandoLances(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Lances de Pregão — Item #{itemEditandoLances.num_item}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
              {itemEditandoLances.descricao_curta}
            </p>

            <form onSubmit={handleSalvarEdicaoLances} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Qtd.</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{itemEditandoLances.quantidade}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Total Cotado</span>
                  <span className="text-xs font-bold text-[#0F2C59] dark:text-blue-400 font-mono">{formatarMoeda(itemEditandoLances.valor_total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lance Mínimo (R$) <span className="text-slate-400 dark:text-slate-500 font-normal">(Unitário)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-mono font-semibold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editLanceMinimo}
                    onChange={e => {
                      const val = e.target.value;
                      setEditLanceMinimo(val);
                      if (val && !editLanceLote) {
                        const num = parseFloat(val.replace(',', '.'));
                        if (!isNaN(num) && itemEditandoLances.quantidade > 0) {
                          setEditLanceLote((num * itemEditandoLances.quantidade).toFixed(2));
                        }
                      }
                    }}
                    placeholder="Ex: 120,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lance Lote (R$) <span className="text-slate-400 dark:text-slate-500 font-normal">(Total do Lote)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-mono font-semibold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editLanceLote}
                    onChange={e => setEditLanceLote(e.target.value)}
                    placeholder="Ex: 3000,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemEditandoLances(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0F2C59] hover:bg-[#163c78] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  Salvar Lances
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DIRETÓRIO DE LINKS RESERVAS (USO INTERNO)                     */}
      {/* ==================================================================== */}
      {modalObservacaoItem && (() => {
        const linksDoItem = extrairListaLinks(modalObservacaoItem.observacoes);

        const handleCopiarTodos = () => {
          if (linksDoItem.length === 0) return;
          const texto = linksDoItem.join('\n');
          handleCopiarLink(texto);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Diretório de Links Reservas</span>
                      <span className="text-[10px] text-blue-800 bg-blue-100/70 border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                        Item #{modalObservacaoItem.num_item}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Fornecedores e distribuidores alternativos catalogados para este item
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalObservacaoItem(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Item de Referência:
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {modalObservacaoItem.descricao_curta}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Marca: {modalObservacaoItem.marca} • Qtd: {modalObservacaoItem.quantidade} • Valor Unit: {formatarMoeda(modalObservacaoItem.valor_unitario)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                      Links Catalogados ({linksDoItem.length}):
                    </span>
                    {linksDoItem.length > 1 && (
                      <button
                        type="button"
                        onClick={handleCopiarTodos}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                        title="Copiar todos os links da lista"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar todos os links</span>
                      </button>
                    )}
                  </div>

                  {linksDoItem.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                      Nenhum link reserva foi catalogado para este item ainda.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {linksDoItem.map((link, idx) => {
                        const dominio = extrairDominio(link);
                        const foiCopiado = linkCopiadoFeedback === link;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-200 hover:border-blue-300 rounded-lg shadow-2xs transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {dominio}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm" title={link}>
                                  {link}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Abrir link no navegador"
                              >
                                <span>Abrir</span>
                                <ExternalLink className="w-3 h-3 text-blue-500" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopiarLink(link)}
                                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border cursor-pointer flex items-center gap-1.5 transition-colors ${
                                  foiCopiado
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold'
                                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'
                                }`}
                                title="Copiar URL"
                              >
                                {foiCopiado ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const it = modalObservacaoItem;
                    setModalObservacaoItem(null);
                    handleCarregarItemParaEdicao(it);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                  Gerenciar Links no Formulário
                </button>
                <button
                  type="button"
                  onClick={() => setModalObservacaoItem(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Modal de Análise de Lucro Líquido & Margem (%) */}
      <ModalLucroItem
        item={itemParaCalculoLucro}
        aberto={Boolean(itemParaCalculoLucro)}
        onFechar={() => setItemParaCalculoLucro(null)}
        onSalvarLucro={handleSalvarLucroItem}
      />
    </div>
  );
};
