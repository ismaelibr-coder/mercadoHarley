#!/usr/bin/env bash
set -euo pipefail

# Script to build the frontend and optionally deploy via rsync/ssh.
# Usage (local):
#   DEPLOY_HOST=your.host DEPLOY_USER=user DEPLOY_PATH=/var/www/site ./scripts/deploy-frontend.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building frontend..."
npm ci --quiet || npm install --no-audit --no-fund
npm run build

if [ -z "${DEPLOY_HOST:-}" ] || [ -z "${DEPLOY_USER:-}" ] || [ -z "${DEPLOY_PATH:-}" ]; then
  echo "Build complete. Deployment variables not set (DEPLOY_HOST/DEPLOY_USER/DEPLOY_PATH)."
  echo "If you want to deploy, export those env vars and re-run this script."
  exit 0
fi

echo "Deploying dist/ to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
rsync -avz --delete dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
echo "Frontend deployed."
