import jsPDF from 'jspdf';

export interface PosicaoImagemProporcional {
  x: number;
  y: number;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
}

/**
 * Calcula a posição e tamanho exatos para renderizar uma imagem no jsPDF
 * preservando integralmente seu aspect ratio original (estilo object-fit: contain).
 * Evita 100% o efeito de imagem "achatada" ou "esticada" tanto para assinaturas
 * quanto para fotos de produtos no catálogo.
 */
export function calcularPosicaoContida(
  doc: jsPDF,
  imgData: string,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number
): PosicaoImagemProporcional {
  let imgW = boxWidth;
  let imgH = boxHeight;
  let format: 'PNG' | 'JPEG' = 'PNG';

  if (imgData.includes('image/jpeg') || imgData.includes('image/jpg')) {
    format = 'JPEG';
  }

  try {
    const props = doc.getImageProperties(imgData);
    if (props && props.width > 0 && props.height > 0) {
      const imgRatio = props.width / props.height;
      const boxRatio = boxWidth / boxHeight;

      if (imgRatio > boxRatio) {
        // Imagem é mais larga proporcionalmente que a caixa: trava na largura máxima
        imgW = boxWidth;
        imgH = boxWidth / imgRatio;
      } else {
        // Imagem é mais alta proporcionalmente que a caixa: trava na altura máxima
        imgH = boxHeight;
        imgW = boxHeight * imgRatio;
      }

      if (props.fileType) {
        const ft = String(props.fileType).toUpperCase();
        format = ft === 'JPEG' || ft === 'JPG' ? 'JPEG' : 'PNG';
      }
    }
  } catch (err) {
    // Se a leitura de cabeçalho do jsPDF falhar, mantém dimensões da caixa de forma segura
  }

  // Centraliza perfeitamente dentro da caixa designada
  const x = boxX + (boxWidth - imgW) / 2;
  const y = boxY + (boxHeight - imgH) / 2;

  return { x, y, width: imgW, height: imgH, format };
}

/**
 * Renderiza uma imagem no jsPDF com proporções naturais e centralizada na área informada.
 */
export function renderizarImagemProporcional(
  doc: jsPDF,
  imgData: string,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  alias?: string
): PosicaoImagemProporcional {
  const pos = calcularPosicaoContida(doc, imgData, boxX, boxY, boxWidth, boxHeight);
  try {
    doc.addImage(
      imgData,
      pos.format,
      pos.x,
      pos.y,
      pos.width,
      pos.height,
      alias,
      'FAST'
    );
  } catch (e) {
    console.warn('Aviso ao renderizar imagem proporcional no PDF:', e);
  }
  return pos;
}
