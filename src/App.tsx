/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HistoricoTab } from './components/HistoricoTab';
import { CadastrarLicitacaoTab } from './components/CadastrarLicitacaoTab';
import { MontarPropostaTab } from './components/MontarPropostaTab';
import { VisualizarPdfTab } from './components/VisualizarPdfTab';
import { PapelTimbradoTab } from './components/PapelTimbradoTab';
import { CalculadoraOfertaDrawer } from './components/CalculadoraOfertaDrawer';
import { LoginScreen } from './components/LoginScreen';
import { SegurancaModal } from './components/SegurancaModal';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig, AcessoConfig } from './types';
import {
  obterLicitacoes,
  salvarLicitacoes,
  obterItens,
  salvarItens,
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
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const [statusNuvem, setStatusNuvem] = useState<'conectando' | 'conectado' | 'desconectado'>('conectando');

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
  }, []);

  // Sincronização em tempo real totalmente automática com Firebase Firestore
  useEffect(() => {
    setStatusNuvem('conectado');

    // Sincroniza banco inicial na nuvem se estiver vazio
    const licsAtuais = obterLicitacoes();
    const itsAtuais = obterItens();
    const timbAtual = obterPapelTimbradoConfig();
    const respsAtuais = obterResponsaveis();
    sincronizarBancoInicialSeVazio(licsAtuais, itsAtuais, timbAtual, respsAtuais).catch(() => {});

    // Ativa ouvintes em tempo real para sincronização instantânea e automática entre computadores
    const unsubLics = ouvirLicitacoesNuvem(
      (licsNuvem) => {
        setStatusNuvem('conectado');
        setLicitacoes(licsNuvem);
        salvarLicitacoes(licsNuvem);
        setLicitacaoSelecionadaId(prev => {
          if (!licsNuvem || licsNuvem.length === 0) return null;
          if (prev && licsNuvem.some(l => l.id === prev)) return prev;
          return licsNuvem[0].id;
        });
      },
      (err) => {
        console.warn('Status nuvem: desconectado ou aviso ao escutar licitações', err);
        setStatusNuvem('desconectado');
      }
    );

    const unsubItens = ouvirItensNuvem(
      (itensNuvem) => {
        setItens(itensNuvem);
        salvarItens(itensNuvem);
      },
      (err) => {
        console.warn('Aviso ao escutar itens da nuvem', err);
      }
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
    salvarResponsaveisNuvem(novaLista).catch(() => {});

    // Reatribuir licitações vinculadas a esse nome
    const destino = transferirPara || novaLista[0] || 'Gustavo';
    let alteradas = 0;
    const licsAtualizadas = licitacoes.map(lic => {
      if ((lic.responsavel || '').toLowerCase() === nomeParaExcluir.toLowerCase()) {
        alteradas++;
        const licAtualizada = { ...lic, responsavel: destino };
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
    // Garante que o responsável também está na lista salva
    if (novoResponsavel && !responsaveis.includes(novoResponsavel)) {
      const novaLista = [...responsaveis, novoResponsavel];
      setResponsaveis(novaLista);
      salvarResponsaveis(novaLista);
      salvarResponsaveisNuvem(novaLista).catch(() => {});
    }
    const atualizadas = licitacoes.map(l => {
      if (l.id === id) {
        const atual = { ...l, responsavel: novoResponsavel };
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

  const handleCadastrarLicitacao = (novaLic: Omit<Licitacao, 'id'>) => {
    const novoId = (licitacoes.length > 0 ? Math.max(...licitacoes.map(l => l.id)) : 0) + 1;
    const dataPropostaInicial = novaLic.data_proposta || converterParaFormatoInputDate(novaLic.data_cadastro);
    const itemCriado: Licitacao = { ...novaLic, id: novoId, data_proposta: dataPropostaInicial };
    const listaAtualizada = [itemCriado, ...licitacoes];
    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);
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
    salvarItemNuvem(itemCriado).catch(err => {
      console.warn('Item salvo localmente, aviso ao enviar para a nuvem:', err);
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
        const itemModificado = { ...i, selecionado: selecionarTodos };
        salvarItemNuvem(itemModificado).catch(() => {});
        return itemModificado;
      }
      return i;
    });
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
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
    salvarItemNuvem(itemNormalizado).catch(err => {
      console.warn('Item atualizado localmente, aviso ao enviar para a nuvem:', err);
    });

    mostrarToast(`Item #${itemNormalizado.num_item} atualizado.`);
  };

  // Forçar salvamento completo de garantia da proposta e catálogo
  const handleForcarSalvarProposta = async (licId: number): Promise<boolean> => {
    const itensDestaLic = itens.filter(i => Number(i.licitacao_id) === Number(licId));
    // 1. Salva imediatamente em localStorage
    salvarItens(itens);
    const licAtual = licitacoes.find(l => Number(l.id) === Number(licId));
    if (licAtual) {
      salvarLicitacaoNuvem(licAtual).catch(() => {});
    }

    // 2. Gravação em lote forçada no Firestore
    try {
      if (itensDestaLic.length > 0) {
        await salvarTodosItensNuvem(itensDestaLic);
      }
      mostrarToast(`✓ Proposta e Catálogo salvos com sucesso! Todos os ${itensDestaLic.length} itens gravados.`);
      return true;
    } catch (err) {
      console.warn('Aviso ao sincronizar na nuvem, garantido no cache local:', err);
      mostrarToast(`Dados salvos com segurança no cache local (${itensDestaLic.length} itens).`);
      return false;
    }
  };

  const handleExcluirItem = async (itemId: number) => {
    const listaAtualizada = itens.filter(i => i.id !== itemId);
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barra de navegação do topo */}
      <Header
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        onAbrirCalculadora={() => setCalculadoraAberta(prev => !prev)}
        onAbrirSeguranca={() => setSegurancaModalAberto(true)}
        onLogout={handleLogout}
        statusNuvem={statusNuvem}
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

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {abaAtiva === 'historico' && (
          <HistoricoTab
            licitacoes={licitacoes}
            itens={itens}
            responsaveis={responsaveis}
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

      {/* Footer simples e limpo */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Gestão de Licitações & Gerador de Propostas Comerciais em PDF com Catálogo de Produtos
          </span>
          <span className="text-slate-400">
            Exportação em PDF • Papel Timbrado Dinâmico • ReportLab / WeasyPrint • SQLite • Streamlit
          </span>
        </div>
      </footer>
    </div>
  );
}
