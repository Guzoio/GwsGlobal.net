import jsPDF from 'jspdf';
import { PapelTimbradoConfig } from '../types';
import { renderizarImagemProporcional } from './pdfImageHelper';

export interface DadosDeclaracaoUnificada {
  modalidade: string; // e.g. "PREGÃO" ou "PREGÃO ELETRÔNICO"
  processoEdital: string; // e.g. "Nº 26-2026"
  orgaoPublico: string; // e.g. "MUNICIPIO DE MOREIRA SALES-PR"
  dataEmissao?: string; // e.g. "2026-10-01" ou formatada
  cidadeEmissao?: string; // e.g. "Timóteo - MG"
}

/**
 * Gera a marca d'água central transparente com o emblema da GWS Global
 */
function gerarMarcaDaguaCanvas(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 600, 600);

  // Círculo externo
  ctx.strokeStyle = 'rgba(15, 44, 89, 0.08)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(300, 270, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Emblema interno estilizado "GWS" / "SW"
  ctx.strokeStyle = 'rgba(15, 44, 89, 0.09)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(280, 250, 110, Math.PI * 0.75, Math.PI * 1.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(320, 290, 110, Math.PI * 1.75, Math.PI * 0.85);
  ctx.stroke();

  // Texto "GWS Global"
  ctx.fillStyle = 'rgba(15, 44, 89, 0.11)';
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GWS Global', 300, 530);

  return canvas.toDataURL('image/png');
}

/**
 * Gera o logotipo elegante da GWS Global para o cabeçalho (emblema circular azul + texto GWS Global)
 */
function gerarLogoGwsCanvas(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 300, 200);

  // Círculo azul escuro
  const grad = ctx.createLinearGradient(70, 20, 230, 140);
  grad.addColorStop(0, '#0F2C59');
  grad.addColorStop(1, '#021B3A');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(150, 75, 55, 0, Math.PI * 2);
  ctx.stroke();

  // Swooshes internos
  ctx.strokeStyle = '#0F2C59';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(142, 68, 28, Math.PI * 0.8, Math.PI * 1.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(158, 82, 28, Math.PI * 1.8, Math.PI * 0.85);
  ctx.stroke();

  // Texto GWS Global
  ctx.fillStyle = '#0F2C59';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GWS Global', 150, 165);

  return canvas.toDataURL('image/png');
}

/**
 * Formata a data atual em extenso no formato oficial: "Timóteo - MG, em 15 de Setembro de 2026."
 */
function formatarDataPorExtenso(dataStr?: string, cidade = 'Timóteo - MG'): string {
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

  // Limpa sufixo caso já tenha
  const cidadeLimpa = cidade.replace(/,\s*em\s*$/, '').trim();
  return `${cidadeLimpa}, em ${dia} de ${mes} de ${ano}.`;
}

/**
 * Gera o documento PDF da Declaração Unificada conforme modelo oficial da Lei 14.133/21
 */
export async function gerarDeclaracaoUnificadaPdf(
  dados: DadosDeclaracaoUnificada,
  timbrado: PapelTimbradoConfig
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight; // 170 mm

  // Dados da Empresa
  const razaoSocial = timbrado.razaoSocial || 'GWS Global Ltda';
  const cnpj = timbrado.cnpj || '53.080.207/0001-80';
  const inscricaoEstadual = timbrado.inscricaoEstadual || '47724530033';
  const endereco = timbrado.endereco || 'Rua Alpercata, nº 261, Bairro Ana Malaquias';
  const cidade = timbrado.cidadeEmissao || 'Timóteo - MG';
  const cep = '35182-183';
  const telefone = timbrado.telefone || '(31) 98694-9588 - (31) 99924-0111';
  const email = timbrado.email || 'gwsgloballimitada@gmail.com';

  // 1. MARCA D'ÁGUA CENTRAL
  try {
    const watermark = gerarMarcaDaguaCanvas();
    if (watermark) {
      const wmSize = 135;
      const wmX = (pageWidth - wmSize) / 2;
      const wmY = 90;
      doc.addImage(watermark, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
    }
  } catch (err) {
    console.warn('Aviso ao adicionar marca dágua:', err);
  }

  // 2. CABEÇALHO DO TIMBRADO
  let currentY = 10;
  if (timbrado.cabecalhoImagem && timbrado.cabecalhoImagem.startsWith('data:image')) {
    try {
      const headerH = timbrado.alturaCabecalhoMm || 26;
      doc.addImage(timbrado.cabecalhoImagem, 'PNG', 0, 0, pageWidth, headerH, undefined, 'FAST');
      currentY = headerH + 6;
    } catch {
      currentY = desenharCabecalhoTipografico();
    }
  } else {
    currentY = desenharCabecalhoTipografico();
  }

  function desenharCabecalhoTipografico(): number {
    // Logo no canto esquerdo
    try {
      const logoGws = gerarLogoGwsCanvas();
      if (logoGws) {
        doc.addImage(logoGws, 'PNG', marginLeft - 2, 7, 30, 20, undefined, 'FAST');
      }
    } catch {}

    // Bloco de endereço e contato no centro/direita
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const infoX = marginLeft + 35;
    const infoWidth = contentWidth - 35;

    doc.text(`Endereço: ${endereco}`, infoX + infoWidth / 2, 10, { align: 'center' });
    doc.text(`Cidade: ${cidade}, CEP: ${cep}`, infoX + infoWidth / 2, 14, { align: 'center' });

    doc.setFontSize(7.5);
    doc.text(
      `CONTATO: ${telefone}      CNPJ: ${cnpj}`,
      infoX + infoWidth / 2,
      18,
      { align: 'center' }
    );
    doc.text(
      `E-MAIL: ${email}      INSC. EST: ${inscricaoEstadual}`,
      infoX + infoWidth / 2,
      22,
      { align: 'center' }
    );

    // Linha sutil divisória
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 25, pageWidth - marginRight, 25);

    return 32;
  }

  // 3. TÍTULO: PREGÃO / MODALIDADE E ÓRGÃO PÚBLICO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);

  // Normalização do texto do pregão / edital
  let modTexto = (dados.modalidade || 'PREGÃO').trim().toUpperCase();
  let editalTexto = (dados.processoEdital || '').trim();
  if (editalTexto && !editalTexto.toUpperCase().startsWith('Nº') && !editalTexto.toUpperCase().startsWith('NO')) {
    editalTexto = `Nº ${editalTexto}`;
  }
  const linha1Titulo = `${modTexto} ${editalTexto}`.trim();
  doc.text(linha1Titulo, marginLeft, currentY);

  currentY += 6;
  const orgaoTexto = (dados.orgaoPublico || 'MUNICÍPIO DE MOREIRA SALES-PR').trim().toUpperCase();
  doc.text(orgaoTexto, marginLeft, currentY);

  currentY += 8;

  // 4. PREÂMBULO DA DECLARAÇÃO COM DESTAQUES EM NEGRITO
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);

  const preambuloTexto = `A empresa ${razaoSocial}, situada na ${endereco}, ${cidade}, CEP: ${cep}, inscrita no CNPJ nº ${cnpj}, através de seu representante legal, DECLARA sob as penalidades cabíveis, que:`;
  const linhasPreambulo = doc.splitTextToSize(preambuloTexto, contentWidth);
  doc.text(linhasPreambulo, marginLeft, currentY, { maxWidth: contentWidth, align: 'justify' });

  currentY += linhasPreambulo.length * 4.6 + 3.5;

  // 5. OS 7 ITENS LEGAIS DA DECLARAÇÃO UNIFICADA (LEI 14.133/21 E LC 123/06)
  const itensDeclaracao = [
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
        'que não se encontra declarada inidônea, nem suspensa ou impedida de licitar e contratar coma Administração Pública, inclusive nos termos do artigo 20, inciso I, alínea “a” e artigo 90, ambos da Lei Orgânica Municipal;',
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

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  for (const item of itensDeclaracao) {
    const textoCompleto = `${item.num} ${item.texto}`;
    const linhasItem = doc.splitTextToSize(textoCompleto, contentWidth);
    doc.text(linhasItem, marginLeft, currentY, { maxWidth: contentWidth, align: 'justify' });
    currentY += linhasItem.length * 4.3 + 2.4;
  }

  currentY += 4;

  // 6. DATAÇÃO DA EMISSÃO
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);

  const cidadeEmissaoFinal = dados.cidadeEmissao || timbrado.cidadeEmissao || 'Timóteo - MG';
  const dataFormatada = formatarDataPorExtenso(dados.dataEmissao, cidadeEmissaoFinal);
  doc.text(dataFormatada, marginLeft, currentY);

  currentY += 12;

  // 7. BLOCO DE ASSINATURAS DOS REPRESENTANTES (CONFIGURADAS NO PAPEL TIMBRADO)
  const nomeRep1 = timbrado.nomeRepresentante || 'Representante Legal';
  const cpfRep1 = timbrado.cpfRepresentante || '';
  const cargoRep1 = timbrado.cargoRepresentante || 'Representante Legal';

  const nomeRep2 = timbrado.nomeRepresentante2?.trim() || '';
  const cpfRep2 = timbrado.cpfRepresentante2?.trim() || '';
  const cargoRep2 = timbrado.cargoRepresentante2 || 'Representante Legal';

  const temDoisRepresentantes = Boolean(nomeRep2 && (timbrado.assinaturaImagem2 || timbrado.nomeRepresentante2));

  if (temDoisRepresentantes) {
    // 2 colunas de assinaturas lado a lado
    const gap = 14;
    const colWidth = (contentWidth - gap) / 2;
    const col1Center = marginLeft + colWidth / 2;
    const col2Center = marginLeft + colWidth + gap + colWidth / 2;

    const sigW = 50;
    const sigH = 18;

    // Assinatura 1 configurada em Papel Timbrado
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

    // Assinatura 2 configurada em Papel Timbrado
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

    // Textos Coluna 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep1.toUpperCase(), col1Center, linhaY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(`CPF: ${cpfRep1}`, col1Center, linhaY + 7.5, { align: 'center' });
    doc.text(cargoRep1.toUpperCase(), col1Center, linhaY + 11, { align: 'center' });

    // Textos Coluna 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep2.toUpperCase(), col2Center, linhaY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(`CPF: ${cpfRep2}`, col2Center, linhaY + 7.5, { align: 'center' });
    doc.text(cargoRep2.toUpperCase(), col2Center, linhaY + 11, { align: 'center' });
  } else {
    // 1 assinatura centralizada
    const centerCol = pageWidth / 2;
    const sigW = 60;
    const sigH = 20;

    if (timbrado.assinaturaImagem && timbrado.assinaturaImagem.startsWith('data:image')) {
      try {
        renderizarImagemProporcional(
          doc,
          timbrado.assinaturaImagem,
          centerCol - sigW / 2,
          currentY,
          sigW,
          sigH
        );
      } catch {}
    }

    const linhaY = currentY + sigH + 1;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.line(centerCol - 42, linhaY, centerCol + 42, linhaY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep1.toUpperCase(), centerCol, linhaY + 4.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`CPF: ${cpfRep1}`, centerCol, linhaY + 8, { align: 'center' });
    doc.text(cargoRep1.toUpperCase(), centerCol, linhaY + 11.5, { align: 'center' });
  }

  // 9. RODAPÉ DECORATIVO (EMBLEMA NO CANTO INFERIOR DIREITO)
  try {
    const logoGws = gerarLogoGwsCanvas();
    if (logoGws) {
      doc.addImage(logoGws, 'PNG', pageWidth - 26, pageHeight - 20, 22, 16, undefined, 'FAST');
    }
  } catch {}

  // Linha final discreta no rodapé
  doc.setDrawColor(15, 44, 89);
  doc.setLineWidth(0.5);
  doc.line(0, pageHeight - 4, pageWidth, pageHeight - 4);

  return doc.output('blob');
}

/**
 * Função utilitária para download do blob gerado
 */
export function baixarBlobDeclaracao(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
