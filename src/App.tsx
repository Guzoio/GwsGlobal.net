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
import { CodigoPythonTab } from './components/CodigoPythonTab';
import { CalculadoraOfertaDrawer } from './components/CalculadoraOfertaDrawer';
import { ExportarProjetoModal } from './components/ExportarProjetoModal';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig } from './types';
import {
  obterLicitacoes,
  salvarLicitacoes,
  obterItens,
  salvarItens,
  obterPapelTimbradoConfig,
  salvarPapelTimbradoConfig,
  obterResponsaveis,
  salvarResponsaveis,
} from './utils/storage';
import { gerarArquivoPdf, baixarBlobPdf } from './utils/pdfGenerator';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [itens, setItens] = useState<ItemLicitacao[]>([]);
  const [responsaveis, setResponsaveis] = useState<string[]>(() => obterResponsaveis());
  const [abaAtiva, setAbaAtiva] = useState<string>('historico');
  const [licitacaoSelecionadaId, setLicitacaoSelecionadaId] = useState<number>(1);
  const [timbradoConfig, setTimbradoConfig] = useState<PapelTimbradoConfig>(() =>
    obterPapelTimbradoConfig()
  );
  const [calculadoraAberta, setCalculadoraAberta] = useState<boolean>(false);
  const [exportarModalAberto, setExportarModalAberto] = useState<boolean>(false);
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  // Carrega dados iniciais do banco local
  useEffect(() => {
    const lics = obterLicitacoes();
    const its = obterItens();
    const timb = obterPapelTimbradoConfig();
    const resps = obterResponsaveis();
    setLicitacoes(lics);
    setItens(its);
    setTimbradoConfig(timb);
    setResponsaveis(resps);
    if (lics.length > 0) {
      setLicitacaoSelecionadaId(lics[0].id);
    }
  }, []);

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 3500);
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

    // Reatribuir licitações vinculadas a esse nome
    const destino = transferirPara || novaLista[0] || 'Gustavo';
    let alteradas = 0;
    const licsAtualizadas = licitacoes.map(lic => {
      if ((lic.responsavel || '').toLowerCase() === nomeParaExcluir.toLowerCase()) {
        alteradas++;
        return { ...lic, responsavel: destino };
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
    mostrarToast('Configurações de papel timbrado salvas com sucesso!');
  };

  // Gerenciamento de Licitações
  const handleAtualizarResponsavel = (id: number, novoResponsavel: string) => {
    // Garante que o responsável também está na lista salva
    if (novoResponsavel && !responsaveis.includes(novoResponsavel)) {
      const novaLista = [...responsaveis, novoResponsavel];
      setResponsaveis(novaLista);
      salvarResponsaveis(novaLista);
    }
    const atualizadas = licitacoes.map(l => (l.id === id ? { ...l, responsavel: novoResponsavel } : l));
    setLicitacoes(atualizadas);
    salvarLicitacoes(atualizadas);
    mostrarToast(`Responsável atualizado para "${novoResponsavel}".`);
  };

  const handleExcluirLicitacao = (id: number) => {
    const licsAtualizadas = licitacoes.filter(l => l.id !== id);
    const itensAtualizados = itens.filter(i => i.licitacao_id !== id);
    setLicitacoes(licsAtualizadas);
    setItens(itensAtualizados);
    salvarLicitacoes(licsAtualizadas);
    salvarItens(itensAtualizados);

    if (licitacaoSelecionadaId === id && licsAtualizadas.length > 0) {
      setLicitacaoSelecionadaId(licsAtualizadas[0].id);
    }
    mostrarToast('Licitação e seus itens excluídos com sucesso.');
  };

  const handleCadastrarLicitacao = (novaLic: Omit<Licitacao, 'id'>) => {
    const novoId = (licitacoes.length > 0 ? Math.max(...licitacoes.map(l => l.id)) : 0) + 1;
    const itemCriado: Licitacao = { ...novaLic, id: novoId };
    const listaAtualizada = [itemCriado, ...licitacoes];
    setLicitacoes(listaAtualizada);
    salvarLicitacoes(listaAtualizada);
    setLicitacaoSelecionadaId(novoId);
    setAbaAtiva('montar');
    mostrarToast(`Licitação #${novoId} cadastrada com sucesso! Adicione os itens da proposta.`);
  };

  // Gerenciamento de Itens
  const handleAdicionarItem = (novoItem: Omit<ItemLicitacao, 'id'>) => {
    const novoId = (itens.length > 0 ? Math.max(...itens.map(i => i.id)) : 0) + 1;
    // Quantidade estritamente inteira
    const qtdInteira = Math.max(1, Math.round(novoItem.quantidade));
    const itemCriado: ItemLicitacao = {
      ...novoItem,
      id: novoId,
      quantidade: qtdInteira,
      valor_total: qtdInteira * novoItem.valor_unitario,
      selecionado: novoItem.selecionado !== undefined ? novoItem.selecionado : true,
    };
    const listaAtualizada = [...itens, itemCriado];
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    mostrarToast(`Item #${novoItem.num_item} adicionado à proposta.`);
  };

  const handleAlternarSelecaoItem = (itemId: number) => {
    const listaAtualizada = itens.map(i =>
      i.id === itemId ? { ...i, selecionado: i.selecionado === false ? true : false } : i
    );
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
  };

  const handleAlternarTodosItens = (licId: number, selecionarTodos: boolean) => {
    const listaAtualizada = itens.map(i =>
      i.licitacao_id === licId ? { ...i, selecionado: selecionarTodos } : i
    );
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    mostrarToast(
      selecionarTodos
        ? 'Todos os itens foram marcados para o PDF.'
        : 'Todos os itens foram desmarcados do PDF.'
    );
  };

  const handleAtualizarItem = (itemAtualizado: ItemLicitacao) => {
    const listaAtualizada = itens.map(i => (i.id === itemAtualizado.id ? itemAtualizado : i));
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    mostrarToast(`Item #${itemAtualizado.num_item} atualizado.`);
  };

  const handleExcluirItem = (itemId: number) => {
    const listaAtualizada = itens.filter(i => i.id !== itemId);
    setItens(listaAtualizada);
    salvarItens(listaAtualizada);
    mostrarToast('Item excluído da proposta.');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barra de navegação do topo */}
      <Header
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        onAbrirCalculadora={() => setCalculadoraAberta(prev => !prev)}
        onAbrirExportar={() => setExportarModalAberto(true)}
      />

      {/* Painel lateral deslizante da Calculadora de Limite de Oferta */}
      <CalculadoraOfertaDrawer
        aberto={calculadoraAberta}
        onFechar={() => setCalculadoraAberta(false)}
      />

      {/* Modal de Exportação e Deploy na Hostinger */}
      <ExportarProjetoModal
        aberto={exportarModalAberto}
        onFechar={() => setExportarModalAberto(false)}
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
            onAbrirExportar={() => setExportarModalAberto(true)}
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
            onGerarPdf={handleGerarPdf}
            onVisualizarPdf={() => setAbaAtiva('preview')}
            onIrParaTimbrado={() => setAbaAtiva('timbrado')}
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
            onNovaLicitacao={() => setAbaAtiva('cadastrar')}
          />
        )}

        {abaAtiva === 'python' && <CodigoPythonTab />}
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
