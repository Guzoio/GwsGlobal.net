import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Volume2,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
  FileText,
  DollarSign,
  X,
} from 'lucide-react';
import { AlertaCobranca } from '../types';
import { formatarMoeda } from '../utils/numberToWordsPtBr';

interface SininhoNotificacoesProps {
  alertas: AlertaCobranca[];
  onNavegarParaCobranca: (cobrancaId?: string) => void;
  onTestarSom: () => void;
}

export const SininhoNotificacoes: React.FC<SininhoNotificacoesProps> = ({
  alertas,
  onNavegarParaCobranca,
  onTestarSom,
}) => {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'criticos' | 'hoje'>('todos');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    if (aberto) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [aberto]);

  // Contagens
  const totalAlertas = alertas.length;
  const alertasCriticos = alertas.filter(a => a.urgencia === 'critica');
  const alertasHoje = alertas.filter(a => a.diasRestantes === 0);

  const alertasFiltrados = alertas.filter(a => {
    if (filtro === 'criticos') return a.urgencia === 'critica';
    if (filtro === 'hoje') return a.diasRestantes === 0;
    return true;
  });

  const getIconeAlerta = (tipo: AlertaCobranca['tipo']) => {
    switch (tipo) {
      case 'entrega_hoje':
      case 'entrega_atrasada':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'nota_pendente':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'liquidacao_vencendo':
      case 'liquidacao_atrasada':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'pagamento_vencendo':
      case 'pagamento_atrasado':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botão do Sininho */}
      <button
        type="button"
        onClick={() => setAberto(prev => !prev)}
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          aberto
            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
            : totalAlertas > 0
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 shadow-2xs'
            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70'
        }`}
        title={
          totalAlertas > 0
            ? `${totalAlertas} alerta(s) de cobrança ativo(s)! Clique para ver prazos e entregas.`
            : 'Notificações de Cobranças (Nenhum alerta pendente)'
        }
      >
        <Bell className={`w-4 h-4 ${totalAlertas > 0 ? 'animate-bounce' : ''}`} />

        {/* Ponto Vermelho / Contador de Notificações */}
        {totalAlertas > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#0A162B] animate-pulse">
            {totalAlertas > 99 ? '99+' : totalAlertas}
          </span>
        )}
      </button>

      {/* Painel Dropdown do Sininho */}
      {aberto && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] max-w-[95vw] bg-white dark:bg-[#0A162B] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header do Painel */}
          <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-[#0E1F3D] border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Alertas de Cobranças</span>
                  {totalAlertas > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                      {totalAlertas}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Entregas, notas, liquidação e pagamentos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onTestarSom}
                title="Testar aviso sonoro de notificação"
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtros Rápidos */}
          {totalAlertas > 0 && (
            <div className="px-3.5 py-2 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-white/5 flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setFiltro('todos')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filtro === 'todos'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
              >
                Todos ({totalAlertas})
              </button>
              {alertasCriticos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiltro('criticos')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    filtro === 'criticos'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  <span>🔴 Atrasados ({alertasCriticos.length})</span>
                </button>
              )}
              {alertasHoje.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiltro('hoje')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    filtro === 'hoje'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <span>⚠️ Vence Hoje ({alertasHoje.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Lista de Alertas */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {alertasFiltrados.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                  Tudo em dia!
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Não há cobranças atrasadas ou com vencimento hoje. O sistema continuará monitorando automaticamente.
                </p>
              </div>
            ) : (
              alertasFiltrados.map(alerta => (
                <div
                  key={alerta.id}
                  onClick={() => {
                    setAberto(false);
                    onNavegarParaCobranca(alerta.cobrancaId);
                  }}
                  className={`p-3 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group flex items-start gap-3 ${
                    alerta.urgencia === 'critica'
                      ? 'bg-rose-50/30 dark:bg-rose-950/10'
                      : alerta.urgencia === 'alta'
                      ? 'bg-amber-50/30 dark:bg-amber-950/10'
                      : ''
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 border mt-0.5 ${
                      alerta.urgencia === 'critica'
                        ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                        : alerta.urgencia === 'alta'
                        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
                        : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900'
                    }`}
                  >
                    {getIconeAlerta(alerta.tipo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {alerta.titulo}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                        {formatarMoeda(alerta.valorNota)}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-1">
                      {alerta.prefeitura}
                      {alerta.numeroNota && (
                        <span className="text-slate-400 font-normal"> • NF: {alerta.numeroNota}</span>
                      )}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {alerta.mensagem}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          alerta.urgencia === 'critica'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : alerta.urgencia === 'alta'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {alerta.urgencia === 'critica'
                          ? 'Atrasado'
                          : alerta.diasRestantes === 0
                          ? 'Vence Hoje'
                          : 'Próximo'}
                      </span>

                      <span className="text-blue-600 dark:text-blue-400 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Abrir cobrança <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer do Painel */}
          <div className="p-3 bg-slate-50 dark:bg-[#0E1F3D] border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Módulo de Cobranças GWS
            </span>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                onNavegarParaCobranca();
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Painel Completo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
