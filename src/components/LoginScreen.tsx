import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { LogoGwsMartelo } from './LogoGwsMartelo';
import { AcessoConfig } from '../types';
import { verificarSenha, ID_PADRAO } from '../utils/security';

interface LoginScreenProps {
  acessoConfig: AcessoConfig;
  onLoginSucesso: (lembrar: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  acessoConfig,
  onLoginSucesso,
}) => {
  const [usuarioId, setUsuarioId] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const usuarioLimpo = usuarioId.trim();
    const senhaLimpa = senha.trim();

    if (!usuarioLimpo || !senhaLimpa) {
      setErro('Por favor, informe o ID de usuário e a senha.');
      return;
    }

    setCarregando(true);

    try {
      const idCorreto = (acessoConfig.usuarioId || ID_PADRAO).trim().toLowerCase();
      const usuarioValido = usuarioLimpo.toLowerCase() === idCorreto;
      const senhaValida = await verificarSenha(senhaLimpa, acessoConfig.senhaHash);

      if (usuarioValido && senhaValida) {
        onLoginSucesso(lembrar);
      } else {
        setErro('ID de usuário ou senha incorretos. Verifique suas credenciais.');
        setCarregando(false);
      }
    } catch {
      setErro('ID de usuário ou senha incorretos. Verifique suas credenciais.');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#07172F] via-[#0F2C59] to-[#0A1F3D] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Elementos visuais sutis de fundo */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Card do Formulário */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Logo e Cabeçalho */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0F2C59] shadow-md mb-3">
              <LogoGwsMartelo className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              GWS GLOBAL.net
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Sistema de Gestão de Licitações & Catálogos
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
              <Lock className="w-3 h-3 text-[#0F2C59]" />
              Acesso Administrativo Restrito
            </div>
          </div>

          {/* Mensagem de Erro Clara */}
          {erro && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Usuário / ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ID / Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Digite seu ID de acesso"
                  value={usuarioId}
                  onChange={e => setUsuarioId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Opção Lembrar Neste Computador */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={e => setLembrar(e.target.checked)}
                  className="w-4 h-4 text-[#0F2C59] rounded border-slate-300 focus:ring-[#0F2C59] cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Manter conectado neste computador
                </span>
              </label>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 py-3 px-4 bg-[#0F2C59] hover:bg-[#163c78] active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {carregando ? (
                <span>Verificando credenciais...</span>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Acesso protegido com criptografia SHA-256
            </span>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <p className="text-center text-[11px] text-slate-300 mt-4">
          GWS GLOBAL.net &bull; Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

