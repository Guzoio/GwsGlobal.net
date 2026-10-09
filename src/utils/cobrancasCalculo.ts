import { Cobranca, AlertaCobranca, StatusCobranca } from '../types';

/**
 * Feriados nacionais fixos no Brasil (mês-dia)
 */
const FERIADOS_NACIONAIS = new Set([
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '11-20', // Dia da Consciência Negra
  '12-25', // Natal
]);

/**
 * Converte data string (YYYY-MM-DD ou DD/MM/YYYY) para Date normalizado (meio-dia para evitar DST)
 */
export function normalizarData(dataStr?: string | null): Date | null {
  if (!dataStr || typeof dataStr !== 'string') return null;
  const limpa = dataStr.trim();
  if (!limpa) return null;

  try {
    if (limpa.includes('/')) {
      const partes = limpa.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const ano = parseInt(partes[2], 10);
        const d = new Date(ano, mes, dia, 12, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
      }
    } else if (limpa.includes('-')) {
      const partes = limpa.split('-');
      if (partes.length === 3) {
        const ano = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2].substring(0, 2), 10);
        const d = new Date(ano, mes, dia, 12, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
      }
    }
    const d = new Date(limpa);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Formata Date ou dataStr para YYYY-MM-DD (para inputs HTML date)
 */
export function paraFormatoIsoData(data: Date | string | null | undefined): string {
  if (!data) return '';
  const d = data instanceof Date ? data : normalizarData(data);
  if (!d) return '';
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Formata Date ou dataStr para DD/MM/AAAA (padrão brasileiro de visualização)
 */
export function formatarDataPtBr(data: Date | string | null | undefined): string {
  if (!data) return '—';
  const d = data instanceof Date ? data : normalizarData(data);
  if (!d) return typeof data === 'string' ? data : '—';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Verifica se um dia é útil (segunda a sexta e não feriado nacional)
 */
export function ehDiaUtil(data: Date): boolean {
  const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) return false;

  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const dd = String(data.getDate()).padStart(2, '0');
  const chave = `${mm}-${dd}`;
  if (FERIADOS_NACIONAIS.has(chave)) return false;

  return true;
}

/**
 * Adiciona dias úteis a uma data
 */
export function adicionarDiasUteis(dataBase: Date | string, qtdDias: number): Date {
  const base = dataBase instanceof Date ? new Date(dataBase.getTime()) : (normalizarData(dataBase) || new Date());
  base.setHours(12, 0, 0, 0);

  if (qtdDias <= 0) return base;

  let restantes = qtdDias;
  const cursor = new Date(base.getTime());

  while (restantes > 0) {
    cursor.setDate(cursor.getDate() + 1);
    if (ehDiaUtil(cursor)) {
      restantes--;
    }
  }

  return cursor;
}

/**
 * Adiciona dias corridos a uma data
 */
export function adicionarDiasCorridos(dataBase: Date | string, qtdDias: number): Date {
  const base = dataBase instanceof Date ? new Date(dataBase.getTime()) : (normalizarData(dataBase) || new Date());
  base.setHours(12, 0, 0, 0);

  const cursor = new Date(base.getTime());
  cursor.setDate(cursor.getDate() + qtdDias);
  return cursor;
}

/**
 * Calcula a data limite baseado no tipo de contagem (úteis ou corridos)
 */
export function calcularDataLimite(
  dataBase: string | Date | undefined | null,
  qtdDias: number,
  tipo: 'uteis' | 'corridos'
): Date | null {
  if (!dataBase || qtdDias === undefined || isNaN(qtdDias)) return null;
  const base = dataBase instanceof Date ? dataBase : normalizarData(dataBase);
  if (!base) return null;

  if (tipo === 'uteis') {
    return adicionarDiasUteis(base, qtdDias);
  }
  return adicionarDiasCorridos(base, qtdDias);
}

/**
 * Calcula a diferença em dias entre a data alvo e a data de hoje.
 * < 0: Atrasado por X dias
 * = 0: Vence hoje!
 * > 0: Faltam X dias
 */
export function diferencaEmDiasParaHoje(dataAlvo: Date | string | null | undefined): number | null {
  if (!dataAlvo) return null;
  const alvo = dataAlvo instanceof Date ? dataAlvo : normalizarData(dataAlvo);
  if (!alvo) return null;

  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  const alvoMeioDia = new Date(alvo.getTime());
  alvoMeioDia.setHours(12, 0, 0, 0);

  const diffMs = alvoMeioDia.getTime() - hoje.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDias;
}

export interface InfoEtapaCalculada {
  ativa: boolean;
  concluida: boolean;
  dataInicio?: string;
  dataLimite?: string;
  diasRestantes?: number | null;
  mensagem: string;
  statusBadge: 'concluido' | 'aguardando' | 'em_dia' | 'atencao' | 'atrasado';
}

export interface AnaliseCobrancaCompleta {
  status: StatusCobranca;
  statusRotulo: string;
  statusCor: string;
  statusIcone: string;
  etapaEntrega: InfoEtapaCalculada;
  etapaNota: InfoEtapaCalculada;
  etapaLiquidacao: InfoEtapaCalculada;
  etapaPagamento: InfoEtapaCalculada;
  alertaPrioritario?: string;
}

/**
 * Realiza toda a análise encadeada e cálculos de prazos de uma cobrança
 */
export function analisarCobranca(c: Cobranca): AnaliseCobrancaCompleta {
  // 1. Etapa de Entrega
  const entregaConcluida = Boolean(c.produtoRecebido || c.dataRealEntrega);
  let statusEntrega: InfoEtapaCalculada['statusBadge'] = 'aguardando';
  let mensagemEntrega = 'Aguardando envio dos produtos';
  let diasRestantesEntrega: number | null = null;

  if (entregaConcluida) {
    statusEntrega = 'concluido';
    mensagemEntrega = `Entregue em ${formatarDataPtBr(c.dataRealEntrega || c.dataPrevisaoEntrega)}`;
  } else if (c.dataPrevisaoEntrega) {
    diasRestantesEntrega = diferencaEmDiasParaHoje(c.dataPrevisaoEntrega);
    if (diasRestantesEntrega !== null) {
      if (diasRestantesEntrega < 0) {
        statusEntrega = 'atrasado';
        mensagemEntrega = `Chegada atrasada há ${Math.abs(diasRestantesEntrega)} dias (${formatarDataPtBr(c.dataPrevisaoEntrega)})`;
      } else if (diasRestantesEntrega === 0) {
        statusEntrega = 'atencao';
        mensagemEntrega = 'Previsão de chegada HOJE! Verifique a entrega.';
      } else {
        statusEntrega = 'em_dia';
        mensagemEntrega = `Previsão em ${diasRestantesEntrega} dias (${formatarDataPtBr(c.dataPrevisaoEntrega)})`;
      }
    }
  } else if (c.dataEnvioProdutos) {
    statusEntrega = 'em_dia';
    mensagemEntrega = `Produtos enviados em ${formatarDataPtBr(c.dataEnvioProdutos)}`;
  }

  const etapaEntrega: InfoEtapaCalculada = {
    ativa: !entregaConcluida,
    concluida: entregaConcluida,
    dataInicio: c.dataEnvioProdutos,
    dataLimite: c.dataPrevisaoEntrega,
    diasRestantes: diasRestantesEntrega,
    mensagem: mensagemEntrega,
    statusBadge: statusEntrega,
  };

  // 2. Etapa de Nota Fiscal
  const notaConcluida = Boolean(c.notaEnviada || c.dataEnvioNota);
  let statusNota: InfoEtapaCalculada['statusBadge'] = 'aguardando';
  let mensagemNota = 'Aguardando envio da nota fiscal';

  if (notaConcluida) {
    statusNota = 'concluido';
    mensagemNota = `Nota enviada em ${formatarDataPtBr(c.dataEnvioNota)}${c.numeroNota ? ` (NF ${c.numeroNota})` : ''}`;
  } else if (entregaConcluida) {
    statusNota = 'atencao';
    mensagemNota = 'Produtos já entregues! Enviar nota fiscal à prefeitura.';
  }

  const etapaNota: InfoEtapaCalculada = {
    ativa: entregaConcluida && !notaConcluida,
    concluida: notaConcluida,
    dataInicio: c.dataEnvioNota,
    mensagem: mensagemNota,
    statusBadge: statusNota,
  };

  // 3. Etapa de Liquidação (Cálculo Encadeado com regra individual)
  const dataInicioLiq = c.eventoInicioLiquidacao === 'entrega' ? c.dataRealEntrega : c.dataEnvioNota;
  const liquidado = Boolean(c.liquidado || c.dataRealLiquidacao);
  let statusLiq: InfoEtapaCalculada['statusBadge'] = 'aguardando';
  let mensagemLiq = `Aguardando ${c.eventoInicioLiquidacao === 'entrega' ? 'entrega do produto' : 'envio da nota'} para iniciar contagem`;
  let dataLimiteLiqStr: string | undefined = undefined;
  let diasRestantesLiq: number | null = null;

  if (liquidado) {
    statusLiq = 'concluido';
    mensagemLiq = `Liquidado em ${formatarDataPtBr(c.dataRealLiquidacao)}`;
  } else if (dataInicioLiq) {
    const dataLimiteDate = calcularDataLimite(dataInicioLiq, c.diasLiquidacao, c.tipoDiasLiquidacao);
    if (dataLimiteDate) {
      dataLimiteLiqStr = paraFormatoIsoData(dataLimiteDate);
      diasRestantesLiq = diferencaEmDiasParaHoje(dataLimiteDate);
      if (diasRestantesLiq !== null) {
        if (diasRestantesLiq < 0) {
          statusLiq = 'atrasado';
          mensagemLiq = `🔴 Liquidação atrasada há ${Math.abs(diasRestantesLiq)} dias (limite: ${formatarDataPtBr(dataLimiteLiqStr)})`;
        } else if (diasRestantesLiq === 0) {
          statusLiq = 'atencao';
          mensagemLiq = `⚠️ Prazo limite de liquidação vence HOJE (${formatarDataPtBr(dataLimiteLiqStr)})`;
        } else if (diasRestantesLiq <= 3) {
          statusLiq = 'atencao';
          mensagemLiq = `⏳ Faltam ${diasRestantesLiq} dias para o prazo de liquidação (${formatarDataPtBr(dataLimiteLiqStr)})`;
        } else {
          statusLiq = 'em_dia';
          mensagemLiq = `⏳ Faltam ${diasRestantesLiq} dias para liquidação (${formatarDataPtBr(dataLimiteLiqStr)})`;
        }
      }
    }
  }

  const etapaLiquidacao: InfoEtapaCalculada = {
    ativa: Boolean(dataInicioLiq && !liquidado),
    concluida: liquidado,
    dataInicio: dataInicioLiq,
    dataLimite: dataLimiteLiqStr,
    diasRestantes: diasRestantesLiq,
    mensagem: mensagemLiq,
    statusBadge: statusLiq,
  };

  // 4. Etapa de Pagamento (Cálculo Encadeado - NUNCA inicia antes da liquidação se configurado para iniciar dela!)
  const dataInicioPag =
    c.eventoInicioPagamento === 'liquidacao'
      ? c.dataRealLiquidacao
      : c.eventoInicioPagamento === 'envio_nota'
      ? c.dataEnvioNota
      : c.dataRealEntrega;

  const pago = Boolean(c.pago || c.dataRealPagamento);
  let statusPag: InfoEtapaCalculada['statusBadge'] = 'aguardando';
  let mensagemPag =
    c.eventoInicioPagamento === 'liquidacao'
      ? 'Aguardando liquidação da prefeitura para iniciar contagem'
      : 'Aguardando evento inicial para contagem do pagamento';
  let dataLimitePagStr: string | undefined = undefined;
  let diasRestantesPag: number | null = null;

  if (pago) {
    statusPag = 'concluido';
    mensagemPag = `Pago em ${formatarDataPtBr(c.dataRealPagamento)}`;
  } else if (dataInicioPag) {
    const dataLimiteDate = calcularDataLimite(dataInicioPag, c.diasPagamento, c.tipoDiasPagamento);
    if (dataLimiteDate) {
      dataLimitePagStr = paraFormatoIsoData(dataLimiteDate);
      diasRestantesPag = diferencaEmDiasParaHoje(dataLimiteDate);
      if (diasRestantesPag !== null) {
        if (diasRestantesPag < 0) {
          statusPag = 'atrasado';
          mensagemPag = `🔴 Pagamento atrasado há ${Math.abs(diasRestantesPag)} dias (limite: ${formatarDataPtBr(dataLimitePagStr)})`;
        } else if (diasRestantesPag === 0) {
          statusPag = 'atencao';
          mensagemPag = `⚠️ Data limite para pagamento vence HOJE (${formatarDataPtBr(dataLimitePagStr)})`;
        } else if (diasRestantesPag <= 3) {
          statusPag = 'atencao';
          mensagemPag = `💰 Faltam ${diasRestantesPag} dias para o prazo de pagamento (${formatarDataPtBr(dataLimitePagStr)})`;
        } else {
          statusPag = 'em_dia';
          mensagemPag = `💰 Faltam ${diasRestantesPag} dias para o pagamento (${formatarDataPtBr(dataLimitePagStr)})`;
        }
      }
    }
  }

  const etapaPagamento: InfoEtapaCalculada = {
    ativa: Boolean(dataInicioPag && !pago),
    concluida: pago,
    dataInicio: dataInicioPag,
    dataLimite: dataLimitePagStr,
    diasRestantes: diasRestantesPag,
    mensagem: mensagemPag,
    statusBadge: statusPag,
  };

  // 5. Determinação do Status Geral & Cores do Card
  let statusGeral: StatusCobranca = 'em_dia';
  let statusRotulo = 'Em dia';
  let statusCor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40';
  let statusIcone = '🟢';
  let alertaPrioritario: string | undefined = undefined;

  if (pago) {
    statusGeral = 'pago';
    statusRotulo = 'Pago';
    statusCor = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700';
    statusIcone = '✅';
  } else if (etapaPagamento.statusBadge === 'atrasado') {
    statusGeral = 'pagamento_atrasado';
    statusRotulo = 'Pagamento Atrasado';
    statusCor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800';
    statusIcone = '🔴';
    alertaPrioritario = etapaPagamento.mensagem;
  } else if (etapaPagamento.statusBadge === 'atencao') {
    statusGeral = 'proximo_vencimento';
    statusRotulo = 'Pagamento Vencendo';
    statusCor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800';
    statusIcone = '🟡';
    alertaPrioritario = etapaPagamento.mensagem;
  } else if (etapaPagamento.ativa) {
    statusGeral = 'aguardando_pagamento';
    statusRotulo = 'Aguardando Pagamento';
    statusCor = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800';
    statusIcone = '💰';
  } else if (etapaLiquidacao.statusBadge === 'atrasado') {
    statusGeral = 'liquidacao_atrasada';
    statusRotulo = 'Liquidação Atrasada';
    statusCor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800';
    statusIcone = '🔴';
    alertaPrioritario = etapaLiquidacao.mensagem;
  } else if (etapaLiquidacao.statusBadge === 'atencao') {
    statusGeral = 'proximo_vencimento';
    statusRotulo = 'Liquidação Vencendo';
    statusCor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800';
    statusIcone = '🟡';
    alertaPrioritario = etapaLiquidacao.mensagem;
  } else if (etapaLiquidacao.ativa) {
    statusGeral = 'aguardando_liquidacao';
    statusRotulo = 'Aguardando Liquidação';
    statusCor = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-800';
    statusIcone = '⏳';
  } else if (etapaNota.ativa) {
    statusGeral = 'aguardando_nota';
    statusRotulo = 'Aguardando Envio da NF';
    statusCor = 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-800';
    statusIcone = '🧾';
    alertaPrioritario = 'Produtos entregues. Enviar nota fiscal para a prefeitura.';
  } else if (etapaEntrega.statusBadge === 'atrasado' || etapaEntrega.statusBadge === 'atencao') {
    statusGeral = 'verificar_entrega';
    statusRotulo = etapaEntrega.statusBadge === 'atencao' ? 'Verificar Entrega (Hoje)' : 'Entrega Atrasada';
    statusCor = etapaEntrega.statusBadge === 'atencao'
      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800'
      : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800';
    statusIcone = '📦';
    alertaPrioritario = etapaEntrega.mensagem;
  } else {
    statusGeral = 'aguardando_entrega';
    statusRotulo = 'Aguardando Entrega';
    statusCor = 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    statusIcone = '📦';
  }

  return {
    status: statusGeral,
    statusRotulo,
    statusCor,
    statusIcone,
    etapaEntrega,
    etapaNota,
    etapaLiquidacao,
    etapaPagamento,
    alertaPrioritario,
  };
}

/**
 * Gera lista de alertas ativos para o painel e o Sininho de Notificações Global
 */
export function gerarAlertasCobrancas(cobrancas: Cobranca[]): AlertaCobranca[] {
  const alertas: AlertaCobranca[] = [];

  for (const c of cobrancas) {
    if (c.pago) continue; // Cobrança totalmente concluída não gera alertas

    const analise = analisarCobranca(c);

    // 1. Alerta de Entrega
    if (!c.produtoRecebido && !c.dataRealEntrega && c.dataPrevisaoEntrega) {
      const dias = diferencaEmDiasParaHoje(c.dataPrevisaoEntrega);
      if (dias !== null) {
        if (dias === 0) {
          alertas.push({
            id: `alerta_entrega_hoje_${c.id}`,
            cobrancaId: c.id,
            prefeitura: c.prefeitura,
            numeroNota: c.numeroNota,
            valorNota: c.valorNota,
            tipo: 'entrega_hoje',
            titulo: '📦 Verificar entrega',
            mensagem: `Os produtos da ${c.prefeitura} estão previstos para chegar hoje. Verifique se a entrega foi realizada.`,
            diasRestantes: 0,
            urgencia: 'alta',
            dataLimite: c.dataPrevisaoEntrega,
            dataCriacao: new Date().toISOString(),
          });
        } else if (dias < 0) {
          alertas.push({
            id: `alerta_entrega_atrasada_${c.id}`,
            cobrancaId: c.id,
            prefeitura: c.prefeitura,
            numeroNota: c.numeroNota,
            valorNota: c.valorNota,
            tipo: 'entrega_atrasada',
            titulo: '📦 Entrega Atrasada',
            mensagem: `Previsão de entrega na ${c.prefeitura} venceu há ${Math.abs(dias)} dias. Confirme o recebimento com a prefeitura.`,
            diasRestantes: dias,
            urgencia: 'critica',
            dataLimite: c.dataPrevisaoEntrega,
            dataCriacao: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Alerta de Envio de Nota Fiscal
    if ((c.produtoRecebido || c.dataRealEntrega) && (!c.notaEnviada && !c.dataEnvioNota)) {
      alertas.push({
        id: `alerta_nota_pendente_${c.id}`,
        cobrancaId: c.id,
        prefeitura: c.prefeitura,
        numeroNota: c.numeroNota,
        valorNota: c.valorNota,
        tipo: 'nota_pendente',
        titulo: '🧾 Nota Fiscal Pendente',
        mensagem: `Produtos entregues na ${c.prefeitura}. Lembre-se de enviar a nota fiscal para abrir o prazo de liquidação.`,
        urgencia: 'media',
        dataCriacao: new Date().toISOString(),
      });
    }

    // 3. Alerta de Liquidação
    if (!c.liquidado && !c.dataRealLiquidacao && analise.etapaLiquidacao.ativa && analise.etapaLiquidacao.dataLimite) {
      const dias = analise.etapaLiquidacao.diasRestantes;
      if (dias !== null && dias !== undefined) {
        if (dias < 0) {
          alertas.push({
            id: `alerta_liq_atrasada_${c.id}`,
            cobrancaId: c.id,
            prefeitura: c.prefeitura,
            numeroNota: c.numeroNota,
            valorNota: c.valorNota,
            tipo: 'liquidacao_atrasada',
            titulo: '🔴 Liquidação Atrasada',
            mensagem: `A liquidação na ${c.prefeitura} está atrasada há ${Math.abs(dias)} dias (prazo limite: ${formatarDataPtBr(analise.etapaLiquidacao.dataLimite)}). Cobrar o setor contábil!`,
            diasRestantes: dias,
            urgencia: 'critica',
            dataLimite: analise.etapaLiquidacao.dataLimite,
            dataCriacao: new Date().toISOString(),
          });
        } else if (dias <= 3) {
          alertas.push({
            id: `alerta_liq_vencendo_${c.id}`,
            cobrancaId: c.id,
            prefeitura: c.prefeitura,
            numeroNota: c.numeroNota,
            valorNota: c.valorNota,
            tipo: 'liquidacao_vencendo',
            titulo: dias === 0 ? '⏳ Liquidação Vence HOJE' : '⏳ Liquidação Próxima do Vencimento',
            mensagem: dias === 0
              ? `O prazo limite de liquidação da ${c.prefeitura} vence hoje!`
              : `Faltam apenas ${dias} dias para o prazo de liquidação da ${c.prefeitura} (limite: ${formatarDataPtBr(analise.etapaLiquidacao.dataLimite)}).`,
            diasRestantes: dias,
            urgencia: dias === 0 ? 'alta' : 'media',
            dataLimite: analise.etapaLiquidacao.dataLimite,
            dataCriacao: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Alerta de Pagamento
    if (!c.pago && !c.dataRealPagamento && analise.etapaPagamento.ativa && analise.etapaPagamento.dataLimite) {
      const dias = analise.etapaPagamento.diasRestantes;
      if (dias !== null && dias !== undefined) {
        if (dias < 0) {
          alertas.push({
            id: `alerta_pag_atrasado_${c.id}`,
            cobrancaId: c.id,
            prefeitura: c.prefeitura,
            numeroNota: c.numeroNota,
            valorNota: c.valorNota,
            tipo: 'pagamento_atrasado',
            titulo: '🔴 Pagamento Atrasado',
            mensagem: `O pagamento de R$ ${c.valorNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} da ${c.prefeitura} está atrasado há ${Math.abs(dias)} dias! Entrar em contato com a tesouraria.`,
            diasRestantes: dias,
            urgencia: 'critica',
            dataLimite: analise.etapaPagamento.dataLimite,
            dataCriacao: new Date().toISOString(),
          });
        } else if (dias <= 3) {
          alertas.push({
            id: `alerta_pag_vencendo_${c.id}`,
            cobrancaId: c.id,
            prefeitura: c.prefeitura,
            numeroNota: c.numeroNota,
            valorNota: c.valorNota,
            tipo: 'pagamento_vencendo',
            titulo: dias === 0 ? '💰 Pagamento Vence HOJE' : '💰 Pagamento Próximo do Vencimento',
            mensagem: dias === 0
              ? `A data limite para pagamento da ${c.prefeitura} (R$ ${c.valorNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) vence hoje!`
              : `Faltam ${dias} dias para a data limite de pagamento da ${c.prefeitura} (limite: ${formatarDataPtBr(analise.etapaPagamento.dataLimite)}).`,
            diasRestantes: dias,
            urgencia: dias === 0 ? 'alta' : 'media',
            dataLimite: analise.etapaPagamento.dataLimite,
            dataCriacao: new Date().toISOString(),
          });
        }
      }
    }
  }

  // Ordena alertas por urgência (crítica primeiro, depois alta, depois média)
  const pesoUrgencia: Record<string, number> = {
    critica: 4,
    alta: 3,
    media: 2,
    informativa: 1,
  };

  return alertas.sort((a, b) => pesoUrgencia[b.urgencia] - pesoUrgencia[a.urgencia]);
}

/**
 * Sintetizador sonoro de notificação suave (Web Audio API)
 * Emite um sino agradável de alerta sem dependências de arquivos de som externos
 */
export function tocarSomNotificacao(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const agora = ctx.currentTime;

    // Primeiro tom suave (880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, agora);
    osc1.frequency.exponentialRampToValueAtTime(880, agora + 0.15);

    gain1.gain.setValueAtTime(0, agora);
    gain1.gain.linearRampToValueAtTime(0.18, agora + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, agora + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(agora);
    osc1.stop(agora + 0.5);

    // Segundo tom harmonioso em sino (1318.5Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, agora + 0.12);

    gain2.gain.setValueAtTime(0, agora + 0.12);
    gain2.gain.linearRampToValueAtTime(0.22, agora + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, agora + 0.85);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(agora + 0.12);
    osc2.stop(agora + 0.85);

    // Fecha contexto ao terminar
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch (err) {
    console.debug('Aviso de áudio:', err);
  }
}
