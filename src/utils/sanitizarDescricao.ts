/**
 * Utilitário para higienização e padronização da Descrição Técnica Completa
 * Remove preâmbulos automatizados de IA (ChatGPT, Gemini, etc.) e formata para órgãos públicos.
 */

/**
 * Remove introduções conversacionais de IA como:
 * "Abaixo está a proposta de Descrição para Licitação / Catálogo Técnico Comercial, organizada em tópicos padronizados..."
 */
export function limparTextoDescricaoTecnica(texto: string): string {
  if (!texto) return '';

  // Normaliza quebras de linha
  const normalizado = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const linhas = normalizado.split('\n');

  const linhasFiltradas: string[] = [];
  let encontrouPrimeiroConteudoReal = false;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const trim = linha.trim();
    const lower = trim.toLowerCase();

    // Verifica se a linha é um preâmbulo ou introdução gerada por IA
    const ehPreambulo =
      lower.includes('abaixo está a proposta de descrição') ||
      lower.includes('proposta de descrição para licitação') ||
      lower.includes('catálogo técnico comercial, organizada em tópicos') ||
      lower.includes('sem adjetivos publicitários') ||
      lower.includes('ideal para atendimento a editais e especificações') ||
      lower.includes('especificações de órgãos públicos') ||
      lower.startsWith('abaixo está a proposta') ||
      lower.startsWith('abaixo segue') ||
      lower.startsWith('abaixo seguem') ||
      lower.startsWith('segue a proposta') ||
      lower.startsWith('segue abaixo') ||
      lower.startsWith('aqui está a descrição') ||
      lower.startsWith('aqui estão as especificações') ||
      lower.startsWith('apresentamos abaixo a descrição') ||
      lower.startsWith('esta é a proposta de descrição') ||
      lower.startsWith('descrição técnica para licitação') ||
      lower.startsWith('catálogo técnico comercial:') ||
      lower.startsWith('descrição técnica sugerida:') ||
      lower.startsWith('espero ter ajudado') ||
      lower.startsWith('qualquer dúvida');

    if (ehPreambulo) {
      // Ignora esta linha de preâmbulo
      continue;
    }

    if (trim) {
      encontrouPrimeiroConteudoReal = true;
    }

    // Se ainda não encontrou o primeiro conteúdo real e a linha for vazia, não adiciona no início
    if (!encontrouPrimeiroConteudoReal && !trim) {
      continue;
    }

    linhasFiltradas.push(linha);
  }

  // Remove linhas vazias do final
  while (linhasFiltradas.length > 0 && !linhasFiltradas[linhasFiltradas.length - 1].trim()) {
    linhasFiltradas.pop();
  }

  return linhasFiltradas.join('\n');
}
