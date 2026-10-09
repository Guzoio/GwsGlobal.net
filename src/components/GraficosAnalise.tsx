import React, { useState } from 'react';
import { ResumoMensal, ResumoModalidade, ResumoResponsavel, ResumoEstado } from '../utils/geoBrasil';
import { formatarMoeda } from '../utils/numberToWordsPtBr';
import { BarChart3, PieChart, TrendingUp, Calendar, Layers, User, Award } from 'lucide-react';

interface GraficosAnaliseProps {
  meses: ResumoMensal[];
  modalidades: ResumoModalidade[];
  responsaveis: ResumoResponsavel[];
  topEstados: ResumoEstado[];
}

export const GraficosAnalise: React.FC<GraficosAnaliseProps> = ({
  meses,
  modalidades,
  responsaveis,
  topEstados,
}) => {
  const [tipoPizza, setTipoPizza] = useState<'estados' | 'modalidades' | 'responsaveis'>('estados');
  const [metricaMensal, setMetricaMensal] = useState<'valores' | 'quantidade'>('valores');

  // Prepara dados para o gráfico mensal
  const maxValorMensal = Math.max(
    1,
    ...meses.map(m => Math.max(m.valorProposta, m.lucroLiquido))
  );
  const maxQtdMensal = Math.max(1, ...meses.map(m => m.totalLicitacoes));

  // Prepara dados para o gráfico de pizza/donut
  const dadosDonut = React.useMemo(() => {
    if (tipoPizza === 'estados') {
      const total = topEstados.reduce((acc, e) => acc + e.totalLicitacoes, 0) || 1;
      const cores = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#94a3b8'];
      return topEstados.slice(0, 5).map((e, idx) => ({
        label: `${e.nome} (${e.sigla})`,
        valor: e.totalLicitacoes,
        valorSecundario: e.totalValorProposta,
        pct: Math.round((e.totalLicitacoes / total) * 100),
        cor: cores[idx] || '#cbd5e1',
      }));
    }

    if (tipoPizza === 'modalidades') {
      const total = modalidades.reduce((acc, m) => acc + m.quantidade, 0) || 1;
      const cores = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
      return modalidades.map((m, idx) => ({
        label: m.modalidade,
        valor: m.quantidade,
        valorSecundario: m.valorTotal,
        pct: Math.round((m.quantidade / total) * 100),
        cor: cores[idx] || '#cbd5e1',
      }));
    }

    // Responsáveis
    const total = responsaveis.reduce((acc, r) => acc + r.quantidade, 0) || 1;
    const cores = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
    return responsaveis.map((r, idx) => ({
      label: r.responsavel,
      valor: r.quantidade,
      valorSecundario: r.lucroLiquido,
      pct: Math.round((r.quantidade / total) * 100),
      cor: cores[idx] || '#cbd5e1',
    }));
  }, [tipoPizza, topEstados, modalidades, responsaveis]);

  // Função para gerar arcos do donut SVG
  const slicesDonut = React.useMemo(() => {
    let acumulado = 0;
    const raio = 70;
    const centro = 100;
    const total = dadosDonut.reduce((acc, d) => acc + d.valor, 0) || 1;

    return dadosDonut.map(d => {
      const frac = d.valor / total;
      const angInicio = acumulado * 2 * Math.PI - Math.PI / 2;
      acumulado += frac;
      const angFim = acumulado * 2 * Math.PI - Math.PI / 2;

      // Coordenadas
      const x1 = centro + raio * Math.cos(angInicio);
      const y1 = centro + raio * Math.sin(angInicio);
      const x2 = centro + raio * Math.cos(angFim);
      const y2 = centro + raio * Math.sin(angFim);

      const largeArc = frac > 0.5 ? 1 : 0;
      const pathData =
        frac >= 0.999
          ? `M ${centro - raio},${centro} A ${raio},${raio} 0 1,0 ${centro + raio},${centro} A ${raio},${raio} 0 1,0 ${centro - raio},${centro}`
          : `M ${x1},${y1} A ${raio},${raio} 0 ${largeArc},1 ${x2},${y2}`;

      return {
        ...d,
        pathData,
      };
    });
  }, [dadosDonut]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Gráfico Mês a Mês (Evolução de Licitações e Lucros) */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        {/* Header com opções */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Desempenho Mês a Mês</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Evolução temporal dos processos, cotações e lucros apurados
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200/70 dark:border-white/5 text-[11px]">
            <button
              type="button"
              onClick={() => setMetricaMensal('valores')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricaMensal === 'valores'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              R$ Lucro
            </button>
            <button
              type="button"
              onClick={() => setMetricaMensal('quantidade')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricaMensal === 'quantidade'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Qtd Processos
            </button>
          </div>
        </div>

        {/* Gráfico de Barras Mensal */}
        {meses.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Nenhum dado mensal registrado ainda.
          </div>
        ) : (
          <div className="pt-6 pb-2">
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 px-2 border-b border-slate-200 dark:border-slate-800">
              {meses.map(m => {
                const alturaProposta =
                  metricaMensal === 'valores'
                    ? Math.max(8, (m.valorProposta / maxValorMensal) * 100)
                    : Math.max(8, (m.totalLicitacoes / maxQtdMensal) * 100);

                const alturaLucro =
                  metricaMensal === 'valores' && m.lucroLiquido > 0
                    ? Math.max(6, (m.lucroLiquido / maxValorMensal) * 100)
                    : 0;

                return (
                  <div
                    key={m.chave}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip Hover */}
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-slate-900/95 dark:bg-black text-white text-[10px] p-2 rounded-lg shadow-lg whitespace-nowrap border border-white/10">
                      <span className="font-bold block text-[11px] text-blue-300">
                        {m.label} ({m.totalLicitacoes} licitações)
                      </span>
                      <span>Proposta: {formatarMoeda(m.valorProposta)}</span>
                      {m.lucroLiquido > 0 && (
                        <span className="block text-emerald-300 font-semibold">
                          Lucro: {formatarMoeda(m.lucroLiquido)}
                        </span>
                      )}
                    </div>

                    {/* Barras Lado a Lado ou Sobrepostas */}
                    <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                      {/* Barra Valor / Processos */}
                      <div
                        className="w-1/2 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-300"
                        style={{ height: `${alturaProposta}%` }}
                      />

                      {/* Barra Lucro (se valores) */}
                      {metricaMensal === 'valores' && (
                        <div
                          className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                          style={{ height: `${alturaLucro}%` }}
                        />
                      )}
                    </div>

                    {/* Rótulo do Mês */}
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legenda do Gráfico Mensal */}
            <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                <span>
                  {metricaMensal === 'valores' ? 'Valor Proposto' : 'Total de Licitações'}
                </span>
              </div>
              {metricaMensal === 'valores' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span>Lucro Líquido</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Gráfico de Pizza / Donut (Distribuição) */}
      <div className="bg-white dark:bg-[#0A162B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        {/* Header com botões de alternância */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Gráfico de Distribuição</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Participação percentual por estado, modalidade ou operador
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200/70 dark:border-white/5 text-[11px]">
            <button
              type="button"
              onClick={() => setTipoPizza('estados')}
              className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                tipoPizza === 'estados'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Estados
            </button>
            <button
              type="button"
              onClick={() => setTipoPizza('modalidades')}
              className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                tipoPizza === 'modalidades'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Modalidade
            </button>
            <button
              type="button"
              onClick={() => setTipoPizza('responsaveis')}
              className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                tipoPizza === 'responsaveis'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Operador
            </button>
          </div>
        </div>

        {/* Donut SVG e Lista de Itens */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Donut SVG */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {slicesDonut.map((slice, i) => (
                <path
                  key={i}
                  d={slice.pathData}
                  fill="none"
                  stroke={slice.cor}
                  strokeWidth="26"
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-800 dark:text-white">
                {dadosDonut.reduce((acc, d) => acc + d.valor, 0)}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          {/* Legenda com Valores e Percentuais */}
          <div className="flex-1 w-full space-y-2">
            {dadosDonut.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.cor }}
                  />
                  <span className="font-bold text-slate-800 dark:text-white truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {item.valor} un
                  </span>
                  <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10">
                    {item.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
