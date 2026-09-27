import React, { useState } from 'react';
import {
  FileText,
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
} from 'lucide-react';
import { LogoGwsGlobal } from './LogoGwsGlobal';

interface HeaderProps {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
  onAbrirCalculadora?: () => void;
  onAbrirExportar?: () => void;
  onAbrirSeguranca?: () => void;
  onLogout?: () => void;
  statusNuvem?: 'conectando' | 'conectado' | 'desconectado';
}

export const Header: React.FC<HeaderProps> = ({
  abaAtiva,
  setAbaAtiva,
  onAbrirCalculadora,
  onAbrirExportar,
  onAbrirSeguranca,
  onLogout,
  statusNuvem = 'conectado',
}) => {
  const [menuConfigAberto, setMenuConfigAberto] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Logo e Nome posicionados à esquerda */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group"
          onClick={() => setAbaAtiva('historico')}
          title="GWS GLOBAL.net — Minhas Licitações"
        >
          <LogoGwsGlobal className="w-10 h-10 sm:w-11 sm:h-11 transition-transform duration-200 group-hover:scale-105 shrink-0 rounded-xl" />
          <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
            GWS GLOBAL.net
          </span>
        </div>

        {/* Abas / Opções de navegação principais (limpas, sem configurações) */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3 overflow-x-auto py-1">
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'historico'
                ? 'bg-[#0F2C59] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            Minhas Licitações
          </button>

          <button
            onClick={() => setAbaAtiva('cadastrar')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'cadastrar'
                ? 'bg-[#0F2C59] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Nova Licitação
          </button>

          <button
            onClick={() => setAbaAtiva('montar')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'montar'
                ? 'bg-[#0F2C59] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Montar Proposta & Catálogo
          </button>

          <button
            onClick={() => setAbaAtiva('preview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              abaAtiva === 'preview'
                ? 'bg-[#0F2C59] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Visualizar PDF
          </button>
        </nav>

        {/* Lado direito: Sincronização Nuvem, Configurações e Botão Calcular */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative">
          {/* Badge de Sincronização em Nuvem Automática (Firebase) */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-semibold shadow-2xs select-none"
            title="Sincronização em tempo real ativa! Qualquer alteração ou cadastro aparece instantaneamente nos outros computadores."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Nuvem Sincronizada</span>
            <span className="sm:hidden text-[11px]">Nuvem Ativa</span>
          </div>

          {/* Engrenagem de Configuração (contém Papel Timbrado e Segurança) */}
          <div className="relative">
            <button
              onClick={() => setMenuConfigAberto(prev => !prev)}
              className={`px-3 py-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                abaAtiva === 'timbrado' || menuConfigAberto
                  ? 'bg-slate-100 text-[#0F2C59] border-slate-300 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="Configurações do Sistema e Segurança"
            >
              <Settings
                className={`w-4 h-4 transition-transform duration-200 ${
                  menuConfigAberto ? 'rotate-90 text-[#0F2C59]' : 'text-slate-600'
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
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center gap-1.5">
                    <Settings className="w-3 h-3 text-slate-400" />
                    Opções de Configuração
                  </div>

                  {/* Opção Papel Timbrado */}
                  <button
                    onClick={() => {
                      setAbaAtiva('timbrado');
                      setMenuConfigAberto(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      abaAtiva === 'timbrado'
                        ? 'bg-amber-50/70 text-slate-950 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 mt-0.5 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        Configurações do Papel Timbrado
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Logotipo, cabeçalho, rodapé e dados da empresa
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Opção Segurança e Acesso */}
                  <button
                    onClick={() => {
                      onAbrirSeguranca?.();
                      setMenuConfigAberto(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                  >
                    <div className="p-1.5 rounded-md bg-purple-100 text-purple-700 mt-0.5 shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        Segurança e Acesso
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                          Senha
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Alterar ID de usuário e senha do sistema
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Opção Sair do Sistema */}
                  <button
                    onClick={() => {
                      setMenuConfigAberto(false);
                      onLogout?.();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 hover:bg-red-50 text-red-600 transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair do Sistema
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onAbrirCalculadora}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2C59] hover:bg-[#163c78] rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            title="Abrir Calculadora de Limite de Oferta"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Calcular
          </button>

          {/* Botão Sair direto no cabeçalho */}
          <button
            onClick={onLogout}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Encerrar sessão e sair do sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Barra de opções para dispositivos móveis limpa */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-200 bg-slate-50/90">
        <button
          onClick={() => setAbaAtiva('historico')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'historico' ? 'bg-[#0F2C59] text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Minhas Licitações
        </button>
        <button
          onClick={() => setAbaAtiva('cadastrar')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'cadastrar' ? 'bg-[#0F2C59] text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Nova Licitação
        </button>
        <button
          onClick={() => setAbaAtiva('montar')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'montar' ? 'bg-[#0F2C59] text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Montar Proposta
        </button>
        <button
          onClick={() => setAbaAtiva('preview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
            abaAtiva === 'preview' ? 'bg-[#0F2C59] text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Visualizar PDF
        </button>
        <button
          onClick={onAbrirCalculadora}
          className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 bg-[#0F2C59] text-white shrink-0"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          Calcular
        </button>
        <button
          onClick={onAbrirSeguranca}
          className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-purple-600" />
          Segurança
        </button>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </header>
  );
};
