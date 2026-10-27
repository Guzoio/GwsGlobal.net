import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PapelTimbradoConfig } from '../types';

export interface AssinaturaItemConfig {
  imagemBase64: string;
  nome: string;
  cpf?: string;
  cargo?: string;
  empresa?: string;
  cnpj?: string;
  incluirLinha?: boolean;
  incluirDadosTexto?: boolean;
  incluirCarimboDigital?: boolean;
  dataHoraCarimbo?: string;
  cidadeUf?: string;
  larguraMm?: number; // padrão ~50mm
}

export interface AssinarPdfParams {
  pdfBytes: ArrayBuffer | Uint8Array;
  paginaAlvo: number; // 1-indexado
  posicaoXPercent: number; // 0 a 100 (% a partir da esquerda)
  posicaoYPercent: number; // 0 a 100 (% a partir do topo)
  larguraPercent: number; // % da largura da página
  assinatura: AssinaturaItemConfig;
  aplicarRubricaDemaisPaginas?: boolean;
  posicaoRubrica?: 'inferior_direito' | 'inferior_esquerdo';
  rubricaImagemBase64?: string;
}

/**
 * Sanitiza texto para fontes padrão do PDF (Helvetica / WinAnsi).
 * Substitui caracteres especiais não suportados por equivalentes legíveis para evitar erro de codificação.
 */
export function sanitizarTextoPdf(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, ' '); // Mantém Latin-1 (á, é, í, ó, ú, ç, ã, etc.)
}

/**
 * Converte base64 data URL em Uint8Array
 */
function base64ToUint8Array(dataUrl: string): { bytes: Uint8Array; formato: 'png' | 'jpg' } {
  let raw = dataUrl.trim();
  let formato: 'png' | 'jpg' = 'png';

  if (raw.startsWith('data:')) {
    if (raw.includes('image/jpeg') || raw.includes('image/jpg')) {
      formato = 'jpg';
    }
    const idx = raw.indexOf(',');
    if (idx !== -1) {
      raw = raw.substring(idx + 1);
    }
  }

  // Decodifica Base64
  const binaryString = atob(raw);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return { bytes, formato };
}

/**
 * Estampa assinatura digital com imagem do Papel Timbrado sobre o PDF existente
 */
export async function assinarPdf(params: AssinarPdfParams): Promise<Uint8Array> {
  const {
    pdfBytes,
    paginaAlvo,
    posicaoXPercent,
    posicaoYPercent,
    larguraPercent,
    assinatura,
    aplicarRubricaDemaisPaginas,
    posicaoRubrica = 'inferior_direito',
    rubricaImagemBase64,
  } = params;

  // Garante que pdfBytes seja válido, não-nulo e não-vazio
  let inputBytes: Uint8Array;
  if (pdfBytes instanceof Uint8Array) {
    if (pdfBytes.byteLength === 0) {
      throw new Error('O buffer do documento PDF está vazio (0 bytes). Recarregue o arquivo.');
    }
    inputBytes = new Uint8Array(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength));
  } else if (pdfBytes instanceof ArrayBuffer) {
    if (pdfBytes.byteLength === 0) {
      throw new Error('O buffer do documento PDF está vazio (0 bytes). Recarregue o arquivo.');
    }
    inputBytes = new Uint8Array(pdfBytes.slice(0));
  } else {
    throw new Error('Formato de dados do PDF inválido.');
  }

  const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const totalPaginas = pdfDoc.getPageCount();

  if (paginaAlvo < 1 || paginaAlvo > totalPaginas) {
    throw new Error(`Página inválida: ${paginaAlvo}. O documento possui ${totalPaginas} página(s).`);
  }

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Embebe a imagem da assinatura principal
  let embeddedAssinatura;
  try {
    const { bytes, formato } = base64ToUint8Array(assinatura.imagemBase64);
    if (formato === 'jpg') {
      embeddedAssinatura = await pdfDoc.embedJpg(bytes);
    } else {
      embeddedAssinatura = await pdfDoc.embedPng(bytes);
    }
  } catch (err) {
    console.warn('Erro ao embutir PNG/JPG da assinatura:', err);
    throw new Error('Não foi possível ler a imagem da assinatura. Verifique o formato.');
  }

  // 2. Embebe rúbrica se solicitada
  let embeddedRubrica = embeddedAssinatura;
  if (aplicarRubricaDemaisPaginas && rubricaImagemBase64 && rubricaImagemBase64 !== assinatura.imagemBase64) {
    try {
      const { bytes, formato } = base64ToUint8Array(rubricaImagemBase64);
      embeddedRubrica = formato === 'jpg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
    } catch {
      embeddedRubrica = embeddedAssinatura;
    }
  }

  // Processa a página de assinatura
  const targetPage = pdfDoc.getPage(paginaAlvo - 1);
  const { width: pageWidth, height: pageHeight } = targetPage.getSize();

  // Dimensões da assinatura na página em pontos PDF (1 polegada = 72 pt)
  const stampWidthPt = Math.max(80, Math.min(pageWidth * 0.9, (larguraPercent / 100) * pageWidth));
  const imgAspect = embeddedAssinatura.width / embeddedAssinatura.height;
  const imgWidthPt = stampWidthPt;
  const imgHeightPt = imgWidthPt / imgAspect;

  // Calcula coordenadas PDF:
  // No navegador: (0,0) topo-esquerdo.
  // No PDF: (0,0) canto inferior-esquerdo.
  const stampX = (posicaoXPercent / 100) * pageWidth;

  // Altura total estimada do bloco (imagem + textos opcionais)
  let alturaTextoPt = 0;
  if (assinatura.incluirDadosTexto) {
    alturaTextoPt += 28; // nome, cargo, cpf
    if (assinatura.empresa || assinatura.cnpj) alturaTextoPt += 12;
  }
  if (assinatura.incluirCarimboDigital) {
    alturaTextoPt += 22; // carimbo data/hora
  }
  if (assinatura.incluirLinha) {
    alturaTextoPt += 6;
  }

  const alturaTotalBlocoPt = imgHeightPt + alturaTextoPt;
  // Converte Y do topo para Y da base do PDF
  const stampTopY = pageHeight - (posicaoYPercent / 100) * pageHeight;
  const stampBottomY = stampTopY - alturaTotalBlocoPt;

  // Garante que não saia das bordas
  const safeX = Math.max(10, Math.min(pageWidth - stampWidthPt - 10, stampX));
  const safeBottomY = Math.max(10, Math.min(pageHeight - alturaTotalBlocoPt - 10, stampBottomY));

  // Desenha a imagem da assinatura
  const imgY = safeBottomY + alturaTextoPt;
  targetPage.drawImage(embeddedAssinatura, {
    x: safeX,
    y: imgY,
    width: imgWidthPt,
    height: imgHeightPt,
  });

  // Linha divisória de assinatura
  let currentTextY = imgY - 4;
  if (assinatura.incluirLinha) {
    targetPage.drawLine({
      start: { x: safeX, y: currentTextY },
      end: { x: safeX + imgWidthPt, y: currentTextY },
      thickness: 0.75,
      color: rgb(0.2, 0.25, 0.3),
    });
    currentTextY -= 8;
  }

  // Textos abaixo da assinatura
  if (assinatura.incluirDadosTexto) {
    if (assinatura.nome) {
      const nomeText = sanitizarTextoPdf(assinatura.nome);
      targetPage.drawText(nomeText, {
        x: safeX,
        y: currentTextY,
        size: 9.5,
        font: helveticaBold,
        color: rgb(0.08, 0.12, 0.2),
      });
      currentTextY -= 11;
    }

    const subTextos: string[] = [];
    if (assinatura.cargo) subTextos.push(sanitizarTextoPdf(assinatura.cargo));
    if (assinatura.cpf) subTextos.push(`CPF: ${sanitizarTextoPdf(assinatura.cpf)}`);

    if (subTextos.length > 0) {
      targetPage.drawText(subTextos.join(' • '), {
        x: safeX,
        y: currentTextY,
        size: 8,
        font: helvetica,
        color: rgb(0.25, 0.3, 0.35),
      });
      currentTextY -= 10;
    }

    if (assinatura.empresa || assinatura.cnpj) {
      const empParts: string[] = [];
      if (assinatura.empresa) empParts.push(sanitizarTextoPdf(assinatura.empresa));
      if (assinatura.cnpj) empParts.push(`CNPJ: ${sanitizarTextoPdf(assinatura.cnpj)}`);
      targetPage.drawText(empParts.join(' - '), {
        x: safeX,
        y: currentTextY,
        size: 7.5,
        font: helvetica,
        color: rgb(0.35, 0.4, 0.45),
      });
      currentTextY -= 10;
    }
  }

  // Carimbo digital com moldura sutil
  if (assinatura.incluirCarimboDigital) {
    const dataHora = assinatura.dataHoraCarimbo || new Date().toLocaleString('pt-BR');
    const local = assinatura.cidadeUf ? `${sanitizarTextoPdf(assinatura.cidadeUf)} - ` : '';
    const carimboMsg = sanitizarTextoPdf(`Assinado digitalmente por ${assinatura.nome || 'Representante'} | ${local}${dataHora}`);

    targetPage.drawRectangle({
      x: safeX - 3,
      y: currentTextY - 5,
      width: Math.min(imgWidthPt + 6, 280),
      height: 14,
      color: rgb(0.95, 0.97, 1.0),
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 0.5,
    });

    targetPage.drawText(carimboMsg, {
      x: safeX,
      y: currentTextY - 1,
      size: 6.5,
      font: helvetica,
      color: rgb(0.12, 0.28, 0.6),
    });
  }

  // 3. Aplica rúbrica nas demais páginas se habilitado
  if (aplicarRubricaDemaisPaginas && totalPaginas > 1 && embeddedRubrica) {
    const rubricaWidthPt = 55;
    const rubAspect = embeddedRubrica.width / embeddedRubrica.height;
    const rubricaHeightPt = rubricaWidthPt / rubAspect;

    for (let pIdx = 0; pIdx < totalPaginas; pIdx++) {
      if (pIdx === paginaAlvo - 1) continue; // Pula a página que já tem a assinatura completa

      const pag = pdfDoc.getPage(pIdx);
      const { width: pW } = pag.getSize();

      let rx = pW - rubricaWidthPt - 25;
      if (posicaoRubrica === 'inferior_esquerdo') {
        rx = 25;
      }
      const ry = 22; // Canto inferior

      pag.drawImage(embeddedRubrica, {
        x: rx,
        y: ry,
        width: rubricaWidthPt,
        height: rubricaHeightPt,
      });

      // Linha sutil de rúbrica
      pag.drawLine({
        start: { x: rx, y: ry - 2 },
        end: { x: rx + rubricaWidthPt, y: ry - 2 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Texto minúsculo "Rúbrica"
      pag.drawText(sanitizarTextoPdf('Rúbrica Digital'), {
        x: rx,
        y: ry - 8,
        size: 5.5,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Cria perfis de assinatura a partir da configuração de Papel Timbrado salva
 */
export function extrairAssinaturasTimbrado(timbrado: PapelTimbradoConfig): {
  id: string;
  rotulo: string;
  subtitulo: string;
  imagemBase64: string;
  nome: string;
  cpf: string;
  cargo: string;
  empresa: string;
  cnpj: string;
}[] {
  const lista: {
    id: string;
    rotulo: string;
    subtitulo: string;
    imagemBase64: string;
    nome: string;
    cpf: string;
    cargo: string;
    empresa: string;
    cnpj: string;
  }[] = [];

  // Assinatura 1
  if (timbrado.assinaturaImagem) {
    lista.push({
      id: 'principal',
      rotulo: timbrado.nomeRepresentante || 'Responsável Principal',
      subtitulo: timbrado.cargoRepresentante || 'Representante Legal',
      imagemBase64: timbrado.assinaturaImagem,
      nome: timbrado.nomeRepresentante || '',
      cpf: timbrado.cpfRepresentante || '',
      cargo: timbrado.cargoRepresentante || 'Representante Legal',
      empresa: timbrado.razaoSocial || timbrado.nomeEmpresa || '',
      cnpj: timbrado.cnpj || '',
    });
  }

  // Assinatura 2 (se cadastrada)
  if (timbrado.assinaturaImagem2) {
    lista.push({
      id: 'secundaria',
      rotulo: timbrado.nomeRepresentante2 || '2º Representante',
      subtitulo: timbrado.cargoRepresentante2 || 'Representante Legal',
      imagemBase64: timbrado.assinaturaImagem2,
      nome: timbrado.nomeRepresentante2 || '',
      cpf: timbrado.cpfRepresentante2 || '',
      cargo: timbrado.cargoRepresentante2 || 'Representante Legal',
      empresa: timbrado.razaoSocial || timbrado.nomeEmpresa || '',
      cnpj: timbrado.cnpj || '',
    });
  }

  return lista;
}

/**
 * Dispara download do arquivo PDF assinado
 */
export function baixarBlobPdfBytes(bytes: Uint8Array, nomeOriginal: string): void {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  // Remove .pdf do final se tiver
  let baseName = nomeOriginal.replace(/\.pdf$/i, '');
  if (!baseName.trim()) baseName = 'documento';

  a.href = url;
  a.download = `${baseName}_assinado.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
