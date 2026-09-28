#!/bin/sh
# backup.sh — snapshot the forge-data volume (docs/10 §10.5).
# Usage: ./scripts/backup.sh [/backups]
# Keeps the 7 most recent backups.
set -eu

BACKUP_ROOT="${1:-/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
DEST="$BACKUP_ROOT/$STAMP"
mkdir -p "$DEST"

docker compose stop forge 2>/dev/null || docker stop forge-omix 2>/dev/null || true

docker run --rm \
  -v forge-data:/data:ro \
  -v "$DEST":/backup \
  alpine tar czf "/backup/forge-data.tar.gz" -C /data .

docker compose start forge 2>/dev/null || docker start forge-omix 2>/dev/null || true

ls -1t "$BACKUP_ROOT" 2>/dev/null | tail -n +8 | while IFS= read -r old; do
  rm -rf "$BACKUP_ROOT/$old"
done

echo "Backup complete: $DEST/forge-data.tar.gz"
