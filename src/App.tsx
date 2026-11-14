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
import { ModalConsoleCmd } from './components/ModalConsoleCmd';
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
  salvarTrocaIdHistorico,
  desfazerUltimaTrocaIdLocal,
  obterContatosLocal,
  salvarContatosLocal,
  obterCobrancasLocal,
  salvarCobrancasLocal,
  limparChavesExcluidasLegadas,
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
import { converterParaFormatoInputDate, compararLicitacoesPorDataCadastroDesc } from './utils/numberToWordsPtBr';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { obterTema, aplicarTema, alternarTema, ThemeMode, obterTemaNatal, alternarTemaNatal } from './utils/theme';
import { EfeitoNeve } from './components/EfeitoNeve';
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
  ouvirContatosNuvem,
  salvarContatoNuvem,
  removerContatoNuvem,
  ouvirCobrancasNuvem,
  salvarCobrancaNuvem,
  removerCobrancaNuvem,
  trocarIdLicitacaoNuvem,
} from './firebase/firestoreService';

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
  const [consoleCmdAberto, setConsoleCmdAberto] = useState<boolean>(false);
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const [statusNuvem, setStatusNuvem] = useState<'conectando' | 'conectado' | 'desconectado'>('conectando');
  const [tema, setTema] = useState<ThemeMode>(() => obterTema());
  const [temaNatal, setTemaNatal] = useState<boolean>(() => obterTemaNatal());

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

  const handleAlternarTemaNatal = () => {
    const novo = alternarTemaNatal();
    setTemaNatal(novo);
    mostrarToast(
      novo
        ? 'Tema de Natal ativado! 🎄 Neve e pisca-pisca festivo ligados.'
        : 'Tema de Natal pausado. ❄️',
      'sucesso'
    );
  };

  // Carrega cache local instantâneo para exibição imediata enquanto o Firestore conecta
  useEffect(() => {
    limparChavesExcluidasLegadas();
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

    restaurarImagensIndexedDB(its).then((itsRestaurados) => {
      if (itsRestaurados && itsRestaurados.length > 0) {
        setItens(itsRestaurados);
      }
    });
  }, []);

  // Sincronização em tempo real 100% direta com Firebase Firestore (Blaze - sem limites diários)
  useEffect(() => {
    setStatusNuvem('conectando');

    const onFirestoreError = () => {
      setStatusNuvem('desconectado');
    };

    const unsubLics = ouvirLicitacoesNuvem(
      (licsNuvem) => {
        setStatusNuvem('conectado');
        setLicitacoes(licsNuvem);
        salvarLicitacoes(licsNuvem);
        setLicitacaoSelecionadaId(prev => {
          if (prev && licsNuvem.some(l => Number(l.id) === Number(prev))) return prev;
          return licsNuvem.length > 0 ? licsNuvem[0].id : null;
        });
      },
      onFirestoreError
    );

    const unsubItens = ouvirItensNuvem(
      (itensNuvem) => {
        setStatusNuvem('conectado');
        setItens(itensNuvem);
        salvarItens(itensNuvem);
      },
      onFirestoreError
    );

    const unsubTimbrado = ouvirPapelTimbradoNuvem(
      (timbradoNuvem) => {
        if (timbradoNuvem) {
          setTimbradoConfig(timbradoNuvem);
          salvarPapelTimbradoConfig(timbradoNuvem);
        }
      },
      onFirestoreError
    );

    const unsubResponsaveis = ouvirResponsaveisNuvem(
      (respsNuvem) => {
        if (respsNuvem && respsNuvem.length > 0) {
          setResponsaveis(respsNuvem);
          salvarResponsaveis(respsNuvem);
        }
      },
      onFirestoreError
    );

    const unsubSeguranca = ouvirAcessoConfigNuvem(
      (acessoNuvem) => {
        if (acessoNuvem && acessoNuvem.usuarioId && acessoNuvem.senhaHash) {
          setAcessoConfig(acessoNuvem);
          salvarAcessoConfig(acessoNuvem);
        }
      },
      onFirestoreError
    );

    const unsubContatos = ouvirContatosNuvem(
      (ctsNuvem) => {
        setContatos(ctsNuvem);
        salvarContatosLocal(ctsNuvem);
      },
      onFirestoreError
    );

    const unsubCobrancas = ouvirCobrancasNuvem(
      (cobNuvem) => {
        setCobrancas(cobNuvem);
        salvarCobrancasLocal(cobNuvem);
      },
      onFirestoreError
    );

    return () => {
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
    setContatos(prev => {
      const idx = prev.findIndex(c => String(c.id) === String(contato.id));
      const lista = idx >= 0
        ? prev.map(c => (String(c.id) === String(contato.id) ? contato : c))
        : [contato, ...prev];
      salvarContatosLocal(lista);
      return lista;
    });
    try {
      await salvarContatoNuvem(contato);
      mostrarToast(`Contato de "${contato.nomeContato}" (${contato.prefeitura}) salvo com sucesso!`);
    } catch {
      mostrarToast('Erro ao gravar contato no Firestore.', 'erro');
    }
  };

  const handleExcluirContato = async (contatoId: string) => {
    const strId = String(contatoId);
    setContatos(prev => {
      const lista = prev.filter(c => String(c.id) !== strId);
      salvarContatosLocal(lista);
      return lista;
    });
    try {
      await removerContatoNuvem(strId);
      mostrarToast('Contato removido da agenda.');
    } catch {
      mostrarToast('Erro ao remover contato no Firestore.', 'erro');
    }
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
    try {
      await salvarCobrancaNuvem(cobranca);
      mostrarToast(`Cobrança de "${cobranca.prefeitura}" salva com sucesso!`);
    } catch {
      mostrarToast('Erro ao gravar cobrança no Firestore.', 'erro');
    }
  };

  const handleExcluirCobranca = async (cobrancaId: string) => {
    const strId = String(cobrancaId);
    setCobrancas(prev => {
      const lista = prev.filter(c => String(c.id) !== strId);
      salvarCobrancasLocal(lista);
      return lista;
    });
    try {
      await removerCobrancaNuvem(strId);
      mostrarToast('Cobrança removida com sucesso.');
    } catch {
      mostrarToast('Erro ao remover cobrança no Firestore.', 'erro');
    }
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
    try {
      await salvarAcessoConfigNuvem(novoAcesso);
      mostrarToast('Credenciais de acesso atualizadas com sucesso!', 'sucesso');
    } catch (err) {
      console.warn('Erro ao salvar segurança na nuvem:', err);
      mostrarToast('Erro ao salvar credenciais no Firestore.', 'erro');
    }
  };

  // Gerenciamento de Responsáveis (Adicionar e Excluir)
  const handleAdicionarResponsavel = (novoNome: string): boolean => {
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo) return false;
    
    const jaExiste = responsaveis.some(r => r.toLowerCase() === nomeLimpo.toLowerCase());
    if (jaExiste) {
      mostrarToast(`O responsável "${nomeLimpo}" já está na lista.`, 'erro');
      return false;
    }

    const novaLista = [...responsaveis, nomeLimpo];
    setResponsaveis(novaLista);
    salvarResponsaveis(novaLista);
    salvarResponsaveisNuvem(novaLista).catch(() => {});
    mostrarToast(`Responsável "${nomeLimpo}" adicionado com sucesso!`);
    return true;
  };

  const handleExcluirResponsavel = (nomeParaExcluir: string, transferirPara?: string) => {
    if (responsaveis.length <= 1) {
      mostrarToast('Você deve manter pelo menos um responsável cadastrado no sistema.', 'erro');
      return;
    }

    const novaLista = responsaveis.filter(r => r !== nomeParaExcluir);
    setResponsaveis(novaLista);
    salvarResponsaveis(novaLista);
    salvarResponsaveisNuvem(novaLista).catch(() => {});

    const destino = transferirPara || novaLista[0] || 'Gustavo';
    let alteradas = 0;
    const licsAtualizadas = licitacoes.map(lic => {
      if ((lic.responsavel || '').toLowerCase() === nomeParaExcluir.toLowerCase()) {
        alteradas++;
        const licAtualizada = { ...lic, responsavel: destino, updatedAt: new Date().toISOString() };
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
    salvarPapelTimbradoNuvem(novaConfig).catch(() => {});
    mostrarToast('Configurações de papel timbrado salvas com sucesso!');
  };

  // Gerenciamento de Licitações
  const handleAtualizarResponsavel = (id: number, novoResponsavel: string) => {
    if (novoResponsavel && !responsaveis.includes(novoResponsavel)) {
      const novaLista = [...responsaveis, novoResponsavel];
      setResponsaveis(novaLista);
      salvarResponsaveis(novaLista);
      salvarResponsaveisNuvem(novaLista).catch(() => {});
    }
    const nowIso = new Date().toISOString();
    const atualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(id)) {
        const atual = { ...l, responsavel: novoResponsavel, updatedAt: nowIso };
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
    const licsAtualizadas = licitacoes.filter(l => Number(l.id) !== Number(id));
    const itensAtualizados = itens.filter(i => Number(i.licitacao_id) !== Number(id));
    setLicitacoes(licsAtualizadas);
    setItens(itensAtualizados);
    salvarLicitacoes(licsAtualizadas);
    salvarItens(itensAtualizados);

    if (Number(licitacaoSelecionadaId) === Number(id)) {
      setLicitacaoSelecionadaId(licsAtualizadas.length > 0 ? licsAtualizadas[0].id : null);
    }

    try {
      await removerLicitacaoNuvem(id);
      mostrarToast('Licitação excluída com sucesso.');
    } catch (err) {
      console.warn('Erro ao excluir licitação no Firestore:', err);
      mostrarToast('Erro ao excluir licitação no Firestore.', 'erro');
    }
  };

  const handleAtualizarDataProposta = (licId: number, novaData: string) => {
    const nowIso = new Date().toISOString();
    const licsAtualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(licId)) {
        const atualizada: Licitacao = { ...l, data_proposta: novaData, updatedAt: nowIso };
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

  // Altera a data de cadastro de uma licitação diretamente no Firestore
  const handleAtualizarDataCadastro = (licId: number, novaData: string): boolean => {
    let licModificada: Licitacao | null = null;
    const nowIso = new Date().toISOString();
    const licsAtualizadas = licitacoes.map(l => {
      if (Number(l.id) === Number(licId)) {
        const atualizada: Licitacao = {
          ...l,
          data_cadastro: novaData,
          updatedAt: nowIso,
        };
        licModificada = atualizada;
        return atualizada;
      }
      return l;
    });

    if (licModificada) {
      setLicitacoes(licsAtualizadas);
      salvarLicitacoes(licsAtualizadas);
      salvarLicitacaoNuvem(licModificada).catch(err => {
        console.warn('Aviso ao sincronizar data de cadastro na nuvem:', err);
      });
      mostrarToast(`✓ Data de cadastro da licitação #${licId} atualizada para ${novaData}!`);
      return true;
    }

    mostrarToast(`Licitação #${licId} não encontrada.`, 'erro');
    return false;
  };

  // Renumerar o ID de uma licitação existente e transferir atomicamente todos os itens vinculados (Exclusivo via Console CMD)
  const handleTrocarIdLicitacao = (
    idAntigo: number,
    idNovo: number,
    novoProcessoOpcional?: string
  ): { sucesso: boolean; mensagem: string } => {
    const oldId = Number(idAntigo);
    const newId = Number(idNovo);

    if (isNaN(oldId) || isNaN(newId) || oldId <= 0 || newId <= 0) {
      return { sucesso: false, mensagem: 'IDs inválidos. Forneça números válidos maiores que zero.' };
    }

    const licAntiga = licitacoes.find(l => Number(l.id) === oldId);
    if (!licAntiga) {
      return { sucesso: false, mensagem: `Licitação com ID #${oldId} não foi encontrada.` };
    }

    if (oldId === newId) {
      if (novoProcessoOpcional && novoProcessoOpcional.trim()) {
        const procLimpo = novoProcessoOpcional.trim();
        const licModificada: Licitacao = {
          ...licAntiga,
          processo_pregao: procLimpo,
          updatedAt: new Date().toISOString(),
        };
        const novasLics = licitacoes.map(l => (Number(l.id) === oldId ? licModificada : l));
        setLicitacoes(novasLics);
        salvarLicitacoes(novasLics);
        salvarLicitacaoNuvem(licModificada).catch(() => {});
        mostrarToast(`✓ Processo/Pregão atualizado para "${procLimpo}"!`, 'sucesso');
        return {
          sucesso: true,
          mensagem: `✓ O ID #${oldId} foi mantido e o Processo/Pregão foi atualizado para "${procLimpo}".`,
        };
      }
      return { sucesso: false, mensagem: 'O novo ID deve ser diferente do ID atual.' };
    }

    const jaExiste = licitacoes.some(l => Number(l.id) === newId);
    if (jaExiste) {
      return { sucesso: false, mensagem: `Já existe uma licitação cadastrada com o ID #${newId}. Escolha outro ID disponível.` };
    }

    const licAtualizada: Licitacao = {
      ...licAntiga,
      id: newId,
      processo_pregao: (novoProcessoOpcional && novoProcessoOpcional.trim()) ? novoProcessoOpcional.trim() : licAntiga.processo_pregao,
      updatedAt: new Date().toISOString(),
    };

    const novasLics = licitacoes
      .map(l => (Number(l.id) === oldId ? licAtualizada : l))
      .sort(compararLicitacoesPorDataCadastroDesc);
    setLicitacoes(novasLics);
    salvarLicitacoes(novasLics);

    const itensVinculados = itens.filter(i => Number(i.licitacao_id) === oldId);
    const novosItens = itens.map(it => {
      if (Number(it.licitacao_id) === oldId) {
        return {
          ...it,
          licitacao_id: newId,
        };
      }
      return it;
    });
    setItens(novosItens);
    salvarItens(novosItens);

    if (Number(licitacaoSelecionadaId) === oldId) {
      setLicitacaoSelecionadaId(newId);
    }

    trocarIdLicitacaoNuvem(oldId, newId, licAtualizada, itensVinculados).catch(err => {
      console.warn('Aviso ao renumerar ID no Firestore:', err);
    });

    salvarTrocaIdHistorico({
      idAntigo: oldId,
      idNovo: newId,
      orgao: licAntiga.orgao,
      processo: licAntiga.processo_pregao,
    });

    const msgSucesso = novoProcessoOpcional
      ? `✓ ID alterado para #${newId} e Processo atualizado para "${novoProcessoOpcional}"! (${itensVinculados.length} itens vinculados)`
      : `✓ ID alterado com sucesso de #${oldId} para #${newId}! (${itensVinculados.length} itens vinculados)`;

    mostrarToast(`✓ ID alterado para #${newId}!`, 'sucesso');
    return {
      sucesso: true,
      mensagem: msgSucesso,
    };
  };

  // Desfazer a última alteração de ID realizada no sistema (Exclusivo via Console CMD)
  const handleDesfazerTrocaId = (): { sucesso: boolean; mensagem: string } => {
    const ultimaTroca = desfazerUltimaTrocaIdLocal();
    if (!ultimaTroca) {
      return {
        sucesso: false,
        mensagem: 'Nenhuma alteração recente de ID foi encontrada no histórico para desfazer. Se desejar, use "trocar-id <idAtual> <idDesejado>" para definir o ID que quiser.',
      };
    }

    const idParaRestaurar = Number(ultimaTroca.idAntigo);
    const idAtual = Number(ultimaTroca.idNovo);
    const orgaoNome = ultimaTroca.orgao || '';

    const lic = licitacoes.find(l => Number(l.id) === idAtual);
    if (!lic) {
      return {
        sucesso: false,
        mensagem: `Licitação com ID #${idAtual} não encontrada para restaurar ao ID #${idParaRestaurar}.`,
      };
    }

    const licRestaurada: Licitacao = {
      ...lic,
      id: idParaRestaurar,
      updatedAt: new Date().toISOString(),
    };

    const novasLics = licitacoes
      .map(l => (Number(l.id) === idAtual ? licRestaurada : l))
      .sort(compararLicitacoesPorDataCadastroDesc);
    setLicitacoes(novasLics);
    salvarLicitacoes(novasLics);

    const itensMigrados = itens.map(it => {
      if (Number(it.licitacao_id) === idAtual) {
        return {
          ...it,
          licitacao_id: idParaRestaurar,
        };
      }
      return it;
    });
    setItens(itensMigrados);
    salvarItens(itensMigrados);

    if (Number(licitacaoSelecionadaId) === idAtual) {
      setLicitacaoSelecionadaId(idParaRestaurar);
    }

    trocarIdLicitacaoNuvem(
      idAtual,
      idParaRestaurar,
      licRestaurada,
      itensMigrados.filter(i => Number(i.licitacao_id) === idParaRestaurar)
    ).catch(() => {});

    mostrarToast(`✓ ID restaurado de volta para #${idParaRestaurar}!`, 'sucesso');
    return {
      sucesso: true,
      mensagem: `✓ ALTERAÇÃO DESFEITA! A licitação "${orgaoNome || lic.processo_pregao}" foi restaurada com sucesso do ID #${idAtual} de volta para #${idParaRestaurar}.`,
    };
  };

  // Alterar o Processo/Pregão de uma licitação (Exclusivo via Console CMD)
  const handleTrocarProcessoLicitacao = (licId: number, novoProcesso: string): { sucesso: boolean; mensagem: string } => {
    const idNum = Number(licId);
    const processoLimpo = novoProcesso.trim();

    if (isNaN(idNum) || idNum <= 0) {
      return { sucesso: false, mensagem: 'ID inválido.' };
    }

    if (!processoLimpo) {
      return { sucesso: false, mensagem: 'O número do Processo/Pregão não pode ser vazio.' };
    }

    const licAntiga = licitacoes.find(l => Number(l.id) === idNum);
    if (!licAntiga) {
      return { sucesso: false, mensagem: `Licitação #${idNum} não foi encontrada.` };
    }

    const licModificada: Licitacao = {
      ...licAntiga,
      processo_pregao: processoLimpo,
      updatedAt: new Date().toISOString(),
    };

    const licsAtualizadas = licitacoes.map(l => (Number(l.id) === idNum ? licModificada : l));
    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao sincronizar processo na nuvem:', err);
    });

    mostrarToast(`✓ Processo/Pregão atualizado para "${processoLimpo}"!`, 'sucesso');
    return {
      sucesso: true,
      mensagem: `✓ Processo/Pregão da licitação #${idNum} alterado com sucesso de "${licAntiga.processo_pregao}" para "${processoLimpo}".`,
    };
  };

  // Alterar o nome do Órgão Público de uma licitação (Exclusivo via Console CMD)
  const handleTrocarOrgaoLicitacao = (licId: number, novoOrgao: string): { sucesso: boolean; mensagem: string } => {
    const idNum = Number(licId);
    const orgaoLimpo = novoOrgao.trim();

    if (isNaN(idNum) || idNum <= 0) {
      return { sucesso: false, mensagem: 'ID inválido.' };
    }

    if (!orgaoLimpo) {
      return { sucesso: false, mensagem: 'O nome do órgão público não pode ser vazio.' };
    }

    const licAntiga = licitacoes.find(l => Number(l.id) === idNum);
    if (!licAntiga) {
      return { sucesso: false, mensagem: `Licitação com ID #${idNum} não foi encontrada.` };
    }

    const licModificada: Licitacao = {
      ...licAntiga,
      orgao: orgaoLimpo,
      updatedAt: new Date().toISOString(),
    };

    const licsAtualizadas = licitacoes.map(l => (Number(l.id) === idNum ? licModificada : l));
    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao sincronizar órgão na nuvem:', err);
    });

    mostrarToast(`✓ Órgão da licitação #${idNum} atualizado para "${orgaoLimpo}"!`, 'sucesso');
    return {
      sucesso: true,
      mensagem: `✓ Órgão da licitação #${idNum} atualizado com sucesso de "${licAntiga.orgao}" para "${orgaoLimpo}".`,
    };
  };

  const handleAtualizarUfLicitacao = (licId: number, novaUf: string) => {
    const ufFormatada = novaUf.trim().toUpperCase();
    const nowIso = new Date().toISOString();
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));
    if (!licAtual) return;

    const licModificada: Licitacao = { ...licAtual, uf: ufFormatada, updatedAt: nowIso };
    const licsAtualizadas = licitacoes.map(l => (Number(l.id) === Number(licId) ? licModificada : l));

    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao sincronizar UF da licitação na nuvem:', err);
    });

    mostrarToast(`Estado (UF) atualizado para ${ufFormatada}.`);
  };

  // Alternar Status de Acompanhamento (👁 Olho Amarelo)
  const handleToggleAcompanhamento = (id: number) => {
    const licAtual = licitacoes.find(l => Number(l.id) === Number(id));
    if (!licAtual) return;

    const licModificada: Licitacao = {
      ...licAtual,
      acompanhamento: !licAtual.acompanhamento,
      updatedAt: new Date().toISOString(),
    };
    const listaAtualizada = licitacoes.map(l => (Number(l.id) === Number(id) ? licModificada : l));
    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao sincronizar acompanhamento na nuvem:', err);
    });
  };

  // Alternar Status de Concluída / Homologada (✓ Check Verde)
  const handleToggleHomologada = (id: number) => {
    const licAtual = licitacoes.find(l => Number(l.id) === Number(id));
    if (!licAtual) return;

    const licModificada: Licitacao = {
      ...licAtual,
      homologada: !licAtual.homologada,
      updatedAt: new Date().toISOString(),
    };
    const listaAtualizada = licitacoes.map(l => (Number(l.id) === Number(id) ? licModificada : l));
    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao sincronizar homologada na nuvem:', err);
    });
  };

  // Handlers para Alertas de Retorno do Pregoeiro
  const handleSalvarAvisoPregoeiro = (licId: number, dataAviso: string, horaAviso: string, msg: string) => {
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));
    if (!licAtual) return;

    const licModificada: Licitacao = {
      ...licAtual,
      acompanhamento: true,
      avisoData: dataAviso,
      avisoHora: horaAviso,
      avisoMensagem: msg,
      avisoConcluido: false,
      updatedAt: new Date().toISOString(),
    };
    const licsAtualizadas = licitacoes.map(l => (Number(l.id) === Number(licId) ? licModificada : l));
    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao sincronizar aviso do pregoeiro na nuvem:', err);
    });
    qtdAlertasAnteriorRef.current = qtdAlertasAnteriorRef.current + 1;
    mostrarToast('Lembrete de retorno do pregoeiro salvo com sucesso!');
  };

  const handleRemoverAvisoPregoeiro = (licId: number) => {
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));
    if (!licAtual) return;

    const licModificada: Licitacao = {
      ...licAtual,
      avisoData: '',
      avisoHora: '',
      avisoMensagem: '',
      avisoConcluido: false,
      updatedAt: new Date().toISOString(),
    };
    const licsAtualizadas = licitacoes.map(l => (Number(l.id) === Number(licId) ? licModificada : l));
    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao remover aviso do pregoeiro na nuvem:', err);
    });
    mostrarToast('Lembrete de retorno removido.');
  };

  const handleConcluirAvisoPregoeiro = (licId: number) => {
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));
    if (!licAtual) return;

    const licModificada: Licitacao = {
      ...licAtual,
      avisoConcluido: true,
      updatedAt: new Date().toISOString(),
    };
    const licsAtualizadas = licitacoes.map(l => (Number(l.id) === Number(licId) ? licModificada : l));
    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao concluir aviso do pregoeiro na nuvem:', err);
    });
    mostrarToast('Aviso do pregoeiro marcado como atendido!');
  };

  const handleCadastrarLicitacao = (novaLic: Omit<Licitacao, 'id'>) => {
    const maiorId = licitacoes.reduce((max, l) => {
      const num = Number(l.id);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const novoId = Math.max(Date.now(), maiorId + 1);

    const dataPropostaInicial =
      novaLic.data_proposta || converterParaFormatoInputDate(novaLic.data_cadastro);
    const itemCriado: Licitacao = {
      ...novaLic,
      plataforma: novaLic.plataforma || 'BLL',
      id: novoId,
      data_proposta: dataPropostaInicial,
      acompanhamento: false,
      homologada: false,
      avisoConcluido: false,
      updatedAt: new Date().toISOString(),
    };

    const listaAtualizada = [itemCriado, ...licitacoes.filter(l => Number(l.id) !== novoId)];
    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);

    salvarLicitacaoNuvem(itemCriado).catch(err => {
      console.warn('Erro ao salvar nova licitação no Firestore:', err);
    });

    setLicitacaoSelecionadaId(novoId);
    setAbaAtiva('montar');
    mostrarToast(`Licitação "${novaLic.orgao}" criada com sucesso! Proposta limpa pronta para inserção de itens.`);
    return novoId;
  };

  const handleAtualizarPlataformaLicitacao = (licId: number, novaPlat: 'BLL' | 'BNC') => {
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));
    if (!licAtual) return;

    const licModificada: Licitacao = {
      ...licAtual,
      plataforma: novaPlat,
      updatedAt: new Date().toISOString(),
    };
    const licsAtualizadas = licitacoes.map(l => (Number(l.id) === Number(licId) ? licModificada : l));

    setLicitacoes(licsAtualizadas);
    salvarLicitacoes(licsAtualizadas);

    salvarLicitacaoNuvem(licModificada).catch(err => {
      console.warn('Aviso ao atualizar plataforma na nuvem:', err);
    });
    mostrarToast(`Plataforma alterada para ${novaPlat}!`, 'sucesso');
  };

  // Gerenciamento de Itens
  const handleAdicionarItem = (novoItem: Omit<ItemLicitacao, 'id'>) => {
    const maiorIdExistente = itens.length > 0 ? Math.max(...itens.map(i => Number(i.id) || 0)) : 0;
    const novoId = Math.max(Date.now(), maiorIdExistente + 1);
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
    salvarItemNuvem(itemCriado).catch(err => {
      console.warn('Aviso ao enviar item para o Firestore:', err);
    });

    mostrarToast(`Item #${novoItem.num_item} adicionado à proposta.`);
  };

  const handleAlternarSelecaoItem = (itemId: number) => {
    const listaAtualizada = itens.map(i => {
      if (Number(i.id) === Number(itemId)) {
        const itemModificado = { ...i, selecionado: i.selecionado === false ? true : false };
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
        return { ...i, selecionado: selecionarTodos };
      }
      return i;
    });
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    const itensDestaLic = listaAtualizada.filter(i => Number(i.licitacao_id) === Number(licId));
    salvarTodosItensNuvem(itensDestaLic).catch(() => {});
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
    salvarItemNuvem(itemNormalizado).catch(err => {
      console.warn('Aviso ao enviar item atualizado para o Firestore:', err);
    });

    mostrarToast(`Item #${itemNormalizado.num_item} atualizado.`);
  };

  // Forçar salvamento completo da proposta e catálogo direto no Firestore
  const handleForcarSalvarProposta = async (licId: number): Promise<boolean> => {
    const itensDestaLic = itens.filter(i => Number(i.licitacao_id) === Number(licId));
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));

    try {
      if (itensDestaLic.length > 0) {
        await salvarTodosItensNuvem(itensDestaLic);
      }
      if (licAtual) {
        await salvarLicitacaoNuvem(licAtual);
      }
      salvarItens(itens);
      mostrarToast(`✓ Proposta e Catálogo salvos direto no Firebase! ${itensDestaLic.length} itens sincronizados em tempo real.`);
      return true;
    } catch (err) {
      console.warn('Erro ao salvar proposta no Firestore:', err);
      mostrarToast('Erro ao salvar proposta no Firebase.', 'erro');
      return false;
    }
  };

  const handleExcluirItem = async (itemId: number) => {
    const listaAtualizada = itens.filter(i => Number(i.id) !== Number(itemId));
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    try {
      await removerItemNuvem(itemId);
      mostrarToast('Item excluído da proposta.');
    } catch (err) {
      console.warn('Erro ao excluir item no Firestore:', err);
      mostrarToast('Erro ao excluir item no Firestore.', 'erro');
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
          temaNatal={temaNatal}
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative">
      {/* Efeito sutil de neve suave natalina (cobre toda a tela sem interferir em cliques) */}
      <EfeitoNeve ativo={temaNatal} densidade="baixa" modoEscuro={tema === 'dark'} />

      {/* Barra de navegação do topo (Logo, Nuvem, Tema, Natal, Calcular e Sair) */}
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
        temaNatal={temaNatal}
        onAlternarTemaNatal={handleAlternarTemaNatal}
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

      {/* Modal Console CMD de Configurações & Administração (Altera Data de Cadastro, ID, Órgão e executa comandos) */}
      <ModalConsoleCmd
        aberto={consoleCmdAberto}
        onFechar={() => setConsoleCmdAberto(false)}
        licitacoes={licitacoes}
        onAtualizarDataCadastro={handleAtualizarDataCadastro}
        onTrocarIdLicitacao={handleTrocarIdLicitacao}
        onTrocarOrgaoLicitacao={handleTrocarOrgaoLicitacao}
        onTrocarProcessoLicitacao={handleTrocarProcessoLicitacao}
        onDesfazerTrocaId={handleDesfazerTrocaId}
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
          onAbrirConsoleCmd={() => {
            setConsoleCmdAberto(true);
            setSidebarAberta(false);
          }}
          abertaMobile={sidebarAberta}
          onFecharMobile={() => setSidebarAberta(false)}
          statusNuvem={statusNuvem}
          temaNatal={temaNatal}
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
            onAtualizarDataCadastro={handleAtualizarDataCadastro}
            onAbrirConsoleCmd={() => setConsoleCmdAberto(true)}
            onAtualizarPlataforma={handleAtualizarPlataformaLicitacao}
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
            temaNatal={temaNatal}
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

          {/* Mensagem especial de Boas Festas & Natal GWS GLOBAL */}
          {temaNatal && (
            <div className="pt-2 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 font-semibold text-xs shadow-2xs">
                <span>🎄</span>
                <span>A GWS GLOBAL deseja a você e à sua família um Feliz Natal e um Próspero Ano Novo! 🎅✨</span>
              </div>
            </div>
          )}

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
