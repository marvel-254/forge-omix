import JSZip from 'jszip'
import { writeFile, mkdir, rm, readdir, readFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { generateProject, type GeneratedFile } from '../../lib/codegen'
import { bundleMedia } from './mediaExport'
import type { Project } from '../types/schema'

const execFileAsync = promisify(execFile)

/**
 * Deploy-control files appended to every generated site so the exported
 * artifact is deployable as-is on common static hosts.
 */
const DEPLOY_EXTRA: GeneratedFile[] = [
  {
    path: 'vercel.json',
    content:
      JSON.stringify(
        {
          $schema: 'https://openapi.vercel.sh/vercel.json',
          framework: 'vite',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
        },
        null,
        2
      ) + '\n',
  },
  {
    path: 'netlify.toml',
    content: ['[build]', '  command = "npm run build"', '  publish = "dist"', ''].join('\n'),
  },
  {
    path: '.github/workflows/deploy-site.yml',
    content: [
      'name: Deploy Site',
      'on:',
      '  push:',
      '    branches: [main]',
      '  workflow_dispatch:',
      'permissions:',
      '  contents: read',
      '  pages: write',
      '  id-token: write',
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with:',
      '          node-version: 20',
      '      - run: npm install',
      '      - run: npm run build',
      '      - uses: actions/configure-pages@v4',
      '      - uses: actions/upload-pages-artifact@v3',
      '        with:',
      '          path: dist',
      '      - id: deploy',
      '        uses: actions/deploy-pages@v4',
      '',
    ].join('\n'),
  },
]

export interface SiteArchiveResult {
  fileCount: number
  built: boolean
  buildError?: string
  /** All source file paths inside the archive (the deployable artifact). */
  files: string[]
  /** Zip archive (source + optional built `dist/`) as base64 for download. */
  base64: string
}

async function writeTree(root: string, files: GeneratedFile[]) {
  for (const f of files) {
    const target = join(root, f.path)
    await mkdir(dirname(target), { recursive: true })
    if (f.bytes) await writeFile(target, f.bytes)
    else await writeFile(target, f.content ?? '')
  }
}

async function dirExists(p: string) {
  try {
    await readdir(p)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a deployable site archive for a saved project.
 *
 * Always emits a real generated React + Vite source tree plus deploy configs
 * (vercel.json, netlify.toml, a GitHub Pages workflow), zipped for download.
 *
 * With `{ runBuild: true }` it additionally runs `pnpm install` + `pnpm build`
 * in a temp checkout and embeds a production `dist/` in the archive.
 * `node_modules` is never included.
 */
export async function generateSiteArchive(
  payload: unknown,
  opts: { runBuild?: boolean } = {}
): Promise<SiteArchiveResult> {
  // Rewrite uploaded-media URLs to `public/assets/` before codegen runs, so
  // the emitted markup points at the bundled copy rather than this server.
  const bundled = await bundleMedia(payload as Project)
  const files: GeneratedFile[] = [
    ...generateProject(bundled.project),
    ...bundled.files,
    ...DEPLOY_EXTRA,
  ]
  const root = await mkdtemp(join(tmpdir(), 'forge-omix-build-'))
  let built = false
  let buildError: string | undefined

  try {
    await writeTree(root, files)

    if (opts.runBuild) {
      try {
        await execFileAsync('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts'], {
          cwd: root,
          timeout: 240_000,
        })
        await execFileAsync('pnpm', ['build'], { cwd: root, timeout: 240_000 })
        built = true
      } catch (error) {
        buildError = error instanceof Error ? error.message : String(error)
      }
    }

    const zip = new JSZip()
    for (const f of files) zip.file(f.path, f.bytes ?? f.content ?? '')

    const distDir = join(root, 'dist')
    if (built && (await dirExists(distDir))) {
      const addDir = async (dir: string, base = '') => {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name)
          const rel = base ? `${base}/${entry.name}` : entry.name
          if (entry.isDirectory()) await addDir(full, rel)
          else zip.file(rel, await readFile(full))
        }
      }
      await addDir(distDir, 'dist')
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer' })
    return {
      fileCount: files.length,
      built,
      buildError,
      files: files.map((f) => f.path),
      base64: buffer.toString('base64'),
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

/**
 * Whether the runtime can run an inline production build. The prod image ships
 * production-only deps (no Vite), so this is opt-in via FORGE_RUN_BUILD=1.
 */
export function canRunInlineBuild(): boolean {
  return process.env.FORGE_RUN_BUILD === '1'
}
