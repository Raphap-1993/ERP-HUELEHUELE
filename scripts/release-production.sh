#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

incoming_release_sha="${APP_RELEASE_SHA:-}"

env_candidates=(
  ".env.production"
  "../shared/.env.production"
)

for env_file in "${env_candidates[@]}"; do
  if [[ -f "$env_file" ]]; then
    echo "[release] loading environment from $env_file"
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    break
  fi
done

set_default_env() {
  local name="$1"
  local value="$2"

  if [[ -z "${!name:-}" ]]; then
    export "$name=$value"
  fi
}

set_default_env NEXT_PUBLIC_APP_URL "${NEXT_PUBLIC_APP_URL:-${APP_URL:-https://huelegood.com}}"
set_default_env NEXT_PUBLIC_ADMIN_URL "${NEXT_PUBLIC_ADMIN_URL:-${ADMIN_URL:-https://admin.huelegood.com}}"
set_default_env NEXT_PUBLIC_API_URL "${NEXT_PUBLIC_API_URL:-${API_URL:-https://api.huelegood.com/api/v1}}"

set_default_env BOOTSTRAP_ADMIN_NAME "${BOOTSTRAP_ADMIN_NAME:-${ADMIN_LOGIN_NAME:-Admin Huelegood}}"
set_default_env BOOTSTRAP_ADMIN_EMAIL "${BOOTSTRAP_ADMIN_EMAIL:-${ADMIN_LOGIN_EMAIL:-admin@huelegood.com}}"
set_default_env BOOTSTRAP_ADMIN_PASSWORD "${BOOTSTRAP_ADMIN_PASSWORD:-${ADMIN_LOGIN_PASSWORD:-replace-me}}"

set_default_env BOOTSTRAP_PAYMENTS_NAME "${BOOTSTRAP_PAYMENTS_NAME:-${PAYMENTS_LOGIN_NAME:-Operador de Pagos}}"
set_default_env BOOTSTRAP_PAYMENTS_EMAIL "${BOOTSTRAP_PAYMENTS_EMAIL:-${PAYMENTS_LOGIN_EMAIL:-pagos@huelegood.com}}"
set_default_env BOOTSTRAP_PAYMENTS_PASSWORD "${BOOTSTRAP_PAYMENTS_PASSWORD:-${PAYMENTS_LOGIN_PASSWORD:-replace-me}}"

set_default_env BOOTSTRAP_SELLER_NAME "${BOOTSTRAP_SELLER_NAME:-${SELLER_LOGIN_NAME:-Mónica Herrera}}"
set_default_env BOOTSTRAP_SELLER_EMAIL "${BOOTSTRAP_SELLER_EMAIL:-${SELLER_LOGIN_EMAIL:-monica@seller.com}}"
set_default_env BOOTSTRAP_SELLER_PASSWORD "${BOOTSTRAP_SELLER_PASSWORD:-${SELLER_LOGIN_PASSWORD:-replace-me}}"
set_default_env BOOTSTRAP_SELLER_VENDOR_CODE "${BOOTSTRAP_SELLER_VENDOR_CODE:-${SELLER_VENDOR_CODE:-VEND-014}}"

set_default_env BOOTSTRAP_CUSTOMER_NAME "${BOOTSTRAP_CUSTOMER_NAME:-${CUSTOMER_LOGIN_NAME:-Cliente Huelegood}}"
set_default_env BOOTSTRAP_CUSTOMER_EMAIL "${BOOTSTRAP_CUSTOMER_EMAIL:-${CUSTOMER_LOGIN_EMAIL:-cliente@huelegood.com}}"
set_default_env BOOTSTRAP_CUSTOMER_PASSWORD "${BOOTSTRAP_CUSTOMER_PASSWORD:-${CUSTOMER_LOGIN_PASSWORD:-replace-me}}"

if [[ -n "$incoming_release_sha" ]]; then
  export APP_RELEASE_SHA="$incoming_release_sha"
fi

# Avoid leaking a single global PORT into all PM2 apps.
unset PORT || true

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
npm ci --include=dev

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
