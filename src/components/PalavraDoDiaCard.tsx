import React, { useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  Quote,
} from 'lucide-react';
import {
  obterPalavraDoDia,
  formatarDataHojeExtenso,
} from '../data/palavrasBiblicas';

export const PalavraDoDiaCard: React.FC = () => {
  const palavraHoje = useMemo(() => obterPalavraDoDia(), []);
  const dataExtenso = useMemo(() => formatarDataHojeExtenso(), []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0B1A33]/90 shadow-xs hover:shadow-sm transition-all duration-200">
      {/* Detalhe de iluminação sutil no topo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-500 opacity-80" />

      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Palavra do Dia
                </span>
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400/30 shrink-0" />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {dataExtenso}
              </div>
            </div>
          </div>

          {/* Tag de Tema */}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 shrink-0">
            {palavraHoje.tema}
          </span>
        </div>

        {/* Citação do Versículo Bíblico (Fonte padrão sans-serif alinhada com o sistema) */}
        <div className="relative pl-3 border-l-2 border-amber-400 dark:border-amber-500/80 space-y-1">
          <p className="text-xs sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
            "{palavraHoje.versiculo}"
          </p>
          <div className="pt-0.5">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 tracking-normal">
              — {palavraHoje.referencia}
            </span>
          </div>
        </div>

        {/* Caixa de Explicação / Reflexão Prática */}
        <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#0D2140]/80 border border-slate-200/70 dark:border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            <Quote className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Reflexão para o seu dia:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
            {palavraHoje.reflexao}
          </p>
        </div>
      </div>
    </div>
  );
};
