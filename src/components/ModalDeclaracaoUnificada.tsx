import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  FileDown,
  Eye,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
  Loader2,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  ChevronDown,
  Info,
  MapPin,
} from 'lucide-react';
import { Licitacao, PapelTimbradoConfig } from '../types';
import {
  DadosDeclaracaoUnificada,
  gerarDeclaracaoUnificadaPdf,
  baixarBlobDeclaracao,
} from '../utils/declaracaoUnificadaPdf';
import { LogoGwsGlobal } from './LogoGwsGlobal';

interface ModalDeclaracaoUnificadaProps {
  aberto: boolean;
  onFechar: () => void;
  licitacoes: Licitacao[];
  licitacaoInicial?: Licitacao | null;
  timbrado: PapelTimbradoConfig;
}

const CLAUSULAS_LEGAIS = [
  {
    num: '1)',
    texto:
      'para fins do disposto no inciso VI do art. 68 da Lei nº 14.133/21, que não emprega menor de dezoito anos em trabalho noturno, perigoso ou insalubre e não emprega menor de dezesseis anos, salvo, a partir de 14 anos, na condição de aprendiz, encontrando-se em situação regular no que se refere à observância do disposto no inciso XXXIII do artigo 7º da Constituição Federal;',
  },
  {
    num: '2)',
    texto:
      'que, até a presente data, inexistem fatos impeditivos para a sua habilitação no presente processo administrativo, inclusive condenação judicial na proibição de contratar com o Poder Público ou receber benefícios ou incentivos fiscais ou creditícios, transitada em julgado ou não desafiada por recurso com efeito suspensivo, por ato de improbidade administrativa, estando ciente da obrigatoriedade de declarar ocorrências posteriores;',
  },
  {
    num: '3)',
    texto:
      'que não se encontra declarada inidônea, nem suspensa ou impedida de licitar e contratar com a Administração Pública, inclusive nos termos do artigo 20, inciso I, alínea “a” e artigo 90, ambos da Lei Orgânica Municipal;',
  },
  {
    num: '4)',
    texto:
      'que sua proposta econômica compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas.',
  },
  {
    num: '5)',
    texto:
      'que cumpre as exigências de reserva de cargos para pessoa com deficiência e para reabilitado da Previdência Social, nos termos do art. 63, inc. IV da Lei nº 14.133/21;',
  },
  {
    num: '6)',
    texto:
      'que observou e atende plenamente aos requisitos previstos aos parágrafos §1º, §2º, §3º do art. 4º da Lei nº 14.133/21 (aplicável a ME/EPP);',
  },
  {
    num: '7)',
    texto:
      'Que cumpre os requisitos estabelecidos no art. 3º da Lei Complementar nº 123, de 2006, estando apto a usufruir do tratamento estabelecido em seus arts. 42 a 49 (aplicável a ME/EPP).',
  },
];

function formatarDataPorExtensoPt(dataStr?: string, cidade = 'Timóteo - MG'): string {
  let d = new Date();
  if (dataStr) {
    if (dataStr.includes('-')) {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
      }
    } else if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        d = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
      }
    }
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const mes = meses[d.getMonth()];
  const ano = d.getFullYear();
  const cidadeLimpa = cidade.replace(/,\s*em\s*$/, '').trim();
  return `${cidadeLimpa}, em ${dia} de ${mes} de ${ano}.`;
}

export const ModalDeclaracaoUnificada: React.FC<ModalDeclaracaoUnificadaProps> = ({
  aberto,
  onFechar,
  licitacoes,
  licitacaoInicial,
  timbrado,
}) => {
  const [licitacaoVinculadaId, setLicitacaoVinculadaId] = useState<number | ''>('');
  const [dataEmissao, setDataEmissao] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Campos preenchidos automaticamente com base na licitação
  const [modalidade, setModalidade] = useState<string>('PREGÃO ELETRÔNICO');
  const [processoEdital, setProcessoEdital] = useState<string>('');
  const [orgaoPublico, setOrgaoPublico] = useState<string>('');
  const [cidadeEmissao, setCidadeEmissao] = useState<string>(
    timbrado.cidadeEmissao || 'Timóteo - MG'
  );

  // Painel opcional recolhido para ajuste manual caso o usuário queira
  const [mostrarAjusteManual, setMostrarAjusteManual] = useState<boolean>(false);
  const [mostrarPrevia, setMostrarPrevia] = useState<boolean>(true);

  const [gerando, setGerando] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Dados da empresa vindos do timbrado
  const razaoSocial = timbrado.razaoSocial || 'GWS Global Ltda';
  const cnpj = timbrado.cnpj || '53.080.207/0001-80';
  const inscricaoEstadual = timbrado.inscricaoEstadual || '47724530033';
  const endereco = timbrado.endereco || 'Rua Alpercata, nº 261, Bairro Ana Malaquias';
  const cidade = timbrado.cidadeEmissao || 'Timóteo - MG';
  const cep = '35182-183';
  const telefone = timbrado.telefone || '(31) 98694-9588 - (31) 99924-0111';
  const email = timbrado.email || 'gwsgloballimitada@gmail.com';

  const nomeRep1 = timbrado.nomeRepresentante || 'Representante Legal';
  const cpfRep1 = timbrado.cpfRepresentante || '';
  const cargoRep1 = timbrado.cargoRepresentante || 'Representante Legal';

  const nomeRep2 = timbrado.nomeRepresentante2?.trim() || '';
  const cpfRep2 = timbrado.cpfRepresentante2?.trim() || '';
  const cargoRep2 = timbrado.cargoRepresentante2 || 'Representante Legal';

  const temDoisRepresentantes = Boolean(nomeRep2 && (timbrado.assinaturaImagem2 || timbrado.nomeRepresentante2));

  // Função para preencher automaticamente os dados da licitação
  const preencherComLicitacao = (lic: Licitacao) => {
    let mod = lic.modalidade ? lic.modalidade.toUpperCase() : 'PREGÃO ELETRÔNICO';
    setModalidade(mod);

    let edital = (lic.processo_pregao || '').trim();
    if (
      edital &&
      !edital.toUpperCase().startsWith('Nº') &&
      !edital.toUpperCase().startsWith('NO ') &&
      !edital.toUpperCase().startsWith('N.º') &&
      !edital.toUpperCase().startsWith('N°')
    ) {
      edital = `Nº ${edital}`;
    }
    setProcessoEdital(edital || 'Nº EDITAL');
    setOrgaoPublico(lic.orgao ? lic.orgao.toUpperCase() : '');
  };

  // Quando o modal abre ou a licitação inicial muda
  useEffect(() => {
    if (!aberto) return;

    setDataEmissao(new Date().toISOString().split('T')[0]);
    setCidadeEmissao(timbrado.cidadeEmissao || 'Timóteo - MG');

    if (licitacaoInicial) {
      setLicitacaoVinculadaId(licitacaoInicial.id);
      preencherComLicitacao(licitacaoInicial);
    } else if (licitacoes.length > 0) {
      const primeira = licitacoes[0];
      setLicitacaoVinculadaId(primeira.id);
      preencherComLicitacao(primeira);
    } else {
      setLicitacaoVinculadaId('');
      setModalidade('PREGÃO ELETRÔNICO');
      setProcessoEdital('Nº 26-2026');
      setOrgaoPublico('MUNICÍPIO DE MOREIRA SALES-PR');
    }
  }, [aberto, licitacaoInicial, licitacoes, timbrado]);

  const handleSelecionarLicitacao = (idStr: string) => {
    if (!idStr) {
      setLicitacaoVinculadaId('');
      return;
    }
    const id = Number(idStr);
    setLicitacaoVinculadaId(id);
    const lic = licitacoes.find(l => l.id === id);
    if (lic) {
      preencherComLicitacao(lic);
    }
  };

  const obterDadosPreenchidos = (): DadosDeclaracaoUnificada => {
    return {
      modalidade: modalidade.trim() || 'PREGÃO ELETRÔNICO',
      processoEdital: processoEdital.trim() || 'Nº 26-2026',
      orgaoPublico: orgaoPublico.trim() || 'ÓRGÃO PÚBLICO',
      dataEmissao,
      cidadeEmissao: cidadeEmissao.trim() || timbrado.cidadeEmissao || 'Timóteo - MG',
    };
  };

  const handleBaixarPdf = async () => {
    try {
      setGerando(true);
      const dados = obterDadosPreenchidos();
      const blob = await gerarDeclaracaoUnificadaPdf(dados, timbrado);

      const editalSanitizado = dados.processoEdital.replace(/[/\\?%*:|"<>]/g, '_');
      const orgaoSanitizado = dados.orgaoPublico.substring(0, 30).replace(/[/\\?%*:|"<>]/g, '_');
      const nomeArquivo = `Declaracao_Unificada_${editalSanitizado}_${orgaoSanitizado}.pdf`;

      baixarBlobDeclaracao(blob, nomeArquivo);
      setFeedback('Declaração Unificada gerada e baixada com sucesso!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao gerar Declaração Unificada:', err);
      alert('Houve um erro ao gerar o PDF. Verifique os dados e tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const dataPorExtenso = useMemo(() => {
    return formatarDataPorExtensoPt(dataEmissao, cidadeEmissao);
  }, [dataEmissao, cidadeEmissao]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="bg-[#0A1D37] border-b border-[#152B4D] px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Declaração Unificada Oficial
                </h3>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Lei 14.133/21
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Emissão completa com as 7 cláusulas legais, dados do edital e assinaturas digitais Serpro.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback flutuante de sucesso */}
        {feedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Corpo do Modal com Rolagem */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
          {/* BARRA DE CONTROLE: VINCULAR LICITAÇÃO E DATA */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Seletor de Licitação */}
              <div className="md:col-span-7">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Licitação Vinculada:
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    Puxa dados automático
                  </span>
                </label>
                {licitacoes.length > 0 ? (
                  <select
                    value={licitacaoVinculadaId}
                    onChange={e => handleSelecionarLicitacao(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] cursor-pointer"
                  >
                    {licitacoes.map(lic => (
                      <option key={lic.id} value={lic.id}>
                        #{lic.id} — {lic.processo_pregao} • {lic.orgao} ({lic.modalidade})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg border border-slate-200">
                    Nenhuma licitação cadastrada ainda.
                  </div>
                )}
              </div>

              {/* Data de Emissão */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Data de Emissão:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dataEmissao}
                    onChange={e => setDataEmissao(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setDataEmissao(new Date().toISOString().split('T')[0])}
                    className="px-2 py-2 text-[11px] font-semibold text-[#0F2C59] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Definir para hoje"
                  >
                    Hoje
                  </button>
                </div>
              </div>

              {/* Botão Baixar Direto */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleBaixarPdf}
                  disabled={gerando}
                  className="w-full px-3 py-2 text-xs font-bold text-white bg-[#0F2C59] hover:bg-[#163c78] active:bg-[#021B3A] rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {gerando ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Baixar PDF</span>
                </button>
              </div>
            </div>

            {/* Painel opcional recolhível de ajustes finos */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMostrarAjusteManual(prev => !prev)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Editar dados manuais do cabeçalho</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${
                    mostrarAjusteManual ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mostrarAjusteManual && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 animate-in fade-in duration-150 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Processo / Edital:
                    </label>
                    <input
                      type="text"
                      value={processoEdital}
                      onChange={e => setProcessoEdital(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Modalidade:
                    </label>
                    <input
                      type="text"
                      value={modalidade}
                      onChange={e => setModalidade(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold uppercase bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Órgão Promotor:
                    </label>
                    <input
                      type="text"
                      value={orgaoPublico}
                      onChange={e => setOrgaoPublico(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold uppercase bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BARRA DE STATUS DA PRÉVIA */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#0F2C59]" />
                Prévia Oficial do Documento (Folha A4):
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                Visualização 100% Segura
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMostrarPrevia(prev => !prev)}
              className="text-xs text-slate-600 hover:text-[#0F2C59] underline font-medium cursor-pointer"
            >
              {mostrarPrevia ? 'Ocultar Prévia' : 'Exibir Prévia'}
            </button>
          </div>

          {/* SIMULAÇÃO DE FOLHA A4 DA DECLARAÇÃO UNIFICADA (NÃO USA IFRAME, NUNCA BLOQUEIA) */}
          {mostrarPrevia && (
            <div className="bg-slate-200/80 p-3 sm:p-6 rounded-xl border border-slate-300 shadow-inner flex justify-center overflow-x-auto">
              <div
                className="bg-white border-2 border-slate-300 rounded-sm shadow-xl p-8 sm:p-14 w-full max-w-[820px] text-slate-900 relative space-y-6 manter-branco"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
              >
                {/* Marca d'água central translúcida */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
                  <div className="w-80 h-80 rounded-full border-[18px] border-[#0F2C59] flex items-center justify-center">
                    <span className="text-4xl font-black text-[#0F2C59]">GWS Global</span>
                  </div>
                </div>

                {/* 1. CABEÇALHO DO TIMBRADO */}
                <div className="relative pb-4 border-b border-slate-200">
                  {timbrado.cabecalhoImagem && timbrado.cabecalhoImagem.startsWith('data:image') ? (
                    <img
                      src={timbrado.cabecalhoImagem}
                      alt="Cabeçalho Timbrado"
                      className="w-full object-contain max-h-24 mb-2"
                    />
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div className="flex items-center gap-3 shrink-0">
                        <LogoGwsGlobal className="w-12 h-12" />
                        <div>
                          <div className="text-base font-black text-[#0F2C59] tracking-tight">
                            GWS GLOBAL.net
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            SOLUÇÕES EM LICITAÇÕES PÚBLICAS
                          </div>
                        </div>
                      </div>

                      <div className="text-center sm:text-right text-[11px] text-slate-600 leading-snug space-y-0.5">
                        <div>
                          <strong>Endereço:</strong> {endereco}, {cidade}, CEP: {cep}
                        </div>
                        <div>
                          <strong>CNPJ:</strong> {cnpj} • <strong>Insc. Est.:</strong> {inscricaoEstadual}
                        </div>
                        <div>
                          <strong>Contato:</strong> {telefone} • <strong>E-mail:</strong> {email}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. TÍTULO DO PROCESSO E ÓRGÃO PÚBLICO */}
                <div className="space-y-1 text-slate-950 font-bold">
                  <div className="text-sm tracking-wide">
                    {modalidade} {processoEdital}
                  </div>
                  <div className="text-sm tracking-wide">
                    {orgaoPublico || 'MUNICÍPIO DE MOREIRA SALES-PR'}
                  </div>
                </div>

                {/* 3. TÍTULO CENTRAL DA DECLARAÇÃO */}
                <div className="text-center py-1">
                  <h4 className="text-base font-black text-[#0F2C59] tracking-wider uppercase underline underline-offset-4">
                    DECLARAÇÃO UNIFICADA (LEI Nº 14.133/2021)
                  </h4>
                </div>

                {/* 4. PREÂMBULO DA DECLARAÇÃO */}
                <p className="text-xs text-justify leading-relaxed text-slate-800">
                  A empresa <strong>{razaoSocial}</strong>, situada na {endereco}, {cidade}, CEP: {cep}, inscrita no CNPJ sob o nº <strong>{cnpj}</strong>, através de seu representante legal devidamente constituído, <strong>DECLARA</strong> sob as penalidades cabíveis da legislação vigente, que:
                </p>

                {/* 5. OS 7 ITENS LEGAIS OFICIAIS */}
                <div className="space-y-3 text-xs text-justify leading-relaxed text-slate-800">
                  {CLAUSULAS_LEGAIS.map(clausula => (
                    <div key={clausula.num} className="flex items-start gap-2">
                      <span className="font-bold text-[#0F2C59] shrink-0 font-mono">
                        {clausula.num}
                      </span>
                      <span>{clausula.texto}</span>
                    </div>
                  ))}
                </div>

                {/* 6. DATAÇÃO E LOCALIDADE */}
                <div className="pt-2 text-xs font-semibold text-slate-900">
                  {dataPorExtenso}
                </div>

                {/* 7. BLOCO DE ASSINATURA(S) CONFIGURADA(S) NO PAPEL TIMBRADO */}
                <div className="pt-6">
                  {temDoisRepresentantes ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto text-center">
                      {/* 1º Representante */}
                      <div className="flex flex-col items-center">
                        <div className="h-18 flex items-end justify-center mb-1">
                          {timbrado.assinaturaImagem ? (
                            <img
                              src={timbrado.assinaturaImagem}
                              alt={`Assinatura ${nomeRep1}`}
                              className="max-h-18 max-w-[220px] object-contain drop-shadow-2xs"
                            />
                          ) : (
                            <div className="h-10" />
                          )}
                        </div>
                        <div className="w-full max-w-[260px] border-t border-slate-900 pt-1.5">
                          <p className="font-bold text-slate-900 text-xs uppercase">{razaoSocial}</p>
                          <p className="text-slate-800 text-[11px] font-semibold">{nomeRep1}</p>
                          <p className="text-slate-600 text-[10px] font-mono">
                            {cargoRep1} • CPF: {cpfRep1}
                          </p>
                        </div>
                      </div>

                      {/* 2º Representante */}
                      <div className="flex flex-col items-center">
                        <div className="h-18 flex items-end justify-center mb-1">
                          {timbrado.assinaturaImagem2 ? (
                            <img
                              src={timbrado.assinaturaImagem2}
                              alt={`Assinatura ${nomeRep2}`}
                              className="max-h-18 max-w-[220px] object-contain drop-shadow-2xs"
                            />
                          ) : (
                            <div className="h-10" />
                          )}
                        </div>
                        <div className="w-full max-w-[260px] border-t border-slate-900 pt-1.5">
                          <p className="font-bold text-slate-900 text-xs uppercase">{razaoSocial}</p>
                          <p className="text-slate-800 text-[11px] font-semibold">{nomeRep2}</p>
                          <p className="text-slate-600 text-[10px] font-mono">
                            {cargoRep2} • CPF: {cpfRep2}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center">
                      <div className="h-20 flex items-end justify-center mb-1">
                        {timbrado.assinaturaImagem ? (
                          <img
                            src={timbrado.assinaturaImagem}
                            alt={`Assinatura ${nomeRep1}`}
                            className="max-h-20 max-w-[280px] object-contain drop-shadow-2xs"
                          />
                        ) : (
                          <div className="h-10" />
                        )}
                      </div>
                      <div className="inline-block border-t border-slate-900 pt-1.5 px-12">
                        <p className="font-bold text-slate-900 text-xs uppercase">{razaoSocial}</p>
                        <p className="text-slate-800 text-[11px] font-semibold">{nomeRep1}</p>
                        <p className="text-slate-600 text-[10px] font-mono">
                          {cargoRep1} • CPF: {cpfRep1}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleBaixarPdf}
              disabled={gerando}
              className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-[#0F2C59] hover:bg-[#163c78] active:bg-[#021B3A] rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {gerando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-amber-400" />
                  <span>Baixar Declaração Oficial em PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
