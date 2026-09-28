#!/bin/sh
# restore.sh — restore the forge-data volume from a backup (docs/10 §10.5).
# Usage: ./scripts/restore.sh /path/to/forge-data.tar.gz
set -eu

BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh /path/to/forge-data.tar.gz" >&2
  exit 1
fi
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

BACKUP_DIR="$(dirname "$BACKUP_FILE")"
BACKUP_BASE="$(basename "$BACKUP_FILE")"

docker compose stop forge 2>/dev/null || docker stop forge-omix 2>/dev/null || true

docker run --rm \
  -v forge-data:/data \
  -v "$BACKUP_DIR":/backup:ro \
  alpine sh -c "rm -rf /data/*; tar xzf /backup/$BACKUP_BASE -C /data"

docker compose start forge 2>/dev/null || docker start forge-omix 2>/dev/null || true

echo "Restore complete from $BACKUP_FILE"
