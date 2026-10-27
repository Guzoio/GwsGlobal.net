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
  // 3. QUADRINHOS DOS CÁLCULOS DE CADA PRODUTO GANHO
  // =========================================================================
  const itens = dados.itensGanhos || [];

  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    const alturaQuadrinho = 38; // altura necessária para o card do item

    // Se não couber na página atual, cria uma nova página
    if (currentY + alturaQuadrinho > bottomLimit) {
      doc.addPage();
      currentY = desenharCabecalhoPagina();
    }

    const cardX = marginLeft;
    const cardY = currentY;
    const cardW = contentWidth;
    const cardH = alturaQuadrinho;

    // Fundo do card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

    // Faixa Superior do Quadrinho (Cabeçalho do Item)
    const ehPositivo = it.lucroLiquidoTotal >= 0;
    doc.setFillColor(15, 44, 89);
    doc.roundedRect(cardX, cardY, cardW, 8.5, 2, 2, 'F');
    // Retângulo para cobrir cantos inferiores da faixa superior
    doc.rect(cardX, cardY + 5, cardW, 3.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    const tituloItem = `ITEM #${it.num_item} — ${it.descricao_curta.toUpperCase()}`;
    const tituloTruncado = doc.splitTextToSize(tituloItem, cardW - 40)[0];
    doc.text(tituloTruncado, cardX + 3.5, cardY + 5.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    const qtdTexto = `Qtd: ${it.quantidade} un. | Marca: ${it.marca || 'Conforme Edital'}`;
    doc.text(qtdTexto, cardX + cardW - 3.5, cardY + 5.8, { align: 'right' });

    // Grid interno do Quadrinho: 3 Colunas de Dados Financeiros
    const colY = cardY + 12;
    const colW = (cardW - 7) / 3;

    // --- COLUNA 1: PREÇO ARREMATADO / FATURAMENTO ---
    const col1X = cardX + 3.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 44, 89);
    doc.text('1. PREÇO ARREMATADO (GANHO)', col1X, colY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text('Preço Unitário Ganho:', col1X, colY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(formatarMoeda(it.valor_ganho), col1X + colW - 4, colY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Faturamento Total:', col1X, colY + 8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatarMoeda(it.totalGanho), col1X + colW - 4, colY + 8.5, { align: 'right' });

    // Linha divisória vertical 1
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(col1X + colW, colY - 1, col1X + colW, cardY + cardH - 3);

    // --- COLUNA 2: COMPOSIÇÃO DE CUSTOS & TRIBUTOS ---
    const col2X = col1X + colW + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 44, 89);
    doc.text('2. CUSTOS DIRETOS & IMPOSTOS', col2X, colY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(`Custo Fornecedor (Unit.):`, col2X, colY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(formatarMoeda(it.custo_fornecedor), col2X + colW - 4, colY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Insumos / Compra:`, col2X, colY + 8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(formatarMoeda(it.totalCustoFornecedor), col2X + colW - 4, colY + 8.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Impostos (${it.aliquota_imposto}%):`, col2X, colY + 12.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`-${formatarMoeda(it.totalImposto)}`, col2X + colW - 4, colY + 12.5, { align: 'right' });

    if (it.outros_custos > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Logística / Frete:`, col2X, colY + 16.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text(`-${formatarMoeda(it.outros_custos)}`, col2X + colW - 4, colY + 16.5, { align: 'right' });
    }

    // Linha divisória vertical 2
    doc.setDrawColor(226, 232, 240);
    doc.line(col2X + colW, colY - 1, col2X + colW, cardY + cardH - 3);

    // --- COLUNA 3: RESULTADO & EXEQUIBILIDADE ---
    const col3X = col2X + colW + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 44, 89);
    doc.text('3. RESULTADO & MARGEM', col3X, colY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text('Lucro Líquido Unit.:', col3X, colY + 4.5);
    doc.setFont('helvetica', 'bold');
    if (ehPositivo) {
      doc.setTextColor(16, 120, 60);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    doc.text(formatarMoeda(it.lucroLiquidoUnit), col3X + colW - 6, colY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('Lucro Líquido Total:', col3X, colY + 8.5);
    doc.setFont('helvetica', 'bold');
    if (ehPositivo) {
      doc.setTextColor(16, 120, 60);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    doc.text(formatarMoeda(it.lucroLiquidoTotal), col3X + colW - 6, colY + 8.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('Margem Líquida:', col3X, colY + 12.5);
    doc.setFont('helvetica', 'bold');
    if (ehPositivo) {
      doc.setTextColor(16, 120, 60);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    doc.text(`${it.margemLiquidaPct.toFixed(2).replace('.', ',')}%`, col3X + colW - 6, colY + 12.5, { align: 'right' });

    // Badge de Conclusão da Exequibilidade
    const badgeY = colY + 17;
    doc.setFillColor(ehPositivo ? 220 : 254, ehPositivo ? 252 : 226, ehPositivo ? 231 : 226);
    doc.roundedRect(col3X - 1, badgeY, colW - 4, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    if (ehPositivo) {
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setTextColor(153, 27, 27);
    }
    const badgeTexto = ehPositivo ? '✓ PROPOSTA EXEQUÍVEL' : '⚠ MARGEM NEGATIVA';
    doc.text(badgeTexto, col3X + (colW - 5) / 2, badgeY + 3.8, { align: 'center' });

    currentY += cardH + 4;
  }

  // =========================================================================
  // 4. QUADRO SÍNTESE / RESUMO CONSOLIDADO DA LICITAÇÃO
  // =========================================================================
  const totGanhoGeral = itens.reduce((acc, it) => acc + it.totalGanho, 0);
  const totCustoFornecGeral = itens.reduce((acc, it) => acc + it.totalCustoFornecedor, 0);
  const totImpostosGeral = itens.reduce((acc, it) => acc + it.totalImposto, 0);
  const totOutrosGeral = itens.reduce((acc, it) => acc + (it.outros_custos || 0), 0);
  const totLucroGeral = itens.reduce((acc, it) => acc + it.lucroLiquidoTotal, 0);
  const margemMediaGeral = totGanhoGeral > 0 ? (totLucroGeral / totGanhoGeral) * 100 : 0;

  // Se o resumo consolidado não couber junto com preâmbulo de assinatura, quebra página
  if (currentY + 60 > bottomLimit) {
    doc.addPage();
    currentY = desenharCabecalhoPagina();
  }

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(15, 44, 89);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginLeft, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 44, 89);
  doc.text(
    `RESUMO CONSOLIDADO DE EXEQUIBILIDADE (${itens.length} ITENS GANHOS)`,
    marginLeft + 4,
    currentY + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const l1Y = currentY + 10;
  const l2Y = currentY + 14.5;

  doc.text(`Faturamento Total Ganho:`, marginLeft + 4, l1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatarMoeda(totGanhoGeral), marginLeft + 45, l1Y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Custo Total Fornecedores:`, marginLeft + 65, l1Y);
  doc.setFont('helvetica', 'bold');
  doc.text(formatarMoeda(totCustoFornecGeral), marginLeft + 108, l1Y);

  doc.setFont('helvetica', 'normal');
  doc.text(`Impostos Totais:`, marginLeft + 125, l1Y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`-${formatarMoeda(totImpostosGeral)}`, marginLeft + 155, l1Y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Despesas Logísticas:`, marginLeft + 4, l2Y);
  doc.setFont('helvetica', 'bold');
  doc.text(formatarMoeda(totOutrosGeral), marginLeft + 45, l2Y);

  doc.setFont('helvetica', 'normal');
  doc.text(`Lucro Líquido Total:`, marginLeft + 65, l2Y);
  doc.setFont('helvetica', 'bold');
  if (totLucroGeral >= 0) {
    doc.setTextColor(16, 120, 60);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(formatarMoeda(totLucroGeral), marginLeft + 108, l2Y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Margem Global:`, marginLeft + 125, l2Y);
  doc.setFont('helvetica', 'bold');
  if (totLucroGeral >= 0) {
    doc.setTextColor(16, 120, 60);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(`${margemMediaGeral.toFixed(2).replace('.', ',')}%`, marginLeft + 155, l2Y);

  currentY += 23;

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
