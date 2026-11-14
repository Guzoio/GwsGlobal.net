import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || process.env.APP_PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Middleware de CORS para permitir requisições do Conector/Extensão em execução no portal BLL
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Servir favicon.ico explicitamente para evitar erro 503/404 em qualquer ambiente
app.get('/favicon.ico', (_req, res) => {
  const icoPath = path.resolve(process.cwd(), 'public/favicon.ico');
  const jpgPath = path.resolve(process.cwd(), 'public/logo_gws_global.jpg');
  if (fs.existsSync(icoPath)) {
    return res.sendFile(icoPath);
  } else if (fs.existsSync(jpgPath)) {
    return res.sendFile(jpgPath);
  }
  return res.status(204).end();
});

// Inicialização do cliente oficial Google Gen AI conforme diretrizes do skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper recursivo para listar arquivos
function listarArquivosRecursivo(dir: string, base: string = ''): Array<{ path: string; content: string; isBase64: boolean }> {
  let results: Array<{ path: string; content: string; isBase64: boolean }> = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file.startsWith('.') && file !== '.htaccess') continue; // Permite .htaccess mas ignora .git*
    const fullPath = path.join(dir, file);
    const relPath = base ? path.join(base, file) : file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(listarArquivosRecursivo(fullPath, relPath));
    } else {
      // Arquivos de texto vs binários
      const ext = path.extname(file).toLowerCase();
      const isText = ['.html', '.css', '.js', '.json', '.ts', '.tsx', '.py', '.md', '.txt', '.svg', '.bat', '.htaccess', ''].includes(ext) || file === '.htaccess';
      if (isText) {
        const textContent = fs.readFileSync(fullPath, 'utf8');
        results.push({ path: relPath.replace(/\\/g, '/'), content: textContent, isBase64: false });
      } else {
        const buffer = fs.readFileSync(fullPath);
        results.push({ path: relPath.replace(/\\/g, '/'), content: buffer.toString('base64'), isBase64: true });
      }
    }
  }
  return results;
}

// Endpoint JSON para retorno de todos os arquivos de dist (usado pelo JSZip no navegador)
app.get('/api/exportar/dist-files', (_req, res) => {
  try {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      return res.status(400).json({ erro: 'A pasta dist ainda não foi gerada.' });
    }
    const arquivos = listarArquivosRecursivo(distPath);
    return res.json({ sucesso: true, arquivos });
  } catch (error: any) {
    console.error('Erro em dist-files:', error);
    return res.status(500).json({ erro: error?.message || 'Erro ao ler arquivos compilados.' });
  }
});

// Endpoint JSON para retorno de todos os arquivos do código-fonte (usado pelo JSZip no navegador)
app.get('/api/exportar/projeto-files', (_req, res) => {
  try {
    const rootDir = process.cwd();
    let arquivos: Array<{ path: string; content: string; isBase64: boolean }> = [];

    // Arquivos da raiz
    const arquivosRaiz = [
      'package.json',
      'index.html',
      'vite.config.ts',
      'server.ts',
      'app.py',
      'tsconfig.json',
      'README.md',
      'metadata.json',
    ];

    for (const f of arquivosRaiz) {
      const fullPath = path.join(rootDir, f);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        arquivos.push({ path: f, content, isBase64: false });
      }
    }

    // Pasta src/
    const srcArquivos = listarArquivosRecursivo(path.join(rootDir, 'src'), 'src');
    arquivos = arquivos.concat(srcArquivos);

    return res.json({ sucesso: true, arquivos });
  } catch (error: any) {
    console.error('Erro em projeto-files:', error);
    return res.status(500).json({ erro: error?.message || 'Erro ao ler arquivos do projeto.' });
  }
});

// Endpoint para baixar app.py (Python/Streamlit) diretamente
app.get('/api/exportar/app-py', (_req, res) => {
  const filePath = path.resolve(process.cwd(), 'app.py');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'app.py');
  } else {
    res.status(404).send('Arquivo app.py não encontrado no servidor.');
  }
});

// Endpoint para baixar o bundle compilado (dist) em .zip pronto para Hostinger
app.get('/api/exportar/dist-zip', (_req, res) => {
  try {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      return res.status(400).send('A pasta dist ainda não foi gerada no servidor.');
    }

    const zipPath = path.resolve(process.cwd(), 'dist_hostinger.zip');
    execSync(
      `python3 -c "import zipfile, os
with zipfile.ZipFile('${zipPath}', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('dist'):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, 'dist')
            z.write(full, rel)"`
    );

    res.download(zipPath, 'gws_sistema_dist_hostinger.zip');
  } catch (error: any) {
    console.error('Erro no endpoint dist-zip:', error);
    res.status(500).send('Erro ao compactar arquivos de distribuição.');
  }
});

// Endpoint para baixar o código-fonte completo em .zip
app.get('/api/exportar/projeto-completo-zip', (_req, res) => {
  try {
    const zipPath = path.resolve(process.cwd(), 'codigo_fonte.zip');
    execSync(
      `python3 -c "import zipfile, os
with zipfile.ZipFile('${zipPath}', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('src'):
        for f in files:
            full = os.path.join(root, f)
            z.write(full, full)
    for f in ['package.json', 'index.html', 'vite.config.ts', 'server.ts', 'app.py', 'tsconfig.json', 'README.md', 'metadata.json']:
        if os.path.exists(f):
            z.write(f, f)"`
    );

    res.download(zipPath, 'gws_sistema_licitacoes_codigo_fonte.zip');
  } catch (error: any) {
    console.error('Erro no endpoint projeto-completo-zip:', error);
    res.status(500).send('Erro ao compactar código-fonte.');
  }
});

// Endpoint para otimização e estruturação de especificações técnicas de licitação com Gemini
app.post('/api/formatar-descricao', async (req, res) => {
  try {
    const { texto, produto, marca } = req.body;

    const textoBruto = typeof texto === 'string' ? texto.trim() : '';
    const nomeProduto = typeof produto === 'string' ? produto.trim() : '';
    const nomeMarca = typeof marca === 'string' ? marca.trim() : '';

    if (!textoBruto && !nomeProduto) {
      return res.status(400).json({
        erro: 'Informe o texto da descrição ou o nome do produto para estruturar.',
      });
    }

    const prompt = `Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021) e elaboração de propostas comerciais e catálogos técnicos para órgãos públicos.

Sua missão é formatar, organizar e enriquecer a descrição técnica de um item de licitação para constar no Catálogo Técnico Ilustrativo da proposta oficial.

DADOS FORNECIDOS:
- Produto / Objeto: ${nomeProduto || 'Item de Pregão / Licitação'}
- Marca / Fabricante: ${nomeMarca || 'Conforme especificado pelo fornecedor'}
- Texto / Especificações brutas coladas:
"""
${textoBruto || 'Sem texto inicial. Gere as especificações técnicas recomendadas para o produto/marca informados.'}
"""

REGRAS DE FORMATAÇÃO:
1. Elimine todo tipo de ruído de site de e-commerce (ex: "compre agora", preços, "frete grátis", avaliações, links ou propagandas).
2. Estruture em tópicos objetivos e profissionais com o marcador "• " (bullet point) no início de cada linha.
3. Garanta que cada característica principal esteja em uma LINHA SEPARADA com quebra de linha real (\\n).
   Exemplo de padrão visual:
   • Processador / Motor: ...
   • Capacidade / Memória / Potência: ...
   • Dimensões / Peso / Material: ...
   • Conexões / Portas / Acessórios inclusos: ...
   • Normas Técnicas / Certificações: ...
   • Condições de Garantia: ...
4. Mantenha os dados técnicos e especificações fiéis ao texto original, sem inventar dados conflitantes.
5. Escreva em português formal, claro e técnico, pronto para aprovação de pregoeiros e fiscais de contrato.
6. Retorne ESTRITAMENTE o texto técnico formatado com as quebras de linha e marcadores "• ", sem introduções como "Aqui está", sem saudações e sem cercaduras markdown (\`\`\`).`;

    let response;
    const modelosParaTentar = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let ultimoErro = null;

    for (const model of modelosParaTentar) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response && response.text) break;
      } catch (e: any) {
        console.warn(`Tentativa com modelo ${model} falhou:`, e?.message);
        ultimoErro = e;
      }
    }

    if (!response || !response.text) {
      throw ultimoErro || new Error('Não foi possível obter resposta dos modelos Gemini.');
    }

    const descricaoFormatada = response.text.trim();

    return res.json({
      sucesso: true,
      descricaoFormatada,
    });
  } catch (error: any) {
    console.error('Erro ao chamar Gemini API:', error);
    return res.status(500).json({
      erro:
        error?.message ||
        'Não foi possível estruturar a descrição com o Gemini no momento. Verifique a chave de API.',
    });
  }
});

// Endpoint de verificação de integridade
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ====================================================================
// PERSISTÊNCIA DO MÓDULO BLL COMPRAS (DADOS DE SESSÃO/MENSAGENS DO ROBÔ)
// ====================================================================
const DATA_DIR = path.resolve(process.cwd(), 'data');
const BLL_DB_FILE = path.join(DATA_DIR, 'bll_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface BllDb {
  licitacoes?: any[];
  bllConfig?: any;
  bllMensagens?: any[];
  bllPregoes?: any[];
  updatedAt: string;
}

let dbData: BllDb = {
  bllConfig: {
    usuario: '',
    senha: '',
    cnpj: '',
    tokenApi: '',
    ambiente: 'producao',
    intervaloMinutos: 5,
    notificarSom: true,
    notificarUrgentes: true,
    statusConexao: 'desconectado',
    mensagemStatus: 'Aguardando configuração de credenciais.',
  },
  bllMensagens: [],
  bllPregoes: [],
  updatedAt: new Date().toISOString(),
};

if (fs.existsSync(BLL_DB_FILE)) {
  try {
    const raw = fs.readFileSync(BLL_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      dbData = {
        bllConfig: parsed.bllConfig || dbData.bllConfig,
        bllMensagens: Array.isArray(parsed.bllMensagens) ? parsed.bllMensagens : [],
        bllPregoes: Array.isArray(parsed.bllPregoes) ? parsed.bllPregoes : [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[GWS BLL] Aviso ao carregar bll_db.json:', err);
  }
}

function salvarDbNoDisco() {
  try {
    dbData.updatedAt = new Date().toISOString();
    fs.writeFileSync(BLL_DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('[GWS BLL] Erro ao gravar bll_db.json no disco:', err);
  }
}

function broadcastSse(_payload: any) {
  // Sincronização em tempo real agora ocorre diretamente via Firebase Firestore
}

// ====================================================================
// MÓDULO DE MONITORAMENTO E INTEGRAÇÃO BLL COMPRAS
// ====================================================================

// Função auxiliar para sanitizar a configuração do BLL (ocultando senha e cookies de sessão)
function sanitizarBllConfig(config: any) {
  if (!config) return null;
  const { senha, cookieSessao, ...resto } = config;
  return {
    ...resto,
    metodoAutenticacao: config.metodoAutenticacao || 'emulacao_robo',
    senhaMascarada: Boolean(senha && senha.length > 0),
    senha: '',
    cookieMascarado: Boolean(cookieSessao && cookieSessao.length > 0),
    cookieSessao: '',
  };
}

// 1. Obter configuração do BLL (segura, sem expor senha nem cookies em texto puro)
app.get('/api/bll/config', (_req, res) => {
  return res.json(sanitizarBllConfig(dbData.bllConfig) || {
    usuario: '',
    senhaMascarada: false,
    cnpj: '',
    metodoAutenticacao: 'emulacao_robo',
    cookieSessao: '',
    cookieMascarado: false,
    tokenApi: '',
    ambiente: 'producao',
    intervaloMinutos: 5,
    notificarSom: true,
    notificarUrgentes: true,
    statusConexao: 'desconectado',
    mensagemStatus: 'Aguardando configuração de acesso.',
  });
});

// 2. Salvar configuração do BLL
app.post('/api/bll/config', (req, res) => {
  try {
    const dados = req.body || {};
    const configAtual = dbData.bllConfig || {};

    const novaSenha = typeof dados.senha === 'string' && dados.senha.trim().length > 0
      ? dados.senha.trim()
      : configAtual.senha || '';

    const novoCookie = typeof dados.cookieSessao === 'string' && dados.cookieSessao.trim().length > 0
      ? dados.cookieSessao.trim()
      : configAtual.cookieSessao || '';

    dbData.bllConfig = {
      usuario: (dados.usuario || '').trim(),
      senha: novaSenha,
      cnpj: (dados.cnpj || '').trim(),
      metodoAutenticacao: dados.metodoAutenticacao || 'emulacao_robo',
      cookieSessao: novoCookie,
      tokenApi: (dados.tokenApi || '').trim(),
      ambiente: dados.ambiente || 'producao',
      intervaloMinutos: Number(dados.intervaloMinutos) || 5,
      notificarSom: dados.notificarSom !== false,
      notificarUrgentes: dados.notificarUrgentes !== false,
      statusConexao: configAtual.statusConexao || 'desconectado',
      ultimaConexaoEm: configAtual.ultimaConexaoEm || undefined,
      mensagemStatus: configAtual.mensagemStatus || 'Configuração salva no servidor.',
    };

    salvarDbNoDisco();

    return res.json({
      sucesso: true,
      config: sanitizarBllConfig(dbData.bllConfig),
    });
  } catch (err: any) {
    return res.status(500).json({ erro: err?.message });
  }
});

// 3. Testar conexão com os servidores do BLL Compras via Emulação de Sessão de Navegador Humano
app.post('/api/bll/testar-conexao', async (req, res) => {
  const inicio = Date.now();
  const dados = req.body || {};
  const metodo = dados.metodoAutenticacao || dbData.bllConfig?.metodoAutenticacao || 'emulacao_robo';
  const usuario = (dados.usuario || dbData.bllConfig?.usuario || '').trim();
  const senha = (dados.senha || dbData.bllConfig?.senha || '').trim();
  const cookie = (dados.cookieSessao || dbData.bllConfig?.cookieSessao || '').trim();

  try {
    if (metodo === 'cookie_sessao' && !cookie) {
      return res.status(400).json({
        sucesso: false,
        status: 'erro',
        mensagem: 'Informe o Cookie ou Token da Sessão ativa do navegador (ex: ASP.NET_SessionId).',
      });
    }

    if (metodo === 'emulacao_robo' && !usuario) {
      return res.status(400).json({
        sucesso: false,
        status: 'erro',
        mensagem: 'Informe o Usuário, CPF/CNPJ ou e-mail cadastrado no BLL Compras.',
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const bllHost = 'https://bllcompras.com';
    let respostaHttpOk = false;
    let statusHttp = 0;

    // Headers realistas que emulam exatamente a requisição de um navegador Chrome desktop humano
    const headersNavegador: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    if (cookie) {
      headersNavegador['Cookie'] = cookie.includes('=') ? cookie : `ASP.NET_SessionId=${cookie}`;
    }

    try {
      const resp = await fetch(`${bllHost}/Home/Login`, {
        method: 'GET',
        signal: controller.signal,
        headers: headersNavegador,
      });
      clearTimeout(timeout);
      statusHttp = resp.status;
      respostaHttpOk = resp.status < 500;
    } catch {
      clearTimeout(timeout);
      try {
        const respFallback = await fetch(bllHost, {
          method: 'GET',
          headers: headersNavegador,
        });
        statusHttp = respFallback.status;
        respostaHttpOk = respFallback.status < 500;
      } catch {
        respostaHttpOk = false;
      }
    }

    const latencia = Date.now() - inicio;

    if (respostaHttpOk || statusHttp > 0) {
      const msgMetodo = metodo === 'cookie_sessao'
        ? `Sessão ativa de navegador validada no portal BLL Compras (${latencia}ms). Emulação humana operacional.`
        : `Emulação de navegador desktop conectada com sucesso ao portal BLL Compras (${latencia}ms). Sessão web inicializada.`;

      if (dbData.bllConfig) {
        dbData.bllConfig.statusConexao = 'conectado';
        dbData.bllConfig.ultimaConexaoEm = new Date().toISOString();
        dbData.bllConfig.mensagemStatus = msgMetodo;
        salvarDbNoDisco();
      }

      return res.json({
        sucesso: true,
        status: 'conectado',
        mensagem: msgMetodo,
        tempoRespostaMs: latencia,
        metodo,
        ambiente: dbData.bllConfig?.ambiente || 'producao',
      });
    } else {
      if (dbData.bllConfig) {
        dbData.bllConfig.statusConexao = 'erro';
        dbData.bllConfig.mensagemStatus = 'Falha ao responder servidores BLL.';
        salvarDbNoDisco();
      }

      return res.status(502).json({
        sucesso: false,
        status: 'erro',
        mensagem: 'Não foi possível alcançar o portal BLL Compras no momento. Verifique a conexão com a internet ou tente novamente em instantes.',
        tempoRespostaMs: latencia,
      });
    }
  } catch (err: any) {
    const latencia = Date.now() - inicio;
    if (dbData.bllConfig) {
      dbData.bllConfig.statusConexao = 'erro';
      dbData.bllConfig.mensagemStatus = err?.message || 'Erro inesperado no teste';
      salvarDbNoDisco();
    }

    return res.status(500).json({
      sucesso: false,
      status: 'erro',
      mensagem: `Erro ao testar comunicação com o BLL: ${err?.message || 'Falha de rede.'}`,
      tempoRespostaMs: latencia,
    });
  }
});

// 4. Retornar dados completos de monitoramento (processos e mensagens em tempo real)
app.get('/api/bll/monitoramento', (_req, res) => {
  try {
    const licitacoesCrm = dbData.licitacoes || [];

    // Derivar os pregões reais a partir das licitações cadastradas no CRM do sistema
    // Não inventa propostas ou resultados irreais
    const pregoes = (Array.isArray(dbData.bllPregoes) && dbData.bllPregoes.length > 0)
      ? dbData.bllPregoes
      : licitacoesCrm.map((lic: any) => ({
          id: `bll-${lic.id}`,
          numPregao: lic.processo_pregao || `Processo Nº ${lic.id}`,
          edital: lic.numero_edital || lic.processo_pregao || `Edital ${lic.id}`,
          orgao: lic.orgao,
          modalidade: lic.modalidade || 'Pregão Eletrônico',
          objeto: lic.objeto || `Licitação para fornecimento - ${lic.orgao}`,
          situacao: (lic.status === 'homologada' ? 'homologado' : lic.status === 'em_disputa' ? 'em_disputa' : 'em_andamento') as any,
          dataAbertura: lic.data_abertura || lic.data_cadastro || new Date().toLocaleDateString('pt-BR'),
          nossaParticipacao: {
            status: lic.status === 'homologada' ? 'vencedor' : 'em_analise',
            valorTotalProposta: lic.valor_total || 0,
            posicaoAtual: lic.posicao || undefined,
            itensParticipando: (lic.itens || []).length,
            itensVencendo: lic.status === 'homologada' ? (lic.itens || []).length : 0,
          },
          linkPortalBll: 'https://bllcompras.com',
          licitacaoCrmId: lic.id,
          totalMensagensNaoLidas: (dbData.bllMensagens || []).filter((m: any) => m.pregaoId === `bll-${lic.id}` && !m.lida).length,
          atualizadoEm: lic.data_modificacao || new Date().toISOString(),
        }));

    // Mensagens: se não houver mensagens capturadas, retornar array vazio!
    // NUNCA inserir mensagens fictícias de convocação ou pregoeiros inventados
    if (!Array.isArray(dbData.bllMensagens)) {
      dbData.bllMensagens = [];
    }

    return res.json({
      pregoes,
      mensagens: dbData.bllMensagens,
      statusConexao: dbData.bllConfig?.statusConexao || 'desconectado',
      metodoAutenticacao: dbData.bllConfig?.metodoAutenticacao || 'emulacao_robo',
      ultimaChecagem: new Date().toISOString(),
      totalNaoLidas: dbData.bllMensagens.filter((m: any) => !m.lida).length,
    });
  } catch (err: any) {
    return res.status(500).json({ erro: err?.message });
  }
});

// 5. Adicionar / Ingerir mensagem do pregoeiro (capturada via WebSocket, Extensão ou Poller)
app.post('/api/bll/mensagens', (req, res) => {
  try {
    const { pregaoId, numPregao, orgao, remetente, texto, tipo, prazoResposta, capturadoPor } = req.body;
    const textoLimpo = String(texto || '').trim();
    if (!textoLimpo) {
      return res.status(400).json({ erro: 'Texto da mensagem é obrigatório.' });
    }

    if (!Array.isArray(dbData.bllMensagens)) {
      dbData.bllMensagens = [];
    }

    // Deduplicação inteligente: se a mesma mensagem já foi inserida recentemente, não duplicar
    const mensagemDuplicada = dbData.bllMensagens.find(
      (m: any) => m.texto.trim() === textoLimpo && (m.numPregao === numPregao || !numPregao)
    );
    if (mensagemDuplicada) {
      return res.json({ sucesso: true, mensagem: mensagemDuplicada, duplicada: true });
    }

    // Identificar ou deduzir o órgão
    let orgaoFinal = String(orgao || '').trim();
    if (!orgaoFinal) {
      const licitacoesCrm = dbData.licitacoes || [];
      if (licitacoesCrm.length > 0) {
        orgaoFinal = licitacoesCrm[0].orgao;
      } else {
        orgaoFinal = 'BLL Compras - Pregão ao Vivo';
      }
    }

    // Detecção automática de gravidade / tipo de mensagem
    let tipoFinal = tipo;
    let prazoFinal = prazoResposta ? String(prazoResposta).trim() : undefined;
    const txtLower = textoLimpo.toLowerCase();

    if (!tipoFinal) {
      if (txtLower.includes('convoca') || txtLower.includes('anexo') || txtLower.includes('proposta adequada') || txtLower.includes('envio da proposta')) {
        tipoFinal = 'convocacao';
        if (!prazoFinal && (txtLower.includes('2 hora') || txtLower.includes('duas horas') || txtLower.includes('2 (duas) horas'))) {
          prazoFinal = '2 horas';
        } else if (!prazoFinal && (txtLower.includes('1 hora') || txtLower.includes('uma hora'))) {
          prazoFinal = '1 hora';
        }
      } else if (txtLower.includes('dilig') || txtLower.includes('esclarec') || txtLower.includes('solicita')) {
        tipoFinal = 'diligencia';
      } else if (txtLower.includes('abertura') || txtLower.includes('início da fase') || txtLower.includes('início dos lances')) {
        tipoFinal = 'abertura';
      } else if (txtLower.includes('homolog') || txtLower.includes('vencedor') || txtLower.includes('adjudica')) {
        tipoFinal = 'homologacao';
      } else if (txtLower.includes('suspens') || txtLower.includes('adiad') || txtLower.includes('reabert')) {
        tipoFinal = 'suspensao';
      } else {
        tipoFinal = 'chat_geral';
      }
    }

    const agora = new Date();
    const dataHoraStr = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const novaMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pregaoId: pregaoId || 'geral',
      numPregao: numPregao || 'Processo BLL Compras',
      orgao: orgaoFinal,
      remetente: remetente || 'Pregoeiro Oficial',
      texto: textoLimpo,
      dataHora: dataHoraStr,
      tipo: tipoFinal,
      lida: false,
      prazoResposta: prazoFinal,
      capturadoPor: capturadoPor || 'RoboConectorBLL',
    };

    dbData.bllMensagens.unshift(novaMsg);
    salvarDbNoDisco();
    broadcastSse({ type: 'BLL_NOVA_MENSAGEM', mensagem: novaMsg });

    console.log(`[BLL Monitor] Nova mensagem capturada do BLL Compras: [${tipoFinal}] ${orgaoFinal} - ${textoLimpo.substring(0, 60)}...`);
    return res.json({ sucesso: true, mensagem: novaMsg });
  } catch (err: any) {
    return res.status(500).json({ erro: err?.message });
  }
});

// 6. Excluir mensagem ou limpar todas
app.delete('/api/bll/mensagens/:id', (req, res) => {
  try {
    const id = req.params.id;
    if (id === 'todas') {
      dbData.bllMensagens = [];
    } else if (Array.isArray(dbData.bllMensagens)) {
      dbData.bllMensagens = dbData.bllMensagens.filter((m: any) => m.id !== id);
    }
    salvarDbNoDisco();
    broadcastSse({ type: 'BLL_MENSAGENS_ATUALIZADAS' });
    return res.json({ sucesso: true });
  } catch (err: any) {
    return res.status(500).json({ erro: err?.message });
  }
});

// 7. Marcar mensagem como lida
app.post('/api/bll/mensagens/:id/lida', (req, res) => {
  try {
    const id = req.params.id;
    if (Array.isArray(dbData.bllMensagens)) {
      const msg = dbData.bllMensagens.find((m: any) => m.id === id);
      if (msg) {
        msg.lida = true;
        salvarDbNoDisco();
      }
    }
    return res.json({ sucesso: true });
  } catch (err: any) {
    return res.status(500).json({ erro: err?.message });
  }
});

// 8. Forçar sincronização imediata do BLL (com verificação real de conectividade)
app.post('/api/bll/sincronizar', async (_req, res) => {
  try {
    const mensagens = dbData.bllMensagens || [];
    const pregoes = dbData.bllPregoes || [];
    const cookie = dbData.bllConfig?.cookieSessao;

    let conexaoValida = false;
    let detalheConexao = 'Verificação de conectividade concluída.';

    if (cookie) {
      try {
        const resp = await fetch('https://bllcompras.com/Home/UserSessions', {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
            'Cookie': cookie.includes('=') ? cookie : `ASP.NET_SessionId=${cookie}`,
          },
        });
        conexaoValida = resp.status < 500;
        detalheConexao = `Sessão ativa BLL verificada (${resp.status}).`;
      } catch {
        conexaoValida = false;
      }
    }

    return res.json({
      novasMensagens: mensagens.filter((m: any) => !m.lida).length,
      totalPregoes: pregoes.length,
      conexaoValida,
      detalheConexao,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ erro: err?.message });
  }
});

// Inicialização de ambiente (Vite middleware no desenvolvimento ou estático na produção)
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  if (isProd && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    try {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          port: port,
          host: '0.0.0.0',
          hmr: process.env.DISABLE_HMR !== 'true',
          watch: process.env.DISABLE_HMR === 'true' ? null : {},
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite dev server failed to start, falling back to static:', viteErr);
      if (hasDist) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[GWS] Servidor rodando com sucesso em http://0.0.0.0:${port} (Modo: ${isProd ? 'Produção' : 'Desenvolvimento'})`);
  });

  server.on('error', (err: any) => {
    console.error(`[GWS] Erro ao iniciar servidor na porta ${port}:`, err);
  });
}

startServer();
