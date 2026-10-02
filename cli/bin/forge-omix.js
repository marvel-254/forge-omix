#!/usr/bin/env node
/**
 * forge-omix CLI — provision a local forge-omix deployment via Docker.
 *
 *   npx forge-omix        # install docker if needed, pull image, run
 *   forge-omix stop       # docker compose down
 *   forge-omix logs       # tail container logs
 *   forge-omix update     # pull latest image and restart
 *
 * Env/flags: FORGE_PORT (default 8080), FORGE_MODE (cloud|mock|local|auto),
 * --no-docker-install to skip the docker install attempt.
 */
const { spawnSync, execSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const INSTALL_SH_URL = 'https://raw.githubusercontent.com/marvel-254/forge-omix/main/install.sh'
const args = process.argv.slice(2)
const command = args.find((a) => !a.startsWith('--')) ?? 'start'
const noDockerInstall = args.includes('--no-docker-install')

function sh(cmd, env = {}) {
  const res = spawnSync('sh', ['-c', cmd], { stdio: 'inherit', env: { ...process.env, ...env } })
  return res.status === 0
}

function have(cmd) {
  return spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0
}

function dockerOk() {
  return have('docker') && (spawnSync('sh', ['-c', 'docker info'], { stdio: 'ignore' }).status === 0 ||
    spawnSync('sh', ['-c', 'sudo -n docker info'], { stdio: 'ignore' }).status === 0)
}

function ensureDocker() {
  if (dockerOk()) return true
  if (noDockerInstall) return false
  if (os.platform() === 'linux') {
    console.log('[forge-omix] Docker not found — installing via get.docker.com (sudo may be required)…')
    if (sh('curl -fsSL https://get.docker.com | sh')) return dockerOk()
  }
  console.error('[forge-omix] Docker is required. Install it from https://docs.docker.com/get-docker/ and re-run.')
  return false
}

function ensureImage() {
  const has = spawnSync('sh', ['-c', 'docker image inspect ghcr.io/marvel-254/forge-omix:latest'], { stdio: 'ignore' })
  if (has.status !== 0) {
    console.log('[forge-omix] Pulling image ghcr.io/marvel-254/forge-omix:latest…')
    sh('docker pull ghcr.io/marvel-254/forge-omix:latest')
  }
}

function runInstall() {
  const tmp = path.join(os.tmpdir(), 'forge-omix-install.sh')
  console.log('[forge-omix] Fetching installer…')
  if (!sh(`curl -fsSL ${INSTALL_SH_URL} -o ${tmp}`)) {
    console.error('[forge-omix] Could not download installer from GitHub')
    process.exit(1)
  }
  const env = { FORGE_PORT: process.env.FORGE_PORT ?? '', FORGE_MODE: process.env.FORGE_MODE ?? '' }
  const res = spawnSync('sh', [tmp], { stdio: 'inherit', env: { ...process.env, FORGE_PORT: env.FORGE_PORT || '8080', FORGE_MODE: env.FORGE_MODE || 'cloud' } })
  process.exit(res.status ?? 1)
}

const DOCKER = spawnSync('sh', ['-c', 'docker info >/dev/null 2>&1 || echo sudo'], { encoding: 'utf8' }).stdout.trim()
const BASE = process.env.FORGE_HOME || path.join(os.homedir(), '.forge-omix')
const COMPOSE = path.join(BASE, 'docker-compose.yml')

if (command === 'stop') {
  process.exit(spawnSync('sh', ['-c', `${DOCKER} docker compose -f ${COMPOSE} down`], { stdio: 'inherit' }).status ?? 1)
}
if (command === 'logs') {
  process.exit(spawnSync('sh', ['-c', `${DOCKER} docker compose -f ${COMPOSE} logs -f`], { stdio: 'inherit' }).status ?? 1)
}
if (command === 'update') {
  sh(`${DOCKER} docker pull ghcr.io/marvel-254/forge-omix:latest`)
  process.exit(spawnSync('sh', ['-c', `${DOCKER} docker compose -f ${COMPOSE} up -d`], { stdio: 'inherit' }).status ?? 1)
}
// default: start
if (!ensureDocker()) process.exit(1)
ensureImage()
runInstall()
