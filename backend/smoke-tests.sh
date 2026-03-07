#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:3001"
HDR="X-Forwarded-Proto: https"

echo "==> Health"
curl -sS -i -H "$HDR" "$BASE/api/health" || curl -sS -i -H "$HDR" "$BASE/health" || echo "health: NOK"

echo "==> Root"
curl -sS -i -H "$HDR" "$BASE/" || echo "root: NOK"

echo "==> Products"
curl -sS -i -H "$HDR" "$BASE/api/products" || echo "products: NOK"

echo "==> Banners"
curl -sS -i -H "$HDR" "$BASE/api/banner" || curl -sS -i -H "$HDR" "$BASE/api/banners" || echo "banners: NOK"

echo "==> (Opcional) Criar pedido — ajustar payload antes de usar"
# Exemplo de uso para criar um pedido (descomente e ajuste se quiser testar)
# curl -sS -i -H "$HDR" -H "Content-Type: application/json" \
#   -d '{"items":[{"productId":"5b2x5tl7hc8wloMCMRIh","quantity":1}],"customer":{"name":"Test","email":"test@example.com"}}' \
#   "$BASE/api/orders" || echo "create-order: NOK"

echo "==> PM2 status"
pm2 status mercado-harley-backend || true

echo "==> Fim dos testes de smoke"
