import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  FileCheck2,
  PenTool,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Move,
  RefreshCw,
  Stamp,
  User,
  Building2,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  Eye,
  ArrowLeft,
  RotateCcw,
  FileUp,
} from 'lucide-react';
import { PapelTimbradoConfig } from '../types';
import {
  assinarPdf,
  extrairAssinaturasTimbrado,
  baixarBlobPdfBytes,
  AssinaturaItemConfig,
} from '../utils/pdfSigner';

// Importa PDF.js dinamicamente para renderização visual do canvas
import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do pdfjs-dist
if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface ModalAssinadorDocumentosProps {
  aberto: boolean;
  onFechar: () => void;
  timbrado: PapelTimbradoConfig;
}

export const ModalAssinadorDocumentos: React.FC<ModalAssinadorDocumentosProps> = ({
  aberto,
  onFechar,
  timbrado,
}) => {
  // Estado do Arquivo Carregado
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [carregandoPdf, setCarregandoPdf] = useState<boolean>(false);
  const [gerandoAssinatura, setGerandoAssinatura] = useState<boolean>(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  // Perfis de Assinatura disponíveis (do Papel Timbrado + avulsas)
  const perfisTimbrado = extrairAssinaturasTimbrado(timbrado);
  const [perfilSelecionadoId, setPerfilSelecionadoId] = useState<string>(
    perfisTimbrado.length > 0 ? perfisTimbrado[0].id : 'custom'
  );
  const [assinaturaCustomBase64, setAssinaturaCustomBase64] = useState<string>('');
  const [nomeCustom, setNomeCustom] = useState<string>(timbrado.nomeRepresentante || '');
  const [cpfCustom, setCpfCustom] = useState<string>(timbrado.cpfRepresentante || '');
  const [cargoCustom, setCargoCustom] = useState<string>(timbrado.cargoRepresentante || 'Representante Legal');

  // Opções do Carimbo / Assinatura
  const [incluirLinha, setIncluirLinha] = useState<boolean>(true);
  const [incluirDadosTexto, setIncluirDadosTexto] = useState<boolean>(true);
  const [incluirCarimboDigital, setIncluirCarimboDigital] = useState<boolean>(true);
  const [larguraPercent, setLarguraPercent] = useState<number>(36); // 36% da largura da página (ideal para ata)
  const [aplicarRubricaDemaisPaginas, setAplicarRubricaDemaisPaginas] = useState<boolean>(false);
  const [posicaoRubrica, setPosicaoRubrica] = useState<'inferior_direito' | 'inferior_esquerdo'>('inferior_direito');

  // Coordenadas interativas da assinatura na página (% do topo e da esquerda)
  const [posicaoXPercent, setPosicaoXPercent] = useState<number>(32); // Centro padrão
  const [posicaoYPercent, setPosicaoYPercent] = useState<number>(75); // Terço inferior padrão (linha de ata)

  // Zoom e Visualização
  const [zoomNivel, setZoomNivel] = useState<number>(1.0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [arrastando, setArrastando] = useState<boolean>(false);

  // Identifica assinatura ativa
  const assinaturaAtiva = (() => {
    if (perfilSelecionadoId === 'principal') {
      const p = perfisTimbrado.find(x => x.id === 'principal');
      if (p) return p;
    }
    if (perfilSelecionadoId === 'secundaria') {
      const p = perfisTimbrado.find(x => x.id === 'secundaria');
      if (p) return p;
    }
    // Custom ou fallback
    return {
      id: 'custom',
      rotulo: nomeCustom || 'Assinatura Avulsa',
      subtitulo: cargoCustom || 'Representante',
      imagemBase64: assinaturaCustomBase64 || timbrado.assinaturaImagem || '',
      nome: nomeCustom || timbrado.nomeRepresentante || '',
      cpf: cpfCustom || timbrado.cpfRepresentante || '',
      cargo: cargoCustom || timbrado.cargoRepresentante || 'Representante Legal',
      empresa: timbrado.razaoSocial || '',
      cnpj: timbrado.cnpj || '',
    };
  })();

  // Limpa o documento atual e volta para a tela de upload inicial
  const handleLimparDocumento = () => {
    setArquivoPdf(null);
    setPdfBytes(null);
    setPdfDocProxy(null);
    setTotalPaginas(1);
    setPaginaAtual(1);
    setErroMsg(null);
    setSucessoMsg(null);
  };

  // Trata upload de novo arquivo PDF
  const handleCarregarArquivo = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErroMsg('Por favor, selecione um arquivo em formato PDF.');
      return;
    }
    setCarregandoPdf(true);
    setErroMsg(null);
    setSucessoMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      // IMPORTANTE: Faz cópias independentes do buffer.
      // O PDF.js pode transferir e neutralizar (neuter/detach) o buffer enviado ao Web Worker!
      const pdfjsData = new Uint8Array(buffer.slice(0));
      const cleanBytes = new Uint8Array(buffer.slice(0));
      setPdfBytes(cleanBytes);
      setArquivoPdf(file);

      // Carrega no PDF.js com a cópia isolada
      const loadingTask = pdfjsLib.getDocument({ data: pdfjsData });
      const loadedDoc = await loadingTask.promise;
      setPdfDocProxy(loadedDoc);
      setTotalPaginas(loadedDoc.numPages);
      // Geralmente atas e contratos são assinados na última página!
      setPaginaAtual(loadedDoc.numPages);
      setPosicaoXPercent(32);
      setPosicaoYPercent(75);
    } catch (err: any) {
      console.error('Erro ao ler PDF:', err);
      setErroMsg('Falha ao abrir o documento PDF. Verifique se o arquivo não está corrompido.');
    } finally {
      setCarregandoPdf(false);
    }
  };

  // Renderiza página atual no canvas
  const renderizarPagina = useCallback(async () => {
    if (!pdfDocProxy || !canvasRef.current) return;
    try {
      const page = await pdfDocProxy.getPage(paginaAtual);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const baseViewport = page.getViewport({ scale: 1.0 });
      // Escala visual calculada pelo zoom
      const viewport = page.getViewport({ scale: zoomNivel * 1.5 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / 1.5}px`;
      canvas.style.height = `${viewport.height / 1.5}px`;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.warn('Erro ao renderizar página do PDF:', err);
    }
  }, [pdfDocProxy, paginaAtual, zoomNivel]);

  useEffect(() => {
    if (aberto && pdfDocProxy) {
      renderizarPagina();
    }
  }, [aberto, pdfDocProxy, paginaAtual, zoomNivel, renderizarPagina]);

  // Upload de assinatura avulsa
  const handleUploadAssinaturaAvulsa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAssinaturaCustomBase64(reader.result);
        setPerfilSelecionadoId('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  // Posicionamento por clique no documento
  const handleCliqueOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (arrastando) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Converte para percentual
    const pctX = Math.max(2, Math.min(98 - larguraPercent, (clickX / rect.width) * 100 - larguraPercent / 2));
    const pctY = Math.max(2, Math.min(95, (clickY / rect.height) * 100 - 5));

    setPosicaoXPercent(Math.round(pctX));
    setPosicaoYPercent(Math.round(pctY));
  };

  // Drag and drop do carimbo
  const handleMouseDownCarimbo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setArrastando(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPctX = posicaoXPercent;
    const initialPctY = posicaoYPercent;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const deltaPctX = (deltaX / rect.width) * 100;
      const deltaPctY = (deltaY / rect.height) * 100;

      const novoX = Math.max(1, Math.min(99 - larguraPercent, initialPctX + deltaPctX));
      const novoY = Math.max(1, Math.min(96, initialPctY + deltaPctY));

      setPosicaoXPercent(Math.round(novoX));
      setPosicaoYPercent(Math.round(novoY));
    };

    const handleMouseUp = () => {
      setArrastando(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Presets de posicionamento rápido
  const aplicarPresetPosicao = (tipo: 'centro_ata' | 'direita' | 'esquerda' | 'rodape_centro') => {
    if (tipo === 'centro_ata') {
      setPosicaoXPercent(Math.round(50 - larguraPercent / 2));
      setPosicaoYPercent(75);
    } else if (tipo === 'direita') {
      setPosicaoXPercent(Math.max(5, 96 - larguraPercent));
      setPosicaoYPercent(78);
    } else if (tipo === 'esquerda') {
      setPosicaoXPercent(8);
      setPosicaoYPercent(78);
    } else if (tipo === 'rodape_centro') {
      setPosicaoXPercent(Math.round(50 - larguraPercent / 2));
      setPosicaoYPercent(86);
    }
  };

  // Executa o carimbo e download do PDF
  const handleAssinarEDownload = async () => {
    if (!pdfBytes || !arquivoPdf) {
      setErroMsg('Por favor, carregue um arquivo PDF primeiro.');
      return;
    }

    if (!assinaturaAtiva.imagemBase64) {
      setErroMsg('Nenhuma imagem de assinatura selecionada. Selecione um perfil ou carregue uma imagem.');
      return;
    }

    setGerandoAssinatura(true);
    setErroMsg(null);
    setSucessoMsg(null);

    try {
      // Sempre obtém buffer novo e intacto diretamente do arquivo File original
      let bytesParaAssinar: Uint8Array;
      if (arquivoPdf) {
        const freshBuffer = await arquivoPdf.arrayBuffer();
        bytesParaAssinar = new Uint8Array(freshBuffer);
      } else if (pdfBytes && pdfBytes.byteLength > 0) {
        bytesParaAssinar = new Uint8Array(pdfBytes.buffer.slice(0));
      } else {
        setErroMsg('Erro ao ler bytes do documento. Por favor, recarregue o arquivo PDF.');
        setGerandoAssinatura(false);
        return;
      }

      if (!bytesParaAssinar || bytesParaAssinar.byteLength === 0) {
        setErroMsg('O arquivo PDF está vazio (0 bytes). Selecione o documento novamente.');
        setGerandoAssinatura(false);
        return;
      }

      const configItem: AssinaturaItemConfig = {
        imagemBase64: assinaturaAtiva.imagemBase64,
        nome: assinaturaAtiva.nome,
        cpf: assinaturaAtiva.cpf,
        cargo: assinaturaAtiva.cargo,
        empresa: timbrado.razaoSocial || timbrado.nomeEmpresa,
        cnpj: timbrado.cnpj,
        incluirLinha,
        incluirDadosTexto,
        incluirCarimboDigital,
        dataHoraCarimbo: new Date().toLocaleString('pt-BR'),
        cidadeUf: timbrado.cidadeEmissao || 'Timóteo - MG',
      };

      const pdfAssinadoBytes = await assinarPdf({
        pdfBytes: bytesParaAssinar,
        paginaAlvo: paginaAtual,
        posicaoXPercent,
        posicaoYPercent,
        larguraPercent,
        assinatura: configItem,
        aplicarRubricaDemaisPaginas,
        posicaoRubrica,
        rubricaImagemBase64: assinaturaAtiva.imagemBase64,
      });

      // Dispara download
      baixarBlobPdfBytes(pdfAssinadoBytes, arquivoPdf.name);

      setSucessoMsg(`Documento "${arquivoPdf.name}" assinado e baixado com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao assinar PDF:', err);
      setErroMsg(err.message || 'Falha ao processar assinatura no documento.');
    } finally {
      setGerandoAssinatura(false);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[94vh] max-h-[960px] bg-white dark:bg-[#0A162B] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-[#0E1F3D]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Assinador de Documentos & Atas
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                  PDF Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Carregue o PDF recebido da prefeitura, posicione sua assinatura do Papel Timbrado e baixe assinado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {arquivoPdf && (
              <button
                type="button"
                onClick={handleLimparDocumento}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Voltar e escolher outro documento"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Outro Documento</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFechar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
              title="Cancelar e fechar"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>

        {/* Mensagens de Sucesso / Erro */}
        {sucessoMsg && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{sucessoMsg}</span>
            </div>
            <button
              onClick={() => setSucessoMsg(null)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

        {erroMsg && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{erroMsg}</span>
            </div>
            <button
              onClick={() => setErroMsg(null)}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Conteúdo: Se não tem PDF, exibe Dropzone de Upload */}
        {!pdfBytes ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-[#07101E]/50">
            <div className="max-w-lg w-full p-8 border-2 border-dashed border-blue-400/40 dark:border-blue-500/30 rounded-2xl bg-white/80 dark:bg-[#0E1F3D]/60 shadow-lg hover:border-blue-500 transition-all flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Selecione o Documento ou Ata (PDF)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 max-w-sm">
                Envie a Ata de Registro de Preços, Contrato Administrativo ou Notificação que precisa da sua assinatura.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md cursor-pointer transition-all active:scale-95">
                  <FileText className="w-4 h-4" />
                  <span>Escolher Arquivo PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleCarregarArquivo(f);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={onFechar}
                  className="px-4 py-3 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer transition-colors"
                >
                  Cancelar e Fechar
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10 w-full flex items-center justify-center gap-6 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Preserva o PDF Original
                </span>
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-500" />
                  Usa Assinatura Salva
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Se PDF carregado: Interface Dividida (Visualizador Interativo + Painel de Assinatura) */
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            
            {/* LADO ESQUERDO: Visualizador e Posicionador Interativo de Assinatura */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#060D19] border-r border-slate-200 dark:border-white/10">
              
              {/* Barra de Ferramentas do Visualizador */}
              <div className="px-4 py-2.5 bg-white dark:bg-[#0E1F3D] border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* Nome do Documento e Ações de Trocar/Voltar */}
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={handleLimparDocumento}
                    className="p-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                    title="Voltar e escolher outro documento"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-500" />
                    <span>Voltar</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 max-w-[180px] sm:max-w-[240px]">
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-xs" title={arquivoPdf?.name}>
                      {arquivoPdf?.name}
                    </span>
                  </div>

                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer shrink-0 transition-colors">
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Trocar PDF</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleCarregarArquivo(f);
                      }}
                    />
                  </label>
                </div>

                {/* Navegador de Páginas */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#071326] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual <= 1}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Página Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Página {paginaAtual} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual >= totalPaginas}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Próxima Página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {paginaAtual !== totalPaginas && (
                    <button
                      type="button"
                      onClick={() => setPaginaAtual(totalPaginas)}
                      className="ml-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 hover:bg-blue-500/25 cursor-pointer font-semibold"
                      title="Ir para a última página (onde ficam as assinaturas)"
                    >
                      Última pág.
                    </button>
                  )}
                </div>

                {/* Controles de Zoom */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomNivel(z => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-semibold w-12 text-center">
                    {Math.round(zoomNivel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomNivel(z => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomNivel(1.0)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-[10px] font-semibold cursor-pointer"
                    title="Zoom Padrão (100%)"
                  >
                    100%
                  </button>
                </div>
              </div>

              {/* Dica de Posicionamento */}
              <div className="px-4 py-1.5 bg-blue-50 dark:bg-[#0b1d3d] border-b border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    <strong>Clique no documento</strong> ou <strong>arraste a caixa pontilhada</strong> para posicionar a assinatura sobre a linha da Ata.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => aplicarPresetPosicao('centro_ata')}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-500/30 cursor-pointer"
                  >
                    Centro
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPresetPosicao('direita')}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-500/30 cursor-pointer"
                  >
                    Direita
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPresetPosicao('esquerda')}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-500/30 cursor-pointer"
                  >
                    Esquerda
                  </button>
                </div>
              </div>

              {/* Área de Visualização e Posicionamento (Canvas com Bounding Box Interativo) */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
                <div
                  ref={overlayRef}
                  onClick={handleCliqueOverlay}
                  className="relative shadow-2xl bg-white border border-slate-300 dark:border-slate-700 cursor-crosshair select-none transition-transform"
                >
                  {/* Canvas do PDF */}
                  <canvas ref={canvasRef} className="block" />

                  {/* Caixa de Assinatura Interativa (Estilo Selo de Ata) */}
                  <div
                    onMouseDown={handleMouseDownCarimbo}
                    style={{
                      left: `${posicaoXPercent}%`,
                      top: `${posicaoYPercent}%`,
                      width: `${larguraPercent}%`,
                    }}
                    className={`absolute z-20 cursor-move border-2 border-dashed ${
                      arrastando
                        ? 'border-blue-600 bg-blue-500/20 shadow-xl scale-102 ring-4 ring-blue-400/30'
                        : 'border-blue-500 bg-blue-500/10 hover:border-blue-600 hover:bg-blue-500/15'
                    } rounded-lg p-2.5 transition-all text-center group`}
                    title="Arraste para reposicionar a assinatura"
                  >
                    {/* Alça visual de arrasto */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm opacity-90 group-hover:opacity-100">
                      <Move className="w-2.5 h-2.5" />
                      Assinatura
                    </div>

                    {/* Imagem da Assinatura */}
                    {assinaturaAtiva.imagemBase64 ? (
                      <img
                        src={assinaturaAtiva.imagemBase64}
                        alt="Assinatura"
                        className="max-h-16 w-full object-contain mx-auto pointer-events-none drop-shadow-xs"
                      />
                    ) : (
                      <div className="h-12 flex items-center justify-center text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-300">
                        Nenhuma assinatura cadastrada
                      </div>
                    )}

                    {/* Linha de Assinatura */}
                    {incluirLinha && (
                      <div className="w-full border-t border-slate-700 dark:border-slate-800 my-1 pointer-events-none" />
                    )}

                    {/* Dados do Signatário */}
                    {incluirDadosTexto && (
                      <div className="space-y-0.5 text-slate-800 dark:text-slate-900 pointer-events-none">
                        <div className="text-[11px] font-bold leading-tight">
                          {assinaturaAtiva.nome || 'Nome do Representante'}
                        </div>
                        <div className="text-[9px] text-slate-600 leading-tight">
                          {[assinaturaAtiva.cargo, assinaturaAtiva.cpf ? `CPF: ${assinaturaAtiva.cpf}` : '']
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                        <div className="text-[8px] text-slate-500 leading-tight truncate">
                          {[timbrado.razaoSocial || timbrado.nomeEmpresa, timbrado.cnpj ? `CNPJ: ${timbrado.cnpj}` : '']
                            .filter(Boolean)
                            .join(' - ')}
                        </div>
                      </div>
                    )}

                    {/* Carimbo Digital */}
                    {incluirCarimboDigital && (
                      <div className="mt-1 pt-1 border-t border-blue-200 text-[8px] text-blue-700 font-mono font-semibold bg-blue-50/90 rounded px-1.5 py-0.5 pointer-events-none flex items-center justify-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                        <span className="truncate">
                          Assinado digitalmente • {timbrado.cidadeEmissao || 'Timóteo - MG'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: Painel de Configuração da Assinatura */}
            <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-[#0E1F3D] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 overflow-y-auto">
              <div className="p-5 space-y-6">
                
                {/* 1. Escolha do Perfil de Assinatura */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      1. Quem vai assinar?
                    </label>
                    <span className="text-[10px] text-slate-400">Papel Timbrado</span>
                  </div>

                  <div className="space-y-2">
                    {perfisTimbrado.map(perfil => {
                      const ativo = perfilSelecionadoId === perfil.id;
                      return (
                        <button
                          key={perfil.id}
                          type="button"
                          onClick={() => setPerfilSelecionadoId(perfil.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            ativo
                              ? 'bg-blue-50 dark:bg-[#132A52] border-blue-500 ring-2 ring-blue-500/20'
                              : 'bg-slate-50 dark:bg-[#071326] border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-12 h-10 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                            {perfil.imagemBase64 ? (
                              <img
                                src={perfil.imagemBase64}
                                alt={perfil.nome}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <PenTool className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {perfil.nome}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {perfil.cargo} {perfil.cpf ? `• CPF: ${perfil.cpf}` : ''}
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              ativo
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {ativo && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}

                    {/* Opção de Assinatura Avulsa / Upload na hora */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        perfilSelecionadoId === 'custom'
                          ? 'bg-blue-50 dark:bg-[#132A52] border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-[#071326] border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="perfil_assinatura"
                            checked={perfilSelecionadoId === 'custom'}
                            onChange={() => setPerfilSelecionadoId('custom')}
                            className="text-blue-600"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Outra Assinatura (Upload Avulso)
                          </span>
                        </label>
                        <label className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                          Carregar PNG
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={handleUploadAssinaturaAvulsa}
                          />
                        </label>
                      </div>

                      {perfilSelecionadoId === 'custom' && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                          {assinaturaCustomBase64 && (
                            <div className="h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center">
                              <img
                                src={assinaturaCustomBase64}
                                alt="Assinatura Customizada"
                                className="max-h-full object-contain"
                              />
                            </div>
                          )}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500">Nome do Signatário</label>
                            <input
                              type="text"
                              value={nomeCustom}
                              onChange={e => setNomeCustom(e.target.value)}
                              placeholder="Nome Completo"
                              className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A162B]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500">Cargo</label>
                              <input
                                type="text"
                                value={cargoCustom}
                                onChange={e => setCargoCustom(e.target.value)}
                                placeholder="Cargo"
                                className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A162B]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500">CPF</label>
                              <input
                                type="text"
                                value={cpfCustom}
                                onChange={e => setCpfCustom(e.target.value)}
                                placeholder="000.000.000-00"
                                className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A162B]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Ajuste de Tamanho / Largura */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-500" />
                      2. Tamanho da Assinatura
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {larguraPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="65"
                    step="1"
                    value={larguraPercent}
                    onChange={e => setLarguraPercent(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Compacta (18%)</span>
                    <span>Padrão Ata (36%)</span>
                    <span>Larga (65%)</span>
                  </div>
                </div>

                {/* 3. Opções Visuais do Selo */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
                    <Stamp className="w-3.5 h-3.5 text-blue-500" />
                    3. Detalhes da Assinatura
                  </label>

                  <div className="space-y-2 bg-slate-50 dark:bg-[#071326] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                    <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        Incluir Nome, Cargo e CNPJ
                      </span>
                      <input
                        type="checkbox"
                        checked={incluirDadosTexto}
                        onChange={e => setIncluirDadosTexto(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        Linha Superior de Assinatura
                      </span>
                      <input
                        type="checkbox"
                        checked={incluirLinha}
                        onChange={e => setIncluirLinha(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        Carimbo de Data e Hora Digital
                      </span>
                      <input
                        type="checkbox"
                        checked={incluirCarimboDigital}
                        onChange={e => setIncluirCarimboDigital(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Rúbrica nas Demais Páginas (Excelente para Atas) */}
                {totalPaginas > 1 && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      4. Rúbrica nas Outras Páginas
                    </label>

                    <div className="bg-slate-50 dark:bg-[#071326] p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                      <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                        <div>
                          <div className="text-slate-800 dark:text-slate-200 font-semibold">
                            Rubricar as outras {totalPaginas - 1} páginas
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Estampa rúbrica no rodapé das páginas 1 a {totalPaginas - 1}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={aplicarRubricaDemaisPaginas}
                          onChange={e => setAplicarRubricaDemaisPaginas(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      {aplicarRubricaDemaisPaginas && (
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-medium">Posição:</span>
                          <button
                            type="button"
                            onClick={() => setPosicaoRubrica('inferior_direito')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                              posicaoRubrica === 'inferior_direito'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Canto Direito
                          </button>
                          <button
                            type="button"
                            onClick={() => setPosicaoRubrica('inferior_esquerdo')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                              posicaoRubrica === 'inferior_esquerdo'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Canto Esquerdo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão de Ação Principal: Gerar e Baixar PDF Assinado */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAssinarEDownload}
                    disabled={gerandoAssinatura}
                    className="w-full group py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                  >
                    {gerandoAssinatura ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando Documento...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        <span>Gerar & Baixar PDF Assinado</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    A assinatura é carimbada na <strong>página {paginaAtual}</strong> exatamente nas coordenadas selecionadas.
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={handleLimparDocumento}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Voltar para tela de upload e escolher outro PDF"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                      <span>Trocar PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={onFechar}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Cancelar processo e fechar"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
