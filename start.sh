#!/bin/sh
# Start nginx in background
nginx

# Start Hono backend in foreground
cd /app
node dist-server/index.js
