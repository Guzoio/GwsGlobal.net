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
} from 'lucide-react';
import { formatarMoeda } from '../utils/numberToWordsPtBr';

interface CalculadoraOfertaDrawerProps {
  aberto: boolean;
  onFechar: () => void;
}

export const CalculadoraOfertaDrawer: React.FC<CalculadoraOfertaDrawerProps> = ({
  aberto,
  onFechar,
}) => {
  // Inputs da calculadora
  const [quantidade, setQuantidade] = useState<number | string>(6);
  const [precoPrefeitura, setPrecoPrefeitura] = useState<number | string>(1543.0);
  const [precoFornecedor, setPrecoFornecedor] = useState<number | string>(959.0);
  const [margemLucro, setMargemLucro] = useState<number | string>(30);
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null);

  // Parsing numérico seguro
  const qtdNum = typeof quantidade === 'string' ? parseFloat(quantidade) || 0 : quantidade;
  const precoPrefeituraNum =
    typeof precoPrefeitura === 'string' ? parseFloat(precoPrefeitura) || 0 : precoPrefeitura;
  const precoFornecedorNum =
    typeof precoFornecedor === 'string' ? parseFloat(precoFornecedor) || 0 : precoFornecedor;
  const margemNum = typeof margemLucro === 'string' ? parseFloat(margemLucro) || 0 : margemLucro;

  // 1. VIABILIDADE PARA PARTICIPAR (% ESTIM.)
  // % ESTIM. = ((Preço Prefeitura - Preço Fornecedor) ÷ Preço Prefeitura) × 100
  // Até 30%: 🔴 NÃO PARTICIPAR | Acima de 30%: 🟢 PARTICIPAR
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop suave que mantém a página visível */}
      <div
        onClick={onFechar}
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity"
        aria-hidden="true"
      />

      {/* Painel lateral deslizante (Drawer) */}
      <div className="relative w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 animate-in slide-in-from-right duration-200 max-h-screen">
        {/* Cabeçalho */}
        <div className="px-5 py-3.5 bg-[#0F2C59] text-white flex items-center justify-between border-b border-[#1b3d75] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Calculadora de Ofertas
              </h2>
              <p className="text-[10px] text-slate-300">
                Viabilidade e limite de lance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={limparCampos}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Limpar campos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onFechar}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo limpo e compacto */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700">
          {/* CAMPOS DE ENTRADA (GRID COMPACTO) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Dados da Simulação
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Quantidade */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
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
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C59]"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">
                    un.
                  </span>
                </div>
              </div>

              {/* Margem desejada */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
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
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C59]"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              {/* Preço P/UN. da Prefeitura */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Preço Prefeitura / UN
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-[11px] font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precoPrefeitura}
                    onChange={e => setPrecoPrefeitura(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C59]"
                  />
                </div>
              </div>

              {/* Preço do Fornecedor */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Preço Fornecedor / UN
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-[11px] font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precoFornecedor}
                    onChange={e => setPrecoFornecedor(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C59]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 1. VIABILIDADE PARA PARTICIPAR */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                1. Viabilidade para Participar
              </span>
              <span className="text-[10px] text-slate-400">
                Pré-licitação
              </span>
            </div>

            {temDadosPrefeituraEFornecedor ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {/* Status Visual */}
                  <div>
                    {podeParticipar ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PARTICIPAR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-bold shadow-2xs">
                        <XCircle className="w-3.5 h-3.5" />
                        NÃO PARTICIPAR
                      </span>
                    )}
                  </div>

                  {/* % Estimado */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      % Estimado
                    </span>
                    <span
                      className={`text-lg font-black font-mono ${
                        podeParticipar ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {percentualEstimado.toFixed(2).replace('.', ',')}%
                      <span className="text-xs text-slate-500 font-medium ml-1">
                        ({Math.round(percentualEstimado)}%)
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100 text-slate-600">
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
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                2. Limite para o Lance
              </span>
              <span className="text-[10px] text-slate-400">
                Disputa (Margem {margemNum}%)
              </span>
            </div>

            {/* Limite por Unidade */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Limite de Oferta / Unidade
                </span>
                <div className="text-xl font-black font-mono text-white mt-0.5">
                  {formatarMoeda(limiteUnidade)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopiar(formatarMoeda(limiteUnidade), 'unidade')}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">
                  Limite de Oferta / Lote ({qtdNum} un.)
                </span>
                <div className="text-xl font-black font-mono text-amber-950 mt-0.5">
                  {formatarMoeda(limiteLote)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopiar(formatarMoeda(limiteLote), 'lote')}
                className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
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
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-500 block">Lucro / Unidade</span>
                <span className="text-xs font-bold font-mono text-emerald-700 block mt-0.5">
                  {formatarMoeda(lucroUnidade)}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-500 block">Lucro Total do Lote</span>
                <span className="text-xs font-bold font-mono text-emerald-700 block mt-0.5">
                  {formatarMoeda(lucroLote)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé simples */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400">
            Cálculo em tempo real
          </span>
          <button
            type="button"
            onClick={onFechar}
            className="px-3 py-1.5 bg-[#0F2C59] hover:bg-[#163c78] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
