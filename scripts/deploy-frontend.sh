#!/usr/bin/env bash
set -euo pipefail

# Robust frontend deploy script
# Usage examples:
# METHOD=rsync HOST=example.com USER=user REMOTE_PATH=/home/user/public_html PORT=22 ./scripts/deploy-frontend.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/dist"
METHOD="${METHOD:-rsync}"
HOST="${HOST:-}"
USER="${USER:-}"
REMOTE_PATH="${REMOTE_PATH:-/public_html/}"
SSH_KEY="${SSH_KEY:-}"
PORT="${PORT:-22}"
PASSWORD="${PASSWORD:-}"

if [ -z "$HOST" ] || [ -z "$USER" ]; then
  echo "Missing HOST or USER. Usage: HOST=host USER=user REMOTE_PATH=/path ./scripts/deploy-frontend.sh"
  exit 1
fi

echo "Building frontend in $REPO_ROOT..."
cd "$REPO_ROOT"

# Ensure npm installs will accept legacy peer deps and include devDependencies
export npm_config_legacy_peer_deps=true
export npm_config_production=false

if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# Prefer running local vite binary via npm exec
if npm exec --silent vite -- build; then
  echo "Build succeeded with npm exec vite."
else
  echo "npm exec vite failed; falling back to npm run build."
  npm run build
fi

if [ ! -d "$BUILD_DIR" ]; then
  echo "Build dir $BUILD_DIR not found. Exiting."
  exit 1
fi

echo "Uploading build to $USER@$HOST:$REMOTE_PATH using $METHOD..."

if [ "$METHOD" = "rsync" ]; then
  RSYNC_SSH="ssh -p $PORT"
  if [ -n "$SSH_KEY" ]; then
    RSYNC_SSH="ssh -i $SSH_KEY -p $PORT"
  fi
  rsync -avz --delete -e "$RSYNC_SSH" "$BUILD_DIR"/ "$USER"@"$HOST":"$REMOTE_PATH"
  echo "Deploy finished (rsync)."
else
  if command -v lftp >/dev/null 2>&1; then
    if [ -n "$PASSWORD" ]; then
      lftp -u "$USER","$PASSWORD" -e "mirror -R --delete --verbose \"$BUILD_DIR\" \"$REMOTE_PATH\"; quit" sftp://"$HOST":"$PORT"
    else
      lftp -e "mirror -R --delete --verbose \"$BUILD_DIR\" \"$REMOTE_PATH\"; quit" sftp://"$USER"@"$HOST":"$PORT"
    fi
    echo "Deploy finished (sftp via lftp)."
  elif command -v sshpass >/dev/null 2>&1 && [ -n "$PASSWORD" ]; then
    sshpass -p "$PASSWORD" ssh -p "$PORT" "$USER"@"$HOST" "mkdir -p \"$REMOTE_PATH\""
    sshpass -p "$PASSWORD" scp -P "$PORT" -r "$BUILD_DIR"/* "$USER"@"$HOST":"$REMOTE_PATH"
    echo "Deploy finished (sftp via sshpass+scp)."
  else
    echo "No sftp uploader available (lftp or sshpass). Install lftp or sshpass, or use METHOD=rsync with SSH key."
    exit 1
  fi
fi
