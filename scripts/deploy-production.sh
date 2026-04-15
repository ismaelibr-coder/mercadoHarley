#!/usr/bin/env bash
set -euo pipefail

# Deploy completo (backend + frontend)
# Exemplo:
# DEPLOY_HOST=187.77.62.63 DEPLOY_USER=root DEPLOY_PASSWORD='***' DEPLOY_PATH=/var/www/mercadoHarley/repo FRONTEND_REMOTE_PATH=/var/www/html ./scripts/deploy-production.sh

if [ -z "${DEPLOY_HOST:-}" ] || [ -z "${DEPLOY_USER:-}" ] || [ -z "${DEPLOY_PATH:-}" ]; then
  echo "DEPLOY_HOST, DEPLOY_USER e DEPLOY_PATH são obrigatórios."
  exit 1
fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"
BACKEND_SUBDIR="${BACKEND_SUBDIR:-backend}"
PM2_APP_NAME="${PM2_APP_NAME:-mercado-harley-backend}"
FRONTEND_REMOTE_PATH="${FRONTEND_REMOTE_PATH:-/var/www/html}"

echo "[1/2] Deploy backend..."
DEPLOY_HOST="$DEPLOY_HOST" \
DEPLOY_USER="$DEPLOY_USER" \
DEPLOY_PASSWORD="${DEPLOY_PASSWORD:-}" \
DEPLOY_PORT="$DEPLOY_PORT" \
DEPLOY_PATH="$DEPLOY_PATH" \
BACKEND_SUBDIR="$BACKEND_SUBDIR" \
PM2_APP_NAME="$PM2_APP_NAME" \
./scripts/deploy-backend.sh

echo "[2/2] Deploy frontend..."
METHOD="${METHOD:-rsync}" \
HOST="$DEPLOY_HOST" \
USER="$DEPLOY_USER" \
PASSWORD="${DEPLOY_PASSWORD:-}" \
PORT="$DEPLOY_PORT" \
REMOTE_PATH="$FRONTEND_REMOTE_PATH" \
SSH_KEY="${SSH_KEY:-}" \
./scripts/deploy-frontend.sh

echo "✅ Deploy de produção concluído (backend + frontend)."
