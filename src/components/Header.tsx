import React from 'react';
import {
  Calculator,
  LogOut,
  Sun,
  Moon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Cloud,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { LogoGwsGlobal } from './LogoGwsGlobal';
import { SininhoNotificacoes } from './SininhoNotificacoes';
import { AlertaCobranca, CloudSyncStatus } from '../types';

interface HeaderProps {
  sidebarAberta?: boolean;
  sidebarDesktopAberta?: boolean;
  onToggleSidebar?: () => void;
  onAbrirCalculadora?: () => void;
  onLogout?: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
  cloudStatus?: CloudSyncStatus;
  tema?: 'light' | 'dark';
  onAlternarTema?: (novoTema?: 'light' | 'dark') => void;
  alertasCobrancas?: AlertaCobranca[];
  onNavegarParaAlerta?: (alerta: AlertaCobranca) => void;
  onNavegarParaCobranca?: (cobrancaId?: string) => void;
  onTestarSomNotificacao?: () => void;
  onConcluirAvisoPregoeiro?: (licitacaoId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarAberta = false,
  sidebarDesktopAberta = true,
  onToggleSidebar,
  onAbrirCalculadora,
  onLogout,
  cloudStatus,
  tema = 'light',
  onAlternarTema,
  alertasCobrancas = [],
  onNavegarParaAlerta,
  onNavegarParaCobranca,
  onTestarSomNotificacao,
  onConcluirAvisoPregoeiro,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Lado esquerdo: Botão Retrair/Chamar Menu Lateral + Logotipo & Nome GWS GLOBAL.net */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          {/* Botão para abrir/fechar o menu lateral (funciona no desktop e no celular) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] px-2.5 lg:px-3 rounded-md border transition-colors cursor-pointer flex items-center justify-center lg:gap-1.5 shrink-0 ${
              sidebarDesktopAberta
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F2C59] dark:text-blue-300 border-slate-300 dark:border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F2C59] dark:text-blue-300 border-slate-300 dark:border-slate-700 md:bg-[#0F2C59] md:hover:bg-[#163C78] md:text-white md:border-[#0F2C59] dark:md:bg-blue-600 dark:md:hover:bg-blue-500 dark:md:text-white dark:md:border-blue-500'
            }`}
            aria-label={
              sidebarDesktopAberta || sidebarAberta
                ? 'Ocultar menu lateral'
                : 'Mostrar menu lateral'
            }
            title={
              sidebarDesktopAberta
                ? 'Ocultar menu lateral para ganhar espaço'
                : 'Abrir menu lateral'
            }
          >
            <Menu className="w-5 h-5 md:hidden shrink-0" />
            {sidebarDesktopAberta ? (
              <>
                <PanelLeftClose className="w-4 h-4 hidden md:block shrink-0" />
                <span className="hidden lg:inline whitespace-nowrap text-xs font-semibold">
                  Ocultar
                </span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4 hidden md:block shrink-0" />
                <span className="hidden lg:inline whitespace-nowrap text-xs font-semibold">
                  Abrir Menu
                </span>
              </>
            )}
          </button>

          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
            title="GWS GLOBAL.net — Sistema de Gestão de Licitações"
          >
            {/* Logo oficial */}
            <div className="relative shrink-0">
              <LogoGwsGlobal className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-slate-200 dark:border-slate-700" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none truncate max-w-[115px] sm:max-w-none">
                  GWS GLOBAL.net
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1 mt-1">
                <span>CRM de Licitações & Propostas</span>
              </span>
            </div>
          </div>
        </div>

        {/* Lado direito: Badge de Sincronização, Sininho de Cobranças, Tema, CALCULAR e SAIR */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Badge Visual do Estado de Sincronização (Node Server e Nuvem Firestore) */}
          {cloudStatus && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border select-none cursor-default transition-colors ${
                !cloudStatus.servidorOnline
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                  : cloudStatus.nuvemStatus === 'cota_esgotada'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                  : cloudStatus.nuvemStatus === 'aguardando_nuvem'
                  ? 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
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
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Servidor Offline</span>
                </>
              ) : cloudStatus.nuvemStatus === 'cota_esgotada' ? (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Salvo no Servidor</span>
                  {cloudStatus.filaPendente > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-200/80 dark:bg-amber-900/60 text-[10px] font-bold rounded">
                      Fila Nuvem: {cloudStatus.filaPendente}
                    </span>
                  )}
                </>
              ) : cloudStatus.nuvemStatus === 'aguardando_nuvem' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Salvo no Servidor</span>
                  <span className="px-1.5 py-0.5 bg-sky-200/80 dark:bg-sky-900/60 text-[10px] font-bold rounded">
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

          {/* Sininho Global de Notificações de Cobranças */}
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
            className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center"
            title={tema === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label="Alternar tema"
          >
            {tema === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Botão CALCULAR (Abre calculadora de oferta) */}
          <button
            type="button"
            onClick={onAbrirCalculadora}
            className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-[#0F2C59] hover:bg-[#163C78] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            title="Abrir Calculadora de Limite de Oferta e Custos"
            aria-label="Abrir Calculadora"
          >
            <Calculator className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Calcular</span>
          </button>

          {/* Botão SAIR (Logout do sistema) */}
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Encerrar sessão e sair do sistema"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
