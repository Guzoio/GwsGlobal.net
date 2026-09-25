"""
================================================================================
SISTEMA DE GESTÃO DE LICITAÇÕES E GERADOR DE PROPOSTAS COM CATÁLOGO DE PRODUTOS
================================================================================
Desenvolvido com Python, Streamlit, SQLite, ReportLab / WeasyPrint e BeautifulSoup.
Emissão oficial em PDF com aplicação do cabeçalho oficial (GWS GLOBAL LIMITADA),
tabela com dados cadastrais e bancários, declaração formal e catálogo ilustrativo.
"""

import os
import re
import sqlite3
from datetime import datetime
from io import BytesIO
from typing import Optional, Tuple, Dict, Any, List

import requests
from bs4 import BeautifulSoup
from PIL import Image
import streamlit as st

# Num2words para valor por extenso em Português do Brasil
try:
    from num2words import num2words
except ImportError:
    num2words = None

# ReportLab para geração profissional de PDF
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
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# ==============================================================================
# CONFIGURAÇÃO GERAL DA PÁGINA STREAMLIT
# ==============================================================================
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

# ==============================================================================
# 1. BANCO DE DADOS (SQLite)
# ==============================================================================
def get_db_connection():
    """Cria e retorna conexão com o banco SQLite local."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa as tabelas de licitações, itens e configurações de timbrado."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabela licitacoes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS licitacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgao TEXT NOT NULL,
        processo_pregao TEXT NOT NULL,
        modalidade TEXT NOT NULL,
        data_cadastro TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pendente'
    );
    """)

    # Tabela itens_licitacao
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

    # Tabela de papel timbrado com todos os campos da imagem
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS config_timbrado (
        id INTEGER PRIMARY KEY,
        razao_social TEXT,
        cnpj TEXT,
        inscricao_estadual TEXT,
        endereco TEXT,
        telefone TEXT,
        email TEXT,
        banco TEXT,
        agencia TEXT,
        conta_corrente TEXT,
        nome_representante TEXT,
        rg_representante TEXT,
        cpf_representante TEXT,
        endereco_representante TEXT,
        caminho_cabecalho TEXT,
        caminho_rodape TEXT,
        caminho_assinatura TEXT,
        altura_cabecalho_mm REAL DEFAULT 28.0,
        altura_rodape_mm REAL DEFAULT 18.0
    );
    """)

    # Garante que as novas colunas existam caso a tabela já tenha sido criada antes
    for col_def in [
        ("caminho_assinatura", "TEXT"),
        ("prazo_entrega", "TEXT DEFAULT 'Conforme Aviso de Dispensa Eletrônica e Termo de Referência.'"),
        ("prazo_validade", "TEXT DEFAULT '90 Dias'"),
        ("declaracao_trabalhista", "TEXT DEFAULT 'Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas.'"),
        ("cidade_emissao", "TEXT DEFAULT 'Timóteo - MG'"),
        ("data_emissao", "TEXT"),
    ]:
        try:
            cursor.execute(f"ALTER TABLE config_timbrado ADD COLUMN {col_def[0]} {col_def[1]};")
        except Exception:
            pass

    cursor.execute("SELECT COUNT(*) FROM config_timbrado WHERE id = 1;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO config_timbrado (
            id, razao_social, cnpj, inscricao_estadual, endereco, telefone, email,
            banco, agencia, conta_corrente, nome_representante, rg_representante,
            cpf_representante, endereco_representante, caminho_cabecalho, caminho_rodape,
            altura_cabecalho_mm, altura_rodape_mm, caminho_assinatura,
            prazo_entrega, prazo_validade, declaracao_trabalhista, cidade_emissao
        ) VALUES (
            1,
            'GWS GLOBAL LIMITADA',
            '53.080.207/0001-80',
            '47724530033',
            'Rua Alpercata Nº 261 – Ana Malaquias Timoteo – mg',
            '(31) 9 86949588 - (31) 9 99240111',
            'gwsgloballimitada@gmail.com',
            'Nubank',
            '0001',
            '176199733-6',
            'Gustavo Henrique Severino Pinto',
            '20035238 expedido pela PC/MG',
            '020.313.066.93',
            'rua Estrelinha, Nº 180, no bairro Macuco, na cidade de Timoteo-MG, Cep 35181726',
            '', '', 28.0, 18.0, '',
            'Conforme Aviso de Dispensa Eletrônica e Termo de Referência.',
            '90 Dias',
            'Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas.',
            'Timóteo - MG'
        );
        """)

    conn.commit()
    conn.close()

init_db()

# ==============================================================================
# 2. LÓGICA DE FORMATAÇÃO E CÁLCULOS
# ==============================================================================
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
                resultado["titulo"] = re.sub(r"\s*[-|]\s*(Mercado Livre|Amazon).*$", "", raw_title, flags=re.I)[:180]
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc and meta_desc.get("content"):
                resultado["especificacoes"] = meta_desc["content"].strip()
    except Exception as e:
        print(f"Erro no scraping: {e}")
    return resultado

# ==============================================================================
# 3. GERAÇÃO DO DOCUMENTO PDF PROFISSIONAL COM REPORTLAB
# ==============================================================================
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

        # Cabeçalho Gráfico opcional
        if caminho_cabecalho and os.path.exists(caminho_cabecalho):
            try:
                self.drawImage(caminho_cabecalho, 0, altura_pagina - altura_cab_mm, width=largura_pagina, height=altura_cab_mm, mask="auto")
            except Exception as e:
                print(f"Erro cabeçalho: {e}")

        # Rodapé Gráfico opcional
        if caminho_rodape and os.path.exists(caminho_rodape):
            try:
                self.drawImage(caminho_rodape, 0, 0, width=largura_pagina, height=altura_rod_mm, mask="auto")
            except Exception as e:
                print(f"Erro rodapé: {e}")
        else:
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.line(15 * mm, 12 * mm, largura_pagina - 15 * mm, 12 * mm)
            self.setFont("Helvetica", 6.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(15 * mm, 7 * mm, "GWS GLOBAL LIMITADA • CNPJ: 53.080.207/0001-80 • gwsgloballimitada@gmail.com")

        self.setFont("Helvetica", 6.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(largura_pagina - 15 * mm, 7 * mm, f"Página {self._pageNumber} de {total_paginas}")

def gerar_documento_pdf(licitacao: sqlite3.Row, itens: List[sqlite3.Row], config_timb: sqlite3.Row) -> bytes:
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab não instalado.")

    buffer = BytesIO()
    altura_cab_mm = float(config_timb["altura_cabecalho_mm"] or 28.0) if config_timb["caminho_cabecalho"] else 6.0
    altura_rod_mm = float(config_timb["altura_rodape_mm"] or 18.0)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=(altura_cab_mm + 4.0) * mm,
        bottomMargin=(altura_rod_mm + 4.0) * mm,
    )

    def canvas_factory(*args, **kwargs):
        c = CanvasComTimbrado(*args, **kwargs)
        c._caminho_cabecalho = config_timb["caminho_cabecalho"] or ""
        c._caminho_rodape = config_timb["caminho_rodape"] or ""
        c._altura_cab_mm = float(config_timb["altura_cabecalho_mm"] or 28.0)
        c._altura_rod_mm = float(config_timb["altura_rodape_mm"] or 18.0)
        return c

    styles = getSampleStyleSheet()
    story = []

    # =========================================================================
    # 1. PRIMEIRAS INFORMAÇÕES DO PAPEL TIMBRADO (EXATAS DA IMAGEM)
    # =========================================================================
    pregao_txt = f"Pregão Eletrônico <b>{licitacao['processo_pregao']}</b>"
    proc_txt = f"Processo Administrativo <b>{licitacao['orgao']}</b>"

    story.append(Paragraph(pregao_txt, ParagraphStyle("PregaoH", parent=styles["Normal"], fontName="Helvetica", fontSize=10.5, leading=13)))
    story.append(Spacer(1, 1 * mm))
    story.append(Paragraph(proc_txt, ParagraphStyle("ProcH", parent=styles["Normal"], fontName="Helvetica", fontSize=10.5, leading=13)))
    story.append(Spacer(1, 3 * mm))

    # Tabela com as Linhas da Imagem
    linhas_tabela_dados = [
        [Paragraph("<b>RAZÃO SOCIAL:</b>", styles["Normal"]), Paragraph(f"<b>{config_timb['razao_social']}</b>", styles["Normal"])],
        [Paragraph("<b>CNPJ:</b>", styles["Normal"]), Paragraph(config_timb["cnpj"], styles["Normal"])],
        [Paragraph("<b>INSCRIÇÃO ESTADUAL</b>", styles["Normal"]), Paragraph(config_timb["inscricao_estadual"], styles["Normal"])],
        [Paragraph("<b>ENDEREÇO:</b>", styles["Normal"]), Paragraph(config_timb["endereco"], styles["Normal"])],
        [Paragraph("<b>TELEFONE:</b>", styles["Normal"]), Paragraph(config_timb["telefone"], styles["Normal"])],
        [Paragraph("<b>EMAIL:</b>", styles["Normal"]), Paragraph(config_timb["email"], styles["Normal"])],
        [Paragraph("<b>BANCO (NOME/Nº):</b>", styles["Normal"]), Paragraph(config_timb["banco"], styles["Normal"])],
        [Paragraph("<b>AGÊNCIA Nº:</b>", styles["Normal"]), Paragraph(config_timb["agencia"], styles["Normal"])],
        [Paragraph("<b>CONTA CORRENTE Nº:</b>", styles["Normal"]), Paragraph(config_timb["conta_corrente"], styles["Normal"])],
    ]

    tab_ident = Table(linhas_tabela_dados, colWidths=[45 * mm, 135 * mm])
    tab_ident.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(tab_ident)
    story.append(Spacer(1, 3 * mm))

    # Declaração do Representante Legal
    abertura_texto = (
        f"A empresa <b>{config_timb['razao_social']}</b>, inscrita no CNPJ sobo nº {config_timb['cnpj']}, "
        f"sediada na {config_timb['endereco']}, neste ato representado(a) por <b>{config_timb['nome_representante']}</b>, "
        f"portador(a) do documento de identidade RG nº {config_timb['rg_representante']}, inscrito(a) no CPF nº {config_timb['cpf_representante']}, "
        f"residente e domiciliado na {config_timb['endereco_representante']}, vem apresentar Proposta Comercial para a participação "
        f"no processo indicado acima, conforme abaixo descriminado:"
    )
    story.append(Paragraph(abertura_texto, ParagraphStyle("Abertura", parent=styles["Normal"], fontName="Helvetica", fontSize=8, leading=11, alignment=TA_JUSTIFY)))
    story.append(Spacer(1, 3.5 * mm))

    # Tabela Comercial
    total_geral = sum(float(item["valor_total"] or (item["quantidade"] * item["valor_unitario"])) for item in itens)
    total_extenso = converter_para_extenso_br(total_geral)
    total_formatado = formatar_moeda_br(total_geral)

    tabela_itens_dados = [
        [
            Paragraph("Item", ParagraphStyle("TH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, alignment=TA_CENTER, textColor=colors.white)),
            Paragraph("Descrição do Objeto", ParagraphStyle("TH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, textColor=colors.white)),
            Paragraph("Marca", ParagraphStyle("TH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, textColor=colors.white)),
            Paragraph("Qtd.", ParagraphStyle("TH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, alignment=TA_CENTER, textColor=colors.white)),
            Paragraph("Valor Unit.", ParagraphStyle("TH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, alignment=TA_RIGHT, textColor=colors.white)),
            Paragraph("Valor Total", ParagraphStyle("TH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, alignment=TA_RIGHT, textColor=colors.white)),
        ]
    ]

    for it in itens:
        qtd_int = int(round(it["quantidade"]))
        tabela_itens_dados.append([
            Paragraph(str(it["num_item"]), ParagraphStyle("TD", parent=styles["Normal"], fontName="Helvetica", fontSize=7, alignment=TA_CENTER)),
            Paragraph(it["descricao_curta"], ParagraphStyle("TD", parent=styles["Normal"], fontName="Helvetica", fontSize=7)),
            Paragraph(it["marca"], ParagraphStyle("TD", parent=styles["Normal"], fontName="Helvetica", fontSize=7)),
            Paragraph(str(qtd_int), ParagraphStyle("TD", parent=styles["Normal"], fontName="Helvetica", fontSize=7, alignment=TA_CENTER)),
            Paragraph(formatar_moeda_br(it["valor_unitario"]), ParagraphStyle("TD", parent=styles["Normal"], fontName="Helvetica", fontSize=7, alignment=TA_RIGHT)),
            Paragraph(formatar_moeda_br(it["valor_total"]), ParagraphStyle("TD", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7, alignment=TA_RIGHT)),
        ])

    tabela_itens_dados.append([
        Paragraph("<b>TOTAL GERAL DA PROPOSTA:</b>", ParagraphStyle("TL", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, alignment=TA_RIGHT, textColor=colors.HexColor("#0F2C59"))),
        "", "", "", "",
        Paragraph(f"<b>{total_formatado}</b>", ParagraphStyle("TV", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, alignment=TA_RIGHT, textColor=colors.HexColor("#0F2C59"))),
    ])

    col_widths = [12 * mm, 68 * mm, 32 * mm, 14 * mm, 26 * mm, 28 * mm]
    tabela_itens = Table(tabela_itens_dados, colWidths=col_widths, repeatRows=1)
    tabela_itens.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F2C59")),
        ("GRID", (0, 0), (-1, -2), 0.5, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F8FAFC")]),
        ("SPAN", (0, -1), (4, -1)),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
        ("LINEABOVE", (0, -1), (-1, -1), 1.0, colors.HexColor("#0F2C59")),
        ("LINEBELOW", (0, -1), (-1, -1), 1.0, colors.HexColor("#0F2C59")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    story.append(tabela_itens)
    story.append(Spacer(1, 2.5 * mm))

    # Box Extenso
    box_ext = Table([[Paragraph(f"<b>Valor Total por Extenso:</b> {total_formatado} ({total_extenso})", ParagraphStyle("Ex", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=7.5, textColor=colors.HexColor("#0F2C59")))]], colWidths=[180 * mm])
    box_ext.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(box_ext)
    story.append(Spacer(1, 4 * mm))

    # =========================================================================
    # PRAZOS, CONDIÇÕES, DECLARAÇÃO TRABALHISTA E DATA DE EMISSÃO
    # =========================================================================
    prazo_ent = (config_timb.get("prazo_entrega") if isinstance(config_timb, dict) else (config_timb["prazo_entrega"] if "prazo_entrega" in config_timb.keys() else None)) or "Conforme Aviso de Dispensa Eletrônica e Termo de Referência."
    prazo_val = (config_timb.get("prazo_validade") if isinstance(config_timb, dict) else (config_timb["prazo_validade"] if "prazo_validade" in config_timb.keys() else None)) or "90 Dias"
    decl_trab = (config_timb.get("declaracao_trabalhista") if isinstance(config_timb, dict) else (config_timb["declaracao_trabalhista"] if "declaracao_trabalhista" in config_timb.keys() else None)) or "Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas."
    cidade_emissao = (config_timb.get("cidade_emissao") if isinstance(config_timb, dict) else (config_timb["cidade_emissao"] if "cidade_emissao" in config_timb.keys() else None)) or "Timóteo - MG"
    dt_emissao_raw = config_timb.get("data_emissao") if isinstance(config_timb, dict) else (config_timb["data_emissao"] if "data_emissao" in config_timb.keys() else None)

    # Formatação da data em português por extenso
    meses_pt = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
    data_formatada = ""
    if dt_emissao_raw:
        try:
            d_parts = dt_emissao_raw.split("-")
            if len(d_parts) == 3:
                ano_i, mes_i, dia_i = int(d_parts[0]), int(d_parts[1]), int(d_parts[2])
                data_formatada = f"{dia_i} de {meses_pt[mes_i - 1]} de {ano_i}"
        except Exception:
            data_formatada = dt_emissao_raw
    if not data_formatada:
        agora = datetime.now()
        data_formatada = f"{agora.day} de {meses_pt[agora.month - 1]} de {agora.year}"

    texto_data_oficial = f"{cidade_emissao}, {data_formatada}" if cidade_emissao else data_formatada

    story.append(Paragraph(f"<b>PRAZO DE ENTREGA:</b> {prazo_ent}", ParagraphStyle("PE", parent=styles["Normal"], fontName="Helvetica", fontSize=8, leading=10, textColor=colors.black)))
    story.append(Spacer(1, 1.5 * mm))
    story.append(Paragraph(f"<b>PRAZO DE VALIDADE DA PROPOSTA:</b> {prazo_val}", ParagraphStyle("PV", parent=styles["Normal"], fontName="Helvetica", fontSize=8, leading=10, textColor=colors.black)))
    story.append(Spacer(1, 2.5 * mm))
    story.append(Paragraph(decl_trab, ParagraphStyle("DT", parent=styles["Normal"], fontName="Helvetica", fontSize=7.5, leading=9.5, alignment=TA_JUSTIFY, textColor=colors.HexColor("#0F172A"))))
    story.append(Spacer(1, 3.5 * mm))
    story.append(Paragraph(f"<b>{texto_data_oficial}</b>", ParagraphStyle("DTO", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10, alignment=TA_CENTER, textColor=colors.black)))
    story.append(Spacer(1, 4 * mm))

    # Assinatura Oficial (com imagem da assinatura se existir)
    caminho_ass = config_timb.get("caminho_assinatura") if isinstance(config_timb, dict) else (config_timb["caminho_assinatura"] if "caminho_assinatura" in config_timb.keys() else "")
    itens_bloco_ass = []

    if caminho_ass and os.path.exists(caminho_ass):
        try:
            img_ass = RLImage(caminho_ass, width=46 * mm, height=15 * mm)
            img_ass.hAlign = 'CENTER'
            itens_bloco_ass.append(img_ass)
            itens_bloco_ass.append(Spacer(1, 1 * mm))
        except Exception as e:
            print(f"Erro ao carregar imagem da assinatura: {e}")

    texto_linha_ass = f"____________________________________________________<br/><b>{config_timb['razao_social']}</b><br/><font size=7.5 color='#334155'>{config_timb['nome_representante']} — Representante Legal</font><br/><font size=6.5 color='#64748B'>CNPJ: {config_timb['cnpj']}</font>"
    itens_bloco_ass.append(Paragraph(texto_linha_ass, ParagraphStyle("Ass", parent=styles["Normal"], alignment=TA_CENTER, fontName="Helvetica", fontSize=8, leading=11)))

    card_ass = Table([[itens_bloco_ass]], colWidths=[180 * mm])
    card_ass.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(card_ass)

    # Anexo Catálogo
    if itens:
        story.append(PageBreak())
        story.append(Paragraph("ANEXO — CATÁLOGO E ESPECIFICAÇÕES TÉCNICAS DOS PRODUTOS", ParagraphStyle("CatT", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor("#0F2C59"))))
        story.append(Spacer(1, 4 * mm))

        for item in itens:
            qtd_item_int = int(round(item["quantidade"]))
            img_element = None
            if item["caminho_imagem"] and os.path.exists(item["caminho_imagem"]):
                try:
                    img_element = RLImage(item["caminho_imagem"], width=44 * mm, height=36 * mm)
                except Exception:
                    pass
            if not img_element:
                img_element = Paragraph("<font size=7 color='#94A3B8'>[Foto do Produto]</font>", ParagraphStyle("SF", parent=styles["Normal"], alignment=TA_CENTER))

            desc_curta_html = f"<b>ITEM {item['num_item']} — {item['descricao_curta']}</b>"
            marca_html = f"<font size=7.5 color='#475569'><b>Marca/Modelo:</b> {item['marca']} | <b>Qtd.:</b> {qtd_item_int} un. | <b>Unit.:</b> {formatar_moeda_br(item['valor_unitario'])}</font>"
            specs_clean = item['descricao_tecnica'].replace('\n', '<br/>')
            specs_html = f"<font size=7 color='#334155'>{specs_clean}</font>"

            conteudo_dir = [
                Paragraph(desc_curta_html, ParagraphStyle("IT", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.HexColor("#0F2C59"))),
                Spacer(1, 1 * mm),
                Paragraph(marca_html, styles["Normal"]),
                Spacer(1, 1.5 * mm),
                Paragraph("<b>Especificações Técnicas:</b>", ParagraphStyle("SL", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5)),
                Paragraph(specs_html, styles["Normal"]),
            ]

            card = Table([[img_element, conteudo_dir]], colWidths=[48 * mm, 132 * mm])
            card.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#F8FAFC")),
                ("BACKGROUND", (1, 0), (1, 0), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(card)
            story.append(Spacer(1, 4 * mm))

    doc.build(story, canvasmaker=canvas_factory)
    buffer.seek(0)
    return buffer.getvalue()


# ==============================================================================
# 4. INTERFACE STREAMLIT
# ==============================================================================
conn = get_db_connection()

tab_timbrado, tab_montar, tab_hist, tab_cad = st.tabs([
    "🖼️ Configurações do Papel Timbrado",
    "📝 Montar Proposta & Catálogo",
    "📂 Minhas Licitações / Histórico",
    "➕ Cadastrar Licitação",
])

# ------------------------------------------------------------------------------
# ABA: CONFIGURAÇÕES DO PAPEL TIMBRADO (PRIMEIRAS INFORMAÇÕES DA IMAGEM)
# ------------------------------------------------------------------------------
with tab_timbrado:
    st.subheader("Configurações do Papel Timbrado")
    st.markdown("As primeiras informações oficiais do papel timbrado contêm os dados cadastrais da empresa e qualificação do representante legal:")

    timb_row = conn.execute("SELECT * FROM config_timbrado WHERE id = 1;").fetchone()

    # Visualização fiel da imagem enviada pelo usuário
    st.markdown(f"""
    <div style="background: white; border: 2px solid #000; padding: 18px; border-radius: 6px; font-family: sans-serif; color: black; line-height: 1.4;">
        <p style="font-size: 15px; margin: 0 0 4px 0;">Pregão Eletrônico <b>Nº 0019/26-A</b></p>
        <p style="font-size: 15px; margin: 0 0 10px 0;">Processo Administrativo <b>Nº 0038/2026</b></p>
        <table style="width: 100%; border-top: 1px solid black; border-bottom: 1px solid black; border-collapse: collapse; font-size: 12px;">
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; width: 180px; padding: 3px 0;">RAZÃO SOCIAL:</td><td style="font-weight: bold;">{timb_row['razao_social']}</td></tr>
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; padding: 3px 0;">CNPJ:</td><td>{timb_row['cnpj']}</td></tr>
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; padding: 3px 0;">INSCRIÇÃO ESTADUAL</td><td>{timb_row['inscricao_estadual']}</td></tr>
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; padding: 3px 0;">ENDEREÇO:</td><td>{timb_row['endereco']}</td></tr>
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; padding: 3px 0;">TELEFONE:</td><td>{timb_row['telefone']}</td></tr>
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; padding: 3px 0;">EMAIL:</td><td>{timb_row['email']}</td></tr>
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; padding: 3px 0;">BANCO (NOME/Nº):</td><td>{timb_row['banco']}</td></tr>
            <tr style="border-bottom: 1px solid black;"><td style="font-weight: bold; padding: 3px 0;">AGÊNCIA Nº:</td><td>{timb_row['agencia']}</td></tr>
            <tr><td style="font-weight: bold; padding: 3px 0;">CONTA CORRENTE Nº:</td><td>{timb_row['conta_corrente']}</td></tr>
        </table>
        <p style="font-size: 12px; margin-top: 10px; text-align: justify;">
            A empresa <b>{timb_row['razao_social']}</b>, inscrita no CNPJ sobo nº {timb_row['cnpj']}, sediada na {timb_row['endereco']}, neste ato representado(a) por <b>{timb_row['nome_representante']}</b>, portador(a) do documento de identidade RG nº {timb_row['rg_representante']}, inscrito(a) no CPF nº {timb_row['cpf_representante']}, residente e domiciliado na {timb_row['endereco_representante']}, vem apresentar Proposta Comercial para a participação no processo indicado acima, conforme abaixo descriminado:
        </p>
    </div>
    """, unsafe_allow_html=True)

    with st.expander("✏️ Editar Dados Cadastrais e Bancários da Empresa"):
        with st.form("form_timb_edit"):
            c1, c2, c3 = st.columns([3, 2, 2])
            rz = c1.text_input("Razão Social:", value=timb_row["razao_social"])
            cn = c2.text_input("CNPJ:", value=timb_row["cnpj"])
            ie = c3.text_input("Inscrição Estadual:", value=timb_row["inscricao_estadual"])

            c4, c5, c6 = st.columns([4, 2, 3])
            end = c4.text_input("Endereço:", value=timb_row["endereco"])
            tel = c5.text_input("Telefones:", value=timb_row["telefone"])
            em = c6.text_input("E-mail:", value=timb_row["email"])

            c7, c8, c9 = st.columns(3)
            bc = c7.text_input("Banco (Nome/Nº):", value=timb_row["banco"])
            ag = c8.text_input("Agência Nº:", value=timb_row["agencia"])
            cc = c9.text_input("Conta Corrente Nº:", value=timb_row["conta_corrente"])

            st.markdown("##### Representante Legal")
            c10, c11, c12 = st.columns(3)
            nr = c10.text_input("Nome do Representante:", value=timb_row["nome_representante"])
            rg = c11.text_input("RG:", value=timb_row["rg_representante"])
            cpf = c12.text_input("CPF:", value=timb_row["cpf_representante"])
            er = st.text_input("Endereço Residencial do Representante:", value=timb_row["endereco_representante"])

            if st.form_submit_button("Salvar Alterações"):
                conn.execute("""
                    UPDATE config_timbrado SET
                    razao_social=?, cnpj=?, inscricao_estadual=?, endereco=?, telefone=?, email=?,
                    banco=?, agencia=?, conta_corrente=?, nome_representante=?, rg_representante=?,
                    cpf_representante=?, endereco_representante=?
                    WHERE id = 1
                """, (rz, cn, ie, end, tel, em, bc, ag, cc, nr, rg, cpf, er))
                conn.commit()
                st.success("Dados atualizados com sucesso!")
                st.rerun()

    st.markdown("---")
    st.markdown("#### ⏱️ Prazos, Declaração Trabalhista & Data de Emissão (Inseridos após a Tabela de Preços)")
    st.markdown("Configurações dos prazos oficiais, declaração e data de emissão posicionados logo após o valor por extenso:")

    prazo_ent_atual = timb_row["prazo_entrega"] if ("prazo_entrega" in timb_row.keys() and timb_row["prazo_entrega"]) else "Conforme Aviso de Dispensa Eletrônica e Termo de Referência."
    prazo_val_atual = timb_row["prazo_validade"] if ("prazo_validade" in timb_row.keys() and timb_row["prazo_validade"]) else "90 Dias"
    decl_trab_atual = timb_row["declaracao_trabalhista"] if ("declaracao_trabalhista" in timb_row.keys() and timb_row["declaracao_trabalhista"]) else "Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas."
    cidade_emis_atual = timb_row["cidade_emissao"] if ("cidade_emissao" in timb_row.keys() and timb_row["cidade_emissao"]) else "Timóteo - MG"
    dt_emis_atual = timb_row["data_emissao"] if ("data_emissao" in timb_row.keys() and timb_row["data_emissao"]) else ""

    with st.form("form_termos_emissao"):
        col_pe, col_pv = st.columns(2)
        novo_pe = col_pe.text_input("PRAZO DE ENTREGA:", value=prazo_ent_atual)
        novo_pv = col_pv.text_input("PRAZO DE VALIDADE DA PROPOSTA:", value=prazo_val_atual)

        novo_decl = st.text_area("Declaração Trabalhista:", value=decl_trab_atual, height=90)

        col_cid, col_dt = st.columns(2)
        novo_cid = col_cid.text_input("Cidade / UF de Emissão:", value=cidade_emis_atual)

        val_data = datetime.now().date()
        if dt_emis_atual:
            try:
                val_data = datetime.strptime(dt_emis_atual, "%Y-%m-%d").date()
            except Exception:
                pass
        novo_dt = col_dt.date_input("Data de Emissão do Documento:", value=val_data)

        if st.form_submit_button("💾 Salvar Prazos, Declaração e Data de Emissão"):
            conn.execute("""
                UPDATE config_timbrado SET
                prazo_entrega=?, prazo_validade=?, declaracao_trabalhista=?, cidade_emissao=?, data_emissao=?
                WHERE id = 1
            """, (novo_pe, novo_pv, novo_decl, novo_cid, novo_dt.strftime("%Y-%m-%d")))
            conn.commit()
            st.success("Prazos, declaração e data salvos com sucesso!")
            st.rerun()

    st.markdown("---")
    st.markdown("#### ✒️ Imagem da Assinatura do Responsável Legal")
    st.markdown("Envie a foto ou imagem digitalizada da assinatura do responsável (PNG com fundo transparente ou JPG):")
    
    col_ass_up, col_ass_prev = st.columns([3, 2])
    with col_ass_up:
        af = st.file_uploader("Upload da Assinatura:", type=["png", "jpg", "jpeg"], key="ass_upload")
        if af:
            pa = os.path.join(TIMBRADO_DIR, "assinatura.png")
            with open(pa, "wb") as f:
                f.write(af.getbuffer())
            conn.execute("UPDATE config_timbrado SET caminho_assinatura=? WHERE id=1", (pa,))
            conn.commit()
            st.success("Assinatura salva com sucesso!")
            st.rerun()

        caminho_ass_atual = timb_row["caminho_assinatura"] if "caminho_assinatura" in timb_row.keys() else ""
        if caminho_ass_atual and os.path.exists(caminho_ass_atual):
            if st.button("🗑️ Remover Assinatura Atual"):
                conn.execute("UPDATE config_timbrado SET caminho_assinatura='' WHERE id=1")
                conn.commit()
                st.success("Assinatura removida!")
                st.rerun()

    with col_ass_prev:
        caminho_ass_atual = timb_row["caminho_assinatura"] if "caminho_assinatura" in timb_row.keys() else ""
        if caminho_ass_atual and os.path.exists(caminho_ass_atual):
            st.markdown("**Prévia da Assinatura no PDF:**")
            st.image(caminho_ass_atual, width=200)
            st.markdown(f"""
            <div style="border-top: 1px solid black; width: 220px; text-align: center; font-size: 11px; margin-top: -8px;">
                <b>{timb_row['razao_social']}</b><br/>
                {timb_row['nome_representante']} — Representante Legal
            </div>
            """, unsafe_allow_html=True)
        else:
            st.info("Nenhuma imagem de assinatura carregada. O documento exibirá o traço para assinatura manual.")

    st.markdown("---")
    st.markdown("#### Upload de Imagens Opcionais de Topo e Base")
    col_cab, col_rod = st.columns(2)
    with col_cab:
        st.markdown("##### 🔝 Imagem do Cabeçalho")
        cf = st.file_uploader("Upload da Imagem do Topo:", type=["png", "jpg"], key="cab_upload")
        if cf:
            pc = os.path.join(TIMBRADO_DIR, "cabecalho.png")
            with open(pc, "wb") as f:
                f.write(cf.getbuffer())
            conn.execute("UPDATE config_timbrado SET caminho_cabecalho=? WHERE id=1", (pc,))
            conn.commit()
            st.success("Cabeçalho salvo!")
    with col_rod:
        st.markdown("##### 🔻 Imagem do Rodapé")
        rf = st.file_uploader("Upload da Imagem da Base:", type=["png", "jpg"], key="rod_upload")
        if rf:
            pr = os.path.join(TIMBRADO_DIR, "rodape.png")
            with open(pr, "wb") as f:
                f.write(rf.getbuffer())
            conn.execute("UPDATE config_timbrado SET caminho_rodape=? WHERE id=1", (pr,))
            conn.commit()
            st.success("Rodapé salvo!")

# ------------------------------------------------------------------------------
# ABA: MONTAR PROPOSTA & CATÁLOGO
# ------------------------------------------------------------------------------
with tab_montar:
    st.subheader("Montar Proposta Comercial & Catálogo")
    licitacoes_todas = conn.execute("SELECT * FROM licitacoes ORDER BY id DESC;").fetchall()
    if not licitacoes_todas:
        st.info("Cadastre uma licitação para montar a proposta.")
    else:
        opcoes = {f"#{l['id']} — {l['orgao']} ({l['processo_pregao']})": l['id'] for l in licitacoes_todas}
        escolha = st.selectbox("Selecione a Licitação:", list(opcoes.keys()))
        lic_id = opcoes[escolha]
        lic_atual = conn.execute("SELECT * FROM licitacoes WHERE id=?", (lic_id,)).fetchone()

        st.markdown("---")
        ultimo_item = conn.execute("SELECT MAX(num_item) FROM itens_licitacao WHERE licitacao_id=?", (lic_id,)).fetchone()[0] or 0

        with st.form("form_item"):
            c1, c2, c3 = st.columns([1, 4, 2])
            n_item = c1.number_input("Item *", min_value=1, step=1, value=ultimo_item + 1)
            d_curta = c2.text_input("Descrição Curta *", placeholder="Ex: Notebook Corporativo Core i7 16GB")
            m_item = c3.text_input("Marca / Modelo *", placeholder="Ex: Dell Latitude 5440")

            d_tec = st.text_area("Descrição Técnica Completa *", placeholder="Processador, memória, portas, garantia...")

            cq, cv, ci = st.columns([2, 2, 3])
            # ESTRITAMENTE NÚMERO INTEIRO
            qtd = cq.number_input("Quantidade (Inteiro) *", min_value=1, step=1, value=1)
            vlr = cv.number_input("Valor Unitário (R$) *", min_value=0.01, step=10.0, value=100.0, format="%.2f")
            foto = ci.file_uploader("Foto do Produto:", type=["png", "jpg", "jpeg"])

            if st.form_submit_button("Salvar Item"):
                if d_curta and m_item and d_tec:
                    path_img = ""
                    if foto:
                        path_img = os.path.join(UPLOADS_DIR, f"item_{lic_id}_{n_item}.png")
                        with open(path_img, "wb") as f:
                            f.write(foto.getbuffer())
                    tot = int(qtd) * float(vlr)
                    conn.execute("""
                        INSERT INTO itens_licitacao (licitacao_id, num_item, link_produto, descricao_curta, descricao_tecnica, marca, quantidade, valor_unitario, valor_total, caminho_imagem)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (lic_id, int(n_item), "", d_curta, d_tec, m_item, int(qtd), float(vlr), float(tot), path_img))
                    conn.commit()
                    st.success("Item adicionado!")
                    st.rerun()

        # Tabela e Download
        itens_atuais = conn.execute("SELECT * FROM itens_licitacao WHERE licitacao_id=? ORDER BY num_item ASC", (lic_id,)).fetchall()
        if itens_atuais:
            tot_g = sum(float(i["valor_total"]) for i in itens_atuais)
            st.markdown(f"### Total Geral da Proposta: {formatar_moeda_br(tot_g)}")

            timb_c = conn.execute("SELECT * FROM config_timbrado WHERE id=1").fetchone()
            pdf_bytes = gerar_documento_pdf(lic_atual, itens_atuais, timb_c)
            st.download_button(
                label="📄 GERAR E BAIXAR DOCUMENTO EM PDF",
                data=pdf_bytes,
                file_name=f"Proposta_{lic_atual['id']}.pdf",
                mime="application/pdf",
                type="primary",
                use_container_width=True
            )

# ------------------------------------------------------------------------------
# ABA: MINHAS LICITAÇÕES & HISTÓRICO
# ------------------------------------------------------------------------------
with tab_hist:
    st.subheader("Histórico de Licitações")
    lics = conn.execute("SELECT * FROM licitacoes ORDER BY id DESC").fetchall()
    for l in lics:
        st.write(f"**#{l['id']} — {l['orgao']}** | Processo: {l['processo_pregao']} ({l['modalidade']}) - Status: {l['status']}")

# ------------------------------------------------------------------------------
# ABA: CADASTRAR LICITAÇÃO
# ------------------------------------------------------------------------------
with tab_cad:
    st.subheader("Nova Licitação")
    with st.form("cad_lic"):
        org = st.text_input("Órgão / Processo Administrativo *", value="Processo Administrativo Nº 0038/2026")
        prg = st.text_input("Processo / Pregão *", value="Pregão Eletrônico Nº 0019/26-A")
        mod = st.selectbox("Modalidade:", ["Pregão Eletrônico", "Dispensa Eletrônica", "Concorrência Eletrônica", "Leilão Eletrônico"])
        if st.form_submit_button("Cadastrar"):
            conn.execute("INSERT INTO licitacoes (orgao, processo_pregao, modalidade, data_cadastro, status) VALUES (?, ?, ?, ?, ?)",
                         (org, prg, mod, datetime.now().strftime("%d/%m/%Y"), "Pendente"))
            conn.commit()
            st.success("Licitação cadastrada!")
            st.rerun()
