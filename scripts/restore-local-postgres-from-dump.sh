#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CONTAINER_NAME="${CONTAINER_NAME:-huelegood-postgres}"
DB_NAME="${RESTORE_DATABASE_NAME:-huelegood}"
DB_USER="${RESTORE_DATABASE_USER:-postgres}"
DB_PASSWORD="${RESTORE_DATABASE_PASSWORD:-postgres}"
POSTGRES_SERVICE_DB="${POSTGRES_SERVICE_DB:-postgres}"

dump_file="${1:-${DUMP_FILE:-}}"

usage() {
  cat >&2 <<EOF
Uso:
  npm run db:restore:local -- /ruta/al/postgres.dump

Variables opcionales:
  CONTAINER_NAME             contenedor Postgres local (default: ${CONTAINER_NAME})
  RESTORE_DATABASE_NAME      nombre de la base destino (default: ${DB_NAME})
  RESTORE_DATABASE_USER      usuario Postgres (default: ${DB_USER})
  RESTORE_DATABASE_PASSWORD  password Postgres (default: ${DB_PASSWORD})
  DUMP_FILE                  alternativa a pasar el dump como primer argumento
EOF
}

if [[ -z "${dump_file}" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$dump_file" ]]; then
  echo "[restore] dump not found: $dump_file" >&2
  exit 1
fi

if [[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || echo false)" != "true" ]]; then
  echo "[restore] container not running: $CONTAINER_NAME" >&2
  echo "[restore] start the local stack first with: npm run docker:up" >&2
  exit 1
fi

terminate_connections_sql="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

restore_via_host_port() {
  local host_port="$1"

  if ! command -v dropdb >/dev/null 2>&1 || ! command -v createdb >/dev/null 2>&1 || ! command -v pg_restore >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
    return 1
  fi

  echo "[restore] using host port ${host_port}"
  PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -p "$host_port" -U "$DB_USER" -d "$POSTGRES_SERVICE_DB" -v ON_ERROR_STOP=1 -c "$terminate_connections_sql"
  PGPASSWORD="$DB_PASSWORD" dropdb -h 127.0.0.1 -p "$host_port" -U "$DB_USER" --if-exists "$DB_NAME"
  PGPASSWORD="$DB_PASSWORD" createdb -h 127.0.0.1 -p "$host_port" -U "$DB_USER" "$DB_NAME"
  PGPASSWORD="$DB_PASSWORD" pg_restore -h 127.0.0.1 -p "$host_port" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner --no-privileges --verbose "$dump_file"
}

restore_via_docker_exec() {
  echo "[restore] using docker exec against ${CONTAINER_NAME}"
  docker exec \
    -e PGPASSWORD="$DB_PASSWORD" \
    -e DB_NAME="$DB_NAME" \
    -e POSTGRES_SERVICE_DB="$POSTGRES_SERVICE_DB" \
    -i "$CONTAINER_NAME" \
    sh -lc "
      set -e
      psql -U \"$DB_USER\" -d \"$POSTGRES_SERVICE_DB\" -v ON_ERROR_STOP=1 -c \"$terminate_connections_sql\"
      dropdb -U \"$DB_USER\" --if-exists \"$DB_NAME\"
      createdb -U \"$DB_USER\" \"$DB_NAME\"
      pg_restore -U \"$DB_USER\" -d \"$DB_NAME\" --clean --if-exists --no-owner --no-privileges --verbose
    " < "$dump_file"
}

host_port="$(docker port "$CONTAINER_NAME" 5432/tcp 2>/dev/null | head -n1 | sed -E 's/.*:([0-9]+)$/\1/' || true)"
local_pg_restore_major="$(pg_restore --version 2>/dev/null | awk '{print $3}' | cut -d. -f1 || true)"
container_pg_restore_major="$(docker exec "$CONTAINER_NAME" pg_restore --version 2>/dev/null | awk '{print $3}' | cut -d. -f1 || true)"

if [[ -n "${host_port}" && -n "${local_pg_restore_major}" && -n "${container_pg_restore_major}" && "${local_pg_restore_major}" == "${container_pg_restore_major}" ]]; then
  if restore_via_host_port "$host_port"; then
    echo "[restore] completed successfully"
    exit 0
  fi

  echo "[restore] host-port restore failed, falling back to docker exec" >&2
else
  if [[ -n "${host_port}" ]]; then
    echo "[restore] skipping host-port restore because local pg_restore ${local_pg_restore_major:-unknown} does not match container ${container_pg_restore_major:-unknown}" >&2
  else
    echo "[restore] no host port detected, using docker exec" >&2
  fi
fi

restore_via_docker_exec
echo "[restore] completed successfully"
