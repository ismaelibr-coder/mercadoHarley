#!/bin/bash
# Script simplificado para reiniciar backend após FASE 2
# Executar no VPS diretamente: bash reiniciar-backend.sh

set -e

echo "🔄 Reiniciando backend Mercado Harley..."
cd /var/www/mercadoHarley/repo/backend

echo "📦 Reinstalando dependências (caso necessário)..."
npm install --quiet

echo "🚀 Reiniciando PM2..."
pm2 restart mercado-harley-backend --update-env

echo "💾 Salvando configuração PM2..."
pm2 save

echo "⏳ Aguardando 3 segundos..."
sleep 3

echo ""
echo "📊 Status do PM2:"
pm2 list

echo ""
echo "📋 Últimas 30 linhas de log:"
pm2 logs mercado-harley-backend --lines 30 --nostream

echo ""
echo "🧪 Testando endpoints:"
echo ""

echo "1️⃣ Health check..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:3001/api/health || echo "❌ Falhou"

echo "2️⃣ Banners (refatorado)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:3001/api/banners || echo "❌ Falhou"

echo "3️⃣ Produtos..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:3001/api/products?limit=1 || echo "❌ Falhou"

echo ""
echo "✅ Reinicialização concluída!"
echo "🌐 Teste no navegador: https://sickgrip.com.br/admin"
