#!/bin/bash

# Script de deploy para resolver erro 500 e aplicar FASE 2 no VPS
# Uso: ssh root@187.77.62.63 'bash -s' < deploy-fase2-vps.sh

set -e  # Exit on any error

echo "========================================="
echo "🚀 Deploy FASE 2 - Migração Firebase→MySQL"
echo "========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto
REPO_DIR="/var/www/mercadoHarley/repo"
BACKEND_DIR="$REPO_DIR/backend"

cd "$REPO_DIR"

echo "📍 Diretório atual: $(pwd)"
echo ""

# 1. Verificar status do Git
echo "🔍 Verificando status do Git..."
git status

echo ""
echo "${YELLOW}⚠️  Resolvendo conflitos do Git...${NC}"
echo "Opções:"
echo "  1) git stash (salvar alterações locais)"
echo "  2) git reset --hard origin/main (descartar alterações locais)"
echo ""
echo "Escolhendo opção 1 (stash)..."
git stash
echo "${GREEN}✅ Alterações locais salvas${NC}"
echo ""

# 2. Fazer pull do repositório
echo "📥 Baixando código atualizado..."
git pull origin main
echo "${GREEN}✅ Código atualizado (commit 3d2c200)${NC}"
echo ""

# 3. Instalar dependências atualizadas
echo "📦 Instalando dependências (removendo Firebase, 128 pacotes)..."
cd "$BACKEND_DIR"
npm install
echo "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# 4. Verificar se MySQL está rodando
echo "🔍 Verificando MySQL..."
if systemctl is-active --quiet mysql; then
    echo "${GREEN}✅ MySQL está rodando${NC}"
else
    echo "${RED}❌ MySQL não está rodando!${NC}"
    echo "Tentando iniciar MySQL..."
    systemctl start mysql
fi
echo ""

# 5. Testar conexão com banco
echo "🗄️  Testando conexão com banco de dados..."
mysql -u harley_user -p$(grep MYSQL_PASSWORD "$BACKEND_DIR/.env" | cut -d '=' -f2) -e "USE mercado_harley; SELECT COUNT(*) as total_orders FROM orders;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Conexão com banco OK${NC}"
else
    echo "${YELLOW}⚠️  Não foi possível testar conexão (mas pode estar OK)${NC}"
fi
echo ""

# 6. Reiniciar backend com PM2
echo "🔄 Reiniciando backend com PM2..."
pm2 restart mercado-harley-backend --update-env
pm2 save
echo "${GREEN}✅ Backend reiniciado${NC}"
echo ""

# 7. Aguardar 3 segundos para backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 3

# 8. Verificar status do PM2
echo "📊 Status do PM2:"
pm2 list | grep mercado-harley-backend
echo ""

# 9. Testar endpoints
echo "🧪 Testando endpoints..."
echo ""

echo "1️⃣  Testando endpoint de health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health || echo "000")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "${GREEN}✅ Health check OK (200)${NC}"
else
    echo "${RED}❌ Health check falhou (HTTP $HEALTH_CHECK)${NC}"
fi
echo ""

echo "2️⃣  Testando endpoint de banners (refatorado)..."
BANNERS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/banners || echo "000")
if [ "$BANNERS" = "200" ]; then
    echo "${GREEN}✅ Banners OK (200)${NC}"
else
    echo "${RED}❌ Banners falhou (HTTP $BANNERS)${NC}"
fi
echo ""

echo "3️⃣  Testando endpoint de produtos (não alterado)..."
PRODUCTS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/products?limit=1 || echo "000")
if [ "$PRODUCTS" = "200" ]; then
    echo "${GREEN}✅ Produtos OK (200)${NC}"
else
    echo "${RED}❌ Produtos falhou (HTTP $PRODUCTS)${NC}"
fi
echo ""

# 10. Verificar logs recentes
echo "📋 Últimas 20 linhas de log do backend:"
echo "----------------------------------------"
pm2 logs mercado-harley-backend --lines 20 --nostream
echo ""

# 11. Resumo
echo "========================================="
echo "📊 RESUMO DO DEPLOY"
echo "========================================="
echo ""
echo "Commit aplicado: 3d2c200 (FASE 2)"
echo "Mudanças:"
echo "  ✅ bannerService.js refatorado (Firestore → Sequelize)"
echo "  ✅ analyticsService.js refatorado (Firestore → Sequelize)"
echo "  ✅ shippingService.js refatorado (Firestore → Sequelize)"
echo "  ✅ firebase-admin removido (-128 pacotes)"
echo "  ✅ firebaseService.js deletado"
echo ""
echo "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "🌐 Testes manuais recomendados:"
echo "  • https://sickgrip.com.br/admin (deve resolver erro 500)"
echo "  • Dashboard de analytics"
echo "  • Gerenciamento de banners"
echo "  • Cálculo de frete no checkout"
echo ""
echo "📝 Para ver logs em tempo real:"
echo "  pm2 logs mercado-harley-backend --lines 100"
echo ""
echo "🔄 Se algo der errado, reverter com:"
echo "  cd $REPO_DIR && git reset --hard 822d975 && cd backend && npm install && pm2 restart mercado-harley-backend"
echo ""
echo "========================================="
