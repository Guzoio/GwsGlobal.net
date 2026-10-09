import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Lock,
  User,
  Building2,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Activity,
  Bot,
  Cookie,
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BllConfig, MetodoAutenticacaoBll } from '../types';
import { testarConexaoBll, tocarAlertaConvocacao } from '../utils/bllService';

interface BllConfigModalProps {
  aberto: boolean;
  onFechar: () => void;
  configAtual: BllConfig;
  onSalvarConfig: (novaConfig: BllConfig) => Promise<void> | void;
}

export const BllConfigModal: React.FC<BllConfigModalProps> = ({
  aberto,
  onFechar,
  configAtual,
  onSalvarConfig,
}) => {
  const [metodoAutenticacao, setMetodoAutenticacao] = useState<MetodoAutenticacaoBll>('emulacao_robo');
  const [usuario, setUsuario] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [cookieSessao, setCookieSessao] = useState<string>('');
  const [mostrarCookie, setMostrarCookie] = useState<boolean>(false);
  const [cnpj, setCnpj] = useState<string>('');
  const [ambiente, setAmbiente] = useState<'producao' | 'homologacao'>('producao');
  const [intervaloMinutos, setIntervaloMinutos] = useState<number>(5);
  const [notificarSom, setNotificarSom] = useState<boolean>(true);
  const [notificarUrgentes, setNotificarUrgentes] = useState<boolean>(true);
  const [guiaCookieAberto, setGuiaCookieAberto] = useState<boolean>(false);

  // Estados de teste de conexão
  const [testando, setTestando] = useState<boolean>(false);
  const [resultadoTeste, setResultadoTeste] = useState<{
    status: 'sucesso' | 'erro' | 'idle';
    mensagem: string;
    tempoMs?: number;
  }>({ status: 'idle', mensagem: '' });

  const [salvando, setSalvando] = useState<boolean>(false);

  useEffect(() => {
    if (aberto && configAtual) {
      setMetodoAutenticacao(configAtual.metodoAutenticacao || 'emulacao_robo');
      setUsuario(configAtual.usuario || '');
      setSenha(''); // Senha nunca é preenchida em texto claro por segurança
      setCookieSessao(''); // Cookie nunca é preenchido em texto claro por segurança
      setCnpj(configAtual.cnpj || '');
      setAmbiente(configAtual.ambiente || 'producao');
      setIntervaloMinutos(configAtual.intervaloMinutos || 5);
      setNotificarSom(configAtual.notificarSom !== false);
      setNotificarUrgentes(configAtual.notificarUrgentes !== false);
      setResultadoTeste({
        status: configAtual.statusConexao === 'conectado' ? 'sucesso' : configAtual.statusConexao === 'erro' ? 'erro' : 'idle',
        mensagem: configAtual.mensagemStatus || '',
      });
    }
  }, [aberto, configAtual]);

  if (!aberto) return null;

  const handleTestarConexao = async () => {
    setTestando(true);
    setResultadoTeste({ status: 'idle', mensagem: 'Testando emulação de conexão com o portal BLL Compras...' });

    try {
      const res = await testarConexaoBll({
        metodoAutenticacao,
        usuario: usuario.trim(),
        senha: senha.trim(),
        cookieSessao: cookieSessao.trim(),
        cnpj: cnpj.trim(),
        ambiente,
      });

      if (res.sucesso) {
        setResultadoTeste({
          status: 'sucesso',
          mensagem: res.mensagem || 'Conexão ativa e validada com o portal BLL Compras.',
          tempoMs: res.tempoRespostaMs,
        });
        if (notificarSom) {
          tocarAlertaConvocacao();
        }
      } else {
        setResultadoTeste({
          status: 'erro',
          mensagem: res.mensagem || 'Falha ao validar credenciais ou comunicar com o BLL Compras.',
          tempoMs: res.tempoRespostaMs,
        });
      }
    } catch (err: any) {
      setResultadoTeste({
        status: 'erro',
        mensagem: `Erro na verificação: ${err?.message || 'Serviço indisponível'}`,
      });
    } finally {
      setTestando(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const novaConfig: BllConfig = {
        ...configAtual,
        metodoAutenticacao,
        usuario: usuario.trim(),
        senha: senha.trim() ? senha.trim() : undefined,
        cookieSessao: cookieSessao.trim() ? cookieSessao.trim() : undefined,
        cnpj: cnpj.trim(),
        ambiente,
        intervaloMinutos,
        notificarSom,
        notificarUrgentes,
        statusConexao: resultadoTeste.status === 'sucesso' ? 'conectado' : resultadoTeste.status === 'erro' ? 'erro' : configAtual.statusConexao,
        mensagemStatus: resultadoTeste.mensagem || configAtual.mensagemStatus,
        ultimaConexaoEm: resultadoTeste.status === 'sucesso' ? new Date().toISOString() : configAtual.ultimaConexaoEm,
      };

      await onSalvarConfig(novaConfig);
      onFechar();
    } finally {
      setSalvando(false);
    }
  };

  const podeTestar =
    (metodoAutenticacao === 'emulacao_robo' && (Boolean(usuario) || Boolean(configAtual.usuario))) ||
    (metodoAutenticacao === 'cookie_sessao' && (Boolean(cookieSessao) || Boolean(configAtual.cookieMascarado)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0B1728] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header do Modal */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#081220] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate flex items-center gap-2">
                Integração BLL Compras
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Radar Automático
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Emulação de sessão web para monitoramento contínuo de pregões e convocações
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com formulário */}
        <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card explicativo sobre a ausência de API pública no BLL Compras */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-950 dark:text-amber-200 block">
                  Como funciona a conexão com o BLL Compras?
                </span>
                <p className="text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                  O portal BLL Compras <strong>não fornece chaves de API nem tokens públicos</strong> para fornecedores. O acesso para monitoramento é realizado através de <strong>Emulação de Sessão de Navegador (Robô Web)</strong> ou por <strong>Sessão Ativa do Navegador (Cookie)</strong>, exatamente como as principais plataformas de licitação operam.
                </p>
              </div>
            </div>
          </div>

          {/* Escolha do Método de Conexão */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Selecione o Método de Autenticação
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção 1: Robô Web com Login e Senha */}
              <button
                type="button"
                onClick={() => setMetodoAutenticacao('emulacao_robo')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoAutenticacao === 'emulacao_robo'
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Bot className="w-4 h-4" />
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        metodoAutenticacao === 'emulacao_robo'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {metodoAutenticacao === 'emulacao_robo' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Robô Web (Login e Senha)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    O sistema emula cabeçalhos e sessão de navegador desktop com seu usuário e senha.
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  Acesso Direto Automatizado
                </div>
              </button>

              {/* Opção 2: Sessão Ativa / Cookie do Navegador */}
              <button
                type="button"
                onClick={() => setMetodoAutenticacao('cookie_sessao')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoAutenticacao === 'cookie_sessao'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Cookie className="w-4 h-4" />
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        metodoAutenticacao === 'cookie_sessao'
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {metodoAutenticacao === 'cookie_sessao' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Sessão Ativa do Navegador
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                      Zero CAPTCHA
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Você loga como humano no Chrome/Edge e cola a sessão aqui. Sem risco de bloqueios.
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Recomendado para Portais com Validação
                </div>
              </button>
            </div>
          </div>

          {/* Campos específicos conforme o método */}
          {metodoAutenticacao === 'emulacao_robo' ? (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Credenciais de Login BLL
                </h3>
                <a
                  href="https://bllcompras.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Portal BLL <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Usuário / Login / E-mail / CPF */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Login / Usuário / E-mail BLL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={usuario}
                      onChange={e => setUsuario(e.target.value)}
                      placeholder="ex: fornecedor@empresa.com ou login"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Senha do BLL Compras
                    </label>
                    {configAtual.senhaMascarada && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Senha salva no servidor
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder={configAtual.senhaMascarada ? '•••••••• (Deixe vazio para manter)' : 'Sua senha do BLL'}
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                      title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {mostrarSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>A senha nunca é salva no navegador em texto puro, sendo transmitida de forma criptografada para o servidor.</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Importante: Teclado Virtual e Captcha no BLL Compras
                </span>
                <p className="leading-relaxed">
                  O portal BLL adota teclado virtual numérico embaralhado e Google reCAPTCHA v3. Por isso, bots em nuvem são barrados se não houver interação humana. Para monitorar o chat em tempo real sem bloqueios, recomendamos usar a <strong>"Sessão Ativa do Navegador"</strong> (ao lado) ou o botão <strong>"Colar Comunicado"</strong> na tela de Monitoramento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Cookie / Token de Sessão Ativa
                </h3>
                <button
                  type="button"
                  onClick={() => setGuiaCookieAberto(prev => !prev)}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Como pegar no Chrome?</span>
                  {guiaCookieAberto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Guia explicativo retrátil */}
              {guiaCookieAberto && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Passo a passo rápido (Leva 15 segundos):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <li>Abra uma aba no seu navegador e faça login normal em <strong>bllcompras.com</strong>.</li>
                    <li>Com a página do BLL aberta, aperte a tecla <strong>F12</strong> (ou clique com botão direito &gt; <em>Inspecionar</em>).</li>
                    <li>Vá na aba <strong>Aplicação (Application)</strong> &gt; no menu lateral clique em <strong>Cookies</strong> &gt; <code>https://bllcompras.com</code>.</li>
                    <li>Encontre o cookie <strong>ASP.NET_SessionId</strong> (ou <strong>.ASPXAUTH</strong>), clique duas vezes sobre o valor e copie (Ctrl+C).</li>
                    <li>Cole aqui no campo abaixo! O sistema navegará com a sua sessão já autenticada e humana.</li>
                  </ol>
                </div>
              )}

              {/* Campo do Cookie */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cookie de Sessão do BLL (ASP.NET_SessionId) <span className="text-rose-500">*</span>
                  </label>
                  {configAtual.cookieMascarado && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sessão já gravada no servidor
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Cookie className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarCookie ? 'text' : 'password'}
                    value={cookieSessao}
                    onChange={e => setCookieSessao(e.target.value)}
                    placeholder={configAtual.cookieMascarado ? '•••••••••••••••• (Deixe vazio para manter a sessão salva)' : 'Cole o cookie ASP.NET_SessionId ou valor completo'}
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarCookie(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                    title={mostrarCookie ? 'Ocultar cookie' : 'Ver cookie'}
                  >
                    {mostrarCookie ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Identificação de Usuário / Empresa opcional para rotulagem */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Identificador / E-mail (Opcional - Apenas para referência no painel)
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  placeholder="ex: fornecedor@empresa.com"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono"
                />
              </div>
            </div>
          )}

          {/* Dados Complementares e Preferências */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Preferências do Radar
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CNPJ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  CNPJ da Empresa
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Frequência de checagem */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Intervalo do Radar
                </label>
                <select
                  value={intervaloMinutos}
                  onChange={e => setIntervaloMinutos(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value={2}>A cada 2 minutos (Disputa Ativa)</option>
                  <option value={5}>A cada 5 minutos (Recomendado)</option>
                  <option value={10}>A cada 10 minutos (Econômico)</option>
                  <option value={15}>A cada 15 minutos</option>
                </select>
              </div>

              {/* Ambiente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ambiente do Portal
                </label>
                <select
                  value={ambiente}
                  onChange={e => setAmbiente(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="producao">Produção (bllcompras.com)</option>
                  <option value="homologacao">Treinamento / Homologação</option>
                </select>
              </div>
            </div>

            {/* Toggles de Notificações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={notificarSom}
                  onChange={e => setNotificarSom(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {notificarSom ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    Alerta Sonoro (Bip)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tocar aviso ao receber convocação ou diligência
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    tocarAlertaConvocacao();
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 cursor-pointer shrink-0"
                >
                  Testar Som
                </button>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={notificarUrgentes}
                  onChange={e => setNotificarUrgentes(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Destaque de Prazos Urgentes
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Banner flutuante com contagem regressiva para anexos
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Seção de Teste de Conexão */}
          <div className="p-4.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      resultadoTeste.status === 'sucesso'
                        ? 'bg-emerald-500'
                        : resultadoTeste.status === 'erro'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  Status do Conector BLL Compras
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {metodoAutenticacao === 'emulacao_robo'
                    ? 'Testa o handshake de emulação de navegador desktop contra o portal BLL.'
                    : 'Testa a validade da sessão web ativa fornecida.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestarConexao}
                disabled={testando || !podeTestar}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {testando ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Testando Conexão...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span>Testar Conexão Agora</span>
                  </>
                )}
              </button>
            </div>

            {/* Feedback do Teste */}
            {resultadoTeste.status !== 'idle' && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  resultadoTeste.status === 'sucesso'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                {resultadoTeste.status === 'sucesso' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold leading-tight">
                    {resultadoTeste.status === 'sucesso' ? 'Conexão Estabelecida com Sucesso' : 'Falha na Comunicação'}
                    {resultadoTeste.tempoMs && (
                      <span className="font-mono text-[10px] ml-2 opacity-80">({resultadoTeste.tempoMs}ms)</span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {resultadoTeste.mensagem}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé do Modal */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onFechar}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Integração BLL</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
