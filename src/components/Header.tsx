import React from 'react';
import {
  Calculator,
  LogOut,
  Sun,
  Moon,
  Menu,
  Database,
  Cloud,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { LogoGwsGlobal } from './LogoGwsGlobal';
import { SininhoNotificacoes } from './SininhoNotificacoes';
import { LuzesNatalinas } from './LuzesNatalinas';
import { AlertaCobranca, CloudSyncStatus } from '../types';

interface HeaderProps {
  sidebarAberta?: boolean;
  onToggleSidebar?: () => void;
  onAbrirCalculadora?: () => void;
  onLogout?: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
  cloudStatus?: CloudSyncStatus;
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
  cloudStatus,
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
            {/* Logo oficial */}
            <div className="relative shrink-0">
              <LogoGwsGlobal className="w-10 h-10 transition-transform duration-200 group-hover:scale-105 rounded-xl shadow-xs" />
            </div>

            <div className="flex flex-col relative">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  GWS GLOBAL.net
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400 hidden sm:flex items-center gap-1 mt-0.5">
                <span>CRM de Licitações & Propostas</span>
              </span>
            </div>
          </div>
        </div>

        {/* Lado direito: Badge de Sincronização, Sininho de Cobranças, Botão Natal, Tema, CALCULAR e SAIR */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Badge Visual do Estado de Sincronização (Node Server e Nuvem Firestore) */}
          {cloudStatus && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs select-none cursor-default transition-all ${
                !cloudStatus.servidorOnline
                  ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                  : cloudStatus.nuvemStatus === 'cota_esgotada'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                  : cloudStatus.nuvemStatus === 'aguardando_nuvem'
                  ? 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              }`}
              title={
                !cloudStatus.servidorOnline
                  ? 'Atenção: Servidor Node desconectado. As alterações não estão sendo salvas centralmente.'
                  : cloudStatus.nuvemStatus === 'cota_esgotada'
                  ? `Salvo no Servidor Local. Cota gratuita do Firebase atingida (${cloudStatus.filaPendente} na fila). Operações preservadas com segurança no disco do Node.`
                  : cloudStatus.nuvemStatus === 'aguardando_nuvem'
                  ? `Salvo no Servidor Local. ${cloudStatus.filaPendente} operação(ões) aguardando confirmação do Firestore.`
                  : 'Sincronizado: Salvo no servidor Node e confirmado no Firestore.'
              }
            >
              {!cloudStatus.servidorOnline ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>Servidor Offline</span>
                </>
              ) : cloudStatus.nuvemStatus === 'cota_esgotada' ? (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Salvo no Servidor</span>
                  {cloudStatus.filaPendente > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-200/80 dark:bg-amber-900/60 text-[10px] font-bold rounded-full">
                      Fila Nuvem: {cloudStatus.filaPendente}
                    </span>
                  )}
                </>
              ) : cloudStatus.nuvemStatus === 'aguardando_nuvem' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-pulse" />
                  <span>Salvo no Servidor</span>
                  <span className="px-1.5 py-0.2 bg-sky-200/80 dark:bg-sky-900/60 text-[10px] font-bold rounded-full">
                    Nuvem: {cloudStatus.filaPendente}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Nuvem e Servidor OK</span>
                </>
              )}
            </div>
          )}

          {/* Botão de Alternar Tema de Natal (Neve e Pisca-Pisca) */}
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
                ? 'Tema de Natal Ativo (Neve e pisca-pisca ligados)'
                : 'Ativar Tema de Natal (Neve e pisca-pisca festivo)'
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

          {/* Botão CALCULAR (Abre calculadora de oferta) */}
          <button
            type="button"
            onClick={onAbrirCalculadora}
            className="relative px-4 py-2 text-xs font-bold text-white bg-[#0A1D37] hover:bg-[#122A4E] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-xs hover:shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-98"
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
