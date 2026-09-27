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
  responsavel: string; // 'Gustavo' | 'Victor' | nome personalizado
  status?: string; // Mantido como opcional para compatibilidade
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
}

export interface AcessoConfig {
  usuarioId: string;
  senhaHash: string;
  senha?: string;
  atualizadoEm?: string;
}

