import React, { useState } from 'react';
import { FileDown, FileText, Building2, Printer, Sliders, Calendar, Clock, ShieldCheck, MapPin, Image as ImageIcon, FolderOpen, PlusCircle } from 'lucide-react';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig } from '../types';
import { formatarMoeda, valorPorExtensoPtBr, formatarDataExtensoPtBr } from '../utils/numberToWordsPtBr';
import { TIMBRADO_PADRAO } from '../utils/storage';
import { limparTextoDescricaoTecnica } from '../utils/sanitizarDescricao';

interface VisualizarPdfTabProps {
  licitacao: Licitacao | undefined;
  licitacoes: Licitacao[];
  licitacaoSelecionadaId: number | null;
  onSelecionarLicitacao: (id: number) => void;
  itens: ItemLicitacao[];
  timbrado: PapelTimbradoConfig;
  onGerarPdf: () => void;
  onIrParaTimbrado: () => void;
  onSalvarConfig?: (config: PapelTimbradoConfig) => void;
  onNovaLicitacao?: () => void;
}

export const VisualizarPdfTab: React.FC<VisualizarPdfTabProps> = ({
  licitacao,
  licitacoes,
  licitacaoSelecionadaId,
  onSelecionarLicitacao,
  itens,
  timbrado,
  onGerarPdf,
  onIrParaTimbrado,
  onSalvarConfig,
  onNovaLicitacao,
}) => {
  const [dataEmissaoLocal, setDataEmissaoLocal] = useState<string>(
    timbrado.dataEmissao || new Date().toISOString().split('T')[0]
  );
  const [cidadeLocal, setCidadeLocal] = useState<string>(
    timbrado.cidadeEmissao || 'Timóteo - MG'
  );

  const itensDaLic = licitacao
    ? itens.filter(i => i.licitacao_id === licitacao.id && i.selecionado !== false).sort((a, b) => a.num_item - b.num_item)
    : [];

  const totalGeral = itensDaLic.reduce((acc, it) => acc + (it.valor_total || it.quantidade * it.valor_unitario), 0);
  const totalFormatado = formatarMoeda(totalGeral);
  const extenso = valorPorExtensoPtBr(totalGeral);

  // Dados da GWS GLOBAL LIMITADA
  const razaoSocial = timbrado.razaoSocial || TIMBRADO_PADRAO.razaoSocial;
  const cnpj = timbrado.cnpj || TIMBRADO_PADRAO.cnpj;
  const inscricaoEstadual = timbrado.inscricaoEstadual || TIMBRADO_PADRAO.inscricaoEstadual;
  const endereco = timbrado.endereco || TIMBRADO_PADRAO.endereco;
  const telefone = timbrado.telefone || TIMBRADO_PADRAO.telefone;
  const email = timbrado.email || TIMBRADO_PADRAO.email;
  const banco = timbrado.banco || TIMBRADO_PADRAO.banco;
  const agencia = timbrado.agencia || TIMBRADO_PADRAO.agencia;
  const contaCorrente = timbrado.contaCorrente || TIMBRADO_PADRAO.contaCorrente;

  const nomeRep = timbrado.nomeRepresentante || TIMBRADO_PADRAO.nomeRepresentante;
  const rgRep = timbrado.rgRepresentante || TIMBRADO_PADRAO.rgRepresentante;
  const cpfRep = timbrado.cpfRepresentante || TIMBRADO_PADRAO.cpfRepresentante;
  const endRep = timbrado.enderecoRepresentante || TIMBRADO_PADRAO.enderecoRepresentante;

  const nomeRep2 = timbrado.nomeRepresentante2?.trim() || '';
  const rgRep2 = timbrado.rgRepresentante2?.trim() || '';
  const cpfRep2 = timbrado.cpfRepresentante2?.trim() || '';
  const endRep2 = timbrado.enderecoRepresentante2?.trim() || endereco;

  // Prazos, Declaração Trabalhista & Data de Emissão
  const prazoEntrega = timbrado.prazoEntrega || 'Conforme Aviso de Dispensa Eletrônica e Termo de Referência.';
  const prazoValidade = timbrado.prazoValidade || '90 Dias';
  const declaracaoTrab = timbrado.declaracaoTrabalhista || 'Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas.';

  const handleAlterarData = (novaData: string) => {
    setDataEmissaoLocal(novaData);
    if (onSalvarConfig) {
      onSalvarConfig({
        ...timbrado,
        dataEmissao: novaData,
      });
    }
  };

  const dataFormatadaTexto = formatarDataExtensoPtBr(dataEmissaoLocal, cidadeLocal);

  const renderDescricaoFormatada = (texto: string) => {
    const textoLimpo = limparTextoDescricaoTecnica(texto);
    if (!textoLimpo || !textoLimpo.trim()) return null;
    const textoNormalizado = textoLimpo.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const linhasRaw = textoNormalizado.split('\n');

    let splitLines: string[] = [];
    if (linhasRaw.length === 1 && (linhasRaw[0].includes(' • ') || linhasRaw[0].includes(' ; '))) {
      splitLines = linhasRaw[0].split(/\s+[•;]\s+/).map(s => s.trim()).filter(Boolean);
    } else {
      splitLines = linhasRaw;
    }

    const linhasValidas = splitLines.filter(l => l.trim().length > 0);
    const ehListaTopicos = linhasValidas.length > 1;

    return (
      <div className="space-y-2">
        {splitLines.map((linha, idx) => {
          const linhaTrim = linha.trim();
          if (!linhaTrim) {
            return <div key={idx} className="h-1.5" />;
          }

          const matchBullet = linhaTrim.match(/^([•\-\*–—\>]|\d+[\.\)])\s*(.*)$/);
          const ehTopico = !!matchBullet || ehListaTopicos || /^[^:]{2,30}:\s+/.test(linhaTrim);
          const textoSemMarcador = matchBullet ? matchBullet[2].trim() : linhaTrim;

          // Padrão Rótulo: Conteúdo
          const matchColon = textoSemMarcador.match(/^([^:]{2,30}:)\s*(.*)$/);

          return (
            <div key={idx} className="flex items-start gap-2.5 text-[12pt] text-slate-800 leading-relaxed font-sans">
              {ehTopico ? (
                matchBullet && /^\d+[\.\)]$/.test(matchBullet[1]) ? (
                  <span className="font-bold text-[#0F2C59] text-[12pt] shrink-0 font-mono mt-0.5">
                    {matchBullet[1]}
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#0F2C59] mt-2 shrink-0" />
                )
              ) : null}

              <div className="flex-1">
                {matchColon ? (
                  <>
                    <strong className="font-bold text-[#0F2C59] mr-1.5">{matchColon[1]}</strong>
                    <span className="text-slate-700">{matchColon[2]}</span>
                  </>
                ) : (
                  <span className="text-slate-700">{textoSemMarcador}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* QUADRINHO DE SELEÇÃO DE LICITAÇÃO SALVA */}
      <div className="bg-white border-2 border-[#0F2C59]/30 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F2C59] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FolderOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
                Selecionar Licitação Salva para Visualizar PDF
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                  {licitacoes.length} no histórico
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolha a licitação desejada para carregar a proposta completa com seus itens e catálogo correspondentes
              </p>
            </div>
          </div>

          {onNovaLicitacao && (
            <button
              onClick={onNovaLicitacao}
              className="text-xs font-semibold text-[#0F2C59] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
              Cadastrar Nova
            </button>
          )}
        </div>

        {licitacoes.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            Nenhuma licitação cadastrada ainda. Cadastre uma nova licitação para gerar propostas.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Licitação em Exibição:
              </label>
              <select
                value={licitacao?.id || ''}
                onChange={e => onSelecionarLicitacao(Number(e.target.value))}
                className="w-full bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-[#0F2C59] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-[#0F2C59]/20 transition-all cursor-pointer"
              >
                {licitacoes.map(lic => {
                  const countItens = itens.filter(i => i.licitacao_id === lic.id).length;
                  return (
                    <option key={lic.id} value={lic.id}>
                      #{lic.id} — {lic.processo_pregao} | {lic.orgao} ({lic.modalidade}) • [{countItens} produto(s)] • Resp: {lic.responsavel || 'Gustavo'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Detalhes Rápidos da Licitação Selecionada */}
            {licitacao && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Modalidade</span>
                  <span className="text-xs font-bold text-[#0F2C59] truncate block mt-0.5">{licitacao.modalidade}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Produtos no Anexo</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{itensDaLic.length} produto(s)</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Total Cotado</span>
                  <span className="text-xs font-bold text-emerald-700 block mt-0.5 font-mono">{totalFormatado}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Quem Fez (Resp.)</span>
                  <span className="text-xs font-bold text-[#0F2C59] block mt-0.5 truncate">
                    👤 {licitacao.responsavel || 'Gustavo'}
                  </span>
                </div>
              </div>
            )}

            {/* Alternância rápida entre processos salvos */}
            {licitacoes.length > 1 && (
              <div className="pt-1 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-medium shrink-0">Trocar rápido:</span>
                {licitacoes.map(lic => (
                  <button
                    key={lic.id}
                    onClick={() => onSelecionarLicitacao(lic.id)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      lic.id === licitacao?.id
                        ? 'bg-[#0F2C59] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{lic.id} {lic.processo_pregao}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!licitacao ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800">Nenhuma licitação selecionada</h3>
          <p className="text-xs text-slate-400 mt-1">Selecione uma licitação na caixa acima para visualizar a proposta.</p>
        </div>
      ) : (
        <>
          {/* Banner de Ações do Documento */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Documento Pronto para Emissão
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                {licitacao.modalidade} — {licitacao.processo_pregao}
              </h2>
              <p className="text-xs text-slate-500">
                {licitacao.orgao} • {itensDaLic.length} produto(s) cadastrado(s)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onIrParaTimbrado}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Configurar Timbrado
              </button>
              <button
                onClick={onGerarPdf}
                className="px-4 py-2 bg-[#0F2C59] hover:bg-[#163c78] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-amber-400" />
                GERAR E BAIXAR DOCUMENTO EM PDF
              </button>
            </div>
          </div>

          {/* Barra de Ajuste Rápido da Data de Emissão do Documento */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F2C59]" />
              <span className="font-semibold text-slate-800">Data da Emissão no Documento:</span>
              <input
                type="date"
                value={dataEmissaoLocal}
                onChange={e => handleAlterarData(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-mono text-xs font-semibold text-slate-900 cursor-pointer shadow-2xs"
              />
              <button
                onClick={() => handleAlterarData(new Date().toISOString().split('T')[0])}
                className="text-[11px] text-[#0F2C59] hover:underline font-semibold cursor-pointer"
              >
                Hoje
              </button>
            </div>

            <div className="text-slate-600 text-[11px] font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Extenso no PDF:</span>
              <span className="font-bold text-slate-900">{dataFormatadaTexto}</span>
            </div>
          </div>

          {/* Simulated A4 Page (Padrão Oficial: Arial Tamanho 12) */}
          <div
            className="bg-white border-2 border-slate-300 rounded-lg shadow-md overflow-hidden"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* CABEÇALHO GRÁFICO (se houver imagem) */}
            {timbrado.cabecalhoImagem && (
              <div className="px-8 pt-4 pb-2 border-b border-slate-100 flex justify-center bg-slate-50/50">
                <img
                  src={timbrado.cabecalhoImagem}
                  alt="Cabeçalho Timbrado"
                  className="max-h-24 object-contain"
                />
              </div>
            )}

            {/* PÁGINA 1: QUADRO INSTITUCIONAL, PROPOSTA COMERCIAL & ASSINATURA */}
            <div className="p-8 sm:p-12 space-y-5 text-slate-950">
              {/* Topo do Processo Dinâmico (Arial 12pt) */}
              <div>
                <p className="text-[12pt] text-slate-900 leading-tight">
                  {licitacao.modalidade} <span className="font-extrabold font-mono">{licitacao.processo_pregao}</span>
                </p>
                <p className="text-[12pt] text-slate-900 leading-tight mt-1.5">
                  Processo / Órgão: <span className="font-extrabold font-mono">{licitacao.orgao}</span>
                </p>
              </div>

              {/* TABELA COM BORDAS PRETAS IDÊNTICA À IMAGEM DO USUÁRIO */}
              <div className="border-t border-b border-black text-[10.5pt] divide-y divide-black">
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-36 uppercase tracking-tight">RAZÃO SOCIAL:</span>
                  <span className="font-bold text-black">{razaoSocial}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-36 uppercase tracking-tight">CNPJ:</span>
                  <span className="font-mono text-black">{cnpj}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-48 uppercase tracking-tight">INSCRIÇÃO ESTADUAL</span>
                  <span className="font-mono text-black">{inscricaoEstadual}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-36 uppercase tracking-tight">ENDEREÇO:</span>
                  <span className="text-black">{endereco}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-36 uppercase tracking-tight">TELEFONE:</span>
                  <span className="font-mono text-black">{telefone}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-36 uppercase tracking-tight">EMAIL:</span>
                  <span className="font-mono text-black lowercase">{email}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-36 uppercase tracking-tight">BANCO (NOME/Nº):</span>
                  <span className="text-black">{banco}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-36 uppercase tracking-tight">AGÊNCIA Nº:</span>
                  <span className="font-mono text-black">{agencia}</span>
                </div>
                <div className="py-1 px-1 flex">
                  <span className="font-bold text-black w-48 uppercase tracking-tight">CONTA CORRENTE Nº:</span>
                  <span className="font-mono text-black">{contaCorrente}</span>
                </div>
              </div>

              {/* TEXTO DE ABERTURA / QUALIFICAÇÃO DO REPRESENTANTE LEGAL (Arial 12pt) */}
              {nomeRep2 ? (
                <div className="text-[12pt] leading-relaxed text-black text-justify">
                  A empresa <span className="font-bold">{razaoSocial}</span>, inscrita no CNPJ sob o nº{' '}
                  <span className="font-mono">{cnpj}</span>, sediada na {endereco}, neste ato representada por seus representantes legais,{' '}
                  <span className="font-bold">{nomeRep}</span>, portador(a) do documento de identidade RG nº{' '}
                  <span className="font-mono">{rgRep}</span>, inscrito(a) no CPF nº{' '}
                  <span className="font-mono">{cpfRep}</span>, residente e domiciliado na {endRep}, e{' '}
                  <span className="font-bold">{nomeRep2}</span>, portador(a) do documento de identidade RG nº{' '}
                  <span className="font-mono">{rgRep2 || '---'}</span>, inscrito(a) no CPF nº{' '}
                  <span className="font-mono">{cpfRep2 || '---'}</span>, residente e domiciliado na {endRep2},
                  vêm apresentar Proposta Comercial para a participação no processo indicado acima, conforme abaixo discriminado:
                </div>
              ) : (
                <div className="text-[12pt] leading-relaxed text-black text-justify">
                  A empresa <span className="font-bold">{razaoSocial}</span>, inscrita no CNPJ sob o nº{' '}
                  <span className="font-mono">{cnpj}</span>, sediada na {endereco}, neste ato representado(a) por{' '}
                  <span className="font-bold">{nomeRep}</span>, portador(a) do documento de identidade RG nº{' '}
                  <span className="font-mono">{rgRep}</span>, inscrito(a) no CPF nº{' '}
                  <span className="font-mono">{cpfRep}</span>, residente e domiciliado na {endRep},
                  vem apresentar Proposta Comercial para a participação no processo indicado acima, conforme abaixo discriminado:
                </div>
              )}

              {/* TABELA DE PROPOSTA COMERCIAL DE PREÇOS */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                  Tabela de Itens e Proposta Comercial de Preços
                </h4>

                {itensDaLic.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                    Nenhum item adicionado ainda nesta licitação. Vá na aba "Montar Proposta & Catálogo" para adicionar produtos.
                  </div>
                ) : (
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[#0F2C59] text-white font-bold text-[11px]">
                        <tr>
                          <th className="py-2 px-2 text-center w-12">ITEM</th>
                          <th className="py-2 px-3 text-left">DESCRIÇÃO DOS PRODUTOS</th>
                          <th className="py-2 px-2 text-left w-24">MARCA</th>
                          <th className="py-2 px-2 text-center w-14">QTD</th>
                          <th className="py-2 px-2 text-right w-24">VALOR UNIT.</th>
                          <th className="py-2 px-3 text-right w-28">VALOR TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {itensDaLic.map(it => {
                          const totalItem = it.valor_total || it.quantidade * it.valor_unitario;
                          return (
                            <tr key={it.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                                {it.num_item}
                              </td>
                              <td className="py-2 px-3 text-slate-800">
                                <p className="font-semibold text-xs">{it.descricao_curta}</p>
                              </td>
                              <td className="py-2 px-2 font-medium text-slate-700">
                                {it.marca}
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-semibold text-slate-900">
                                {Math.round(it.quantidade).toLocaleString('pt-BR')}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-800">
                                {formatarMoeda(it.valor_unitario)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-[#0F2C59]">
                                {formatarMoeda(totalItem)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Linha Totalizador Oficial */}
                {itensDaLic.length > 0 && (
                  <div className="mt-3 bg-slate-100 border border-slate-300 rounded p-3 text-right">
                    <div className="text-xs text-slate-600">
                      VALOR TOTAL DA PROPOSTA:{' '}
                      <span className="text-sm font-extrabold text-[#0F2C59] font-mono">
                        {totalFormatado}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      ({extenso})
                    </div>
                  </div>
                )}
              </div>

              {/* CONDIÇÕES, DECLARAÇÃO TRABALHISTA E DATA DE EMISSÃO (Arial 12pt) */}
              <div className="pt-3 space-y-2.5 text-[12pt] text-black">
                <p>
                  <span className="font-bold uppercase tracking-tight">PRAZO DE ENTREGA:</span>{' '}
                  <span>{prazoEntrega}</span>
                </p>

                <p>
                  <span className="font-bold uppercase tracking-tight">PRAZO DE VALIDADE DA PROPOSTA:</span>{' '}
                  <span className="font-bold">{prazoValidade}</span>
                </p>

                <p className="text-justify leading-relaxed text-[11.5pt]">
                  <span className="font-bold uppercase tracking-tight">DECLARAÇÃO:</span>{' '}
                  {declaracaoTrab}
                </p>

                {/* Data e Cidade */}
                <p className="pt-2 font-bold text-center text-[12pt]">
                  {dataFormatadaTexto}
                </p>
              </div>

              {/* BLOCO DE ASSINATURA DO REPRESENTANTE (OU DUPLA SE HOUVER 2) */}
              {nomeRep2 ? (
                <div className="pt-6 pb-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto text-center">
                    {/* 1º Representante */}
                    <div className="flex flex-col items-center">
                      {timbrado.assinaturaImagem ? (
                        <div className="flex justify-center mb-1 h-20 items-end">
                          <img
                            src={timbrado.assinaturaImagem}
                            alt="Assinatura 1"
                            className="max-h-20 max-w-[240px] object-contain drop-shadow-2xs"
                          />
                        </div>
                      ) : (
                        <div className="h-12" />
                      )}
                      <div className="w-full max-w-[260px] border-t border-slate-900 pt-1.5">
                        <p className="font-bold text-slate-900 text-xs uppercase">{razaoSocial}</p>
                        <p className="text-slate-700 text-[11px] font-medium">{nomeRep}</p>
                        <p className="text-slate-500 text-[10px] font-mono">Representante Legal • CPF: {cpfRep}</p>
                      </div>
                    </div>

                    {/* 2º Representante */}
                    <div className="flex flex-col items-center">
                      {timbrado.assinaturaImagem2 ? (
                        <div className="flex justify-center mb-1 h-20 items-end">
                          <img
                            src={timbrado.assinaturaImagem2}
                            alt="Assinatura 2"
                            className="max-h-20 max-w-[240px] object-contain drop-shadow-2xs"
                          />
                        </div>
                      ) : (
                        <div className="h-12" />
                      )}
                      <div className="w-full max-w-[260px] border-t border-slate-900 pt-1.5">
                        <p className="font-bold text-slate-900 text-xs uppercase">{razaoSocial}</p>
                        <p className="text-slate-700 text-[11px] font-medium">{nomeRep2}</p>
                        <p className="text-slate-500 text-[10px] font-mono">Representante Legal • CPF: {cpfRep2 || cnpj}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-6 pb-2 text-center">
                  {timbrado.assinaturaImagem ? (
                    <div className="flex justify-center mb-1 h-24 items-end">
                      <img
                        src={timbrado.assinaturaImagem}
                        alt="Assinatura"
                        className="max-h-24 max-w-[280px] object-contain drop-shadow-2xs"
                      />
                    </div>
                  ) : (
                    <div className="h-10" />
                  )}
                  <div className="inline-block border-t border-slate-900 pt-2 px-16">
                    <p className="font-bold text-slate-900 text-xs uppercase">{razaoSocial}</p>
                    <p className="text-slate-700 text-[11px] font-medium">{nomeRep} — Representante Legal</p>
                    <p className="text-slate-500 text-[10px] font-mono">CNPJ: {cnpj}</p>
                  </div>
                </div>
              )}
            </div>

            {/* PÁGINAS DO ANEXO - CATÁLOGO E ESPECIFICAÇÕES TÉCNICAS COMPLETAS */}
            {itensDaLic.length > 0 && (
              <div className="border-t-4 border-dashed border-slate-300 p-8 sm:p-12 bg-slate-50/50 space-y-8">
                <div className="text-center border-b border-slate-200 pb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Anexo Oficial — Documento com Paginação e Altura Livres
                  </span>
                  <h3 className="text-base font-bold text-[#0F2C59] uppercase tracking-wider">
                    Catálogo e Especificações Técnicas dos Produtos
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Documentação fotográfica e descritivo técnico integral em conformidade com o Edital e Termo de Referência (sem corte de texto)
                  </p>
                </div>

                <div className="space-y-6">
                  {itensDaLic.map(it => (
                    <div
                      key={it.id}
                      className="bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-4 relative"
                    >
                      {/* Cabeçalho do Item */}
                      <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                        <span className="bg-[#0F2C59] text-white text-xs font-bold px-3 py-1 rounded shrink-0">
                          ITEM {String(it.num_item).padStart(2, '0')}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {it.descricao_curta}
                        </h4>
                      </div>

                      {/* Imagem do Item Centralizada em Cima */}
                      <div className="flex justify-center my-1">
                        <div className="w-64 h-44 sm:w-72 sm:h-48 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden p-3 shadow-2xs">
                          {it.caminho_imagem ? (
                            <img
                              src={it.caminho_imagem}
                              alt={it.descricao_curta}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-center text-slate-400 text-xs">
                              <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                              <span>Foto do Produto</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Especificações Técnicas Completas em Baixo */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#0F2C59]" />
                          Especificações Técnicas Completas do Item:
                        </div>
                        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-sans shadow-2xs">
                          {renderDescricaoFormatada(it.descricao_tecnica || it.descricao_curta)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RODAPÉ GRÁFICO (se houver imagem) */}
            {timbrado.rodapeImagem && (
              <div className="px-8 py-3 border-t border-slate-100 flex justify-center bg-slate-50/50">
                <img
                  src={timbrado.rodapeImagem}
                  alt="Rodapé Timbrado"
                  className="max-h-16 object-contain"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
