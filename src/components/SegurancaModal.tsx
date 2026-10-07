import React, { useState } from 'react';
import { Shield, Key, User, Lock, Eye, EyeOff, Check, X, AlertCircle, Cloud, CheckCircle2 } from 'lucide-react';
import { AcessoConfig } from '../types';
import { verificarSenha, gerarHashSenha, ID_PADRAO } from '../utils/security';

interface SegurancaModalProps {
  aberto: boolean;
  onFechar: () => void;
  acessoAtual: AcessoConfig;
  onSalvarAcesso: (novoAcesso: AcessoConfig) => void;
}

export const SegurancaModal: React.FC<SegurancaModalProps> = ({
  aberto,
  onFechar,
  acessoAtual,
  onSalvarAcesso,
}) => {
  const [novoUsuarioId, setNovoUsuarioId] = useState(acessoAtual.usuarioId || ID_PADRAO);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const usuarioLimpo = novoUsuarioId.trim();
    const senhaAtualLimpa = senhaAtual.trim();
    const novaSenhaLimpa = novaSenha.trim();
    const confirmacaoLimpa = confirmarSenha.trim();

    if (!usuarioLimpo) {
      setErro('O Novo ID / Usuário não pode ficar vazio.');
      return;
    }

    if (!senhaAtualLimpa) {
      setErro('Informe a Senha Atual para autorizar a alteração.');
      return;
    }

    setSalvando(true);

    try {
      // 1. Exige a senha atual correta antes de permitir a mudança
      const senhaAtualValida = await verificarSenha(senhaAtualLimpa, acessoAtual.senhaHash);
      if (!senhaAtualValida) {
        setErro('A senha atual digitada está incorreta.');
        setSalvando(false);
        return;
      }

      let novoHash = acessoAtual.senhaHash;

      // 2. Se informou nova senha, valida regras de força e confirmação
      if (novaSenhaLimpa) {
        if (novaSenhaLimpa.length < 6) {
          setErro('A nova senha deve ter no mínimo 6 caracteres.');
          setSalvando(false);
          return;
        }

        if (novaSenhaLimpa !== confirmacaoLimpa) {
          setErro('A confirmação da nova senha não confere com a nova senha digitada.');
          setSalvando(false);
          return;
        }

        novoHash = await gerarHashSenha(novaSenhaLimpa);
      } else if (usuarioLimpo === (acessoAtual.usuarioId || ID_PADRAO)) {
        setErro('Nenhuma alteração foi realizada. Digite uma nova senha ou um novo ID.');
        setSalvando(false);
        return;
      }

      // Salva com hash seguro (nunca em texto puro)
      onSalvarAcesso({
        usuarioId: usuarioLimpo,
        senhaHash: novoHash,
        atualizadoEm: new Date().toISOString(),
      });

      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        onFechar();
      }, 1200);
    } catch {
      setErro('Erro ao validar ou salvar credenciais. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 bg-[#0A1D37] text-white flex items-center justify-between border-b border-[#152B4D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Segurança e Acesso
              </h3>
              <p className="text-[11px] text-slate-300">
                Gerenciar ID e Senha do Acesso Administrativo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
            <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              As credenciais são protegidas com hash criptográfico SHA-256 e sincronizadas na nuvem para manter o site protegido em qualquer dispositivo.
            </p>
          </div>

          {sucesso && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Alterações salvas com sucesso!</span>
            </div>
          )}

          {erro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {/* Campo ID / Usuário Atual (Somente Leitura) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              ID / Usuário Atual
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                disabled
                value={acessoAtual.usuarioId || ID_PADRAO}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-semibold bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed select-all"
              />
            </div>
          </div>

          {/* Campo Novo ID / Usuário */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Novo ID / Usuário
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={novoUsuarioId}
                onChange={e => setNovoUsuarioId(e.target.value)}
                placeholder="Ex: gwsglobal"
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-2" />

          {/* Campo Senha Atual (Exigida para autorização) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Senha Atual <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={mostrarSenhas ? 'text' : 'password'}
                required
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                placeholder="Digite a senha atual para autorizar"
                className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhas(prev => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={mostrarSenhas ? 'Ocultar senhas' : 'Ver senhas'}
              >
                {mostrarSenhas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Exigida para confirmar sua identidade antes de qualquer alteração.
            </p>
          </div>

          {/* Campo Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nova Senha (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={mostrarSenhas ? 'text' : 'password'}
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Deixe em branco se quiser manter a mesma"
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
              />
            </div>
          </div>

          {/* Campo Confirmar Nova Senha */}
          {novaSenha && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={mostrarSenhas ? 'text' : 'password'}
                  required
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Digite novamente a nova senha"
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
                />
              </div>
            </div>
          )}

          {/* Rodapé com Botões */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 bg-[#0F2C59] hover:bg-[#163c78] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {salvando ? 'Verificando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
