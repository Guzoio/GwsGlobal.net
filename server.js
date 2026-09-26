import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import archiver from "archiver";
dotenv.config();
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "10mb" }));
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
app.get("/api/exportar/app-py", (_req, res) => {
  const filePath = path.resolve(process.cwd(), "app.py");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "app.py");
  } else {
    res.status(404).send("Arquivo app.py n\xE3o encontrado no servidor.");
  }
});
app.get("/api/exportar/dist-zip", async (_req, res) => {
  try {
    const distPath = path.resolve(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) {
      return res.status(400).send("A pasta dist ainda n\xE3o foi gerada no servidor.");
    }
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="gws_sistema_dist_hostinger.zip"');
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Erro ao gerar dist.zip:", err);
      res.status(500).end();
    });
    archive.pipe(res);
    archive.directory(distPath, false);
    await archive.finalize();
  } catch (error) {
    console.error("Erro no endpoint dist-zip:", error);
    res.status(500).send("Erro ao compactar arquivos de distribui\xE7\xE3o.");
  }
});
app.get("/api/exportar/projeto-completo-zip", async (_req, res) => {
  try {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="gws_sistema_licitacoes_codigo_fonte.zip"');
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Erro ao gerar zip completo:", err);
      res.status(500).end();
    });
    archive.pipe(res);
    const rootDir = process.cwd();
    archive.directory(path.join(rootDir, "src"), "src");
    if (fs.existsSync(path.join(rootDir, "dist"))) {
      archive.directory(path.join(rootDir, "dist"), "dist");
    }
    const filesToInclude = [
      "package.json",
      "index.html",
      "vite.config.ts",
      "server.ts",
      "app.py",
      "tsconfig.json",
      "README.md",
      "metadata.json"
    ];
    for (const f of filesToInclude) {
      const fullPath = path.join(rootDir, f);
      if (fs.existsSync(fullPath)) {
        archive.file(fullPath, { name: f });
      }
    }
    await archive.finalize();
  } catch (error) {
    console.error("Erro no endpoint projeto-completo-zip:", error);
    res.status(500).send("Erro ao compactar c\xF3digo-fonte.");
  }
});
app.post("/api/formatar-descricao", async (req, res) => {
  try {
    const { texto, produto, marca } = req.body;
    const textoBruto = typeof texto === "string" ? texto.trim() : "";
    const nomeProduto = typeof produto === "string" ? produto.trim() : "";
    const nomeMarca = typeof marca === "string" ? marca.trim() : "";
    if (!textoBruto && !nomeProduto) {
      return res.status(400).json({
        erro: "Informe o texto da descri\xE7\xE3o ou o nome do produto para estruturar."
      });
    }
    const prompt = `Voc\xEA \xE9 um especialista em licita\xE7\xF5es p\xFAblicas brasileiras (Lei 14.133/2021) e elabora\xE7\xE3o de propostas comerciais e cat\xE1logos t\xE9cnicos para \xF3rg\xE3os p\xFAblicos.

Sua miss\xE3o \xE9 formatar, organizar e enriquecer a descri\xE7\xE3o t\xE9cnica de um item de licita\xE7\xE3o para constar no Cat\xE1logo T\xE9cnico Ilustrativo da proposta oficial.

DADOS FORNECIDOS:
- Produto / Objeto: ${nomeProduto || "Item de Preg\xE3o / Licita\xE7\xE3o"}
- Marca / Fabricante: ${nomeMarca || "Conforme especificado pelo fornecedor"}
- Texto / Especifica\xE7\xF5es brutas coladas:
"""
${textoBruto || "Sem texto inicial. Gere as especifica\xE7\xF5es t\xE9cnicas recomendadas para o produto/marca informados."}
"""

REGRAS DE FORMATA\xC7\xC3O:
1. Elimine todo tipo de ru\xEDdo de site de e-commerce (ex: "compre agora", pre\xE7os, "frete gr\xE1tis", avalia\xE7\xF5es, links ou propagandas).
2. Estruture em t\xF3picos objetivos e profissionais com o marcador "\u2022 " (bullet point) no in\xEDcio de cada linha.
3. Garanta que cada caracter\xEDstica principal esteja em uma LINHA SEPARADA com quebra de linha real (\\n).
   Exemplo de padr\xE3o visual:
   \u2022 Processador / Motor: ...
   \u2022 Capacidade / Mem\xF3ria / Pot\xEAncia: ...
   \u2022 Dimens\xF5es / Peso / Material: ...
   \u2022 Conex\xF5es / Portas / Acess\xF3rios inclusos: ...
   \u2022 Normas T\xE9cnicas / Certifica\xE7\xF5es: ...
   \u2022 Condi\xE7\xF5es de Garantia: ...
4. Mantenha os dados t\xE9cnicos e especifica\xE7\xF5es fi\xE9is ao texto original, sem inventar dados conflitantes.
5. Escreva em portugu\xEAs formal, claro e t\xE9cnico, pronto para aprova\xE7\xE3o de pregoeiros e fiscais de contrato.
6. Retorne ESTRITAMENTE o texto t\xE9cnico formatado com as quebras de linha e marcadores "\u2022 ", sem introdu\xE7\xF5es como "Aqui est\xE1", sem sauda\xE7\xF5es e sem cercaduras markdown (\`\`\`).`;
    let response;
    const modelosParaTentar = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest"];
    let ultimoErro = null;
    for (const model of modelosParaTentar) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt
        });
        if (response && response.text) break;
      } catch (e) {
        console.warn(`Tentativa com modelo ${model} falhou:`, e?.message);
        ultimoErro = e;
      }
    }
    if (!response || !response.text) {
      throw ultimoErro || new Error("N\xE3o foi poss\xEDvel obter resposta dos modelos Gemini.");
    }
    const descricaoFormatada = response.text.trim();
    return res.json({
      sucesso: true,
      descricaoFormatada
    });
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    return res.status(500).json({
      erro: error?.message || "N\xE3o foi poss\xEDvel estruturar a descri\xE7\xE3o com o Gemini no momento. Verifique a chave de API."
    });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port,
        host: "0.0.0.0",
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {}
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}
startServer();
