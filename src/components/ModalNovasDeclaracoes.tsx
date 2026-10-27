import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  FileText,
  FileDown,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Info,
  SlidersHorizontal,
  CheckCircle2,
  Scale,
  Award,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Licitacao, PapelTimbradoConfig } from '../types';
import {
  TipoNovaDeclaracao,
  DadosNovaDeclaracao,
  obterConfigDeclaracao,
  construirTextoDeclaracao,
  gerarNovaDeclaracaoPdf,
  baixarBlobDeclaracao,
  formatarDataPorExtensoPt,
} from '../utils/novasDeclaracoesPdf';
import { LogoGwsGlobal } from './LogoGwsGlobal';

interface ModalNovasDeclaracoesProps {
  aberto: boolean;
  onFechar: () => void;
  tipoInicial?: TipoNovaDeclaracao;
  licitacoes: Licitacao[];
  licitacaoInicial?: Licitacao | null;
  timbrado: PapelTimbradoConfig;
}

const ABAS_DECLARACOES: {
  tipo: TipoNovaDeclaracao;
  label: string;
  badge: string;
  icone: React.ElementType;
}[] = [
  {
    tipo: 'me_epp',
    label: 'Enquadramento ME/EPP',
    badge: 'LC 123/06',
    icone: Award,
  },
  {
    tipo: 'habilitacao',
    label: 'Cumprimento de Habilitação',
    badge: 'Requisitos',
    icone: ShieldCheck,
  },
  {
    tipo: 'fatos_impeditivos',
    label: 'Inexistência Fatos Impeditivos',
    badge: 'Supervenientes',
    icone: Scale,
  },
  {
    tipo: 'trabalho_infantil',
    label: 'Não Emprego de Menor',
    badge: 'CF Art. 7º XXXIII',
    icone: Users,
  },
];

export const ModalNovasDeclaracoes: React.FC<ModalNovasDeclaracoesProps> = ({
  aberto,
  onFechar,
  tipoInicial = 'me_epp',
  licitacoes,
  licitacaoInicial,
  timbrado,
}) => {
  const [tipoAtivo, setTipoAtivo] = useState<TipoNovaDeclaracao>(tipoInicial);
  const [licitacaoVinculadaId, setLicitacaoVinculadaId] = useState<number | ''>('');
  const [modalidade, setModalidade] = useState<string>('PREGÃO ELETRÔNICO');
  const [processoEdital, setProcessoEdital] = useState<string>('');
  const [orgaoPublico, setOrgaoPublico] = useState<string>('');
  const [dataEmissao, setDataEmissao] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [cidadeEmissao, setCidadeEmissao] = useState<string>(
    timbrado.cidadeEmissao || 'TIMOTEO - MG'
  );

  // Específicos para Não Emprego de Menor
  const [numeroAnexo, setNumeroAnexo] = useState<string>('ANEXO VIII');
  const [ressalvaAprendiz, setRessalvaAprendiz] = useState<boolean>(true); // Padrão conforme imagem modelo

  // Qualificação do representante
  const [estadoCivil, setEstadoCivil] = useState<string>('solteiro');
  const [profissao, setProfissao] = useState<string>('empresário');
  const [orgaoExpedidorRg, setOrgaoExpedidorRg] = useState<string>('PC MG');

  // Ajustes avançados e estados de UI
  const [mostrarAjusteManual, setMostrarAjusteManual] = useState<boolean>(false);
  const [textoEditado, setTextoEditado] = useState<string>('');
  const [modoEdicaoLivre, setModoEdicaoLivre] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Atualiza tipo ativo quando tipoInicial mudar externamente
  useEffect(() => {
    if (tipoInicial) {
      setTipoAtivo(tipoInicial);
    }
  }, [tipoInicial, aberto]);

  // Carrega licitação inicial ou a primeira disponível
  useEffect(() => {
    if (!aberto) return;

    const lic =
      licitacaoInicial ||
      (licitacoes.length > 0 ? licitacoes[0] : null);

    if (lic) {
      setLicitacaoVinculadaId(Number(lic.id));
      preencherComLicitacao(lic);
    } else {
      setLicitacaoVinculadaId('');
      setModalidade('PREGÃO ELETRÔNICO');
      setProcessoEdital('');
      setOrgaoPublico('');
    }
  }, [aberto, licitacaoInicial, licitacoes]);

  // Função para sincronizar campos com uma licitação selecionada
  const preencherComLicitacao = (lic: Licitacao) => {
    const mod = lic.modalidade?.trim() || 'PREGÃO ELETRÔNICO';
    setModalidade(mod);

    const numEdital = lic.processo_pregao || '';
    setProcessoEdital(numEdital);

    const orgao = lic.orgao || '';
    setOrgaoPublico(orgao);
  };

  // Ao trocar de licitação no select
  const handleSelecionarLicitacao = (idStr: string) => {
    if (!idStr) {
      setLicitacaoVinculadaId('');
      return;
    }
    const numId = Number(idStr);
    setLicitacaoVinculadaId(numId);
    const lic = licitacoes.find(l => Number(l.id) === numId);
    if (lic) {
      preencherComLicitacao(lic);
    }
  };

  // Dados compilados para o gerador
  const dadosDeclaracao: DadosNovaDeclaracao = useMemo(() => {
    return {
      tipo: tipoAtivo,
      modalidade,
      processoEdital,
      orgaoPublico,
      dataEmissao,
      cidadeEmissao,
      numeroAnexo,
      ressalvaAprendiz,
      estadoCivil,
      profissao,
      orgaoExpedidorRg,
      textoPersonalizado: modoEdicaoLivre && textoEditado.trim() ? textoEditado : undefined,
    };
  }, [
    tipoAtivo,
    modalidade,
    processoEdital,
    orgaoPublico,
    dataEmissao,
    cidadeEmissao,
    numeroAnexo,
    ressalvaAprendiz,
    estadoCivil,
    profissao,
    orgaoExpedidorRg,
    modoEdicaoLivre,
    textoEditado,
  ]);

  const configAtiva = useMemo(() => obterConfigDeclaracao(tipoAtivo), [tipoAtivo]);
  const textoCompilado = useMemo(
    () => construirTextoDeclaracao(tipoAtivo, dadosDeclaracao, timbrado),
    [tipoAtivo, dadosDeclaracao, timbrado]
  );

  // Inicializa o texto livre caso o usuário queira editar
  useEffect(() => {
    if (!modoEdicaoLivre) {
      setTextoEditado(textoCompilado.paragrafos.join('\n\n'));
    }
  }, [tipoAtivo, modoEdicaoLivre, textoCompilado]);

  if (!aberto) return null;

  // Handler para baixar o PDF
  const handleBaixarPdf = async () => {
    try {
      setGerandoPdf(true);
      setFeedback('Gerando documento em alta definição...');
      const blob = await gerarNovaDeclaracaoPdf(dadosDeclaracao, timbrado);
      const sanitizado = configAtiva.nomeMenu.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const editalSanit = processoEdital ? `_${processoEdital.replace(/[^a-z0-9]/gi, '_')}` : '';
      const nomeArquivo = `${sanitizado}${editalSanit}_GWS_GLOBAL.pdf`;
      baixarBlobDeclaracao(blob, nomeArquivo);
      setFeedback('PDF gerado e baixado com sucesso!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Erro ao gerar PDF da declaração:', err);
      setFeedback('Erro ao gerar PDF. Verifique os dados e tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  // Handler para imprimir diretamente a Folha A4
  const handleImprimir = () => {
    window.print();
  };

  // Handler para copiar o texto
  const handleCopiarTexto = () => {
    const titulo = configAtiva.tituloDoc;
    const corpo = modoEdicaoLivre && textoEditado.trim() ? textoEditado : textoCompilado.paragrafos.join('\n\n');
    const ressalva = textoCompilado.ressalvaTexto ? `\n\n${textoCompilado.ressalvaTexto}` : '';
    const dataExtenso = formatarDataPorExtensoPt(dataEmissao, cidadeEmissao);
    const rep = timbrado.nomeRepresentante || 'Gustavo Henrique Severino Pinto';

    const textoCompleto = `${titulo}\n\n${orgaoPublico ? `Órgão: ${orgaoPublico}\n` : ''}${
      processoEdital ? `Processo/Edital: ${modalidade} ${processoEdital}\n` : ''
    }\n${corpo}${ressalva}\n\n${dataExtenso}\n\n${rep}\n${timbrado.razaoSocial || 'GWS GLOBAL LIMITADA'}`;

    navigator.clipboard.writeText(textoCompleto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const dataPorExtenso = formatarDataPorExtensoPt(dataEmissao, cidadeEmissao);

  return (
    <div className="fixed inset-0 z-50 bg-[#071326]/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B172E] text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-white to-blue-50/30 dark:from-[#0E1F3D] dark:via-[#0B172E] dark:to-[#0A162B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  Declarações Oficiais da Empresa
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 shrink-0">
                  Papel Timbrado Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Emissão conforme exigências editalícias, com timbre, dados do promotor e assinaturas cadastradas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas das 4 Declarações Solicitadas */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#091326] shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ABAS_DECLARACOES.map(item => {
              const Icone = item.icone;
              const ativa = tipoAtivo === item.tipo;
              return (
                <button
                  key={item.tipo}
                  type="button"
                  onClick={() => setTipoAtivo(item.tipo)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    ativa
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/30 font-semibold'
                      : 'bg-white dark:bg-[#0E1F3D]/80 hover:bg-slate-100 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icone
                    className={`w-4 h-4 shrink-0 ${
                      ativa ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate font-bold leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        ativa ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback flutuante / informativo */}
        {feedback && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{feedback}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Corpo: Painel de Parâmetros à esquerda e Pré-visualização da Folha A4 à direita */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Parâmetros do Processo & Edição (4 colunas) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Bloco 1: Vinculação com Licitação / Edital */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0D1C38] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Vincular com Licitação Salva</span>
                </div>
                <span className="text-[10px] text-slate-400">Preenchimento automático</span>
              </div>

              <select
                value={licitacaoVinculadaId}
                onChange={e => handleSelecionarLicitacao(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Preenchimento Manual Livre --</option>
                {licitacoes.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.processo_pregao || 'Processo s/n'} • {l.orgao || 'Órgão s/n'}
                  </option>
                ))}
              </select>
            </div>

            {/* Bloco 2: Dados do Promotor e Processo (solicitados pelo usuário) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1F3D]/60 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Dados do Edital & Promotor</span>
                <span className="text-[10px] font-normal lowercase text-blue-600 dark:text-blue-400">
                  aparece no cabeçalho e texto
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Órgão / Prefeitura / Promotor da Licitação
                  </label>
                  <input
                    type="text"
                    value={orgaoPublico}
                    onChange={e => setOrgaoPublico(e.target.value)}
                    placeholder="Ex: PREFEITURA MUNICIPAL DE MOREIRA SALES - PR"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Modalidade
                    </label>
                    <input
                      type="text"
                      value={modalidade}
                      onChange={e => setModalidade(e.target.value)}
                      placeholder="PREGÃO ELETRÔNICO"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Número do Edital / Processo
                    </label>
                    <input
                      type="text"
                      value={processoEdital}
                      onChange={e => setProcessoEdital(e.target.value)}
                      placeholder="Nº 26/2026"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Data da Declaração
                    </label>
                    <input
                      type="date"
                      value={dataEmissao}
                      onChange={e => setDataEmissao(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Cidade e UF
                    </label>
                    <input
                      type="text"
                      value={cidadeEmissao}
                      onChange={e => setCidadeEmissao(e.target.value)}
                      placeholder="TIMOTEO - MG"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Opções específicas de Não Emprego de Menor */}
            {tipoAtivo === 'trabalho_infantil' && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Opções de Menor Aprendiz & Anexo</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Título do Anexo no Topo
                    </label>
                    <input
                      type="text"
                      value={numeroAnexo}
                      onChange={e => setNumeroAnexo(e.target.value)}
                      placeholder="Ex: ANEXO VIII"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={ressalvaAprendiz}
                      onChange={e => setRessalvaAprendiz(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Assinalar ressalva de Menor Aprendiz com ( X )
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Marca a cláusula &quot;emprega menor, a partir de quatorze anos, na condição de aprendiz&quot;
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Bloco 4: Sanfona de Ajuste Manual de Qualificação */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarAjusteManual(prev => !prev)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-[#0E1F3D]/80 hover:bg-slate-100 dark:hover:bg-[#132A52] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Personalizar Qualificação & Texto Livre</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mostrarAjusteManual ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mostrarAjusteManual && (
                <div className="p-4 space-y-3 bg-white dark:bg-[#091326] border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Estado Civil
                      </label>
                      <input
                        type="text"
                        value={estadoCivil}
                        onChange={e => setEstadoCivil(e.target.value)}
                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Profissão
                      </label>
                      <input
                        type="text"
                        value={profissao}
                        onChange={e => setProfissao(e.target.value)}
                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Órgão RG
                      </label>
                      <input
                        type="text"
                        value={orgaoExpedidorRg}
                        onChange={e => setOrgaoExpedidorRg(e.target.value)}
                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Edição Direta do Texto Legal:
                      </label>
                      <label className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modoEdicaoLivre}
                          onChange={e => setModoEdicaoLivre(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span>Habilitar edição livre</span>
                      </label>
                    </div>

                    {modoEdicaoLivre ? (
                      <textarea
                        rows={6}
                        value={textoEditado}
                        onChange={e => setTextoEditado(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#081224] text-slate-800 dark:text-slate-200 leading-relaxed font-mono"
                      />
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        O texto legal é gerado de acordo com as imagens de referência dos anexos. Marque &quot;Habilitar edição livre&quot; caso precise alterar alguma cláusula específica.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ações Rápidas na coluna lateral */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleBaixarPdf}
                disabled={gerandoPdf}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                <span>{gerandoPdf ? 'Gerando Documento...' : 'Gerar e Baixar PDF Oficial'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleImprimir}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1F3D] hover:bg-slate-50 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Imprimir Folha</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1F3D] hover:bg-slate-50 dark:hover:bg-[#132A52] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiado ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Folha A4 Realística (7 colunas) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-2 px-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Pré-visualização da Folha A4 Timbrada
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Padrão A4 • Papel Timbrado Oficial
              </span>
            </div>

            {/* Container da Folha A4 com proporção e sombra realistas */}
            <div className="w-full overflow-x-auto pb-4 flex justify-center">
              <div
                ref={printRef}
                className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-[20mm] relative flex flex-col justify-between font-sans border border-slate-200 select-text"
                style={{
                  boxSizing: 'border-box',
                }}
              >
                {/* Marca d'água no centro da folha */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none z-0"
                  aria-hidden="true"
                >
                  <div className="w-72 h-72 rounded-full border-[10px] border-[#0F2C59] flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-[#0F2C59]">GWS</span>
                    <span className="text-xl font-bold tracking-widest text-[#0F2C59] mt-1">
                      GLOBAL
                    </span>
                  </div>
                </div>

                {/* Topo da Folha: Cabeçalho Timbrado */}
                <div className="relative z-10">
                  {timbrado.cabecalhoImagem && timbrado.cabecalhoImagem.startsWith('data:image') ? (
                    <div className="w-full mb-6">
                      <img
                        src={timbrado.cabecalhoImagem}
                        alt="Cabeçalho Timbrado"
                        className="w-full object-contain max-h-[35mm]"
                      />
                    </div>
                  ) : (
                    <div className="border-b border-slate-300 pb-4 mb-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <LogoGwsGlobal className="w-14 h-14" />
                        <div>
                          <div className="text-sm font-black text-[#0F2C59] uppercase tracking-wide">
                            {timbrado.razaoSocial || 'GWS GLOBAL LIMITADA'}
                          </div>
                          <div className="text-[11px] text-slate-600 font-mono">
                            CNPJ: {timbrado.cnpj || '53.080.207/0001-80'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {timbrado.endereco || 'Rua Alpercata, Nº 261, Ana Malaquias'} •{' '}
                            {timbrado.cidadeEmissao || 'TIMOTEO - MG'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-medium">
                        <div>{timbrado.telefone || '(31) 98694-9588'}</div>
                        <div>{timbrado.email || 'gwsgloballimitada@gmail.com'}</div>
                      </div>
                    </div>
                  )}

                  {/* Identificação de Processo / Promotor (Pedido do Usuário) */}
                  {(orgaoPublico || processoEdital) && (
                    <div className="mb-6 p-2.5 rounded border border-slate-200 bg-slate-50/70 text-xs text-slate-800">
                      {processoEdital && (
                        <div className="font-bold text-[#0F2C59] text-xs">
                          {modalidade} {processoEdital.toUpperCase().startsWith('N') ? processoEdital : `Nº ${processoEdital}`}
                        </div>
                      )}
                      {orgaoPublico && (
                        <div className="font-bold text-slate-700 text-[11px] mt-0.5">
                          ÓRGÃO / PROMOTOR: {orgaoPublico.toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Anexo se houver (como Anexo VIII) */}
                  {textoCompilado.anexoCabecalho && (
                    <div className="text-center font-bold text-sm tracking-wider text-black mb-3">
                      {textoCompilado.anexoCabecalho.toUpperCase()}
                    </div>
                  )}

                  {/* Título Oficial da Declaração */}
                  <div className="text-center font-black text-sm sm:text-base uppercase text-black mb-6 tracking-tight leading-snug px-4">
                    {configAtiva.tituloDoc}
                  </div>

                  {/* Corpo Textual da Declaração */}
                  <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-justify text-slate-900">
                    {(modoEdicaoLivre && textoEditado.trim()
                      ? textoEditado.split('\n\n')
                      : textoCompilado.paragrafos
                    ).map((p, idx) => (
                      <p key={idx} className="indent-8 font-serif leading-relaxed">
                        {p}
                      </p>
                    ))}

                    {/* Bloco de Ressalva para Menor Aprendiz */}
                    {textoCompilado.ressalvaTexto && (
                      <div className="pt-3 font-serif pl-8 space-y-1">
                        <div className="font-bold text-slate-900 text-xs">
                          Ressalva: emprega menor, a partir de quatorze anos, na condição de aprendiz ( {ressalvaAprendiz ? 'X' : '   '} )
                        </div>
                        <div className="text-[11px] text-slate-600 italic">
                          (assinalar com &quot;x&quot; a ressalva acima, caso verdadeira)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Base da Folha: Local, Data e Assinaturas */}
                <div className="relative z-10 mt-12 pt-4">
                  {/* Local e Datação */}
                  <div className="text-xs font-serif text-slate-900 mb-8 pl-8">
                    {tipoAtivo === 'trabalho_infantil' ? '(Local e data) ' : ''}
                    {dataPorExtenso}
                  </div>

                  {/* Bloco de Assinatura Oficial com a Imagem configurada */}
                  <div className="flex flex-col items-center justify-center text-center">
                    {timbrado.assinaturaImagem && timbrado.assinaturaImagem.startsWith('data:image') ? (
                      <div className="h-16 flex items-end justify-center mb-1">
                        <img
                          src={timbrado.assinaturaImagem}
                          alt="Assinatura"
                          className="max-h-16 max-w-[200px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-12" />
                    )}

                    <div className="w-72 border-t border-slate-900 pt-1.5">
                      <div className="text-xs font-bold text-slate-900 uppercase">
                        {timbrado.nomeRepresentante || 'Gustavo Henrique Severino Pinto'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-sans">
                        CPF: {timbrado.cpfRepresentante || '020.313.066-93'} •{' '}
                        {(timbrado.cargoRepresentante || 'Representante Legal').toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                        {timbrado.razaoSocial || 'GWS GLOBAL LIMITADA'}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Oficial */}
                  <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                    {timbrado.rodapeImagem && timbrado.rodapeImagem.startsWith('data:image') ? (
                      <img
                        src={timbrado.rodapeImagem}
                        alt="Rodapé Timbrado"
                        className="w-full object-contain max-h-[18mm]"
                      />
                    ) : (
                      <span>
                        Documento emitido eletronicamente via Sistema GWS GLOBAL • CNPJ{' '}
                        {timbrado.cnpj || '53.080.207/0001-80'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
