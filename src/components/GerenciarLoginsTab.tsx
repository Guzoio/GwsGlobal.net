import React, { useState } from 'react';
import { UsuarioLogin } from '../types';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  ShieldCheck,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
  BadgeCheck,
  Check,
} from 'lucide-react';

interface GerenciarLoginsTabProps {
  usuarios: UsuarioLogin[];
  usuarioLogado: UsuarioLogin | null;
  onAdicionarUsuario: (usuario: Omit<UsuarioLogin, 'id' | 'criadoEm'>) => boolean;
  onAtualizarUsuario: (usuario: UsuarioLogin) => void;
  onExcluirUsuario: (id: string) => boolean;
  mostrarToast: (msg: string, tipo?: 'sucesso' | 'erro') => void;
}

export const GerenciarLoginsTab: React.FC<GerenciarLoginsTabProps> = ({
  usuarios,
  usuarioLogado,
  onAdicionarUsuario,
  onAtualizarUsuario,
  onExcluirUsuario,
  mostrarToast,
}) => {
  // Estado do formulário de novo usuário
  const [novoNome, setNovoNome] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novaFuncao, setNovaFuncao] = useState('Operador de Pregão');
  const [novoIsAdmin, setNovoIsAdmin] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  // Modal para Alterar Senha
  const [usuarioParaAlterarSenha, setUsuarioParaAlterarSenha] = useState<UsuarioLogin | null>(null);
  const [campoNovaSenha, setCampoNovaSenha] = useState('');
  const [mostrarSenhaModal, setMostrarSenhaModal] = useState(false);

  // Modal para Alterar ID e Nome
  const [usuarioParaEditarDados, setUsuarioParaEditarDados] = useState<UsuarioLogin | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editFuncao, setEditFuncao] = useState('');

  // Modal para Excluir Usuário
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioLogin | null>(null);

  // Estado para revelar senhas na tabela
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});

  const toggleVerSenha = (id: string) => {
    setSenhasVisiveis(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handler para adicionar novo login
  const handleCriarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const loginLimpo = novoLogin.trim().toLowerCase();
    const nomeLimpo = novoNome.trim();
    const senhaLimpa = novaSenha.trim();

    if (!loginLimpo || !nomeLimpo || !senhaLimpa) {
      mostrarToast('Preencha o nome, ID de login e a senha.', 'erro');
      return;
    }

    // Verifica se já existe login igual
    const jaExiste = usuarios.some(u => u.login.toLowerCase() === loginLimpo);
    if (jaExiste) {
      mostrarToast(`O ID de login "${loginLimpo}" já está cadastrado. Escolha outro.`, 'erro');
      return;
    }

    const sucesso = onAdicionarUsuario({
      login: loginLimpo,
      nome: nomeLimpo,
      senha: senhaLimpa,
      funcao: novaFuncao,
      isAdmin: novoIsAdmin,
    });

    if (sucesso) {
      setNovoNome('');
      setNovoLogin('');
      setNovaSenha('');
      setNovaFuncao('Operador de Pregão');
      setNovoIsAdmin(false);
    }
  };

  // Handler para salvar nova senha
  const handleSalvarNovaSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaAlterarSenha) return;
    const senhaLimpa = campoNovaSenha.trim();
    if (!senhaLimpa) {
      mostrarToast('Digite a nova senha.', 'erro');
      return;
    }

    onAtualizarUsuario({
      ...usuarioParaAlterarSenha,
      senha: senhaLimpa,
    });

    mostrarToast(`Senha do usuário "${usuarioParaAlterarSenha.login}" alterada com sucesso!`);
    setUsuarioParaAlterarSenha(null);
    setCampoNovaSenha('');
  };

  // Abrir modal de edição de ID e Nome
  const abrirModalEditarDados = (user: UsuarioLogin) => {
    setUsuarioParaEditarDados(user);
    setEditNome(user.nome);
    setEditLogin(user.login);
    setEditFuncao(user.funcao || 'Operador de Pregão');
  };

  // Handler para salvar novo ID e Nome
  const handleSalvarEditarDados = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaEditarDados) return;

    const loginLimpo = editLogin.trim().toLowerCase();
    const nomeLimpo = editNome.trim();

    if (!loginLimpo || !nomeLimpo) {
      mostrarToast('O ID de login e o nome não podem ficar vazios.', 'erro');
      return;
    }

    // Se o login mudou, verifica duplicidade
    if (loginLimpo !== usuarioParaEditarDados.login.toLowerCase()) {
      const duplicado = usuarios.some(
        u => u.id !== usuarioParaEditarDados.id && u.login.toLowerCase() === loginLimpo
      );
      if (duplicado) {
        mostrarToast(`O ID de login "${loginLimpo}" já está em uso por outro usuário.`, 'erro');
        return;
      }
    }

    onAtualizarUsuario({
      ...usuarioParaEditarDados,
      login: loginLimpo,
      nome: nomeLimpo,
      funcao: editFuncao,
    });

    mostrarToast(`Dados do login "${loginLimpo}" atualizados com sucesso!`);
    setUsuarioParaEditarDados(null);
  };

  // Handler para confirmar exclusão
  const handleConfirmarExclusao = () => {
    if (!usuarioParaExcluir) return;

    if (usuarios.length <= 1) {
      mostrarToast('Você deve manter ao menos um usuário cadastrado.', 'erro');
      setUsuarioParaExcluir(null);
      return;
    }

    if (usuarioParaExcluir.id === usuarioLogado?.id) {
      mostrarToast('Você não pode excluir o usuário com o qual está conectado agora.', 'erro');
      setUsuarioParaExcluir(null);
      return;
    }

    onExcluirUsuario(usuarioParaExcluir.id);
    mostrarToast(`Login "${usuarioParaExcluir.login}" excluído com sucesso.`);
    setUsuarioParaExcluir(null);
  };

  const totalAdmins = usuarios.filter(u => u.isAdmin || u.funcao?.toLowerCase().includes('admin')).length;

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de Usuários */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" /> Total de Usuários Cadastrados
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {usuarios.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Logins habilitados para o sistema</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-[#0F2C59] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F2C59]" /> Administradores
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#0F2C59] tabular-nums">
            {totalAdmins}
          </div>
          <div className="mt-1 text-xs text-slate-500">Com privilégios de gestão</div>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Sessão Conectada Agora
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-900 truncate">
            {usuarioLogado?.nome || usuarioLogado?.login || 'gwsglobalnet'}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono">
            ID: <span className="font-semibold text-slate-700">{usuarioLogado?.login || 'gwsglobalnet'}</span>
          </div>
        </div>
      </div>

      {/* Formulário: Cadastrar Novo Login */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#0F2C59]" />
            Cadastrar Novo Login / Usuário
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Adicione novos membros da equipe com ID de acesso e senha para entrar no sistema.
          </p>
        </div>

        <form onSubmit={handleCriarLogin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Nome Completo */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Pessoa / Setor *
              </label>
              <input
                type="text"
                required
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                placeholder="Ex: Gustavo Henrique, Victor Lima"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
              />
            </div>

            {/* ID / Login */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID de Login (Usuário) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">@</span>
                <input
                  type="text"
                  required
                  value={novoLogin}
                  onChange={e => setNovoLogin(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Ex: gustavo, victor"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha Inicial *
              </label>
              <div className="relative">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  required
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={mostrarNovaSenha ? 'Ocultar' : 'Ver'}
                >
                  {mostrarNovaSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Função / Cargo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Função
              </label>
              <select
                value={novaFuncao}
                onChange={e => setNovaFuncao(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] cursor-pointer"
              >
                <option value="Administrador">Administrador</option>
                <option value="Operador de Pregão">Operador de Pregão</option>
                <option value="Comercial / Vendas">Comercial / Vendas</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Visualizador">Visualizador</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
              <input
                type="checkbox"
                checked={novoIsAdmin || novaFuncao === 'Administrador'}
                onChange={e => setNovoIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F2C59] accent-[#0F2C59] border-slate-300 cursor-pointer"
              />
              <span>Conceder privilégios de Administrador</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-[#0F2C59] hover:bg-[#163c78] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              Cadastrar Login
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Logins Cadastrados com Ações de Alterar Senha e ID */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0F2C59]" />
              Logins Cadastrados no Sistema
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualize os logins existentes, altere senhas, modifique IDs ou exclua acessos.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Login Padrão Master: <strong className="font-mono text-slate-900">gwsglobalnet</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F2C59] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Usuário / ID de Login</th>
                <th className="py-3 px-4">Nome da Pessoa</th>
                <th className="py-3 px-4">Função / Perfil</th>
                <th className="py-3 px-4">Senha Atual</th>
                <th className="py-3 px-4 text-center">Data Cadastro</th>
                <th className="py-3 px-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {usuarios.map((u, idx) => {
                const isAdmin = u.isAdmin || u.funcao?.toLowerCase().includes('admin');
                const isPadraoMaster = u.login.toLowerCase() === 'gwsglobalnet';
                const isAtual = u.id === usuarioLogado?.id;
                const senhaVisivel = !!senhasVisiveis[u.id];

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isAtual
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                        : idx % 2 === 1
                        ? 'bg-slate-50/60'
                        : 'bg-white'
                    } hover:bg-slate-100/70`}
                  >
                    {/* ID de Login */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                      <span className="p-1 rounded-md bg-[#0F2C59]/10 text-[#0F2C59]">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <span>{u.login}</span>
                      {isPadraoMaster && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded font-sans">
                          Padrão Admin
                        </span>
                      )}
                      {isAtual && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded font-sans">
                          Você
                        </span>
                      )}
                    </td>

                    {/* Nome */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {u.nome}
                    </td>

                    {/* Função */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          isAdmin
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-3 h-3 text-blue-700" /> : null}
                        {u.funcao || 'Operador'}
                      </span>
                    </td>

                    {/* Senha */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-800 tracking-wider text-[11px]">
                          {senhaVisivel ? u.senha : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleVerSenha(u.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                          title={senhaVisivel ? 'Ocultar senha' : 'Exibir senha'}
                        >
                          {senhaVisivel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Data */}
                    <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                      {u.criadoEm || '25/09/2026'}
                    </td>

                    {/* Ações: Alterar Senha, Alterar ID/Nome, Excluir */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Alterar Senha */}
                        <button
                          type="button"
                          onClick={() => {
                            setUsuarioParaAlterarSenha(u);
                            setCampoNovaSenha('');
                            setMostrarSenhaModal(false);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          title="Alterar a senha deste login"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span className="hidden sm:inline">Alterar Senha</span>
                        </button>

                        {/* Botão Alterar ID e Nome */}
                        <button
                          type="button"
                          onClick={() => abrirModalEditarDados(u)}
                          className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          title="Alterar ID de login ou nome da pessoa"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                          <span className="hidden sm:inline">Alterar ID</span>
                        </button>

                        {/* Botão Excluir */}
                        <button
                          type="button"
                          disabled={usuarios.length <= 1}
                          onClick={() => setUsuarioParaExcluir(u)}
                          className={`p-1 rounded-md transition-colors ${
                            usuarios.length <= 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                          }`}
                          title={
                            usuarios.length <= 1
                              ? 'Mantenha ao menos um login no sistema'
                              : `Excluir o login ${u.login}`
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ALTERAR SENHA DO LOGIN */}
      {/* ========================================================================= */}
      {usuarioParaAlterarSenha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setUsuarioParaAlterarSenha(null)}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setUsuarioParaAlterarSenha(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Alterar Senha de Acesso
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Defina a nova senha para o usuário{' '}
              <strong className="text-slate-900 font-mono">@{usuarioParaAlterarSenha.login}</strong>:
            </p>

            <form onSubmit={handleSalvarNovaSenha} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenhaModal ? 'text' : 'password'}
                    autoFocus
                    required
                    value={campoNovaSenha}
                    onChange={e => setCampoNovaSenha(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaModal(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarSenhaModal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUsuarioParaAlterarSenha(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALTERAR ID DE LOGIN E NOME */}
      {/* ========================================================================= */}
      {usuarioParaEditarDados && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setUsuarioParaEditarDados(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setUsuarioParaEditarDados(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              Alterar ID de Login e Nome
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Atualize as informações de identificação deste login no sistema.
            </p>

            <form onSubmit={handleSalvarEditarDados} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID de Login (Usuário de Acesso) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">@</span>
                  <input
                    type="text"
                    required
                    value={editLogin}
                    onChange={e => setEditLogin(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo / Pessoa *
                </label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Função / Cargo
                </label>
                <select
                  value={editFuncao}
                  onChange={e => setEditFuncao(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg cursor-pointer focus:bg-white focus:outline-hidden"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Operador de Pregão">Operador de Pregão</option>
                  <option value="Comercial / Vendas">Comercial / Vendas</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Visualizador">Visualizador</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUsuarioParaEditarDados(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DE LOGIN */}
      {/* ========================================================================= */}
      {usuarioParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setUsuarioParaExcluir(null)}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Excluir Login de Acesso?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir o login{' '}
                  <strong className="text-slate-900 font-mono">@{usuarioParaExcluir.login}</strong> ({usuarioParaExcluir.nome})?
                  Essa pessoa não conseguirá mais entrar no sistema com estas credenciais.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUsuarioParaExcluir(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
