import React, { useState } from 'react';
import {
  History,
  Users,
  PlusCircle,
  Layers,
  FileText,
  FileCheck,
  Image as ImageIcon,
  Shield,
  X,
  ChevronDown,
  Settings,
  FolderKanban,
  CheckCircle2,
  BarChart3,
  DollarSign,
  Scale,
  PenTool,
  Award,
  ShieldCheck,
  UserCheck,
  Terminal,
  PanelLeftClose,
} from 'lucide-react';
import { PalavraDoDiaCard } from './PalavraDoDiaCard';
import { TipoNovaDeclaracao } from '../utils/novasDeclaracoesPdf';

interface SidebarProps {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
  totalLicitacoes?: number;
  totalContatos?: number;
  totalCobrancas?: number;
  totalAlertasCobrancas?: number;
  totalAlertasPregoeiro?: number;
  onAbrirDeclaracao?: () => void;
  onAbrirNovaDeclaracao?: (tipo: TipoNovaDeclaracao) => void;
  onAbrirExequibilidade?: () => void;
  onAbrirAssinador?: () => void;
  onAbrirSeguranca?: () => void;
  onAbrirConsoleCmd?: () => void;
  abertaMobile: boolean;
  onFecharMobile: () => void;
  abertaDesktop?: boolean;
  onFecharDesktop?: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
}

export const Sidebar: React.FC<SidebarProps> = ({
  abaAtiva,
  setAbaAtiva,
  totalLicitacoes = 0,
  totalContatos = 0,
  totalCobrancas = 0,
  totalAlertasCobrancas = 0,
  totalAlertasPregoeiro = 0,
  onAbrirDeclaracao,
  onAbrirNovaDeclaracao,
  onAbrirExequibilidade,
  onAbrirAssinador,
  onAbrirSeguranca,
  onAbrirConsoleCmd,
  abertaMobile,
  onFecharMobile,
  abertaDesktop = true,
  onFecharDesktop,
}) => {
  const [menuDocumentosAberto, setMenuDocumentosAberto] = useState<boolean>(false);
  const [menuConfigAberto, setMenuConfigAberto] = useState<boolean>(
    () => abaAtiva === 'timbrado'
  );

  const itensMenuPrincipal = [
    {
      id: 'historico',
      label: 'Minhas Licitações',
      icone: History,
      descricao: 'Visão geral e processos',
      badge: totalAlertasPregoeiro > 0 ? `${totalAlertasPregoeiro} retorno` : (totalLicitacoes > 0 ? `${totalLicitacoes}` : undefined),
    },
    {
      id: 'cadastrar',
      label: 'Nova Licitação',
      icone: PlusCircle,
      descricao: 'Cadastrar novo edital',
    },
    {
      id: 'montar',
      label: 'Montar Proposta & Catálogo',
      icone: Layers,
      descricao: 'Planilha e cotação de itens',
    },
    {
      id: 'preview',
      label: 'Visualizar PDF',
      icone: FileText,
      descricao: 'Proposta final timbrada',
    },
  ];

  return (
    <>
      {/* Overlay escuro para mobile e telas compactas */}
      {abertaMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden animate-in fade-in duration-150"
          onClick={onFecharMobile}
          aria-hidden="true"
        />
      )}

      {/* Painel Lateral CRM GWS GLOBAL.net */}
      <aside
        className={`fixed md:sticky top-14 sm:top-16 left-0 z-40 md:z-20 w-[85vw] max-w-[310px] md:w-[290px] xl:w-[310px] h-[calc(100dvh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-out shrink-0 select-none overflow-hidden ${
          abertaMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${abertaDesktop ? 'md:flex' : 'md:hidden'}`}
      >
        {/* Conteúdo rolável do painel */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 flex flex-col">
          <div className="space-y-4">
            {/* Header mobile com botão de fechar */}
            <div className="flex md:hidden items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Menu CRM • GWS GLOBAL
                </span>
              </div>
              <button
                type="button"
                onClick={onFecharMobile}
                className="min-h-[40px] min-w-[40px] p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rótulo de Seção + botão de recolher no desktop */}
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Gestão de Licitações
              </span>
              {onFecharDesktop && (
                <button
                  type="button"
                  onClick={onFecharDesktop}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-[#0F2C59] dark:bg-slate-800 dark:hover:bg-blue-600 text-[#0F2C59] hover:text-white dark:text-blue-300 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="Ocultar menu lateral"
                  aria-label="Ocultar menu lateral"
                >
                  <PanelLeftClose className="w-3.5 h-3.5 shrink-0" />
                  <span>Ocultar</span>
                </button>
              )}
            </div>

            {/* Navegação Principal */}
            <nav className="space-y-1.5">
              {itensMenuPrincipal.map((item) => {
                const Icone = item.icone;
                const estaAtivo = abaAtiva === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAbaAtiva(item.id);
                      onFecharMobile();
                    }}
                    className={`relative w-full group flex items-center justify-between p-2.5 rounded-md transition-colors duration-150 cursor-pointer text-left border ${
                      estaAtivo
                        ? 'bg-[#0F2C59] dark:bg-blue-600 text-white border-[#0F2C59] dark:border-blue-600 font-medium'
                        : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className={`p-2 rounded-md transition-colors shrink-0 ${
                            estaAtivo
                              ? 'bg-white/15 text-white'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}
                        >
                          <Icone className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                          <span>{item.label}</span>
                        </div>
                        <div
                          className={`text-[10px] truncate mt-0.5 leading-none ${
                            estaAtivo
                              ? 'text-blue-100'
                              : 'text-slate-500 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                          }`}
                        >
                          {item.descricao}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] font-mono font-semibold tabular-nums px-2 py-0.5 rounded shrink-0 ml-2 ${
                          estaAtivo
                            ? 'bg-white/20 text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Grupo Separado: Contatos */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="px-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contatos
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAbaAtiva('contatos');
                  onFecharMobile();
                }}
                className={`relative w-full group flex items-center justify-between p-2.5 rounded-md transition-colors duration-150 cursor-pointer text-left border ${
                  abaAtiva === 'contatos'
                    ? 'bg-[#0F2C59] dark:bg-blue-600 text-white border-[#0F2C59] dark:border-blue-600 font-medium'
                    : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-md transition-colors shrink-0 ${
                      abaAtiva === 'contatos'
                        ? 'bg-white/15 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                      <span>Contatos</span>
                    </div>
                    <div
                      className={`text-[10px] truncate mt-0.5 leading-none ${
                        abaAtiva === 'contatos'
                          ? 'text-blue-100'
                          : 'text-slate-500 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                      }`}
                    >
                      Prefeituras e telefones
                    </div>
                  </div>
                </div>

                {totalContatos > 0 && (
                  <span
                    className={`text-[11px] font-mono font-semibold tabular-nums px-2 py-0.5 rounded shrink-0 ml-2 ${
                      abaAtiva === 'contatos'
                        ? 'bg-white/20 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {totalContatos}
                  </span>
                )}
              </button>
            </div>

            {/* Divisor Suave */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="px-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ferramentas & Acesso
                </span>
              </div>

              {/* Botão Análise (Mapa do Brasil, Lucros e Estatísticas) */}
              <button
                type="button"
                onClick={() => {
                  setAbaAtiva('analise');
                  onFecharMobile();
                }}
                className={`relative w-full group flex items-center justify-between p-2.5 rounded-md transition-colors duration-150 cursor-pointer text-left border ${
                  abaAtiva === 'analise'
                    ? 'bg-[#0F2C59] dark:bg-blue-600 text-white border-[#0F2C59] dark:border-blue-600 font-medium'
                    : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-md transition-colors shrink-0 ${
                      abaAtiva === 'analise'
                        ? 'bg-white/15 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate leading-tight">
                      Análise
                    </div>
                    <div
                      className={`text-[10px] truncate mt-0.5 leading-none ${
                        abaAtiva === 'analise'
                          ? 'text-blue-100'
                          : 'text-slate-500 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                      }`}
                    >
                      Mapa do Brasil e lucros
                    </div>
                  </div>
                </div>
              </button>

              {/* Botão Documentos Oficiais (Retrátil Independente) */}
              <div>
                <button
                  type="button"
                  onClick={() => setMenuDocumentosAberto(prev => !prev)}
                  className={`relative w-full group flex items-center justify-between p-2.5 rounded-md transition-colors duration-150 cursor-pointer text-left border ${
                    menuDocumentosAberto
                      ? 'bg-amber-50 dark:bg-slate-800 text-amber-950 dark:text-white border-amber-200 dark:border-slate-700'
                      : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                        <span>Documentos Oficiais</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-none">
                        Declarações e certidões
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0 ${
                      menuDocumentosAberto ? 'rotate-180 text-amber-700 dark:text-amber-300' : ''
                    }`}
                  />
                </button>

                {menuDocumentosAberto && (
                  <div className="mt-1.5 ml-3 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirDeclaracao?.();
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate font-medium">Declaração Unificada</span>
                    </button>

                    {/* 1. Comprovação de enquadramento em ME/EPP */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirNovaDeclaracao?.('me_epp');
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate font-medium">Enquadramento ME/EPP</span>
                    </button>

                    {/* 2. Declaração de cumprimento dos requisitos de Habilitação */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirNovaDeclaracao?.('habilitacao');
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate font-medium">Cumprimento Habilitação</span>
                    </button>

                    {/* 3. Declaração de inexistência de fatos impeditivos ou supervenientes */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirNovaDeclaracao?.('fatos_impeditivos');
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate font-medium">Fatos Impeditivos</span>
                    </button>

                    {/* 4. Declaração de não utilização de mão de obra infantil */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirNovaDeclaracao?.('trabalho_infantil');
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="truncate font-medium">Não Emprego de Menor</span>
                    </button>

                    {/* 5. Declaração de responsabilidade (Anexo V - Sujeição, Habilitação e ME/EPP) */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirNovaDeclaracao?.('responsabilidade');
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate font-medium">Declaração de Responsabilidade</span>
                    </button>

                    {/* 6. Declaração de inexistência de parentes (Servidor Público / Quadro de Pessoal) */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirNovaDeclaracao?.('inexistencia_parentes');
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="truncate font-medium">Inexistência de Parentes</span>
                    </button>

                    {/* 7. Cadastro do Responsável Legal e Preposto */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirNovaDeclaracao?.('cadastro_responsavel');
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="truncate font-medium">Cadastro do Responsável</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAbrirExequibilidade?.();
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Scale className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="truncate font-medium">Exequibilidade</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAbrirAssinador?.();
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate font-medium">Assinar Atas & Documentos</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Configurações (Retrátil Independente) */}
              <div>
                <button
                  type="button"
                  onClick={() => setMenuConfigAberto(prev => !prev)}
                  className={`w-full group flex items-center justify-between p-2.5 rounded-md transition-colors duration-150 cursor-pointer text-left border ${
                    menuConfigAberto || abaAtiva === 'timbrado'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                      : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-900/60 text-cyan-700 dark:text-cyan-300 shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">
                        Configurações
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-none">
                        Papel timbrado e credenciais
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0 ${
                      menuConfigAberto ? 'rotate-180 text-slate-700 dark:text-cyan-300' : ''
                    }`}
                  />
                </button>

                {menuConfigAberto && (
                  <div className="mt-1.5 ml-3 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setAbaAtiva('timbrado');
                        onFecharMobile();
                      }}
                      className={`w-full group flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-left ${
                        abaAtiva === 'timbrado'
                          ? 'bg-[#0F2C59] dark:bg-blue-600 text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${abaAtiva === 'timbrado' ? 'text-white' : 'text-cyan-600 dark:text-cyan-300'}`} />
                        <span className="truncate font-medium">Papel Timbrado</span>
                      </div>
                      <span className={`text-[10px] ${abaAtiva === 'timbrado' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                        Cabeçalho/Rodapé
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAbrirSeguranca?.();
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300 shrink-0" />
                        <span className="truncate font-medium">Segurança & Acesso</span>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-500/20 shrink-0">
                        ID / Senha
                      </span>
                    </button>

                    {/* Console CMD / Terminal de Comandos para Alterações Rápidas e Manutenção */}
                    <button
                      type="button"
                      onClick={() => {
                        onAbrirConsoleCmd?.();
                        onFecharMobile();
                      }}
                      className="w-full group flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate font-medium">Console CMD</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/20 shrink-0">
                        CMD
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Palavra Bíblica do Dia & Reflexão Diária (posicionado lá embaixo, rente ao rodapé do Sistema Online) */}
          <div className="mt-auto pt-4 pb-1">
            <PalavraDoDiaCard />
          </div>
        </div>

        {/* Rodapé da Sidebar estilo GWS SaaS Flat */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] shrink-0">
          <div className="p-2.5 rounded-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-none truncate">
                  Sistema Online
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate leading-none">
                  GWS CRM Ativo
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Nuvem OK</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
