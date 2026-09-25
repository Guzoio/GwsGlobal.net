import React, { useState } from 'react';
import { LogoGwsMartelo } from './LogoGwsMartelo';
import { UsuarioLogin } from '../types';
import { Lock, User, Eye, EyeOff, LogIn, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSucesso: (usuario: UsuarioLogin) => void;
  usuariosDisponiveis: UsuarioLogin[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSucesso,
  usuariosDisponiveis,
}) => {
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lembrar, setLembrar] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const loginNormalizado = loginInput.trim().toLowerCase();
    const senhaLimpa = senhaInput.trim();

    if (!loginNormalizado || !senhaLimpa) {
      setErro('Por favor, informe o usuário e a senha.');
      return;
    }

    // Procura o usuário cadastrado correspondente (login é case-insensitive)
    const usuarioEncontrado = usuariosDisponiveis.find(
      u => u.login.toLowerCase() === loginNormalizado
    );

    if (!usuarioEncontrado) {
      setErro('Usuário / ID de login não encontrado no sistema.');
      return;
    }

    if (usuarioEncontrado.senha !== senhaLimpa) {
      setErro('Senha incorreta. Verifique os dados digitados.');
      return;
    }

    // Sucesso!
    onLoginSucesso(usuarioEncontrado);
  };

  const preencherAdminPadrao = () => {
    setLoginInput('gwsglobalnet');
    setSenhaInput('gwsglobal2026');
    setErro(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-[#0a1a33] to-[#0F2C59] flex items-center justify-center p-4 sm:p-6 text-slate-900 font-sans relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0F2C59]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Principal de Login */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-8 sm:p-10 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          {/* Logo e Cabeçalho */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-3 transform transition-transform hover:scale-105 duration-200">
              <LogoGwsMartelo className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              GWS GLOBAL.net
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Sistema de Gestão de Licitações & Propostas
            </p>
          </div>

          {/* Banner de Erro */}
          {erro && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Login */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuário / ID de Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  placeholder="Ex: gwsglobalnet"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Senha
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  value={senhaInput}
                  onChange={e => setSenhaInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opção Lembrar */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={e => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F2C59] accent-[#0F2C59] border-slate-300 focus:ring-2 focus:ring-[#0F2C59] cursor-pointer"
                />
                <span className="text-xs text-slate-600">Manter conectado</span>
              </label>

              <button
                type="button"
                onClick={preencherAdminPadrao}
                className="text-[11px] font-semibold text-[#0F2C59] hover:underline cursor-pointer flex items-center gap-1"
                title="Preencher com o login e senha padrão do administrador"
              >
                <KeyRound className="w-3 h-3 text-amber-500" />
                Usar Admin Padrão
              </button>
            </div>

            {/* Botão Entrar */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#0F2C59] hover:bg-[#163c78] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                Acessar Sistema
              </button>
            </div>
          </form>

          {/* Card com Credenciais Padrão do Sistema */}
          <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50/80 -mx-8 -mb-8 sm:-mx-10 sm:-mb-10 p-5 rounded-b-2xl border-t-slate-200/60">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">
                  Acesso Padrão do Administrador:
                </span>
                Login: <strong className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">gwsglobalnet</strong>
                {' • '}
                Senha: <strong className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">gwsglobal2026</strong>
                <p className="text-[10px] text-slate-400 mt-1">
                  Você pode criar novos logins ou alterar esta senha na aba Configurações após entrar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Externo */}
        <p className="text-center text-xs text-white/60 mt-6 font-medium">
          GWS GLOBAL.net • Gestão de Licitações e Propostas Comerciais
        </p>
      </div>
    </div>
  );
};
