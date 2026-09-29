import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || process.env.APP_PORT || "3000", 10);
app.use(express.json({ limit: "10mb" }));
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
function listarArquivosRecursivo(dir, base = "") {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file.startsWith(".") && file !== ".htaccess") continue;
    const fullPath = path.join(dir, file);
    const relPath = base ? path.join(base, file) : file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(listarArquivosRecursivo(fullPath, relPath));
    } else {
      const ext = path.extname(file).toLowerCase();
      const isText = [".html", ".css", ".js", ".json", ".ts", ".tsx", ".py", ".md", ".txt", ".svg", ".bat", ".htaccess", ""].includes(ext) || file === ".htaccess";
      if (isText) {
        const textContent = fs.readFileSync(fullPath, "utf8");
        results.push({ path: relPath.replace(/\\/g, "/"), content: textContent, isBase64: false });
      } else {
        const buffer = fs.readFileSync(fullPath);
        results.push({ path: relPath.replace(/\\/g, "/"), content: buffer.toString("base64"), isBase64: true });
      }
    }
  }
  return results;
}
app.get("/api/exportar/dist-files", (_req, res) => {
  try {
    const distPath = path.resolve(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) {
      return res.status(400).json({ erro: "A pasta dist ainda n\xE3o foi gerada." });
    }
    const arquivos = listarArquivosRecursivo(distPath);
    return res.json({ sucesso: true, arquivos });
  } catch (error) {
    console.error("Erro em dist-files:", error);
    return res.status(500).json({ erro: error?.message || "Erro ao ler arquivos compilados." });
  }
});
app.get("/api/exportar/projeto-files", (_req, res) => {
  try {
    const rootDir = process.cwd();
    let arquivos = [];
    const arquivosRaiz = [
      "package.json",
      "index.html",
      "vite.config.ts",
      "server.ts",
      "app.py",
      "tsconfig.json",
      "README.md",
      "metadata.json"
    ];
    for (const f of arquivosRaiz) {
      const fullPath = path.join(rootDir, f);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        arquivos.push({ path: f, content, isBase64: false });
      }
    }
    const srcArquivos = listarArquivosRecursivo(path.join(rootDir, "src"), "src");
    arquivos = arquivos.concat(srcArquivos);
    return res.json({ sucesso: true, arquivos });
  } catch (error) {
    console.error("Erro em projeto-files:", error);
    return res.status(500).json({ erro: error?.message || "Erro ao ler arquivos do projeto." });
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
app.get("/api/exportar/dist-zip", (_req, res) => {
  try {
    const distPath = path.resolve(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) {
      return res.status(400).send("A pasta dist ainda n\xE3o foi gerada no servidor.");
    }
    const zipPath = path.resolve(process.cwd(), "dist_hostinger.zip");
    execSync(
      `python3 -c "import zipfile, os
with zipfile.ZipFile('${zipPath}', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('dist'):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, 'dist')
            z.write(full, rel)"`
    );
    res.download(zipPath, "gws_sistema_dist_hostinger.zip");
  } catch (error) {
    console.error("Erro no endpoint dist-zip:", error);
    res.status(500).send("Erro ao compactar arquivos de distribui\xE7\xE3o.");
  }
});
app.get("/api/exportar/projeto-completo-zip", (_req, res) => {
  try {
    const zipPath = path.resolve(process.cwd(), "codigo_fonte.zip");
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
    res.download(zipPath, "gws_sistema_licitacoes_codigo_fonte.zip");
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
const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "sistema_db.json");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
let dbData = {
  licitacoes: [],
  itens: [],
  timbrado: null,
  responsaveis: ["Gustavo", "Victor"],
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      dbData = {
        licitacoes: Array.isArray(parsed.licitacoes) ? parsed.licitacoes : [],
        itens: Array.isArray(parsed.itens) ? parsed.itens : [],
        timbrado: parsed.timbrado || null,
        responsaveis: Array.isArray(parsed.responsaveis) && parsed.responsaveis.length > 0 ? parsed.responsaveis : ["Gustavo", "Victor"],
        seguranca: parsed.seguranca || void 0,
        updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log(`[GWS Sync] Banco carregado com sucesso: ${dbData.licitacoes.length} licita\xE7\xF5es, ${dbData.itens.length} itens.`);
    }
  } catch (err) {
    console.warn("[GWS Sync] Aviso ao carregar sistema_db.json:", err);
  }
}
function salvarDbNoDisco() {
  try {
    dbData.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf8");
  } catch (err) {
    console.error("[GWS Sync] Erro ao gravar sistema_db.json no disco:", err);
  }
}
const sseClients = /* @__PURE__ */ new Set();
function broadcastSse(payload) {
  const data = `data: ${JSON.stringify(payload)}

`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(": heartbeat\n\n");
    } catch {
      sseClients.delete(client);
    }
  }
}, 15e3);
app.get("/api/sync/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  sseClients.add(res);
  res.write(`data: ${JSON.stringify({
    tipo: "full",
    licitacoes: dbData.licitacoes,
    itens: dbData.itens,
    timbrado: dbData.timbrado,
    responsaveis: dbData.responsaveis,
    seguranca: dbData.seguranca
  })}

`);
  req.on("close", () => {
    sseClients.delete(res);
  });
});
app.get("/api/sync/state", (_req, res) => {
  res.json({
    licitacoes: dbData.licitacoes,
    itens: dbData.itens,
    timbrado: dbData.timbrado,
    responsaveis: dbData.responsaveis,
    seguranca: dbData.seguranca,
    updatedAt: dbData.updatedAt
  });
});
app.post("/api/sync/merge", (req, res) => {
  try {
    const { licitacoes, itens, timbrado, responsaveis, seguranca } = req.body;
    let alterado = false;
    if (Array.isArray(licitacoes) && licitacoes.length > 0) {
      const mapaLics = new Map(dbData.licitacoes.map((l) => [Number(l.id), l]));
      for (const lic of licitacoes) {
        if (!lic || lic.id === void 0) continue;
        const id = Number(lic.id);
        if (!mapaLics.has(id)) {
          mapaLics.set(id, lic);
          alterado = true;
        } else {
          const atual = mapaLics.get(id);
          mapaLics.set(id, { ...atual, ...lic });
        }
      }
      dbData.licitacoes = Array.from(mapaLics.values()).sort((a, b) => Number(b.id) - Number(a.id));
    }
    if (Array.isArray(itens) && itens.length > 0) {
      const mapaItens = new Map(dbData.itens.map((i) => [Number(i.id), i]));
      for (const item of itens) {
        if (!item || item.id === void 0) continue;
        const id = Number(item.id);
        if (!mapaItens.has(id)) {
          mapaItens.set(id, item);
          alterado = true;
        } else {
          const atual = mapaItens.get(id);
          mapaItens.set(id, { ...atual, ...item });
        }
      }
      dbData.itens = Array.from(mapaItens.values()).sort((a, b) => Number(a.num_item || 0) - Number(b.num_item || 0));
    }
    if (timbrado && typeof timbrado === "object" && !dbData.timbrado) {
      dbData.timbrado = timbrado;
      alterado = true;
    }
    if (Array.isArray(responsaveis) && responsaveis.length > 0) {
      const unicos = Array.from(/* @__PURE__ */ new Set([...dbData.responsaveis, ...responsaveis]));
      if (unicos.length !== dbData.responsaveis.length) {
        dbData.responsaveis = unicos;
        alterado = true;
      }
    }
    if (seguranca && typeof seguranca === "object" && !dbData.seguranca) {
      dbData.seguranca = seguranca;
      alterado = true;
    }
    if (alterado) {
      salvarDbNoDisco();
      broadcastSse({
        tipo: "full",
        licitacoes: dbData.licitacoes,
        itens: dbData.itens,
        timbrado: dbData.timbrado,
        responsaveis: dbData.responsaveis,
        seguranca: dbData.seguranca
      });
    }
    return res.json({ sucesso: true, ...dbData });
  } catch (err) {
    console.error("[GWS Sync] Erro no merge:", err);
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/sync/licitacao", (req, res) => {
  try {
    const lic = req.body;
    if (!lic || lic.id === void 0) {
      return res.status(400).json({ erro: "Licita\xE7\xE3o inv\xE1lida." });
    }
    const id = Number(lic.id);
    const index = dbData.licitacoes.findIndex((l) => Number(l.id) === id);
    if (index >= 0) {
      dbData.licitacoes[index] = { ...dbData.licitacoes[index], ...lic };
    } else {
      dbData.licitacoes.unshift(lic);
    }
    dbData.licitacoes.sort((a, b) => Number(b.id) - Number(a.id));
    salvarDbNoDisco();
    broadcastSse({
      tipo: "licitacoes",
      licitacoes: dbData.licitacoes
    });
    return res.json({ sucesso: true, licitacoes: dbData.licitacoes });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.delete("/api/sync/licitacao/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    dbData.licitacoes = dbData.licitacoes.filter((l) => Number(l.id) !== id);
    dbData.itens = dbData.itens.filter((i) => Number(i.licitacao_id) !== id);
    salvarDbNoDisco();
    broadcastSse({
      tipo: "full",
      licitacoes: dbData.licitacoes,
      itens: dbData.itens,
      timbrado: dbData.timbrado,
      responsaveis: dbData.responsaveis
    });
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/sync/item", (req, res) => {
  try {
    const item = req.body;
    if (!item || item.id === void 0) {
      return res.status(400).json({ erro: "Item inv\xE1lido." });
    }
    const id = Number(item.id);
    const index = dbData.itens.findIndex((i) => Number(i.id) === id);
    if (index >= 0) {
      dbData.itens[index] = { ...dbData.itens[index], ...item };
    } else {
      dbData.itens.push(item);
    }
    salvarDbNoDisco();
    broadcastSse({
      tipo: "itens",
      itens: dbData.itens
    });
    return res.json({ sucesso: true, itens: dbData.itens });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/sync/itens-batch", (req, res) => {
  try {
    const { itens } = req.body;
    if (!Array.isArray(itens)) {
      return res.status(400).json({ erro: "Lista de itens inv\xE1lida." });
    }
    const mapaItens = new Map(dbData.itens.map((i) => [Number(i.id), i]));
    for (const item of itens) {
      if (!item || item.id === void 0) continue;
      const id = Number(item.id);
      mapaItens.set(id, { ...mapaItens.get(id) || {}, ...item });
    }
    dbData.itens = Array.from(mapaItens.values());
    salvarDbNoDisco();
    broadcastSse({
      tipo: "itens",
      itens: dbData.itens
    });
    return res.json({ sucesso: true, totalItens: dbData.itens.length });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.delete("/api/sync/item/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    dbData.itens = dbData.itens.filter((i) => Number(i.id) !== id);
    salvarDbNoDisco();
    broadcastSse({
      tipo: "itens",
      itens: dbData.itens
    });
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/sync/config/:tipo", (req, res) => {
  try {
    const tipo = req.params.tipo;
    const dados = req.body;
    if (tipo === "timbrado") {
      dbData.timbrado = dados;
    } else if (tipo === "responsaveis") {
      if (Array.isArray(dados)) dbData.responsaveis = dados;
      else if (Array.isArray(dados?.responsaveis)) dbData.responsaveis = dados.responsaveis;
    } else if (tipo === "seguranca") {
      dbData.seguranca = dados;
    }
    salvarDbNoDisco();
    broadcastSse({
      tipo,
      [tipo]: dados
    });
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
async function startServer() {
  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.resolve(distPath, "index.html"));
  const isProd = process.env.NODE_ENV === "production" || hasDist;
  if (isProd && hasDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    try {
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
    } catch (viteErr) {
      console.warn("Vite dev server failed to start, falling back to static:", viteErr);
      if (hasDist) {
        app.use(express.static(distPath));
        app.get("*", (_req, res) => {
          res.sendFile(path.resolve(distPath, "index.html"));
        });
      }
    }
  }
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[GWS] Servidor rodando com sucesso em http://0.0.0.0:${port} (Modo: ${isProd ? "Produ\xE7\xE3o" : "Desenvolvimento"})`);
  });
  server.on("error", (err) => {
    console.error(`[GWS] Erro ao iniciar servidor na porta ${port}:`, err);
  });
}
startServer();
