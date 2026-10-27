import React, { useState } from 'react';
import {
  X,
  Calculator,
  Percent,
  TrendingUp,
  Package,
  Copy,
  Check,
  RotateCcw,
  Building2,
  DollarSign,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Minimize2,
} from 'lucide-react';
import { formatarMoeda, parseMoedaBrasileira, formatarNumeroPtBr } from '../utils/numberToWordsPtBr';

interface CalculadoraOfertaDrawerProps {
  aberto: boolean;
  onFechar: () => void;
  modoFixo?: boolean;
  minimizada?: boolean;
  onAlternarMinimizar?: () => void;
}

export const CalculadoraOfertaDrawer: React.FC<CalculadoraOfertaDrawerProps> = ({
  aberto,
  onFechar,
  modoFixo = false,
  minimizada = false,
  onAlternarMinimizar,
}) => {
  // Inputs da calculadora
  const [quantidade, setQuantidade] = useState<number | string>(6);
  const [precoPrefeitura, setPrecoPrefeitura] = useState<string>('1.543,00');
  const [precoFornecedor, setPrecoFornecedor] = useState<string>('959,00');
  const [margemLucro, setMargemLucro] = useState<number | string>(30);
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null);

  // Parsing numérico seguro com suporte a vírgula e ponto brasileiros
  const qtdNum = typeof quantidade === 'string' ? parseFloat(quantidade) || 0 : quantidade;
  const precoPrefeituraNum = parseMoedaBrasileira(precoPrefeitura) || 0;
  const precoFornecedorNum = parseMoedaBrasileira(precoFornecedor) || 0;
  const margemNum = typeof margemLucro === 'string' ? parseFloat(margemLucro) || 0 : margemLucro;

  // 1. VIABILIDADE PARA PARTICIPAR (% ESTIM.)
  // % ESTIM. = ((Preço Prefeitura - Preço Fornecedor) ÷ Preço Prefeitura) × 100
  // Até 30%: NÃO PARTICIPAR | Acima de 30%: PARTICIPAR
  const temDadosPrefeituraEFornecedor = precoPrefeituraNum > 0 && precoFornecedorNum > 0;
  const percentualEstimado = temDadosPrefeituraEFornecedor
    ? ((precoPrefeituraNum - precoFornecedorNum) / precoPrefeituraNum) * 100
    : 0;
  const podeParticipar = percentualEstimado > 30.0;

  // 2. LIMITE PARA O LANCE
  // Preço Fornecedor ÷ (1 - margem de lucro)
  const margemValida = margemNum >= 0 && margemNum < 100;
  const divisor = (100 - margemNum) / 100;
  const limiteUnidadeExato =
    margemValida && divisor > 0 && precoFornecedorNum > 0 ? precoFornecedorNum / divisor : 0;
  const limiteUnidade = Math.round(limiteUnidadeExato * 100) / 100;
  const limiteLote = limiteUnidade * Math.max(0, qtdNum);

  // Lucros
  const lucroUnidade = limiteUnidade > 0 ? Math.max(0, limiteUnidade - precoFornecedorNum) : 0;
  const lucroLote = lucroUnidade * Math.max(0, qtdNum);

  // Função para copiar valores
  const handleCopiar = (texto: string, rotulo: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoCampo(rotulo);
    setTimeout(() => setCopiadoCampo(null), 2000);
  };

  const limparCampos = () => {
    setQuantidade(1);
    setPrecoPrefeitura('');
    setPrecoFornecedor('');
    setMargemLucro(30);
  };

  if (!aberto) return null;

  // Se estiver em modo fixo e minimizada, exibe botão flutuante elegante na borda direita
  if (modoFixo && minimizada) {
    return (
      <button
        type="button"
        onClick={onAlternarMinimizar}
        className="fixed right-0 top-24 z-30 bg-[#0A1D37] hover:bg-[#122A4E] text-white py-3 px-3.5 rounded-l-2xl shadow-2xl border-l-2 border-y border-amber-400/60 flex items-center gap-2 cursor-pointer transition-all hover:pr-4 group animate-in slide-in-from-right duration-150"
        title="Abrir Calculadora de Limite de Oferta (Fixo)"
      >
        <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
          <Calculator className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold tracking-tight text-white hidden sm:inline">
          Calculadora de Oferta
        </span>
        <ChevronLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
      </button>
    );
  }

  return (
    <div
      className={
        modoFixo
          ? 'fixed top-16 right-0 bottom-0 z-30 w-full sm:w-[380px] lg:w-[400px] flex flex-col bg-white dark:bg-[#0A162B] shadow-2xl border-l border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-right duration-200'
          : 'fixed inset-0 z-50 overflow-hidden flex justify-end'
      }
    >
      {/* Backdrop suave APENAS quando não estiver em modo fixo */}
      {!modoFixo && (
        <div
          onClick={onFechar}
          className="fixed inset-0 bg-[#071326]/40 backdrop-blur-[2px] transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Painel lateral: no modo fixo ocupa a lateral; no modo modal ocupa o drawer com z-50 */}
      <div
        className={
          modoFixo
            ? 'w-full h-full flex flex-col min-h-0 overflow-hidden'
            : 'relative w-full sm:w-[400px] max-w-[400px] bg-white dark:bg-[#0A162B] shadow-2xl border-l border-slate-200/80 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-right duration-200 max-h-screen'
        }
      >
        {/* Cabeçalho Navy Moderno GWS */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#0A1D37] text-white flex items-center justify-between border-b border-[#152B4D] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shadow-2xs shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight truncate">
                  Calculadora de Ofertas
                </h2>
                {modoFixo && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Fixa
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-300 truncate">
                Viabilidade & limite de lance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={limparCampos}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Limpar campos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            {modoFixo ? (
              <button
                type="button"
                onClick={onAlternarMinimizar || onFechar}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                title="Recolher calculadora lateral"
              >
                <ChevronRight className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-[10px]">Recolher</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onFechar}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo limpo e compacto */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700 dark:text-slate-200">
          {/* CAMPOS DE ENTRADA (GRID COMPACTO) */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Dados da Simulação
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Quantidade */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    placeholder="Qtd"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-slate-400">
                    un.
                  </span>
                </div>
              </div>

              {/* Margem desejada */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Margem Desejada
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={margemLucro}
                    onChange={e => setMargemLucro(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              {/* Preço P/UN. da Prefeitura */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço Prefeitura / UN
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={precoPrefeitura}
                    onChange={e => setPrecoPrefeitura(e.target.value)}
                    onPaste={e => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      const parsed = parseMoedaBrasileira(text);
                      if (parsed !== undefined && !isNaN(parsed)) {
                        setPrecoPrefeitura(formatarNumeroPtBr(parsed));
                      } else {
                        setPrecoPrefeitura(text);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseMoedaBrasileira(precoPrefeitura);
                      if (parsed !== undefined && parsed > 0) {
                        setPrecoPrefeitura(formatarNumeroPtBr(parsed));
                      }
                    }}
                    placeholder="0,00"
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Preço do Fornecedor */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço Fornecedor / UN
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={precoFornecedor}
                    onChange={e => setPrecoFornecedor(e.target.value)}
                    onPaste={e => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      const parsed = parseMoedaBrasileira(text);
                      if (parsed !== undefined && !isNaN(parsed)) {
                        setPrecoFornecedor(formatarNumeroPtBr(parsed));
                      } else {
                        setPrecoFornecedor(text);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseMoedaBrasileira(precoFornecedor);
                      if (parsed !== undefined && parsed > 0) {
                        setPrecoFornecedor(formatarNumeroPtBr(parsed));
                      }
                    }}
                    placeholder="0,00"
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 1. VIABILIDADE PARA PARTICIPAR */}
          <div className="bg-white dark:bg-[#0E1F3D]/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                1. Viabilidade para Participar
              </span>
              <span className="text-[10px] text-slate-400">
                Pré-licitação
              </span>
            </div>

            {temDadosPrefeituraEFornecedor ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  {/* Status Visual */}
                  <div>
                    {podeParticipar ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PARTICIPAR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs">
                        <XCircle className="w-3.5 h-3.5" />
                        NÃO PARTICIPAR
                      </span>
                    )}
                  </div>

                  {/* % Estimado */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">
                      % Estimado
                    </span>
                    <span
                      className={`text-lg font-black font-mono tabular-nums ${
                        podeParticipar ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {percentualEstimado.toFixed(2).replace('.', ',')}%
                      <span className="text-xs text-slate-400 font-medium ml-1">
                        ({Math.round(percentualEstimado)}%)
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <span>Prefeitura: <strong>{formatarMoeda(precoPrefeituraNum)}</strong></span>
                  <span>Fornecedor: <strong>{formatarMoeda(precoFornecedorNum)}</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center py-1">
                Preencha o preço da prefeitura e do fornecedor para ver a viabilidade.
              </p>
            )}
          </div>

          {/* 2. LIMITE PARA O LANCE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                2. Limite para o Lance
              </span>
              <span className="text-[10px] text-slate-400">
                Disputa (Margem {margemNum}%)
              </span>
            </div>

            {/* Limite por Unidade */}
            <div className="bg-[#0A1D37] text-white rounded-2xl p-4 flex items-center justify-between border border-[#152B4D] shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Limite de Oferta / Unidade
                </span>
                <div className="text-xl font-black font-mono text-white mt-0.5 tabular-nums">
                  {formatarMoeda(limiteUnidade)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopiar(formatarMoeda(limiteUnidade), 'unidade')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Copiar valor unitário"
              >
                {copiadoCampo === 'unidade' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-400" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* Limite do Lote */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-900 dark:text-amber-300 tracking-wider block">
                  Limite de Oferta / Lote ({qtdNum} un.)
                </span>
                <div className="text-xl font-black font-mono text-amber-950 dark:text-amber-200 mt-0.5 tabular-nums">
                  {formatarMoeda(limiteLote)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopiar(formatarMoeda(limiteLote), 'lote')}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Copiar valor do lote"
              >
                {copiadoCampo === 'lote' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-950" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-950" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* Lucro Estimado no Limite */}
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Lucro / Unidade</span>
                <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5 tabular-nums">
                  {formatarMoeda(lucroUnidade)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Lucro Total do Lote</span>
                <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5 tabular-nums">
                  {formatarMoeda(lucroLote)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé simples */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400">
            Cálculo em tempo real
          </span>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 bg-[#0A1D37] hover:bg-[#122A4E] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
