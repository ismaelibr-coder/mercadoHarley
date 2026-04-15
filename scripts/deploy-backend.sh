#!/usr/bin/env bash
set -euo pipefail

# Deploy backend on remote host and restart PM2 using ecosystem config.
# Usage:
# DEPLOY_HOST=your.host DEPLOY_USER=root DEPLOY_PATH=/home/app/mercado-harley ./scripts/deploy-backend.sh
# Optional:
# DEPLOY_PORT=22 DEPLOY_PASSWORD=secret BACKEND_SUBDIR=backend PM2_APP_NAME=mercado-harley-backend

if [ -z "${DEPLOY_HOST:-}" ] || [ -z "${DEPLOY_USER:-}" ] || [ -z "${DEPLOY_PATH:-}" ]; then
  echo "DEPLOY_HOST, DEPLOY_USER and DEPLOY_PATH must be set. Aborting."
  exit 1
fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_PASSWORD="${DEPLOY_PASSWORD:-}"
BACKEND_SUBDIR="${BACKEND_SUBDIR:-backend}"
PM2_APP_NAME="${PM2_APP_NAME:-mercado-harley-backend}"

echo "Deploying backend to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH} (port ${DEPLOY_PORT})..."

SSH_CMD=(ssh -p "${DEPLOY_PORT}")
ASKPASS_FILE=""

cleanup() {
  if [ -n "${ASKPASS_FILE}" ] && [ -f "${ASKPASS_FILE}" ]; then
    rm -f "${ASKPASS_FILE}" || true
  fi
}

trap cleanup EXIT

if [ -n "${DEPLOY_PASSWORD}" ]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    ASKPASS_FILE="$(mktemp)"
    cat > "${ASKPASS_FILE}" <<EOF
#!/usr/bin/env sh
echo '${DEPLOY_PASSWORD}'
EOF
    chmod 700 "${ASKPASS_FILE}"

    export SSH_ASKPASS="${ASKPASS_FILE}"
    export SSH_ASKPASS_REQUIRE=force
    export DISPLAY="${DISPLAY:-dummy:0}"

    SSH_CMD=(ssh -n -p "${DEPLOY_PORT}" -o StrictHostKeyChecking=accept-new)
    echo "sshpass não encontrado; usando fallback SSH_ASKPASS."
  else
    SSH_CMD=(sshpass -p "${DEPLOY_PASSWORD}" ssh -p "${DEPLOY_PORT}" -o StrictHostKeyChecking=accept-new)
  fi
fi

# Use ssh to run a robust sequence on the remote server. Pass DEPLOY_PATH as arg ($1) to avoid heredoc variable expansion issues.
"${SSH_CMD[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s -- "${DEPLOY_PATH}" "${BACKEND_SUBDIR}" "${PM2_APP_NAME}" <<'REMOTE'
set -euo pipefail

TARGET_DIR="$1"
BACKEND_SUBDIR="$2"
PM2_APP_NAME="$3"

cd "$TARGET_DIR"

if [ -n "$BACKEND_SUBDIR" ] && [ -d "$BACKEND_SUBDIR" ]; then
  cd "$BACKEND_SUBDIR"
fi

git fetch origin main
git reset --hard origin/main

# Ensure npm uses legacy peer deps and installs production deps (no dev)
export npm_config_legacy_peer_deps=true
export npm_config_production=false

# Install backend deps (omit dev)
npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# Restart with PM2 using CommonJS ecosystem first, fallback to other options
pm2 stop "$PM2_APP_NAME" || true
pm2 delete "$PM2_APP_NAME" || true
if pm2 start ecosystem.config.cjs --env production --update-env; then
  echo "Started via ecosystem.config.cjs"
else
  pm2 start ecosystem.config.js --env production --update-env || pm2 start server.js --name "$PM2_APP_NAME" --env production --update-env
fi

pm2 save || true

echo "\nPM2 status:"
pm2 list | grep -E "$PM2_APP_NAME|online|errored" || true

echo "\nHealth check:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3001/api/health || true
REMOTE

echo "Backend deployed and restarted on ${DEPLOY_HOST}"
