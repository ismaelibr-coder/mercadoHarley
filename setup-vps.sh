#!/bin/bash

# ====================================================
# Mercado Harley - VPS Setup Script
# Sistema: Ubuntu 25.10
# Hostinger VPS
# ====================================================

set -e  # Exit on error

echo "🚀 Iniciando setup do VPS Hostinger..."
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ====================================================
# 1. UPDATE SYSTEM
# ====================================================
echo -e "${YELLOW}[1/8] Atualizando sistema...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# ====================================================
# 2. INSTALL NODE.JS & NPM
# ====================================================
echo -e "${YELLOW}[2/8] Instalando Node.js e npm...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs npm

node --version
npm --version

# ====================================================
# 3. INSTALL MYSQL
# ====================================================
echo -e "${YELLOW}[3/8] Instalando MySQL Server...${NC}"
apt install -y mysql-server mysql-client

# Start MySQL
systemctl start mysql
systemctl enable mysql

echo -e "${GREEN}✓ MySQL instalado${NC}"

# ====================================================
# 4. CLONE GITHUB REPOSITORY
# ====================================================
echo -e "${YELLOW}[4/8] Clonando repositório GitHub...${NC}"

REPO_URL="https://github.com/ismaelibr-coder/mercadoHarley.git"
APP_DIR="/home/app/mercado-harley"

mkdir -p /home/app
cd /home/app

if [ ! -d "$APP_DIR" ]; then
    git clone $REPO_URL mercado-harley
    echo -e "${GREEN}✓ Repositório clonado${NC}"
else
    echo -e "${YELLOW}⚠ Diretório já existe, atualizando...${NC}"
    cd $APP_DIR
    git pull origin main
    cd /home/app
fi

# Verificar se o clone foi bem-sucedido
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Erro ao clonar repositório!${NC}"
    exit 1
fi

# ====================================================
# 5. INSTALL BACKEND DEPENDENCIES
# ====================================================
echo -e "${YELLOW}[5/8] Instalando dependências do backend...${NC}"
cd "$APP_DIR/backend"
npm install

echo -e "${GREEN}✓ Dependências instaladas${NC}"

# ====================================================
# 6. CREATE MYSQL DATABASE & USER
# ====================================================
echo -e "${YELLOW}[6/8] Criando banco de dados MySQL...${NC}"

# Generate a random password for MySQL user
DB_PASSWORD=$(openssl rand -base64 32)

# Create database and user
mysql -u root <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS mercado_harley;
CREATE USER IF NOT EXISTS 'harley_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON mercado_harley.* TO 'harley_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${GREEN}✓ Banco de dados criado${NC}"
echo "Database: mercado_harley"
echo "User: harley_user"
echo "Password: $DB_PASSWORD"

# ====================================================
# 7. IMPORT SCHEMA.SQL
# ====================================================
echo -e "${YELLOW}[7/8] Importando schema do banco de dados...${NC}"

SCHEMA_FILE="$APP_DIR/schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Arquivo schema.sql não encontrado em $SCHEMA_FILE${NC}"
    exit 1
fi

mysql -u harley_user -p"$DB_PASSWORD" mercado_harley < "$SCHEMA_FILE"

echo -e "${GREEN}✓ Schema importado${NC}"

# ====================================================
# 8. CREATE .ENV FILE
# ====================================================
echo -e "${YELLOW}[8/8] Criando arquivo .env...${NC}"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

cat > "$APP_DIR/backend/.env" <<ENV_FILE
# ====================================================
# DATABASE
# ====================================================
DB_HOST=localhost
DB_USER=harley_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=mercado_harley

# ====================================================
# JWT AUTHENTICATION
# ====================================================
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# ====================================================
# FRONTEND
# ====================================================
FRONTEND_URL=https://www.sickgrip.com.br
PORT=3000

# ====================================================
# EXTERNAL APIS
# ====================================================

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=YOUR_MERCADOPAGO_TOKEN_HERE

# Melhor Envio (Frete)
MELHOR_ENVIO_TOKEN=YOUR_MELHOR_ENVIO_TOKEN_HERE
MELHOR_ENVIO_FROM_CEP=91030170
MELHOR_ENVIO_SANDBOX=false

# Cloudinary (Images)
CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# Resend (Email)
RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE
EMAIL_FROM=noreply@resend.dev

# ====================================================
# ENVIRONMENT
# ====================================================
NODE_ENV=production
ENV_FILE

echo -e "${GREEN}✓ Arquivo .env criado${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Configure as variáveis de API no .env:${NC}"
echo "   - MERCADOPAGO_ACCESS_TOKEN"
echo "   - MELHOR_ENVIO_TOKEN"
echo "   - CLOUDINARY_* (opcional)"
echo "   - RESEND_API_KEY (para e-mail)"
echo ""

# ====================================================
# INSTALL FRONTEND DEPENDENCIES
# ====================================================
echo -e "${YELLOW}[Bônus] Instalando dependências do frontend...${NC}"
cd "$APP_DIR"
npm install

echo -e "${GREEN}✓ Frontend pronto${NC}"

# ====================================================
# COMPLETION
# ====================================================
echo ""
echo -e "${GREEN}========================================"
echo "✅ SETUP COMPLETO!"
echo "========================================${NC}"
echo ""
echo "📍 Caminho da aplicação: $APP_DIR"
echo ""
echo "🔑 Credenciais MySQL:"
echo "   Host: localhost"
echo "   User: harley_user"
echo "   Password: $DB_PASSWORD"
echo "   Database: mercado_harley"
echo ""
echo "🚀 Para iniciar o servidor backend:"
echo "   cd $APP_DIR/backend"
echo "   npm run dev"
echo ""
echo "🌐 Para fazer build do frontend:"
echo "   cd $APP_DIR"
echo "   npm run build"
echo ""
echo "📝 Próximos passos:"
echo "   1. Editar .env com suas credenciais de API"
echo "   2. Exportar dados do Firebase (seu script)"
echo "   3. Configurar PM2 para manter app rodando"
echo "   4. Configurar Nginx como reverse proxy"
echo "   5. Configurar SSL com Let's Encrypt"
echo ""
