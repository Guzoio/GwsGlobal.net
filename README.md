# Gestão de Licitações e Gerador de Propostas Comerciais com Catálogo de Produtos

Aplicação web completa desenvolvida em **Python** utilizando **Streamlit**, **SQLite**, **python-docx / docxtpl**, **num2words**, **BeautifulSoup** e **Pillow**.

---

## 🚀 1. Como Instalar e Rodar Localmente

### Pré-requisitos
- Python 3.10 ou superior
- Gerenciador de pacotes `pip`

### Passo 1: Instalar dependências
Execute o comando abaixo no terminal:
```bash
pip install -r requirements.txt
```
Ou instale individualmente:
```bash
pip install streamlit docxtpl python-docx num2words beautifulsoup4 requests pillow
```

### Passo 2: Iniciar o aplicativo Streamlit
```bash
streamlit run app.py
```
O aplicativo será aberto automaticamente no navegador no endereço `http://localhost:8501`.

---

## 🗄️ 2. Estrutura do Banco de Dados (SQLite)

O arquivo `licitacoes.db` é criado e gerenciado automaticamente na primeira execução:

- **Tabela `licitacoes`**:
  - `id`: Chave primária (INTEGER AUTOINCREMENT)
  - `orgao`: Nome do órgão público licitante (TEXT)
  - `processo_pregao`: Número do processo ou pregão (TEXT)
  - `modalidade`: Modalidade de licitação (ex: Pregão Eletrônico) (TEXT)
  - `data_cadastro`: Data no formato DD/MM/AAAA (TEXT)
  - `status`: Status da licitação (Pendente, Aprovada, Perdida) (TEXT)

- **Tabela `itens_licitacao`**:
  - `id`: Chave primária (INTEGER AUTOINCREMENT)
  - `licitacao_id`: Chave estrangeira referenciando `licitacoes.id` (INTEGER)
  - `num_item`: Número sequencial do item no edital (INTEGER)
  - `link_produto`: URL informada para extração/referência (TEXT)
  - `descricao_curta`: Descrição resumida para a Tabela Comercial (TEXT)
  - `descricao_tecnica`: Especificação técnica completa para o Catálogo (TEXT)
  - `marca`: Marca / Fabricante / Modelo (TEXT)
  - `quantidade`: Quantidade exigida (REAL)
  - `valor_unitario`: Preço unitário em Reais (REAL)
  - `valor_total`: Quantidade * Valor Unitário (REAL)
  - `caminho_imagem`: Caminho relativo da foto salva na pasta `uploads_produtos/` (TEXT)

---

## 📝 3. Instruções do Template Word (.docx) com Tags de Substituição

Caso deseje utilizar um papel timbrado personalizado da sua empresa via `docxtpl`, crie um arquivo Word nomeado `template_proposta.docx` com as seguintes tags Jinja2:

### Variáveis do Cabeçalho Dinâmico:
- `{{ orgao }}`: Nome do órgão público licitante
- `{{ processo_pregao }}`: Número do pregão/processo
- `{{ modalidade }}`: Modalidade da licitação
- `{{ data_hoje }}`: Data formatada (DD/MM/AAAA)

### Tabela Comercial (Linha com Repetição):
Crie uma tabela com cabeçalho padrão e na segunda linha insira a diretiva de repetição:
```text
| Item | Descrição | Marca | Qtd | Valor Unit. | Valor Total |
| {% tr for item in itens %}{{ item.num_item }} | {{ item.descricao_curta }} | {{ item.marca }} | {{ item.quantidade }} | {{ item.valor_unitario }} | {{ item.valor_total }}{% tr endfor %} |
```

### Linha do Total e Extenso:
- `{{ total_geral }}`: Valor total somado formatado (Ex: `R$ 45.280,00`)
- `{{ extenso }}`: Valor por extenso em português do Brasil (Ex: `quarenta e cinco mil duzentos e oitenta reais`)

### Seção 2 — Anexo Catálogo Ilustrativo (Grade de 2 Colunas):
Insira uma quebra de página, o título do anexo e uma tabela de 1 linha e 2 colunas:
- **Coluna da Esquerda**: `{{ item.imagem_docxtpl }}` (ajustada com largura máxima de 5 cm)
- **Coluna da Direita**:
  ```text
  {% for item in itens %}
  ITEM {{ item.num_item }} — {{ item.descricao_curta }}
  Marca / Modelo: {{ item.marca }}
  Especificações Técnicas:
  {{ item.descricao_tecnica }}
  {% endfor %}
  ```

> **Nota:** O script `app.py` possui um gerador nativo que cria o arquivo Word completo automaticamente com layout institucional, papel timbrado, cores corporativas e catálogo de 2 colunas, mesmo sem o arquivo template pré-existente!
