#!/usr/bin/env bash
# Bergen backend VPS deploy — updates only /var/www/bergencar/backend.
set -euo pipefail

APP_DIR="/var/www/bergencar/backend"
SECRETS_DIR="/var/www/bergencar-secrets"
BRANCH="${DEPLOY_BRANCH:-main}"
LOCK_FILE="/tmp/bergen-backend-deploy.lock"
PM2_NAME="bergen-car-api"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another Bergen backend deploy is in progress; waiting..."
  flock 9
fi

echo "==> Bergen backend deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "ERROR: $APP_DIR is not a git checkout"
  exit 1
fi

mkdir -p "$SECRETS_DIR"
[[ -f "$APP_DIR/.env" ]] && cp -a "$APP_DIR/.env" "$SECRETS_DIR/backend.env"

cd "$APP_DIR"
git fetch --prune origin "$BRANCH"
git checkout -f -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd -e node_modules -e dist -e .env

[[ -f "$SECRETS_DIR/backend.env" ]] && cp -a "$SECRETS_DIR/backend.env" "$APP_DIR/.env"

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "ERROR: backend .env missing (expected $SECRETS_DIR/backend.env)"
  exit 1
fi

echo "==> npm ci @ $(git rev-parse --short HEAD)"
npm ci

echo "==> prisma generate + tsc"
npm run build

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start /var/www/bergencar/ecosystem.config.cjs --only "$PM2_NAME"
fi
pm2 save

echo "==> Backend healthy check"
sleep 2
curl -sf -m 15 "http://127.0.0.1:4001/health" >/dev/null
echo "==> Bergen backend deploy done $(date -u +%Y-%m-%dT%H:%M:%SZ)"
