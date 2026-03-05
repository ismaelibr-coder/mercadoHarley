#!/usr/bin/env bash
set -euo pipefail

# Script to pull latest code on remote host and restart PM2 using ecosystem config.
# Usage (local):
#   DEPLOY_HOST=your.host DEPLOY_USER=root DEPLOY_PATH=/home/app/mercado-harley ./scripts/deploy-backend.sh

if [ -z "${DEPLOY_HOST:-}" ] || [ -z "${DEPLOY_USER:-}" ] || [ -z "${DEPLOY_PATH:-}" ]; then
  echo "DEPLOY_HOST, DEPLOY_USER and DEPLOY_PATH must be set. Aborting."
  exit 1
fi

echo "Pulling latest code on ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH} and restarting PM2..."
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" <<'REMOTE'
set -euo pipefail
cd "${DEPLOY_PATH}"
git fetch origin main
git reset --hard origin/main
npm ci --silent || npm install --no-audit --no-fund
pm2 stop mercado-harley-backend || true
pm2 delete mercado-harley-backend || true
pm2 start ecosystem.config.js --env production --update-env
pm2 save
REMOTE

echo "Backend deployed and restarted on ${DEPLOY_HOST}"
