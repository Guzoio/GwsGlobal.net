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
