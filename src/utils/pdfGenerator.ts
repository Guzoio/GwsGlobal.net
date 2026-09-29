import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig } from '../types';
import { formatarMoeda, valorPorExtensoPtBr, formatarDataExtensoPtBr } from './numberToWordsPtBr';
import { limparTextoDescricaoTecnica } from './sanitizarDescricao';

/**
 * Gera um arquivo PDF de alta fidelidade contendo:
 * 1. Papel timbrado dinâmico no cabeçalho e rodapé em todas as páginas.
 * 2. Primeiras informações oficiais do papel timbrado:
 *    - Pregão Eletrônico / Processo Administrativo
 *    - Quadro sublinhado com Razão Social, CNPJ, Inscrição Estadual, Endereço, Telefones, Email e Dados Bancários
 *    - Qualificação e declaração formal do representante legal
 * 3. Tabela Comercial de Preços com cálculo do Total e Valor por Extenso
 * 4. Catálogo Ilustrado em 2 colunas com fotos reais dos produtos
 */
export async function gerarArquivoPdf(
  licitacao: Licitacao,
  itens: ItemLicitacao[],
  timbrado: PapelTimbradoConfig
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight; // 180 mm

  const headerHeight = timbrado.cabecalhoImagem ? (timbrado.alturaCabecalhoMm || 28) : 8;
  const footerHeight = timbrado.rodapeImagem ? (timbrado.alturaRodapeMm || 18) : 14;

  const topMargin = headerHeight + 5;
  const bottomMargin = pageHeight - footerHeight - 5;

  const totalGeral = itens.reduce(
    (acc, it) => acc + (it.valor_total || it.quantidade * it.valor_unitario),
    0
  );
  const totalFormatado = formatarMoeda(totalGeral);
  const extenso = valorPorExtensoPtBr(totalGeral);

  // Dados com fallback da GWS GLOBAL LIMITADA
  const razaoSocial = timbrado.razaoSocial || 'GWS GLOBAL LIMITADA';
  const cnpj = timbrado.cnpj || '53.080.207/0001-80';
  const inscricaoEstadual = timbrado.inscricaoEstadual || '47724530033';
  const endereco = timbrado.endereco || 'Rua Alpercata Nº 261 – Ana Malaquias Timoteo – mg';
  const telefone = timbrado.telefone || '(31) 9 86949588 - (31) 9 99240111';
  const email = timbrado.email || 'gwsgloballimitada@gmail.com';
  const banco = timbrado.banco || 'Nubank';
  const agencia = timbrado.agencia || '0001';
  const contaCorrente = timbrado.contaCorrente || '176199733-6';

  const nomeRep = timbrado.nomeRepresentante || 'Gustavo Henrique Severino Pinto';
  const rgRep = timbrado.rgRepresentante || '20035238 expedido pela PC/MG';
  const cpfRep = timbrado.cpfRepresentante || '020.313.066.93';
  const endRep = timbrado.enderecoRepresentante || 'rua Estrelinha, Nº 180, no bairro Macuco, na cidade de Timoteo-MG, Cep 35181726';

  const nomeRep2 = timbrado.nomeRepresentante2?.trim() || '';
  const rgRep2 = timbrado.rgRepresentante2?.trim() || '';
  const cpfRep2 = timbrado.cpfRepresentante2?.trim() || '';
  const endRep2 = timbrado.enderecoRepresentante2?.trim() || endereco;

  let currentY = topMargin;

  // =========================================================================
  // 1. PRIMEIRAS INFORMAÇÕES DO PAPEL TIMBRADO (PADRÃO FONTE ARIAL TAMANHO 12)
  // =========================================================================

  // Linha 1: Modalidade & Processo/Pregão
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const modLabel = `${licitacao.modalidade || 'Pregão Eletrônico'} `;
  doc.text(modLabel, marginLeft, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  const pregaoTexto = licitacao.processo_pregao || 'Nº 0019/26-A';
  const offsetMod = doc.getTextWidth(modLabel);
  doc.text(pregaoTexto, marginLeft + offsetMod, currentY + 4.5);

  // Linha 2: Processo Administrativo / Órgão
  currentY += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Processo / Órgão: ', marginLeft, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  const procTexto = licitacao.orgao || 'Nº 0038/2026';
  doc.text(procTexto, marginLeft + 42, currentY + 4.5);

  currentY += 9;

  // Tabela com Linhas Sublinhadas e Bordas (Exata como na imagem)
  const linhasTabela = [
    { rotulo: 'RAZÃO SOCIAL:', valor: razaoSocial, bold: true },
    { rotulo: 'CNPJ:', valor: cnpj, bold: false },
    { rotulo: 'INSCRIÇÃO ESTADUAL', valor: inscricaoEstadual, bold: false },
    { rotulo: 'ENDEREÇO:', valor: endereco, bold: false },
    { rotulo: 'TELEFONE:', valor: telefone, bold: false },
    { rotulo: 'EMAIL:', valor: email, bold: false },
    { rotulo: 'BANCO (NOME/Nº):', valor: banco, bold: false },
    { rotulo: 'AGÊNCIA Nº:', valor: agencia, bold: false },
    { rotulo: 'CONTA CORRENTE Nº:', valor: contaCorrente, bold: false },
  ];

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Borda superior da tabela
  doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);

  const alturaLinha = 5.2;
  linhasTabela.forEach(item => {
    currentY += alturaLinha;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(item.rotulo, marginLeft + 1.5, currentY - 1.4);

    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
    const offsetValor = item.rotulo.length > 18 ? 58 : 45;
    doc.text(item.valor, marginLeft + offsetValor, currentY - 1.4);

    // Linha divisória horizontal
    doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);
  });

  currentY += 5;

  // Parágrafo de Abertura / Declaração do Representante Legal (Padrão Arial 12)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const textoAbertura = nomeRep2
    ? `A empresa ${razaoSocial}, inscrita no CNPJ sob o nº ${cnpj}, sediada na ${endereco}, neste ato representada por seus representantes legais, ${nomeRep}, portador(a) do documento de identidade RG nº ${rgRep}, inscrito(a) no CPF nº ${cpfRep}, residente e domiciliado na ${endRep}, e ${nomeRep2}, portador(a) do documento de identidade RG nº ${rgRep2 || '---'}, inscrito(a) no CPF nº ${cpfRep2 || '---'}, residente e domiciliado na ${endRep2}, vêm apresentar Proposta Comercial para a participação no processo indicado acima, conforme abaixo discriminado:`
    : `A empresa ${razaoSocial}, inscrita no CNPJ sob o nº ${cnpj}, sediada na ${endereco}, neste ato representado(a) por ${nomeRep}, portador(a) do documento de identidade RG nº ${rgRep}, inscrito(a) no CPF nº ${cpfRep}, residente e domiciliado na ${endRep}, vem apresentar Proposta Comercial para a participação no processo indicado acima, conforme abaixo discriminado:`;

  const splitAbertura = doc.splitTextToSize(textoAbertura, contentWidth);
  doc.text(splitAbertura, marginLeft, currentY, { align: 'justify', maxWidth: contentWidth });

  currentY += splitAbertura.length * 5.2 + 5;

  // =========================================================================
  // 2. TABELA COMERCIAL DE PREÇOS
  // =========================================================================
  const tableData = itens.map(it => [
    it.num_item.toString(),
    it.descricao_curta,
    it.marca,
    Math.round(it.quantidade).toLocaleString('pt-BR'), // ESTRITAMENTE número inteiro
    formatarMoeda(it.valor_unitario),
    formatarMoeda(it.valor_total),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Item', 'Descrição do Objeto', 'Marca / Fabricante', 'Qtd.', 'Valor Unit.', 'Valor Total']],
    body: tableData,
    foot: [
      [
        {
          content: 'TOTAL GERAL DA PROPOSTA:',
          colSpan: 5,
          styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 44, 89], fontSize: 11 },
        },
        {
          content: totalFormatado,
          styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 44, 89], fontSize: 11 },
        },
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 44, 89], // #0F2C59
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    footStyles: {
      fillColor: [226, 232, 240], // #E2E8F0
      textColor: [15, 44, 89],
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 2.2,
      font: 'helvetica',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { cellWidth: 68 },
      2: { cellWidth: 32 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: marginLeft, right: marginRight, top: topMargin, bottom: footerHeight + 8 },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Posição final após a tabela
  // @ts-expect-error lastAutoTable is injected by jspdf-autotable
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : currentY + 30;
  currentY = finalY;

  // Se estiver próximo da margem inferior, quebra página
  if (currentY + 45 > bottomMargin) {
    doc.addPage();
    currentY = topMargin;
  }

  // Box Valor por Extenso
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginLeft, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Valor Total por Extenso:', marginLeft + 3, currentY + 7);

  doc.setFont('helvetica', 'italic');
  doc.setTextColor(15, 44, 89);
  const textoExtensoCompleto = `${totalFormatado} (${extenso})`;
  const splitExtenso = doc.splitTextToSize(textoExtensoCompleto, contentWidth - 54);
  doc.text(splitExtenso, marginLeft + 50, currentY + 7);

  currentY += 16;

  // =========================================================================
  // PRAZOS, CONDIÇÕES, DECLARAÇÃO TRABALHISTA E DATA DE EMISSÃO (FONTE 12)
  // =========================================================================
  const prazoEntrega = timbrado.prazoEntrega || 'Conforme Aviso de Dispensa Eletrônica e Termo de Referência.';
  const prazoValidade = timbrado.prazoValidade || '90 Dias';
  const declaracaoTrab = timbrado.declaracaoTrabalhista || 'Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas.';
  const cidadeEmissao = timbrado.cidadeEmissao || 'Timóteo - MG';
  // Prioridade de Data para o Documento Oficial da Proposta:
  // 1. Data individualizada definida para esta licitação (data_proposta)
  // 2. Data de cadastro desta licitação (data_cadastro)
  // 3. Data de emissão do papel timbrado
  const dataReferencia = licitacao.data_proposta || licitacao.data_cadastro || timbrado.dataEmissao;
  const dataEmissaoTexto = formatarDataExtensoPtBr(dataReferencia, cidadeEmissao);

  const temAssinatura = !!(timbrado.assinaturaImagem && timbrado.assinaturaImagem.startsWith('data:image'));
  const espacoAssinatura = temAssinatura ? 44 : 28;
  const espacoTermosEstimado = 42;

  // Se não couber os termos + assinatura na página atual, quebra para a próxima
  if (currentY + espacoTermosEstimado + espacoAssinatura > bottomMargin) {
    doc.addPage();
    currentY = topMargin + 8;
  }

  // PRAZO DE ENTREGA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const rotuloEntrega = 'PRAZO DE ENTREGA: ';
  doc.text(rotuloEntrega, marginLeft, currentY);
  const wRotuloEntrega = doc.getTextWidth(rotuloEntrega);
  doc.setFont('helvetica', 'normal');
  doc.text(prazoEntrega, marginLeft + wRotuloEntrega, currentY);
  currentY += 6;

  // PRAZO DE VALIDADE DA PROPOSTA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const rotuloValidade = 'PRAZO DE VALIDADE DA PROPOSTA: ';
  doc.text(rotuloValidade, marginLeft, currentY);
  const wRotuloValidade = doc.getTextWidth(rotuloValidade);
  doc.setFont('helvetica', 'normal');
  doc.text(prazoValidade, marginLeft + wRotuloValidade, currentY);
  currentY += 7;

  // DECLARAÇÃO TRABALHISTA
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  const linhasDeclaracao = doc.splitTextToSize(declaracaoTrab, contentWidth);
  doc.text(linhasDeclaracao, marginLeft, currentY, { align: 'justify', maxWidth: contentWidth });
  currentY += (linhasDeclaracao.length * 4.8) + 7;

  // DATA DA EMISSÃO DO DOCUMENTO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(dataEmissaoTexto, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Bloco de Assinatura Oficial (com imagem da assinatura se fornecida)
  if (currentY + espacoAssinatura > bottomMargin) {
    doc.addPage();
    currentY = topMargin + 10;
  }

  if (nomeRep2) {
    // ESTRUTURA DUPLA DE ASSINATURA (2 REPRESENTANTES LADO A LADO)
    const gap = 10;
    const colWidth = (contentWidth - gap) / 2; // ~85mm
    const col1Center = marginLeft + colWidth / 2;
    const col2Center = marginLeft + colWidth + gap + colWidth / 2;

    const sigW = 54;
    const sigH = 18;

    // Assinatura 1
    if (timbrado.assinaturaImagem) {
      try {
        doc.addImage(
          timbrado.assinaturaImagem,
          'PNG',
          col1Center - sigW / 2,
          currentY + 1,
          sigW,
          sigH,
          undefined,
          'FAST'
        );
      } catch (e) {
        console.error('Erro ao renderizar assinatura 1 no PDF:', e);
      }
    }

    // Assinatura 2
    if (timbrado.assinaturaImagem2) {
      try {
        doc.addImage(
          timbrado.assinaturaImagem2,
          'PNG',
          col2Center - sigW / 2,
          currentY + 1,
          sigW,
          sigH,
          undefined,
          'FAST'
        );
      } catch (e) {
        console.error('Erro ao renderizar assinatura 2 no PDF:', e);
      }
    }

    const linhaY = currentY + (timbrado.assinaturaImagem || timbrado.assinaturaImagem2 ? sigH + 2 : 10);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // Linha 1 e Linha 2
    doc.line(col1Center - 40, linhaY, col1Center + 40, linhaY);
    doc.line(col2Center - 40, linhaY, col2Center + 40, linhaY);

    // Textos Coluna 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    const splitRazao1 = doc.splitTextToSize(razaoSocial, 72);
    doc.text(splitRazao1[0] || razaoSocial, col1Center, linhaY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${nomeRep}`, col1Center, linhaY + 8.5, { align: 'center' });
    doc.text(`Representante Legal • CPF: ${cpfRep}`, col1Center, linhaY + 12.5, { align: 'center' });

    // Textos Coluna 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    const splitRazao2 = doc.splitTextToSize(razaoSocial, 72);
    doc.text(splitRazao2[0] || razaoSocial, col2Center, linhaY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${nomeRep2}`, col2Center, linhaY + 8.5, { align: 'center' });
    doc.text(`Representante Legal • CPF: ${cpfRep2 || cnpj}`, col2Center, linhaY + 12.5, { align: 'center' });

    currentY = linhaY + 17;
  } else {
    // ASSINATURA ÚNICA CENTRALIZADA
    if (temAssinatura && timbrado.assinaturaImagem) {
      try {
        const sigWidth = 62; // mm (ampliada para excelente nitidez e visibilidade)
        const sigHeight = 20; // mm
        const sigX = (pageWidth - sigWidth) / 2;
        const sigY = currentY + 1;
        doc.addImage(
          timbrado.assinaturaImagem,
          'PNG',
          sigX,
          sigY,
          sigWidth,
          sigHeight,
          undefined,
          'FAST'
        );
        currentY += sigHeight + 1;
      } catch (e) {
        console.error('Erro ao renderizar imagem da assinatura no PDF:', e);
        currentY += 6;
      }
    } else {
      currentY += 8;
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 50, currentY + 2, pageWidth / 2 + 50, currentY + 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(razaoSocial, pageWidth / 2, currentY + 6.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`${nomeRep} — Representante Legal`, pageWidth / 2, currentY + 11.5, { align: 'center' });
    doc.text(`CNPJ: ${cnpj}`, pageWidth / 2, currentY + 16, { align: 'center' });
    currentY += 18;
  }

  // =========================================================================
  // SEÇÃO 2: ANEXO - CATÁLOGO E ESPECIFICAÇÕES TÉCNICAS (EM NOVA PÁGINA)
  // =========================================================================
  if (itens.length > 0) {
    doc.addPage();
    currentY = topMargin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 44, 89);
    doc.text('ANEXO - CATÁLOGO E ESPECIFICAÇÕES TÉCNICAS DOS PRODUTOS', pageWidth / 2, currentY + 4, { align: 'center' });
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Apresentamos abaixo a documentação fotográfica e as especificações técnicas detalhadas em conformidade com o Edital:',
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
    currentY += 7;

    // Renderizar cada item do catálogo técnico com imagem centralizada no topo e especificações embaixo (Fonte 12)
    for (let idx = 0; idx < itens.length; idx++) {
      const item = itens[idx];
      const specsTextX = marginLeft + 6;
      const specsTextWidth = contentWidth - 12;

      // Extrai a descrição técnica separando em tópicos/linhas com marcadores e higienizando preâmbulos
      const textoCompleto = limparTextoDescricaoTecnica(item.descricao_tecnica || item.descricao_curta);
      const topicos = extrairTopicosEspecificacao(textoCompleto, specsTextWidth, doc);

      // 1. Cabeçalho do item (título e número do item no catálogo técnico - Arial 12 Negrito)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const tituloLinhas = doc.splitTextToSize(`ITEM ${item.num_item} — ${item.descricao_curta}`, contentWidth - 12);
      const tituloHeight = tituloLinhas.length * 5.2;
      const headerTotalHeight = 4 + tituloHeight + 2;

      // 2. Dimensões da Caixa da Foto Centralizada
      const photoBoxWidth = 70; // mm
      const photoBoxHeight = 42; // mm
      const photoBoxSpacing = 4; // mm
      const specsLabelHeight = 6; // mm

      // Altura total da parte superior (cabeçalho + foto centralizada + rótulo specs)
      const topBlockHeight = headerTotalHeight + photoBoxHeight + photoBoxSpacing + specsLabelHeight;

      const totalSpecsHeight = topicos.reduce((acc, t) => acc + t.alturaTotal, 0);
      const totalNeededHeight = topBlockHeight + totalSpecsHeight + 4;

      // Se o espaço restante na página não couber o bloco superior com folga, abre nova página
      if (currentY + Math.min(totalNeededHeight, topBlockHeight + 15) > bottomMargin) {
        doc.addPage();
        currentY = topMargin;
      }

      const espacoDisponivelNaPagina = bottomMargin - currentY;

      if (totalNeededHeight <= espacoDisponivelNaPagina) {
        // CABE INTEIRO NA PÁGINA ATUAL:
        const cardHeight = totalNeededHeight;

        // Moldura do Cartão do Item
        doc.setDrawColor(203, 213, 225); // #CBD5E1
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(marginLeft, currentY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

        // Título do Item no topo
        const itemHeaderY = currentY + 5.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 44, 89);
        doc.text(tituloLinhas, marginLeft + 6, itemHeaderY);

        // Imagem Centralizada em Cima
        const photoX = marginLeft + (contentWidth - photoBoxWidth) / 2;
        const photoY = currentY + headerTotalHeight;

        doc.setFillColor(248, 250, 252); // #F8FAFC
        doc.setDrawColor(226, 232, 240); // #E2E8F0
        doc.roundedRect(photoX, photoY, photoBoxWidth, photoBoxHeight, 1.5, 1.5, 'FD');

        if (item.caminho_imagem && item.caminho_imagem.startsWith('data:image')) {
          try {
            doc.addImage(
              item.caminho_imagem,
              'PNG',
              photoX + 2,
              photoY + 2,
              photoBoxWidth - 4,
              photoBoxHeight - 4,
              undefined,
              'FAST'
            );
          } catch {
            desenharPlaceholderFoto(doc, photoX + 2, photoY + 2, photoBoxWidth - 4, photoBoxHeight - 4);
          }
        } else {
          desenharPlaceholderFoto(doc, photoX + 2, photoY + 2, photoBoxWidth - 4, photoBoxHeight - 4);
        }

        // Especificações Técnicas Completas em Baixo (Arial 12)
        const specsStartY = photoY + photoBoxHeight + photoBoxSpacing;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 44, 89);
        doc.text('Especificações Técnicas Completas:', specsTextX, specsStartY);

        let specsCurrentY = specsStartY + 5.0;
        for (const topico of topicos) {
          specsCurrentY = desenharTopico(doc, topico, specsTextX, specsCurrentY);
        }

        currentY += cardHeight + 6;
      } else {
        // DESCRIÇÃO EXTENSA: FLUI ENTRE PÁGINAS SEM TRUNCAR NENHUM TÓPICO
        const cardHeightP1 = espacoDisponivelNaPagina;
        const availableHeightForSpecs = cardHeightP1 - topBlockHeight - 4;

        let acumAltura = 0;
        let topicosP1Count = 0;
        for (let t = 0; t < topicos.length; t++) {
          if (acumAltura + topicos[t].alturaTotal <= availableHeightForSpecs) {
            acumAltura += topicos[t].alturaTotal;
            topicosP1Count++;
          } else {
            break;
          }
        }
        if (topicosP1Count === 0 && topicos.length > 0) {
          topicosP1Count = 1;
        }

        const topicosP1 = topicos.slice(0, topicosP1Count);
        const topicosRestantes = topicos.slice(topicosP1Count);

        // Moldura Parte 1
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(marginLeft, currentY, contentWidth, cardHeightP1, 1.5, 1.5, 'FD');

        // Cabeçalho Parte 1 (Arial 12 Negrito)
        const itemHeaderY = currentY + 5.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 44, 89);
        doc.text(tituloLinhas, marginLeft + 6, itemHeaderY);

        // Imagem Centralizada Parte 1
        const photoX = marginLeft + (contentWidth - photoBoxWidth) / 2;
        const photoY = currentY + headerTotalHeight;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(photoX, photoY, photoBoxWidth, photoBoxHeight, 1.5, 1.5, 'FD');

        if (item.caminho_imagem && item.caminho_imagem.startsWith('data:image')) {
          try {
            doc.addImage(
              item.caminho_imagem,
              'PNG',
              photoX + 2,
              photoY + 2,
              photoBoxWidth - 4,
              photoBoxHeight - 4,
              undefined,
              'FAST'
            );
          } catch {
            desenharPlaceholderFoto(doc, photoX + 2, photoY + 2, photoBoxWidth - 4, photoBoxHeight - 4);
          }
        } else {
          desenharPlaceholderFoto(doc, photoX + 2, photoY + 2, photoBoxWidth - 4, photoBoxHeight - 4);
        }

        // Tópicos da Página 1 (Arial 12)
        const specsStartY = photoY + photoBoxHeight + photoBoxSpacing;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 44, 89);
        doc.text('Especificações Técnicas Completas:', specsTextX, specsStartY);

        let specsCurrentY = specsStartY + 5.0;
        for (const topico of topicosP1) {
          specsCurrentY = desenharTopico(doc, topico, specsTextX, specsCurrentY);
        }

        // CONTINUAÇÃO EM PÁGINA SEGUINTE PARA OS TÓPICOS RESTANTES
        let restantes = [...topicosRestantes];
        while (restantes.length > 0) {
          doc.addPage();
          currentY = topMargin;

          const totalPageHeight = bottomMargin - topMargin;
          const continuationTextWidth = contentWidth - 12;

          // Reavalia tópicos para a largura total
          const topicosReavaliados = extrairTopicosEspecificacao(
            restantes.map(r => r.rotuloNegrito ? `${r.rotuloNegrito} ${r.textoRestante}` : r.textoRestante).join('\n'),
            continuationTextWidth,
            doc
          );

          let acumCont = 0;
          let countThisPage = 0;
          const availableContHeight = totalPageHeight - 24;

          for (let c = 0; c < topicosReavaliados.length; c++) {
            if (acumCont + topicosReavaliados[c].alturaTotal <= availableContHeight) {
              acumCont += topicosReavaliados[c].alturaTotal;
              countThisPage++;
            } else {
              break;
            }
          }
          if (countThisPage === 0 && topicosReavaliados.length > 0) {
            countThisPage = 1;
          }

          const chunk = topicosReavaliados.slice(0, countThisPage);
          restantes = topicosReavaliados.slice(countThisPage);

          const chunkSpecsHeight = chunk.reduce((acc, t) => acc + t.alturaTotal, 0);
          const continuationCardHeight = Math.min(totalPageHeight, chunkSpecsHeight + 16);

          doc.setDrawColor(203, 213, 225);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginLeft, currentY, contentWidth, continuationCardHeight, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(15, 44, 89);
          doc.text(`ITEM ${item.num_item} — Especificações Técnicas (Continuação)`, marginLeft + 6, currentY + 6.5);

          let contY = currentY + 12;
          for (const topico of chunk) {
            contY = desenharTopico(doc, topico, marginLeft + 6, contY);
          }

          currentY += continuationCardHeight + 5;
        }
      }
    }
  }

  // =========================================================================
  // CARIMBO DINÂMICO DE CABEÇALHO E RODAPÉ EM TODAS AS PÁGINAS
  // =========================================================================
  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // 1. Aplica Cabeçalho no topo da página
    if (timbrado.cabecalhoImagem && timbrado.cabecalhoImagem.startsWith('data:image')) {
      try {
        doc.addImage(
          timbrado.cabecalhoImagem,
          'PNG',
          0,
          0,
          pageWidth,
          headerHeight,
          undefined,
          'FAST'
        );
      } catch (e) {
        console.error('Erro ao renderizar imagem do cabeçalho na página', pageNum, e);
      }
    }

    // 2. Aplica Rodapé na base da página
    if (timbrado.rodapeImagem && timbrado.rodapeImagem.startsWith('data:image')) {
      try {
        doc.addImage(
          timbrado.rodapeImagem,
          'PNG',
          0,
          pageHeight - footerHeight,
          pageWidth,
          footerHeight,
          undefined,
          'FAST'
        );
      } catch (e) {
        console.error('Erro ao renderizar imagem do rodapé na página', pageNum, e);
      }
    } else {
      // Rodapé tipográfico limpo caso não haja imagem gráfica enviada
      doc.setDrawColor(203, 213, 225);
      doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${razaoSocial} • CNPJ: ${cnpj} • ${email} • Tel: ${telefone}`,
        marginLeft,
        pageHeight - 7
      );
    }

    // 3. Numeração discreta no canto inferior direito
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Página ${pageNum} de ${totalPages}`,
      pageWidth - marginRight,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  return doc.output('blob');
}

/**
 * Auxiliar para desenhar placeholder visual elegante quando o item não tiver foto
 */
function desenharPlaceholderFoto(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(x, y, w, h, 1, 1, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('[Foto do Produto]', x + w / 2, y + h / 2, { align: 'center' });
}

interface TopicoEspecificacao {
  tipo: 'topico' | 'paragrafo' | 'vazio';
  marcador?: string;
  rotuloNegrito?: string;
  textoRestante: string;
  linhas: string[];
  alturaTotal: number;
}

/**
 * Processa a descrição técnica preservando quebras de linhas, tópicos e formatações
 */
function extrairTopicosEspecificacao(
  textoRaw: string,
  textWidth: number,
  doc: jsPDF
): TopicoEspecificacao[] {
  const textoLimpo = limparTextoDescricaoTecnica(textoRaw);
  if (!textoLimpo || !textoLimpo.trim()) return [];

  // 1. Normalizar quebras de linha (\r\n e \r para \n)
  const textoNormalizado = textoLimpo.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = textoNormalizado.split('\n');

  // Caso o usuário tenha inserido texto em linha única mas com separadores
  let splitLines: string[] = [];
  if (rawLines.length === 1 && (rawLines[0].includes(' • ') || rawLines[0].includes(' ; '))) {
    if (rawLines[0].includes(' • ')) {
      splitLines = rawLines[0].split(/\s+•\s+/).map(s => s.trim()).filter(Boolean);
    } else {
      splitLines = rawLines[0].split(/\s+;\s+/).map(s => s.trim()).filter(Boolean);
    }
  } else {
    splitLines = rawLines;
  }

  const specsLineHeight = 5.2; // mm por linha para fonte Arial 12
  const espacoEntreTopicos = 2.0; // mm entre tópicos distintos
  const topicos: TopicoEspecificacao[] = [];

  for (let i = 0; i < splitLines.length; i++) {
    const rawLine = splitLines[i].trim();
    if (!rawLine) {
      topicos.push({
        tipo: 'vazio',
        textoRestante: '',
        linhas: [''],
        alturaTotal: 2.5,
      });
      continue;
    }

    // Identificar marcadores de início: •, -, *, –, —, > ou números como 1., 1)
    const matchBullet = rawLine.match(/^([•\-\*–—\>]|\d+[\.\)])\s*(.*)$/);
    let ehTopico = false;
    let marcador = '•';
    let textoLimpo = rawLine;

    if (matchBullet) {
      ehTopico = true;
      marcador = matchBullet[1];
      textoLimpo = matchBullet[2].trim();
    } else {
      // Se houver mais de uma linha ou padrão "Rótulo:", tratar como tópico com marcador elegante
      if (splitLines.filter(l => l.trim().length > 0).length > 1 || /^[^:]{2,30}:\s+/.test(rawLine)) {
        ehTopico = true;
        marcador = '•';
        textoLimpo = rawLine;
      } else {
        ehTopico = false;
        textoLimpo = rawLine;
      }
    }

    // Identificar padrão de rótulo em negrito "Rótulo: Conteúdo"
    let rotuloNegrito: string | undefined = undefined;
    let textoAposRotulo = textoLimpo;
    const matchColon = textoLimpo.match(/^([^:]{2,30}:)\s*(.*)$/);
    if (matchColon) {
      rotuloNegrito = matchColon[1];
      textoAposRotulo = matchColon[2];
    }

    const indentWidth = ehTopico ? 6.0 : 0;
    const availableWidth = Math.max(25, textWidth - indentWidth);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const fullText = rotuloNegrito ? `${rotuloNegrito} ${textoAposRotulo}` : textoLimpo;
    const linhas = doc.splitTextToSize(fullText, availableWidth);

    const alturaTotal = (linhas.length * specsLineHeight) + espacoEntreTopicos;

    topicos.push({
      tipo: ehTopico ? 'topico' : 'paragrafo',
      marcador,
      rotuloNegrito,
      textoRestante: textoAposRotulo,
      linhas,
      alturaTotal,
    });
  }

  return topicos;
}

/**
 * Desenha um tópico individual com bullet vetorial nítido e recuo seguro (Padrão Arial 12)
 */
function desenharTopico(
  doc: jsPDF,
  topico: TopicoEspecificacao,
  textX: number,
  startY: number
): number {
  if (topico.tipo === 'vazio') {
    return startY + topico.alturaTotal;
  }

  const specsLineHeight = 5.2; // mm para fonte 12
  const indent = topico.tipo === 'topico' ? 6.0 : 0;
  const contentX = textX + indent;
  let lineY = startY;

  // 1. Desenhar marcador do tópico
  if (topico.tipo === 'topico') {
    if (/^\d+[\.\)]$/.test(topico.marcador || '')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 44, 89);
      doc.text(topico.marcador!, textX, lineY);
    } else {
      // Pequeno círculo vetorial em azul marinho #0F2C59 alinhado à fonte 12
      doc.setFillColor(15, 44, 89);
      doc.circle(textX + 2.0, lineY - 1.4, 0.75, 'F');
    }
  }

  // 2. Desenhar as linhas do tópico em Arial 12
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);

  if (topico.rotuloNegrito && topico.linhas.length > 0) {
    const primeiraLinha = topico.linhas[0];
    const rotulo = topico.rotuloNegrito;

    if (primeiraLinha.startsWith(rotulo)) {
      // Rótulo em negrito Arial 12
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 44, 89);
      doc.text(rotulo, contentX, lineY);

      const rotuloWidth = doc.getTextWidth(rotulo + ' ');
      const restoPrimeiraLinha = primeiraLinha.slice(rotulo.length).trim();

      // Resto da primeira linha em normal Arial 12
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      if (restoPrimeiraLinha) {
        doc.text(restoPrimeiraLinha, contentX + rotuloWidth, lineY);
      }

      lineY += specsLineHeight;

      // Linhas seguintes do mesmo tópico (recuadas no contentX)
      for (let l = 1; l < topico.linhas.length; l++) {
        doc.text(topico.linhas[l], contentX, lineY);
        lineY += specsLineHeight;
      }
    } else {
      for (let l = 0; l < topico.linhas.length; l++) {
        doc.text(topico.linhas[l], contentX, lineY);
        lineY += specsLineHeight;
      }
    }
  } else {
    for (let l = 0; l < topico.linhas.length; l++) {
      doc.text(topico.linhas[l], contentX, lineY);
      lineY += specsLineHeight;
    }
  }

  // Espaço de respiro entre tópicos
  return lineY + 1.8;
}

export function baixarBlobPdf(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
