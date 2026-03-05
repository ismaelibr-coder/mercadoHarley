#!/usr/bin/env bash
set -euo pipefail

# Deploy backend on remote host and restart PM2 using ecosystem config.
# Usage:
# DEPLOY_HOST=your.host DEPLOY_USER=root DEPLOY_PATH=/home/app/mercado-harley ./scripts/deploy-backend.sh

if [ -z "${DEPLOY_HOST:-}" ] || [ -z "${DEPLOY_USER:-}" ] || [ -z "${DEPLOY_PATH:-}" ]; then
  echo "DEPLOY_HOST, DEPLOY_USER and DEPLOY_PATH must be set. Aborting."
  exit 1
fi

echo "Deploying backend to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}..."

# Use ssh to run a robust sequence on the remote server. Pass DEPLOY_PATH as arg ($1) to avoid heredoc variable expansion issues.
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s -- "${DEPLOY_PATH}" <<'REMOTE'
set -euo pipefail

TARGET_DIR="$1"
cd "$TARGET_DIR"

git fetch origin main
git reset --hard origin/main

# Ensure npm uses legacy peer deps and installs production deps (no dev)
export npm_config_legacy_peer_deps=true
export npm_config_production=false

# Install backend deps (omit dev)
npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# Restart with PM2 using CommonJS ecosystem first, fallback to other options
pm2 stop mercado-harley-backend || true
pm2 delete mercado-harley-backend || true
if pm2 start ecosystem.config.cjs --env production --update-env; then
  echo "Started via ecosystem.config.cjs"
else
  pm2 start ecosystem.config.js --env production --update-env || pm2 start server.js --name mercado-harley-backend --env production --update-env
fi

pm2 save || true
REMOTE

echo "Backend deployed and restarted on ${DEPLOY_HOST}"
