import { Licitacao, ItemLicitacao, ContatoPrefeitura } from '../types';
import { ESTADOS_BRASIL_GEO, EstadoBrasilGeo } from '../data/estadosBrasilSvg';

export interface ResumoEstado {
  sigla: string;
  nome: string;
  regiao: string;
  totalLicitacoes: number;
  totalValorProposta: number;
  totalValorGanho: number;
  totalCusto: number;
  totalLucroLiquido: number;
  margemMedia: number;
  prefeituras: string[];
  homologadas: number;
  emAcompanhamento: number;
  geo: EstadoBrasilGeo;
}

export interface ResumoMensal {
  chave: string; // "2026-09" ou "09/2026"
  label: string; // "Set/26"
  ano: number;
  mes: number; // 1 a 12
  totalLicitacoes: number;
  valorProposta: number;
  valorGanho: number;
  lucroLiquido: number;
}

export interface ResumoModalidade {
  modalidade: string;
  quantidade: number;
  valorTotal: number;
  porcentagem: number;
}

export interface ResumoResponsavel {
  responsavel: string;
  quantidade: number;
  valorTotal: number;
  lucroLiquido: number;
}

// Mapa de siglas e nomes completos
export const ESTADOS_BRASIL_OPCOES = [
  { sigla: 'SP', nome: 'São Paulo (SP)' },
  { sigla: 'MG', nome: 'Minas Gerais (MG)' },
  { sigla: 'PR', nome: 'Paraná (PR)' },
  { sigla: 'RJ', nome: 'Rio de Janeiro (RJ)' },
  { sigla: 'SC', nome: 'Santa Catarina (SC)' },
  { sigla: 'RS', nome: 'Rio Grande do Sul (RS)' },
  { sigla: 'GO', nome: 'Goiás (GO)' },
  { sigla: 'BA', nome: 'Bahia (BA)' },
  { sigla: 'DF', nome: 'Distrito Federal (DF)' },
  { sigla: 'ES', nome: 'Espírito Santo (ES)' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul (MS)' },
  { sigla: 'MT', nome: 'Mato Grosso (MT)' },
  { sigla: 'PE', nome: 'Pernambuco (PE)' },
  { sigla: 'CE', nome: 'Ceará (CE)' },
  { sigla: 'PA', nome: 'Pará (PA)' },
  { sigla: 'MA', nome: 'Maranhão (MA)' },
  { sigla: 'PB', nome: 'Paraíba (PB)' },
  { sigla: 'RN', nome: 'Rio Grande do Norte (RN)' },
  { sigla: 'AL', nome: 'Alagoas (AL)' },
  { sigla: 'PI', nome: 'Piauí (PI)' },
  { sigla: 'SE', nome: 'Sergipe (SE)' },
  { sigla: 'TO', nome: 'Tocantins (TO)' },
  { sigla: 'RO', nome: 'Rondônia (RO)' },
  { sigla: 'AM', nome: 'Amazonas (AM)' },
  { sigla: 'AC', nome: 'Acre (AC)' },
  { sigla: 'AP', nome: 'Amapá (AP)' },
  { sigla: 'RR', nome: 'Roraima (RR)' },
];

export const MAPA_NOMES_ESTADOS: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

// Cidades capitais e principais cidades para detecção automática
const CIDADES_ESTADOS: Record<string, string[]> = {
  SP: [
    'são paulo', 'sao paulo', 'cerqueira césar', 'cerqueira cesar', 'itu', 'sorocaba', 'campinas',
    'santos', 'ribeirão preto', 'ribeirao preto', 'são josé dos campos', 'sao jose dos campos',
    'são bernardo', 'sao bernardo', 'santo andré', 'santo andre', 'osasco', 'guarulhos',
    'piracicaba', 'bauru', 'marília', 'marilia', 'presidente prudente', 'araraquara',
    'rio claro', 'indaiatuba', 'cotia', 'barueri', 'jundiaí', 'jundiai', 'americana',
    'limeira', 'jacareí', 'jacarei', 'taubaté', 'taubate', 'franca', 'santa rita',
    'santa rita d\'oeste', 'botucatu', 'votorantim', 'itatiba', 'itapetininga', 'tatuí', 'tatui',
    'avare', 'avaré', 'ourinhos', 'assis', 'lins', 'votuporanga', 'são carlos', 'sao carlos'
  ],
  MG: [
    'minas gerais', 'belo horizonte', 'uberlândia', 'uberlandia', 'contagem', 'juiz de fora',
    'betim', 'montes claros', 'uberaba', 'governador valadares', 'ipatinga', 'sete lagoas',
    'divinópolis', 'divinopolis', 'santa luzia', 'ibiritê', 'ibirite', 'poços de caldas', 'pocos de caldas',
    'patos de minas', 'pouso alegre', 'teófilo otoni', 'teofilo otoni', 'varginha', 'passos'
  ],
  RJ: [
    'rio de janeiro', 'niterói', 'niteroi', 'são gonçalo', 'sao goncalo', 'duque de caxias',
    'nova iguaçu', 'nova iguacu', 'campos dos goytacazes', 'belford roxo', 'são joão de meriti',
    'petrópolis', 'petropolis', 'volta redonda', 'macaé', 'macae', 'cabo frio', 'angra dos reis',
    'teresópolis', 'teresopolis', 'mesquita', 'nilópolis', 'nilopolis', 'maricá', 'marica'
  ],
  PR: [
    'paraná', 'parana', 'curitiba', 'londrina', 'maringá', 'maringa', 'ponta grossa',
    'cascavel', 'são josé dos pinhais', 'sao jose dos pinhais', 'foz do iguaçu', 'foz do iguacu',
    'colombo', 'guarapuava', 'paranaguá', 'paranagua', 'araucária', 'araucaria', 'toledo',
    'apucarana', 'pinhais', 'campo largo', 'arapongas', 'almirante tamandaré', 'ubirata'
  ],
  RS: [
    'rio grande do sul', 'porto alegre', 'caxias do sul', 'canoas', 'pelotas', 'santa maria',
    'gravataí', 'gravatai', 'viamao', 'viamão', 'novo hamburgo', 'são leopoldo', 'sao leopoldo',
    'rio grande', 'alvorada', 'passo fundo', 'sapucaia do sul', 'santa cruz do sul', 'uruguaiana',
    'bento gonçalves', 'bento goncalves', 'erechim', 'lajeado', 'bage', 'bagé'
  ],
  SC: [
    'santa catarina', 'florianópolis', 'florianopolis', 'joinville', 'blumenau', 'são josé',
    'sao jose', 'chapecó', 'chapeco', 'itajaí', 'itajai', 'criciúma', 'criciuma', 'jaraguá do sul',
    'jaragua do sul', 'palhoça', 'palhoca', 'lages', 'balneário camboriú', 'balneario camboriu',
    'brusque', 'tubarão', 'tubarao', 'são bento do sul', 'camboriu', 'navegantes'
  ],
  BA: [
    'bahia', 'salvador', 'feira de santana', 'vitória da conquista', 'vitoria da conquista',
    'camaçari', 'camacari', 'juazeiro', 'itabuna', 'lauro de freitas', 'ilhéus', 'ilheus',
    'jequié', 'jequie', 'teixeira de freitas', 'alagoinhas', 'barreiras', 'porto seguro'
  ],
  GO: [
    'goiás', 'goias', 'goiânia', 'goiania', 'aparecida de goiânia', 'aparecida de goiania',
    'anápolis', 'anapolis', 'rio verde', 'águas lindas de goiás', 'luziânia', 'luziania',
    'itumbiara', 'senador canedo', 'trindade', 'catalão', 'catalao', 'jataí', 'jatai'
  ],
  DF: ['brasília', 'brasilia', 'distrito federal', 'plano piloto', 'taguatinga', 'ceilândia', 'ceilandia'],
  PE: ['pernambuco', 'recife', 'jaboatão dos guararapes', 'olinda', 'caruaru', 'petrolina', 'paulista'],
  CE: ['ceará', 'ceara', 'fortaleza', 'caucaia', 'juazeiro do norte', 'maracanaú', 'sobral'],
  ES: ['espírito santo', 'espirito santo', 'vitória', 'vitoria', 'vila velha', 'serra', 'cariacica'],
  MT: ['mato grosso', 'cuiabá', 'cuiaba', 'várzea grande', 'varzea grande', 'rondonópolis', 'sinop'],
  MS: ['mato grosso do sul', 'campo grande', 'dourados', 'três lagoas', 'tres lagoas', 'corumbá'],
  PA: ['pará', 'para', 'belém', 'belem', 'ananindeua', 'santarém', 'santarem', 'marabá', 'maraba'],
  MA: ['maranhão', 'maranhao', 'são luís', 'sao luis', 'imperatriz', 'são josé de ribamar'],
  RN: ['rio grande do norte', 'natal', 'mossoró', 'mossoro', 'parnamirim'],
  PB: ['paraíba', 'paraiba', 'joão pessoa', 'joao pessoa', 'campina grande', 'santa rita'],
  AL: ['alagoas', 'maceió', 'maceio', 'arapiraca', 'rio largo'],
  PI: ['piauí', 'piaui', 'teresina', 'parnaíba', 'parnaiba', 'picos'],
  SE: ['sergipe', 'aracaju', 'nossa senhora do socorro', 'lagarto', 'itabaiana'],
  RO: ['rondônia', 'rondonia', 'porto velho', 'ji-paraná', 'ji-parana', 'ariquemes', 'cacoal'],
  TO: ['tocantins', 'palmas', 'araguaína', 'araguaina', 'gurupi', 'porto nacional'],
  AM: ['amazonas', 'manaus', 'parintins', 'itacoatiara', 'manacapuru'],
  AC: ['acre', 'rio branco', 'cruzeiro do sul', 'sena madureira'],
  AP: ['amapá', 'amapa', 'macapá', 'macapa', 'santana'],
  RR: ['roraima', 'boa vista', 'rorainópolis']
};

/**
 * Detecta o Estado (UF) a partir do nome do Órgão/Prefeitura ou contatos cadastrados
 */
export function detectarEstado(
  orgaoTexto: string,
  contatos: ContatoPrefeitura[] = []
): string {
  if (!orgaoTexto) return 'SP'; // Default padrão paulista

  const textoNorm = orgaoTexto.trim().toLowerCase();

  // 1. Procura se existe contato com essa prefeitura e cidadeUf cadastrada
  const contatoCorrespondente = contatos.find(
    c =>
      c.prefeitura &&
      (c.prefeitura.toLowerCase() === textoNorm ||
        textoNorm.includes(c.prefeitura.toLowerCase()) ||
        c.prefeitura.toLowerCase().includes(textoNorm))
  );

  if (contatoCorrespondente && contatoCorrespondente.cidadeUf) {
    const ufExtraida = extrairUfDeTexto(contatoCorrespondente.cidadeUf);
    if (ufExtraida) return ufExtraida;
  }

  // 2. Procura padrões explícitos de UF no texto do órgão: "/ SP", "- SP", " SP", "(SP)", etc.
  const ufDireta = extrairUfDeTexto(orgaoTexto);
  if (ufDireta) return ufDireta;

  // 3. Procura nomes de estados completos no texto
  for (const [sigla, nome] of Object.entries(MAPA_NOMES_ESTADOS)) {
    const nomeNorm = nome.toLowerCase();
    if (textoNorm.includes(nomeNorm)) {
      return sigla;
    }
  }

  // 4. Procura por cidades mapeadas
  for (const [sigla, cidades] of Object.entries(CIDADES_ESTADOS)) {
    for (const cid of cidades) {
      if (textoNorm.includes(cid)) {
        return sigla;
      }
    }
  }

  // 5. Padrão se não conseguir identificar com certeza
  return 'SP';
}

function extrairUfDeTexto(texto: string): string | null {
  const todasSiglas = Object.keys(MAPA_NOMES_ESTADOS);

  // Regex para "- SP", "/ SP", "(SP)", " - SP ", " -SP"
  const regexFim = new RegExp(`(?:[-/\\(\\s])\\s*(${todasSiglas.join('|')})\\b`, 'i');
  const match = texto.match(regexFim);
  if (match && match[1]) {
    const achou = match[1].toUpperCase();
    if (MAPA_NOMES_ESTADOS[achou]) return achou;
  }

  // Busca se a sigla está solta no final ou início
  for (const sigla of todasSiglas) {
    const regexExata = new RegExp(`\\b${sigla}\\b`, 'i');
    if (regexExata.test(texto)) {
      return sigla;
    }
  }

  return null;
}

/**
 * Processa todas as análises financeiras, geográficas e temporais completas
 */
export function compilarAnalises(
  licitacoes: Licitacao[],
  itens: ItemLicitacao[],
  contatos: ContatoPrefeitura[]
) {
  // Mapa de itens por licitacaoId para cálculo rápido de custos e lucros
  const itensPorLic = new Map<number, ItemLicitacao[]>();
  itens.forEach(it => {
    const lista = itensPorLic.get(it.licitacao_id) || [];
    lista.push(it);
    itensPorLic.set(it.licitacao_id, lista);
  });

  // Mapa de geo estados
  const geoMap = new Map<string, EstadoBrasilGeo>();
  ESTADOS_BRASIL_GEO.forEach(g => geoMap.set(g.sigla, g));

  // Acumuladores por estado
  const dadosPorEstado = new Map<
    string,
    {
      sigla: string;
      totalLics: number;
      valorProposta: number;
      valorGanho: number;
      custoTotal: number;
      lucroLiquido: number;
      prefeituras: Set<string>;
      homologadas: number;
      emAcompanhamento: number;
    }
  >();

  // Inicializa todos os 27 estados para o mapa
  ESTADOS_BRASIL_GEO.forEach(g => {
    dadosPorEstado.set(g.sigla, {
      sigla: g.sigla,
      totalLics: 0,
      valorProposta: 0,
      valorGanho: 0,
      custoTotal: 0,
      lucroLiquido: 0,
      prefeituras: new Set(),
      homologadas: 0,
      emAcompanhamento: 0,
    });
  });

  // Acumuladores mensais
  const dadosMensais = new Map<
    string,
    {
      chave: string;
      ano: number;
      mes: number;
      totalLics: number;
      valorProposta: number;
      valorGanho: number;
      lucroLiquido: number;
    }
  >();

  // Acumuladores de modalidades e responsáveis
  const dadosModalidades = new Map<string, { qtd: number; valor: number }>();
  const dadosResponsaveis = new Map<string, { qtd: number; valor: number; lucro: number }>();

  let faturamentoGlobal = 0;
  let valorGanhoGlobal = 0;
  let custoGlobal = 0;
  let lucroLiquidoGlobal = 0;
  let totalHomologadas = 0;

  // Itera por cada licitação cadastrada
  licitacoes.forEach(lic => {
    const estado =
      lic.uf && lic.uf.trim().length === 2
        ? lic.uf.trim().toUpperCase()
        : detectarEstado(lic.orgao, contatos);
    const estObj = dadosPorEstado.get(estado) || {
      sigla: estado,
      totalLics: 0,
      valorProposta: 0,
      valorGanho: 0,
      custoTotal: 0,
      lucroLiquido: 0,
      prefeituras: new Set(),
      homologadas: 0,
      emAcompanhamento: 0,
    };

    estObj.totalLics += 1;
    estObj.prefeituras.add(lic.orgao.trim());
    if (lic.homologada) {
      estObj.homologadas += 1;
      totalHomologadas += 1;
    }
    if (lic.acompanhamento) estObj.emAcompanhamento += 1;

    // Itens e valores da licitação
    const itensDesta = itensPorLic.get(lic.id) || [];
    let valorLicProposta = 0;
    let valorLicGanho = 0;
    let custoLic = 0;
    let lucroLic = 0;

    itensDesta.forEach(it => {
      const qtd = Math.max(1, it.quantidade || 1);
      const vTotal = it.valor_total || (it.valor_unitario ? it.valor_unitario * qtd : 0);
      valorLicProposta += vTotal;

      const vGanhoUnit = it.valor_ganho !== undefined && it.valor_ganho > 0 ? it.valor_ganho : it.valor_unitario || 0;
      const vGanhoTotal = vGanhoUnit * qtd;
      valorLicGanho += vGanhoTotal;

      const cFornecUnit = it.custo_fornecedor || 0;
      const cFornecTotal = cFornecUnit * qtd;
      custoLic += cFornecTotal;

      const aliqImposto = (it.aliquota_imposto ?? 10) / 100;
      const outros = it.outros_custos || 0;
      const impostoTotal = vGanhoTotal * aliqImposto;
      const itemLucro = vGanhoTotal - cFornecTotal - impostoTotal - outros;
      lucroLic += itemLucro;
    });

    // Se a licitação não tiver itens cadastrados ainda, estima com base nas médias
    if (itensDesta.length === 0) {
      valorLicProposta = 0;
      valorLicGanho = 0;
      lucroLic = 0;
    }

    estObj.valorProposta += valorLicProposta;
    estObj.valorGanho += valorLicGanho;
    estObj.custoTotal += custoLic;
    estObj.lucroLiquido += lucroLic;
    dadosPorEstado.set(estado, estObj);

    faturamentoGlobal += valorLicProposta;
    valorGanhoGlobal += valorLicGanho;
    custoGlobal += custoLic;
    lucroLiquidoGlobal += lucroLic;

    // Agrupamento temporal (Mês a Mês)
    const { ano, mes, chave, label } = parsearDataCadastro(lic.data_cadastro);
    const mesObj = dadosMensais.get(chave) || {
      chave,
      ano,
      mes,
      totalLics: 0,
      valorProposta: 0,
      valorGanho: 0,
      lucroLiquido: 0,
    };
    mesObj.totalLics += 1;
    mesObj.valorProposta += valorLicProposta;
    mesObj.valorGanho += valorLicGanho;
    mesObj.lucroLiquido += lucroLic;
    dadosMensais.set(chave, mesObj);

    // Modalidade
    const modNome = lic.modalidade || 'Outra';
    const modObj = dadosModalidades.get(modNome) || { qtd: 0, valor: 0 };
    modObj.qtd += 1;
    modObj.valor += valorLicProposta;
    dadosModalidades.set(modNome, modObj);

    // Responsável
    const respNome = lic.responsavel || 'Não informado';
    const respObj = dadosResponsaveis.get(respNome) || { qtd: 0, valor: 0, lucro: 0 };
    respObj.qtd += 1;
    respObj.valor += valorLicProposta;
    respObj.lucro += lucroLic;
    dadosResponsaveis.set(respNome, respObj);
  });

  // Lista de estados ordenada por quantidade de licitações atendidas
  const listaEstados: ResumoEstado[] = Array.from(dadosPorEstado.values()).map(d => {
    const geo = geoMap.get(d.sigla) || {
      sigla: d.sigla,
      nome: MAPA_NOMES_ESTADOS[d.sigla] || d.sigla,
      regiao: 'Sudeste',
      path: '',
      centroX: 300,
      centroY: 300,
    };
    const margem = d.valorGanho > 0 ? (d.lucroLiquido / d.valorGanho) * 100 : 0;
    return {
      sigla: d.sigla,
      nome: geo.nome,
      regiao: geo.regiao,
      totalLicitacoes: d.totalLics,
      totalValorProposta: d.valorProposta,
      totalValorGanho: d.valorGanho,
      totalCusto: d.custoTotal,
      totalLucroLiquido: d.lucroLiquido,
      margemMedia: Math.round(margem * 10) / 10,
      prefeituras: Array.from(d.prefeituras),
      homologadas: d.homologadas,
      emAcompanhamento: d.emAcompanhamento,
      geo,
    };
  });

  // Estados ativos ordenados por mais atendidos
  const estadosMaisAtendidos = [...listaEstados]
    .filter(e => e.totalLicitacoes > 0)
    .sort((a, b) => b.totalLicitacoes - a.totalLicitacoes || b.totalValorProposta - a.totalValorProposta);

  // Lista de meses ordenada cronologicamente
  const mesesOrdenados: ResumoMensal[] = Array.from(dadosMensais.values())
    .sort((a, b) => a.ano - b.ano || a.mes - b.mes)
    .map(m => {
      const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const label = `${nomesMes[m.mes - 1]}/${String(m.ano).slice(-2)}`;
      return {
        ...m,
        totalLicitacoes: m.totalLics,
        label,
      };
    });

  // Modalidades formatadas
  const modalidades: ResumoModalidade[] = Array.from(dadosModalidades.entries()).map(
    ([modalidade, val]) => ({
      modalidade,
      quantidade: val.qtd,
      valorTotal: val.valor,
      porcentagem:
        licitacoes.length > 0 ? Math.round((val.qtd / licitacoes.length) * 100) : 0,
    })
  );

  // Responsáveis formatados
  const responsaveis: ResumoResponsavel[] = Array.from(dadosResponsaveis.entries()).map(
    ([responsavel, val]) => ({
      responsavel,
      quantidade: val.qtd,
      valorTotal: val.valor,
      lucroLiquido: val.lucro,
    })
  );

  // KPIs
  const totalEstadosAtendidos = estadosMaisAtendidos.length;
  const taxaSucesso =
    licitacoes.length > 0 ? Math.round((totalHomologadas / licitacoes.length) * 100) : 0;
  const margemMediaGlobal =
    valorGanhoGlobal > 0
      ? Math.round((lucroLiquidoGlobal / valorGanhoGlobal) * 1000) / 10
      : faturamentoGlobal > 0
      ? Math.round((lucroLiquidoGlobal / faturamentoGlobal) * 1000) / 10
      : 0;

  return {
    listaEstados,
    estadosMaisAtendidos,
    mesesOrdenados,
    modalidades,
    responsaveis,
    kpis: {
      totalLicitacoes: licitacoes.length,
      totalEstadosAtendidos,
      faturamentoGlobal,
      valorGanhoGlobal,
      custoGlobal,
      lucroLiquidoGlobal,
      margemMediaGlobal,
      totalHomologadas,
      taxaSucesso,
    },
  };
}

function parsearDataCadastro(dataStr: string): { ano: number; mes: number; chave: string; label: string } {
  const agora = new Date();
  let ano = agora.getFullYear();
  let mes = agora.getMonth() + 1;

  if (dataStr) {
    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        mes = parseInt(partes[1], 10) || mes;
        ano = parseInt(partes[2], 10) || ano;
        if (ano < 100) ano += 2000;
      }
    } else if (dataStr.includes('-')) {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        ano = parseInt(partes[0], 10) || ano;
        mes = parseInt(partes[1], 10) || mes;
      }
    }
  }

  const chave = `${ano}-${String(mes).padStart(2, '0')}`;
  const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const label = `${nomesMes[mes - 1]}/${String(ano).slice(-2)}`;

  return { ano, mes, chave, label };
}
