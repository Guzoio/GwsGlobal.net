import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  HeadingLevel,
  ImageRun,
} from 'docx';
import { Licitacao, ItemLicitacao, EmpresaDados } from '../types';
import { formatarMoeda, valorPorExtensoPtBr } from './numberToWordsPtBr';
import { limparTextoDescricaoTecnica } from './sanitizarDescricao';

// Helper to convert base64 data URL to Uint8Array for docx ImageRun
function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const base64 = parts[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Erro ao processar imagem para DOCX:', err);
    return null;
  }
}

export async function gerarArquivoDocx(
  licitacao: Licitacao,
  itens: ItemLicitacao[],
  empresa: EmpresaDados = {
    nome: 'COMERCIAL DISTRIBUIDORA BRASIL LTDA.',
    cnpj: '12.345.678/0001-90',
    ie: '123.456.789.000',
    endereco: 'Av. Paulista, 1000 - Cj. 101 - Bela Vista, São Paulo/SP',
    telefone: '(11) 3456-7890',
    email: 'licitacoes@comercialbrasil.com.br',
    cidade: 'São Paulo/SP',
  }
): Promise<Blob> {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const totalGeral = itens.reduce((acc, it) => acc + (it.valor_total || it.quantidade * it.valor_unitario), 0);
  const totalGeralFormatado = formatarMoeda(totalGeral);
  const extenso = valorPorExtensoPtBr(totalGeral);

  // Borders for commercial table
  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  // Header row
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '0F2C59', type: ShadingType.CLEAR },
        borders: cellBorder,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Item', bold: true, color: 'FFFFFF', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: { fill: '0F2C59', type: ShadingType.CLEAR },
        borders: cellBorder,
        children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Descrição', bold: true, color: 'FFFFFF', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: '0F2C59', type: ShadingType.CLEAR },
        borders: cellBorder,
        children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Marca/Modelo', bold: true, color: 'FFFFFF', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '0F2C59', type: ShadingType.CLEAR },
        borders: cellBorder,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Qtd.', bold: true, color: 'FFFFFF', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '0F2C59', type: ShadingType.CLEAR },
        borders: cellBorder,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Valor Unit.', bold: true, color: 'FFFFFF', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '0F2C59', type: ShadingType.CLEAR },
        borders: cellBorder,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Valor Total', bold: true, color: 'FFFFFF', size: 18 })] })],
      }),
    ],
  });

  // Data rows
  const itemRows = itens.map((it, idx) => {
    const bgColor = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorder,
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(it.num_item), size: 18 })] })],
        }),
        new TableCell({
          borders: cellBorder,
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: it.descricao_curta, size: 18 })] })],
        }),
        new TableCell({
          borders: cellBorder,
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: it.marca, size: 18 })] })],
        }),
        new TableCell({
          borders: cellBorder,
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(it.quantidade), size: 18 })] })],
        }),
        new TableCell({
          borders: cellBorder,
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatarMoeda(it.valor_unitario), size: 18 })] })],
        }),
        new TableCell({
          borders: cellBorder,
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatarMoeda(it.valor_total), bold: true, size: 18 })] })],
        }),
      ],
    });
  });

  // Linha de destaque para o TOTAL GERAL em negrito e com fundo destacado
  const totalRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        borders: cellBorder,
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'TOTAL GERAL DA PROPOSTA:  ',
                bold: true,
                size: 20,
                color: '0F172A',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        borders: cellBorder,
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: totalGeralFormatado,
                bold: true,
                size: 20,
                color: '0F2C59',
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const tabelaComercial = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...itemRows, totalRow],
  });

  // Seção 2: Catálogo de Produtos em Grade de 2 colunas para cada item
  // Coluna esquerda: Imagem ajustada proporcionalmente (largura máx. 5 cm = ~142 pt)
  // Coluna direita: Número do Item, Marca, Modelo e Descrição Técnica Completa
  const catalogoRows: TableRow[] = [];

  for (const it of itens) {
    const imgData = it.caminho_imagem ? dataUrlToUint8Array(it.caminho_imagem) : null;
    const imgChildren: (TextRun | ImageRun)[] = [];

    if (imgData) {
      imgChildren.push(
        new ImageRun({
          data: imgData,
          transformation: {
            width: 140, // ~5 cm
            height: 140, // ~5 cm proporcional
          },
          type: 'png',
        })
      );
    } else {
      imgChildren.push(
        new TextRun({
          text: '\n[Foto do Produto Não Anexada]\n',
          italics: true,
          color: '94A3B8',
          size: 16,
        })
      );
    }

    const catalogoRow = new TableRow({
      children: [
        // Coluna Esquerda: Imagem (largura máx. 5 cm)
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
          },
          shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: imgChildren,
            }),
          ],
        }),
        // Coluna Direita: Item, Marca, Modelo e Descrição Técnica
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `ITEM ${it.num_item} — ${it.descricao_curta}\n\n`,
                  bold: true,
                  size: 22,
                  color: '0F2C59',
                }),
                new TextRun({
                  text: `Especificações Técnicas Completas:`,
                  bold: true,
                  size: 18,
                  color: '0F172A',
                }),
              ],
            }),
            ...(limparTextoDescricaoTecnica(it.descricao_tecnica || it.descricao_curta)
              .replace(/\r\n/g, '\n')
              .replace(/\r/g, '\n')
              .split('\n')
              .map(line => line.trim())
              .filter(Boolean)
              .map(line => {
                const isBullet = /^[•\-\*–—\>]/.test(line);
                const clean = isBullet ? line.replace(/^[•\-\*–—\>]\s*/, '') : line;
                const matchColon = clean.match(/^([^:]{2,30}:)\s*(.*)$/);

                return new Paragraph({
                  spacing: { before: 40, after: 60 },
                  children: [
                    new TextRun({
                      text: '• ',
                      bold: true,
                      size: 17,
                      color: '0F2C59',
                    }),
                    ...(matchColon
                      ? [
                          new TextRun({
                            text: `${matchColon[1]} `,
                            bold: true,
                            size: 17,
                            color: '0F2C59',
                          }),
                          new TextRun({
                            text: matchColon[2],
                            size: 17,
                            color: '334155',
                          }),
                        ]
                      : [
                          new TextRun({
                            text: clean,
                            size: 17,
                            color: '334155',
                          }),
                        ]),
                  ],
                });
              })),
          ],
        }),
      ],
    });

    catalogoRows.push(catalogoRow);
    
    // Espaçador entre itens do catálogo
    catalogoRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            borders: noBorder,
            children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
          }),
        ],
      })
    );
  }

  const tabelaCatalogo = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: catalogoRows,
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 24, // 12pt ABNT padrão
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // ~20 mm
              bottom: 1134,
              left: 1134,
              right: 1134,
            },
          },
        },
        children: [
          // 1. PAPEL TIMBRADO DA EMPRESA
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: empresa.nome + '\n',
                bold: true,
                size: 24,
                color: '0F2C59',
              }),
              new TextRun({
                text: `CNPJ: ${empresa.cnpj} | I.E.: ${empresa.ie}\n`,
                size: 16,
                color: '64748B',
              }),
              new TextRun({
                text: `${empresa.endereco} | Tel: ${empresa.telefone} | ${empresa.email}\n`,
                size: 16,
                color: '64748B',
              }),
              new TextRun({
                text: '___________________________________________________________________________\n',
                color: 'CBD5E1',
                size: 14,
              }),
            ],
          }),

          // TÍTULO DA PROPOSTA
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: 'PROPOSTA COMERCIAL DE PREÇOS',
                bold: true,
                size: 26,
                color: '0F2C59',
              }),
            ],
          }),

          // SEÇÃO 1: CABEÇALHO DINÂMICO
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Ao Órgão Licitante: ', bold: true, size: 19 }),
              new TextRun({ text: `${licitacao.orgao}\n`, size: 19 }),
              new TextRun({ text: 'Processo / Pregão: ', bold: true, size: 19 }),
              new TextRun({ text: `${licitacao.processo_pregao}     |     `, size: 19 }),
              new TextRun({ text: 'Modalidade: ', bold: true, size: 19 }),
              new TextRun({ text: `${licitacao.modalidade}\n`, size: 19 }),
              new TextRun({ text: 'Data de Apresentação: ', bold: true, size: 19 }),
              new TextRun({ text: `${dataHoje}`, size: 19 }),
            ],
          }),

          // TABELA COMERCIAL
          tabelaComercial,

          // LINHA ABAIXO DO TOTAL: VALOR POR EXTENSO
          new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: 'Valor por Extenso: ',
                bold: true,
                size: 20,
                color: '0F172A',
              }),
              new TextRun({
                text: `${totalGeralFormatado} (${extenso})`,
                bold: true,
                size: 20,
                color: '0F2C59',
              }),
            ],
          }),

          // CONDIÇÕES GERAIS
          new Paragraph({
            spacing: { before: 180, after: 300 },
            children: [
              new TextRun({ text: 'Condições da Proposta:\n', bold: true, size: 18 }),
              new TextRun({
                text: '• Validade da Proposta: 60 (sessenta) dias a contar da abertura do certame.\n' +
                      '• Prazo de Entrega: Até 15 (quinze) dias úteis após o recebimento da Ordem de Fornecimento / Nota de Empenho.\n' +
                      '• Local de Entrega: No endereço indicado pelo órgão licitante, com frete CIF incluso.\n' +
                      '• Garantia: 12 (doze) meses com assistência técnica integral e reposição de componentes defeituosos.\n' +
                      '• Pagamento: Conforme cronograma e disposições do Edital, via ordem bancária em até 30 dias após emissão da Nota Fiscal devidamente atestada.',
                size: 17,
                color: '334155',
              }),
            ],
          }),

          // BLOCO DE ASSINATURA
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
            children: [
              new TextRun({ text: '_____________________________________________________\n', bold: true, color: '64748B' }),
              new TextRun({ text: `${empresa.nome}\n`, bold: true, size: 19, color: '0F2C59' }),
              new TextRun({ text: 'Departamento Comercial & Gestão de Contratos Públicos\n', size: 17, color: '64748B' }),
              new TextRun({ text: `${empresa.cidade} — ${dataHoje}`, size: 16, color: '94A3B8' }),
            ],
          }),

          // QUEBRA DE PÁGINA PARA O CATÁLOGO
          new Paragraph({
            pageBreakBefore: true,
            children: [],
          }),

          // SEÇÃO 2: CATÁLOGO ILUSTRATIVO DE PRODUTOS
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 150 },
            children: [
              new TextRun({
                text: 'ANEXO - CATÁLOGO E ESPECIFICAÇÕES TÉCNICAS DOS PRODUTOS',
                bold: true,
                size: 24,
                color: '0F2C59',
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 250 },
            children: [
              new TextRun({
                text: 'Em atendimento às exigências editalícias e aos princípios da transparência e do julgamento objetivo, ' +
                      'apresentamos a comprovação técnica e visual dos itens ofertados na presente licitação:',
                size: 18,
                color: '475569',
              }),
            ],
          }),

          // TABELA DO CATÁLOGO
          tabelaCatalogo,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
