import React, { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { Licitacao, ItemLicitacao } from '../types';
import { formatarMoeda, valorPorExtensoPtBr } from '../utils/numberToWordsPtBr';
import { limparTextoDescricaoTecnica } from '../utils/sanitizarDescricao';

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
  onGerarPdf: () => void;
  onVisualizarPdf: () => void;
  onIrParaTimbrado?: () => void;
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
  onGerarPdf,
  onVisualizarPdf,
  onIrParaTimbrado,
}) => {
  const licitacaoAtual = licitacoes.find(l => l.id === licitacaoSelecionadaId) || licitacoes[0];
  const itensAtuais = useMemo(() => {
    if (!licitacaoAtual) return [];
    return itens
      .filter(i => i.licitacao_id === licitacaoAtual.id)
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
  const [notificacao, setNotificacao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Referência para rolar até o formulário ao clicar em editar
  const formularioItemRef = useRef<HTMLDivElement>(null);

  // Estado para indicar se estamos editando um item já existente
  const [idItemEditando, setIdItemEditando] = useState<number | null>(null);

  // Modal para editar apenas lances de um item existente na tabela
  const [itemEditandoLances, setItemEditandoLances] = useState<ItemLicitacao | null>(null);
  const [editLanceMinimo, setEditLanceMinimo] = useState<string>('');
  const [editLanceLote, setEditLanceLote] = useState<string>('');

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

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotificacao({ tipo: 'erro', texto: 'Selecione uma imagem válida no formato PNG ou JPG.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagemBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
      const itemExistente = itens.find(i => i.id === idItemEditando);
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
      licitacao_id: licitacaoAtual.id,
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
    setNotificacao({ tipo: 'sucesso', texto: `Item #${numItem} salvo com sucesso na licitação!` });
  };

  const handleInserirTopico = () => {
    setDescricaoTecnica(prev => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed}\n• ` : '• ';
    });
  };

  const handleOrganizarEmTopicos = () => {
    setDescricaoTecnica(prev => {
      if (!prev.trim()) return prev;
      const lines = prev.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return `• ${trimmed.replace(/^[•\-*]\s*/, '')}`;
        }
        return `• ${trimmed}`;
      });
      return formatted.join('\n');
    });
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
      {/* CARD 1: SELETOR DE LICITAÇÃO ATIVA */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              1. Selecione a Licitação para Montar a Proposta:
            </label>
            <div className="relative">
              <select
                value={licitacaoSelecionadaId ?? ''}
                onChange={e => onSelecionarLicitacao(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-2xs focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] cursor-pointer"
              >
                {licitacoes.map(lic => {
                  const itensDesta = itens.filter(i => i.licitacao_id === lic.id);
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

          {licitacaoAtual && (
            <div className="flex items-center gap-4 text-xs text-slate-600 border-l border-slate-200 pl-4">
              <div>
                <span className="font-semibold text-slate-900 block">Modalidade:</span>
                <span>{licitacaoAtual.modalidade}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Responsável:</span>
                <span className="font-semibold text-[#0F2C59] flex items-center gap-1">
                  👤 {licitacaoAtual.responsavel || 'Gustavo'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">No PDF da Proposta:</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {itensSelecionados.length} de {itensAtuais.length} itens
                </span>
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
        className={`bg-white border rounded-xl p-5 shadow-2xs transition-all ${
          idItemEditando
            ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
            : 'border-slate-200'
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleInserirTopico}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-[#0F2C59] border border-slate-300 rounded cursor-pointer transition-colors"
                  title="Inserir marcador de tópico na próxima linha"
                >
                  + Tópico (•)
                </button>
                <button
                  type="button"
                  onClick={handleOrganizarEmTopicos}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded cursor-pointer transition-colors"
                  title="Colocar marcador de tópico em cada linha escrita"
                >
                  Formatar Linhas em Tópicos
                </button>
              </div>
            </div>
            <textarea
              required
              rows={5}
              value={descricaoTecnica}
              onChange={e => setDescricaoTecnica(limparTextoDescricaoTecnica(e.target.value))}
              placeholder={"Exemplo em tópicos:\n• Processador: Intel Core i5 1335U (10 núcleos, até 4.60 GHz)\n• Memória RAM: 16 GB DDR4 3200MHz\n• Armazenamento: SSD 512 GB M.2 NVMe PCIe\n• Tela: 14\" WUXGA Antirreflexo\n• Garantia: 12 meses com atendimento on-site"}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 leading-relaxed font-sans"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-700">✓ Dica:</span>
              Você pode pular linhas e listar tópicos livremente. No PDF e no catálogo, eles sairão organizados com marcadores e recuos independentes.
            </p>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Foto do Produto (Catálogo)
              </label>
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-lg cursor-pointer text-xs text-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{imagemBase64 ? 'Alterar Foto' : 'Upload PNG/JPG'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* CAMPOS: LANCE MÍNIMO E LANCE LOTE (LANCES DE PREGÃO) */}
          {/* ==================================================================== */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <Target className="w-4 h-4 text-amber-600" />
              Lances de Pregão
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lance Mínimo (R$){' '}
                  <span className="text-slate-400 font-normal">
                    (Unitário mínimo aceito no pregão)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-semibold">
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
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lance Lote (R$){' '}
                  <span className="text-slate-400 font-normal">
                    (Total do lote mínimo aceito)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-semibold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={lanceLote}
                    onChange={e => setLanceLote(e.target.value)}
                    placeholder="Ex: 3000,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Imagem prévia caso exista */}
          {imagemBase64 && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-16 h-14 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                <img src={imagemBase64} alt="Prévia" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-xs">
                <span className="font-semibold text-slate-700 block">Foto do Produto Anexada</span>
                <span className="text-[11px] text-slate-500">
                  Será incluída no Catálogo de Especificações Técnicas do PDF oficial
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImagemBase64('')}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
              >
                Remover foto
              </button>
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
                  : 'bg-[#0F2C59] hover:bg-[#163c78]'
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Tabela de Pré-visualização da Proposta Comercial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Marque ou desmarque os itens para definir exatamente o que sairá no PDF após o pregão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onIrParaTimbrado && (
              <button
                onClick={onIrParaTimbrado}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Configurar Imagem do Cabeçalho e Rodapé"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                Papel Timbrado
              </button>
            )}
            <button
              onClick={onVisualizarPdf}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              Ver Modelo PDF
            </button>
            <button
              onClick={onGerarPdf}
              disabled={nenhumEstaSelecionado}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
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
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>{itensAtuais.length - itensSelecionados.length} item(ns) desmarcado(s):</strong> O PDF e o catálogo serão gerados apenas com os <strong>{itensSelecionados.length} itens marcados</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onAlternarTodosItens?.(licitacaoAtual.id, true)}
              className="text-xs font-bold text-[#0F2C59] hover:underline cursor-pointer self-start sm:self-auto shrink-0"
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
                <tr className="bg-[#0F2C59] text-white text-[11px] font-semibold uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-xs">
                {itensAtuais.map((it, idx) => {
                  const estaMarcado = it.selecionado !== false;

                  return (
                    <tr
                      key={it.id}
                      className={`transition-colors ${
                        idItemEditando === it.id
                          ? 'bg-amber-50 ring-2 ring-amber-400/60 font-medium'
                          : !estaMarcado
                          ? 'bg-slate-100/60 opacity-60 text-slate-500'
                          : idx % 2 === 1
                          ? 'bg-slate-50/70'
                          : 'bg-white'
                      } hover:bg-slate-100/80`}
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
                          className="w-4 h-4 rounded text-[#0F2C59] accent-[#0F2C59] border-slate-300 focus:ring-2 focus:ring-[#0F2C59] cursor-pointer"
                        />
                      </td>

                      <td className={`py-3 px-4 text-center font-mono font-medium tabular-nums ${!estaMarcado ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                        {it.num_item}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${!estaMarcado ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {it.descricao_curta}
                          </span>
                          {!estaMarcado && (
                            <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                              Não vai para o PDF
                            </span>
                          )}
                        </div>

                        {it.link_produto && (
                          <a
                            href={it.link_produto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:underline truncate max-w-xs block mt-0.5"
                          >
                            {it.link_produto}
                          </a>
                        )}

                        {/* Exibição discreta dos Lances Salvos em baixo do produto */}
                        {(it.lance_minimo !== undefined && it.lance_minimo > 0) ||
                        (it.lance_lote !== undefined && it.lance_lote > 0) ? (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400">Lances:</span>
                            {it.lance_minimo !== undefined && it.lance_minimo > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shadow-2xs"
                                title="Lance Mínimo Unitário Aceito"
                              >
                                <Target className="w-2.5 h-2.5 text-amber-600" />
                                Mín: {formatarMoeda(it.lance_minimo)}
                              </span>
                            ) : null}
                            {it.lance_lote !== undefined && it.lance_lote > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs"
                                title="Lance Mínimo por Lote"
                              >
                                <Layers className="w-2.5 h-2.5 text-blue-600" />
                                Lote: {formatarMoeda(it.lance_lote)}
                              </span>
                            ) : null}
                            {onAtualizarItem && (
                              <button
                                type="button"
                                onClick={() => abrirModalEditarLances(it)}
                                className="text-[10px] text-slate-400 hover:text-[#0F2C59] cursor-pointer ml-1 inline-flex items-center gap-0.5 hover:underline"
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
                              className="text-[10px] text-slate-400 hover:text-amber-700 cursor-pointer mt-1 inline-flex items-center gap-1 hover:underline"
                              title="Definir Lance Mínimo e Lance Lote para este item"
                            >
                              <Target className="w-2.5 h-2.5 text-amber-600" />
                              + definir lances
                            </button>
                          )
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">{it.marca}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums">{it.quantidade}</td>

                      {/* Valor Unitário com Lance Mínimo pequeno embaixo */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        <div>{formatarMoeda(it.valor_unitario)}</div>
                        {it.lance_minimo !== undefined && it.lance_minimo > 0 && (
                          <div
                            className="text-[10px] text-amber-700 font-semibold font-mono tracking-tight mt-0.5"
                            title="Lance Mínimo Unitário"
                          >
                            Mín: {formatarMoeda(it.lance_minimo)}
                          </div>
                        )}
                      </td>

                      {/* Valor Total com Lance Lote pequeno embaixo */}
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                        <div>{formatarMoeda(it.valor_total)}</div>
                        {it.lance_lote !== undefined && it.lance_lote > 0 && (
                          <div
                            className="text-[10px] text-blue-700 font-semibold font-mono tracking-tight mt-0.5"
                            title="Lance Total do Lote"
                          >
                            Lote: {formatarMoeda(it.lance_lote)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {it.caminho_imagem ? (
                          <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <ImageIcon className="w-3 h-3 mr-1" /> Com Foto
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Sem Foto</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
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
                <tr className="bg-slate-200/80 border-t-2 border-slate-300 font-bold">
                  <td colSpan={6} className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-800">
                    VALOR TOTAL DA PROPOSTA ({itensSelecionados.length} DE {itensAtuais.length} ITENS MARCADOS):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-[#0F2C59] tabular-nums">
                    {formatarMoeda(totalGeral)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4"></td>
                </tr>

                {/* LINHA DE VALOR POR EXTENSO */}
                <tr className="bg-slate-100 border-t border-slate-200 text-xs">
                  <td colSpan={9} className="py-3 px-4 text-slate-700">
                    <span className="font-bold text-slate-900 mr-2">Valor por Extenso (Itens Marcados):</span>
                    <span className="italic font-medium text-[#0F2C59]">{extensoGeral}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
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
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setItemEditandoLances(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              Lances de Pregão — Item #{itemEditandoLances.num_item}
            </h3>
            <p className="text-xs text-slate-600 mt-1 truncate">
              {itemEditandoLances.descricao_curta}
            </p>

            <form onSubmit={handleSalvarEdicaoLances} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Qtd.</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{itemEditandoLances.quantidade}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cotado</span>
                  <span className="text-xs font-bold text-[#0F2C59] font-mono">{formatarMoeda(itemEditandoLances.valor_total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lance Mínimo (R$) <span className="text-slate-400 font-normal">(Unitário)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-semibold">
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
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lance Lote (R$) <span className="text-slate-400 font-normal">(Total do Lote)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-semibold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editLanceLote}
                    onChange={e => setEditLanceLote(e.target.value)}
                    placeholder="Ex: 3000,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemEditandoLances(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0F2C59] hover:bg-[#163c78] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  Salvar Lances
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
