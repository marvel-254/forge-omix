#!/usr/bin/env bash
# Start API + Vite dev servers detached for browser dogfooding.
# pkill patterns must match the real process cmdlines (pnpm exec rewrites
# argv, so "tsx src/server/..." only matches the wrapper, leaving the actual
# node child alive — and its rm'd DB file then vanishes under it).
pkill -f "src/server/index[.]ts" 2>/dev/null
pkill -f "vite/bin/vite[.]js" 2>/dev/null
pkill -f "vite --port 300" 2>/dev/null
sleep 2
rm -f /tmp/dogfood.db*
setsid nohup env DATABASE_URL=file:/tmp/dogfood.db PORT=3001 pnpm exec tsx src/server/index.ts >/tmp/dogfood-api.log 2>&1 </dev/null &
setsid nohup pnpm exec vite --port 3000 --strictPort >/tmp/dogfood-vite.log 2>&1 </dev/null &
sleep 9
echo "api: $(curl -s --max-time 5 http://localhost:3001/health)"
echo "vite: $(curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://localhost:3000/)"
