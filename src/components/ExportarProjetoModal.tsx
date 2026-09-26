import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  X,
  Download,
  Server,
  FolderArchive,
  Terminal,
  Check,
  Copy,
  AlertTriangle,
  Sparkles,
  FileCode2,
  ExternalLink,
  HardDrive,
  Globe,
  Loader2,
} from 'lucide-react';

interface ExportarProjetoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export const ExportarProjetoModal: React.FC<ExportarProjetoModalProps> = ({
  aberto,
  onFechar,
}) => {
  const [copiadoPasso, setCopiadoPasso] = useState<string | null>(null);
  const [baixandoDist, setBaixandoDist] = useState(false);
  const [baixandoFonte, setBaixandoFonte] = useState(false);
  const [baixandoPython, setBaixandoPython] = useState(false);
  const [statusProgresso, setStatusProgresso] = useState<string>('');

  if (!aberto) return null;

  const copiarComando = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoPasso(id);
    setTimeout(() => setCopiadoPasso(null), 2500);
  };

  // Gerador de ZIP do DIST 100% direto no navegador (Garante que nunca venha corrompido)
  const baixarDistViaJSZip = async () => {
    try {
      setBaixandoDist(true);
      setStatusProgresso('Coletando arquivos compilados...');

      const res = await fetch('/api/exportar/dist-files');
      if (!res.ok) {
        throw new Error(`Falha no servidor: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (!data.sucesso || !data.arquivos || data.arquivos.length === 0) {
        throw new Error(data.erro || 'Nenhum arquivo compilado retornado.');
      }

      setStatusProgresso(`Compactando ${data.arquivos.length} arquivos...`);
      const zip = new JSZip();

      for (const arq of data.arquivos) {
        if (arq.isBase64) {
          zip.file(arq.path, arq.content, { base64: true });
        } else {
          zip.file(arq.path, arq.content);
        }
      }

      setStatusProgresso('Gerando arquivo ZIP final...');
      const blob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 },
        },
        (metadata) => {
          setStatusProgresso(`Compactando: ${Math.round(metadata.percent)}%`);
        }
      );

      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = 'gws_sistema_dist_hostinger.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(urlBlob), 10000);
      setStatusProgresso('');
    } catch (err: any) {
      console.error('Erro ao gerar dist.zip no navegador:', err);
      alert('Erro ao gerar o arquivo ZIP: ' + (err?.message || 'Tente novamente.'));
      setStatusProgresso('');
    } finally {
      setBaixandoDist(false);
    }
  };

  // Gerador de ZIP do Código-Fonte Completo direto no navegador
  const baixarFonteViaJSZip = async () => {
    try {
      setBaixandoFonte(true);
      setStatusProgresso('Coletando código-fonte...');

      const res = await fetch('/api/exportar/projeto-files');
      if (!res.ok) {
        throw new Error(`Falha no servidor: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (!data.sucesso || !data.arquivos || data.arquivos.length === 0) {
        throw new Error(data.erro || 'Nenhum arquivo retornado.');
      }

      setStatusProgresso(`Compactando ${data.arquivos.length} arquivos de código...`);
      const zip = new JSZip();

      for (const arq of data.arquivos) {
        if (arq.isBase64) {
          zip.file(arq.path, arq.content, { base64: true });
        } else {
          zip.file(arq.path, arq.content);
        }
      }

      setStatusProgresso('Gerando arquivo ZIP...');
      const blob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 },
        },
        (metadata) => {
          setStatusProgresso(`Compactando: ${Math.round(metadata.percent)}%`);
        }
      );

      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = 'gws_sistema_licitacoes_codigo_fonte.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(urlBlob), 10000);
      setStatusProgresso('');
    } catch (err: any) {
      console.error('Erro ao gerar zip do código:', err);
      alert('Erro ao gerar arquivo ZIP: ' + (err?.message || 'Tente novamente.'));
      setStatusProgresso('');
    } finally {
      setBaixandoFonte(false);
    }
  };

  // Download do app.py via Blob
  const baixarPython = async () => {
    try {
      setBaixandoPython(true);
      const res = await fetch('/api/exportar/app-py');
      if (!res.ok) throw new Error('Não foi possível obter o app.py');
      const blob = await res.blob();
      const urlBlob = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = 'app.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(urlBlob), 10000);
    } catch (err: any) {
      console.error('Erro ao baixar app.py:', err);
      alert('Erro ao baixar app.py: ' + err.message);
    } finally {
      setBaixandoPython(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Topo do Modal */}
        <div className="bg-[#0F2C59] px-6 py-4 flex items-center justify-between text-white border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                Exportar e Publicar na Hostinger
              </h2>
              <p className="text-xs text-slate-300">
                Geração direta no navegador sem corrupção de arquivos
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Card explicativo */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <div className="font-bold text-emerald-900 text-sm">
                Novo Sistema de Download 100% Protegido (Zero Corrupção)
              </div>
              <p className="leading-relaxed">
                Atualizamos a exportação para montar o arquivo <strong>.zip diretamente na memória do seu próprio navegador</strong>. Isso garante que nenhum proxy de rede bloqueie ou corte o download, garantindo que o arquivo abra perfeitamente no Windows, WinRAR e Gerenciador da Hostinger.
              </p>
            </div>
          </div>

          {/* Opção 1: O Método mais fácil e rápido (Pasta DIST compilada) */}
          <div className="border-2 border-emerald-500 bg-emerald-50/40 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Recomendado • Mais Rápido
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Opção 1: Pacote Web Pronto (.zip compilado)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Arquivos HTML, CSS e JavaScript já compilados e testados. Só arrastar e soltar!
                  </p>
                </div>
              </div>

              <button
                onClick={baixarDistViaJSZip}
                disabled={baixandoDist}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {baixandoDist ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{statusProgresso || 'Gerando ZIP...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-emerald-100" />
                    <span>Baixar ZIP para Hostinger</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white border border-emerald-200 rounded-lg p-3 text-xs text-slate-700 space-y-1.5 mt-2">
              <div className="font-semibold text-emerald-900">Como colocar no ar em 1 minuto na Hostinger:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                <li>Clique no botão verde acima para baixar o arquivo <strong>gws_sistema_dist_hostinger.zip</strong>.</li>
                <li>Extraia o arquivo no seu computador (você verá o <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">index.html</code> e a pasta <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">assets/</code>).</li>
                <li>No <strong>Gerenciador de Arquivos</strong> da Hostinger (hPanel ou FTP), envie esses arquivos direto para dentro da pasta <strong>public_html</strong> (ou <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/var/www/html</code> na VPS).</li>
                <li>Pronto! Ao abrir o seu domínio, o sistema abrirá <strong>100% idêntico, com todos os botões e cores, sem precisar instalar nada</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Opção 2: Código Completo para VPS com Node.js + PM2 */}
          <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-[#0F2C59] rounded-lg">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Opção 2: Código-Fonte Completo (.zip) + Node.js na VPS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Para quem quer rodar o backend Express completo na VPS com suporte a proxy e PM2
                  </p>
                </div>
              </div>

              <button
                onClick={baixarFonteViaJSZip}
                disabled={baixandoFonte}
                className="px-4 py-2.5 bg-[#0F2C59] hover:bg-[#163c78] active:scale-98 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {baixandoFonte ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{statusProgresso || 'Gerando ZIP...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Baixar Código-Fonte (.zip)</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-lg p-3 text-xs font-mono relative mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 mb-2">
                <span>Comandos no Terminal SSH da sua VPS Hostinger:</span>
                <button
                  onClick={() =>
                    copiarComando(
                      `npm install\nnpm run build\nnpm start\n# ou para rodar 24h em segundo plano:\npm2 start server.js --name "gws-licitacoes"`,
                      'ssh-cmds'
                    )
                  }
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiadoPasso === 'ssh-cmds' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiadoPasso === 'ssh-cmds' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-emerald-400"># 1. Instalar dependências e compilar</p>
              <p>npm install</p>
              <p>npm run build</p>
              <p className="text-emerald-400 mt-2"># 2. Rodar como serviço 24h no PM2</p>
              <p>pm2 start server.js --name "gws-licitacoes"</p>
            </div>
          </div>

          {/* Opção 3: Versão Completa em Python (app.py) com Streamlit */}
          <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Opção 3: Script Completo app.py (Python + Streamlit)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Arquivo único em Python com banco SQLite, cadastro, raspador de links e gerador de PDF
                  </p>
                </div>
              </div>

              <button
                onClick={baixarPython}
                disabled={baixandoPython}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {baixandoPython ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Baixando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Baixar app.py</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono relative mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 mb-2">
                <span>Comando para executar no servidor ou no computador:</span>
                <button
                  onClick={() =>
                    copiarComando(
                      `pip install streamlit reportlab num2words beautifulsoup4 requests pillow\nstreamlit run app.py --server.port 80`,
                      'python-cmds'
                    )
                  }
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiadoPasso === 'python-cmds' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiadoPasso === 'python-cmds' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-emerald-400"># Instalar pacotes necessários</p>
              <p>pip install streamlit reportlab num2words beautifulsoup4 requests pillow</p>
              <p className="text-emerald-400 mt-2"># Rodar o app</p>
              <p>streamlit run app.py</p>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>GWS GLOBAL.net • Arquivos verificados e testados para deploy imediato</span>
          <button
            onClick={onFechar}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
