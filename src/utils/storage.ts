import { Licitacao, ItemLicitacao, AcessoConfig } from '../types';
import { ACESSO_INICIAL, ID_PADRAO, HASH_PADRAO } from './security';

const ACESSO_KEY = 'gws_acesso_config';
const AUTH_SESSION_KEY = 'gws_auth_active';

export function obterAcessoConfig(): AcessoConfig {
  try {
    const data = localStorage.getItem(ACESSO_KEY);
    if (!data) {
      salvarAcessoConfig(ACESSO_INICIAL);
      return ACESSO_INICIAL;
    }
    const parsed = JSON.parse(data);
    // Se era a credencial antiga de teste admin/123, atualiza para gwsglobal / gwsglobal2026
    if (parsed.usuarioId === 'admin') {
      salvarAcessoConfig(ACESSO_INICIAL);
      return ACESSO_INICIAL;
    }
    return {
      usuarioId: parsed.usuarioId || ID_PADRAO,
      senhaHash: parsed.senhaHash || HASH_PADRAO,
      atualizadoEm: parsed.atualizadoEm,
    };
  } catch {
    return ACESSO_INICIAL;
  }
}

export function salvarAcessoConfig(config: AcessoConfig): void {
  try {
    localStorage.setItem(ACESSO_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Aviso ao salvar acesso no storage local:', err);
  }
}

export function estaAutenticado(): boolean {
  try {
    return (
      sessionStorage.getItem(AUTH_SESSION_KEY) === 'true' ||
      localStorage.getItem(AUTH_SESSION_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

export function registrarLogin(lembrar: boolean): void {
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    if (lembrar) {
      localStorage.setItem(AUTH_SESSION_KEY, 'true');
    }
  } catch {}
}

export function deslogar(): void {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {}
}



// Helper to generate a clean product graphic data URL for default items
export function criarImagemPadrao(tipo: 'notebook' | 'monitor' | 'impressora' | 'periferico'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const grad = ctx.createLinearGradient(0, 0, 400, 300);
  grad.addColorStop(0, '#0F2C59');
  grad.addColorStop(1, '#021B3A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 300);

  // Soft grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 400; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 300);
    ctx.stroke();
  }
  for (let y = 0; y < 300; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(400, y);
    ctx.stroke();
  }

  // Draw hardware icon/device
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';

  if (tipo === 'notebook') {
    // Screen
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(90, 60, 220, 130, 8);
    ctx.fill();
    // Inner display
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(100, 70, 200, 110);
    // Code lines on display
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(115, 85, 80, 6);
    ctx.fillStyle = '#4ADE80';
    ctx.fillRect(115, 98, 120, 6);
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(115, 111, 60, 6);
    // Base
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(60, 200);
    ctx.lineTo(340, 200);
    ctx.lineTo(325, 220);
    ctx.lineTo(75, 220);
    ctx.closePath();
    ctx.fill();
    // Trackpad
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(170, 205, 60, 10);
  } else if (tipo === 'monitor') {
    // Monitor Frame
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(70, 50, 260, 150, 6);
    ctx.fill();
    // Screen display
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(80, 60, 240, 130);
    // Stand
    ctx.fillStyle = '#64748B';
    ctx.fillRect(185, 200, 30, 40);
    // Stand base
    ctx.beginPath();
    ctx.roundRect(140, 240, 120, 12, 4);
    ctx.fill();
  } else if (tipo === 'impressora') {
    // Body
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(90, 100, 220, 110, 8);
    ctx.fill();
    // Paper tray top
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(130, 50, 140, 50);
    // Paper tray out
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(120, 170, 160, 25);
    // Status light
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(280, 125, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Periférico / Caixa
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(110, 70, 180, 160, 12);
    ctx.fill();
  }

  // Label text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(tipo.toUpperCase(), 200, 275);

  return canvas.toDataURL('image/png');
}

const LICITACOES_KEY = 'licitacoes_db_v1';
const ITENS_KEY = 'itens_licitacao_db_v1';
const TIMBRADO_KEY = 'papel_timbrado_config_v1';

export function gerarCabecalhoPadrao(
  nomeEmpresa = 'COMERCIAL DISTRIBUIDORA BRASIL LTDA.',
  cnpj = 'CNPJ: 12.345.678/0001-90 | I.E.: 123.456.789.000'
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background clean white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1600, 240);

  // Top color accents
  ctx.fillStyle = '#0F2C59';
  ctx.fillRect(0, 0, 1600, 16);

  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, 16, 1600, 4);

  // Decorative crest / emblem on the left
  ctx.fillStyle = '#0F2C59';
  ctx.beginPath();
  ctx.arc(100, 128, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Shield / Letter icon inside emblem
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', 100, 128);

  // Company Name and Subtitles
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0F2C59';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(nomeEmpresa, 175, 110);

  ctx.fillStyle = '#64748B';
  ctx.font = '500 22px sans-serif';
  ctx.fillText(cnpj, 175, 150);

  // Small badge on the right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F2C59';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('DEPARTAMENTO DE LICITAÇÕES', 1520, 110);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '18px sans-serif';
  ctx.fillText('CONTRATOS & SUPRIMENTOS PÚBLICOS', 1520, 145);

  // Bottom subtle divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 220);
  ctx.lineTo(1520, 220);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export function gerarRodapePadrao(
  endereco = 'Av. Paulista, 1000 - Cj. 101 - Bela Vista, São Paulo/SP - CEP 01310-100',
  contato = 'Telefone: (11) 3456-7890 | E-mail: licitacoes@comercialbrasil.com.br'
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background clean white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1600, 160);

  // Top dividing line
  ctx.strokeStyle = '#0F2C59';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 20);
  ctx.lineTo(1520, 20);
  ctx.stroke();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(600, 20);
  ctx.lineTo(1000, 20);
  ctx.stroke();

  // Footer text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.font = '500 22px sans-serif';
  ctx.fillText(endereco, 800, 70);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px sans-serif';
  ctx.fillText(contato, 800, 110);

  // Bottom edge bar
  ctx.fillStyle = '#0F2C59';
  ctx.fillRect(0, 152, 1600, 8);

  return canvas.toDataURL('image/png');
}

export function gerarAssinaturaPadrao(nome = 'Gustavo Henrique Severino Pinto'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Transparent background
  ctx.clearRect(0, 0, 600, 160);

  // Stylized ink signature curves (Blue fountain pen look)
  ctx.strokeStyle = '#0F3875';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Capital 'G' flourish
  ctx.moveTo(80, 100);
  ctx.bezierCurveTo(70, 40, 140, 30, 150, 70);
  ctx.bezierCurveTo(155, 100, 110, 130, 95, 110);
  ctx.bezierCurveTo(80, 90, 110, 80, 160, 85);

  // 'ustavo' flowing wave
  ctx.bezierCurveTo(180, 95, 190, 75, 210, 90);
  ctx.bezierCurveTo(225, 100, 235, 75, 255, 88);
  ctx.bezierCurveTo(270, 98, 280, 75, 300, 86);

  // 'H' and 'S' loop
  ctx.bezierCurveTo(320, 60, 335, 40, 345, 95);
  ctx.moveTo(330, 75);
  ctx.lineTo(360, 72);

  // 'Severino' quick stroke
  ctx.bezierCurveTo(370, 65, 390, 95, 410, 82);
  ctx.bezierCurveTo(430, 70, 450, 95, 475, 80);

  // Ending dynamic underline flourish
  ctx.moveTo(110, 120);
  ctx.bezierCurveTo(220, 128, 380, 125, 520, 105);
  ctx.stroke();

  // Subtle second pass for realistic fountain pen pressure
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(130, 122);
  ctx.bezierCurveTo(250, 126, 420, 120, 515, 106);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

import { PapelTimbradoConfig } from '../types';

export const TIMBRADO_PADRAO: PapelTimbradoConfig = {
  razaoSocial: 'GWS GLOBAL LIMITADA',
  cnpj: '53.080.207/0001-80',
  inscricaoEstadual: '47724530033',
  endereco: 'Rua Alpercata Nº 261 – Ana Malaquias Timoteo – mg',
  telefone: '(31) 9 86949588 - (31) 9 99240111',
  email: 'gwsgloballimitada@gmail.com',
  banco: 'Nubank',
  agencia: '0001',
  contaCorrente: '176199733-6',
  nomeRepresentante: 'Gustavo Henrique Severino Pinto',
  rgRepresentante: '20035238 expedido pela PC/MG',
  cpfRepresentante: '020.313.066.93',
  enderecoRepresentante: 'rua Estrelinha, Nº 180, no bairro Macuco, na cidade de Timoteo-MG, Cep 35181726',
  nomeRepresentante2: '',
  rgRepresentante2: '',
  cpfRepresentante2: '',
  enderecoRepresentante2: '',
  assinaturaImagem2: '',
  cabecalhoImagem: '',
  rodapeImagem: '',
  assinaturaImagem: gerarAssinaturaPadrao(),
  alturaCabecalhoMm: 28,
  alturaRodapeMm: 18,
  nomeEmpresa: 'GWS GLOBAL LIMITADA',
  telefoneEmail: '(31) 9 86949588 - (31) 9 99240111 | gwsgloballimitada@gmail.com',

  // Condições e Declaração Trabalhista (pós-tabela)
  prazoEntrega: 'Conforme Aviso de Dispensa Eletrônica e Termo de Referência.',
  prazoValidade: '90 Dias',
  declaracaoTrabalhista: 'Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas.',
  cidadeEmissao: 'Timóteo - MG',
  dataEmissao: new Date().toISOString().split('T')[0],
};

export function obterPapelTimbradoConfig(): PapelTimbradoConfig {
  try {
    const data = localStorage.getItem(TIMBRADO_KEY);
    if (!data) {
      salvarPapelTimbradoConfig(TIMBRADO_PADRAO);
      return TIMBRADO_PADRAO;
    }
    const parsed = JSON.parse(data);
    // Assegura mesclagem com dados padrão da GWS GLOBAL LIMITADA se faltar campos
    const merged: PapelTimbradoConfig = {
      ...TIMBRADO_PADRAO,
      ...parsed,
      razaoSocial: parsed.razaoSocial || TIMBRADO_PADRAO.razaoSocial,
      cnpj: parsed.cnpj || TIMBRADO_PADRAO.cnpj,
      inscricaoEstadual: parsed.inscricaoEstadual || TIMBRADO_PADRAO.inscricaoEstadual,
      endereco: parsed.endereco || TIMBRADO_PADRAO.endereco,
      telefone: parsed.telefone || TIMBRADO_PADRAO.telefone,
      email: parsed.email || TIMBRADO_PADRAO.email,
      banco: parsed.banco || TIMBRADO_PADRAO.banco,
      agencia: parsed.agencia || TIMBRADO_PADRAO.agencia,
      contaCorrente: parsed.contaCorrente || TIMBRADO_PADRAO.contaCorrente,
      nomeRepresentante: parsed.nomeRepresentante || TIMBRADO_PADRAO.nomeRepresentante,
      rgRepresentante: parsed.rgRepresentante || TIMBRADO_PADRAO.rgRepresentante,
      cpfRepresentante: parsed.cpfRepresentante || TIMBRADO_PADRAO.cpfRepresentante,
      enderecoRepresentante: parsed.enderecoRepresentante || TIMBRADO_PADRAO.enderecoRepresentante,
      assinaturaImagem: parsed.assinaturaImagem !== undefined ? parsed.assinaturaImagem : TIMBRADO_PADRAO.assinaturaImagem,
      prazoEntrega: parsed.prazoEntrega || TIMBRADO_PADRAO.prazoEntrega,
      prazoValidade: parsed.prazoValidade || TIMBRADO_PADRAO.prazoValidade,
      declaracaoTrabalhista: parsed.declaracaoTrabalhista || TIMBRADO_PADRAO.declaracaoTrabalhista,
      cidadeEmissao: parsed.cidadeEmissao || TIMBRADO_PADRAO.cidadeEmissao,
      dataEmissao: parsed.dataEmissao || TIMBRADO_PADRAO.dataEmissao,
    };
    return merged;
  } catch (err) {
    console.error('Erro ao ler papel timbrado do storage:', err);
    return TIMBRADO_PADRAO;
  }
}

export function salvarPapelTimbradoConfig(config: PapelTimbradoConfig): void {
  try {
    localStorage.setItem(TIMBRADO_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Aviso: Cota do localStorage excedida ao salvar papel timbrado. Otimizando cache local...', err);
    try {
      // Salva versão sem imagens base64 gigantes no cache do navegador (nuvem armazena dados completos)
      const configLeve = {
        ...config,
        cabecalhoImagem: config.cabecalhoImagem && config.cabecalhoImagem.length > 1000 ? '' : config.cabecalhoImagem,
        rodapeImagem: config.rodapeImagem && config.rodapeImagem.length > 1000 ? '' : config.rodapeImagem,
      };
      localStorage.setItem(TIMBRADO_KEY, JSON.stringify(configLeve));
    } catch {}
  }
}

const RESPONSAVEIS_KEY = 'responsaveis_licitacoes_db_v1';

export function obterResponsaveis(): string[] {
  try {
    const data = localStorage.getItem(RESPONSAVEIS_KEY);
    if (!data) {
      const iniciais = ['Gustavo', 'Victor'];
      salvarResponsaveis(iniciais);
      return iniciais;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return ['Gustavo', 'Victor'];
  } catch (err) {
    console.error('Erro ao ler responsáveis do storage:', err);
    return ['Gustavo', 'Victor'];
  }
}

export function salvarResponsaveis(responsaveis: string[]): void {
  try {
    localStorage.setItem(RESPONSAVEIS_KEY, JSON.stringify(responsaveis));
  } catch (err) {
    console.warn('Aviso ao salvar responsáveis no storage:', err);
  }
}

export function obterLicitacoes(): Licitacao[] {
  try {
    const data = localStorage.getItem(LICITACOES_KEY);
    if (!data) {
      return [];
    }
    const lics: Licitacao[] = JSON.parse(data);
    if (!Array.isArray(lics)) return [];
    // Sanitize legacy modality values and ensure responsavel is populated
    return lics.map((l, idx) => {
      let mod = l.modalidade;
      if (mod === ('Dispensa de Licitação' as any)) mod = 'Dispensa Eletrônica';
      else if (mod === ('Concorrência' as any)) mod = 'Concorrência Eletrônica';
      const responsavel = l.responsavel || (idx % 2 === 0 ? 'Gustavo' : 'Victor');
      return { ...l, modalidade: mod, responsavel };
    });
  } catch (err) {
    console.error('Erro ao ler licitações do storage:', err);
    return [];
  }
}

export function salvarLicitacoes(licitacoes: Licitacao[]): void {
  try {
    localStorage.setItem(LICITACOES_KEY, JSON.stringify(licitacoes));
  } catch (err) {
    console.warn('Aviso ao salvar licitações no storage:', err);
  }
}

export function obterItens(): ItemLicitacao[] {
  try {
    const data = localStorage.getItem(ITENS_KEY);
    if (!data) {
      return [];
    }
    const parsedItens: ItemLicitacao[] = JSON.parse(data);
    if (!Array.isArray(parsedItens)) return [];
    return parsedItens.map(it => ({
      ...it,
      selecionado: it.selecionado !== undefined ? it.selecionado : true,
    }));
  } catch (err) {
    console.error('Erro ao ler itens do storage:', err);
    return [];
  }
}

export function salvarItens(itens: ItemLicitacao[]): void {
  try {
    localStorage.setItem(ITENS_KEY, JSON.stringify(itens));
  } catch (err) {
    console.warn('Cota do localStorage atingida ao salvar itens completos. Otimizando armazenamento local...', err);
    try {
      // Se estourar a cota de 5MB, salva os itens no cache local reduzindo imagens pesadas
      const itensLeves = itens.map(it => {
        if (it.caminho_imagem && it.caminho_imagem.length > 500) {
          return { ...it, caminho_imagem: '' };
        }
        return it;
      });
      localStorage.setItem(ITENS_KEY, JSON.stringify(itensLeves));
    } catch (errFallback) {
      console.warn('Não foi possível gravar itens no localStorage devido ao limite de 5MB do navegador:', errFallback);
    }
  }
}

/**
 * Redimensiona e comprime imagens enviadas pelo usuário em formato JPEG de alta fidelidade
 * Reduz arquivos pesados de 5MB para ~30KB-60KB, evitando estouro de cota e lentidão
 */
export function redimensionarEComprimirImagem(
  arquivo: File,
  larguraMax = 800,
  alturaMax = 600,
  qualidade = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let largura = img.width;
        let altura = img.height;

        if (largura > larguraMax || altura > alturaMax) {
          const ratio = Math.min(larguraMax / largura, alturaMax / altura);
          largura = Math.round(largura * ratio);
          altura = Math.round(altura * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, largura, altura);
        ctx.drawImage(img, 0, 0, largura, altura);

        const dataUrl = canvas.toDataURL('image/jpeg', qualidade);
        resolve(dataUrl);
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(arquivo);
  });
}
