"""
================================================================================
SISTEMA DE GESTÃO DE LICITAÇÕES E GERADOR DE PROPOSTAS COM CATÁLOGO DE PRODUTOS
================================================================================
GWS GLOBAL.net - Licitações Públicas e Propostas Comerciais
Streamlit + SQLite + ReportLab PDF
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

# Tenta carregar num2words para valor por extenso
try:
    from num2words import num2words
except ImportError:
    num2words = None

# Tenta carregar ReportLab para PDF
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
    REPORTLAB_DISPONIVEL = True
except ImportError:
    REPORTLAB_DISPONIVEL = False

st.set_page_config(
    page_title="GWS GLOBAL.net - Gestão de Licitações & Propostas",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded",
)

DB_PATH = "licitacoes.db"
UPLOADS_DIR = "uploads_produtos"
TIMBRADO_DIR = "uploads_timbrado"

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(TIMBRADO_DIR, exist_ok=True)

# ------------------------------------------------------------------------------
# 1. BANCO DE DADOS LOCAL (SQLite)
# ------------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS licitacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orgao TEXT NOT NULL,
        processo_pregao TEXT NOT NULL,
        modalidade TEXT NOT NULL,
        data_cadastro TEXT NOT NULL,
        responsavel TEXT NOT NULL DEFAULT 'Gustavo',
        prazo_entrega TEXT DEFAULT '15 (quinze) dias úteis',
        prazo_validade TEXT DEFAULT '60 (sessenta) dias',
        declaracao_trabalhista TEXT DEFAULT 'Declaramos para todos os fins de direito que nossa empresa cumpre integralmente o disposto no inciso XXXIII do artigo 7º da Constituição Federal (proibição de trabalho noturno, perigoso ou insalubre a menores de dezoito anos e de qualquer trabalho a menores de dezesseis anos).'
    );
    """)
    c.execute("""
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
        selecionado INTEGER DEFAULT 1,
        FOREIGN KEY (licitacao_id) REFERENCES licitacoes (id) ON DELETE CASCADE
    );
    """)
    c.execute("""
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
    c.execute("SELECT COUNT(*) FROM config_timbrado WHERE id = 1;")
    if c.fetchone()[0] == 0:
        c.execute("""
        INSERT INTO config_timbrado (id, caminho_cabecalho, caminho_rodape, altura_cabecalho_mm, altura_rodape_mm, nome_empresa, cnpj, endereco, contato)
        VALUES (1, '', '', 28.0, 18.0, 'GWS GLOBAL.NET COMERCIO E SERVICOS LTDA', '00.000.000/0001-00', 'Brasil', 'contato@gwsglobal.net');
        """)
    conn.commit()
    conn.close()

init_db()

# ------------------------------------------------------------------------------
# 2. FUNÇÕES AUXILIARES
# ------------------------------------------------------------------------------
def formatar_moeda(val: float) -> str:
    return f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def converter_extenso(val: float) -> str:
    if num2words:
        try:
            return num2words(val, lang="pt_BR", to="currency").capitalize()
        except Exception:
            pass
    reais = int(val)
    centavos = int(round((val - reais) * 100))
    t = f"{reais:,} reais".replace(",", ".")
    if centavos > 0:
        t += f" e {centavos:02d} centavos"
    return t

def raspar_link(url: str) -> Dict[str, Any]:
    dados = {"titulo": "", "marca": "", "especificacoes": ""}
    if not url or not url.startswith("http"):
        return dados
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            h1 = soup.find("h1") or soup.find("title")
            if h1:
                dados["titulo"] = re.sub(r"\s*[-|]\s*(Mercado Livre|Amazon|Magalu).*$", "", h1.get_text().strip(), flags=re.I)[:180]
            meta = soup.find("meta", attrs={"name": "description"})
            if meta and meta.get("content"):
                dados["especificacoes"] = meta["content"].strip()
    except Exception as e:
        st.warning(f"Não foi possível raspar o link automaticamente: {e}")
    return dados

# ------------------------------------------------------------------------------
# 3. INTERFACE STREAMLIT
# ------------------------------------------------------------------------------
st.title("⚖️ GWS GLOBAL.net - Gestão de Licitações")
st.markdown("Sistema de Gestão de Editais, Catálogo de Produtos e Gerador de Propostas Oficiais em PDF.")

menu = ["📋 Histórico de Licitações", "➕ Nova Licitação", "📦 Montar Proposta & Itens", "🎨 Papel Timbrado", "🧮 Calculadora de Lances"]
escolha = st.sidebar.selectbox("Navegação", menu)

conn = get_db()

if escolha == "➕ Nova Licitação":
    st.subheader("Cadastrar Nova Licitação")
    with st.form("form_nova_lic"):
        orgao = st.text_input("Órgão Licitante (ex: Prefeitura Municipal de Goiânia / Fundo Municipal de Saúde)")
        processo = st.text_input("Processo / Pregão (ex: Pregão Eletrônico nº 042/2026)")
        modalidade = st.selectbox("Modalidade", ["Pregão Eletrônico", "Dispensa de Licitação", "Concorrência Pública", "Tomada de Preços", "Inexigibilidade"])
        responsavel = st.selectbox("Responsável pelo Processo", ["Gustavo", "Administrador GWS"])
        prazo_entrega = st.text_input("Prazo de Entrega", "15 (quinze) dias úteis")
        prazo_validade = st.text_input("Validade da Proposta", "60 (sessenta) dias")
        submitted = st.form_submit_button("Salvar Licitação")
        if submitted:
            if not orgao or not processo:
                st.error("Informe o Órgão e o Número do Processo/Pregão.")
            else:
                data_hoje = datetime.now().strftime("%d/%m/%Y")
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO licitacoes (orgao, processo_pregao, modalidade, data_cadastro, responsavel, prazo_entrega, prazo_validade)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (orgao, processo, modalidade, data_hoje, responsavel, prazo_entrega, prazo_validade))
                conn.commit()
                st.success(f"Licitação {processo} cadastrada com sucesso!")

elif escolha == "📋 Histórico de Licitações":
    st.subheader("Histórico de Processos Cadastrados")
    lics = conn.execute("SELECT * FROM licitacoes ORDER BY id DESC").fetchall()
    if not lics:
        st.info("Nenhuma licitação cadastrada ainda. Clique em '➕ Nova Licitação' para começar.")
    else:
        for l in lics:
            with st.expander(f"📌 {l['processo_pregao']} — {l['orgao']}"):
                col1, col2, col3 = st.columns(3)
                col1.write(f"**Modalidade:** {l['modalidade']}")
                col2.write(f"**Data:** {l['data_cadastro']}")
                col3.write(f"**Responsável:** {l['responsavel']}")
                
                itens_count = conn.execute("SELECT COUNT(*) FROM itens_licitacao WHERE licitacao_id = ?", (l["id"],)).fetchone()[0]
                total_val = conn.execute("SELECT SUM(valor_total) FROM itens_licitacao WHERE licitacao_id = ? AND selecionado = 1", (l["id"],)).fetchone()[0] or 0.0
                st.write(f"**Itens cadastrados:** {itens_count} | **Valor Total:** {formatar_moeda(total_val)}")

elif escolha == "📦 Montar Proposta & Itens":
    st.subheader("Montar Proposta e Catálogo Ilustrativo")
    lics = conn.execute("SELECT id, processo_pregao, orgao FROM licitacoes ORDER BY id DESC").fetchall()
    if not lics:
        st.warning("Cadastre uma licitação antes de adicionar itens.")
    else:
        opcoes_lic = {f"{l['processo_pregao']} - {l['orgao']}": l["id"] for l in lics}
        sel = st.selectbox("Selecione a Licitação", list(opcoes_lic.keys()))
        lic_id = opcoes_lic[sel]
        
        st.markdown("---")
        st.write("### Adicionar Item à Licitação")
        with st.form("form_item"):
            col_a, col_b, col_c = st.columns([1, 2, 1])
            num_item = col_a.number_input("Nº Item", min_value=1, step=1, value=1)
            link_prod = col_b.text_input("Link do Produto (Mercado Livre, Amazon, etc. para autocompletar)")
            marca = col_c.text_input("Marca / Fabricante", "Lenovo")
            
            desc_curta = st.text_input("Descrição Curta do Produto (ex: Notebook Lenovo ThinkPad 16GB SSD 512GB)")
            desc_tecnica = st.text_area("Especificações Técnicas Completas (Catálogo Técnico)", height=120)
            
            col_v1, col_v2 = st.columns(2)
            qtd = col_v1.number_input("Quantidade (Unidades Inteiras)", min_value=1, step=1, value=1)
            v_unit = col_v2.number_input("Valor Unitário (R$)", min_value=0.01, step=10.0, value=3500.00)
            
            img_file = st.file_uploader("Foto Ilustrativa do Produto", type=["png", "jpg", "jpeg", "webp"])
            
            add_sub = st.form_submit_button("➕ Salvar Item")
            if add_sub:
                caminho_salvo = ""
                if img_file:
                    nome_arq = f"item_{lic_id}_{num_item}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
                    caminho_salvo = os.path.join(UPLOADS_DIR, nome_arq)
                    with open(caminho_salvo, "wb") as f:
                        f.write(img_file.getbuffer())
                
                v_tot = float(qtd) * float(v_unit)
                conn.execute("""
                INSERT INTO itens_licitacao (licitacao_id, num_item, link_produto, descricao_curta, descricao_tecnica, marca, quantidade, valor_unitario, valor_total, caminho_imagem, selecionado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """, (lic_id, num_item, link_prod, desc_curta, desc_tecnica, marca, int(qtd), float(v_unit), v_tot, caminho_salvo))
                conn.commit()
                st.success("Item adicionado com sucesso!")

        st.markdown("---")
        st.write("### Itens Atuais Desta Proposta")
        itens = conn.execute("SELECT * FROM itens_licitacao WHERE licitacao_id = ? ORDER BY num_item ASC", (lic_id,)).fetchall()
        if itens:
            for it in itens:
                col_i1, col_i2, col_i3, col_i4 = st.columns([1, 4, 2, 1])
                col_i1.write(f"**Item {it['num_item']}**")
                col_i2.write(f"**{it['descricao_curta']}**  \n*Marca:* {it['marca']}")
                col_i3.write(f"Qtd: **{it['quantidade']}** x {formatar_moeda(it['valor_unitario'])} = **{formatar_moeda(it['valor_total'])}**")
                if col_i4.button("🗑️ Excluir", key=f"del_{it['id']}"):
                    conn.execute("DELETE FROM itens_licitacao WHERE id = ?", (it["id"],))
                    conn.commit()
                    st.rerun()

elif escolha == "🎨 Papel Timbrado":
    st.subheader("Configuração do Papel Timbrado Oficial")
    cfg = conn.execute("SELECT * FROM config_timbrado WHERE id = 1").fetchone()
    
    with st.form("form_timbrado"):
        emp = st.text_input("Razão Social da Empresa", cfg["nome_empresa"] if cfg else "")
        cnpj = st.text_input("CNPJ", cfg["cnpj"] if cfg else "")
        end = st.text_input("Endereço Completo", cfg["endereco"] if cfg else "")
        cont = st.text_input("Contato / E-mail / Telefone", cfg["contato"] if cfg else "")
        
        col_up1, col_up2 = st.columns(2)
        up_cab = col_up1.file_uploader("Imagem do Cabeçalho Timbrado (Topo)", type=["png", "jpg", "jpeg"])
        up_rod = col_up2.file_uploader("Imagem do Rodapé Timbrado (Base)", type=["png", "jpg", "jpeg"])
        
        salvar_timb = st.form_submit_button("Salvar Timbrado")
        if salvar_timb:
            c_cab = cfg["caminho_cabecalho"] if cfg else ""
            c_rod = cfg["caminho_rodape"] if cfg else ""
            if up_cab:
                c_cab = os.path.join(TIMBRADO_DIR, "cabecalho_oficial.png")
                with open(c_cab, "wb") as f:
                    f.write(up_cab.getbuffer())
            if up_rod:
                c_rod = os.path.join(TIMBRADO_DIR, "rodape_oficial.png")
                with open(c_rod, "wb") as f:
                    f.write(up_rod.getbuffer())
            
            conn.execute("""
            UPDATE config_timbrado
            SET nome_empresa = ?, cnpj = ?, endereco = ?, contato = ?, caminho_cabecalho = ?, caminho_rodape = ?
            WHERE id = 1
            """, (emp, cnpj, end, cont, c_cab, c_rod))
            conn.commit()
            st.success("Configurações do papel timbrado salvas com sucesso!")

elif escolha == "🧮 Calculadora de Lances":
    st.subheader("Calculadora de Limite de Oferta & Lucratividade")
    col1, col2 = st.columns(2)
    custo_compra = col1.number_input("Custo de Aquisição do Produto (R$)", min_value=0.0, value=2500.0, step=50.0)
    frete = col1.number_input("Frete Unitário Estimado (R$)", min_value=0.0, value=120.0, step=10.0)
    outros = col1.number_input("Embalagem / Outros Custos (R$)", min_value=0.0, value=30.0, step=5.0)
    
    imposto_pct = col2.number_input("Alíquota de Impostos (Simples/Lucro Presumido %)", min_value=0.0, max_value=40.0, value=8.5, step=0.5)
    margem_min_pct = col2.number_input("Margem Líquida Mínima Desejada (%)", min_value=0.0, max_value=60.0, value=15.0, step=1.0)
    
    custo_base = custo_compra + frete + outros
    divisor = 1.0 - ((imposto_pct + margem_min_pct) / 100.0)
    preco_minimo = (custo_base / divisor) if divisor > 0 else custo_base
    lucro_liquido = preco_minimo * (margem_min_pct / 100.0)
    
    st.markdown("---")
    res1, res2, res3 = st.columns(3)
    res1.metric("Custo Direto Base", formatar_moeda(custo_base))
    res2.metric("Menor Lance Seguro (Limite)", formatar_moeda(preco_minimo))
    res3.metric("Lucro Líquido no Limite", formatar_moeda(lucro_liquido))
    
    if preco_minimo > 0:
        st.info(f"💡 **Recomendação para a disputa do pregão:** Não ofereça lances abaixo de **{formatar_moeda(preco_minimo)}** para garantir sua margem mínima de {margem_min_pct}%.")

conn.close()
