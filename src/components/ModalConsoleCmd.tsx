import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, CornerDownLeft, HelpCircle, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { Licitacao } from '../types';
import { obterHistoricoTrocasId } from '../utils/storage';

interface LinhaConsole {
  id: string;
  tipo: 'saida' | 'erro' | 'sucesso' | 'comando' | 'sistema' | 'banner';
  texto: string;
  timestamp?: string;
}

interface ModalConsoleCmdProps {
  aberto: boolean;
  onFechar: () => void;
  licitacoes: Licitacao[];
  onAtualizarDataCadastro: (licId: number, novaData: string) => boolean;
  onTrocarIdLicitacao?: (idAntigo: number, idNovo: number, novoProcesso?: string) => { sucesso: boolean; mensagem: string };
  onTrocarOrgaoLicitacao?: (licId: number, novoOrgao: string) => { sucesso: boolean; mensagem: string };
  onTrocarProcessoLicitacao?: (licId: number, novoProcesso: string) => { sucesso: boolean; mensagem: string };
  onDesfazerTrocaId?: () => { sucesso: boolean; mensagem: string };
}

/**
 * Normaliza qualquer formato de data digitada pelo usuário para o formato padrão brasileiro DD/MM/AAAA.
 */
function normalizarDataCadastro(input: string): string | null {
  const limpo = input.trim();

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    const [y, m, d] = limpo.split('-');
    const dia = parseInt(d, 10);
    const mes = parseInt(m, 10);
    const ano = parseInt(y, 10);
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 2000 && ano <= 2100) {
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    }
    return null;
  }

  // Formato DD/MM/AAAA, DD-MM-AAAA ou DD.MM.AAAA
  const match = limpo.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (match) {
    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const ano = parseInt(match[3], 10);
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 2000 && ano <= 2100) {
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    }
  }

  return null;
}

/**
 * Localiza inteligentemente uma licitação por qualquer identificador digitado pelo usuário:
 * 1. Processo/Pregão exato (ex: "6474/2026")
 * 2. ID numérico exato (ex: "15", "#15")
 * 3. Processo/Pregão normalizado (ignorando pontos, barras e espaços, ex: "64742026")
 * 4. Substring no processo_pregao (ex: "6474" ou "PE 6474")
 * 5. Número antes da barra (ex: "6474" de "6474/2026")
 * 6. Nome do Órgão Público
 */
export function encontrarLicitacao(input: string, lista: Licitacao[]): Licitacao | null {
  if (!input || !Array.isArray(lista) || lista.length === 0) return null;
  const limpo = input.trim();
  if (!limpo) return null;

  const semHashtag = limpo.replace(/^#/, '').trim();
  const termoLower = limpo.toLowerCase();
  const semHashLower = semHashtag.toLowerCase();

  // 1. Tenta correspondência exata no Processo/Pregão (ex: "6474/2026")
  const porProcessoExato = lista.find(l => {
    const proc = String(l?.processo_pregao || '').trim().toLowerCase();
    return proc === termoLower || proc === semHashLower;
  });
  if (porProcessoExato) return porProcessoExato;

  // 2. Se for número puro (sem barras nem letras), tenta correspondência direta com o ID
  if (/^\d+$/.test(semHashtag)) {
    const idNum = parseInt(semHashtag, 10);
    const porIdExato = lista.find(l => Number(l?.id) === idNum);
    if (porIdExato) return porIdExato;
  }

  // 3. Normalização alfanumérica (compara "6474/2026" com "64742026" ou "PE-6474/2026")
  const apenasAlfaNum = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const termoAlfaNum = apenasAlfaNum(limpo);
  if (termoAlfaNum.length >= 2) {
    const porProcessoAlfaNum = lista.find(l => {
      const procAlfaNum = apenasAlfaNum(String(l?.processo_pregao || ''));
      return procAlfaNum === termoAlfaNum || procAlfaNum.includes(termoAlfaNum) || termoAlfaNum.includes(procAlfaNum);
    });
    if (porProcessoAlfaNum) return porProcessoAlfaNum;
  }

  // 4. Substring do processo_pregao
  const porProcessoIncludes = lista.find(l => {
    const proc = String(l?.processo_pregao || '').toLowerCase();
    return proc.includes(termoLower) || termoLower.includes(proc);
  });
  if (porProcessoIncludes) return porProcessoIncludes;

  // 5. Se o termo tem barra (ex: "6474/2026"), busca o número antes da barra
  if (limpo.includes('/')) {
    const antesDaBarra = limpo.split('/')[0].trim();
    if (antesDaBarra && antesDaBarra.length >= 2) {
      const porAntesDaBarra = lista.find(l => {
        const proc = String(l?.processo_pregao || '').toLowerCase();
        return proc.includes(antesDaBarra.toLowerCase());
      });
      if (porAntesDaBarra) return porAntesDaBarra;
    }
  }

  // 6. Busca por nome do Órgão
  const porOrgao = lista.find(l => {
    const org = String(l?.orgao || '').toLowerCase();
    return org.includes(termoLower);
  });
  if (porOrgao) return porOrgao;

  return null;
}

export const ModalConsoleCmd: React.FC<ModalConsoleCmdProps> = ({
  aberto,
  onFechar,
  licitacoes,
  onAtualizarDataCadastro,
  onTrocarIdLicitacao,
  onTrocarOrgaoLicitacao,
  onTrocarProcessoLicitacao,
  onDesfazerTrocaId,
}) => {
  const [linhas, setLinhas] = useState<LinhaConsole[]>([]);
  const [inputComando, setInputComando] = useState('');
  const [historicoComandos, setHistoricoComandos] = useState<string[]>([]);
  const [indiceHistorico, setIndiceHistorico] = useState<number>(-1);
  const [maximizada, setMaximizada] = useState(false);

  // Modo interativo passo-a-passo (para trocar data, trocar ID, trocar órgão ou trocar processo)
  const [modoInterativo, setModoInterativo] = useState<{
    tipo: 'data' | 'id' | 'orgao' | 'processo';
    etapa: 'aguardando_id' | 'aguardando_valor';
    licId?: number;
    licitacaoEncontrada?: Licitacao;
  } | null>(null);

  const finalDoTerminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const bannerInicial: LinhaConsole[] = [
    {
      id: 'banner-1',
      tipo: 'banner',
      texto: [
        '========================================================================',
        '      GWS GLOBAL • TERMINAL CMD DE CONFIGURAÇÕES & ADMINISTRAÇÃO        ',
        '========================================================================',
        '  Ambiente Administrativo Seguro • Banco Nuvem & Servidor Sincronizados',
        '  Dica: Você pode identificar licitações pelo ID (ex: 15) ou PROCESSO (ex: 6474/2026)',
        '  Digite "help" ou "ajuda" para ver os comandos disponíveis.',
        '========================================================================',
      ].join('\n'),
    },
    {
      id: 'banner-2',
      tipo: 'sistema',
      texto: `Sessão iniciada. ${licitacoes.length} licitação(ões) carregada(s) no sistema.`,
    },
  ];

  // Inicializa o terminal ao abrir
  useEffect(() => {
    if (aberto) {
      if (linhas.length === 0) {
        setLinhas(bannerInicial);
      }
      setTimeout(() => {
        inputRef.current?.focus();
        finalDoTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [aberto]);

  // Rola para o fim a cada nova saída
  useEffect(() => {
    if (aberto) {
      finalDoTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [linhas, aberto]);

  if (!aberto) return null;

  const adicionarLinha = (tipo: LinhaConsole['tipo'], texto: string) => {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLinhas(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, tipo, texto, timestamp: hora }]);
  };

  const executarHelp = () => {
    adicionarLinha(
      'saida',
      [
        '------------------------------------------------------------------------',
        'COMANDOS DISPONÍVEIS NO TERMINAL CMD:',
        '------------------------------------------------------------------------',
        '  help / ajuda',
        '      -> Exibe este guia de comandos.',
        '',
        '  trocar-id',
        '      -> [EXCLUSIVO CMD] Altera o número do ID de uma licitação e transfere',
        '         automaticamente todos os itens e propostas vinculados.',
        '         Aceita buscar por ID (ex: 15) ou Processo (ex: 6474/2026).',
        '         Ou direto: trocar-id <id_ou_processo> <novo_id>',
        '         Exemplo: trocar-id 6474/2026 25',
        '',
        '  trocar-processo',
        '      -> [EXCLUSIVO CMD] Altera o número do Processo/Pregão (ex: 6474/2026).',
        '         Ou direto: trocar-processo <id_ou_processo> <novo_processo>',
        '         Exemplo: trocar-processo 15 6474/2026',
        '',
        '  trocar-orgao',
        '      -> [EXCLUSIVO CMD] Altera o nome do Órgão Público de uma licitação.',
        '         Ou direto: trocar-orgao <id_ou_processo> <novo nome do órgão>',
        '         Exemplo: trocar-orgao 6474/2026 Prefeitura Municipal de Campinas',
        '',
        '  trocar-data',
        '      -> Altera a data de cadastro da licitação.',
        '         Ou direto: trocar-data <id_ou_processo> <nova_data>',
        '         Exemplo: trocar-data 6474/2026 15/05/2026',
        '',
        '  listar / ls',
        '      -> Lista todas as licitações com ID, Plataforma, Data, Órgão e Processo.',
        '',
        '  ver <id_ou_processo>',
        '      -> Exibe detalhes completos (ex: ver 15 ou ver 6474/2026).',
        '',
        '  desfazer / undo / voltar-id',
        '      -> [REVERTER] Desfaz a última alteração de ID e restaura',
        '         a licitação e seus itens vinculados ao ID original.',
        '',
        '  historico-id',
        '      -> Mostra o histórico recente de trocas de ID.',
        '',
        '  limpar / clear / cls',
        '      -> Limpa o histórico da tela do terminal.',
        '',
        '  fechar / exit / quit',
        '      -> Fecha a janela do console CMD.',
        '------------------------------------------------------------------------',
      ].join('\n')
    );
  };

  const executarListar = () => {
    if (!Array.isArray(licitacoes) || licitacoes.length === 0) {
      adicionarLinha('saida', 'Nenhuma licitação cadastrada no sistema.');
      return;
    }
    const header = 'ID     | PLAT. | DATA CAD.  | PROCESSO / PREGÃO   | ÓRGÃO PÚBLICO';
    const divisor = '-------+-------+------------+---------------------+---------------------------------------------';
    const linhasTabela = licitacoes.map(l => {
      const idStr = String(l?.id ?? '').padEnd(6, ' ');
      const platStr = String(l?.plataforma || 'BLL').padEnd(5, ' ');
      const dataStr = String(l?.data_cadastro || 'Sem data').padEnd(10, ' ');
      const procTexto = String(l?.processo_pregao || 'Sem processo');
      const procCortado = (procTexto.length > 20 ? procTexto.substring(0, 17) + '...' : procTexto).padEnd(21, ' ');
      const orgaoTexto = String(l?.orgao || 'Sem órgão');
      const orgaoCortado = orgaoTexto.length > 45 ? orgaoTexto.substring(0, 42) + '...' : orgaoTexto;
      return `${idStr} | ${platStr} | ${dataStr} | ${procCortado} | ${orgaoCortado}`;
    });

    adicionarLinha(
      'saida',
      [
        header,
        divisor,
        ...linhasTabela,
        divisor,
        `Total: ${licitacoes.length} licitação(ões) | Dica: Use o ID (ex: ${licitacoes[0]?.id}) ou o Processo (ex: "${licitacoes[0]?.processo_pregao}") para comandos.`,
      ].join('\n')
    );
  };

  const executarVer = (args: string[]) => {
    if (!args || args.length === 0) {
      adicionarLinha('erro', 'Uso incorreto: digite "ver <id ou processo>". Exemplo: ver 15 ou ver 6474/2026');
      return;
    }
    const termo = args.join(' ').trim();
    const lic = encontrarLicitacao(termo, licitacoes);
    if (!lic) {
      adicionarLinha('erro', `Licitação "${termo}" não encontrada no banco de dados. Digite "listar" para ver todas.`);
      return;
    }

    adicionarLinha(
      'saida',
      [
        `=== DETALHES DA LICITAÇÃO #${lic.id} ===`,
        `Processo / Pregão: ${lic.processo_pregao || 'Não informado'}`,
        `Plataforma:        ${lic.plataforma || 'BLL'}`,
        `Órgão Público:     ${lic.orgao || 'Não informado'}`,
        `Modalidade:        ${lic.modalidade || 'Pregão Eletrônico'}`,
        `Data de Cadastro:  ${lic.data_cadastro || 'Não informada'} (original)`,
        `Data da Proposta:  ${lic.data_proposta || 'Mesma do cadastro'}`,
        `Responsável:       ${lic.responsavel || 'Gustavo'}`,
        `UF:                ${lic.uf || 'Não informada'}`,
        `Acompanhamento:    ${lic.acompanhamento ? 'SIM (marcada)' : 'Não'}`,
        `Homologada:        ${lic.homologada ? 'SIM (concluída)' : 'Não'}`,
        `Última alteração:  ${lic.updatedAt || 'N/A'}`,
      ].join('\n')
    );
  };

  const processarComando = (cmdTexto: string) => {
    const raw = cmdTexto.trim();
    if (!raw) return;

    // Registra no histórico de comandos (ArrowUp / ArrowDown)
    setHistoricoComandos(prev => [...prev, raw]);
    setIndiceHistorico(-1);

    // Eco do comando digitado
    adicionarLinha('comando', raw);

    const partes = raw.split(/\s+/);
    const comandoPrincipal = partes[0].toLowerCase();
    const args = partes.slice(1);

    // 1. COMANDOS GLOBAIS PRIORITÁRIOS (Funcionam a qualquer momento)
    if (['limpar', 'clear', 'cls', 'clean', 'reset'].includes(comandoPrincipal)) {
      setModoInterativo(null);
      setLinhas([
        {
          id: `${Date.now()}`,
          tipo: 'sistema',
          texto: 'Terminal limpo. Digite "help" para ver a lista de comandos ou "listar" para ver as licitações.',
        },
      ]);
      return;
    }

    if (['fechar', 'exit', 'quit', 'close'].includes(comandoPrincipal)) {
      setModoInterativo(null);
      onFechar();
      return;
    }

    if (['cancelar', 'sair', 'voltar', 'cancel'].includes(comandoPrincipal)) {
      if (modoInterativo) {
        setModoInterativo(null);
        adicionarLinha('sistema', 'Operação cancelada pelo usuário. Digite "help" para ver os comandos.');
      } else {
        adicionarLinha('sistema', 'Nenhuma operação em andamento para cancelar.');
      }
      return;
    }

    // DESFAZER ÚLTIMA ALTERAÇÃO DE ID
    if (['desfazer', 'desfazer-id', 'undo', 'voltar-id', 'reverter', 'reverter-id'].includes(comandoPrincipal)) {
      setModoInterativo(null);
      if (onDesfazerTrocaId) {
        const res = onDesfazerTrocaId();
        if (res.sucesso) {
          adicionarLinha('sucesso', res.mensagem);
        } else {
          adicionarLinha('erro', res.mensagem);
        }
      } else {
        adicionarLinha('erro', 'Função de desfazer não disponível.');
      }
      return;
    }

    // HISTÓRICO DE ALTERAÇÕES DE ID
    if (['historico-id', 'historico', 'historico_id', 'logs-id'].includes(comandoPrincipal)) {
      const hist = obterHistoricoTrocasId();
      if (!hist || hist.length === 0) {
        adicionarLinha('sistema', 'Nenhuma alteração de ID registrada no histórico local.');
      } else {
        const linhasHist = hist.map((h, i) => {
          const data = h.timestamp ? new Date(h.timestamp).toLocaleTimeString('pt-BR') : '';
          return `  [${i + 1}] ${data} -> ID antigo #${h.idAntigo} renumerado para #${h.idNovo} (${h.orgao || h.processo || 'Licitação'})`;
        });
        adicionarLinha('saida', ['=== HISTÓRICO DE TROCAS DE ID ===', ...linhasHist, 'Dica: Digite "desfazer" para reverter a última alteração.'].join('\n'));
      }
      return;
    }

    if (['help', 'ajuda', '?', '-h', '--help', 'comandos'].includes(comandoPrincipal)) {
      executarHelp();
      if (modoInterativo) {
        adicionarLinha('sistema', `(Assistente ativo para ${modoInterativo.tipo}. Digite o valor ou "cancelar"):`);
      }
      return;
    }

    if (['listar', 'ls', 'dir', 'licitacoes', 'licitações', 'todas'].includes(comandoPrincipal)) {
      executarListar();
      if (modoInterativo && modoInterativo.etapa === 'aguardando_id') {
        adicionarLinha('sistema', `>>> Digite agora o ID ou Processo/Pregão desejado (ou digite "cancelar"):`);
      }
      return;
    }

    if (['ver', 'info', 'show', 'detalhes'].includes(comandoPrincipal)) {
      executarVer(args);
      return;
    }

    // Se o usuário digitou comando direto de troca sem argumentos, inicia o assistente específico
    if (['trocar-id', 'trocarid', 'trocar_id', 'mudar-id', 'alterar-id'].includes(comandoPrincipal) && args.length === 0) {
      setModoInterativo({ tipo: 'id', etapa: 'aguardando_id' });
      adicionarLinha(
        'sistema',
        [
          '------------------------------------------------------------------------',
          'ASSISTENTE PARA ALTERAR ID DA LICITAÇÃO [EXCLUSIVO CMD]:',
          '------------------------------------------------------------------------',
          'Passo 1 de 2: Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
        ].join('\n')
      );
      return;
    }

    if (['trocar-processo', 'trocarprocesso', 'trocar_processo', 'mudar-processo', 'alterar-processo', 'trocar-pregao', 'mudar-pregao', 'processo'].includes(comandoPrincipal) && args.length === 0) {
      setModoInterativo({ tipo: 'processo', etapa: 'aguardando_id' });
      adicionarLinha(
        'sistema',
        [
          '------------------------------------------------------------------------',
          'ASSISTENTE PARA ALTERAR NÚMERO DO PROCESSO/PREGÃO [EXCLUSIVO CMD]:',
          '------------------------------------------------------------------------',
          'Passo 1 de 2: Digite o ID ou Processo atual da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
        ].join('\n')
      );
      return;
    }

    if (['trocar-orgao', 'trocarorgao', 'trocar_orgao', 'mudar-orgao', 'alterar-orgao', 'trocar-órgão', 'mudar-órgão', 'alterar-órgão'].includes(comandoPrincipal) && args.length === 0) {
      setModoInterativo({ tipo: 'orgao', etapa: 'aguardando_id' });
      adicionarLinha(
        'sistema',
        [
          '------------------------------------------------------------------------',
          'ASSISTENTE PARA ALTERAR NOME DO ÓRGÃO PÚBLICO [EXCLUSIVO CMD]:',
          '------------------------------------------------------------------------',
          'Passo 1 de 2: Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
        ].join('\n')
      );
      return;
    }

    if (['trocar-data', 'trocardata', 'trocar_data', 'alterar-data', 'mudar-data'].includes(comandoPrincipal) && args.length === 0) {
      setModoInterativo({ tipo: 'data', etapa: 'aguardando_id' });
      adicionarLinha(
        'sistema',
        [
          '------------------------------------------------------------------------',
          'ASSISTENTE PARA ALTERAR DATA DE CADASTRO:',
          '------------------------------------------------------------------------',
          'Passo 1 de 2: Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
        ].join('\n')
      );
      return;
    }

    // 2. PROCESSAMENTO DO MODO INTERATIVO (Respostas do usuário)
    if (modoInterativo) {
      if (modoInterativo.etapa === 'aguardando_id') {
        const lic = encontrarLicitacao(raw, licitacoes);
        if (!lic) {
          adicionarLinha(
            'erro',
            `Licitação "${raw}" não encontrada. Digite o ID (ex: 15) ou o Processo/Pregão (ex: 6474/2026), ou digite "listar" para ver todos (ou "cancelar"):`
          );
          return;
        }

        setModoInterativo({
          tipo: modoInterativo.tipo,
          etapa: 'aguardando_valor',
          licId: Number(lic.id),
          licitacaoEncontrada: lic,
        });

        adicionarLinha(
          'sistema',
          [
            `✓ Licitação localizada:`,
            `  ID Interno:       #${lic.id}`,
            `  Processo/Pregão:  ${lic.processo_pregao || 'Sem processo'}`,
            `  Órgão Público:    ${lic.orgao || 'Sem órgão'}`,
            `  Plataforma:       ${lic.plataforma || 'BLL'}`,
            `  Data de Cadastro: ${lic.data_cadastro || 'Sem data'}`,
            '',
            modoInterativo.tipo === 'id'
              ? `>>> Digite o NOVO ID numérico desejado (ex: 45 ou 6474) e aperte Enter:`
              : modoInterativo.tipo === 'processo'
              ? `>>> Digite o NOVO número de Processo / Pregão (ex: 6474/2026) e aperte Enter:`
              : modoInterativo.tipo === 'orgao'
              ? `>>> Digite o NOVO NOME do Órgão Público e aperte Enter:`
              : `>>> Digite a NOVA data de cadastro (DD/MM/AAAA ou AAAA-MM-DD) e aperte Enter:`,
          ].join('\n')
        );
        return;
      }

      if (modoInterativo.etapa === 'aguardando_valor') {
        const licId = modoInterativo.licId!;

        if (modoInterativo.tipo === 'id') {
          // Se o usuário digitou um formato com barra como "6474/2026"
          if (raw.includes('/')) {
            const partesBarra = raw.split('/');
            const numExtraido = parseInt(partesBarra[0].replace(/[^0-9]/g, ''), 10);
            const novoProcesso = raw.trim();

            if (!isNaN(numExtraido) && numExtraido > 0) {
              if (onTrocarIdLicitacao) {
                const res = onTrocarIdLicitacao(licId, numExtraido, novoProcesso);
                if (res.sucesso) {
                  adicionarLinha('sucesso', res.mensagem);
                } else {
                  adicionarLinha('erro', res.mensagem);
                }
              }
              setModoInterativo(null);
              return;
            }
          }

          const novoIdNum = parseInt(raw.replace('#', '').trim(), 10);
          if (isNaN(novoIdNum) || novoIdNum <= 0) {
            adicionarLinha('erro', 'Novo ID inválido! Digite um número positivo maior que zero (ex: 50 ou 6474), ou digite "cancelar":');
            return;
          }

          if (novoIdNum === licId) {
            adicionarLinha('erro', `O novo ID #${novoIdNum} é igual ao ID atual! Digite um número diferente (ou "cancelar"):`);
            return;
          }

          const jaExiste = licitacoes.some(l => Number(l.id) === novoIdNum);
          if (jaExiste) {
            adicionarLinha('erro', `O ID #${novoIdNum} já está sendo usado por outra licitação! Escolha outro ID disponível:`);
            return;
          }

          if (onTrocarIdLicitacao) {
            const res = onTrocarIdLicitacao(licId, novoIdNum);
            if (res.sucesso) {
              adicionarLinha('sucesso', res.mensagem);
            } else {
              adicionarLinha('erro', res.mensagem);
            }
          } else {
            adicionarLinha('erro', 'Função de troca de ID não configurada.');
          }
          setModoInterativo(null);
          return;
        }

        if (modoInterativo.tipo === 'processo') {
          const novoProc = raw.trim();
          if (!novoProc) {
            adicionarLinha('erro', 'O número do processo não pode ser vazio. Digite um valor válido (ou "cancelar"):');
            return;
          }

          if (onTrocarProcessoLicitacao) {
            const res = onTrocarProcessoLicitacao(licId, novoProc);
            if (res.sucesso) {
              adicionarLinha('sucesso', res.mensagem);
            } else {
              adicionarLinha('erro', res.mensagem);
            }
          } else {
            adicionarLinha('erro', 'Função de troca de processo não configurada.');
          }
          setModoInterativo(null);
          return;
        }

        if (modoInterativo.tipo === 'orgao') {
          const novoOrgao = raw.trim();
          if (!novoOrgao) {
            adicionarLinha('erro', 'O nome do órgão não pode ser vazio. Digite um nome válido (ou "cancelar"):');
            return;
          }

          if (onTrocarOrgaoLicitacao) {
            const res = onTrocarOrgaoLicitacao(licId, novoOrgao);
            if (res.sucesso) {
              adicionarLinha('sucesso', res.mensagem);
            } else {
              adicionarLinha('erro', res.mensagem);
            }
          } else {
            adicionarLinha('erro', 'Função de troca de órgão não configurada.');
          }
          setModoInterativo(null);
          return;
        }

        if (modoInterativo.tipo === 'data') {
          const dataNormalizada = normalizarDataCadastro(raw);
          if (!dataNormalizada) {
            adicionarLinha('erro', 'Formato de data inválido! Use DD/MM/AAAA (ex: 20/05/2026) ou AAAA-MM-DD (ex: 2026-05-20):');
            return;
          }

          const sucesso = onAtualizarDataCadastro(licId, dataNormalizada);
          if (sucesso) {
            adicionarLinha(
              'sucesso',
              `✓ SUCESSO! A data de cadastro da licitação #${licId} foi alterada de "${modoInterativo.licitacaoEncontrada?.data_cadastro}" para "${dataNormalizada}".\nSincronizado na nuvem e no servidor.`
            );
          } else {
            adicionarLinha('erro', `Falha ao atualizar a data da licitação #${licId}.`);
          }
          setModoInterativo(null);
          return;
        }
      }
    }

    // 3. COMANDOS DIRETOS COM ARGUMENTOS
    switch (comandoPrincipal) {
      case 'trocar-id':
      case 'trocarid':
      case 'trocar_id':
      case 'mudar-id':
      case 'mudarid':
      case 'alterar-id':
      case 'alterarid':
      case 'id': {
        if (args.length >= 2) {
          const lic = encontrarLicitacao(args[0], licitacoes);
          if (!lic) {
            adicionarLinha('erro', `Licitação "${args[0]}" não encontrada. Digite "listar" para ver todos os IDs e processos.`);
            return;
          }
          const rawNovoId = args[1];

          if (rawNovoId.includes('/')) {
            const numPart = parseInt(rawNovoId.split('/')[0].replace(/[^0-9]/g, ''), 10);
            if (!isNaN(numPart) && numPart > 0 && onTrocarIdLicitacao) {
              const res = onTrocarIdLicitacao(lic.id, numPart, rawNovoId.trim());
              if (res.sucesso) adicionarLinha('sucesso', res.mensagem);
              else adicionarLinha('erro', res.mensagem);
              return;
            }
          }

          const newId = parseInt(rawNovoId.replace('#', ''), 10);
          if (isNaN(newId) || newId <= 0) {
            adicionarLinha('erro', 'Novo ID inválido. Deve ser um número maior que zero.');
            return;
          }
          if (lic.id === newId) {
            adicionarLinha('erro', 'O novo ID deve ser diferente do ID atual.');
            return;
          }
          const jaExiste = licitacoes.some(l => Number(l.id) === newId);
          if (jaExiste) {
            adicionarLinha('erro', `O ID #${newId} já pertence a outra licitação existente.`);
            return;
          }
          if (onTrocarIdLicitacao) {
            const res = onTrocarIdLicitacao(lic.id, newId);
            if (res.sucesso) {
              adicionarLinha('sucesso', res.mensagem);
            } else {
              adicionarLinha('erro', res.mensagem);
            }
          }
          return;
        }

        setModoInterativo({ tipo: 'id', etapa: 'aguardando_id' });
        adicionarLinha(
          'sistema',
          [
            '------------------------------------------------------------------------',
            'ASSISTENTE PARA ALTERAR ID DA LICITAÇÃO [EXCLUSIVO CMD]:',
            '------------------------------------------------------------------------',
            'Passo 1 de 2: Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
          ].join('\n')
        );
        break;
      }

      case 'trocar-processo':
      case 'trocarprocesso':
      case 'trocar_processo':
      case 'mudar-processo':
      case 'alterar-processo':
      case 'trocar-pregao':
      case 'mudar-pregao':
      case 'processo':
      case 'pregao': {
        if (args.length >= 2) {
          const lic = encontrarLicitacao(args[0], licitacoes);
          if (!lic) {
            adicionarLinha('erro', `Licitação "${args[0]}" não encontrada.`);
            return;
          }
          const novoProc = args.slice(1).join(' ').trim();
          if (!novoProc) {
            adicionarLinha('erro', 'Número do processo inválido.');
            return;
          }
          if (onTrocarProcessoLicitacao) {
            const res = onTrocarProcessoLicitacao(lic.id, novoProc);
            if (res.sucesso) adicionarLinha('sucesso', res.mensagem);
            else adicionarLinha('erro', res.mensagem);
          }
          return;
        }

        setModoInterativo({ tipo: 'processo', etapa: 'aguardando_id' });
        adicionarLinha(
          'sistema',
          [
            '------------------------------------------------------------------------',
            'ASSISTENTE PARA ALTERAR NÚMERO DO PROCESSO/PREGÃO [EXCLUSIVO CMD]:',
            '------------------------------------------------------------------------',
            'Passo 1 de 2: Digite o ID ou Processo atual da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
          ].join('\n')
        );
        break;
      }

      case 'trocar-orgao':
      case 'trocarorgao':
      case 'trocar_orgao':
      case 'mudar-orgao':
      case 'mudarorgao':
      case 'alterar-orgao':
      case 'alterarorgao':
      case 'trocar-órgão':
      case 'trocarórgão':
      case 'mudar-órgão':
      case 'alterar-órgão':
      case 'orgao':
      case 'órgão': {
        if (args.length >= 2) {
          const lic = encontrarLicitacao(args[0], licitacoes);
          if (!lic) {
            adicionarLinha('erro', `Licitação "${args[0]}" não encontrada.`);
            return;
          }
          const novoNome = args.slice(1).join(' ').trim();
          if (!novoNome) {
            adicionarLinha('erro', 'Nome do órgão inválido. Digite o novo nome completo.');
            return;
          }
          if (onTrocarOrgaoLicitacao) {
            const res = onTrocarOrgaoLicitacao(lic.id, novoNome);
            if (res.sucesso) {
              adicionarLinha('sucesso', res.mensagem);
            } else {
              adicionarLinha('erro', res.mensagem);
            }
          }
          return;
        }

        setModoInterativo({ tipo: 'orgao', etapa: 'aguardando_id' });
        adicionarLinha(
          'sistema',
          [
            '------------------------------------------------------------------------',
            'ASSISTENTE PARA ALTERAR NOME DO ÓRGÃO PÚBLICO [EXCLUSIVO CMD]:',
            '------------------------------------------------------------------------',
            'Passo 1 de 2: Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
          ].join('\n')
        );
        break;
      }

      case 'trocar-data':
      case 'trocardata':
      case 'trocar_data':
      case 'alterar-data':
      case 'mudar-data':
      case 'data': {
        if (args.length >= 2) {
          const lic = encontrarLicitacao(args[0], licitacoes);
          if (!lic) {
            adicionarLinha('erro', `Licitação "${args[0]}" não encontrada.`);
            return;
          }
          const dataNormalizada = normalizarDataCadastro(args[1]);
          if (!dataNormalizada) {
            adicionarLinha('erro', `Data "${args[1]}" inválida. Use DD/MM/AAAA ou AAAA-MM-DD.`);
            return;
          }
          const sucesso = onAtualizarDataCadastro(lic.id, dataNormalizada);
          if (sucesso) {
            adicionarLinha(
              'sucesso',
              `✓ SUCESSO! Data de cadastro da licitação #${lic.id} alterada de "${lic.data_cadastro}" para "${dataNormalizada}".`
            );
          } else {
            adicionarLinha('erro', `Falha ao salvar a data para a licitação #${lic.id}.`);
          }
          return;
        }

        setModoInterativo({ tipo: 'data', etapa: 'aguardando_id' });
        adicionarLinha(
          'sistema',
          [
            '------------------------------------------------------------------------',
            'ASSISTENTE PARA ALTERAR DATA DE CADASTRO:',
            '------------------------------------------------------------------------',
            'Passo 1 de 2: Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026) ou "cancelar":',
          ].join('\n')
        );
        break;
      }

      default: {
        // Se o usuário digitou diretamente o número do ID ou o número do Processo (ex: "6474/2026")
        const licDireta = encontrarLicitacao(raw, licitacoes);
        if (licDireta) {
          adicionarLinha('sistema', `Localizada licitação correspondente a "${raw}":`);
          executarVer([String(licDireta.id)]);
          adicionarLinha(
            'sistema',
            'Dica: Digite "trocar-id", "trocar-processo", "trocar-orgao" ou "trocar-data" para editá-la.'
          );
          return;
        }

        const lower = raw.toLowerCase();
        if (lower.includes('trocar id') || lower.includes('mudar id') || lower.includes('alterar id')) {
          setModoInterativo({ tipo: 'id', etapa: 'aguardando_id' });
          adicionarLinha(
            'sistema',
            [
              'Iniciando assistente para alteração de ID...',
              'Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026):',
            ].join('\n')
          );
        } else if (lower.includes('trocar processo') || lower.includes('mudar processo') || lower.includes('trocar pregão')) {
          setModoInterativo({ tipo: 'processo', etapa: 'aguardando_id' });
          adicionarLinha(
            'sistema',
            [
              'Iniciando assistente para alteração do número de Processo/Pregão...',
              'Digite o ID ou Processo atual (ex: 15 ou 6474/2026):',
            ].join('\n')
          );
        } else if (
          lower.includes('trocar orgao') ||
          lower.includes('mudar orgao') ||
          lower.includes('alterar orgao') ||
          lower.includes('trocar órgão') ||
          lower.includes('mudar órgão') ||
          lower.includes('alterar órgão')
        ) {
          setModoInterativo({ tipo: 'orgao', etapa: 'aguardando_id' });
          adicionarLinha(
            'sistema',
            [
              'Iniciando assistente para alteração do nome do Órgão Público...',
              'Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026):',
            ].join('\n')
          );
        } else if (lower.includes('trocar data') || lower.includes('mudar data') || lower.includes('alterar data')) {
          setModoInterativo({ tipo: 'data', etapa: 'aguardando_id' });
          adicionarLinha(
            'sistema',
            [
              'Iniciando assistente de alteração de data...',
              'Digite o ID ou Processo/Pregão da licitação (ex: 15 ou 6474/2026):',
            ].join('\n')
          );
        } else {
          adicionarLinha(
            'erro',
            `Comando não reconhecido: "${raw}". Digite "help" para ver os comandos (listar, ver, trocar-id, trocar-processo, trocar-orgao, trocar-data).`
          );
        }
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = inputComando;
      setInputComando('');
      processarComando(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historicoComandos.length > 0) {
        const novoIndice = indiceHistorico === -1 ? historicoComandos.length - 1 : Math.max(0, indiceHistorico - 1);
        setIndiceHistorico(novoIndice);
        setInputComando(historicoComandos[novoIndice]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historicoComandos.length > 0 && indiceHistorico !== -1) {
        const novoIndice = indiceHistorico + 1;
        if (novoIndice < historicoComandos.length) {
          setIndiceHistorico(novoIndice);
          setInputComando(historicoComandos[novoIndice]);
        } else {
          setIndiceHistorico(-1);
          setInputComando('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`bg-[#0A101D] border border-cyan-900/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono transition-all duration-200 ${
          maximizada ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-4xl h-[85vh] max-h-[700px]'
        }`}
      >
        {/* Barra de Título Estilo Janela Terminal */}
        <div className="bg-[#070C16] border-b border-cyan-900/40 px-4 py-2.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onFechar}
                className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors cursor-pointer"
                title="Fechar terminal (exit)"
              />
              <button
                type="button"
                onClick={() => setMaximizada(prev => !prev)}
                className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                title="Alternar tamanho da tela"
              />
              <button
                type="button"
                onClick={() => setLinhas([])}
                className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
                title="Limpar tela"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold tracking-wide">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>GWS Terminal CMD</span>
              <span className="text-[10px] text-slate-500">• v1.0.5</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Atalhos Rápidos no Cabeçalho */}
            <button
              type="button"
              onClick={executarHelp}
              className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              title="Ajuda de comandos"
            >
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>help</span>
            </button>
            <button
              type="button"
              onClick={() => processarComando('trocar-id')}
              className="hidden sm:flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 transition-colors cursor-pointer font-bold"
              title="Trocar ID da licitação (Exclusivo CMD)"
            >
              <span>trocar-id</span>
            </button>
            <button
              type="button"
              onClick={() => processarComando('trocar-processo')}
              className="hidden sm:flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 px-2 py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/25 transition-colors cursor-pointer font-bold"
              title="Trocar número do Processo/Pregão (Exclusivo CMD)"
            >
              <span>trocar-processo</span>
            </button>
            <button
              type="button"
              onClick={() => processarComando('trocar-orgao')}
              className="hidden sm:flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200 px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 transition-colors cursor-pointer font-bold"
              title="Trocar nome do Órgão Público (Exclusivo CMD)"
            >
              <span>trocar-orgao</span>
            </button>
            <button
              type="button"
              onClick={() => processarComando('trocar-data')}
              className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              title="Trocar data de cadastro"
            >
              <span>trocar-data</span>
            </button>
            <button
              type="button"
              onClick={() => processarComando('desfazer')}
              className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 transition-colors cursor-pointer font-bold"
              title="Desfazer última alteração de ID (reverter)"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>desfazer</span>
            </button>
            <button
              type="button"
              onClick={() => setMaximizada(prev => !prev)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={maximizada ? 'Restaurar janela' : 'Maximizar'}
            >
              {maximizada ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar (exit)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área de Visualização das Linhas (Saída do Console) */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 overflow-y-auto p-4 space-y-2 text-xs sm:text-[13px] leading-relaxed cursor-text selection:bg-cyan-500/30"
        >
          {linhas.map(linha => {
            if (linha.tipo === 'banner') {
              return (
                <div key={linha.id} className="text-cyan-400/90 whitespace-pre-wrap font-bold select-none py-1">
                  {linha.texto}
                </div>
              );
            }
            if (linha.tipo === 'comando') {
              return (
                <div key={linha.id} className="flex items-start gap-2 text-slate-200 font-semibold">
                  <span className="text-emerald-400 select-none">gws@admin:~$</span>
                  <span className="text-white">{linha.texto}</span>
                  {linha.timestamp && (
                    <span className="text-[10px] text-slate-600 ml-auto select-none">{linha.timestamp}</span>
                  )}
                </div>
              );
            }
            if (linha.tipo === 'sucesso') {
              return (
                <div key={linha.id} className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 whitespace-pre-wrap">
                  {linha.texto}
                </div>
              );
            }
            if (linha.tipo === 'erro') {
              return (
                <div key={linha.id} className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 whitespace-pre-wrap">
                  {linha.texto}
                </div>
              );
            }
            if (linha.tipo === 'sistema') {
              return (
                <div key={linha.id} className="text-amber-300/90 whitespace-pre-wrap py-0.5">
                  {linha.texto}
                </div>
              );
            }
            return (
              <div key={linha.id} className="text-slate-300 whitespace-pre-wrap">
                {linha.texto}
              </div>
            );
          })}
          <div ref={finalDoTerminalRef} />
        </div>

        {/* Dicas de Comandos em Pílulas Clicáveis (Abaixo do histórico) */}
        <div className="bg-[#070C16] border-t border-cyan-900/30 px-4 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 text-slate-400 select-none">
          <span className="text-slate-500 shrink-0">Atalhos:</span>
          <button
            type="button"
            onClick={() => processarComando('help')}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            help
          </button>
          <button
            type="button"
            onClick={() => processarComando('trocar-id')}
            className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0 font-bold"
            title="Alterar número de ID da licitação"
          >
            trocar-id
          </button>
          <button
            type="button"
            onClick={() => processarComando('trocar-processo')}
            className="px-2 py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-white transition-colors cursor-pointer shrink-0 font-bold"
            title="Alterar número do Processo/Pregão (ex: 6474/2026)"
          >
            trocar-processo
          </button>
          <button
            type="button"
            onClick={() => processarComando('trocar-orgao')}
            className="px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 hover:text-white transition-colors cursor-pointer shrink-0 font-bold"
            title="Alterar nome do Órgão Público"
          >
            trocar-orgao
          </button>
          <button
            type="button"
            onClick={() => processarComando('trocar-data')}
            className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white transition-colors cursor-pointer shrink-0 font-bold"
            title="Alterar data de cadastro"
          >
            trocar-data
          </button>
          <button
            type="button"
            onClick={() => processarComando('desfazer')}
            className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white transition-colors cursor-pointer shrink-0 font-bold flex items-center gap-1"
            title="Desfazer última alteração de ID (Ctrl+Z)"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>desfazer</span>
          </button>
          <button
            type="button"
            onClick={() => processarComando('listar')}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            listar
          </button>
          <button
            type="button"
            onClick={() => processarComando('limpar')}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            limpar
          </button>
        </div>

        {/* Linha de Prompt Ativa para Digitar Comandos */}
        <div className="bg-[#090F1C] border-t border-cyan-900/50 p-3 sm:px-4 flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 text-emerald-400 font-bold select-none shrink-0 text-xs sm:text-sm">
            <span>gws@admin:~$</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputComando}
            onChange={e => setInputComando(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              modoInterativo
                ? modoInterativo.etapa === 'aguardando_id'
                  ? `Digite o ID ou Processo/Pregão (ex: 15 ou 6474/2026, ou "cancelar") e aperte Enter...`
                  : modoInterativo.tipo === 'id'
                  ? 'Digite o NOVO ID desejado (ex: 45 ou 6474) e aperte Enter...'
                  : modoInterativo.tipo === 'processo'
                  ? 'Digite o NOVO número do Processo/Pregão (ex: 6474/2026) e aperte Enter...'
                  : modoInterativo.tipo === 'orgao'
                  ? 'Digite o NOVO nome do Órgão Público e aperte Enter...'
                  : 'Digite a nova data (DD/MM/AAAA ou AAAA-MM-DD) e aperte Enter...'
                : 'Digite um comando (ex: trocar-id, trocar-processo, trocar-orgao, trocar-data, listar, ver 6474/2026)...'
            }
            className="flex-1 bg-transparent border-none text-white focus:outline-hidden font-mono text-xs sm:text-sm placeholder:text-slate-600 caret-cyan-400"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />

          <button
            type="button"
            onClick={() => {
              const cmd = inputComando;
              setInputComando('');
              processarComando(cmd);
            }}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
