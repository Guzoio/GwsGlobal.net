import React, { useMemo } from 'react';
import {
  BookOpen,
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
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 transition-colors duration-150">
      <div className="p-3.5 space-y-2.5">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block leading-tight">
                Palavra do Dia
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block">
                {dataExtenso}
              </span>
            </div>
          </div>

          {/* Tag de Tema */}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0">
            {palavraHoje.tema}
          </span>
        </div>

        {/* Citação do Versículo Bíblico */}
        <div className="space-y-1">
          <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
            "{palavraHoje.versiculo}"
          </p>
          <div className="pt-0.5">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              — {palavraHoje.referencia}
            </span>
          </div>
        </div>

        {/* Caixa de Explicação / Reflexão Prática */}
        <div className="p-2.5 rounded-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
            <Quote className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
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
