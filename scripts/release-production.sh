#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env.production" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.production"
  set +a
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd npm
require_cmd pm2
require_cmd node

mkdir -p logs

echo "[release] installing dependencies"
npm ci

echo "[release] generating prisma client"
npm run prisma:generate

if [[ "${HUELEGOOD_RUN_DB_PUSH:-0}" == "1" ]]; then
  echo "[release] syncing prisma schema with database"
  npm run prisma:push
fi

echo "[release] building applications"
npm run build

echo "[release] reloading pm2 processes"
pm2 startOrReload ecosystem.config.cjs --env production --update-env
pm2 save

echo "[release] running smoke checks"
node scripts/smoke-check.mjs

echo "[release] completed"
