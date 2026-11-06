import jsPDF from 'jspdf';
import { PapelTimbradoConfig } from '../types';
import { renderizarImagemProporcional } from './pdfImageHelper';

export type TipoNovaDeclaracao =
  | 'me_epp'
  | 'habilitacao'
  | 'fatos_impeditivos'
  | 'trabalho_infantil'
  | 'responsabilidade'
  | 'inexistencia_parentes';

export interface DadosNovaDeclaracao {
  tipo: TipoNovaDeclaracao;
  modalidade: string; // Ex: "PREGÃO ELETRÔNICO"
  processoEdital: string; // Ex: "Nº 14/2026"
  orgaoPublico: string; // Ex: "Prefeitura Municipal de NOVA SANTA BARBARA"
  comissaoLicitacao?: string; // Ex: "Comissão Municipal de Licitações"
  objetoLicitacao?: string; // Ex: "AQUISIÇÃO DE MATERIAIS ESPORTIVOS, UNIFORMES E EQUIPAMENTOS DIVERSOS..."
  dataEmissao?: string; // Ex: "2026-04-23" ou "23/04/2026"
  cidadeEmissao?: string; // Ex: "Timóteo - MG"
  numeroAnexo?: string; // Ex: "ANEXO V" ou "ANEXO VIII"
  ressalvaAprendiz?: boolean; // Marca "X" na condição de menor aprendiz
  estadoCivil?: string; // Ex: "solteiro"
  profissao?: string; // Ex: "empresário"
  orgaoExpedidorRg?: string; // Ex: "PC MG"
  textoPersonalizado?: string; // Permite edição livre pelo usuário se desejar
}

/**
 * Marca d'água central transparente com o emblema da GWS Global
 */
function gerarMarcaDaguaCanvas(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 600, 600);

  // Círculo externo suave
  ctx.strokeStyle = 'rgba(15, 44, 89, 0.08)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(300, 270, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Emblema interno estilizado
  ctx.strokeStyle = 'rgba(15, 44, 89, 0.09)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(280, 250, 110, Math.PI * 0.75, Math.PI * 1.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(320, 290, 110, Math.PI * 1.75, Math.PI * 0.85);
  ctx.stroke();

  // Texto GWS Global
  ctx.fillStyle = 'rgba(15, 44, 89, 0.11)';
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GWS Global', 300, 530);

  return canvas.toDataURL('image/png');
}

/**
 * Logotipo tipográfico elegante para fallback quando não há imagem de cabeçalho
 */
function gerarLogoGwsCanvas(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 300, 200);

  const grad = ctx.createLinearGradient(70, 20, 230, 140);
  grad.addColorStop(0, '#0F2C59');
  grad.addColorStop(1, '#021B3A');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(150, 75, 55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#0F2C59';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(142, 68, 28, Math.PI * 0.8, Math.PI * 1.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(158, 82, 28, Math.PI * 1.8, Math.PI * 0.85);
  ctx.stroke();

  ctx.fillStyle = '#0F2C59';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GWS Global', 150, 165);

  return canvas.toDataURL('image/png');
}

/**
 * Formata data oficial por extenso (ex: "TIMÓTEO - MG, 23 de Abril de 2026")
 */
export function formatarDataPorExtensoPt(dataStr?: string, cidade = 'Timóteo - MG'): string {
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
  const cidadeLimpa = cidade.replace(/,\s*em\s*$/, '').trim().toUpperCase();
  return `${cidadeLimpa}, ${dia} de ${mes} de ${ano}.`;
}

/**
 * Retorna título oficial e identificação visual do documento
 */
export function obterConfigDeclaracao(tipo: TipoNovaDeclaracao) {
  switch (tipo) {
    case 'me_epp':
      return {
        id: 'me_epp' as TipoNovaDeclaracao,
        nomeMenu: 'Enquadramento ME/EPP',
        tituloDoc: 'MODELO DE DECLARAÇÃO - ME/EPP/MEI',
        subtitulo: 'Comprovação de Microempresa e EPP (LC 123/2006)',
        badge: 'ME / EPP',
      };
    case 'habilitacao':
      return {
        id: 'habilitacao' as TipoNovaDeclaracao,
        nomeMenu: 'Cumprimento de Habilitação',
        tituloDoc: 'DECLARAÇÃO DE CUMPRIMENTO DOS REQUISITOS DE HABILITAÇÃO',
        subtitulo: 'Atendimento pleno às condições editalícias e técnicas',
        badge: 'Habilitação',
      };
    case 'fatos_impeditivos':
      return {
        id: 'fatos_impeditivos' as TipoNovaDeclaracao,
        nomeMenu: 'Inexistência de Fatos Impeditivos',
        tituloDoc: 'DECLARAÇÃO INEXISTÊNCIA DE FATO SUPERVENIENTE IMPEDITIVO',
        subtitulo: 'Declaração de ausência de impedimento legal ou suspensão',
        badge: 'Fatos Impeditivos',
      };
    case 'trabalho_infantil':
      return {
        id: 'trabalho_infantil' as TipoNovaDeclaracao,
        nomeMenu: 'Não Emprego de Menor',
        tituloDoc: 'DECLARAÇÃO QUE NÃO EMPREGA MENOR DE IDADE, SALVO NA CONDIÇÃO DE APRENDIZ',
        subtitulo: 'Constituição Federal Art. 7º XXXIII e Lei 14.133/2021',
        badge: 'Mão de Obra Infantil',
      };
    case 'responsabilidade':
      return {
        id: 'responsabilidade' as TipoNovaDeclaracao,
        nomeMenu: 'Declaração de Responsabilidade',
        tituloDoc:
          'DECLARAÇÃO DE SUJEIÇÃO ÀS CONDIÇÕES ESTABELECIDAS NO EDITAL E DE INEXISTÊNCIA DE FATOS SUPERVENIENTES IMPEDITIVOS DA HABILITAÇÃO/ DECLARAÇÃO DE QUE CUMPRE PLENAMENTE OS REQUISITOS DA HABILITAÇÃO E DECLARAÇÃO DE MICRO EMPRESAS QUE NO ANO-CALENDÁRIO DE REALIZAÇÃO DA LICITAÇÃO, AINDA NÃO TENHAM CELEBRADO CONTRATOS COM A ADMINISTRAÇÃO PÚBLICA CUJO VALORES SOMADOS EXTRAPOLEM A RECEITA BRUTA MÁXIMA ADMITIDA PARA FINS DE ENQUADRAMENTO COMO EMPRESA DE PEQUENO PORTE.',
        subtitulo: 'Sujeição ao edital, requisitos de habilitação e limite de receita ME/EPP',
        badge: 'Responsabilidade',
      };
    case 'inexistencia_parentes':
      return {
        id: 'inexistencia_parentes' as TipoNovaDeclaracao,
        nomeMenu: 'Inexistência de Parentes',
        tituloDoc: 'DECLARAÇÃO QUE NÃO POSSUI SERVIDOR PÚBLICO EM SEU QUADRO DE PESSOAL',
        subtitulo: 'Ausência de servidores públicos da ativa e parentesco até 3º grau',
        badge: 'Sem Parentesco',
      };
  }
}

/**
 * Constrói o texto legal padrão correspondente a cada declaração
 */
export function construirTextoDeclaracao(
  tipo: TipoNovaDeclaracao,
  dados: DadosNovaDeclaracao,
  timbrado: PapelTimbradoConfig
): {
  paragrafos: string[];
  ressalvaTexto?: string;
  anexoCabecalho?: string;
  cabecalhoSubBloco?: {
    orgao?: string;
    comissao?: string;
    processo?: string;
  };
} {
  const razaoSocial = (timbrado.razaoSocial || 'GWS GLOBAL LIMITADA').toUpperCase();
  const cnpj = timbrado.cnpj || '53.080.207/0001-80';
  const enderecoEmpresa = [
    timbrado.endereco || 'Rua Alpercata, Nº 261, Ana Malaquias',
    timbrado.cidadeEmissao || 'TIMOTEO - MG',
  ]
    .filter(Boolean)
    .join(', ');

  const nomeRep = timbrado.nomeRepresentante || 'Gustavo Henrique Severino Pinto';
  const rgRep = timbrado.rgRepresentante || '20035238';
  const orgaoRg = dados.orgaoExpedidorRg || 'PC MG';
  const cpfRep = timbrado.cpfRepresentante || '020.313.066-93';
  const enderecoRep = timbrado.enderecoRepresentante || 'Rua Estrelinha, Nº 180, TIMOTEO/MG';
  const estadoCivil = dados.estadoCivil || 'solteiro';
  const profissao = dados.profissao || 'empresário';

  const promotor = (dados.orgaoPublico || '').trim();
  const edital = (dados.processoEdital || '').trim();
  const modalidade = (dados.modalidade || '').trim();

  const identificacaoProcesso = [
    modalidade,
    edital ? (edital.toUpperCase().startsWith('N') ? edital : `Nº ${edital}`) : '',
  ]
    .filter(Boolean)
    .join(' ');

  switch (tipo) {
    case 'me_epp': {
      const p1 = `${razaoSocial} , estabelecida na ${enderecoEmpresa}, por seu representante legal ${nomeRep}, brasileiro(a), ${estadoCivil}, ${profissao}, RG: ${rgRep}, CPF: ${cpfRep} , residente na ${enderecoRep}, declara, sob as penas da lei penal e civil${
        promotor ? `, perante o(a) ${promotor}` : ''
      }${
        identificacaoProcesso ? `, no âmbito do ${identificacaoProcesso}` : ''
      }, que a ora declarante está classificada como Microempresa — ME, Empresa de Pequeno Porte — EPP ou Microempreendedor Individual - MEI, perante (Receita Federal e/ou Secretaria da Fazenda do Estado), comprometendo-se ainda a informar caso deixe de ser enquadrada na condição de Microempresa — ME, Empresa de Pequeno Porte — EPP ou Microempreendedor Individual — MEI, nos termos da lei.`;
      return { paragrafos: [p1] };
    }

    case 'habilitacao': {
      const p1 = `${razaoSocial} , inscrita no CNPJ sob o nº ${cnpj}, com sede na ${enderecoEmpresa}, neste ato representada pelo Senhor(a) ${nomeRep}, RG nº ${rgRep} ${orgaoRg}, CPF nº ${cpfRep}${
        promotor ? `, perante o(a) ${promotor}` : ''
      }${identificacaoProcesso ? `, referente ao Processo / Edital ${identificacaoProcesso}` : ''}:`;
      const p2 = `DECLARA, expressamente o cumprimento dos requisitos de habilitação.`;
      return { paragrafos: [p1, p2] };
    }

    case 'fatos_impeditivos': {
      const p1 = `NOME DA EMPRESA ${razaoSocial}, com o CNPJ ${cnpj} SEDIADA ${enderecoEmpresa}${
        promotor ? `, perante o(a) ${promotor}` : ''
      }${
        identificacaoProcesso ? `, no âmbito do Processo / Edital ${identificacaoProcesso}` : ''
      }, declara, sob as penas da lei, que até a presente data inexistem fatos supervenientes impeditivos para sua habilitação no presente processo licitatório, ciente da obrigatoriedade de declarar ocorrências posteriores.`;
      return { paragrafos: [p1] };
    }

    case 'trabalho_infantil': {
      const p1 = `${razaoSocial}, inscrita no CNPJ sob nº ${cnpj}, por intermédio de seu representante legal, Sr.(a) ${nomeRep}, portador(a) da Carteira de Identidade nº ${rgRep} Órgão expedidor ${orgaoRg} e do C.P.F nº ${cpfRep}${
        promotor ? `, perante o(a) ${promotor}` : ''
      }${
        identificacaoProcesso ? `, Processo / Edital ${identificacaoProcesso}` : ''
      }, DECLARA, para fins de cumprimento do disposto no inciso XXXIII do Art. 7º da Constituição Federal, que não emprega menor de dezoito anos em trabalho noturno, perigoso ou insalubre e que não emprega menor de dezesseis anos.`;

      const ressalvaMarcada = dados.ressalvaAprendiz ? 'X' : ' ';
      const ressalva = `Ressalva: emprega menor, a partir de quatorze anos, na condição de aprendiz ( ${ressalvaMarcada} )\n(assinalar com "x" a ressalva acima, caso verdadeira)`;

      return {
        paragrafos: [p1],
        ressalvaTexto: ressalva,
        anexoCabecalho: dados.numeroAnexo?.trim() || 'ANEXO VIII',
      };
    }

    case 'responsabilidade': {
      const comissaoTexto = dados.comissaoLicitacao?.trim() || 'Comissão Municipal de Licitações';
      const objetoTexto =
        dados.objetoLicitacao?.trim() ||
        'AQUISIÇÃO DE MATERIAIS ESPORTIVOS, UNIFORMES E EQUIPAMENTOS DIVERSOS EM ATENDIMENTO A SECRETARIA MUNICIPAL DE ESPORTES E LAZER, conforme descrição constante do ANEXO I';

      const lead = `A empresa ${razaoSocial}, inscrita no CNPJ sob o nº ${cnpj}, sediada na ${enderecoEmpresa}, neste ato representado(a) por ${nomeRep}, portador(a) do documento de identidade RG nº ${rgRep} expedido pela ${orgaoRg}, inscrito(a) no CPF nº ${cpfRep}, residente e domiciliado na ${enderecoRep}, declara que:`;

      const topico1 = `➤ Que se sujeita às condições estabelecidas no Edital acima citado e que acatará integralmente qualquer decisão que venha a ser tomada pelo licitador quanto à qualificação apenas das proponentes que tenham atendido às condições estabelecidas no Edital e que demonstrem integral capacidade de executar o fornecimento do bem previsto. DECLARA, ainda, para todos os fins de direito, a inexistência de fatos supervenientes impeditivos da habilitação ou que comprometa a idoneidade da proponente nos termos do inciso I do art. 63º da Lei nº 14.133, de 1 de abril de 2021;`;

      const topico2 = `➤ Conforme preceitua o art. 63, inciso I, da Lei N.º 14.133/2021, cumpre plenamente os requisitos de habilitação para o ${identificacaoProcesso || 'PREGÃO ELETRÔNICO'}, cujo objeto é ${objetoTexto}.`;

      const topico3 = `➤ Sob as penas da Lei, que a mesma está estabelecida sob o regime legal de MICROEMPRESA, conforme conceito legal e fiscal de nosso ordenamento pátrio, podendo usufruir os benefícios da Lei Complementar nº 123/2006, sendo que: a) a receita bruta anual da empresa não ultrapassa o disposto nos incisos I (ME) e II (EPP) do artigo 3º da Lei Complementar nº 123/2006; b) não tem nenhum dos impedimentos do parágrafo 4º do artigo 3º da mesma lei, ciente da obrigatoriedade de declarar ocorrências posteriores.a) Não fomos declarados inidôneos para licitar ou contratar com o Poder Público, em qualquer de suas esferas.`;

      return {
        paragrafos: [lead, topico1, topico2, topico3],
        anexoCabecalho: dados.numeroAnexo?.trim() || 'ANEXO V',
        cabecalhoSubBloco: {
          orgao: promotor || 'Prefeitura Municipal',
          comissao: comissaoTexto,
          processo: identificacaoProcesso || 'PREGÃO ELETRÔNICO',
        },
      };
    }

    case 'inexistencia_parentes': {
      const p1 = `Eu, ${nomeRep},`;
      const p2 = `Responsável legal da empresa ${razaoSocial},`;
      const p3 = `Inscrita no CNPJ sob o n. ${cnpj}, DECLARO, sob as penas da lei, que a empresa ${razaoSocial}, não possui em seu quadro societário servidor público da ativa, ou empregado de empresa pública ou de sociedade de economia mista, bem como não ter relação de parentesco, em linha reta, colateral, ou por afinidade, até o terceiro grau, com servidores ou agentes políticos envolvidos no processo licitatório e com poder decisório capaz de influenciar no resultado${promotor ? `, perante o(a) ${promotor}` : ''}${identificacaoProcesso ? `, referente ao ${identificacaoProcesso}` : ''}.`;

      return {
        paragrafos: [p1, p2, p3],
      };
    }
  }
}

/**
 * Gera documento PDF com layout profissional idêntico aos modelos enviados
 */
export async function gerarNovaDeclaracaoPdf(
  dados: DadosNovaDeclaracao,
  timbrado: PapelTimbradoConfig
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginLeft = 22;
  const marginRight = 22;
  const contentWidth = pageWidth - marginLeft - marginRight; // 166 mm

  const config = obterConfigDeclaracao(dados.tipo);
  const textoCompilado = construirTextoDeclaracao(dados.tipo, dados, timbrado);

  // 1. MARCA D'ÁGUA CENTRAL
  try {
    const watermark = gerarMarcaDaguaCanvas();
    if (watermark) {
      const wmSize = 135;
      const wmX = (pageWidth - wmSize) / 2;
      const wmY = 85;
      doc.addImage(watermark, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
    }
  } catch (err) {
    console.warn('Aviso watermark:', err);
  }

  // 2. CABEÇALHO DO PAPEL TIMBRADO
  let currentY = 12;
  if (timbrado.cabecalhoImagem && timbrado.cabecalhoImagem.startsWith('data:image')) {
    try {
      const headerH = timbrado.alturaCabecalhoMm || 26;
      doc.addImage(timbrado.cabecalhoImagem, 'PNG', 0, 0, pageWidth, headerH, undefined, 'FAST');
      currentY = headerH + 8;
    } catch {
      currentY = desenharCabecalhoTipografico();
    }
  } else {
    currentY = desenharCabecalhoTipografico();
  }

  function desenharCabecalhoTipografico(): number {
    try {
      const logoGws = gerarLogoGwsCanvas();
      if (logoGws) {
        doc.addImage(logoGws, 'PNG', marginLeft - 2, 7, 28, 19, undefined, 'FAST');
      }
    } catch {}

    const razaoSocial = timbrado.razaoSocial || 'GWS GLOBAL LIMITADA';
    const cnpj = timbrado.cnpj || '53.080.207/0001-80';
    const endereco = timbrado.endereco || 'Rua Alpercata, nº 261, Bairro Ana Malaquias';
    const cidade = timbrado.cidadeEmissao || 'Timóteo - MG';
    const telefone = timbrado.telefone || '(31) 98694-9588';
    const email = timbrado.email || 'gwsgloballimitada@gmail.com';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const infoX = marginLeft + 32;
    const infoWidth = contentWidth - 32;

    doc.text(`${razaoSocial} • CNPJ: ${cnpj}`, infoX + infoWidth / 2, 11, { align: 'center' });
    doc.text(`Endereço: ${endereco} - ${cidade}`, infoX + infoWidth / 2, 15.5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(`Contato: ${telefone}   |   E-mail: ${email}`, infoX + infoWidth / 2, 19.5, {
      align: 'center',
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 23, pageWidth - marginRight, 23);

    return 30;
  }

  // 3. BLOCO DE IDENTIFICAÇÃO DO PROCESSO LICITATÓRIO E ÓRGÃO PROMOTOR (Solicitado pelo usuário)
  const promotor = (dados.orgaoPublico || '').trim().toUpperCase();
  let edital = (dados.processoEdital || '').trim();
  let modalidade = (dados.modalidade || 'PREGÃO ELETRÔNICO').trim().toUpperCase();
  if (edital && !edital.toUpperCase().startsWith('Nº') && !edital.toUpperCase().startsWith('NO')) {
    edital = `Nº ${edital}`;
  }

  // Para a declaração de responsabilidade, o bloco de promotor/comissão/processo fica abaixo do título (conforme modelo Anexo V)
  if (dados.tipo !== 'responsabilidade' && (promotor || edital)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 44, 89); // Azul corporativo GWS

    if (modalidade || edital) {
      doc.text(`${modalidade} ${edital}`.trim(), marginLeft, currentY);
      currentY += 5;
    }
    if (promotor) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`ÓRGÃO / PROMOTOR: ${promotor}`, marginLeft, currentY);
      currentY += 6;
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 8;
  } else if (dados.tipo !== 'responsabilidade') {
    currentY += 4;
  }

  // 4. ANEXO (SE APLICÁVEL, COMO ANEXO V OU ANEXO VIII)
  if (textoCompilado.anexoCabecalho) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(textoCompilado.anexoCabecalho.toUpperCase(), pageWidth / 2, currentY, {
      align: 'center',
    });
    currentY += 6;
  }

  // 5. TÍTULO PRINCIPAL DA DECLARAÇÃO (Centralizado, em Negrito)
  doc.setFont('helvetica', 'bold');
  const fontSizeTitulo = dados.tipo === 'responsabilidade' ? 9.5 : 11.5;
  const lineSpacingTitulo = dados.tipo === 'responsabilidade' ? 4 : 5;
  doc.setFontSize(fontSizeTitulo);
  doc.setTextColor(0, 0, 0);

  const linhasTitulo = doc.splitTextToSize(config.tituloDoc, contentWidth);
  doc.text(linhasTitulo, pageWidth / 2, currentY, { align: 'center' });
  currentY += linhasTitulo.length * lineSpacingTitulo + 6;

  // 5.1 SUB-BLOCO DE IDENTIFICAÇÃO DO PROCESSO (Abaixo do título no modelo Anexo V)
  if (dados.tipo === 'responsabilidade' && textoCompilado.cabecalhoSubBloco) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    if (textoCompilado.cabecalhoSubBloco.orgao) {
      doc.text(textoCompilado.cabecalhoSubBloco.orgao, marginLeft, currentY);
      currentY += 4.2;
    }
    if (textoCompilado.cabecalhoSubBloco.comissao) {
      doc.text(textoCompilado.cabecalhoSubBloco.comissao, marginLeft, currentY);
      currentY += 4.2;
    }
    if (textoCompilado.cabecalhoSubBloco.processo) {
      doc.text(textoCompilado.cabecalhoSubBloco.processo, marginLeft, currentY);
      currentY += 6;
    }
  }

  // 6. CORPO DO TEXTO
  const fontSizeCorpo = dados.tipo === 'responsabilidade' ? 8.5 : 10;
  const lineSpacingCorpo = dados.tipo === 'responsabilidade' ? 3.9 : 5.2;
  const gapParagrafo = dados.tipo === 'responsabilidade' ? 3.2 : 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSizeCorpo);
  doc.setTextColor(15, 23, 42);

  const paragrafos = dados.textoPersonalizado?.trim()
    ? dados.textoPersonalizado.split('\n\n')
    : textoCompilado.paragrafos;

  for (const p of paragrafos) {
    const linhas = doc.splitTextToSize(p, contentWidth);
    doc.text(linhas, marginLeft, currentY, { maxWidth: contentWidth, align: 'justify' });
    currentY += linhas.length * lineSpacingCorpo + gapParagrafo;
  }

  // 7. RESSALVA ESPECÍFICA (Ex: Menor Aprendiz)
  if (textoCompilado.ressalvaTexto) {
    currentY += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    const linhasRessalva = doc.splitTextToSize(textoCompilado.ressalvaTexto, contentWidth);
    for (let i = 0; i < linhasRessalva.length; i++) {
      if (i > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
      }
      doc.text(linhasRessalva[i], marginLeft + 10, currentY);
      currentY += 5;
    }
    currentY += 5;
  }

  // 8. LOCAL E DATAÇÃO (Conforme modelo: "(Local e data) TIMOTEO-MG, 23/04/2026")
  currentY = Math.max(currentY + 6, 175);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const cidadeFinal = dados.cidadeEmissao || timbrado.cidadeEmissao || 'TIMOTEO-MG';
  const dataFinal = dados.dataEmissao
    ? formatarDataPorExtensoPt(dados.dataEmissao, cidadeFinal)
    : formatarDataPorExtensoPt(undefined, cidadeFinal);

  const prefixoData = dados.tipo === 'trabalho_infantil' ? '(Local e data) ' : '';
  doc.text(`${prefixoData}${dataFinal}`, marginLeft, currentY);

  currentY += 16;

  // 9. ASSINATURAS DO PAPEL TIMBRADO (com imagem e dados cadastrados)
  const nomeRep1 = timbrado.nomeRepresentante || 'Gustavo Henrique Severino Pinto';
  const cpfRep1 = timbrado.cpfRepresentante || '020.313.066-93';
  const cargoRep1 = timbrado.cargoRepresentante || 'Representante Legal';

  const nomeRep2 = timbrado.nomeRepresentante2?.trim() || '';
  const cpfRep2 = timbrado.cpfRepresentante2?.trim() || '';
  const cargoRep2 = timbrado.cargoRepresentante2 || 'Representante Legal';

  const temDoisRepresentantes = Boolean(
    nomeRep2 && (timbrado.assinaturaImagem2 || timbrado.nomeRepresentante2)
  );

  if (temDoisRepresentantes) {
    const gap = 14;
    const colWidth = (contentWidth - gap) / 2;
    const col1Center = marginLeft + colWidth / 2;
    const col2Center = marginLeft + colWidth + gap + colWidth / 2;
    const sigW = 50;
    const sigH = 18;

    if (timbrado.assinaturaImagem && timbrado.assinaturaImagem.startsWith('data:image')) {
      try {
        renderizarImagemProporcional(
          doc,
          timbrado.assinaturaImagem,
          col1Center - sigW / 2,
          currentY,
          sigW,
          sigH
        );
      } catch {}
    }

    if (timbrado.assinaturaImagem2 && timbrado.assinaturaImagem2.startsWith('data:image')) {
      try {
        renderizarImagemProporcional(
          doc,
          timbrado.assinaturaImagem2,
          col2Center - sigW / 2,
          currentY,
          sigW,
          sigH
        );
      } catch {}
    }

    const linhaY = currentY + sigH + 1;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.line(col1Center - 32, linhaY, col1Center + 32, linhaY);
    doc.line(col2Center - 32, linhaY, col2Center + 32, linhaY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep1.toUpperCase(), col1Center, linhaY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`CPF: ${cpfRep1}`, col1Center, linhaY + 7.5, { align: 'center' });
    doc.text(cargoRep1.toUpperCase(), col1Center, linhaY + 11, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep2.toUpperCase(), col2Center, linhaY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`CPF: ${cpfRep2}`, col2Center, linhaY + 7.5, { align: 'center' });
    doc.text(cargoRep2.toUpperCase(), col2Center, linhaY + 11, { align: 'center' });
  } else {
    // 1 representante centralizado
    const centerX = pageWidth / 2;
    const sigW = 60;
    const sigH = 22;

    if (timbrado.assinaturaImagem && timbrado.assinaturaImagem.startsWith('data:image')) {
      try {
        renderizarImagemProporcional(
          doc,
          timbrado.assinaturaImagem,
          centerX - sigW / 2,
          currentY,
          sigW,
          sigH
        );
      } catch {}
    }

    const linhaY = currentY + sigH + 1;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.line(centerX - 45, linhaY, centerX + 45, linhaY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep1.toUpperCase(), centerX, linhaY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`CPF: ${cpfRep1}   •   ${cargoRep1.toUpperCase()}`, centerX, linhaY + 8.5, {
      align: 'center',
    });
    doc.text(
      (timbrado.razaoSocial || 'GWS GLOBAL LIMITADA').toUpperCase(),
      centerX,
      linhaY + 12,
      { align: 'center' }
    );
  }

  // 10. RODAPÉ DO PAPEL TIMBRADO
  if (timbrado.rodapeImagem && timbrado.rodapeImagem.startsWith('data:image')) {
    try {
      const footerH = timbrado.alturaRodapeMm || 18;
      doc.addImage(
        timbrado.rodapeImagem,
        'PNG',
        0,
        pageHeight - footerH,
        pageWidth,
        footerH,
        undefined,
        'FAST'
      );
    } catch {}
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Documento emitido eletronicamente via Sistema GWS GLOBAL • ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

/**
 * Faz download do blob do PDF diretamente
 */
export function baixarBlobDeclaracao(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
