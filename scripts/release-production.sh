#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

incoming_release_sha="${APP_RELEASE_SHA:-}"

resolve_app_root_dir() {
  local root_dir="$1"
  local parent_dir
  parent_dir="$(dirname "$root_dir")"

  if [[ "$(basename "$parent_dir")" == "releases" ]]; then
    dirname "$parent_dir"
  else
    printf '%s\n' "$parent_dir"
  fi
}

APP_ROOT_DIR="${APP_ROOT_DIR:-$(resolve_app_root_dir "$ROOT_DIR")}"
APP_SHARED_DIR_DEFAULT="${APP_SHARED_DIR:-$APP_ROOT_DIR/shared}"

if [[ "$(basename "$(dirname "$ROOT_DIR")")" == "releases" ]]; then
  APP_BASE_DIR_DEFAULT="${APP_BASE_DIR:-$APP_ROOT_DIR/current}"
else
  APP_BASE_DIR_DEFAULT="${APP_BASE_DIR:-$ROOT_DIR}"
fi

APP_LOG_DIR_DEFAULT="${APP_LOG_DIR:-$APP_BASE_DIR_DEFAULT/logs}"
PM2_APP_NAMES=(
  "huelegood-web"
  "huelegood-admin"
  "huelegood-api"
  "huelegood-worker"
)

env_candidates=(
  ".env.production"
  "../shared/.env.production"
  "$APP_SHARED_DIR_DEFAULT/.env.production"
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
set_default_env APP_BASE_DIR "$APP_BASE_DIR_DEFAULT"
set_default_env APP_SHARED_DIR "$APP_SHARED_DIR_DEFAULT"
set_default_env APP_LOG_DIR "$APP_LOG_DIR_DEFAULT"

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

if [[ "$APP_BASE_DIR" != "$ROOT_DIR" ]]; then
  mkdir -p "$APP_ROOT_DIR"
  ln -sfn "$ROOT_DIR" "$APP_BASE_DIR"
  echo "[release] updated current symlink to $ROOT_DIR"
fi

mkdir -p "$APP_LOG_DIR"

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

if [[ "$APP_BASE_DIR" != "$ROOT_DIR" ]]; then
  echo "[release] recreating pm2 processes against $APP_BASE_DIR"
  pm2 delete "${PM2_APP_NAMES[@]}" || true
  pm2 start "$ROOT_DIR/ecosystem.config.cjs" --env production --update-env
else
  echo "[release] reloading pm2 processes"
  pm2 startOrReload "$ROOT_DIR/ecosystem.config.cjs" --env production --update-env
fi

pm2 save

echo "[release] running smoke checks"
node scripts/smoke-check.mjs

echo "[release] completed"
