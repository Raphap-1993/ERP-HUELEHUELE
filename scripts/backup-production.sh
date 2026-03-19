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

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for backup" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required for backup" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DIR="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$TARGET_DIR"

echo "[backup] dumping postgres"
pg_dump "$DATABASE_URL" --format=custom --file="$TARGET_DIR/postgres.dump"

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
