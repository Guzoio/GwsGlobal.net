/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { Licitacao, ItemLicitacao, PapelTimbradoConfig, AcessoConfig } from './types';
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
  estaAutenticado,
  registrarLogin,
  deslogar,
} from './utils/storage';
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
} from './utils/serverSync';

export default function App() {
  const [autenticado, setAutenticado] = useState<boolean>(() => estaAutenticado());
  const [acessoConfig, setAcessoConfig] = useState<AcessoConfig>(() => obterAcessoConfig());
  const [segurancaModalAberto, setSegurancaModalAberto] = useState<boolean>(false);
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [itens, setItens] = useState<ItemLicitacao[]>([]);
  const [responsaveis, setResponsaveis] = useState<string[]>(() => obterResponsaveis());
  const [abaAtiva, setAbaAtiva] = useState<string>('historico');
  const [licitacaoSelecionadaId, setLicitacaoSelecionadaId] = useState<number | null>(null);
  const [timbradoConfig, setTimbradoConfig] = useState<PapelTimbradoConfig>(() =>
    obterPapelTimbradoConfig()
  );
  const [calculadoraAberta, setCalculadoraAberta] = useState<boolean>(false);
  const [sidebarAberta, setSidebarAberta] = useState<boolean>(false);
  const [modalDeclaracaoAberto, setModalDeclaracaoAberto] = useState<boolean>(false);
  const [licitacaoParaDeclaracao, setLicitacaoParaDeclaracao] = useState<Licitacao | null>(null);
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
    setLicitacoes(lics);
    setItens(its);
    setTimbradoConfig(timb);
    setResponsaveis(resps);
    setAcessoConfig(acesso);
    if (lics.length > 0) {
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
      if (payload.tipo === 'full') {
        if (payload.licitacoes && payload.licitacoes.length > 0) {
          setLicitacoes(payload.licitacoes);
          salvarLicitacoes(payload.licitacoes);
          setLicitacaoSelecionadaId(prev => {
            if (prev && payload.licitacoes?.some(l => l.id === prev)) return prev;
            return payload.licitacoes ? payload.licitacoes[0].id : null;
          });
        }
        if (payload.itens && payload.itens.length > 0) {
          setItens(payload.itens);
          salvarItens(payload.itens);
        }
        if (payload.timbrado) {
          setTimbradoConfig(payload.timbrado);
          salvarPapelTimbradoConfig(payload.timbrado);
        }
        if (payload.responsaveis && payload.responsaveis.length > 0) {
          setResponsaveis(payload.responsaveis);
          salvarResponsaveis(payload.responsaveis);
        }
      } else if (payload.tipo === 'licitacoes' && payload.licitacoes) {
        setLicitacoes(payload.licitacoes);
        salvarLicitacoes(payload.licitacoes);
      } else if (payload.tipo === 'itens' && payload.itens) {
        setItens(payload.itens);
        salvarItens(payload.itens);
      } else if (payload.tipo === 'timbrado' && payload.timbrado) {
        setTimbradoConfig(payload.timbrado);
        salvarPapelTimbradoConfig(payload.timbrado);
      } else if (payload.tipo === 'responsaveis' && payload.responsaveis) {
        setResponsaveis(payload.responsaveis);
        salvarResponsaveis(payload.responsaveis);
      }
    });

    // 3. Mescla dados locais com o servidor central (garante que dados criados em outro computador ou offline subam para todos)
    const licsLocais = obterLicitacoes();
    const itsLocais = obterItens();
    const timbLocal = obterPapelTimbradoConfig();
    const respsLocais = obterResponsaveis();

    mesclarEstadoComServidor({
      licitacoes: licsLocais,
      itens: itsLocais,
      timbrado: timbLocal,
      responsaveis: respsLocais,
    }).then((estado) => {
      if (estado) {
        if (estado.licitacoes && estado.licitacoes.length > 0) {
          setLicitacoes(estado.licitacoes);
          salvarLicitacoes(estado.licitacoes);
          setLicitacaoSelecionadaId(prev => {
            if (prev && estado.licitacoes.some(l => l.id === prev)) return prev;
            return estado.licitacoes[0].id;
          });
        }
        if (estado.itens && estado.itens.length > 0) {
          setItens(estado.itens);
          salvarItens(estado.itens);
        }
      }
    }).catch(() => {});

    // 4. Também sincroniza banco na nuvem Firebase caso haja cota disponível
    sincronizarBancoInicialSeVazio(licsLocais, itsLocais, timbLocal, respsLocais).catch(() => {});

    const unsubLics = ouvirLicitacoesNuvem(
      (licsNuvem) => {
        if (licsNuvem && licsNuvem.length > 0) {
          setStatusNuvem('conectado');
          setLicitacoes(prevLics => {
            const mapaPrev = new Map(prevLics.map(l => [l.id, l]));
            const mescladas = licsNuvem.map(nuv => {
              const prev = mapaPrev.get(nuv.id);
              return {
                ...nuv,
                acompanhamento: nuv.acompanhamento !== undefined ? Boolean(nuv.acompanhamento) : Boolean(prev?.acompanhamento),
                homologada: nuv.homologada !== undefined ? Boolean(nuv.homologada) : Boolean(prev?.homologada),
              };
            });
            salvarLicitacoes(mescladas);
            return mescladas;
          });
          setLicitacaoSelecionadaId(prev => {
            if (prev && licsNuvem.some(l => l.id === prev)) return prev;
            return licsNuvem[0].id;
          });
        }
      },
      () => {}
    );

    const unsubItens = ouvirItensNuvem(
      (itensNuvem) => {
        if (itensNuvem && itensNuvem.length > 0) {
          setItens(itensNuvem);
          salvarItens(itensNuvem);
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

    return () => {
      unsubServer();
      syncManager.stop();
      unsubLics();
      unsubItens();
      unsubTimbrado();
      unsubResponsaveis();
      unsubSeguranca();
    };
  }, []);

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
      if (l.id === id) {
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
    const licsAtualizadas = licitacoes.filter(l => l.id !== id);
    const itensAtualizados = itens.filter(i => i.licitacao_id !== id);
    setLicitacoes(licsAtualizadas);
    setItens(itensAtualizados);
    salvarLicitacoes(licsAtualizadas);
    salvarItens(itensAtualizados);

    removerLicitacaoServidor(id);

    if (licitacaoSelecionadaId === id) {
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
      if (l.id === licId) {
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

  // Alternar Status de Acompanhamento (👁 Olho Amarelo)
  const handleToggleAcompanhamento = (id: number) => {
    let licModificada: Licitacao | null = null;
    const listaAtualizada = licitacoes.map(l => {
      if (l.id === id) {
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
      if (l.id === id) {
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

  const handleCadastrarLicitacao = (novaLic: Omit<Licitacao, 'id'>) => {
    const novoId = (licitacoes.length > 0 ? Math.max(...licitacoes.map(l => l.id)) : 0) + 1;
    const dataPropostaInicial = novaLic.data_proposta || converterParaFormatoInputDate(novaLic.data_cadastro);
    const itemCriado: Licitacao = { ...novaLic, id: novoId, data_proposta: dataPropostaInicial };
    const listaAtualizada = [itemCriado, ...licitacoes];
    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);
    salvarLicitacaoServidor(itemCriado);
    salvarLicitacaoNuvem(itemCriado).catch(() => {});

    setLicitacaoSelecionadaId(novoId);
    setAbaAtiva('montar');
    mostrarToast(`Licitação #${novoId} cadastrada com sucesso! Adicione os itens da proposta.`);
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
    };
    const listaAtualizada = itens.map(i => (Number(i.id) === Number(itemNormalizado.id) ? itemNormalizado : i));
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
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
    const listaAtualizada = itens.filter(i => i.id !== itemId);
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
    const licAtual = licitacoes.find(l => l.id === licitacaoSelecionadaId) || licitacoes[0];
    if (!licAtual) {
      mostrarToast('Nenhuma licitação selecionada.', 'erro');
      return;
    }

    // Filtra estritamente os itens marcados no quadrinho (selecionado !== false)
    const itensDaLic = itens.filter(i => i.licitacao_id === licAtual.id && i.selecionado !== false);
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

  const licitacaoAtual = licitacoes.find(l => l.id === licitacaoSelecionadaId);
  const temItensNaLicAtual = itens.some(i => i.licitacao_id === licitacaoSelecionadaId);

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
        onAbrirCalculadora={() => setCalculadoraAberta(prev => !prev)}
        onLogout={handleLogout}
        statusNuvem={statusNuvem}
        tema={tema}
        onAlternarTema={handleAlternarTema}
      />

      {/* Painel lateral deslizante da Calculadora de Limite de Oferta */}
      <CalculadoraOfertaDrawer
        aberto={calculadoraAberta}
        onFechar={() => setCalculadoraAberta(false)}
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
          onAbrirDeclaracao={() => {
            const lic = licitacoes.find(l => l.id === licitacaoSelecionadaId) || licitacoes[0] || null;
            setLicitacaoParaDeclaracao(lic);
            setModalDeclaracaoAberto(true);
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
            onAbrirCalculadora={() => setCalculadoraAberta(true)}
            onAbrirDeclaracao={lic => {
              setLicitacaoParaDeclaracao(lic || null);
              setModalDeclaracaoAberto(true);
            }}
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
