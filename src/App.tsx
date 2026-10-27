/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HistoricoTab } from './components/HistoricoTab';
import { CadastrarLicitacaoTab } from './components/CadastrarLicitacaoTab';
import { MontarPropostaTab } from './components/MontarPropostaTab';
import { VisualizarPdfTab } from './components/VisualizarPdfTab';
import { PapelTimbradoTab } from './components/PapelTimbradoTab';
import { CalculadoraOfertaDrawer } from './components/CalculadoraOfertaDrawer';
import { LoginScreen } from './components/LoginScreen';
import { SegurancaModal } from './components/SegurancaModal';
import { ModalDeclaracaoUnificada } from './components/ModalDeclaracaoUnificada';
import { ModalExequibilidade } from './components/ModalExequibilidade';
import { ModalAssinadorDocumentos } from './components/ModalAssinadorDocumentos';
import { ModalNovasDeclaracoes } from './components/ModalNovasDeclaracoes';
import { TipoNovaDeclaracao } from './utils/novasDeclaracoesPdf';
import { ContatosTab } from './components/ContatosTab';
import { AnaliseTab } from './components/AnaliseTab';
import { CobrancasTab } from './components/CobrancasTab';
import {
  Licitacao,
  ItemLicitacao,
  PapelTimbradoConfig,
  AcessoConfig,
  ContatoPrefeitura,
  Cobranca,
  AlertaCobranca,
} from './types';
import {
  obterLicitacoes,
  salvarLicitacoes,
  obterItens,
  salvarItens,
  restaurarImagensIndexedDB,
  obterPapelTimbradoConfig,
  salvarPapelTimbradoConfig,
  obterResponsaveis,
  salvarResponsaveis,
  obterAcessoConfig,
  salvarAcessoConfig,
  obterLicitacoesExcluidas,
  salvarLicitacaoExcluida,
  obterItensExcluidos,
  salvarItemExcluido,
  obterContatosLocal,
  salvarContatosLocal,
  obterContatosExcluidos,
  salvarContatoExcluido,
  obterCobrancasLocal,
  salvarCobrancasLocal,
  obterCobrancasExcluidas,
  salvarCobrancaExcluida,
  estaAutenticado,
  registrarLogin,
  deslogar,
} from './utils/storage';
import { removerImagemItemIndexedDB } from './utils/indexedDb';
import {
  gerarAlertasCobrancas,
  tocarSomNotificacao,
  diferencaEmDiasParaHoje,
  formatarDataPtBr,
} from './utils/cobrancasCalculo';
import { gerarArquivoPdf, baixarBlobPdf } from './utils/pdfGenerator';
import { converterParaFormatoInputDate } from './utils/numberToWordsPtBr';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { obterTema, aplicarTema, alternarTema, ThemeMode } from './utils/theme';
import {
  ouvirLicitacoesNuvem,
  ouvirItensNuvem,
  ouvirPapelTimbradoNuvem,
  ouvirResponsaveisNuvem,
  ouvirAcessoConfigNuvem,
  salvarAcessoConfigNuvem,
  salvarLicitacaoNuvem,
  removerLicitacaoNuvem,
  salvarItemNuvem,
  removerItemNuvem,
  salvarPapelTimbradoNuvem,
  salvarResponsaveisNuvem,
  salvarTodosItensNuvem,
  sincronizarBancoInicialSeVazio,
  ouvirContatosNuvem,
  salvarContatoNuvem,
  removerContatoNuvem,
  ouvirCobrancasNuvem,
  salvarCobrancaNuvem,
  removerCobrancaNuvem,
} from './firebase/firestoreService';
import {
  syncManager,
  mesclarEstadoComServidor,
  salvarLicitacaoServidor,
  removerLicitacaoServidor,
  salvarItemServidor,
  salvarItensLoteServidor,
  removerItemServidor,
  salvarConfigServidor,
  obterContatosServidor,
  salvarContatoServidor,
  removerContatoServidor,
  obterCobrancasServidor,
  salvarCobrancaServidor,
  removerCobrancaServidor,
} from './utils/serverSync';

export default function App() {
  const [autenticado, setAutenticado] = useState<boolean>(() => estaAutenticado());
  const [acessoConfig, setAcessoConfig] = useState<AcessoConfig>(() => obterAcessoConfig());
  const [segurancaModalAberto, setSegurancaModalAberto] = useState<boolean>(false);
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [itens, setItens] = useState<ItemLicitacao[]>([]);
  const [responsaveis, setResponsaveis] = useState<string[]>(() => obterResponsaveis());
  const [contatos, setContatos] = useState<ContatoPrefeitura[]>(() => obterContatosLocal());
  const [cobrancas, setCobrancas] = useState<Cobranca[]>(() => obterCobrancasLocal());
  const [cobrancaDestaqueId, setCobrancaDestaqueId] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<string>('historico');

  // Alertas automáticos de cobranças para o Sininho Global (entrega, NF, liquidação e pagamento)
  const alertasCobrancas = useMemo(() => {
    return gerarAlertasCobrancas(cobrancas);
  }, [cobrancas]);

  // Temporizador para verificar virada de minuto/horário para alertas pontuais
  const [tickerMinuto, setTickerMinuto] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => setTickerMinuto(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Alertas de retorno do pregoeiro para licitações em acompanhamento
  // Só alerta e apita NO DIA MARCADO NO RELÓGIO (diffDias <= 0) e quando o horário marcado chegar
  const alertasPregoeiro = useMemo(() => {
    const lista: AlertaCobranca[] = [];
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    for (const lic of licitacoes) {
      if (!lic.acompanhamento) continue;
      if (!lic.avisoData || lic.avisoConcluido) continue;

      let isoData = lic.avisoData;
      if (lic.avisoData.includes('/')) {
        const [d, m, y] = lic.avisoData.split('/');
        isoData = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      const diffDias = diferencaEmDiasParaHoje(isoData);
      // Notifica estritamente no dia marcado no relógio (diffDias <= 0, ou seja, hoje ou vencido)
      if (diffDias !== null && diffDias <= 0) {
        // Se for para o dia de hoje e tiver horário programado, só apita/alerta quando atingir o horário
        if (diffDias === 0 && lic.avisoHora && horaAtual < lic.avisoHora) {
          continue;
        }

        lista.push({
          id: `pregoeiro_${lic.id}_${isoData}_${lic.avisoHora || ''}`,
          licitacaoId: Number(lic.id),
          prefeitura: lic.orgao,
          horario: lic.avisoHora,
          tipo: 'pregoeiro_retorno',
          titulo: `Retorno Pregoeiro: ${lic.orgao}`,
          mensagem: lic.avisoMensagem
            ? `${lic.avisoMensagem} (Agendado para ${formatarDataPtBr(isoData)}${lic.avisoHora ? ` às ${lic.avisoHora}` : ''})`
            : `Sessão com retorno previsto para ${formatarDataPtBr(isoData)}${lic.avisoHora ? ` às ${lic.avisoHora}` : ''}. Fique atento à disputa!`,
          diasRestantes: diffDias,
          urgencia: diffDias <= 0 ? 'critica' : 'alta',
          dataLimite: isoData,
          dataCriacao: new Date().toISOString(),
        });
      }
    }
    return lista;
  }, [licitacoes, tickerMinuto]);

  // Alertas consolidados no Sininho (Cobranças + Acompanhamentos/Pregoeiro)
  const todosAlertasSininho = useMemo(() => {
    return [...alertasPregoeiro, ...alertasCobrancas];
  }, [alertasPregoeiro, alertasCobrancas]);

  // Alerta sonoro automático sempre que novos alertas forem detectados
  const qtdAlertasAnteriorRef = React.useRef<number>(todosAlertasSininho.length);
  useEffect(() => {
    if (todosAlertasSininho.length > qtdAlertasAnteriorRef.current) {
      tocarSomNotificacao();
    }
    qtdAlertasAnteriorRef.current = todosAlertasSininho.length;
  }, [todosAlertasSininho.length]);
  const [licitacaoSelecionadaId, setLicitacaoSelecionadaIdState] = useState<number | null>(() => {
    try {
      const salvo = localStorage.getItem('gws_licitacao_selecionada_id');
      return salvo ? Number(salvo) : null;
    } catch {
      return null;
    }
  });

  const setLicitacaoSelecionadaId = useCallback((idOuFn: number | null | ((prev: number | null) => number | null)) => {
    setLicitacaoSelecionadaIdState(prev => {
      const novo = typeof idOuFn === 'function' ? idOuFn(prev) : idOuFn;
      try {
        if (novo !== null && novo !== undefined) {
          localStorage.setItem('gws_licitacao_selecionada_id', String(novo));
        }
      } catch {}
      return novo;
    });
  }, []);
  const [timbradoConfig, setTimbradoConfig] = useState<PapelTimbradoConfig>(() =>
    obterPapelTimbradoConfig()
  );
  const [calculadoraAberta, setCalculadoraAberta] = useState<boolean>(false);
  const [calculadoraMinimizada, setCalculadoraMinimizada] = useState<boolean>(false);
  const [sidebarAberta, setSidebarAberta] = useState<boolean>(false);
  const [modalDeclaracaoAberto, setModalDeclaracaoAberto] = useState<boolean>(false);
  const [licitacaoParaDeclaracao, setLicitacaoParaDeclaracao] = useState<Licitacao | null>(null);
  const [modalExequibilidadeAberto, setModalExequibilidadeAberto] = useState<boolean>(false);
  const [licitacaoParaExequibilidade, setLicitacaoParaExequibilidade] = useState<Licitacao | null>(null);
  const [modalAssinadorAberto, setModalAssinadorAberto] = useState<boolean>(false);
  const [modalNovasDeclaracoesAberto, setModalNovasDeclaracoesAberto] = useState<boolean>(false);
  const [tipoNovaDeclaracaoAtiva, setTipoNovaDeclaracaoAtiva] = useState<TipoNovaDeclaracao>('me_epp');
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const [statusNuvem, setStatusNuvem] = useState<'conectando' | 'conectado' | 'desconectado'>('conectando');
  const [tema, setTema] = useState<ThemeMode>(() => obterTema());

  // Aplica o tema na árvore DOM sempre que o estado mudar
  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  const handleAlternarTema = (novo?: ThemeMode) => {
    if (novo) {
      aplicarTema(novo);
      setTema(novo);
    } else {
      const t = alternarTema();
      setTema(t);
    }
  };

  // Carrega dados iniciais do banco local imediatamente
  useEffect(() => {
    const lics = obterLicitacoes();
    const its = obterItens();
    const timb = obterPapelTimbradoConfig();
    const resps = obterResponsaveis();
    const acesso = obterAcessoConfig();
    const cts = obterContatosLocal();
    const cobs = obterCobrancasLocal();
    setLicitacoes(lics);
    setItens(its);
    setTimbradoConfig(timb);
    setResponsaveis(resps);
    setAcessoConfig(acesso);
    setContatos(cts);
    setCobrancas(cobs);

    // Carrega contatos atualizados do servidor com mesclagem segura (nunca sobrescreve contatos locais)
    obterContatosServidor().then(ctsServidor => {
      if (ctsServidor && ctsServidor.length > 0) {
        const setContatosExcluidos = new Set(obterContatosExcluidos());
        setContatos(prev => {
          const mapa = new Map<string, ContatoPrefeitura>();
          for (const c of prev) {
            const id = String(c.id);
            if (!setContatosExcluidos.has(id)) mapa.set(id, c);
          }
          for (const inc of ctsServidor) {
            const id = String(inc.id);
            if (setContatosExcluidos.has(id)) continue;
            const exist = mapa.get(id);
            mapa.set(id, exist ? { ...exist, ...inc } : inc);
          }
          const lista = Array.from(mapa.values());
          salvarContatosLocal(lista);
          return lista;
        });
      }
    });

    // Carrega cobranças atualizadas do servidor com mesclagem segura (nunca sobrescreve cobranças locais)
    obterCobrancasServidor().then(cobsServidor => {
      if (cobsServidor && cobsServidor.length > 0) {
        const setCobrancasExcluidas = new Set(obterCobrancasExcluidas());
        setCobrancas(prev => {
          const mapa = new Map<string, Cobranca>();
          for (const c of prev) {
            const id = String(c.id);
            if (!setCobrancasExcluidas.has(id)) mapa.set(id, c);
          }
          for (const inc of cobsServidor) {
            const id = String(inc.id);
            if (setCobrancasExcluidas.has(id)) continue;
            const exist = mapa.get(id);
            mapa.set(id, exist ? { ...exist, ...inc } : inc);
          }
          const lista = Array.from(mapa.values());
          salvarCobrancasLocal(lista);
          return lista;
        });
      }
    });

    const idSalvo = (() => {
      try {
        const s = localStorage.getItem('gws_licitacao_selecionada_id');
        return s ? Number(s) : null;
      } catch {
        return null;
      }
    })();
    if (idSalvo && lics.some(l => Number(l.id) === idSalvo)) {
      setLicitacaoSelecionadaId(idSalvo);
    } else if (lics.length > 0) {
      setLicitacaoSelecionadaId(lics[0].id);
    }

    // Restaura fotos com alta fidelidade que possam ter sido omitidas pelo limite de 5MB do navegador
    restaurarImagensIndexedDB(its).then((itsRestaurados) => {
      if (itsRestaurados && itsRestaurados.length > 0) {
        setItens(itsRestaurados);
      }
    });
  }, []);

  // Sincronização em tempo real totalmente automática com Servidor Central e Firebase
  useEffect(() => {
    setStatusNuvem('conectado');

    // 1. Inicia conexão SSE em tempo real com o servidor central multi-usuário
    syncManager.start();

    // 2. Inscreve ouvinte para receber eventos de qualquer computador em tempo real
    const unsubServer = syncManager.subscribe((payload) => {
      setStatusNuvem('conectado');
      const setExcluidas = new Set(obterLicitacoesExcluidas());
      const setItensExcluidos = new Set(obterItensExcluidos());

      if (payload.tipo === 'full') {
        if (payload.licitacoes && payload.licitacoes.length > 0) {
          const licsLimpas = payload.licitacoes.filter(l => !setExcluidas.has(Number(l.id)));
          setLicitacoes(prevLics => {
            const mapa = new Map<number, Licitacao>();
            for (const p of prevLics) {
              const id = Number(p.id);
              if (!setExcluidas.has(id)) mapa.set(id, p);
            }
            for (const inc of licsLimpas) {
              const id = Number(inc.id);
              if (setExcluidas.has(id)) continue;
              const prev = mapa.get(id);
              mapa.set(id, prev ? { ...prev, ...inc } : inc);
            }
            const res = Array.from(mapa.values()).sort((a, b) => Number(b.id) - Number(a.id));
            salvarLicitacoes(res);
            return res;
          });
          setLicitacaoSelecionadaId(prev => {
            if (prev) return prev;
            return licsLimpas.length > 0 ? licsLimpas[0].id : null;
          });
        }
        if (payload.itens && payload.itens.length > 0) {
          const itensLimpos = payload.itens.filter(i => !setItensExcluidos.has(Number(i.id)) && !setExcluidas.has(Number(i.licitacao_id)));
          setItens(prevItens => {
            const mapa = new Map<number, ItemLicitacao>();
            for (const p of prevItens) {
              const id = Number(p.id);
              if (!setItensExcluidos.has(id) && !setExcluidas.has(Number(p.licitacao_id))) {
                mapa.set(id, p);
              }
            }
            for (const inc of itensLimpos) {
              const id = Number(inc.id);
              if (setItensExcluidos.has(id) || setExcluidas.has(Number(inc.licitacao_id))) continue;
              const prev = mapa.get(id);
              mapa.set(id, prev ? { ...prev, ...inc } : inc);
            }
            const lista = Array.from(mapa.values());
            salvarItens(lista);
            return lista;
          });
        }
        if (payload.timbrado) {
          setTimbradoConfig(payload.timbrado);
          salvarPapelTimbradoConfig(payload.timbrado);
        }
        if (payload.responsaveis && payload.responsaveis.length > 0) {
          setResponsaveis(payload.responsaveis);
          salvarResponsaveis(payload.responsaveis);
        }
        if (payload.contatos && payload.contatos.length > 0) {
          const setContatosExcluidos = new Set(obterContatosExcluidos());
          setContatos(prev => {
            const mapa = new Map<string, ContatoPrefeitura>();
            for (const c of prev) {
              const id = String(c.id);
              if (!setContatosExcluidos.has(id)) mapa.set(id, c);
            }
            for (const inc of payload.contatos!) {
              const id = String(inc.id);
              if (setContatosExcluidos.has(id)) continue;
              const exist = mapa.get(id);
              mapa.set(id, exist ? { ...exist, ...inc } : inc);
            }
            const lista = Array.from(mapa.values());
            salvarContatosLocal(lista);
            return lista;
          });
        }
        if (payload.cobrancas && payload.cobrancas.length > 0) {
          const setCobrancasExcluidas = new Set(obterCobrancasExcluidas());
          setCobrancas(prev => {
            const mapa = new Map<string, Cobranca>();
            for (const c of prev) {
              const id = String(c.id);
              if (!setCobrancasExcluidas.has(id)) mapa.set(id, c);
            }
            for (const inc of payload.cobrancas!) {
              const id = String(inc.id);
              if (setCobrancasExcluidas.has(id)) continue;
              const exist = mapa.get(id);
              mapa.set(id, exist ? { ...exist, ...inc } : inc);
            }
            const lista = Array.from(mapa.values());
            salvarCobrancasLocal(lista);
            return lista;
          });
        }
      } else if (payload.tipo === 'licitacoes' && payload.licitacoes) {
        const licsLimpas = payload.licitacoes.filter(l => !setExcluidas.has(Number(l.id)));
        setLicitacoes(prevLics => {
          const mapa = new Map<number, Licitacao>();
          for (const p of prevLics) {
            const id = Number(p.id);
            if (!setExcluidas.has(id)) mapa.set(id, p);
          }
          for (const inc of licsLimpas) {
            const id = Number(inc.id);
            if (setExcluidas.has(id)) continue;
            const prev = mapa.get(id);
            mapa.set(id, prev ? { ...prev, ...inc } : inc);
          }
          const res = Array.from(mapa.values()).sort((a, b) => Number(b.id) - Number(a.id));
          salvarLicitacoes(res);
          return res;
        });
      } else if (payload.tipo === 'itens' && payload.itens) {
        const itensLimpos = payload.itens.filter(i => !setItensExcluidos.has(Number(i.id)) && !setExcluidas.has(Number(i.licitacao_id)));
        setItens(prevItens => {
          const mapa = new Map<number, ItemLicitacao>();
          for (const p of prevItens) {
            const id = Number(p.id);
            if (!setItensExcluidos.has(id) && !setExcluidas.has(Number(p.licitacao_id))) {
              mapa.set(id, p);
            }
          }
          for (const inc of itensLimpos) {
            const id = Number(inc.id);
            if (setItensExcluidos.has(id) || setExcluidas.has(Number(inc.licitacao_id))) continue;
            const prev = mapa.get(id);
            mapa.set(id, prev ? { ...prev, ...inc } : inc);
          }
          const lista = Array.from(mapa.values());
          salvarItens(lista);
          return lista;
        });
      } else if (payload.tipo === 'timbrado' && payload.timbrado) {
        setTimbradoConfig(payload.timbrado);
        salvarPapelTimbradoConfig(payload.timbrado);
      } else if (payload.tipo === 'responsaveis' && payload.responsaveis) {
        setResponsaveis(payload.responsaveis);
        salvarResponsaveis(payload.responsaveis);
      } else if (payload.tipo === 'contatos' && payload.contatos) {
        const setContatosExcluidos = new Set(obterContatosExcluidos());
        setContatos(prev => {
          const mapa = new Map<string, ContatoPrefeitura>();
          for (const c of prev) {
            const id = String(c.id);
            if (!setContatosExcluidos.has(id)) mapa.set(id, c);
          }
          for (const inc of payload.contatos!) {
            const id = String(inc.id);
            if (setContatosExcluidos.has(id)) continue;
            const exist = mapa.get(id);
            mapa.set(id, exist ? { ...exist, ...inc } : inc);
          }
          const lista = Array.from(mapa.values());
          salvarContatosLocal(lista);
          return lista;
        });
      } else if (payload.tipo === 'cobrancas' && payload.cobrancas) {
        const setCobrancasExcluidas = new Set(obterCobrancasExcluidas());
        setCobrancas(prev => {
          const mapa = new Map<string, Cobranca>();
          for (const c of prev) {
            const id = String(c.id);
            if (!setCobrancasExcluidas.has(id)) mapa.set(id, c);
          }
          for (const inc of payload.cobrancas!) {
            const id = String(inc.id);
            if (setCobrancasExcluidas.has(id)) continue;
            const exist = mapa.get(id);
            mapa.set(id, exist ? { ...exist, ...inc } : inc);
          }
          const lista = Array.from(mapa.values());
          salvarCobrancasLocal(lista);
          return lista;
        });
      }
    });

    // 3. Mescla dados locais com o servidor central (garante que dados criados em outro computador ou offline subam para todos)
    const licsLocais = obterLicitacoes();
    const itsLocais = obterItens();
    const timbLocal = obterPapelTimbradoConfig();
    const respsLocais = obterResponsaveis();
    const ctsLocais = obterContatosLocal();
    const cobsLocais = obterCobrancasLocal();

    mesclarEstadoComServidor({
      licitacoes: licsLocais,
      itens: itsLocais,
      timbrado: timbLocal,
      responsaveis: respsLocais,
      contatos: ctsLocais,
      cobrancas: cobsLocais,
    }).then((estado) => {
      if (estado) {
        const setExcluidas = new Set(obterLicitacoesExcluidas());
        const setItensExcluidos = new Set(obterItensExcluidos());

        if (estado.licitacoes && estado.licitacoes.length > 0) {
          const licsLimpas = estado.licitacoes.filter(l => !setExcluidas.has(Number(l.id)));
          setLicitacoes(prevLics => {
            const mapa = new Map<number, Licitacao>();
            for (const p of prevLics) {
              const id = Number(p.id);
              if (!setExcluidas.has(id)) mapa.set(id, p);
            }
            for (const inc of licsLimpas) {
              const id = Number(inc.id);
              if (setExcluidas.has(id)) continue;
              const prev = mapa.get(id);
              mapa.set(id, prev ? { ...prev, ...inc } : inc);
            }
            const res = Array.from(mapa.values()).sort((a, b) => Number(b.id) - Number(a.id));
            salvarLicitacoes(res);
            return res;
          });
          setLicitacaoSelecionadaId(prev => {
            if (prev) return prev;
            return licsLimpas.length > 0 ? licsLimpas[0].id : null;
          });
        }
        if (estado.itens && estado.itens.length > 0) {
          const itensLimpos = estado.itens.filter(i => !setItensExcluidos.has(Number(i.id)) && !setExcluidas.has(Number(i.licitacao_id)));
          setItens(prevItens => {
            const mapa = new Map<number, ItemLicitacao>();
            for (const p of prevItens) {
              const id = Number(p.id);
              if (!setItensExcluidos.has(id) && !setExcluidas.has(Number(p.licitacao_id))) {
                mapa.set(id, p);
              }
            }
            for (const inc of itensLimpos) {
              const id = Number(inc.id);
              if (setItensExcluidos.has(id) || setExcluidas.has(Number(inc.licitacao_id))) continue;
              const prev = mapa.get(id);
              mapa.set(id, prev ? { ...prev, ...inc } : inc);
            }
            const lista = Array.from(mapa.values());
            salvarItens(lista);
            return lista;
          });
        }
        if (estado.contatos && estado.contatos.length > 0) {
          const setContatosExcluidos = new Set(obterContatosExcluidos());
          setContatos(prev => {
            const mapa = new Map<string, ContatoPrefeitura>();
            for (const p of prev) {
              const id = String(p.id);
              if (!setContatosExcluidos.has(id)) mapa.set(id, p);
            }
            for (const inc of estado.contatos!) {
              const id = String(inc.id);
              if (setContatosExcluidos.has(id)) continue;
              const exist = mapa.get(id);
              mapa.set(id, exist ? { ...exist, ...inc } : inc);
            }
            const lista = Array.from(mapa.values());
            salvarContatosLocal(lista);
            return lista;
          });
        }
        if (estado.cobrancas && estado.cobrancas.length > 0) {
          const setCobrancasExcluidas = new Set(obterCobrancasExcluidas());
          setCobrancas(prev => {
            const mapa = new Map<string, Cobranca>();
            for (const p of prev) {
              const id = String(p.id);
              if (!setCobrancasExcluidas.has(id)) mapa.set(id, p);
            }
            for (const inc of estado.cobrancas!) {
              const id = String(inc.id);
              if (setCobrancasExcluidas.has(id)) continue;
              const exist = mapa.get(id);
              mapa.set(id, exist ? { ...exist, ...inc } : inc);
            }
            const lista = Array.from(mapa.values());
            salvarCobrancasLocal(lista);
            return lista;
          });
        }
      }
    }).catch(() => {});

    // 4. Também sincroniza banco na nuvem Firebase caso haja cota disponível
    sincronizarBancoInicialSeVazio(licsLocais, itsLocais, timbLocal, respsLocais).catch(() => {});

    const unsubLics = ouvirLicitacoesNuvem(
      (licsNuvem) => {
        if (licsNuvem && licsNuvem.length > 0) {
          setStatusNuvem('conectado');
          const setExcluidas = new Set(obterLicitacoesExcluidas());
          const licsValidas = licsNuvem.filter(l => !setExcluidas.has(Number(l.id)));

          setLicitacoes(prevLics => {
            const mapa = new Map<number, Licitacao>();
            // Preserva todas as licitações locais atuais primeiro
            for (const p of prevLics) {
              const id = Number(p.id);
              if (!setExcluidas.has(id)) mapa.set(id, p);
            }
            // Mescla dados da nuvem
            for (const nuv of licsValidas) {
              const id = Number(nuv.id);
              if (setExcluidas.has(id)) continue;
              const prev = mapa.get(id);
              if (!prev) {
                mapa.set(id, nuv);
              } else {
                mapa.set(id, {
                  ...prev,
                  ...nuv,
                  acompanhamento: prev.acompanhamento !== undefined ? Boolean(prev.acompanhamento) : Boolean(nuv.acompanhamento),
                  homologada: prev.homologada !== undefined ? Boolean(prev.homologada) : Boolean(nuv.homologada),
                  avisoData: prev.avisoData || nuv.avisoData,
                  avisoHora: prev.avisoHora || nuv.avisoHora,
                  avisoMensagem: prev.avisoMensagem || nuv.avisoMensagem,
                  avisoConcluido: prev.avisoConcluido !== undefined ? Boolean(prev.avisoConcluido) : Boolean(nuv.avisoConcluido),
                });
              }
            }
            const mescladas = Array.from(mapa.values()).sort((a, b) => Number(b.id) - Number(a.id));
            salvarLicitacoes(mescladas);
            return mescladas;
          });
          setLicitacaoSelecionadaId(prev => {
            if (prev) return prev;
            return licsValidas.length > 0 ? licsValidas[0].id : null;
          });
        }
      },
      () => {}
    );

    const unsubItens = ouvirItensNuvem(
      (itensNuvem) => {
        if (itensNuvem) {
          const setExcluidas = new Set(obterLicitacoesExcluidas());
          const setItensExcluidos = new Set(obterItensExcluidos());
          const itensValidos = itensNuvem.filter(i => !setItensExcluidos.has(Number(i.id)) && !setExcluidas.has(Number(i.licitacao_id)));

          setItens(prevItens => {
            const mapa = new Map<number, ItemLicitacao>();
            for (const p of prevItens) {
              const id = Number(p.id);
              if (!setItensExcluidos.has(id) && !setExcluidas.has(Number(p.licitacao_id))) {
                mapa.set(id, p);
              }
            }
            for (const nuv of itensValidos) {
              const id = Number(nuv.id);
              if (setItensExcluidos.has(id) || setExcluidas.has(Number(nuv.licitacao_id))) continue;
              const prev = mapa.get(id);
              mapa.set(id, {
                ...nuv,
                caminho_imagem: nuv.caminho_imagem !== undefined ? nuv.caminho_imagem : (prev?.caminho_imagem || ''),
              });
            }
            const lista = Array.from(mapa.values());
            salvarItens(lista);
            return lista;
          });
        }
      },
      () => {}
    );

    const unsubTimbrado = ouvirPapelTimbradoNuvem((timbradoNuvem) => {
      if (timbradoNuvem) {
        setTimbradoConfig(timbradoNuvem);
        salvarPapelTimbradoConfig(timbradoNuvem);
      }
    });

    const unsubResponsaveis = ouvirResponsaveisNuvem((respsNuvem) => {
      if (respsNuvem && respsNuvem.length > 0) {
        setResponsaveis(respsNuvem);
        salvarResponsaveis(respsNuvem);
      }
    });

    const unsubSeguranca = ouvirAcessoConfigNuvem((acessoNuvem) => {
      if (acessoNuvem && acessoNuvem.usuarioId && acessoNuvem.senhaHash) {
        setAcessoConfig(acessoNuvem);
        salvarAcessoConfig(acessoNuvem);
      }
    });

    const unsubContatos = ouvirContatosNuvem((ctsNuvem) => {
      const setContatosExcluidos = new Set(obterContatosExcluidos());
      const ctsLimpos = (ctsNuvem || []).filter(c => !setContatosExcluidos.has(String(c.id)));
      setContatos(prev => {
        const mapa = new Map<string, ContatoPrefeitura>();
        // 1. Preserva todos os contatos locais primeiro
        for (const p of prev) {
          const id = String(p.id);
          if (!setContatosExcluidos.has(id)) mapa.set(id, p);
        }
        // 2. Mescla dados atualizados da nuvem
        for (const inc of ctsLimpos) {
          const id = String(inc.id);
          if (setContatosExcluidos.has(id)) continue;
          const exist = mapa.get(id);
          mapa.set(id, exist ? { ...exist, ...inc } : inc);
        }
        const lista = Array.from(mapa.values());
        salvarContatosLocal(lista);
        return lista;
      });
    });

    const unsubCobrancas = ouvirCobrancasNuvem((cobNuvem) => {
      const setCobrancasExcluidas = new Set(obterCobrancasExcluidas());
      const cobsLimpos = (cobNuvem || []).filter(c => !setCobrancasExcluidas.has(String(c.id)));
      setCobrancas(prev => {
        const mapa = new Map<string, Cobranca>();
        // 1. Preserva todas as cobranças locais primeiro
        for (const p of prev) {
          const id = String(p.id);
          if (!setCobrancasExcluidas.has(id)) mapa.set(id, p);
        }
        // 2. Mescla cobranças da nuvem
        for (const inc of cobsLimpos) {
          const id = String(inc.id);
          if (setCobrancasExcluidas.has(id)) continue;
          const exist = mapa.get(id);
          mapa.set(id, exist ? { ...exist, ...inc } : inc);
        }
        const lista = Array.from(mapa.values());
        salvarCobrancasLocal(lista);
        return lista;
      });
    });

    return () => {
      unsubServer();
      syncManager.stop();
      unsubLics();
      unsubItens();
      unsubTimbrado();
      unsubResponsaveis();
      unsubSeguranca();
      unsubContatos();
      unsubCobrancas();
    };
  }, []);

  const handleSalvarContato = async (contato: ContatoPrefeitura) => {
    let listaAtualizada: ContatoPrefeitura[] = [];
    setContatos(prev => {
      const idx = prev.findIndex(c => String(c.id) === String(contato.id));
      const lista = idx >= 0
        ? prev.map(c => (String(c.id) === String(contato.id) ? contato : c))
        : [contato, ...prev];
      listaAtualizada = lista;
      salvarContatosLocal(lista);
      return lista;
    });
    salvarContatoServidor(contato).catch(() => {});
    salvarContatoNuvem(contato).catch(() => {});
    if (listaAtualizada.length > 0) {
      mesclarEstadoComServidor({
        licitacoes: [],
        itens: [],
        contatos: listaAtualizada,
      }).catch(() => {});
    }
    mostrarToast(`Contato de "${contato.nomeContato}" (${contato.prefeitura}) salvo com sucesso!`);
  };

  const handleExcluirContato = async (contatoId: string) => {
    const strId = String(contatoId);
    salvarContatoExcluido(strId);
    setContatos(prev => {
      const lista = prev.filter(c => String(c.id) !== strId);
      salvarContatosLocal(lista);
      return lista;
    });
    removerContatoServidor(strId).catch(() => {});
    removerContatoNuvem(strId).catch(() => {});
    mostrarToast('Contato removido da agenda.');
  };

  const handleSalvarCobranca = async (cobranca: Cobranca) => {
    setCobrancas(prev => {
      const idx = prev.findIndex(c => String(c.id) === String(cobranca.id));
      const lista = idx >= 0
        ? prev.map(c => (String(c.id) === String(cobranca.id) ? cobranca : c))
        : [cobranca, ...prev];
      salvarCobrancasLocal(lista);
      return lista;
    });
    salvarCobrancaServidor(cobranca).catch(() => {});
    salvarCobrancaNuvem(cobranca).catch(() => {});
    mostrarToast(`Cobrança de "${cobranca.prefeitura}" salva com sucesso!`);
  };

  const handleExcluirCobranca = async (cobrancaId: string) => {
    const strId = String(cobrancaId);
    salvarCobrancaExcluida(strId);
    setCobrancas(prev => {
      const lista = prev.filter(c => String(c.id) !== strId);
      salvarCobrancasLocal(lista);
      return lista;
    });
    removerCobrancaServidor(strId).catch(() => {});
    removerCobrancaNuvem(strId).catch(() => {});
    mostrarToast('Cobrança removida com sucesso.');
  };

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  // Funções de Autenticação e Segurança
  const handleLoginSucesso = (lembrar: boolean) => {
    registrarLogin(lembrar);
    setAutenticado(true);
    mostrarToast('Acesso autorizado com sucesso!', 'sucesso');
  };

  const handleLogout = () => {
    deslogar();
    setAutenticado(false);
    mostrarToast('Sessão encerrada com sucesso.', 'sucesso');
  };

  const handleSalvarAcesso = async (novoAcesso: AcessoConfig) => {
    setAcessoConfig(novoAcesso);
    salvarAcessoConfig(novoAcesso);
    salvarConfigServidor('seguranca', novoAcesso);
    try {
      await salvarAcessoConfigNuvem(novoAcesso);
    } catch (err) {
      console.warn('Erro ao salvar segurança na nuvem:', err);
    }
    mostrarToast('Credenciais de acesso atualizadas com sucesso!', 'sucesso');
  };

  // Gerenciamento de Responsáveis (Adicionar e Excluir)
  const handleAdicionarResponsavel = (novoNome: string): boolean => {
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo) return false;
    
    // Verifica se já existe (case-insensitive)
    const jaExiste = responsaveis.some(r => r.toLowerCase() === nomeLimpo.toLowerCase());
    if (jaExiste) {
      mostrarToast(`O responsável "${nomeLimpo}" já está na lista.`, 'erro');
      return false;
    }

    const novaLista = [...responsaveis, nomeLimpo];
    setResponsaveis(novaLista);
    salvarResponsaveis(novaLista);
    salvarConfigServidor('responsaveis', novaLista);
    salvarResponsaveisNuvem(novaLista).catch(() => {});
    mostrarToast(`Responsável "${nomeLimpo}" adicionado com sucesso!`);
    return true;
  };

  const handleExcluirResponsavel = (nomeParaExcluir: string, transferirPara?: string) => {
    // Não permitir lista vazia
    if (responsaveis.length <= 1) {
      mostrarToast('Você deve manter pelo menos um responsável cadastrado no sistema.', 'erro');
      return;
    }

    const novaLista = responsaveis.filter(r => r !== nomeParaExcluir);
    setResponsaveis(novaLista);
    salvarResponsaveis(novaLista);
    salvarConfigServidor('responsaveis', novaLista);
    salvarResponsaveisNuvem(novaLista).catch(() => {});

    // Reatribuir licitações vinculadas a esse nome
    const destino = transferirPara || novaLista[0] || 'Gustavo';
    let alteradas = 0;
    const licsAtualizadas = licitacoes.map(lic => {
      if ((lic.responsavel || '').toLowerCase() === nomeParaExcluir.toLowerCase()) {
        alteradas++;
        const licAtualizada = { ...lic, responsavel: destino };
        salvarLicitacaoServidor(licAtualizada);
        salvarLicitacaoNuvem(licAtualizada).catch(() => {});
        return licAtualizada;
      }
      return lic;
    });

    if (alteradas > 0) {
      setLicitacoes(licsAtualizadas);
      salvarLicitacoes(licsAtualizadas);
      mostrarToast(`"${nomeParaExcluir}" excluído. ${alteradas} licitação(ões) transferida(s) para "${destino}".`);
    } else {
      mostrarToast(`Responsável "${nomeParaExcluir}" excluído com sucesso.`);
    }
  };

  // Papel Timbrado Handlers
  const handleSalvarTimbrado = (novaConfig: PapelTimbradoConfig) => {
    setTimbradoConfig(novaConfig);
    salvarPapelTimbradoConfig(novaConfig);
    salvarConfigServidor('timbrado', novaConfig);
    salvarPapelTimbradoNuvem(novaConfig).catch(() => {});
    mostrarToast('Configurações de papel timbrado salvas com sucesso!');
  };

  // Gerenciamento de Licitações
  const handleAtualizarResponsavel = (id: number, novoResponsavel: string) => {
    // Garante que o responsável também está na lista salva
    if (novoResponsavel && !responsaveis.includes(novoResponsavel)) {
      const novaLista = [...responsaveis, novoResponsavel];
      setResponsaveis(novaLista);
      salvarResponsaveis(novaLista);
      salvarConfigServidor('responsaveis', novaLista);
      salvarResponsaveisNuvem(novaLista).catch(() => {});
    }
    const atualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(id)) {
        const atual = { ...l, responsavel: novoResponsavel };
        salvarLicitacaoServidor(atual);
        salvarLicitacaoNuvem(atual).catch(() => {});
        return atual;
      }
      return l;
    });
    setLicitacoes(atualizadas);
    salvarLicitacoes(atualizadas);
    mostrarToast(`Responsável atualizado para "${novoResponsavel}".`);
  };

  const handleExcluirLicitacao = async (id: number) => {
    salvarLicitacaoExcluida(id);
    const itensDestaLic = itens.filter(i => Number(i.licitacao_id) === Number(id));
    itensDestaLic.forEach(it => salvarItemExcluido(it.id));

    const licsAtualizadas = licitacoes.filter(l => Number(l.id) !== Number(id));
    const itensAtualizados = itens.filter(i => Number(i.licitacao_id) !== Number(id));
    setLicitacoes(licsAtualizadas);
    setItens(itensAtualizados);
    salvarLicitacoes(licsAtualizadas);
    salvarItens(itensAtualizados);

    removerLicitacaoServidor(id);

    if (Number(licitacaoSelecionadaId) === Number(id)) {
      setLicitacaoSelecionadaId(licsAtualizadas.length > 0 ? licsAtualizadas[0].id : null);
    }

    try {
      await removerLicitacaoNuvem(id);
      mostrarToast('Licitação excluída com sucesso.');
    } catch (err) {
      console.warn('Licitação excluída localmente, sincronizando com a nuvem:', err);
      mostrarToast('Licitação excluída com sucesso.');
    }
  };

  const handleAtualizarDataProposta = (licId: number, novaData: string) => {
    const licsAtualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(licId)) {
        const atualizada: Licitacao = { ...l, data_proposta: novaData };
        salvarLicitacaoServidor(atualizada);
        salvarLicitacaoNuvem(atualizada).catch(err => {
          console.warn('Aviso ao sincronizar data da proposta na nuvem:', err);
        });
        return atualizada;
      }
      return l;
    });
    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);
    mostrarToast('Data da proposta salva para esta licitação.');
  };

  const handleAtualizarUfLicitacao = (licId: number, novaUf: string) => {
    const ufFormatada = novaUf.trim().toUpperCase();
    let licModificada: Licitacao | null = null;
    const licsAtualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(licId)) {
        const atualizada: Licitacao = { ...l, uf: ufFormatada };
        licModificada = atualizada;
        return atualizada;
      }
      return l;
    });

    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    if (licModificada) {
      salvarLicitacaoServidor(licModificada);
      salvarLicitacaoNuvem(licModificada).catch(err => {
        console.warn('Aviso ao sincronizar UF da licitação na nuvem:', err);
      });
    }

    mostrarToast(`Estado (UF) atualizado para ${ufFormatada}.`);
  };

  // Alternar Status de Acompanhamento (👁 Olho Amarelo)
  const handleToggleAcompanhamento = (id: number) => {
    let licModificada: Licitacao | null = null;
    const listaAtualizada = licitacoes.map(l => {
      if (Number(l.id) === Number(id)) {
        const novoStatus = !l.acompanhamento;
        const atual: Licitacao = { ...l, acompanhamento: novoStatus };
        licModificada = atual;
        return atual;
      }
      return l;
    });

    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);

    if (licModificada) {
      salvarLicitacaoServidor(licModificada);
      salvarLicitacaoNuvem(licModificada).catch(err => {
        console.warn('Aviso ao sincronizar acompanhamento na nuvem:', err);
      });
    }
  };

  // Alternar Status de Concluída / Homologada (✓ Check Verde)
  const handleToggleHomologada = (id: number) => {
    let licModificada: Licitacao | null = null;
    const listaAtualizada = licitacoes.map(l => {
      if (Number(l.id) === Number(id)) {
        const novoStatus = !l.homologada;
        const atual: Licitacao = { ...l, homologada: novoStatus };
        licModificada = atual;
        return atual;
      }
      return l;
    });

    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);

    if (licModificada) {
      salvarLicitacaoServidor(licModificada);
      salvarLicitacaoNuvem(licModificada).catch(err => {
        console.warn('Aviso ao sincronizar homologada na nuvem:', err);
      });
    }
  };

  // Handlers para Alertas de Retorno do Pregoeiro
  const handleSalvarAvisoPregoeiro = (licId: number, dataAviso: string, horaAviso: string, msg: string) => {
    let licModificada: Licitacao | null = null;
    const licsAtualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(licId)) {
        const atualizada: Licitacao = {
          ...l,
          acompanhamento: true, // Garante que a licitação permaneça em acompanhamento
          avisoData: dataAviso,
          avisoHora: horaAviso,
          avisoMensagem: msg,
          avisoConcluido: false,
        };
        licModificada = atualizada;
        return atualizada;
      }
      return l;
    });

    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    if (licModificada) {
      salvarLicitacaoServidor(licModificada);
      salvarLicitacaoNuvem(licModificada).catch(err => {
        console.warn('Aviso ao sincronizar aviso do pregoeiro na nuvem:', err);
      });
    }
    // Garante que o som do sininho não apite imediatamente na hora de salvar
    qtdAlertasAnteriorRef.current = qtdAlertasAnteriorRef.current + 1;
    mostrarToast('Lembrete de retorno do pregoeiro salvo com sucesso!');
  };

  const handleRemoverAvisoPregoeiro = (licId: number) => {
    let licModificada: Licitacao | null = null;
    const licsAtualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(licId)) {
        const atualizada: Licitacao = {
          ...l,
          avisoData: '',
          avisoHora: '',
          avisoMensagem: '',
          avisoConcluido: false,
        };
        licModificada = atualizada;
        return atualizada;
      }
      return l;
    });

    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    if (licModificada) {
      salvarLicitacaoServidor(licModificada);
      salvarLicitacaoNuvem(licModificada).catch(err => {
        console.warn('Aviso ao remover aviso do pregoeiro na nuvem:', err);
      });
    }
    mostrarToast('Lembrete de retorno removido.');
  };

  const handleConcluirAvisoPregoeiro = (licId: number) => {
    let licModificada: Licitacao | null = null;
    const licsAtualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(licId)) {
        const atualizada: Licitacao = {
          ...l,
          avisoConcluido: true,
        };
        licModificada = atualizada;
        return atualizada;
      }
      return l;
    });

    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    if (licModificada) {
      salvarLicitacaoServidor(licModificada);
      salvarLicitacaoNuvem(licModificada).catch(err => {
        console.warn('Aviso ao concluir aviso do pregoeiro na nuvem:', err);
      });
    }
    mostrarToast('Aviso do pregoeiro marcado como atendido!');
  };

  const handleCadastrarLicitacao = (novaLic: Omit<Licitacao, 'id'>) => {
    // Garante ID estritamente único que nunca colide com nenhuma licitação existente (nem Catanduvas nem outras)
    const licsLocais = obterLicitacoes();
    const todasLics = [...licitacoes, ...licsLocais];
    const maiorId = todasLics.reduce((max, l) => {
      const num = Number(l.id);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const novoId = Math.max(Date.now(), maiorId + 1);

    const dataPropostaInicial =
      novaLic.data_proposta || converterParaFormatoInputDate(novaLic.data_cadastro);
    const itemCriado: Licitacao = {
      ...novaLic,
      id: novoId,
      data_proposta: dataPropostaInicial,
      acompanhamento: false,
      homologada: false,
      avisoConcluido: false,
    };

    const listaAtualizada = [itemCriado, ...licitacoes.filter(l => Number(l.id) !== novoId)];
    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);

    // Salva no servidor backend central e na nuvem
    salvarLicitacaoServidor(itemCriado);
    salvarLicitacaoNuvem(itemCriado).catch(() => {});

    // Define a nova licitação como selecionada e abre a aba montar
    setLicitacaoSelecionadaId(novoId);
    setAbaAtiva('montar');
    mostrarToast(`Licitação "${novaLic.orgao}" criada com sucesso! Proposta limpa pronta para inserção de itens.`);
    return novoId;
  };

  // Gerenciamento de Itens
  const handleAdicionarItem = (novoItem: Omit<ItemLicitacao, 'id'>) => {
    const maiorIdExistente = itens.length > 0 ? Math.max(...itens.map(i => Number(i.id) || 0)) : 0;
    const novoId = Math.max(Date.now(), maiorIdExistente + 1);
    // Quantidade estritamente inteira
    const qtdInteira = Math.max(1, Math.round(novoItem.quantidade));
    const itemCriado: ItemLicitacao = {
      ...novoItem,
      id: novoId,
      licitacao_id: Number(novoItem.licitacao_id),
      quantidade: qtdInteira,
      valor_total: qtdInteira * novoItem.valor_unitario,
      selecionado: novoItem.selecionado !== undefined ? novoItem.selecionado : true,
    };
    const listaAtualizada = [...itens, itemCriado];
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    salvarItemServidor(itemCriado);
    salvarItemNuvem(itemCriado).catch(err => {
      console.warn('Item salvo localmente, aviso ao enviar para a nuvem:', err);
    });

    mostrarToast(`Item #${novoItem.num_item} adicionado à proposta.`);
  };

  const handleAlternarSelecaoItem = (itemId: number) => {
    const listaAtualizada = itens.map(i => {
      if (Number(i.id) === Number(itemId)) {
        const itemModificado = { ...i, selecionado: i.selecionado === false ? true : false };
        salvarItemServidor(itemModificado);
        salvarItemNuvem(itemModificado).catch(() => {});
        return itemModificado;
      }
      return i;
    });
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
  };

  const handleAlternarTodosItens = (licId: number, selecionarTodos: boolean) => {
    const listaAtualizada = itens.map(i => {
      if (Number(i.licitacao_id) === Number(licId)) {
        const itemModificado = { ...i, selecionado: selecionarTodos };
        salvarItemServidor(itemModificado);
        salvarItemNuvem(itemModificado).catch(() => {});
        return itemModificado;
      }
      return i;
    });
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    const itensDestaLic = listaAtualizada.filter(i => Number(i.licitacao_id) === Number(licId));
    salvarItensLoteServidor(itensDestaLic);
    mostrarToast(
      selecionarTodos
        ? 'Todos os itens foram marcados para o PDF.'
        : 'Todos os itens foram desmarcados do PDF.'
    );
  };

  const handleAtualizarItem = (itemAtualizado: ItemLicitacao) => {
    const itemNormalizado: ItemLicitacao = {
      ...itemAtualizado,
      id: Number(itemAtualizado.id),
      licitacao_id: Number(itemAtualizado.licitacao_id),
      quantidade: Math.max(1, Math.round(itemAtualizado.quantidade)),
      valor_total: Math.max(1, Math.round(itemAtualizado.quantidade)) * itemAtualizado.valor_unitario,
      caminho_imagem: itemAtualizado.caminho_imagem ? itemAtualizado.caminho_imagem : '',
    };
    if (!itemNormalizado.caminho_imagem) {
      removerImagemItemIndexedDB(itemNormalizado.id).catch(() => {});
    }
    setItens(prev => {
      const existe = prev.some(i => Number(i.id) === Number(itemNormalizado.id));
      const listaAtualizada = existe
        ? prev.map(i => (Number(i.id) === Number(itemNormalizado.id) ? itemNormalizado : i))
        : [...prev, itemNormalizado];
      salvarItens(listaAtualizada);
      return listaAtualizada;
    });
    salvarItemServidor(itemNormalizado);
    salvarItemNuvem(itemNormalizado).catch(err => {
      console.warn('Item atualizado localmente, aviso ao enviar para a nuvem:', err);
    });

    mostrarToast(`Item #${itemNormalizado.num_item} atualizado.`);
  };

  // Forçar salvamento completo de garantia da proposta e catálogo (Sincroniza Servidor Central SSE + Firestore)
  const handleForcarSalvarProposta = async (licId: number): Promise<boolean> => {
    const itensDestaLic = itens.filter(i => Number(i.licitacao_id) === Number(licId));
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));

    // 1. Sincronização prioritária com o Servidor Central (Atualiza todos os outros computadores instantaneamente)
    if (itensDestaLic.length > 0) {
      await salvarItensLoteServidor(itensDestaLic);
    }
    if (licAtual) {
      await salvarLicitacaoServidor(licAtual);
    }

    // 2. Gravação em lote na NUVEM (Firestore)
    try {
      if (itensDestaLic.length > 0) {
        salvarTodosItensNuvem(itensDestaLic).catch(() => {});
      }
      if (licAtual) {
        salvarLicitacaoNuvem(licAtual).catch(() => {});
      }
    } catch {}

    // 3. Cache local seguro
    try {
      salvarItens(itens);
    } catch (errCache) {
      console.warn('Aviso ao atualizar cache local:', errCache);
    }

    mostrarToast(`✓ Proposta e Catálogo salvos com sucesso! Todos os ${itensDestaLic.length} itens sincronizados para todos.`);
    return true;
  };

  const handleExcluirItem = async (itemId: number) => {
    salvarItemExcluido(itemId);
    const listaAtualizada = itens.filter(i => Number(i.id) !== Number(itemId));
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    removerItemServidor(itemId);
    try {
      await removerItemNuvem(itemId);
      mostrarToast('Item excluído da proposta.');
    } catch (err) {
      console.warn('Item excluído localmente, sincronizando com a nuvem:', err);
      mostrarToast('Item excluído da proposta.');
    }
  };

  // Geração e Download do Arquivo PDF com Timbrado (apenas itens selecionados no quadrinho)
  const handleGerarPdf = async () => {
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licitacaoSelecionadaId)) || licitacoes[0];
    if (!licAtual) {
      mostrarToast('Nenhuma licitação selecionada.', 'erro');
      return;
    }

    // Filtra estritamente os itens marcados no quadrinho (selecionado !== false)
    const itensDaLic = itens.filter(i => Number(i.licitacao_id) === Number(licAtual.id) && i.selecionado !== false);
    if (itensDaLic.length === 0) {
      mostrarToast('Marque ao menos um item no quadrinho para gerar a proposta em PDF.', 'erro');
      return;
    }

    try {
      mostrarToast(`Gerando proposta em PDF com ${itensDaLic.length} item(ns) selecionado(s)...`);
      const blob = await gerarArquivoPdf(licAtual, itensDaLic, timbradoConfig);
      const sanitizado = licAtual.processo_pregao.replace(/[/\\?%*:|"<>]/g, '_');
      const nomeArquivo = `Proposta_Comercial_${sanitizado}.pdf`;
      baixarBlobPdf(blob, nomeArquivo);
      mostrarToast('Documento PDF gerado e baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      mostrarToast('Erro ao gerar o arquivo PDF.', 'erro');
    }
  };

  const licitacaoAtual = licitacoes.find(l => Number(l.id) === Number(licitacaoSelecionadaId)) || licitacoes[0] || null;
  const temItensNaLicAtual = itens.some(i => Number(i.licitacao_id) === Number(licitacaoSelecionadaId));

  // Se não estiver autenticado, bloqueia completamente o sistema e exibe apenas a tela de login
  if (!autenticado) {
    return (
      <>
        <LoginScreen
          acessoConfig={acessoConfig}
          onLoginSucesso={handleLoginSucesso}
        />
        {toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
              toast.tipo === 'sucesso'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toast.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            {toast.mensagem}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Barra de navegação do topo (Logo, Nuvem, Tema, Calcular e Sair) */}
      <Header
        sidebarAberta={sidebarAberta}
        onToggleSidebar={() => setSidebarAberta(prev => !prev)}
        onAbrirCalculadora={() => {
          if (abaAtiva === 'montar') {
            setCalculadoraMinimizada(false);
          } else {
            setCalculadoraAberta(prev => !prev);
          }
        }}
        onLogout={handleLogout}
        statusNuvem={statusNuvem}
        tema={tema}
        onAlternarTema={handleAlternarTema}
        alertasCobrancas={todosAlertasSininho}
        onNavegarParaAlerta={(alerta) => {
          if (alerta.tipo === 'pregoeiro_retorno') {
            if (alerta.licitacaoId) {
              setLicitacaoSelecionadaId(alerta.licitacaoId);
            }
            setAbaAtiva('historico');
          } else {
            setAbaAtiva('cobrancas');
            if (alerta.cobrancaId) setCobrancaDestaqueId(alerta.cobrancaId);
          }
        }}
        onNavegarParaCobranca={(id) => {
          setAbaAtiva('cobrancas');
          if (id) setCobrancaDestaqueId(id);
        }}
        onTestarSomNotificacao={tocarSomNotificacao}
        onConcluirAvisoPregoeiro={handleConcluirAvisoPregoeiro}
      />

      {/* Painel lateral deslizante da Calculadora de Limite de Oferta (Fixo na aba Montar Proposta) */}
      <CalculadoraOfertaDrawer
        aberto={abaAtiva === 'montar' ? true : calculadoraAberta}
        modoFixo={abaAtiva === 'montar'}
        minimizada={abaAtiva === 'montar' ? calculadoraMinimizada : false}
        onAlternarMinimizar={() => setCalculadoraMinimizada(prev => !prev)}
        onFechar={() => {
          if (abaAtiva === 'montar') {
            setCalculadoraMinimizada(true);
          } else {
            setCalculadoraAberta(false);
          }
        }}
      />

      {/* Modal de Configuração de Segurança e Acesso */}
      <SegurancaModal
        aberto={segurancaModalAberto}
        onFechar={() => setSegurancaModalAberto(false)}
        acessoAtual={acessoConfig}
        onSalvarAcesso={handleSalvarAcesso}
      />

      {/* Modal de Declaração Unificada (Lei 14.133/2021) */}
      <ModalDeclaracaoUnificada
        aberto={modalDeclaracaoAberto}
        onFechar={() => {
          setModalDeclaracaoAberto(false);
          setLicitacaoParaDeclaracao(null);
        }}
        licitacoes={licitacoes}
        licitacaoInicial={licitacaoParaDeclaracao}
        timbrado={timbradoConfig || obterPapelTimbradoConfig()}
      />

      {/* Modal de Exequibilidade de Preços e Composição de Custos */}
      <ModalExequibilidade
        aberto={modalExequibilidadeAberto}
        onFechar={() => {
          setModalExequibilidadeAberto(false);
          setLicitacaoParaExequibilidade(null);
        }}
        licitacoes={licitacoes}
        itens={itens}
        licitacaoInicial={licitacaoParaExequibilidade}
        timbrado={timbradoConfig || obterPapelTimbradoConfig()}
        onAtualizarItem={handleAtualizarItem}
        onAlternarSelecaoItem={handleAlternarSelecaoItem}
        onAlternarTodosItens={handleAlternarTodosItens}
      />

      {/* Modal Assinador de Documentos & Atas de Registro de Preços */}
      <ModalAssinadorDocumentos
        aberto={modalAssinadorAberto}
        onFechar={() => setModalAssinadorAberto(false)}
        timbrado={timbradoConfig || obterPapelTimbradoConfig()}
      />

      {/* Modal das Novas Declarações Oficiais (ME/EPP, Habilitação, Fatos Impeditivos, Mão de Obra Infantil) */}
      <ModalNovasDeclaracoes
        aberto={modalNovasDeclaracoesAberto}
        onFechar={() => setModalNovasDeclaracoesAberto(false)}
        tipoInicial={tipoNovaDeclaracaoAtiva}
        licitacoes={licitacoes}
        licitacaoInicial={
          licitacoes.find(l => Number(l.id) === Number(licitacaoSelecionadaId)) ||
          licitacoes[0] ||
          null
        }
        timbrado={timbradoConfig || obterPapelTimbradoConfig()}
      />

      {/* Toast flutuante */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            toast.tipo === 'sucesso'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toast.tipo === 'sucesso' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          {toast.mensagem}
        </div>
      )}

      {/* Estrutura CRM: Faixa Lateral Esquerda + Conteúdo Central */}
      <div className="flex-1 flex w-full">
        {/* Faixa Lateral CRM com os botões de navegação, documentos e configurações */}
        <Sidebar
          abaAtiva={abaAtiva}
          setAbaAtiva={(aba) => {
            setAbaAtiva(aba);
            setSidebarAberta(false);
          }}
          totalLicitacoes={licitacoes.length}
          totalContatos={contatos.length}
          totalCobrancas={cobrancas.length}
          totalAlertasCobrancas={alertasCobrancas.length}
          totalAlertasPregoeiro={alertasPregoeiro.length}
          onAbrirDeclaracao={() => {
            const lic = licitacoes.find(l => Number(l.id) === Number(licitacaoSelecionadaId)) || licitacoes[0] || null;
            setLicitacaoParaDeclaracao(lic);
            setModalDeclaracaoAberto(true);
            setSidebarAberta(false);
          }}
          onAbrirNovaDeclaracao={(tipo) => {
            setTipoNovaDeclaracaoAtiva(tipo);
            setModalNovasDeclaracoesAberto(true);
            setSidebarAberta(false);
          }}
          onAbrirExequibilidade={() => {
            const lic =
              licitacoes.find(l => Number(l.id) === Number(licitacaoSelecionadaId)) ||
              licitacoes.find(l => itens.some(i => Number(i.licitacao_id) === Number(l.id) && i.selecionado === true)) ||
              licitacoes.find(l => itens.some(i => Number(i.licitacao_id) === Number(l.id))) ||
              licitacoes[0] ||
              null;
            setLicitacaoParaExequibilidade(lic);
            setModalExequibilidadeAberto(true);
            setSidebarAberta(false);
          }}
          onAbrirAssinador={() => {
            setModalAssinadorAberto(true);
            setSidebarAberta(false);
          }}
          onAbrirSeguranca={() => {
            setSegurancaModalAberto(true);
            setSidebarAberta(false);
          }}
          abertaMobile={sidebarAberta}
          onFecharMobile={() => setSidebarAberta(false)}
          statusNuvem={statusNuvem}
        />

        {/* Área Central / Conteúdo Principal e Rodapé */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Conteúdo Principal mantido com largura padrão consistente */}
          <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {abaAtiva === 'historico' && (
          <HistoricoTab
            licitacoes={licitacoes}
            itens={itens}
            responsaveis={responsaveis}
            timbradoConfig={timbradoConfig}
            onAdicionarResponsavel={handleAdicionarResponsavel}
            onExcluirResponsavel={handleExcluirResponsavel}
            onAtualizarResponsavel={handleAtualizarResponsavel}
            onExcluirLicitacao={handleExcluirLicitacao}
            onSelecionarLicitacao={id => {
              setLicitacaoSelecionadaId(id);
              setAbaAtiva('montar');
            }}
            onNovaLicitacao={() => setAbaAtiva('cadastrar')}
            onNavegarPara={setAbaAtiva}
            onAbrirSeguranca={() => setSegurancaModalAberto(true)}
            onToggleAcompanhamento={handleToggleAcompanhamento}
            onToggleHomologada={handleToggleHomologada}
            onSalvarAvisoPregoeiro={handleSalvarAvisoPregoeiro}
            onRemoverAvisoPregoeiro={handleRemoverAvisoPregoeiro}
            onAbrirCalculadora={() => setCalculadoraAberta(true)}
            onAbrirDeclaracao={lic => {
              setLicitacaoParaDeclaracao(lic || null);
              setModalDeclaracaoAberto(true);
            }}
          />
        )}

        {abaAtiva === 'contatos' && (
          <ContatosTab
            contatos={contatos}
            licitacoesCrm={licitacoes}
            onSalvarContato={handleSalvarContato}
            onExcluirContato={handleExcluirContato}
          />
        )}

        {abaAtiva === 'cobrancas' && (
          <CobrancasTab
            cobrancas={cobrancas}
            licitacoes={licitacoes}
            contatos={contatos}
            responsaveis={responsaveis}
            onAdicionarResponsavel={handleAdicionarResponsavel}
            cobrancaDestaqueId={cobrancaDestaqueId}
            onSalvarCobranca={handleSalvarCobranca}
            onExcluirCobranca={handleExcluirCobranca}
            onLimparDestaque={() => setCobrancaDestaqueId(null)}
          />
        )}

        {abaAtiva === 'analise' && (
          <AnaliseTab
            licitacoes={licitacoes}
            itens={itens}
            contatos={contatos}
            onSelecionarLicitacao={setLicitacaoSelecionadaId}
            onNavegarPara={setAbaAtiva}
          />
        )}

        {abaAtiva === 'cadastrar' && (
          <CadastrarLicitacaoTab
            responsaveis={responsaveis}
            onAdicionarResponsavel={handleAdicionarResponsavel}
            onCadastrar={handleCadastrarLicitacao}
            onSucesso={id => {
              setLicitacaoSelecionadaId(id);
              setAbaAtiva('montar');
            }}
          />
        )}

        {abaAtiva === 'timbrado' && (
          <PapelTimbradoTab
            config={timbradoConfig}
            onSalvarConfig={handleSalvarTimbrado}
            onVisualizarPdf={() => setAbaAtiva('preview')}
          />
        )}

        {abaAtiva === 'montar' && (
          <MontarPropostaTab
            licitacoes={licitacoes}
            licitacaoSelecionadaId={licitacaoSelecionadaId}
            onSelecionarLicitacao={setLicitacaoSelecionadaId}
            itens={itens}
            onAdicionarItem={handleAdicionarItem}
            onAtualizarItem={handleAtualizarItem}
            onAlternarSelecaoItem={handleAlternarSelecaoItem}
            onAlternarTodosItens={handleAlternarTodosItens}
            onExcluirItem={handleExcluirItem}
            onAtualizarDataProposta={handleAtualizarDataProposta}
            onGerarPdf={handleGerarPdf}
            onVisualizarPdf={() => setAbaAtiva('preview')}
            onIrParaTimbrado={() => setAbaAtiva('timbrado')}
            onForcarSalvarProposta={handleForcarSalvarProposta}
            onAtualizarUfLicitacao={handleAtualizarUfLicitacao}
            calculadoraFixaAberta={abaAtiva === 'montar' && !calculadoraMinimizada}
          />
        )}

        {abaAtiva === 'preview' && (
          <VisualizarPdfTab
            licitacao={licitacaoAtual}
            licitacoes={licitacoes}
            licitacaoSelecionadaId={licitacaoSelecionadaId}
            onSelecionarLicitacao={setLicitacaoSelecionadaId}
            itens={itens}
            timbrado={timbradoConfig}
            onGerarPdf={handleGerarPdf}
            onIrParaTimbrado={() => setAbaAtiva('timbrado')}
            onSalvarConfig={handleSalvarTimbrado}
            onAtualizarDataProposta={handleAtualizarDataProposta}
            onNovaLicitacao={() => setAbaAtiva('cadastrar')}
          />
        )}
      </main>

      {/* Rodapé com mensagem inspiradora e informações do sistema */}
      <footer className="bg-white dark:bg-[#0A162B] border-t border-slate-200/80 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto px-4 space-y-3">
          {/* Mensagem Bíblica de Provérbios 16:3 */}
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-xs sm:text-sm font-medium italic text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              “Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.”
            </p>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Provérbios 16:3
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span>
              GWS GLOBAL.net • Gestão de Licitações & Gerador de Propostas Comerciais
            </span>
            <span>
              Exportação em PDF • Papel Timbrado Dinâmico • Sistema Operacional Seguro
            </span>
          </div>
        </div>
      </footer>
        </div>
      </div>
    </div>
  );
}
