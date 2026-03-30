#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

env_candidates=(
  ".env.production"
  "../shared/.env.production"
)

for env_file in "${env_candidates[@]}"; do
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    break
  fi
done

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for backup" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required for backup" >&2
  exit 1
fi

pg_dump_url="$DATABASE_URL"
if [[ "$pg_dump_url" == *\?* ]]; then
  base_url="${pg_dump_url%%\?*}"
  query_string="${pg_dump_url#*\?}"
  filtered_query="$(
    printf '%s' "$query_string" \
      | tr '&' '\n' \
      | awk '
        BEGIN { first = 1 }
        $0 !~ /^schema=/ {
          if (!first) {
            printf("&")
          }
          printf("%s", $0)
          first = 0
        }
      '
  )"

  if [[ -n "$filtered_query" ]]; then
    pg_dump_url="${base_url}?${filtered_query}"
  else
    pg_dump_url="$base_url"
  fi
fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DIR="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$TARGET_DIR"

echo "[backup] dumping postgres"
pg_dump "$pg_dump_url" --format=custom --file="$TARGET_DIR/postgres.dump"

for upload_dir in "${UPLOADS_PUBLIC_DIR:-}" "${UPLOADS_PRIVATE_DIR:-}"; do
  if [[ -n "$upload_dir" && -d "$upload_dir" ]]; then
    name="$(basename "$upload_dir")"
    echo "[backup] archiving $upload_dir"
    tar -czf "$TARGET_DIR/$name.tar.gz" -C "$(dirname "$upload_dir")" "$name"
  fi
done

echo "[backup] pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETENTION_DAYS" -exec rm -rf {} +

echo "[backup] completed at $TARGET_DIR"
