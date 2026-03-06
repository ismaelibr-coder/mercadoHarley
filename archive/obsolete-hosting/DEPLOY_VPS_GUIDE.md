# 🚀 Guia de Deploy - Hostinger VPS

**VPS:** 187.77.62.63  
**Sistema:** Ubuntu 25.10  
**Domínio:** https://www.sickgrip.com.br

---

## 📋 Pré-requisitos

Você precisa de:
- ✅ Acesso SSH ao VPS (IP, usuário: root, senha)
- ✅ Git e repositório GitHub configurado
- ✅ Credenciais das APIs (Mercado Pago, Melhor Envio, etc.)
- ✅ Arquivo `firebase-service-account.json` (para exportar dados)

---

## ⚡ Passo 1: Conectar ao VPS via SSH

Use um terminal (PowerShell, Git Bash, WSL ou qualquer SSH client):

```bash
ssh root@187.77.62.63
```

Ele vai pedir a senha do VPS. Digite e pressione Enter.

---

## 🔧 Passo 2: Executar Script de Setup (Automático)

Já na SSH do VPS, execute este comando:

```bash
# Baixar script de setup
curl -O https://raw.githubusercontent.com/ismaelibr-coder/mercadoHarley/main/setup-vps.sh

# Dar permissão de execução
chmod +x setup-vps.sh

# Executar (vai levar ~10 minutos)
./setup-vps.sh
```

Isso vai automaticamente:
- ✅ Atualizar o sistema
- ✅ Instalar Node.js, npm, MySQL
- ✅ Clonar seu repositório
- ✅ Criar banco de dados
- ✅ Importar schema.sql
- ✅ Criar arquivo .env

**O script vai exibir:**
- 🔑 Credenciais MySQL (salve em local seguro!)
- 🔐 JWT_SECRET (guardar!)
- 📍 Caminho da aplicação

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

No VPS, edite o arquivo `.env`:

```bash
cd /home/app/mercado-harley/backend
nano .env
```

Configure estas variáveis com suas credenciais:

```env
# IMPORTANTE - Suas credenciais de API

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=SEU_TOKEN_AQUI

# Melhor Envio (Frete)
MELHOR_ENVIO_TOKEN=SEU_TOKEN_AQUI

# Cloudinary (Imagens)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# Resend (E-mail)
RESEND_API_KEY=re_SEU_TOKEN_AQUI
EMAIL_FROM=seu-email@sickgrip.com.br
```

**Como salvar no Nano:**
1. Faça as alterações
2. Pressione `Ctrl + X`
3. Digite `Y` (Yes)
4. Pressione `Enter`

---

## 📤 Passo 4: Exportar Dados do Firebase

**IMPORTANTE:** Execute isto **no seu computador local**, não no VPS!

No diretório do projeto local:

```bash
# Instalar dependência (se não tiver)
npm install firebase-admin

# Executa exportação
cd backend
node export-firebase.js
```

Isso cria uma pasta `firebase-export/` com arquivos JSON de:
- users.json
- products.json
- orders.json
- banners.json
- shippingRules.json
- auditLogs.json

---

## 📥 Passo 5: Importar Dados para MySQL no VPS

Copie os arquivos exportados para o VPS:

```bash
# Do seu computador local (PowerShell/Terminal):
scp -r firebase-export/ root@187.77.62.63:/home/app/mercado-harley/backend/
```

Depois, no SSH do VPS:

```bash
cd /home/app/mercado-harley/backend

# Executar importação
node import-firebase.js
```

Ele vai exibir um resumo:
```
👥 Usuários: 10
📦 Produtos: 50
🛒 Pedidos: 25
🎨 Banners: 3
🚚 Regras de Frete: 8
```

---

## 🌐 Passo 6: Iniciar Backend (Teste Rápido)

No VPS:

```bash
cd /home/app/mercado-harley/backend
npm run dev
```

Você deve ver:
```
Server running on port 3000
Database connected
✅ Backend ready!
```

Se vir erro de conexão MySQL, volte ao Passo 3 e verifique .env

---

## ☁️ Passo 7: Configurar PM2 (Manter Rodando 24/7)

PM2 mantém sua aplicação ativa mesmo que o VPS reinicie.

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar backend com PM2
cd /home/app/mercado-harley/backend
pm2 start npm --name "mercado-harley-api" -- run dev

# Salvar configuração
pm2 save

# Configurar startup automático
pm2 startup
pm2 save

# Verificar status
pm2 status
```

---

## 🔒 Passo 8: Configurar Nginx como Reverse Proxy

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/sickgrip

# Colar isto:
```

```nginx
server {
    listen 80;
    server_name www.sickgrip.com.br sickgrip.com.br;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (se estiver rodando em 3001)
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/sickgrip /etc/nginx/sites-enabled/

# Desabilitar site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔐 Passo 9: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado (automático)
sudo certbot --nginx -d www.sickgrip.com.br -d sickgrip.com.br

# Renovação automática (já vem configurada)
sudo systemctl status certbot.timer
```

---

## 📊 Verificações Finais

```bash
# Testar se backend está respondendo
curl http://localhost:3000/api/products

# Ver logs do backend
pm2 logs mercado-harley-api

# Ver status MySQL
sudo systemctl status mysql

# Ver espaço em disco
df -h
```

---

## ⚡ Comandos Úteis para o Futuro

```bash
# Parar backend
pm2 stop mercado-harley-api

# Reiniciar
pm2 restart mercado-harley-api

# Ver logs em tempo real
pm2 logs mercado-harley-api --follow

# Deletar aplicação do PM2
pm2 delete mercado-harley-api

# Atualizar código (git pull)
cd /home/app/mercado-harley
git pull origin main
npm install
pm2 restart mercado-harley-api

# Acessar banco MySQL direto
mysql -u harley_user -p mercado_harley
# (depois digita a senha que o script mostrou)
```

---

## 🐛 Troubleshooting

### ❌ "Connection refused"
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Se não estiver, iniciar
sudo systemctl start mysql
```

### ❌ "Port 3000 already in use"
```bash
# Mata processo na porta 3000
sudo fuser -k 3000/tcp

# Ou muda a porta no .env: PORT=3001
```

### ❌ "Module not found"
```bash
cd /home/app/mercado-harley/backend
npm install
pm2 restart mercado-harley-api
```

### ❌ "ENOSPC: no space left"
```bash
# Verificar espaço
df -h

# Limpar cache
sudo apt clean
sudo apt autoclean
```

---

## ✅ Sucesso!

Sua aplicação está rodando em:
- 🌐 **Frontend:** https://www.sickgrip.com.br
- 🔌 **API:** https://www.sickgrip.com.br/api/
- 📊 **Banco:** MySQL hospedado no VPS

Qualquer dúvida, me chama!
