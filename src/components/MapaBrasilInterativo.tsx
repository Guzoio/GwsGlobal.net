import React, { useState } from 'react';
import { EstadoBrasilGeo, ESTADOS_BRASIL_GEO } from '../data/estadosBrasilSvg';
import { ResumoEstado } from '../utils/geoBrasil';
import { formatarMoeda } from '../utils/numberToWordsPtBr';
import { MapPin, Building2, TrendingUp, DollarSign, X } from 'lucide-react';

interface MapaBrasilInterativoProps {
  estadosResumo: ResumoEstado[];
  estadoSelecionado: string | null;
  onSelecionarEstado: (sigla: string | null) => void;
}

export const MapaBrasilInterativo: React.FC<MapaBrasilInterativoProps> = ({
  estadosResumo,
  estadoSelecionado,
  onSelecionarEstado,
}) => {
  const [hoveredEstado, setHoveredEstado] = useState<ResumoEstado | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cria mapa rápido de dados por sigla
  const resumoMap = React.useMemo(() => {
    const map = new Map<string, ResumoEstado>();
    estadosResumo.forEach(e => map.set(e.sigla, e));
    return map;
  }, [estadosResumo]);

  // Calcula maior quantidade para escala de cor
  const maxLicitacoes = React.useMemo(() => {
    let max = 1;
    estadosResumo.forEach(e => {
      if (e.totalLicitacoes > max) max = e.totalLicitacoes;
    });
    return max;
  }, [estadosResumo]);

  // Cor do estado baseada no volume de licitações
  const getCorEstado = (sigla: string, total: number) => {
    const isSelecionado = estadoSelecionado === sigla;
    if (isSelecionado) {
      return 'fill-blue-600 dark:fill-blue-500 stroke-white stroke-[2.5] drop-shadow-md';
    }

    if (total === 0) {
      return 'fill-slate-100 hover:fill-blue-100 dark:fill-slate-800/60 dark:hover:fill-slate-700/80 stroke-slate-300 dark:stroke-slate-700/80 stroke-[1]';
    }

    // Escala de intensidade
    const pct = total / maxLicitacoes;
    if (pct >= 0.7) {
      return 'fill-blue-700 hover:fill-blue-800 dark:fill-blue-500 dark:hover:fill-blue-400 stroke-blue-900 dark:stroke-blue-200 stroke-[1.5]';
    }
    if (pct >= 0.35) {
      return 'fill-blue-500 hover:fill-blue-600 dark:fill-blue-600 dark:hover:fill-blue-500 stroke-blue-700 dark:stroke-blue-300 stroke-[1.2]';
    }
    return 'fill-blue-300 hover:fill-blue-400 dark:fill-blue-800 dark:hover:fill-blue-700 stroke-blue-500 dark:stroke-blue-400 stroke-[1]';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const estadoAtivoInfo = estadoSelecionado ? resumoMap.get(estadoSelecionado) : null;

  return (
    <div className="relative bg-white dark:bg-[#0A162B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between overflow-hidden">
      {/* Header do Mapa */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Mapa do Brasil • Licitações por Estado</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Passe o mouse para ver detalhes ou clique no estado para filtrar as análises
          </p>
        </div>

        {estadoSelecionado && (
          <button
            type="button"
            onClick={() => onSelecionarEstado(null)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/80 dark:border-blue-700/50 transition-colors cursor-pointer"
          >
            <span>Filtro: {estadoAtivoInfo?.nome || estadoSelecionado}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* SVG Interativo do Mapa do Brasil */}
      <div
        className="relative my-2 w-full flex items-center justify-center min-h-[380px] sm:min-h-[440px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredEstado(null)}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full max-w-[540px] max-h-[500px] h-auto transition-transform duration-200"
          role="img"
          aria-label="Mapa do Brasil com distribuição de licitações"
        >
          {ESTADOS_BRASIL_GEO.map(geo => {
            const resumo = resumoMap.get(geo.sigla);
            const total = resumo ? resumo.totalLicitacoes : 0;
            const estiloCor = getCorEstado(geo.sigla, total);

            return (
              <g
                key={geo.sigla}
                className="cursor-pointer transition-all duration-150"
                onClick={() => {
                  if (estadoSelecionado === geo.sigla) {
                    onSelecionarEstado(null);
                  } else {
                    onSelecionarEstado(geo.sigla);
                  }
                }}
                onMouseEnter={() => setHoveredEstado(resumo || null)}
              >
                <path
                  d={geo.path}
                  className={`transition-all duration-200 ${estiloCor}`}
                />

                {/* Sigla para estados grandes ou com licitações */}
                {(total > 0 || ['SP', 'MG', 'RJ', 'BA', 'RS', 'PR', 'GO', 'MT', 'PA', 'AM'].includes(geo.sigla)) && (
                  <text
                    x={geo.centroX}
                    y={geo.centroY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-[9px] font-bold pointer-events-none select-none transition-colors ${
                      estadoSelecionado === geo.sigla
                        ? 'fill-white font-extrabold'
                        : total > 0
                        ? 'fill-white dark:fill-white font-bold drop-shadow-xs'
                        : 'fill-slate-400 dark:fill-slate-500 font-medium'
                    }`}
                  >
                    {geo.sigla}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip Flutuante */}
        {hoveredEstado && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 dark:bg-black/90 text-white rounded-xl p-3 shadow-xl backdrop-blur-md border border-white/10 text-xs w-60 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: Math.min(Math.max(mousePos.x + 15, 10), 320),
              top: Math.min(Math.max(mousePos.y - 40, 10), 380),
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/15">
              <div>
                <span className="font-bold text-sm block leading-tight">
                  {hoveredEstado.nome} ({hoveredEstado.sigla})
                </span>
                <span className="text-[10px] text-slate-300">
                  Região {hoveredEstado.regiao}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {hoveredEstado.totalLicitacoes}{' '}
                {hoveredEstado.totalLicitacoes === 1 ? 'licitação' : 'licitações'}
              </span>
            </div>

            <div className="pt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center text-slate-300">
                <span>Valor Proposto:</span>
                <span className="font-semibold text-white font-mono">
                  {formatarMoeda(hoveredEstado.totalValorProposta)}
                </span>
              </div>

              {hoveredEstado.totalLucroLiquido > 0 && (
                <div className="flex justify-between items-center text-emerald-300">
                  <span>Lucro Estimado:</span>
                  <span className="font-bold font-mono">
                    {formatarMoeda(hoveredEstado.totalLucroLiquido)}
                  </span>
                </div>
              )}

              {hoveredEstado.prefeituras.length > 0 && (
                <div className="pt-1 border-t border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    Órgãos atendidos ({hoveredEstado.prefeituras.length}):
                  </span>
                  <p className="text-[10px] text-slate-200 line-clamp-2 leading-relaxed">
                    {hoveredEstado.prefeituras.slice(0, 3).join(', ')}
                    {hoveredEstado.prefeituras.length > 3 ? ` +${hoveredEstado.prefeituras.length - 3}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legenda de Cores e Estatística Resumida */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-400">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-300 dark:bg-blue-800" />
            <span>1 a 2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-500" />
            <span>3 a 5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-700 dark:bg-blue-500" />
            <span>6+</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          Clique no estado para filtrar
        </div>
      </div>
    </div>
  );
};
