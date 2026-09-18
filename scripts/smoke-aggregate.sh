#!/usr/bin/env bash
# End-to-end smoke test for the aggregate project persistence flow.
# Usage: DATABASE_URL=file:/tmp/forge-smoke.db bash scripts/smoke-aggregate.sh
set -u
PORT="${PORT:-3199}"
B="http://localhost:$PORT"
DB="${DATABASE_URL:-file:/tmp/forge-smoke.db}"

pkill -f "tsx src/server/inde[x]" 2>/dev/null
sleep 0.5
rm -f "${DB#file:}"*

DATABASE_URL="$DB" PORT="$PORT" pnpm exec tsx src/server/index.ts >/tmp/smoke-server.log 2>&1 &
SERVER_PID=$!
sleep 7

echo "--- 1. create project (composite payload):"
curl -s -X POST "$B/api/projects" -H 'Content-Type: application/json' \
  -d '{"id":"proj_smoketest1","name":"Smoke Test","pages":[{"id":"page_home","path":"/","title":"Home","components":[{"id":"comp_btn1","type":"Button","props":{"label":"Hi"}}]},{"id":"page_about","path":"/about","title":"About","components":[]}],"components":[{"id":"comp_lib1","type":"Card","name":"HeroCard","props":{"title":"Hero"}}],"designTokens":{"colors":{"primary":"#3B82F6"}},"settings":{"theme":"dark"}}'
echo

echo "--- 2. reassemble:"
curl -s "$B/api/projects/proj_smoketest1/project"
echo

echo "--- 3. aggregate save (rename + page edit + token change; echoes server timestamps like a client round-trip):"
curl -s -X PUT "$B/api/projects/proj_smoketest1/project" -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test v2","pages":[{"id":"page_home","path":"/","title":"Home","components":[{"id":"comp_btn1","type":"Button","props":{"label":"Changed"}}]}],"designTokens":{"colors":{"primary":"#10B981"}},"createdAt":"2026-01-01T00:00:00.000Z","updatedAt":"2026-01-01T00:00:00.000Z"}'
echo

echo "--- 4. reassemble after save:"
curl -s "$B/api/projects/proj_smoketest1/project"
echo

echo "--- 5. validation still enforced (empty name => 400):"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$B/api/projects" \
  -H 'Content-Type: application/json' -d '{"name":""}'

echo "--- 6. missing project => 404:"
curl -s -o /dev/null -w "%{http_code}\n" "$B/api/projects/proj_missing0/project"

kill "$SERVER_PID" 2>/dev/null
wait "$SERVER_PID" 2>/dev/null
echo "done"
