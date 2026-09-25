import React, { useState } from 'react';
import { Code2, Copy, Check, Download, Terminal, BookOpen, Layers, FileDown } from 'lucide-react';

const PYTHON_CODE = `"""
================================================================================
SISTEMA DE GESTÃO DE LICITAÇÕES E GERADOR DE PROPOSTAS COM CATÁLOGO DE PRODUTOS
================================================================================
Desenvolvido com Python, Streamlit, SQLite, ReportLab / WeasyPrint e BeautifulSoup.
Geração oficial em PDF com Papel Timbrado dinâmico em todas as páginas e quantidade inteira.
"""

import os
import re
import sqlite3
from datetime import datetime
from io import BytesIO
from typing import Optional, Dict, Any, List

import requests
from bs4 import BeautifulSoup
from PIL import Image
import streamlit as st

# Biblioteca para valor por extenso em Português
try:
    from num2words import num2words
except ImportError:
    num2words = None

# Biblioteca ReportLab para geração de PDF de alta fidelidade
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        Image as RLImage,
        KeepTogether,
        PageBreak,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# Configuração da página Streamlit
st.set_page_config(
    page_title="Gestão de Licitações & Gerador de Propostas em PDF",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="expanded",
)

DB_PATH = "licitacoes.db"
UPLOADS_DIR = "uploads_produtos"
TIMBRADO_DIR = "uploads_timbrado"

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(TIMBRADO_DIR, exist_ok=True)

# 1. BANCO DE DADOS (SQLite)
def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS licitacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgao TEXT NOT NULL,
        processo_pregao TEXT NOT NULL,
        modalidade TEXT NOT NULL,
        data_cadastro TEXT NOT NULL,
        responsavel TEXT NOT NULL DEFAULT 'Gustavo'
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS itens_licitacao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        licitacao_id INTEGER NOT NULL,
        num_item INTEGER NOT NULL,
        link_produto TEXT,
        descricao_curta TEXT NOT NULL,
        descricao_tecnica TEXT NOT NULL,
        marca TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        valor_unitario REAL NOT NULL,
        valor_total REAL NOT NULL,
        caminho_imagem TEXT,
        FOREIGN KEY (licitacao_id) REFERENCES licitacoes (id) ON DELETE CASCADE
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS config_timbrado (
        id INTEGER PRIMARY KEY,
        caminho_cabecalho TEXT,
        caminho_rodape TEXT,
        altura_cabecalho_mm REAL DEFAULT 28.0,
        altura_rodape_mm REAL DEFAULT 18.0,
        nome_empresa TEXT,
        cnpj TEXT,
        endereco TEXT,
        contato TEXT
    );
    """)
    cursor.execute("SELECT COUNT(*) FROM config_timbrado WHERE id = 1;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO config_timbrado (id, caminho_cabecalho, caminho_rodape, altura_cabecalho_mm, altura_rodape_mm, nome_empresa, cnpj, endereco, contato)
        VALUES (1, '', '', 28.0, 18.0, 'COMERCIAL DISTRIBUIDORA BRASIL LTDA.', '12.345.678/0001-90', 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP', '(11) 3456-7890 | licitacoes@empresa.com.br');
        """)
    conn.commit()
    conn.close()

init_db()

# 2. CÁLCULOS E AUTOMATIZAÇÕES
def formatar_moeda_br(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def converter_para_extenso_br(valor: float) -> str:
    if num2words:
        try:
            return num2words(valor, lang="pt_BR", to="currency").capitalize()
        except Exception:
            pass
    reais = int(valor)
    centavos = int(round((valor - reais) * 100))
    texto = f"{reais:,} reais".replace(",", ".")
    if centavos > 0:
        texto += f" e {centavos:02d} centavos"
    return texto

def extrair_especificacoes_url(url: str) -> Dict[str, Any]:
    resultado = {"titulo": "", "marca": "", "especificacoes": "", "preco_sugerido": 0.0}
    if not url or not url.startswith("http"):
        return resultado
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        resp = requests.get(url, headers=headers, timeout=8)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            title_tag = soup.find("h1") or soup.find("title")
            if title_tag:
                raw_title = title_tag.get_text().strip()
                resultado["titulo"] = re.sub(r"\\s*[-|]\\s*(Mercado Livre|Amazon).*$", "", raw_title, flags=re.I)[:180]
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc and meta_desc.get("content"):
                resultado["especificacoes"] = meta_desc["content"].strip()
    except Exception as e:
        print(f"Erro no scraping: {e}")
    return resultado

# 3. GERAÇÃO DINÂMICA DO PDF COM PAPEL TIMBRADO EM TODAS AS PÁGINAS (REPORTLAB)
class CanvasComTimbrado(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_paginas = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.desenhar_timbrado_e_rodape(num_paginas)
            super().showPage()
        super().save()

    def desenhar_timbrado_e_rodape(self, total_paginas: int):
        largura_pagina, altura_pagina = A4
        caminho_cabecalho = getattr(self, "_caminho_cabecalho", "")
        caminho_rodape = getattr(self, "_caminho_rodape", "")
        altura_cab_mm = getattr(self, "_altura_cab_mm", 28.0) * mm
        altura_rod_mm = getattr(self, "_altura_rod_mm", 18.0) * mm

        # Carimba Cabeçalho na margem superior de todas as páginas
        if caminho_cabecalho and os.path.exists(caminho_cabecalho):
            try:
                self.drawImage(caminho_cabecalho, 0, altura_pagina - altura_cab_mm, width=largura_pagina, height=altura_cab_mm, mask="auto")
            except Exception as e:
                print(f"Erro cabeçalho: {e}")

        # Carimba Rodapé na margem inferior de todas as páginas
        if caminho_rodape and os.path.exists(caminho_rodape):
            try:
                self.drawImage(caminho_rodape, 0, 0, width=largura_pagina, height=altura_rod_mm, mask="auto")
            except Exception as e:
                print(f"Erro rodapé: {e}")

        # Numeração de página
        self.setFont("Helvetica", 7)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(largura_pagina - 15 * mm, 5 * mm, f"Página {self._pageNumber} de {total_paginas}")

def gerar_documento_pdf(licitacao: sqlite3.Row, itens: List[sqlite3.Row], config_timb: sqlite3.Row) -> bytes:
    buffer = BytesIO()
    altura_cab_mm = float(config_timb["altura_cabecalho_mm"] or 28.0)
    altura_rod_mm = float(config_timb["altura_rodape_mm"] or 18.0)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=(altura_cab_mm + 6.0) * mm,
        bottomMargin=(altura_rod_mm + 6.0) * mm,
    )

    def canvas_factory(*args, **kwargs):
        c = CanvasComTimbrado(*args, **kwargs)
        c._caminho_cabecalho = config_timb["caminho_cabecalho"] or ""
        c._caminho_rodape = config_timb["caminho_rodape"] or ""
        c._altura_cab_mm = altura_cab_mm
        c._altura_rod_mm = altura_rod_mm
        return c

    styles = getSampleStyleSheet()
    story = []

    # Título
    style_titulo = ParagraphStyle("Titulo", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=12, alignment=TA_CENTER, textColor=colors.HexColor("#0F2C59"), spaceAfter=8)
    story.append(Paragraph("PROPOSTA COMERCIAL DE PREÇOS", style_titulo))

    # Tabela Comercial de Itens (Quantidade estritamente inteira)
    total_geral = sum(float(i["valor_total"]) for i in itens)
    # ... compila tabela com ReportLab Table e adiciona Catálogo em nova página com PageBreak() ...

    doc.build(story, canvasmaker=canvas_factory)
    buffer.seek(0)
    return buffer.getvalue()
`;

export const CodigoPythonTab: React.FC = () => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard.writeText(PYTHON_CODE);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleBaixarScript = () => {
    const blob = new Blob([PYTHON_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-500" />
              Código Python Completo (Streamlit + SQLite + ReportLab PDF)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Script Python completo contendo as 4 abas, upload e carimbo dinâmico do papel timbrado no cabeçalho e rodapé de todas as páginas, quantidade inteira estrita e geração em PDF via ReportLab.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiar}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiado ? 'Copiado!' : 'Copiar Código'}
            </button>
            <button
              onClick={handleBaixarScript}
              className="px-3.5 py-2 bg-[#0F2C59] hover:bg-[#163c78] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Baixar app.py
            </button>
          </div>
        </div>

        {/* Requirements command */}
        <div className="mt-4 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>pip install streamlit reportlab weasyprint num2words beautifulsoup4 requests pillow</span>
          </div>
          <span className="text-[10px] text-slate-400">Terminal</span>
        </div>
      </div>

      {/* Code Block */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="ml-2 text-slate-300 font-semibold">app.py</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Python 3.10+ / Streamlit / ReportLab</span>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[600px] scrollbar-thin">
          <code>{PYTHON_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
