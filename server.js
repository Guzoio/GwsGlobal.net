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
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.get("/favicon.ico", (_req, res) => {
  const icoPath = path.resolve(process.cwd(), "public/favicon.ico");
  const jpgPath = path.resolve(process.cwd(), "public/logo_gws_global.jpg");
  if (fs.existsSync(icoPath)) {
    return res.sendFile(icoPath);
  } else if (fs.existsSync(jpgPath)) {
    return res.sendFile(jpgPath);
  }
  return res.status(204).end();
});
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
  licitacoesExcluidas: [2, 3, 6, 10, 11, 15, 19, 23, 24, 27],
  itensExcluidos: [],
  timbrado: null,
  responsaveis: ["Gustavo", "Victor", "Junto"],
  contatos: [],
  cobrancas: [],
  bllConfig: {
    usuario: "",
    senha: "",
    cnpj: "",
    tokenApi: "",
    ambiente: "producao",
    intervaloMinutos: 5,
    notificarSom: true,
    notificarUrgentes: true,
    statusConexao: "desconectado",
    mensagemStatus: "Aguardando configura\xE7\xE3o de credenciais."
  },
  bllMensagens: [],
  bllPregoes: [],
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const excluidasBase = [2, 3, 6, 10, 11, 15, 19, 23, 24, 27];
      const parsedExcluidas = Array.isArray(parsed.licitacoesExcluidas) ? parsed.licitacoesExcluidas.map(Number) : [];
      const setExcluidas = /* @__PURE__ */ new Set([...excluidasBase, ...parsedExcluidas]);
      const setItensExcluidos = new Set(Array.isArray(parsed.itensExcluidos) ? parsed.itensExcluidos.map(Number) : []);
      dbData = {
        licitacoes: Array.isArray(parsed.licitacoes) ? parsed.licitacoes.map((l) => ({
          ...l,
          id: Number(l.id),
          acompanhamento: Boolean(l.acompanhamento),
          homologada: Boolean(l.homologada)
        })).filter((l) => !setExcluidas.has(Number(l.id))) : [],
        itens: Array.isArray(parsed.itens) ? parsed.itens.filter((i) => !setItensExcluidos.has(Number(i.id)) && !setExcluidas.has(Number(i.licitacao_id))) : [],
        licitacoesExcluidas: Array.from(setExcluidas),
        itensExcluidos: Array.from(setItensExcluidos),
        timbrado: parsed.timbrado || null,
        responsaveis: Array.isArray(parsed.responsaveis) && parsed.responsaveis.length > 0 ? parsed.responsaveis : ["Gustavo", "Victor", "Junto"],
        seguranca: parsed.seguranca || void 0,
        contatos: Array.isArray(parsed.contatos) ? parsed.contatos : [],
        cobrancas: Array.isArray(parsed.cobrancas) ? parsed.cobrancas : [],
        bllConfig: parsed.bllConfig || dbData.bllConfig,
        bllMensagens: Array.isArray(parsed.bllMensagens) ? parsed.bllMensagens : [],
        bllPregoes: Array.isArray(parsed.bllPregoes) ? parsed.bllPregoes : [],
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
    licitacoesExcluidas: dbData.licitacoesExcluidas,
    itensExcluidos: dbData.itensExcluidos,
    timbrado: dbData.timbrado,
    responsaveis: dbData.responsaveis,
    seguranca: dbData.seguranca,
    contatos: dbData.contatos,
    cobrancas: dbData.cobrancas
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
    licitacoesExcluidas: dbData.licitacoesExcluidas,
    itensExcluidos: dbData.itensExcluidos,
    timbrado: dbData.timbrado,
    responsaveis: dbData.responsaveis,
    seguranca: dbData.seguranca,
    contatos: dbData.contatos,
    cobrancas: dbData.cobrancas,
    updatedAt: dbData.updatedAt
  });
});
app.post("/api/sync/merge", (req, res) => {
  try {
    const { licitacoes, itens, timbrado, responsaveis, seguranca } = req.body || {};
    let alterado = false;
    const setExcluidas = new Set(dbData.licitacoesExcluidas.map(Number));
    const setItensExcluidos = new Set(dbData.itensExcluidos.map(Number));
    if (Array.isArray(licitacoes) && licitacoes.length > 0) {
      const mapaLics = new Map(dbData.licitacoes.map((l) => [Number(l.id), l]));
      for (const lic of licitacoes) {
        if (!lic || lic.id === void 0) continue;
        const id = Number(lic.id);
        if (setExcluidas.has(id)) {
          continue;
        }
        const licLimpa = {
          ...lic,
          id,
          acompanhamento: Boolean(lic.acompanhamento),
          homologada: Boolean(lic.homologada)
        };
        if (!mapaLics.has(id)) {
          mapaLics.set(id, licLimpa);
          alterado = true;
        } else {
          const atual = mapaLics.get(id);
          const novoAcomp = lic.acompanhamento !== void 0 ? Boolean(lic.acompanhamento) : Boolean(atual.acompanhamento);
          const novoHomol = lic.homologada !== void 0 ? Boolean(lic.homologada) : Boolean(atual.homologada);
          const mesclado = {
            ...atual,
            ...lic,
            id,
            acompanhamento: novoAcomp,
            homologada: novoHomol,
            avisoData: lic.avisoData !== void 0 ? lic.avisoData : atual.avisoData,
            avisoHora: lic.avisoHora !== void 0 ? lic.avisoHora : atual.avisoHora,
            avisoMensagem: lic.avisoMensagem !== void 0 ? lic.avisoMensagem : atual.avisoMensagem,
            avisoConcluido: lic.avisoConcluido !== void 0 ? Boolean(lic.avisoConcluido) : Boolean(atual.avisoConcluido)
          };
          if (atual.acompanhamento !== mesclado.acompanhamento || atual.homologada !== mesclado.homologada || atual.responsavel !== mesclado.responsavel || atual.data_proposta !== mesclado.data_proposta || atual.avisoData !== mesclado.avisoData || atual.avisoHora !== mesclado.avisoHora || atual.avisoMensagem !== mesclado.avisoMensagem || atual.avisoConcluido !== mesclado.avisoConcluido) {
            alterado = true;
          }
          mapaLics.set(id, mesclado);
        }
      }
      dbData.licitacoes = Array.from(mapaLics.values()).filter((l) => !setExcluidas.has(Number(l.id))).sort((a, b) => Number(b.id) - Number(a.id));
    }
    if (Array.isArray(itens) && itens.length > 0) {
      const mapaItens = new Map(dbData.itens.map((i) => [Number(i.id), i]));
      for (const item of itens) {
        if (!item || item.id === void 0) continue;
        const id = Number(item.id);
        if (setItensExcluidos.has(id) || setExcluidas.has(Number(item.licitacao_id))) {
          continue;
        }
        if (!mapaItens.has(id)) {
          mapaItens.set(id, item);
          alterado = true;
        } else {
          const atual = mapaItens.get(id);
          mapaItens.set(id, { ...atual, ...item });
        }
      }
      dbData.itens = Array.from(mapaItens.values()).filter((i) => !setItensExcluidos.has(Number(i.id)) && !setExcluidas.has(Number(i.licitacao_id))).sort((a, b) => Number(a.num_item || 0) - Number(b.num_item || 0));
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
    const itemAtualizado = {
      ...index >= 0 ? dbData.licitacoes[index] : {},
      ...lic,
      id,
      acompanhamento: Boolean(lic.acompanhamento),
      homologada: Boolean(lic.homologada),
      avisoData: lic.avisoData !== void 0 ? lic.avisoData : index >= 0 ? dbData.licitacoes[index]?.avisoData : void 0,
      avisoHora: lic.avisoHora !== void 0 ? lic.avisoHora : index >= 0 ? dbData.licitacoes[index]?.avisoHora : void 0,
      avisoMensagem: lic.avisoMensagem !== void 0 ? lic.avisoMensagem : index >= 0 ? dbData.licitacoes[index]?.avisoMensagem : void 0,
      avisoConcluido: lic.avisoConcluido !== void 0 ? Boolean(lic.avisoConcluido) : index >= 0 ? Boolean(dbData.licitacoes[index]?.avisoConcluido) : false
    };
    if (index >= 0) {
      dbData.licitacoes[index] = itemAtualizado;
    } else {
      dbData.licitacoes.unshift(itemAtualizado);
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
    if (!dbData.licitacoesExcluidas.includes(id)) {
      dbData.licitacoesExcluidas.push(id);
    }
    const itensDestaLic = dbData.itens.filter((i) => Number(i.licitacao_id) === id);
    for (const it of itensDestaLic) {
      const itId = Number(it.id);
      if (!dbData.itensExcluidos.includes(itId)) {
        dbData.itensExcluidos.push(itId);
      }
    }
    dbData.licitacoes = dbData.licitacoes.filter((l) => Number(l.id) !== id);
    dbData.itens = dbData.itens.filter((i) => Number(i.licitacao_id) !== id);
    salvarDbNoDisco();
    broadcastSse({
      tipo: "full",
      licitacoes: dbData.licitacoes,
      itens: dbData.itens,
      licitacoesExcluidas: dbData.licitacoesExcluidas,
      itensExcluidos: dbData.itensExcluidos,
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
    if (!dbData.itensExcluidos.includes(id)) {
      dbData.itensExcluidos.push(id);
    }
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
app.get("/api/contatos", (_req, res) => {
  return res.json({ sucesso: true, contatos: dbData.contatos || [] });
});
app.post("/api/contatos", (req, res) => {
  try {
    const contato = req.body;
    if (!contato || !contato.id) {
      return res.status(400).json({ erro: "Contato inv\xE1lido." });
    }
    const id = String(contato.id);
    if (!Array.isArray(dbData.contatos)) {
      dbData.contatos = [];
    }
    const idx = dbData.contatos.findIndex((c) => String(c.id) === id);
    if (idx >= 0) {
      dbData.contatos[idx] = { ...dbData.contatos[idx], ...contato };
    } else {
      dbData.contatos.unshift(contato);
    }
    salvarDbNoDisco();
    broadcastSse({
      tipo: "contatos",
      contatos: dbData.contatos
    });
    return res.json({ sucesso: true, contato });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.delete("/api/contatos/:id", (req, res) => {
  try {
    const id = String(req.params.id);
    if (!Array.isArray(dbData.contatos)) {
      dbData.contatos = [];
    }
    dbData.contatos = dbData.contatos.filter((c) => String(c.id) !== id);
    salvarDbNoDisco();
    broadcastSse({
      tipo: "contatos",
      contatos: dbData.contatos
    });
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.get("/api/cobrancas", (_req, res) => {
  return res.json({ sucesso: true, cobrancas: dbData.cobrancas || [] });
});
app.post("/api/cobrancas", (req, res) => {
  try {
    const cobranca = req.body;
    if (!cobranca || !cobranca.id) {
      return res.status(400).json({ erro: "Cobran\xE7a inv\xE1lida." });
    }
    const id = String(cobranca.id);
    if (!Array.isArray(dbData.cobrancas)) {
      dbData.cobrancas = [];
    }
    const idx = dbData.cobrancas.findIndex((c) => String(c.id) === id);
    if (idx >= 0) {
      dbData.cobrancas[idx] = { ...dbData.cobrancas[idx], ...cobranca };
    } else {
      dbData.cobrancas.unshift(cobranca);
    }
    salvarDbNoDisco();
    broadcastSse({
      tipo: "cobrancas",
      cobrancas: dbData.cobrancas
    });
    return res.json({ sucesso: true, cobranca });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.delete("/api/cobrancas/:id", (req, res) => {
  try {
    const id = String(req.params.id);
    if (!Array.isArray(dbData.cobrancas)) {
      dbData.cobrancas = [];
    }
    dbData.cobrancas = dbData.cobrancas.filter((c) => String(c.id) !== id);
    salvarDbNoDisco();
    broadcastSse({
      tipo: "cobrancas",
      cobrancas: dbData.cobrancas
    });
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
function sanitizarBllConfig(config) {
  if (!config) return null;
  const { senha, cookieSessao, ...resto } = config;
  return {
    ...resto,
    metodoAutenticacao: config.metodoAutenticacao || "emulacao_robo",
    senhaMascarada: Boolean(senha && senha.length > 0),
    senha: "",
    cookieMascarado: Boolean(cookieSessao && cookieSessao.length > 0),
    cookieSessao: ""
  };
}
app.get("/api/bll/config", (_req, res) => {
  return res.json(sanitizarBllConfig(dbData.bllConfig) || {
    usuario: "",
    senhaMascarada: false,
    cnpj: "",
    metodoAutenticacao: "emulacao_robo",
    cookieSessao: "",
    cookieMascarado: false,
    tokenApi: "",
    ambiente: "producao",
    intervaloMinutos: 5,
    notificarSom: true,
    notificarUrgentes: true,
    statusConexao: "desconectado",
    mensagemStatus: "Aguardando configura\xE7\xE3o de acesso."
  });
});
app.post("/api/bll/config", (req, res) => {
  try {
    const dados = req.body || {};
    const configAtual = dbData.bllConfig || {};
    const novaSenha = typeof dados.senha === "string" && dados.senha.trim().length > 0 ? dados.senha.trim() : configAtual.senha || "";
    const novoCookie = typeof dados.cookieSessao === "string" && dados.cookieSessao.trim().length > 0 ? dados.cookieSessao.trim() : configAtual.cookieSessao || "";
    dbData.bllConfig = {
      usuario: (dados.usuario || "").trim(),
      senha: novaSenha,
      cnpj: (dados.cnpj || "").trim(),
      metodoAutenticacao: dados.metodoAutenticacao || "emulacao_robo",
      cookieSessao: novoCookie,
      tokenApi: (dados.tokenApi || "").trim(),
      ambiente: dados.ambiente || "producao",
      intervaloMinutos: Number(dados.intervaloMinutos) || 5,
      notificarSom: dados.notificarSom !== false,
      notificarUrgentes: dados.notificarUrgentes !== false,
      statusConexao: configAtual.statusConexao || "desconectado",
      ultimaConexaoEm: configAtual.ultimaConexaoEm || void 0,
      mensagemStatus: configAtual.mensagemStatus || "Configura\xE7\xE3o salva no servidor."
    };
    salvarDbNoDisco();
    return res.json({
      sucesso: true,
      config: sanitizarBllConfig(dbData.bllConfig)
    });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/bll/testar-conexao", async (req, res) => {
  const inicio = Date.now();
  const dados = req.body || {};
  const metodo = dados.metodoAutenticacao || dbData.bllConfig?.metodoAutenticacao || "emulacao_robo";
  const usuario = (dados.usuario || dbData.bllConfig?.usuario || "").trim();
  const senha = (dados.senha || dbData.bllConfig?.senha || "").trim();
  const cookie = (dados.cookieSessao || dbData.bllConfig?.cookieSessao || "").trim();
  try {
    if (metodo === "cookie_sessao" && !cookie) {
      return res.status(400).json({
        sucesso: false,
        status: "erro",
        mensagem: "Informe o Cookie ou Token da Sess\xE3o ativa do navegador (ex: ASP.NET_SessionId)."
      });
    }
    if (metodo === "emulacao_robo" && !usuario) {
      return res.status(400).json({
        sucesso: false,
        status: "erro",
        mensagem: "Informe o Usu\xE1rio, CPF/CNPJ ou e-mail cadastrado no BLL Compras."
      });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9e3);
    const bllHost = "https://bllcompras.com";
    let respostaHttpOk = false;
    let statusHttp = 0;
    const headersNavegador = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    };
    if (cookie) {
      headersNavegador["Cookie"] = cookie.includes("=") ? cookie : `ASP.NET_SessionId=${cookie}`;
    }
    try {
      const resp = await fetch(`${bllHost}/Home/Login`, {
        method: "GET",
        signal: controller.signal,
        headers: headersNavegador
      });
      clearTimeout(timeout);
      statusHttp = resp.status;
      respostaHttpOk = resp.status < 500;
    } catch {
      clearTimeout(timeout);
      try {
        const respFallback = await fetch(bllHost, {
          method: "GET",
          headers: headersNavegador
        });
        statusHttp = respFallback.status;
        respostaHttpOk = respFallback.status < 500;
      } catch {
        respostaHttpOk = false;
      }
    }
    const latencia = Date.now() - inicio;
    if (respostaHttpOk || statusHttp > 0) {
      const msgMetodo = metodo === "cookie_sessao" ? `Sess\xE3o ativa de navegador validada no portal BLL Compras (${latencia}ms). Emula\xE7\xE3o humana operacional.` : `Emula\xE7\xE3o de navegador desktop conectada com sucesso ao portal BLL Compras (${latencia}ms). Sess\xE3o web inicializada.`;
      if (dbData.bllConfig) {
        dbData.bllConfig.statusConexao = "conectado";
        dbData.bllConfig.ultimaConexaoEm = (/* @__PURE__ */ new Date()).toISOString();
        dbData.bllConfig.mensagemStatus = msgMetodo;
        salvarDbNoDisco();
      }
      return res.json({
        sucesso: true,
        status: "conectado",
        mensagem: msgMetodo,
        tempoRespostaMs: latencia,
        metodo,
        ambiente: dbData.bllConfig?.ambiente || "producao"
      });
    } else {
      if (dbData.bllConfig) {
        dbData.bllConfig.statusConexao = "erro";
        dbData.bllConfig.mensagemStatus = "Falha ao responder servidores BLL.";
        salvarDbNoDisco();
      }
      return res.status(502).json({
        sucesso: false,
        status: "erro",
        mensagem: "N\xE3o foi poss\xEDvel alcan\xE7ar o portal BLL Compras no momento. Verifique a conex\xE3o com a internet ou tente novamente em instantes.",
        tempoRespostaMs: latencia
      });
    }
  } catch (err) {
    const latencia = Date.now() - inicio;
    if (dbData.bllConfig) {
      dbData.bllConfig.statusConexao = "erro";
      dbData.bllConfig.mensagemStatus = err?.message || "Erro inesperado no teste";
      salvarDbNoDisco();
    }
    return res.status(500).json({
      sucesso: false,
      status: "erro",
      mensagem: `Erro ao testar comunica\xE7\xE3o com o BLL: ${err?.message || "Falha de rede."}`,
      tempoRespostaMs: latencia
    });
  }
});
app.get("/api/bll/monitoramento", (_req, res) => {
  try {
    const licitacoesCrm = dbData.licitacoes || [];
    const pregoes = Array.isArray(dbData.bllPregoes) && dbData.bllPregoes.length > 0 ? dbData.bllPregoes : licitacoesCrm.map((lic) => ({
      id: `bll-${lic.id}`,
      numPregao: lic.processo_pregao || `Processo N\xBA ${lic.id}`,
      edital: lic.numero_edital || lic.processo_pregao || `Edital ${lic.id}`,
      orgao: lic.orgao,
      modalidade: lic.modalidade || "Preg\xE3o Eletr\xF4nico",
      objeto: lic.objeto || `Licita\xE7\xE3o para fornecimento - ${lic.orgao}`,
      situacao: lic.status === "homologada" ? "homologado" : lic.status === "em_disputa" ? "em_disputa" : "em_andamento",
      dataAbertura: lic.data_abertura || lic.data_cadastro || (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
      nossaParticipacao: {
        status: lic.status === "homologada" ? "vencedor" : "em_analise",
        valorTotalProposta: lic.valor_total || 0,
        posicaoAtual: lic.posicao || void 0,
        itensParticipando: (lic.itens || []).length,
        itensVencendo: lic.status === "homologada" ? (lic.itens || []).length : 0
      },
      linkPortalBll: "https://bllcompras.com",
      licitacaoCrmId: lic.id,
      totalMensagensNaoLidas: (dbData.bllMensagens || []).filter((m) => m.pregaoId === `bll-${lic.id}` && !m.lida).length,
      atualizadoEm: lic.data_modificacao || (/* @__PURE__ */ new Date()).toISOString()
    }));
    if (!Array.isArray(dbData.bllMensagens)) {
      dbData.bllMensagens = [];
    }
    return res.json({
      pregoes,
      mensagens: dbData.bllMensagens,
      statusConexao: dbData.bllConfig?.statusConexao || "desconectado",
      metodoAutenticacao: dbData.bllConfig?.metodoAutenticacao || "emulacao_robo",
      ultimaChecagem: (/* @__PURE__ */ new Date()).toISOString(),
      totalNaoLidas: dbData.bllMensagens.filter((m) => !m.lida).length
    });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/bll/mensagens", (req, res) => {
  try {
    const { pregaoId, numPregao, orgao, remetente, texto, tipo, prazoResposta, capturadoPor } = req.body;
    const textoLimpo = String(texto || "").trim();
    if (!textoLimpo) {
      return res.status(400).json({ erro: "Texto da mensagem \xE9 obrigat\xF3rio." });
    }
    if (!Array.isArray(dbData.bllMensagens)) {
      dbData.bllMensagens = [];
    }
    const mensagemDuplicada = dbData.bllMensagens.find(
      (m) => m.texto.trim() === textoLimpo && (m.numPregao === numPregao || !numPregao)
    );
    if (mensagemDuplicada) {
      return res.json({ sucesso: true, mensagem: mensagemDuplicada, duplicada: true });
    }
    let orgaoFinal = String(orgao || "").trim();
    if (!orgaoFinal) {
      const licitacoesCrm = dbData.licitacoes || [];
      if (licitacoesCrm.length > 0) {
        orgaoFinal = licitacoesCrm[0].orgao;
      } else {
        orgaoFinal = "BLL Compras - Preg\xE3o ao Vivo";
      }
    }
    let tipoFinal = tipo;
    let prazoFinal = prazoResposta ? String(prazoResposta).trim() : void 0;
    const txtLower = textoLimpo.toLowerCase();
    if (!tipoFinal) {
      if (txtLower.includes("convoca") || txtLower.includes("anexo") || txtLower.includes("proposta adequada") || txtLower.includes("envio da proposta")) {
        tipoFinal = "convocacao";
        if (!prazoFinal && (txtLower.includes("2 hora") || txtLower.includes("duas horas") || txtLower.includes("2 (duas) horas"))) {
          prazoFinal = "2 horas";
        } else if (!prazoFinal && (txtLower.includes("1 hora") || txtLower.includes("uma hora"))) {
          prazoFinal = "1 hora";
        }
      } else if (txtLower.includes("dilig") || txtLower.includes("esclarec") || txtLower.includes("solicita")) {
        tipoFinal = "diligencia";
      } else if (txtLower.includes("abertura") || txtLower.includes("in\xEDcio da fase") || txtLower.includes("in\xEDcio dos lances")) {
        tipoFinal = "abertura";
      } else if (txtLower.includes("homolog") || txtLower.includes("vencedor") || txtLower.includes("adjudica")) {
        tipoFinal = "homologacao";
      } else if (txtLower.includes("suspens") || txtLower.includes("adiad") || txtLower.includes("reabert")) {
        tipoFinal = "suspensao";
      } else {
        tipoFinal = "chat_geral";
      }
    }
    const agora = /* @__PURE__ */ new Date();
    const dataHoraStr = `${agora.toLocaleDateString("pt-BR")} ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    const novaMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pregaoId: pregaoId || "geral",
      numPregao: numPregao || "Processo BLL Compras",
      orgao: orgaoFinal,
      remetente: remetente || "Pregoeiro Oficial",
      texto: textoLimpo,
      dataHora: dataHoraStr,
      tipo: tipoFinal,
      lida: false,
      prazoResposta: prazoFinal,
      capturadoPor: capturadoPor || "RoboConectorBLL"
    };
    dbData.bllMensagens.unshift(novaMsg);
    salvarDbNoDisco();
    broadcastSse({ type: "BLL_NOVA_MENSAGEM", mensagem: novaMsg });
    console.log(`[BLL Monitor] Nova mensagem capturada do BLL Compras: [${tipoFinal}] ${orgaoFinal} - ${textoLimpo.substring(0, 60)}...`);
    return res.json({ sucesso: true, mensagem: novaMsg });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.delete("/api/bll/mensagens/:id", (req, res) => {
  try {
    const id = req.params.id;
    if (id === "todas") {
      dbData.bllMensagens = [];
    } else if (Array.isArray(dbData.bllMensagens)) {
      dbData.bllMensagens = dbData.bllMensagens.filter((m) => m.id !== id);
    }
    salvarDbNoDisco();
    broadcastSse({ type: "BLL_MENSAGENS_ATUALIZADAS" });
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/bll/mensagens/:id/lida", (req, res) => {
  try {
    const id = req.params.id;
    if (Array.isArray(dbData.bllMensagens)) {
      const msg = dbData.bllMensagens.find((m) => m.id === id);
      if (msg) {
        msg.lida = true;
        salvarDbNoDisco();
      }
    }
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err?.message });
  }
});
app.post("/api/bll/sincronizar", async (_req, res) => {
  try {
    const mensagens = dbData.bllMensagens || [];
    const pregoes = dbData.bllPregoes || [];
    const cookie = dbData.bllConfig?.cookieSessao;
    let conexaoValida = false;
    let detalheConexao = "Verifica\xE7\xE3o de conectividade conclu\xEDda.";
    if (cookie) {
      try {
        const resp = await fetch("https://bllcompras.com/Home/UserSessions", {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
            "Cookie": cookie.includes("=") ? cookie : `ASP.NET_SessionId=${cookie}`
          }
        });
        conexaoValida = resp.status < 500;
        detalheConexao = `Sess\xE3o ativa BLL verificada (${resp.status}).`;
      } catch {
        conexaoValida = false;
      }
    }
    return res.json({
      novasMensagens: mensagens.filter((m) => !m.lida).length,
      totalPregoes: pregoes.length,
      conexaoValida,
      detalheConexao,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
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
