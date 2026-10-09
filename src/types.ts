export type ModalidadeLic = 
  | 'Pregão Eletrônico'
  | 'Dispensa Eletrônica'
  | 'Concorrência Eletrônica'
  | 'Leilão Eletrônico';

export const RESPONSAVEIS_PADRAO = ['Gustavo', 'Victor'] as const;
export type ResponsavelLic = string;

export interface Licitacao {
  id: number;
  orgao: string;
  processo_pregao: string;
  modalidade: ModalidadeLic;
  data_cadastro: string; // DD/MM/AAAA
  data_proposta?: string; // Data específica da proposta no documento PDF desta licitação (YYYY-MM-DD ou DD/MM/AAAA)
  responsavel: string; // 'Gustavo' | 'Victor' | nome personalizado
  status?: string; // Mantido como opcional para compatibilidade
  acompanhamento?: boolean; // 👁 Marcada para acompanhamento (amarelo)
  homologada?: boolean; // ✓ Concluída / Homologada (verde)
  uf?: string; // Estado (UF) da licitação (ex: 'SP', 'MG', 'PR')
}

export interface ItemLicitacao {
  id: number;
  licitacao_id: number;
  num_item: number;
  link_produto?: string;
  descricao_curta: string;
  descricao_tecnica: string;
  marca: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  caminho_imagem?: string; // base64 data URL or asset path
  lance_minimo?: number; // Lance mínimo unitário aceitável para disputa (alinhamento interno)
  lance_lote?: number; // Lance mínimo total do lote (alinhamento interno)
  selecionado?: boolean; // Se marcado, vai para o PDF da proposta comercial e catálogo (default: true)
  observacoes?: string; // Diretório de links reservas (apenas uso interno, não sai no PDF)
  custo_fornecedor?: number; // Preço/custo do fornecedor para análise de lucro
  valor_ganho?: number; // Valor unitário final por quanto ganhou a licitação na disputa
  aliquota_imposto?: number; // Alíquota percentual de imposto (ex: 10% editável)
  outros_custos?: number; // Custos adicionais de frete ou taxas operacionais
}

export interface EmpresaDados {
  nome: string;
  cnpj: string;
  ie: string;
  endereco: string;
  telefone: string;
  email: string;
  cidade: string;
}

export interface PapelTimbradoConfig {
  // Dados Oficiais da Empresa (conforme modelo timbrado)
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  telefone: string;
  email: string;
  banco: string;
  agencia: string;
  contaCorrente: string;

  // Dados do Representante Legal (para qualificação e texto de abertura)
  nomeRepresentante: string;
  rgRepresentante: string;
  cpfRepresentante: string;
  enderecoRepresentante: string;

  // 2º Representante Legal (Opcional - caso a empresa possua 2 sócios ou representantes)
  nomeRepresentante2?: string;
  rgRepresentante2?: string;
  cpfRepresentante2?: string;
  enderecoRepresentante2?: string;
  cargoRepresentante?: string;
  cargoRepresentante2?: string;
  assinaturaImagem2?: string; // Base64 data URL da assinatura do 2º responsável

  // Imagens do Timbrado (Cabeçalho, Rodapé e Assinatura)
  cabecalhoImagem: string; // Base64 data URL
  rodapeImagem: string;    // Base64 data URL
  assinaturaImagem?: string; // Base64 data URL da assinatura do responsável
  alturaCabecalhoMm: number;
  alturaRodapeMm: number;

  // Condições e Declaração Trabalhista (pós-tabela)
  prazoEntrega?: string;
  prazoValidade?: string;
  declaracaoTrabalhista?: string;
  dataEmissao?: string; // Data selecionada para emissão
  cidadeEmissao?: string;

  // Campos de compatibilidade
  nomeEmpresa?: string;
  telefoneEmail?: string;

  // Tributação & Análise de Lucro
  percentualImposto?: number; // Percentual de imposto configurado para análise de lucro (ex: 10.00 para 10%)
}

export interface AcessoConfig {
  usuarioId: string;
  senhaHash: string;
  senha?: string;
  atualizadoEm?: string;
}

export type BllStatusConexao = 'desconectado' | 'conectado' | 'erro' | 'autenticando';

export type MetodoAutenticacaoBll = 'emulacao_robo' | 'cookie_sessao';

export interface BllConfig {
  usuario: string; // Login / E-mail / CNPJ do fornecedor no BLL
  senha?: string; // Senha (somente usada no envio para o servidor)
  senhaMascarada?: boolean; // Indica se há senha salva com segurança no servidor
  cnpj?: string; // CNPJ da empresa cadastrada no BLL
  metodoAutenticacao?: MetodoAutenticacaoBll; // 'emulacao_robo' (Robô com Headers de Navegador) | 'cookie_sessao' (Sessão Ativa do Navegador)
  cookieSessao?: string; // Cookie da sessão ativa (ex: ASP.NET_SessionId / .ASPXAUTH do navegador)
  cookieMascarado?: boolean; // Indica se há cookie de sessão salvo no servidor
  tokenApi?: string; // Mantido para compatibilidade
  ambiente?: 'producao' | 'homologacao';
  intervaloMinutos?: number; // Frequência do radar (2, 5, 10 ou 15 min)
  notificarSom?: boolean; // Alerta sonoro ao receber convocação/diligência
  notificarUrgentes?: boolean; // Alerta de banner para convocações
  statusConexao: BllStatusConexao;
  ultimaConexaoEm?: string;
  mensagemStatus?: string;
}

export type TipoMensagemBll =
  | 'convocacao'   // Convocação de anexo / proposta adequada / habilitação
  | 'diligencia'   // Pedido de esclarecimento / documentos complementares
  | 'chat_geral'   // Mensagem geral do pregoeiro
  | 'abertura'     // Abertura de fase de lances / propostas
  | 'suspensao'    // Suspensão / adiamento da sessão
  | 'homologacao'; // Homologação / adjudicação

export interface MensagemBll {
  id: string;
  pregaoId: string;
  numPregao: string;
  orgao: string;
  remetente: string; // 'Pregoeiro(a) Oficial', 'Sistema BLL Compras', etc.
  texto: string;
  dataHora: string;
  tipo: TipoMensagemBll;
  lida: boolean;
  prazoResposta?: string; // ex: 'Restam 45 minutos'
  prazoDataLimite?: string;
}

export type SituacaoPregaoBll =
  | 'em_disputa'
  | 'julgamento'
  | 'habilitacao'
  | 'convocacao_aberta'
  | 'homologado'
  | 'suspenso'
  | 'aguardando_abertura';

export interface PregaoMonitoradoBll {
  id: string;
  numPregao: string;
  edital: string;
  orgao: string;
  cidadeUf?: string;
  modalidade: 'Pregão Eletrônico' | 'Dispensa Eletrônica';
  objeto: string;
  situacao: SituacaoPregaoBll;
  dataAbertura: string;
  nossaParticipacao: {
    status: 'classificado' | 'desclassificado' | 'vencedor' | 'em_analise';
    valorTotalProposta?: number;
    posicaoAtual?: number;
    itensParticipando: number;
    itensVencendo: number;
  };
  ultimaMensagem?: {
    texto: string;
    dataHora: string;
    tipo: TipoMensagemBll;
  };
  totalMensagensNaoLidas: number;
  linkPortalBll?: string;
  licitacaoCrmId?: number; // Vinculado a uma licitação do nosso CRM
  atualizadoEm: string;
}

export type TipoContatoPrefeitura = 'whatsapp' | 'fixo' | 'celular' | 'email';

export interface ContatoPrefeitura {
  id: string;
  prefeitura: string; // Nome da Prefeitura ou Órgão
  cidadeUf?: string; // Ex: 'Santa Rita d\'Oeste - SP'
  nomeContato: string; // Nome da pessoa de contato
  cargoSetor?: string; // Ex: 'Pregoeiro(a)', 'Setor de Licitações', 'Compras', etc.
  whatsapp?: string; // Número de WhatsApp (ex: '(17) 99876-5432')
  telefoneFixo?: string; // Telefone fixo da prefeitura
  ramal?: string; // Ramal interno (ex: '204')
  email?: string; // E-mail direto
  observacoes?: string; // Horários, avisos, notas da conversa
  favorito?: boolean;
  dataCadastro: string; // Data de cadastro (ISO)
  licitacaoId?: number; // Vinculado a uma licitação do CRM (opcional)
}

// ====================================================================
// MÓDULO DE COBRANÇAS & FATURAMENTO DE PREFEITURAS
// ====================================================================
export type TipoContagemDias = 'uteis' | 'corridos';
export type EventoInicioLiquidacao = 'entrega' | 'envio_nota';
export type EventoInicioPagamento = 'liquidacao' | 'envio_nota' | 'entrega';

export type StatusCobranca =
  | 'em_dia'
  | 'proximo_vencimento'
  | 'atrasado'
  | 'aguardando_entrega'
  | 'verificar_entrega'
  | 'aguardando_nota'
  | 'aguardando_liquidacao'
  | 'liquidacao_atrasada'
  | 'aguardando_pagamento'
  | 'pagamento_atrasado'
  | 'pago';

export interface Cobranca {
  id: string;
  // 1. Dados Principais
  prefeitura: string;
  responsavel?: string; // Responsável pela cobrança (ex: 'Gustavo', 'Victor', 'Junto')
  processo?: string; // Número do processo/licitação
  licitacaoId?: number; // Vínculo com licitação do CRM (opcional)
  ordemFornecimento?: string; // Número da ordem de fornecimento, se houver
  numeroNota?: string; // Número da nota fiscal
  produto: string; // Produto/item
  quantidade?: number; // Quantidade fornecida
  valorNota: number; // Valor da nota em R$
  observacoes?: string;

  // 2. Datas e Acompanhamento de Entrega
  dataEnvioProdutos?: string; // Data de envio dos produtos (YYYY-MM-DD)
  dataPrevisaoEntrega?: string; // Data prevista para chegada/entrega (YYYY-MM-DD)
  dataRealEntrega?: string; // Data real da entrega (YYYY-MM-DD)
  produtoRecebido?: boolean; // ✅ Produto recebido

  // 3. Envio da Nota Fiscal
  dataEnvioNota?: string; // Data de envio da nota fiscal (YYYY-MM-DD)
  notaEnviada?: boolean; // Status da nota (Enviada / Pendente)

  // 4. Regras e Registro da Liquidação
  diasLiquidacao: number; // Quantidade de dias (ex: 7)
  tipoDiasLiquidacao: TipoContagemDias; // 'uteis' | 'corridos'
  eventoInicioLiquidacao: EventoInicioLiquidacao; // 'entrega' | 'envio_nota'
  dataRealLiquidacao?: string; // Data da liquidação realizada (YYYY-MM-DD)
  liquidado?: boolean; // ✅ Marcar como liquidado

  // 5. Regras e Registro do Pagamento
  diasPagamento: number; // Quantidade de dias (ex: 5)
  tipoDiasPagamento: TipoContagemDias; // 'uteis' | 'corridos'
  eventoInicioPagamento: EventoInicioPagamento; // 'liquidacao' | 'envio_nota' | 'entrega'
  dataRealPagamento?: string; // Data do pagamento realizado (YYYY-MM-DD)
  pago?: boolean; // ✅ Pagamento realizado

  // Metadados
  criadoEm: string;
  atualizadoEm: string;
}

export interface AlertaCobranca {
  id: string;
  cobrancaId: string;
  prefeitura: string;
  numeroNota?: string;
  valorNota: number;
  tipo:
    | 'entrega_hoje'
    | 'entrega_atrasada'
    | 'nota_pendente'
    | 'liquidacao_vencendo'
    | 'liquidacao_atrasada'
    | 'pagamento_vencendo'
    | 'pagamento_atrasado';
  titulo: string;
  mensagem: string;
  diasRestantes?: number;
  urgencia: 'critica' | 'alta' | 'media' | 'informativa';
  dataLimite?: string;
  dataCriacao: string;
}



