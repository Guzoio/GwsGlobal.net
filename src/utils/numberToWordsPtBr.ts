/**
 * Conversor numérico monetário para texto por extenso em Português do Brasil (PT-BR).
 * Trata reais e centavos, singular e plural, milhões, milhares e centenas.
 */

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const ESPECIAIS = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function converterGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  const partes: string[] = [];

  if (c > 0) partes.push(CENTENAS[c]);

  if (d === 1) {
    partes.push(ESPECIAIS[u]);
  } else {
    if (d > 1) partes.push(DEZENAS[d]);
    if (u > 0) partes.push(UNIDADES[u]);
  }

  return partes.join(' e ');
}

export function formatarMoeda(valor: number): string {
  if (isNaN(valor)) return 'R$ 0,00';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function valorPorExtensoPtBr(valor: number): string {
  if (isNaN(valor) || valor === 0) return 'zero reais';
  if (valor < 0) return 'menos ' + valorPorExtensoPtBr(Math.abs(valor));

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  const partesTexto: string[] = [];

  // Bilhões
  const bilhoes = Math.floor(inteiro / 1_000_000_000) % 1_000;
  if (bilhoes > 0) {
    const txt = converterGrupo(bilhoes);
    partesTexto.push(`${txt} ${bilhoes === 1 ? 'bilhão' : 'bilhões'}`);
  }

  // Milhões
  const milhoes = Math.floor(inteiro / 1_000_000) % 1_000;
  if (milhoes > 0) {
    const txt = converterGrupo(milhoes);
    partesTexto.push(`${txt} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
  }

  // Milhares
  const milhares = Math.floor(inteiro / 1_000) % 1_000;
  if (milhares > 0) {
    const txt = converterGrupo(milhares);
    if (milhares === 1 && partesTexto.length === 0) {
      partesTexto.push('um mil');
    } else {
      partesTexto.push(`${txt} mil`);
    }
  }

  // Unidades / Centenas
  const resto = inteiro % 1_000;
  if (resto > 0) {
    partesTexto.push(converterGrupo(resto));
  }

  const textoInteiro = partesTexto.join(' e ');

  let textoMoeda = '';
  if (inteiro > 0) {
    if (inteiro === 1) {
      textoMoeda = `${textoInteiro} real`;
    } else if (inteiro % 1_000_000 === 0 && inteiro >= 1_000_000) {
      textoMoeda = `${textoInteiro} de reais`;
    } else {
      textoMoeda = `${textoInteiro} reais`;
    }
  }

  let textoCentavos = '';
  if (centavos > 0) {
    const txtC = converterGrupo(centavos);
    const rotuloC = centavos === 1 ? 'centavo' : 'centavos';
    textoCentavos = `${txtC} ${rotuloC}`;
  }

  if (textoMoeda && textoCentavos) {
    return `${textoMoeda} e ${textoCentavos}`;
  } else if (textoMoeda) {
    return textoMoeda;
  } else if (textoCentavos) {
    return textoCentavos;
  }

  return 'zero reais';
}

const MESES_PT_BR = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/**
 * Formata data no formato brasileiro oficial com cidade:
 * Ex: "Timóteo - MG, 24 de setembro de 2026"
 */
export function formatarDataExtensoPtBr(dataInput?: string, cidade = 'Timóteo - MG'): string {
  let dia = new Date().getDate();
  let mesIndex = new Date().getMonth();
  let ano = new Date().getFullYear();

  if (dataInput) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataInput)) {
      const [y, m, d] = dataInput.split('-').map(Number);
      dia = d;
      mesIndex = m - 1;
      ano = y;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataInput)) {
      const [d, m, y] = dataInput.split('/').map(Number);
      dia = d;
      mesIndex = m - 1;
      ano = y;
    } else {
      return dataInput;
    }
  }

  const nomeMes = MESES_PT_BR[mesIndex] || 'janeiro';
  return cidade ? `${cidade}, ${dia} de ${nomeMes} de ${ano}` : `${dia} de ${nomeMes} de ${ano}`;
}
