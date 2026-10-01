#!/usr/bin/env sh
#
# forge-omix — one-command installer.
#
# Pulls the pre-built image from GitHub Container Registry and provisions a
# persistent local deployment with Docker. Works on Linux (x86_64/arm64) and
# macOS (arm64/x86_64) with a recent Docker + Docker Compose install.
#
#   curl -fsSL https://raw.githubusercontent.com/marvel-254/forge-omix/main/install.sh | sh
#
# Options (prefix the command):  FORGE_PORT=8081 FORGE_MODE=mock sh -c "$(curl ...)"
#
set -eu

# ---- tunables ---------------------------------------------------------------
IMAGE="${FORGE_IMAGE:-ghcr.io/marvel-254/forge-omix:latest}"
PORT="${FORGE_PORT:-8080}"
MODE="${FORGE_MODE:-cloud}"                 # cloud | mock | local | auto
BASE_DIR="${FORGE_HOME:-$HOME/.forge-omix}"
DATA_DIR="$BASE_DIR/data"
ENV_FILE="$BASE_DIR/.env"
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"
CONTAINER="forge-omix"

# ---- helpers ----------------------------------------------------------------
info()  { printf '\033[1;36m[forge-omix]\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m[forge-omix]\033[0m %s\n' "$*"; }
die()   { printf '\033[1;31m[forge-omix ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# ---- preflight --------------------------------------------------------------
info "forge-omix installer"
command_exists docker || die "Docker is required but was not found. Install Docker and re-run."
docker compose version >/dev/null 2>&1 || \
  command_exists docker-compose || die "Docker Compose is required (docker compose plugin or docker-compose)."

# low-priv Linux usable? warn if docker needs sudo
if [ "$(id -u)" != "0" ] && ! docker info >/dev/null 2>&1; then
  warn "Docker daemon not reachable; trying with sudo."
  DOCKER="sudo docker"
  COMPOSE="sudo docker compose"
else
  DOCKER="docker"
  COMPOSE="docker compose"
fi

# ---- directories ------------------------------------------------------------
mkdir -p "$DATA_DIR" "$BASE_DIR"

# ---- .env -------------------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
  info "Reusing existing $ENV_FILE"
else
  info "Writing $ENV_FILE"
  cat > "$ENV_FILE" <<EOF
# forge-omix environment
# AI providers are all key-based and optional. Add the keys you use, then
#   docker compose -f $COMPOSE_FILE up -d
PORT=3001
NODE_ENV=production
DATABASE_URL=file:/data/forge.db
GIT_WORKSPACES=/data/workspaces
AI_MODE=$MODE
AI_PROVIDER_ORDER=
OLLAMA_ENABLED=false
OLLAMA_BASE_URL=
OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
OPENROUTER_BASE_URL=
OPENAI_API_KEY=${OPENAI_API_KEY:-}
OPENAI_BASE_URL=
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
ANTHROPIC_BASE_URL=
GROQ_API_KEY=${GROQ_API_KEY:-}
GROQ_BASE_URL=
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-}
DEEPSEEK_BASE_URL=
MISTRAL_API_KEY=${MISTRAL_API_KEY:-}
MISTRAL_BASE_URL=
OPENAI_COMPAT_BASE_URL=
OPENAI_COMPAT_API_KEY=
EOF
  info "AI_MODE=$MODE (edit $ENV_FILE to add provider keys and switch modes)"
fi

# ---- compose file -----------------------------------------------------------
info "Writing $COMPOSE_FILE"
cat > "$COMPOSE_FILE" <<EOF
services:
  forge:
    image: $IMAGE
    container_name: $CONTAINER
    restart: unless-stopped
    ports:
      - "$PORT:8080"
    volumes:
      - forge-data:/data
    env_file:
      - $ENV_FILE
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:8080/health').then((r) => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"]
      interval: 30s
      timeout: 5s
      start_period: 15s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  forge-data:
EOF

# ---- pull + run -------------------------------------------------------------
info "Pulling $IMAGE"
$DOCKER pull "$IMAGE"

info "Starting forge-omix (port $PORT)"
cd "$BASE_DIR"
$COMPOSE up -d

# ---- done -------------------------------------------------------------------
info "forge-omix is running."
info "  UI:      http://localhost:$PORT"
info "  Data:    $DATA_DIR"
info "  Compose: $COMPOSE_FILE"
info "  Logs:    docker compose -f $COMPOSE_FILE logs -f"
info "  Update:  re-run this installer to pull the latest image"
