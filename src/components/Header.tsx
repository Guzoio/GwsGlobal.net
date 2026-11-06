import React from 'react';
import {
  Calculator,
  LogOut,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { LogoGwsGlobal } from './LogoGwsGlobal';
import { SininhoNotificacoes } from './SininhoNotificacoes';
import { GorroNatalino } from './GorroNatalino';
import { DoceNatalino } from './DoceNatalino';
import { LuzesNatalinas, RamoAzevinho } from './LuzesNatalinas';
import { AlertaCobranca } from '../types';

interface HeaderProps {
  sidebarAberta?: boolean;
  onToggleSidebar?: () => void;
  onAbrirCalculadora?: () => void;
  onLogout?: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
  tema?: 'light' | 'dark';
  onAlternarTema?: (novoTema?: 'light' | 'dark') => void;
  temaNatal?: boolean;
  onAlternarTemaNatal?: () => void;
  alertasCobrancas?: AlertaCobranca[];
  onNavegarParaAlerta?: (alerta: AlertaCobranca) => void;
  onNavegarParaCobranca?: (cobrancaId?: string) => void;
  onTestarSomNotificacao?: () => void;
  onConcluirAvisoPregoeiro?: (licitacaoId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarAberta = false,
  onToggleSidebar,
  onAbrirCalculadora,
  onLogout,
  statusNuvem = 'conectado',
  tema = 'light',
  onAlternarTema,
  temaNatal = true,
  onAlternarTemaNatal,
  alertasCobrancas = [],
  onNavegarParaAlerta,
  onNavegarParaCobranca,
  onTestarSomNotificacao,
  onConcluirAvisoPregoeiro,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0A162B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200 relative">
      {/* Luzinhas de Natal delicadas no topo do cabeçalho */}
      <LuzesNatalinas ativa={temaNatal} />

      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Lado esquerdo: Botão Menu Mobile + Logotipo & Nome GWS GLOBAL.net com Gorro de Papai Noel */}
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
            className="flex items-center gap-3 cursor-pointer group select-none relative"
            title="GWS GLOBAL.net — Sistema de Gestão de Licitações"
          >
            {/* Logo com Gorro de Papai Noel estilizado no topo */}
            <div className="relative shrink-0">
              <LogoGwsGlobal className="w-10 h-10 transition-transform duration-200 group-hover:scale-105 rounded-xl shadow-xs" />
              {temaNatal && (
                <div
                  className="absolute -top-3.5 -left-2.5 w-7 h-7 pointer-events-none transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"
                  title="Feliz Natal! 🎅"
                >
                  <GorroNatalino size={28} tilt={-14} />
                </div>
              )}
            </div>

            <div className="flex flex-col relative">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  GWS GLOBAL.net
                </span>
                {temaNatal && (
                  <span
                    className="text-[10px] font-black tracking-wider uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900/60 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1 shadow-2xs"
                    title="Tema de Natal Ativo! Boas Festas"
                  >
                    <DoceNatalino size={12} tilt={12} />
                    <span>Natal</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400 hidden sm:flex items-center gap-1 mt-0.5">
                <span>CRM de Licitações & Propostas</span>
                {temaNatal && <RamoAzevinho size={13} className="inline opacity-80" />}
              </span>
            </div>
          </div>
        </div>

        {/* Lado direito: Sininho de Cobranças, Botão Natal, Tema, CALCULAR e SAIR */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Botão de Alternar Tema de Natal (Neve e Enfeites) */}
          <button
            type="button"
            onClick={onAlternarTemaNatal}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-2xs relative ${
              temaNatal
                ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-300'
                : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700/80 text-slate-400 hover:text-slate-600 dark:text-slate-500'
            }`}
            title={
              temaNatal
                ? 'Tema de Natal Ativo (Clique para desativar enfeites)'
                : 'Ativar Tema de Natal (Gorro, renas, boneco e enfeites festivos)'
            }
            aria-label="Alternar tema de natal"
          >
            <span className="text-sm select-none">🎄</span>
            {temaNatal && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-xs" />
            )}
          </button>

          {/* Sininho Global de Notificações de Cobranças (Sempre visível no cabeçalho) */}
          <SininhoNotificacoes
            alertas={alertasCobrancas}
            onNavegarParaAlerta={onNavegarParaAlerta}
            onNavegarParaCobranca={onNavegarParaCobranca || (() => {})}
            onTestarSom={onTestarSomNotificacao || (() => {})}
            onConcluirAvisoPregoeiro={onConcluirAvisoPregoeiro}
          />

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

          {/* Botão CALCULAR (Abre calculadora de oferta) com Gorro de Papai Noel */}
          <button
            type="button"
            onClick={onAbrirCalculadora}
            className="relative px-4 py-2 text-xs font-bold text-white bg-[#0A1D37] hover:bg-[#122A4E] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-xs hover:shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-98"
            title="Abrir Calculadora de Limite de Oferta e Custos"
          >
            {temaNatal && (
              <div className="absolute -top-3 -right-1.5 pointer-events-none drop-shadow-xs">
                <GorroNatalino size={18} tilt={14} />
              </div>
            )}
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
