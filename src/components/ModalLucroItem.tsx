import React, { useState, useEffect } from 'react';
import {
  X,
  Percent,
  TrendingUp,
  DollarSign,
  Calculator,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Receipt,
  Truck,
  Building2,
} from 'lucide-react';
import { ItemLicitacao } from '../types';
import { formatarMoeda } from '../utils/numberToWordsPtBr';

interface ModalLucroItemProps {
  item: ItemLicitacao | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvarLucro: (
    itemId: number,
    dados: {
      valor_ganho: number;
      custo_fornecedor: number;
      aliquota_imposto: number;
      outros_custos?: number;
    }
  ) => void;
}

export const ModalLucroItem: React.FC<ModalLucroItemProps> = ({
  item,
  aberto,
  onFechar,
  onSalvarLucro,
}) => {
  const [valorGanhoStr, setValorGanhoStr] = useState<string>('');
  const [custoFornecedorStr, setCustoFornecedorStr] = useState<string>('');
  const [aliquotaImpostoStr, setAliquotaImpostoStr] = useState<string>('10');
  const [outrosCustosStr, setOutrosCustosStr] = useState<string>('0');

  // Inicializa os campos sempre que o modal abre para um determinado item
  useEffect(() => {
    if (item && aberto) {
      // Inicia apenas com o valor ganho explicitamente salvo pelo usuário (não chuta valor aleatório)
      const ganhoSalvo =
        item.valor_ganho !== undefined && item.valor_ganho > 0
          ? item.valor_ganho.toString()
          : '';

      setValorGanhoStr(ganhoSalvo);
      setCustoFornecedorStr(
        item.custo_fornecedor !== undefined && item.custo_fornecedor > 0
          ? item.custo_fornecedor.toString()
          : ''
      );
      setAliquotaImpostoStr(
        item.aliquota_imposto !== undefined ? item.aliquota_imposto.toString() : '10'
      );
      setOutrosCustosStr(
        item.outros_custos !== undefined && item.outros_custos > 0
          ? item.outros_custos.toString()
          : '0'
      );
    }
  }, [item, aberto]);

  if (!aberto || !item) return null;

  const qtd = Math.max(1, item.quantidade || 1);
  const valorGanhoUnit = parseFloat(valorGanhoStr.replace(',', '.')) || 0;
  const custoFornecedorUnit = parseFloat(custoFornecedorStr.replace(',', '.')) || 0;
  const aliquotaImposto = parseFloat(aliquotaImpostoStr.replace(',', '.')) || 0;
  const outrosCustos = parseFloat(outrosCustosStr.replace(',', '.')) || 0;

  // Cálculos financeiros detalhados
  const totalGanho = valorGanhoUnit * qtd;
  const totalCustoFornecedor = custoFornecedorUnit * qtd;
  const totalImposto = totalGanho * (aliquotaImposto / 100);
  const lucroLiquidoTotal = totalGanho - totalCustoFornecedor - totalImposto - outrosCustos;
  const lucroLiquidoUnit = qtd > 0 ? lucroLiquidoTotal / qtd : 0;

  // Margem Líquida sobre o Valor Ganho (Faturamento)
  const margemLiquidaPct = totalGanho > 0 ? (lucroLiquidoTotal / totalGanho) * 100 : 0;

  // Rentabilidade / Markup sobre o Custo do Fornecedor
  const rentabilidadeCustoPct =
    totalCustoFornecedor > 0 ? (lucroLiquidoTotal / totalCustoFornecedor) * 100 : 0;

  const ehLucro = lucroLiquidoTotal >= 0;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarLucro(item.id, {
      valor_ganho: valorGanhoUnit,
      custo_fornecedor: custoFornecedorUnit,
      aliquota_imposto: aliquotaImposto,
      outros_custos: outrosCustos,
    });
    onFechar();
  };

  const handleRemoverCalculo = () => {
    onSalvarLucro(item.id, {
      valor_ganho: 0,
      custo_fornecedor: 0,
      aliquota_imposto: 10,
      outros_custos: 0,
    });
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 bg-[#0A1D37] text-white flex items-center justify-between border-b border-[#152B4D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Análise de Lucro Líquido & Margem
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Item #{item.num_item}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 truncate max-w-sm">
                {item.descricao_curta} • Qtd: {item.quantidade} un.
              </p>
            </div>
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

        {/* Corpo com scroll */}
        <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Card dos Inputs de Entrada */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-3.5">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Parâmetros da Negociação
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Campo 1: Valor Ganho na Licitação */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Valor Ganho (Unitário) *
                  </label>
                  <span className="text-[10px] text-slate-400">Preço arrematado</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorGanhoStr}
                    onChange={e => setValorGanhoStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Total Ganho:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatarMoeda(totalGanho)}
                  </span>
                </div>
              </div>

              {/* Campo 2: Custo do Fornecedor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Custo Fornecedor (Unit.)
                  </label>
                  <span className="text-[10px] text-slate-400">Preço de compra</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custoFornecedorStr}
                    onChange={e => setCustoFornecedorStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Total Fornecedor:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatarMoeda(totalCustoFornecedor)}
                  </span>
                </div>
              </div>

              {/* Campo 3: Alíquota de Imposto (% Editável, default 10%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Imposto sobre Venda (%)
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Editável (padrão 10%)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={aliquotaImpostoStr}
                    onChange={e => setAliquotaImpostoStr(e.target.value)}
                    placeholder="10"
                    className="w-full pl-3 pr-8 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    %
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Dedução Imposto:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    -{formatarMoeda(totalImposto)}
                  </span>
                </div>
              </div>

              {/* Campo 4: Outros Custos / Frete (R$) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Outros Custos / Frete (R$)
                  </label>
                  <span className="text-[10px] text-slate-400">Opcional</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={outrosCustosStr}
                    onChange={e => setOutrosCustosStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-lg font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Taxas / Logística:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    -{formatarMoeda(outrosCustos)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Principal de Resultado: Lucro Líquido e Porcentagem */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              ehLucro
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10 dark:border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Resultado da Operação
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ehLucro
                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                    : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                }`}
              >
                {ehLucro ? '✓ Lucrativo' : '⚠ Prejuízo'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Lucro Líquido Total */}
              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Lucro Líquido Total
                </span>
                <span
                  className={`text-lg sm:text-xl font-black font-mono tracking-tight block mt-0.5 ${
                    ehLucro
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatarMoeda(lucroLiquidoTotal)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatarMoeda(lucroLiquidoUnit)} / un.
                </span>
              </div>

              {/* Margem Líquida (%) */}
              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Margem Líquida (%)
                </span>
                <span
                  className={`text-lg sm:text-xl font-black font-mono tracking-tight block mt-0.5 ${
                    ehLucro
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {ehLucro ? '+' : ''}
                  {margemLiquidaPct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">s/ Ganho na Licitação</span>
              </div>

              {/* Rentabilidade s/ Custo (%) */}
              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Retorno s/ Custo (ROI)
                </span>
                <span
                  className={`text-lg sm:text-xl font-black font-mono tracking-tight block mt-0.5 ${
                    ehLucro
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {ehLucro ? '+' : ''}
                  {rentabilidadeCustoPct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">s/ Custo Fornecedor</span>
              </div>
            </div>

            {/* Demonstrativo Passo a Passo Resumido */}
            <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 text-[11px] font-mono space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>(+) Faturamento Ganho ({qtd} un. × {formatarMoeda(valorGanhoUnit)}):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatarMoeda(totalGanho)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>(-) Custo Fornecedor ({qtd} un. × {formatarMoeda(custoFornecedorUnit)}):</span>
                <span>-{formatarMoeda(totalCustoFornecedor)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>(-) Impostos ({aliquotaImposto.toFixed(1)}% sobre {formatarMoeda(totalGanho)}):</span>
                <span className="text-rose-600 dark:text-rose-400">
                  -{formatarMoeda(totalImposto)}
                </span>
              </div>
              {outrosCustos > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>(-) Outros Custos / Frete:</span>
                  <span>-{formatarMoeda(outrosCustos)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-black/10 dark:border-white/10 text-xs">
                <span>(=) Lucro Líquido Real:</span>
                <span
                  className={
                    ehLucro
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {formatarMoeda(lucroLiquidoTotal)} ({margemLiquidaPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-2 flex items-center justify-between gap-2">
            {(item.valor_ganho !== undefined && item.valor_ganho > 0) ||
            (item.custo_fornecedor !== undefined && item.custo_fornecedor > 0) ? (
              <button
                type="button"
                onClick={handleRemoverCalculo}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                Limpar Análise
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                Salvar Análise de Lucro
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
