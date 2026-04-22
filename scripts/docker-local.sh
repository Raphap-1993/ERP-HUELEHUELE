#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.local.yml"
ENV_FILE="$ROOT_DIR/.env"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-erp-huelehuele}"
ACTION="${1:-up}"

if [[ $# -gt 0 ]]; then
  shift
fi

COMPOSE_CMD=()
COMPOSE_ENV_ARGS=()

resolve_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=("docker" "compose")
    return 0
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=("docker-compose")
    return 0
  fi

  cat >&2 <<'EOF'
[docker] No encontramos 'docker compose' ni 'docker-compose'.
[docker] Instala Docker antes de usar los servicios locales del repo.
EOF
  exit 1
}

print_daemon_help() {
  local current_context
  current_context="$(docker context show 2>/dev/null || printf 'unknown')"

  cat >&2 <<EOF
[docker] No hay un daemon Docker disponible para el contexto '${current_context}'.
[docker] Flujo soportado por el repo:
  1. deja operativo tu runtime Docker
  2. ejecuta npm run docker:up
EOF

  if [[ "$current_context" == "colima" ]]; then
    cat >&2 <<'EOF'
[docker] El contexto activo es Colima. Si ese es tu runtime, primero debería responder:
  colima start
EOF
  fi

  if [[ "$(uname -m)" == "arm64" ]] && command -v colima >/dev/null 2>&1 && command -v limactl >/dev/null 2>&1; then
    local colima_file
    local limactl_file

    colima_file="$(file -L "$(command -v colima)" 2>/dev/null || true)"
    limactl_file="$(file -L "$(command -v limactl)" 2>/dev/null || true)"

    if printf '%s\n%s\n' "$colima_file" "$limactl_file" | grep -q "x86_64"; then
      cat >&2 <<'EOF'
[docker] Detectamos Colima/Lima instalados como binarios x86_64 en una sesión arm64.
[docker] Esa combinación falla antes de arrancar los contenedores.
[docker] Reinstálalos nativos en arm64 o usa Docker Desktop y vuelve a correr:
  npm run docker:up
EOF
    fi
  fi
}

ensure_daemon() {
  if docker ps >/dev/null 2>&1; then
    return 0
  fi

  print_daemon_help
  exit 1
}

run_compose() {
  if [[ ${#COMPOSE_ENV_ARGS[@]} -gt 0 ]]; then
    "${COMPOSE_CMD[@]}" "${COMPOSE_ENV_ARGS[@]}" -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
    return 0
  fi

  "${COMPOSE_CMD[@]}" -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
}

resolve_compose_cmd

if [[ -f "$ENV_FILE" ]]; then
  COMPOSE_ENV_ARGS=(--env-file "$ENV_FILE")
fi

case "$ACTION" in
  up)
    ensure_daemon
    run_compose up -d --remove-orphans "$@"
    ;;
  down)
    ensure_daemon
    run_compose down "$@"
    ;;
  ps)
    ensure_daemon
    run_compose ps "$@"
    ;;
  logs)
    ensure_daemon
    run_compose logs -f --tail=150 "$@"
    ;;
  config)
    run_compose config "$@"
    ;;
  *)
    cat >&2 <<'EOF'
[docker] Uso: bash scripts/docker-local.sh <up|down|ps|logs|config>
EOF
    exit 1
    ;;
esac
