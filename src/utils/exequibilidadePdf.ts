import jsPDF from 'jspdf';
import { PapelTimbradoConfig } from '../types';
import { formatarMoeda } from './numberToWordsPtBr';
import { renderizarImagemProporcional } from './pdfImageHelper';

export interface ItemCalculoExequibilidade {
  id: number;
  num_item: number;
  descricao_curta: string;
  descricao_tecnica?: string;
  marca: string;
  quantidade: number;
  valor_unitario: number;
  valor_ganho: number; // Preço unitário arrematado / ganho
  custo_fornecedor: number; // Custo do fornecedor unitário
  aliquota_imposto: number; // % imposto sobre faturamento (ex: 10)
  outros_custos: number; // frete / outras taxas
  // Calculados
  totalGanho: number;
  totalCustoFornecedor: number;
  totalImposto: number;
  lucroLiquidoTotal: number;
  lucroLiquidoUnit: number;
  margemLiquidaPct: number;
}

export interface DadosExequibilidadeDocumento {
  modalidade: string;
  processoEdital: string;
  orgaoPublico: string;
  dataEmissao?: string;
  cidadeEmissao?: string;
  itensGanhos: ItemCalculoExequibilidade[];
  observacoes?: string;
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

  ctx.strokeStyle = 'rgba(15, 44, 89, 0.08)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(300, 270, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(15, 44, 89, 0.09)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(280, 250, 110, Math.PI * 0.75, Math.PI * 1.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(320, 290, 110, Math.PI * 1.75, Math.PI * 0.85);
  ctx.stroke();

  ctx.fillStyle = 'rgba(15, 44, 89, 0.11)';
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GWS Global', 300, 530);

  return canvas.toDataURL('image/png');
}

/**
 * Gera o logotipo estilizado da GWS Global para o cabeçalho
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
 * Formata a data atual em extenso no formato oficial
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

  const cidadeLimpa = cidade.replace(/,\s*em\s*$/, '').trim();
  return `${cidadeLimpa}, em ${dia} de ${mes} de ${ano}.`;
}

/**
 * Gera o documento PDF oficial de Exequibilidade de Preços e Composição de Custos
 */
export async function gerarExequibilidadePdf(
  dados: DadosExequibilidadeDocumento,
  timbrado: PapelTimbradoConfig
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginLeft = 16;
  const marginRight = 16;
  const contentWidth = pageWidth - marginLeft - marginRight; // 178 mm
  const bottomLimit = pageHeight - 22; // margem inferior antes de quebrar página

  // Dados da Empresa
  const razaoSocial = timbrado.razaoSocial || 'GWS GLOBAL LIMITADA';
  const cnpj = timbrado.cnpj || '53.080.207/0001-80';
  const inscricaoEstadual = timbrado.inscricaoEstadual || '47724530033';
  const endereco = timbrado.endereco || 'Rua Alpercata, nº 261, Bairro Ana Malaquias';
  const cidade = timbrado.cidadeEmissao || 'Timóteo - MG';
  const cep = '35182-183';
  const telefone = timbrado.telefone || '(31) 98694-9588 - (31) 99924-0111';
  const email = timbrado.email || 'gwsgloballimitada@gmail.com';

  const watermarkImg = gerarMarcaDaguaCanvas();

  // Função auxiliar para desenhar o cabeçalho em qualquer página
  function desenharCabecalhoPagina(): number {
    // 1. Marca d'água
    if (watermarkImg) {
      try {
        const wmSize = 135;
        const wmX = (pageWidth - wmSize) / 2;
        const wmY = 95;
        doc.addImage(watermarkImg, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
      } catch {}
    }

    // 2. Cabeçalho configurado em Papel Timbrado ou padrão tipográfico
    if (timbrado.cabecalhoImagem && timbrado.cabecalhoImagem.startsWith('data:image')) {
      try {
        const headerH = timbrado.alturaCabecalhoMm || 26;
        doc.addImage(timbrado.cabecalhoImagem, 'PNG', 0, 0, pageWidth, headerH, undefined, 'FAST');
        return headerH + 5;
      } catch {}
    }

    // Fallback tipográfico oficial
    try {
      const logoGws = gerarLogoGwsCanvas();
      if (logoGws) {
        doc.addImage(logoGws, 'PNG', marginLeft, 6, 26, 17, undefined, 'FAST');
      }
    } catch {}

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const infoX = marginLeft + 30;
    const infoWidth = contentWidth - 30;

    doc.text(`Endereço: ${endereco}`, infoX + infoWidth / 2, 9, { align: 'center' });
    doc.text(`Cidade: ${cidade}, CEP: ${cep}`, infoX + infoWidth / 2, 13, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(
      `CONTATO: ${telefone}      CNPJ: ${cnpj}`,
      infoX + infoWidth / 2,
      17,
      { align: 'center' }
    );
    doc.text(
      `E-MAIL: ${email}      INSC. EST: ${inscricaoEstadual}`,
      infoX + infoWidth / 2,
      21,
      { align: 'center' }
    );

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 24, pageWidth - marginRight, 24);

    return 29;
  }

  // Função auxiliar para desenhar o rodapé padrão em todas as páginas
  function desenharRodapePagina(paginaAtual: number, totalPaginas: number) {
    if (timbrado.rodapeImagem && timbrado.rodapeImagem.startsWith('data:image')) {
      try {
        const footH = timbrado.alturaRodapeMm || 16;
        doc.addImage(timbrado.rodapeImagem, 'PNG', 0, pageHeight - footH, pageWidth, footH, undefined, 'FAST');
        return;
      } catch {}
    }

    doc.setDrawColor(15, 44, 89);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${razaoSocial} • CNPJ: ${cnpj} • ${email}`,
      marginLeft,
      pageHeight - 8
    );
    doc.text(
      `Página ${paginaAtual} de ${totalPaginas}`,
      pageWidth - marginRight,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  let currentY = desenharCabecalhoPagina();

  // =========================================================================
  // 1. TÍTULO OFICIAL DO DOCUMENTO
  // =========================================================================
  let modTexto = (dados.modalidade || 'PREGÃO ELETRÔNICO').trim().toUpperCase();
  let editalTexto = (dados.processoEdital || '').trim();
  if (editalTexto && !editalTexto.toUpperCase().startsWith('Nº') && !editalTexto.toUpperCase().startsWith('NO')) {
    editalTexto = `Nº ${editalTexto}`;
  }
  const orgaoTexto = (dados.orgaoPublico || 'ÓRGÃO PÚBLICO LICITANTE').trim().toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 44, 89);
  doc.text(`${modTexto} ${editalTexto}`.trim(), marginLeft, currentY);

  currentY += 4.8;
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`ÓRGÃO: ${orgaoTexto}`, marginLeft, currentY);

  currentY += 6;

  // Tarja de destaque do título
  doc.setFillColor(15, 44, 89);
  doc.roundedRect(marginLeft, currentY, contentWidth, 9.5, 1.2, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'DECLARAÇÃO & DEMONSTRAÇÃO DE EXEQUIBILIDADE DE PREÇOS',
    pageWidth / 2,
    currentY + 6.2,
    { align: 'center' }
  );

  currentY += 13;

  // =========================================================================
  // 2. PREÂMBULO JURÍDICO FORMAL (LEI 14.133/2021 ART. 59, III)
  // =========================================================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const preambulo = `A empresa ${razaoSocial}, inscrita no CNPJ sob o nº ${cnpj}, sediada na ${endereco}, ${cidade}, por intermédio de seu representante legal, apresenta tempestivamente a presente PLANILHA DE COMPOSIÇÃO DE CUSTOS E FORMAÇÃO DE PREÇOS dos itens arrematados/ganhos no certame em epígrafe, comprovando analiticamente a plena EXEQUIBILIDADE de sua proposta (art. 59, III da Lei Federal nº 14.133/2021). Demonstra-se que os preços pactuados cobrem com segurança todos os custos de aquisição, tributos e logística, assegurando a fiel entrega dos produtos.`;

  const linhasPreambulo = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(linhasPreambulo, marginLeft, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += linhasPreambulo.length * 3.8 + 4;

  // =========================================================================
  // 3. PLANILHA DE COMPOSIÇÃO DE CUSTOS E FORMAÇÃO DE PREÇOS (ESTILO PLANILHA)
  // =========================================================================
  const itens = dados.itensGanhos || [];

  // Totais consolidados pré-calculados
  const totGanhoGeral = itens.reduce((acc, it) => acc + it.totalGanho, 0);
  const totCustoFornecGeral = itens.reduce((acc, it) => acc + it.totalCustoFornecedor, 0);
  const totImpostosGeral = itens.reduce((acc, it) => acc + it.totalImposto, 0);
  const totOutrosGeral = itens.reduce((acc, it) => acc + (it.outros_custos || 0), 0);
  const totLucroGeral = itens.reduce((acc, it) => acc + it.lucroLiquidoTotal, 0);
  const margemMediaGeral = totGanhoGeral > 0 ? (totLucroGeral / totGanhoGeral) * 100 : 0;

  // Definição das colunas da planilha (Soma exata = 178mm)
  const cols = [
    { id: 'item', title: 'Item', width: 9, align: 'center' },
    { id: 'desc', title: 'Descrição & Marca', width: 37, align: 'left' },
    { id: 'qtd', title: 'Qtd', width: 9, align: 'center' },
    { id: 'custoUnit', title: 'Custo Un.', width: 15, align: 'right' },
    { id: 'custoTot', title: 'Custo Tot.', width: 18, align: 'right' },
    { id: 'tribFrete', title: 'Trib./Frete', width: 18, align: 'right' },
    { id: 'prGanho', title: 'Pr. Ganho', width: 16, align: 'right' },
    { id: 'faturamento', title: 'Faturamento', width: 19, align: 'right' },
    { id: 'lucro', title: 'Lucro Líq.', width: 18, align: 'right' },
    { id: 'parecer', title: 'Margem/Parecer', width: 19, align: 'center' },
  ];

  // Função interna para desenhar o cabeçalho da planilha
  const desenharCabecalhoTabela = (yPos: number): number => {
    // Título da planilha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(15, 44, 89);
    doc.text(
      `PLANILHA ANALÍTICA DE COMPOSIÇÃO DE CUSTOS E FORMAÇÃO DE PREÇOS (${itens.length} ITENS)`,
      marginLeft,
      yPos
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Valores em Reais (R$) • Apuração Analítica', pageWidth - marginRight, yPos, {
      align: 'right',
    });

    const headerY = yPos + 2.5;
    const headerH = 6.8;

    // Fundo do cabeçalho da tabela
    doc.setFillColor(15, 44, 89);
    doc.rect(marginLeft, headerY, contentWidth, headerH, 'F');

    // Texto dos cabeçalhos das colunas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(255, 255, 255);

    let curX = marginLeft;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      let textX = curX + 1.5;
      if (col.align === 'center') {
        textX = curX + col.width / 2;
      } else if (col.align === 'right') {
        textX = curX + col.width - 1.5;
      }

      doc.text(col.title, textX, headerY + 4.5, {
        align: col.align as 'left' | 'center' | 'right',
      });

      // Linha vertical divisória sutil
      if (c < cols.length - 1) {
        doc.setDrawColor(27, 59, 111);
        doc.setLineWidth(0.2);
        doc.line(curX + col.width, headerY, curX + col.width, headerY + headerH);
      }
      curX += col.width;
    }

    return headerY + headerH;
  };

  // Se o início da tabela não couber, cria nova página
  if (currentY + 25 > bottomLimit) {
    doc.addPage();
    currentY = desenharCabecalhoPagina();
  }

  currentY = desenharCabecalhoTabela(currentY);

  // Renderização das linhas da planilha (estilo Excel/planilha contábil)
  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    const ehPositivo = it.lucroLiquidoTotal >= 0;
    const temFrete = it.outros_custos > 0;
    const rowH = temFrete ? 9.0 : 7.6;

    // Se a linha ultrapassar o limite inferior, quebra a página e redesenha o cabeçalho
    if (currentY + rowH + 15 > bottomLimit) {
      doc.addPage();
      currentY = desenharCabecalhoPagina();
      currentY = desenharCabecalhoTabela(currentY);
    }

    const rowY = currentY;

    // Fundo zebra alternado
    if (i % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(marginLeft, rowY, contentWidth, rowH, 'F');

    // Borda inferior da linha
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, rowY + rowH, marginLeft + contentWidth, rowY + rowH);

    // Linhas verticais da grade
    let gridX = marginLeft;
    for (let c = 0; c < cols.length; c++) {
      gridX += cols[c].width;
      doc.line(gridX, rowY, gridX, rowY + rowH);
    }

    // --- COLUNA 0: ITEM ---
    let colX = marginLeft;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(`#${it.num_item}`, colX + cols[0].width / 2, rowY + 4.8, { align: 'center' });

    // --- COLUNA 1: DESCRIÇÃO & MARCA ---
    colX += cols[0].width;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(30, 41, 59);
    const descTruncada = doc.splitTextToSize(it.descricao_curta.toUpperCase(), cols[1].width - 2)[0];
    doc.text(descTruncada, colX + 1.2, rowY + 3.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    const marcaTexto = `Marca: ${(it.marca || 'Conforme Edital').slice(0, 22)}`;
    doc.text(marcaTexto, colX + 1.2, rowY + 6.6);

    // --- COLUNA 2: QUANTIDADE ---
    colX += cols[1].width;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(30, 41, 59);
    doc.text(`${it.quantidade} un`, colX + cols[2].width / 2, rowY + 4.8, { align: 'center' });

    // --- COLUNA 3: CUSTO UNITÁRIO ---
    colX += cols[2].width;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(51, 65, 85);
    doc.text(formatarMoeda(it.custo_fornecedor), colX + cols[3].width - 1.2, rowY + 4.8, {
      align: 'right',
    });

    // --- COLUNA 4: CUSTO INSUMOS TOTAL ---
    colX += cols[3].width;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(15, 23, 42);
    doc.text(formatarMoeda(it.totalCustoFornecedor), colX + cols[4].width - 1.2, rowY + 4.8, {
      align: 'right',
    });

    // --- COLUNA 5: TRIBUTOS & FRETE ---
    colX += cols[4].width;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(185, 28, 28);
    doc.text(`-${formatarMoeda(it.totalImposto)}`, colX + cols[5].width - 1.2, rowY + 3.5, {
      align: 'right',
    });

    if (temFrete) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.0);
      doc.setTextColor(100, 116, 139);
      doc.text(`Frete -${formatarMoeda(it.outros_custos)}`, colX + cols[5].width - 1.2, rowY + 7.2, {
        align: 'right',
      });
    }

    // --- COLUNA 6: PREÇO GANHO UNITÁRIO ---
    colX += cols[5].width;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(51, 65, 85);
    doc.text(formatarMoeda(it.valor_ganho), colX + cols[6].width - 1.2, rowY + 4.8, {
      align: 'right',
    });

    // --- COLUNA 7: FATURAMENTO TOTAL ---
    colX += cols[6].width;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);
    doc.text(formatarMoeda(it.totalGanho), colX + cols[7].width - 1.2, rowY + 4.8, {
      align: 'right',
    });

    // --- COLUNA 8: LUCRO LÍQUIDO TOTAL ---
    colX += cols[7].width;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    if (ehPositivo) {
      doc.setTextColor(16, 120, 60);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    doc.text(formatarMoeda(it.lucroLiquidoTotal), colX + cols[8].width - 1.2, rowY + 4.8, {
      align: 'right',
    });

    // --- COLUNA 9: MARGEM & PARECER ---
    colX += cols[8].width;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    if (ehPositivo) {
      doc.setTextColor(16, 120, 60);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    const textoMargem = `${it.margemLiquidaPct.toFixed(1).replace('.', ',')}%`;
    doc.text(textoMargem, colX + cols[9].width / 2, rowY + 3.5, { align: 'center' });

    // Badge Exeq. / Neg.
    doc.setFillColor(ehPositivo ? 220 : 254, ehPositivo ? 252 : 226, ehPositivo ? 231 : 226);
    doc.roundedRect(colX + 2, rowY + 4.5, cols[9].width - 4, 3.4, 0.6, 0.6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    if (ehPositivo) {
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setTextColor(153, 27, 27);
    }
    doc.text(ehPositivo ? '✓ EXEQ.' : '⚠ NEG.', colX + cols[9].width / 2, rowY + 6.9, {
      align: 'center',
    });

    currentY += rowH;
  }

  // =========================================================================
  // LINHA DE TOTAIS CONSOLIDADOS DA PLANILHA (RODAPÉ DA TABELA)
  // =========================================================================
  const totRowH = 7.5;
  if (currentY + totRowH + 30 > bottomLimit) {
    doc.addPage();
    currentY = desenharCabecalhoPagina();
  }

  doc.setFillColor(235, 241, 246);
  doc.rect(marginLeft, currentY, contentWidth, totRowH, 'F');

  doc.setDrawColor(15, 44, 89);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);
  doc.line(marginLeft, currentY + totRowH, marginLeft + contentWidth, currentY + totRowH);

  // Linhas verticais nos totais
  let totGridX = marginLeft;
  for (let c = 0; c < cols.length; c++) {
    totGridX += cols[c].width;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(totGridX, currentY, totGridX, currentY + totRowH);
  }

  // Rótulo Totais Consolidados (engloba cols 0, 1, 2, 3)
  const span1W = cols[0].width + cols[1].width + cols[2].width + cols[3].width;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(15, 44, 89);
  doc.text(
    `TOTAIS CONSOLIDADOS (${itens.length} ITENS)`,
    marginLeft + 2,
    currentY + 4.9
  );

  // Coluna 4: Total Insumos
  let totColX = marginLeft + span1W;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(formatarMoeda(totCustoFornecGeral), totColX + cols[4].width - 1.2, currentY + 4.9, {
    align: 'right',
  });

  // Coluna 5: Total Tributos + Frete
  totColX += cols[4].width;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.0);
  doc.setTextColor(185, 28, 28);
  doc.text(
    `-${formatarMoeda(totImpostosGeral + totOutrosGeral)}`,
    totColX + cols[5].width - 1.2,
    currentY + 4.9,
    { align: 'right' }
  );

  // Coluna 6: Preço Ganho traço
  totColX += cols[5].width;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('—', totColX + cols[6].width / 2, currentY + 4.9, { align: 'center' });

  // Coluna 7: Faturamento Total
  totColX += cols[6].width;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  doc.setTextColor(15, 44, 89);
  doc.text(formatarMoeda(totGanhoGeral), totColX + cols[7].width - 1.2, currentY + 4.9, {
    align: 'right',
  });

  // Coluna 8: Lucro Líquido Consolidado
  totColX += cols[7].width;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  if (totLucroGeral >= 0) {
    doc.setTextColor(16, 120, 60);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(formatarMoeda(totLucroGeral), totColX + cols[8].width - 1.2, currentY + 4.9, {
    align: 'right',
  });

  // Coluna 9: Margem Média Global
  totColX += cols[8].width;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  if (totLucroGeral >= 0) {
    doc.setTextColor(16, 120, 60);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(
    `${margemMediaGeral.toFixed(1).replace('.', ',')}%`,
    totColX + cols[9].width / 2,
    currentY + 4.9,
    { align: 'center' }
  );

  currentY += totRowH + 4;

  // =========================================================================
  // 4. DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE SINTÉTICO)
  // =========================================================================
  if (currentY + 48 > bottomLimit) {
    doc.addPage();
    currentY = desenharCabecalhoPagina();
  }

  const dreH = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(15, 44, 89);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginLeft, currentY, contentWidth, dreH, 1.2, 1.2, 'FD');

  // Tarja DRE
  doc.setFillColor(15, 44, 89);
  doc.rect(marginLeft, currentY, contentWidth, 5.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'DEMONSTRATIVO SINTÉTICO DO RESULTADO DA PROPOSTA (DRE DA LICITAÇÃO)',
    marginLeft + 3,
    currentY + 3.8
  );

  // Grid com 4 colunas contábeis
  const dreColW = (contentWidth - 6) / 4;
  const dreY1 = currentY + 8.8;
  const dreY2 = currentY + 13.5;
  const dreY3 = currentY + 18.2;

  // Coluna DRE 1: Receita Bruta
  const c1X = marginLeft + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEITA BRUTA (FATURAMENTO)', c1X, dreY1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 44, 89);
  doc.text(formatarMoeda(totGanhoGeral), c1X, dreY2 + 0.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text('100,00% da Proposta Ganha', c1X, dreY3);

  // Divisória DRE 1
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(c1X + dreColW, currentY + 6, c1X + dreColW, currentY + dreH - 1.5);

  // Coluna DRE 2: Custos de Aquisição (CPV)
  const c2X = c1X + dreColW + 2.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text('(-) CUSTO PRODUTOS / FORNECEDOR', c2X, dreY1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 41, 59);
  doc.text(formatarMoeda(totCustoFornecGeral), c2X, dreY2 + 0.5);
  const cpvPct = totGanhoGeral > 0 ? (totCustoFornecGeral / totGanhoGeral) * 100 : 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${cpvPct.toFixed(1).replace('.', ',')}% do faturamento`, c2X, dreY3);

  // Divisória DRE 2
  doc.line(c2X + dreColW, currentY + 6, c2X + dreColW, currentY + dreH - 1.5);

  // Coluna DRE 3: Tributos & Fretes
  const c3X = c2X + dreColW + 2.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text('(-) TRIBUTOS E FRETE OPERACIONAL', c3X, dreY1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(185, 28, 28);
  doc.text(`-${formatarMoeda(totImpostosGeral + totOutrosGeral)}`, c3X, dreY2 + 0.5);
  const tribPct =
    totGanhoGeral > 0 ? ((totImpostosGeral + totOutrosGeral) / totGanhoGeral) * 100 : 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${tribPct.toFixed(1).replace('.', ',')}% (impostos + logística)`, c3X, dreY3);

  // Divisória DRE 3
  doc.line(c3X + dreColW, currentY + 6, c3X + dreColW, currentY + dreH - 1.5);

  // Coluna DRE 4: Lucro Líquido Final & Parecer
  const c4X = c3X + dreColW + 2.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text('(=) RESULTADO LÍQUIDO (LUCRO)', c4X, dreY1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  if (totLucroGeral >= 0) {
    doc.setTextColor(16, 120, 60);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(formatarMoeda(totLucroGeral), c4X, dreY2 + 0.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.6);
  const statusDRE = totLucroGeral >= 0 ? '✓ PROPOSTA 100% EXEQUÍVEL' : '⚠ MARGEM DEFICITÁRIA';
  doc.text(statusDRE, c4X, dreY3);

  currentY += dreH + 4.5;

  // =========================================================================
  // 5. DECLARAÇÃO FORMAL DE COMPROMISSO & VERACIDADE
  // =========================================================================
  if (currentY + 45 > bottomLimit) {
    doc.addPage();
    currentY = desenharCabecalhoPagina();
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);

  const textoCompromisso =
    'Declaramos sob as penas da lei a veracidade integral das informações e parâmetros de formação de custos retro mencionados. Afirmamos possuir solidez econômico-financeira, capacidade técnica e canais de fornecimento homologados que asseguram o estrito cumprimento de todas as obrigações editalícias nos preços pactuados, sem risco de inadimplemento ou rescisão contratual.';

  const linhasCompromisso = doc.splitTextToSize(textoCompromisso, contentWidth);
  doc.text(linhasCompromisso, marginLeft, currentY, { maxWidth: contentWidth, align: 'justify' });

  currentY += linhasCompromisso.length * 3.8 + 5;

  // =========================================================================
  // 6. DATA POR EXTENSO
  // =========================================================================
  const cidadeFinal = dados.cidadeEmissao || timbrado.cidadeEmissao || 'Timóteo - MG';
  const dataFinalTexto = formatarDataPorExtenso(dados.dataEmissao, cidadeFinal);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dataFinalTexto, marginLeft, currentY);

  currentY += 8;

  // =========================================================================
  // 7. ASSINATURAS OFICIAIS CONFIGURADAS EM PAPEL TIMBRADO
  // =========================================================================
  if (currentY + 28 > bottomLimit) {
    doc.addPage();
    currentY = desenharCabecalhoPagina();
  }

  const nomeRep1 = timbrado.nomeRepresentante || 'Representante Legal';
  const cpfRep1 = timbrado.cpfRepresentante || '';
  const cargoRep1 = timbrado.cargoRepresentante || 'Sócio Administrador';

  const nomeRep2 = timbrado.nomeRepresentante2?.trim() || '';
  const cpfRep2 = timbrado.cpfRepresentante2?.trim() || '';
  const cargoRep2 = timbrado.cargoRepresentante2?.trim() || 'Sócio';

  const temDuasAssinaturas = Boolean(
    nomeRep2 && (timbrado.assinaturaImagem2 || timbrado.nomeRepresentante2)
  );

  if (temDuasAssinaturas) {
    const col1Center = marginLeft + contentWidth / 4;
    const col2Center = marginLeft + (3 * contentWidth) / 4;
    const sigW = 46;
    const sigH = 15;

    // Assinatura 1
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

    // Assinatura 2
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
    doc.line(col1Center - 28, linhaY, col1Center + 28, linhaY);
    doc.line(col2Center - 28, linhaY, col2Center + 28, linhaY);

    // Representante 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep1.toUpperCase(), col1Center, linhaY + 3.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(`CPF: ${cpfRep1}`, col1Center, linhaY + 7, { align: 'center' });
    doc.text(cargoRep1.toUpperCase(), col1Center, linhaY + 10, { align: 'center' });

    // Representante 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep2.toUpperCase(), col2Center, linhaY + 3.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(`CPF: ${cpfRep2}`, col2Center, linhaY + 7, { align: 'center' });
    doc.text(cargoRep2.toUpperCase(), col2Center, linhaY + 10, { align: 'center' });
  } else {
    // 1 assinatura centralizada
    const centerCol = pageWidth / 2;
    const sigW = 52;
    const sigH = 16;

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
    doc.line(centerCol - 36, linhaY, centerCol + 36, linhaY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(nomeRep1.toUpperCase(), centerCol, linhaY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`CPF: ${cpfRep1}`, centerCol, linhaY + 7.5, { align: 'center' });
    doc.text(cargoRep1.toUpperCase(), centerCol, linhaY + 10.5, { align: 'center' });
  }

  // =========================================================================
  // 8. DESENHA RODAPÉ COM PAGINAÇÃO EM TODAS AS PÁGINAS GERADAS
  // =========================================================================
  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    desenharRodapePagina(p, totalPaginas);
  }

  return doc.output('blob');
}

/**
 * Função utilitária para download do blob gerado
 */
export function baixarBlobExequibilidade(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
