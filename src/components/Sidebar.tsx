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
} from 'lucide-react';
import { PalavraDoDiaCard } from './PalavraDoDiaCard';

interface SidebarProps {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
  totalLicitacoes?: number;
  totalContatos?: number;
  totalCobrancas?: number;
  totalAlertasCobrancas?: number;
  onAbrirDeclaracao?: () => void;
  onAbrirSeguranca?: () => void;
  abertaMobile: boolean;
  onFecharMobile: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
}

export const Sidebar: React.FC<SidebarProps> = ({
  abaAtiva,
  setAbaAtiva,
  totalLicitacoes = 0,
  totalContatos = 0,
  totalCobrancas = 0,
  totalAlertasCobrancas = 0,
  onAbrirDeclaracao,
  onAbrirSeguranca,
  abertaMobile,
  onFecharMobile,
  statusNuvem = 'conectado',
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
      badge: totalLicitacoes > 0 ? `${totalLicitacoes}` : undefined,
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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={onFecharMobile}
          aria-hidden="true"
        />
      )}

      {/* Painel Lateral CRM GWS GLOBAL.net: Branco no modo claro, ~400px de largura no desktop */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 md:z-20 w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] h-[calc(100vh-4rem)] bg-white dark:bg-[#0A162B] text-slate-800 dark:text-slate-100 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-250 ease-out shrink-0 select-none shadow-xl md:shadow-none overflow-hidden ${
          abertaMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Conteúdo rolável do painel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col">
          <div className="space-y-4">
            {/* Header exclusivo para mobile com botão de fechar */}
          <div className="flex md:hidden items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Menu CRM • GWS GLOBAL
              </span>
            </div>
            <button
              type="button"
              onClick={onFecharMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rótulo de Seção CRM */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Gestão de Licitações
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
              GWS CRM
            </span>
          </div>

          {/* Navegação Principal */}
          <nav className="space-y-1.5">
            {itensMenuPrincipal.map(item => {
              const Icone = item.icone;
              const estaAtivo = abaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setAbaAtiva(item.id);
                    onFecharMobile();
                  }}
                  className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                    estaAtivo
                      ? 'bg-blue-600 text-white border-blue-500/50 shadow-sm shadow-blue-900/20 font-medium'
                      : 'bg-slate-50/80 dark:bg-[#0E1F3D]/60 hover:bg-slate-100 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200/70 dark:border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg transition-colors shrink-0 ${
                        estaAtivo
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-200/90 dark:group-hover:bg-white/10'
                      }`}
                    >
                      <Icone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate leading-tight">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 leading-none ${
                          estaAtivo
                            ? 'text-blue-100'
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                        }`}
                      >
                        {item.descricao}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        estaAtivo
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
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
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-1.5">
            <div className="px-1">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Contatos
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setAbaAtiva('contatos');
                onFecharMobile();
              }}
              className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                abaAtiva === 'contatos'
                  ? 'bg-blue-600 text-white border-blue-500/50 shadow-sm font-medium'
                  : 'bg-slate-50/80 dark:bg-[#0E1F3D]/60 hover:bg-slate-100 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200/70 dark:border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    abaAtiva === 'contatos'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight">
                    Contatos
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 leading-none ${
                      abaAtiva === 'contatos'
                        ? 'text-blue-100'
                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                    }`}
                  >
                    Prefeituras e telefones
                  </div>
                </div>
              </div>

              {totalContatos > 0 && (
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    abaAtiva === 'contatos'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalContatos}
                </span>
              )}
            </button>

            {/* Novo Botão: 💰 Cobranças (Controle de faturamento, liquidação e pagamentos) */}
            <button
              type="button"
              onClick={() => {
                setAbaAtiva('cobrancas');
                onFecharMobile();
              }}
              className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                abaAtiva === 'cobrancas'
                  ? 'bg-emerald-600 text-white border-emerald-500/50 shadow-sm font-medium'
                  : 'bg-slate-50/80 dark:bg-[#0E1F3D]/60 hover:bg-slate-100 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200/70 dark:border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    abaAtiva === 'cobrancas'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight flex items-center gap-1.5">
                    <span>Cobranças</span>
                    {totalAlertasCobrancas > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 leading-none ${
                      abaAtiva === 'cobrancas'
                        ? 'text-emerald-100'
                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                    }`}
                  >
                    Entrega, NF e liquidação
                  </div>
                </div>
              </div>

              {totalAlertasCobrancas > 0 ? (
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full shrink-0 ml-2 bg-rose-500 text-white animate-pulse">
                  {totalAlertasCobrancas}
                </span>
              ) : totalCobrancas > 0 ? (
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    abaAtiva === 'cobrancas'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalCobrancas}
                </span>
              ) : null}
            </button>
          </div>

          {/* Divisor Suave */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="px-1">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
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
              className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                abaAtiva === 'analise'
                  ? 'bg-blue-600 text-white border-blue-500/50 shadow-sm font-medium'
                  : 'bg-slate-50/80 dark:bg-[#0E1F3D]/60 hover:bg-slate-100 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200/70 dark:border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    abaAtiva === 'analise'
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/25'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight">
                    Análise
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 leading-none ${
                      abaAtiva === 'analise'
                        ? 'text-blue-100'
                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                    }`}
                  >
                    Mapa do Brasil e lucros
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                  abaAtiva === 'analise'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                }`}
              >
                BI
              </span>
            </button>

            {/* Botão Documentos Oficiais (Retrátil Independente) */}
            <div>
              <button
                type="button"
                onClick={() => setMenuDocumentosAberto(prev => !prev)}
                className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                  menuDocumentosAberto
                    ? 'bg-amber-50 dark:bg-[#12274D] text-amber-950 dark:text-white border-amber-200 dark:border-white/10 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-[#0E1F3D]/60 hover:bg-slate-100 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200/70 dark:border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300 shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate leading-tight">
                      Documentos Oficiais
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate mt-0.5 leading-none">
                      Declarações e certidões
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    menuDocumentosAberto ? 'rotate-180 text-amber-600 dark:text-amber-300' : ''
                  }`}
                />
              </button>

              {menuDocumentosAberto && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-amber-500/40 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      onAbrirDeclaracao?.();
                      onFecharMobile();
                    }}
                    className="w-full group flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span className="truncate font-semibold">Declaração Unificada</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                      Lei 14.133
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Botão Configurações (Retrátil Independente) */}
            <div>
              <button
                type="button"
                onClick={() => setMenuConfigAberto(prev => !prev)}
                className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                  menuConfigAberto || abaAtiva === 'timbrado'
                    ? 'bg-cyan-50 dark:bg-[#12274D] text-cyan-950 dark:text-white border-cyan-200 dark:border-white/10 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-[#0E1F3D]/60 hover:bg-slate-100 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200/70 dark:border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate leading-tight">
                      Configurações
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate mt-0.5 leading-none">
                      Papel timbrado e credenciais
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    menuConfigAberto ? 'rotate-180 text-cyan-600 dark:text-cyan-300' : ''
                  }`}
                />
              </button>

              {menuConfigAberto && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-cyan-500/40 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setAbaAtiva('timbrado');
                      onFecharMobile();
                    }}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left ${
                      abaAtiva === 'timbrado'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-300 shrink-0" />
                      <span className="truncate font-semibold">Papel Timbrado</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                      Cabeçalho/Rodapé
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAbrirSeguranca?.();
                      onFecharMobile();
                    }}
                    className="w-full group flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Shield className="w-3.5 h-3.5 text-purple-500 dark:text-purple-300 shrink-0" />
                      <span className="truncate font-semibold">Segurança & Acesso</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 shrink-0">
                      ID / Senha
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

        {/* Rodapé da Sidebar estilo GWS SaaS com indicador de Sistema Online */}
        <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#071326] shrink-0">
          <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              </span>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 dark:text-slate-200 leading-none truncate">
                  Sistema Online
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 truncate leading-none">
                  GWS CRM Ativo
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nuvem OK</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
