import React from 'react';
import {
  Calculator,
  LogOut,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { LogoGwsGlobal } from './LogoGwsGlobal';

interface HeaderProps {
  sidebarAberta?: boolean;
  onToggleSidebar?: () => void;
  onAbrirCalculadora?: () => void;
  onLogout?: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
  tema?: 'light' | 'dark';
  onAlternarTema?: (novoTema?: 'light' | 'dark') => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarAberta = false,
  onToggleSidebar,
  onAbrirCalculadora,
  onLogout,
  statusNuvem = 'conectado',
  tema = 'light',
  onAlternarTema,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0A162B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Lado esquerdo: Botão Menu Mobile + Logotipo & Nome GWS GLOBAL.net */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Botão de abrir menu no mobile */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Abrir menu de navegação lateral"
            title="Abrir menu CRM"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="GWS GLOBAL.net — Sistema de Gestão de Licitações"
          >
            <LogoGwsGlobal className="w-10 h-10 transition-transform duration-200 group-hover:scale-105 shrink-0 rounded-xl shadow-xs" />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                GWS GLOBAL.net
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400 hidden sm:block mt-0.5">
                CRM de Licitações & Propostas
              </span>
            </div>
          </div>
        </div>

        {/* Lado direito: Tema, CALCULAR e SAIR */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Alternar Modo Escuro / Claro */}
          <button
            type="button"
            onClick={() => onAlternarTema?.()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
            title={tema === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label="Alternar tema"
          >
            {tema === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Botão CALCULAR (Abre calculadora de oferta) */}
          <button
            type="button"
            onClick={onAbrirCalculadora}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0A1D37] hover:bg-[#122A4E] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-xs hover:shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-98"
            title="Abrir Calculadora de Limite de Oferta e Custos"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Calcular</span>
          </button>

          {/* Botão SAIR (Logout do sistema) */}
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-200 dark:hover:border-rose-900 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs active:scale-98"
            title="Encerrar sessão e sair do sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
