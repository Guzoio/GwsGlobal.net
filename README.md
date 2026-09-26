# GWS GLOBAL.net - Gestão de Licitações & Gerador de Propostas Comerciais

Sistema completo para empresas participantes de licitações públicas (pregões eletrônicos, dispensas e concorrências). Permite cadastrar processos, cadastrar itens com fotos e especificações técnicas, calcular limites de lances e gerar propostas comerciais oficiais em PDF com papel timbrado dinâmico e catálogo ilustrativo.

---

## 🚀 Como Publicar na Hostinger (Ficar 100% Idêntico)

### ⚠️ Por que a página ficou incompleta/sem botões ao subir os arquivos brutos?
O navegador de internet **não interpreta arquivos TypeScript (.tsx)** diretamente. Quando você coloca arquivos de código-fonte como `src/main.tsx` no servidor web da Hostinger (Nginx, Apache ou hPanel), o navegador tenta carregar o arquivo `.tsx` e não consegue, resultando numa tela incompleta.

---

### Opção 1: O Método Mais Rápido (Só Arrastar e Soltar na Hostinger)
1. No sistema, clique no botão **"Exportar / Hostinger"** no topo da tela (ou abra o menu Configurações).
2. Baixe o arquivo **`gws_sistema_dist_hostinger.zip`**.
3. Extraia o arquivo no seu computador. Você verá o arquivo `index.html` e a pasta `assets/`.
4. No **Gerenciador de Arquivos** da Hostinger (ou via FTP/FileZilla), envie esses arquivos direto para dentro da pasta **`public_html`** (ou `/var/www/html` na sua VPS).
5. Pronto! Acesse seu domínio: o sistema abrirá **100% idêntico, com todos os botões, logotipo, gerador de PDF e calculadora funcionando**.

---

### Opção 2: Rodar na VPS com Node.js + PM2 (Servidor Completo)
Se você tem uma VPS Hostinger (KVM 1 ou KVM 2) e deseja rodar o servidor Node.js:

```bash
# 1. Conecte na sua VPS via SSH
ssh root@seu_ip_da_vps

# 2. Acesse a pasta do projeto
cd /var/www/gws-licitacoes

# 3. Instale as dependências e compile o projeto
npm install
npm run build

# 4. Inicie o servidor em segundo plano com PM2
npm install -g pm2
pm2 start server.js --name "gws-licitacoes"
pm2 save
pm2 startup
```

---

### Opção 3: Versão em Python (app.py) com Streamlit
Se preferir rodar a versão em Python com Streamlit e banco de dados SQLite:

```bash
# 1. Instalar dependências no servidor ou máquina local
pip install streamlit reportlab num2words beautifulsoup4 requests pillow

# 2. Executar o sistema
streamlit run app.py
```
O sistema abrirá na porta `8501`.
