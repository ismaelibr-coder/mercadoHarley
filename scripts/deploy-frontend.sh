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

ASKPASS_FILE=""

cleanup() {
  if [ -n "${ASKPASS_FILE}" ] && [ -f "${ASKPASS_FILE}" ]; then
    rm -f "${ASKPASS_FILE}" || true
  fi
}

trap cleanup EXIT

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

build_ssh_with_password() {
  local base_ssh=(ssh -p "$PORT")

  if [ -n "$PASSWORD" ] && [ -z "$SSH_KEY" ]; then
    if command -v sshpass >/dev/null 2>&1; then
      base_ssh=(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=accept-new)
    else
      ASKPASS_FILE="$(mktemp)"
      cat > "${ASKPASS_FILE}" <<EOF
#!/usr/bin/env sh
echo '${PASSWORD}'
EOF
      chmod 700 "${ASKPASS_FILE}"
      export SSH_ASKPASS="${ASKPASS_FILE}"
      export SSH_ASKPASS_REQUIRE=force
      export DISPLAY="${DISPLAY:-dummy:0}"
      base_ssh=(ssh -p "$PORT" -o StrictHostKeyChecking=accept-new)
      echo "sshpass não encontrado; usando fallback SSH_ASKPASS."
    fi
  elif [ -n "$SSH_KEY" ]; then
    base_ssh=(ssh -i "$SSH_KEY" -p "$PORT")
  fi

  SSH_BASE=("${base_ssh[@]}")
}

deploy_with_tar_over_ssh() {
  build_ssh_with_password

  if ! command -v tar >/dev/null 2>&1; then
    echo "tar não disponível localmente para fallback de deploy."
    exit 1
  fi

  echo "rsync não disponível; fazendo deploy via tar over SSH..."
  tar -C "$BUILD_DIR" -czf - . | "${SSH_BASE[@]}" "$USER@$HOST" "mkdir -p '$REMOTE_PATH' && find '$REMOTE_PATH' -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf - -C '$REMOTE_PATH'"
  echo "Deploy finished (tar over ssh)."
}

if [ "$METHOD" = "rsync" ]; then
  if ! command -v rsync >/dev/null 2>&1; then
    deploy_with_tar_over_ssh
    exit 0
  fi

  RSYNC_SSH="ssh -p $PORT"
  if [ -n "$PASSWORD" ] && [ -z "$SSH_KEY" ]; then
    if command -v sshpass >/dev/null 2>&1; then
      RSYNC_SSH="sshpass -p $PASSWORD ssh -p $PORT -o StrictHostKeyChecking=accept-new"
    else
      ASKPASS_FILE="$(mktemp)"
      cat > "${ASKPASS_FILE}" <<EOF
#!/usr/bin/env sh
echo '${PASSWORD}'
EOF
      chmod 700 "${ASKPASS_FILE}"
      export SSH_ASKPASS="${ASKPASS_FILE}"
      export SSH_ASKPASS_REQUIRE=force
      export DISPLAY="${DISPLAY:-dummy:0}"
      RSYNC_SSH="ssh -p $PORT -o StrictHostKeyChecking=accept-new"
      echo "sshpass não encontrado; usando fallback SSH_ASKPASS para rsync."
    fi
  elif [ -n "$SSH_KEY" ]; then
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
