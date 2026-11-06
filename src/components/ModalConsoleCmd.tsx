import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, CornerDownLeft, Trash2, HelpCircle, Maximize2, Minimize2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Licitacao } from '../types';

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

export const ModalConsoleCmd: React.FC<ModalConsoleCmdProps> = ({
  aberto,
  onFechar,
  licitacoes,
  onAtualizarDataCadastro,
}) => {
  const [linhas, setLinhas] = useState<LinhaConsole[]>([]);
  const [inputComando, setInputComando] = useState('');
  const [historicoComandos, setHistoricoComandos] = useState<string[]>([]);
  const [indiceHistorico, setIndiceHistorico] = useState<number>(-1);
  const [maximizada, setMaximizada] = useState(false);

  // Modo interativo passo-a-passo (solicitado pelo usuário)
  const [modoInterativo, setModoInterativo] = useState<{
    etapa: 'aguardando_id' | 'aguardando_data';
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
        'COMANDOS DISPONÍVEIS:',
        '------------------------------------------------------------------------',
        '  help / ajuda',
        '      -> Exibe este guia de comandos.',
        '',
        '  trocar-data',
        '      -> Inicia o assistente interativo passo-a-passo para alterar a data',
        '         de cadastro de uma licitação (pede ID e depois pede a data).',
        '',
        '  trocar-data <id> <nova_data>',
        '      -> Altera diretamente a data de cadastro da licitação.',
        '         Exemplo: trocar-data 12 15/05/2026',
        '         Exemplo: trocar-data 12 2026-05-15',
        '',
        '  listar / ls',
        '      -> Lista todas as licitações com seus IDs, Órgãos e Datas de Cadastro.',
        '',
        '  ver <id>',
        '      -> Exibe os detalhes completos de uma licitação específica.',
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
    if (licitacoes.length === 0) {
      adicionarLinha('saida', 'Nenhuma licitação cadastrada no sistema.');
      return;
    }
    const header = 'ID     | DATA CAD.  | ÓRGÃO PÚBLICO                             | PROCESSO';
    const divisor = '-------+------------+-------------------------------------------+-------------------';
    const linhasTabela = licitacoes.map(l => {
      const idStr = String(l.id).padEnd(6, ' ');
      const dataStr = (l.data_cadastro || 'Sem data').padEnd(10, ' ');
      const orgaoCortado = (l.orgao.length > 41 ? l.orgao.substring(0, 38) + '...' : l.orgao).padEnd(41, ' ');
      const procCortado = l.processo_pregao.length > 19 ? l.processo_pregao.substring(0, 16) + '...' : l.processo_pregao;
      return `${idStr} | ${dataStr} | ${orgaoCortado} | ${procCortado}`;
    });

    adicionarLinha('saida', [header, divisor, ...linhasTabela, divisor, `Total: ${licitacoes.length} licitação(ões)`].join('\n'));
  };

  const executarVer = (args: string[]) => {
    if (args.length === 0) {
      adicionarLinha('erro', 'Uso incorreto: digite "ver <id>". Exemplo: ver 15');
      return;
    }
    const idNum = parseInt(args[0].replace('#', ''), 10);
    const lic = licitacoes.find(l => Number(l.id) === idNum);
    if (!lic) {
      adicionarLinha('erro', `Licitação #${idNum} não encontrada no banco de dados.`);
      return;
    }

    adicionarLinha(
      'saida',
      [
        `=== DETALHES DA LICITAÇÃO #${lic.id} ===`,
        `Órgão Público:     ${lic.orgao}`,
        `Processo / Pregão: ${lic.processo_pregao}`,
        `Modalidade:        ${lic.modalidade}`,
        `Data de Cadastro:  ${lic.data_cadastro} (original)`,
        `Data da Proposta:  ${lic.data_proposta || 'Mesma do cadastro'}`,
        `Responsável:       ${lic.responsavel}`,
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

    // Se estiver em modo interativo
    if (modoInterativo) {
      if (raw.toLowerCase() === 'cancelar' || raw.toLowerCase() === 'sair') {
        setModoInterativo(null);
        adicionarLinha('sistema', 'Operação cancelada pelo usuário.');
        return;
      }

      if (modoInterativo.etapa === 'aguardando_id') {
        const idNum = parseInt(raw.replace('#', '').trim(), 10);
        if (isNaN(idNum)) {
          adicionarLinha('erro', 'ID inválido! Digite apenas o número do ID (ou digite "cancelar"):');
          return;
        }

        const lic = licitacoes.find(l => Number(l.id) === idNum);
        if (!lic) {
          adicionarLinha('erro', `Licitação com ID #${idNum} não encontrada. Digite um ID válido (ou digite "listar" para ver todos):`);
          return;
        }

        setModoInterativo({
          etapa: 'aguardando_data',
          licId: idNum,
          licitacaoEncontrada: lic,
        });

        adicionarLinha(
          'sistema',
          [
            `✓ Licitação localizada:`,
            `  ID: #${lic.id}`,
            `  Órgão: ${lic.orgao}`,
            `  Processo: ${lic.processo_pregao}`,
            `  Data de Cadastro Atual: "${lic.data_cadastro}"`,
            '',
            `>>> Digite a NOVA data de cadastro para esta licitação (ex: 15/05/2026 ou 2026-05-15):`,
          ].join('\n')
        );
        return;
      }

      if (modoInterativo.etapa === 'aguardando_data') {
        const dataNormalizada = normalizarDataCadastro(raw);
        if (!dataNormalizada) {
          adicionarLinha('erro', 'Formato de data inválido! Use DD/MM/AAAA (ex: 20/05/2026) ou AAAA-MM-DD (ex: 2026-05-20):');
          return;
        }

        const licId = modoInterativo.licId!;
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

    // Modo de comando normal
    const partes = raw.split(/\s+/);
    const comandoPrincipal = partes[0].toLowerCase();
    const args = partes.slice(1);

    switch (comandoPrincipal) {
      case 'help':
      case 'ajuda':
      case '?':
      case '-h':
      case '--help':
        executarHelp();
        break;

      case 'listar':
      case 'ls':
      case 'dir':
      case 'licitacoes':
        executarListar();
        break;

      case 'ver':
      case 'info':
      case 'show':
        executarVer(args);
        break;

      case 'limpar':
      case 'clear':
      case 'cls':
        setLinhas([]);
        break;

      case 'fechar':
      case 'exit':
      case 'quit':
      case 'sair':
        onFechar();
        break;

      case 'trocar-data':
      case 'trocardata':
      case 'trocar_data':
      case 'alterar-data':
      case 'mudar-data':
      case 'data': {
        // Se o usuário digitou direto os argumentos: trocar-data <id> <data>
        if (args.length >= 2) {
          const idNum = parseInt(args[0].replace('#', ''), 10);
          if (isNaN(idNum)) {
            adicionarLinha('erro', `ID "${args[0]}" inválido. Deve ser um número.`);
            return;
          }
          const lic = licitacoes.find(l => Number(l.id) === idNum);
          if (!lic) {
            adicionarLinha('erro', `Licitação #${idNum} não encontrada.`);
            return;
          }
          const dataNormalizada = normalizarDataCadastro(args[1]);
          if (!dataNormalizada) {
            adicionarLinha('erro', `Data "${args[1]}" inválida. Use DD/MM/AAAA ou AAAA-MM-DD.`);
            return;
          }
          const sucesso = onAtualizarDataCadastro(idNum, dataNormalizada);
          if (sucesso) {
            adicionarLinha(
              'sucesso',
              `✓ SUCESSO! Data de cadastro da licitação #${idNum} alterada de "${lic.data_cadastro}" para "${dataNormalizada}".`
            );
          } else {
            adicionarLinha('erro', `Falha ao salvar a data para a licitação #${idNum}.`);
          }
          return;
        }

        // Se digitou apenas o comando, inicia o modo interativo solicitado pelo usuário
        setModoInterativo({ etapa: 'aguardando_id' });
        adicionarLinha(
          'sistema',
          [
            '------------------------------------------------------------------------',
            'ASSISTENTE PARA ALTERAR DATA DE CADASTRO:',
            '------------------------------------------------------------------------',
            'Passo 1 de 2: Digite o ID da licitação que deseja atualizar (ou "cancelar"):',
          ].join('\n')
        );
        break;
      }

      default:
        // Caso o usuário digite frases naturais comuns
        if (raw.toLowerCase().includes('trocar data') || raw.toLowerCase().includes('mudar data') || raw.toLowerCase().includes('alterar data')) {
          setModoInterativo({ etapa: 'aguardando_id' });
          adicionarLinha(
            'sistema',
            [
              'Iniciando assistente de alteração de data...',
              'Digite o ID da licitação que deseja atualizar (ou digite "listar" para ver os IDs):',
            ].join('\n')
          );
        } else {
          adicionarLinha(
            'erro',
            `Comando não reconhecido: "${raw}". Digite "help" para ver a lista de comandos ou "trocar-data" para atualizar a data.`
          );
        }
        break;
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
              <span className="text-[10px] text-slate-500">• v1.0.4</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Atalhos Rápidos */}
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
              onClick={() => processarComando('trocar-data')}
              className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              title="Trocar data de cadastro"
            >
              <span>trocar-data</span>
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
            onClick={() => processarComando('trocar-data')}
            className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white transition-colors cursor-pointer shrink-0 font-bold"
          >
            trocar-data
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
                  ? 'Digite o ID da licitação e aperte Enter...'
                  : 'Digite a nova data (DD/MM/AAAA ou AAAA-MM-DD) e aperte Enter...'
                : 'Digite um comando (ex: help, trocar-data, listar) e pressione Enter...'
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
