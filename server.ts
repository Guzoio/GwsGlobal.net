import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
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
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

startServer();
