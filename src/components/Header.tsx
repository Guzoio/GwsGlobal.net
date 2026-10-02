import React, { useState } from 'react';
import {
  FileText,
  FileCheck,
  PlusCircle,
  History,
  Layers,
  Image as ImageIcon,
  Calculator,
  Settings,
  ChevronDown,
  Shield,
  Lock,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { LogoGwsGlobal } from './LogoGwsGlobal';

interface HeaderProps {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
  onAbrirCalculadora?: () => void;
  onAbrirExportar?: () => void;
  onAbrirSeguranca?: () => void;
  onAbrirDeclaracao?: () => void;
  onLogout?: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
  tema?: 'light' | 'dark';
  onAlternarTema?: (novoTema?: 'light' | 'dark') => void;
}

export const Header: React.FC<HeaderProps> = ({
  abaAtiva,
  setAbaAtiva,
  onAbrirCalculadora,
  onAbrirExportar,
  onAbrirSeguranca,
  onAbrirDeclaracao,
  onLogout,
  statusNuvem = 'conectado',
  tema = 'light',
  onAlternarTema,
}) => {
  const [menuConfigAberto, setMenuConfigAberto] = useState(false);
  const [menuDocumentosAberto, setMenuDocumentosAberto] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Logo e Nome posicionados à esquerda */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group"
          onClick={() => setAbaAtiva('historico')}
          title="GWS GLOBAL.net — Minhas Licitações"
        >
          <LogoGwsGlobal className="w-10 h-10 sm:w-11 sm:h-11 transition-transform duration-200 group-hover:scale-105 shrink-0 rounded-xl" />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            GWS GLOBAL.net
          </span>
        </div>

        {/* Abas / Opções de navegação principais */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3 py-1">
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'historico'
                ? 'bg-[#0F2C59] dark:bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Minhas Licitações</span>
            {/* Farol / Indicador de Conexão em Nuvem compacto */}
            <span
              className="relative flex h-2.5 w-2.5 ml-0.5"
              title={
                statusNuvem === 'conectado'
                  ? 'Nuvem Conectada e Sincronizada em Tempo Real'
                  : statusNuvem === 'conectando'
                  ? 'Conectando à Nuvem...'
                  : 'Nuvem Desconectada (Offline)'
              }
            >
              {statusNuvem === 'conectado' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs"></span>
                </>
              ) : statusNuvem === 'conectando' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              )}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('cadastrar')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'cadastrar'
                ? 'bg-[#0F2C59] dark:bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Nova Licitação
          </button>

          <button
            onClick={() => setAbaAtiva('montar')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'montar'
                ? 'bg-[#0F2C59] dark:bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Montar Proposta & Catálogo
          </button>

          <button
            onClick={() => setAbaAtiva('preview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'preview'
                ? 'bg-[#0F2C59] dark:bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Visualizar PDF
          </button>
        </nav>

        {/* Lado direito: Documentos, Configurações, Tema e Botão Calcular */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative">
          {/* Menu Dropdown de Documentos e Declarações Oficiais */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuDocumentosAberto(prev => !prev)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${
                menuDocumentosAberto
                  ? 'bg-slate-100 dark:bg-slate-800 text-[#0F2C59] dark:text-blue-400 border-slate-300 dark:border-slate-700 shadow-xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#0F2C59] dark:hover:text-white border-slate-200 dark:border-slate-700'
              }`}
              title="Menu de Documentos e Declarações Oficiais"
            >
              <FileCheck className="w-4 h-4 text-amber-500" />
              <span>Documentos</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  menuDocumentosAberto ? 'rotate-180 text-[#0F2C59] dark:text-blue-400' : 'text-slate-400'
                }`}
              />
            </button>

            {menuDocumentosAberto && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuDocumentosAberto(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Documentos & Declarações
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      Modelos Oficiais
                    </span>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* Opção 1: Declaração Unificada */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuDocumentosAberto(false);
                        onAbrirDeclaracao?.();
                      }}
                      className="w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2.5 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 group-hover:bg-[#0F2C59] group-hover:text-amber-300 transition-colors">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-blue-400 text-xs">
                        Declaração Unificada
                      </span>
                    </button>

                    {/* Espaço reservado para futuras declarações adicionais */}
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-1">
                      <span className="text-slate-400 italic">Mais modelos serão adicionados aqui...</span>
                      <span className="text-[9px] font-semibold text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        Em breve
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Engrenagem de Configuração (contém Modo Escuro/Claro, Papel Timbrado e Segurança) */}
          <div className="relative">
            <button
              onClick={() => setMenuConfigAberto(prev => !prev)}
              className={`px-3 py-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                abaAtiva === 'timbrado' || menuConfigAberto
                  ? 'bg-slate-100 dark:bg-slate-800 text-[#0F2C59] dark:text-blue-400 border-slate-300 dark:border-slate-700 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Configurações do Sistema e Segurança"
            >
              <Settings
                className={`w-4 h-4 transition-transform duration-200 ${
                  menuConfigAberto ? 'rotate-90 text-[#0F2C59] dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
                }`}
              />
              <span className="hidden sm:inline">Configurações</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {menuConfigAberto && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuConfigAberto(false)}
                />
                <div className="absolute right-0 mt-2 w-76 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3 h-3 text-slate-400" />
                      Opções de Configuração
                    </span>
                  </div>

                  {/* Opção Papel Timbrado */}
                  <button
                    onClick={() => {
                      setAbaAtiva('timbrado');
                      setMenuConfigAberto(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      abaAtiva === 'timbrado'
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 text-slate-950 dark:text-amber-200 font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Configurações do Papel Timbrado
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        Logotipo, cabeçalho, rodapé e dados da empresa
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* Opção Segurança e Acesso */}
                  <button
                    onClick={() => {
                      onAbrirSeguranca?.();
                      setMenuConfigAberto(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 mt-0.5 shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Segurança e Acesso
                        <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded">
                          Senha
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        Alterar ID de usuário e senha do sistema
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* Opção Sair do Sistema */}
                  <button
                    onClick={() => {
                      setMenuConfigAberto(false);
                      onLogout?.();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair do Sistema
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Botão de alternar Modo Escuro / Claro (apenas símbolos) */}
          <button
            onClick={() => onAlternarTema?.()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
            title={tema === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            aria-label="Alternar tema"
          >
            {tema === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          <button
            onClick={onAbrirCalculadora}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2C59] hover:bg-[#163c78] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            title="Abrir Calculadora de Limite de Oferta"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Calcular
          </button>

          {/* Botão Sair direto no cabeçalho */}
          <button
            onClick={onLogout}
            className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Encerrar sessão e sair do sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Barra de opções para dispositivos móveis limpa */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90">
        <button
          onClick={() => setAbaAtiva('historico')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'historico' ? 'bg-[#0F2C59] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Minhas Licitações</span>
          <span
            className="relative flex h-2 w-2 ml-0.5"
            title={
              statusNuvem === 'conectado'
                ? 'Nuvem Conectada e Sincronizada'
                : statusNuvem === 'conectando'
                ? 'Conectando...'
                : 'Offline'
            }
          >
            {statusNuvem === 'conectado' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : statusNuvem === 'conectando' ? (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>
        </button>
        <button
          onClick={() => setAbaAtiva('cadastrar')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'cadastrar' ? 'bg-[#0F2C59] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Nova Licitação
        </button>
        <button
          onClick={() => setAbaAtiva('montar')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'montar' ? 'bg-[#0F2C59] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Montar Proposta
        </button>
        <button
          onClick={() => setAbaAtiva('preview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'preview' ? 'bg-[#0F2C59] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Visualizar PDF
        </button>
        <button
          onClick={onAbrirDeclaracao}
          className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0F2C59] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          title="Documentos e Declaração Unificada (Lei 14.133/21)"
        >
          <FileCheck className="w-3.5 h-3.5 text-amber-500" />
          Documentos
        </button>
        {/* Botão Tema Móvel (apenas símbolo) */}
        <button
          onClick={() => onAlternarTema?.()}
          className="p-1.5 rounded-md whitespace-nowrap transition-colors flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          title={tema === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          {tema === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>
        <button
          onClick={onAbrirCalculadora}
          className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 bg-[#0F2C59] dark:bg-blue-600 text-white shrink-0"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          Calcular
        </button>
        <button
          onClick={onAbrirSeguranca}
          className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          Segurança
        </button>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </header>
  );
};
