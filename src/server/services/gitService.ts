import { simpleGit } from 'simple-git'
import { execFile } from 'node:child_process'
import { mkdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'

/**
 * Git workspace service (Phase 10 roadmap objectives, docs/08 §8.4 sync).
 * simple-git wrapper scoped to a workspace root (defaults to
 * `./data/workspaces`, overridable via `GIT_WORKSPACES`): every operation
 * resolves inside the root and rejects path escapes. Used for generated /
 * agent project directories — never the builder repo itself.
 */

export class GitError extends Error {
  readonly code: 'NOT_A_REPO' | 'OUTSIDE_WORKSPACE' | 'GIT_ERROR'
  constructor(message: string, code: GitError['code'] = 'GIT_ERROR') {
    super(message)
    this.name = 'GitError'
    this.code = code
  }
}

export interface GitAuthor {
  name: string
  email: string
}

export const DEFAULT_AUTHOR: GitAuthor = {
  name: 'forge-omix',
  email: 'forge-omix@localhost',
}

function workspaceRoot(): string {
  return path.resolve(process.env.GIT_WORKSPACES ?? './data/workspaces')
}

/**
 * Resolve a workspace-relative dir to an absolute path inside the root.
 * Rejects `..` escapes (lexically for not-yet-existing dirs, via realpath
 * for existing ones so symlinks can't break out either).
 */
export async function resolveWorkspace(dir: string): Promise<string> {
  const root = workspaceRoot()
  await mkdir(root, { recursive: true })
  const realRoot = await realpath(root)
  const candidate = path.resolve(realRoot, dir)
  let real = candidate
  try {
    real = await realpath(candidate)
  } catch {
    // Not yet existing (init flow) — fall back to the lexical path.
  }
  if (real !== realRoot && !real.startsWith(realRoot + path.sep)) {
    throw new GitError(`Workspace path escapes the git root: ${dir}`, 'OUTSIDE_WORKSPACE')
  }
  return candidate
}

async function gitFor(dir: string) {
  const cwd = await resolveWorkspace(dir)
  try {
    await stat(cwd)
  } catch {
    throw new GitError(`Not a git repository: ${dir}`, 'NOT_A_REPO')
  }
  let git: ReturnType<typeof simpleGit>
  try {
    git = simpleGit(cwd)
  } catch (error) {
    throw new GitError(`Not a git repository: ${dir} (${gitMessage(error)})`, 'NOT_A_REPO')
  }
  if (!(await git.checkIsRepo())) {
    throw new GitError(`Not a git repository: ${dir}`, 'NOT_A_REPO')
  }
  return git
}

function gitMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  // Keep the last meaningful line (simple-git prefixes with "fatal:" etc).
  const lines = message.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines[lines.length - 1] ?? message
}

export interface WorkspaceStatus {
  isRepo: boolean
  branch: string
  ahead: number
  behind: number
  staged: string[]
  modified: string[]
  untracked: string[]
  clean: boolean
}

export async function initWorkspace(dir: string): Promise<{ path: string; initialized: boolean }> {
  const cwd = await resolveWorkspace(dir)
  await mkdir(cwd, { recursive: true })
  const git = simpleGit(cwd)
  if (await git.checkIsRepo()) {
    return { path: cwd, initialized: false }
  }
  try {
    await git.init(['--initial-branch=main'])
  } catch (error) {
    throw new GitError(`git init failed: ${gitMessage(error)}`)
  }
  return { path: cwd, initialized: true }
}

export async function workspaceStatus(dir: string): Promise<WorkspaceStatus> {
  const git = await gitFor(dir)
  try {
    const status = await git.status()
    return {
      isRepo: true,
      branch: status.current ?? '',
      ahead: status.ahead,
      behind: status.behind,
      staged: [...status.staged],
      modified: [...status.modified],
      untracked: [...status.not_added],
      clean: status.isClean(),
    }
  } catch (error) {
    throw new GitError(`git status failed: ${gitMessage(error)}`)
  }
}

export async function commitAll(
  dir: string,
  message: string,
  author: GitAuthor = DEFAULT_AUTHOR
): Promise<{ commit: string; changes: number }> {
  if (!message.trim()) {
    throw new GitError('Commit message must not be empty')
  }
  const git = await gitFor(dir)
  try {
    await git.add('.')
    const summary = await git.commit(message.trim(), undefined, {
      '--author': `${author.name} <${author.email}>`,
    })
    return { commit: summary.commit, changes: summary.summary.changes ?? 0 }
  } catch (error) {
    throw new GitError(`git commit failed: ${gitMessage(error)}`)
  }
}

export async function listBranches(dir: string): Promise<{ current: string; all: string[] }> {
  const git = await gitFor(dir)
  try {
    const branches = await git.branch()
    return { current: branches.current, all: branches.all }
  } catch (error) {
    throw new GitError(`git branch failed: ${gitMessage(error)}`)
  }
}

export async function checkoutBranch(
  dir: string,
  branch: string,
  create = false
): Promise<{ current: string }> {
  if (!/^[A-Za-z0-9._/-]+$/.test(branch)) {
    throw new GitError(`Invalid branch name: ${branch}`)
  }
  const git = await gitFor(dir)
  try {
    if (create) {
      await git.checkout(['-b', branch])
    } else {
      await git.checkout(branch)
    }
    return { current: branch }
  } catch (error) {
    throw new GitError(`git checkout failed: ${gitMessage(error)}`)
  }
}

export interface LogEntry {
  hash: string
  message: string
  author: string
  date: string
}

export async function recentCommits(dir: string, maxCount = 10): Promise<LogEntry[]> {
  const git = await gitFor(dir)
  try {
    const log = await git.log({ maxCount: Math.max(1, Math.min(maxCount, 50)) })
    return log.all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      author: entry.author_name,
      date: entry.date,
    }))
  } catch (error) {
    throw new GitError(`git log failed: ${gitMessage(error)}`)
  }
}

/** Unified diff of one tracked file (working tree + staged, i.e. `git diff HEAD`). */
export async function diffFile(dir: string, file: string): Promise<string> {
  if (file.includes('\0')) {
    throw new GitError(`Invalid file path: ${file}`)
  }
  const cwd = await resolveWorkspace(dir)
  const abs = path.resolve(cwd, file)
  let real = abs
  try {
    real = await realpath(abs)
  } catch {
    // Untracked/new file — keep the lexical path for the containment check.
  }
  if (real !== cwd && !real.startsWith(cwd + path.sep)) {
    throw new GitError(`File escapes the workspace: ${file}`, 'OUTSIDE_WORKSPACE')
  }
  const git = simpleGit(cwd)
  if (!(await git.checkIsRepo())) {
    throw new GitError(`Not a git repository: ${dir}`, 'NOT_A_REPO')
  }
  // Raw git runs that keep stdout regardless of exit code
  // (`git diff --no-index` exits 1 on differences by design).
  const run = (args: string[]): Promise<{ code: number | null; stdout: string }> =>
    new Promise((resolve) => {
      execFile(
        'git',
        args,
        { cwd, maxBuffer: 4 * 1024 * 1024 },
        (error, stdout) =>
          resolve({
            code: (error as { code?: number | null } | null)?.code ?? 0,
            stdout: String(stdout),
          })
      )
    })
  // Fresh repos have no HEAD at all — everything on disk is new.
  const hasHead = (await run(['rev-parse', '--verify', 'HEAD'])).code === 0
  if (!hasHead) {
    return (await run(['diff', '--no-index', '--', '/dev/null', file])).stdout
  }
  let staged: string
  try {
    staged = await git.diff(['HEAD', '--', file])
  } catch (error) {
    throw new GitError(`git diff failed: ${gitMessage(error)}`)
  }
  if (staged.trim()) return staged
  // Tracked-but-unchanged files have an empty diff; only untracked files
  // fall back to a /dev/null diff.
  const tracked = await run(['ls-files', '--error-unmatch', '--', file])
  if (tracked.code === 0) return ''
  return (await run(['diff', '--no-index', '--', '/dev/null', file])).stdout
}

/**
 * Files changed between a ref (e.g. the recorded export commit) and HEAD —
 * the detection half of bidirectional sync (docs/08 §8.4 step 4). Semantic
 * reverse-import into the canvas is a later step.
 */
export async function changedSince(dir: string, ref: string): Promise<string[]> {
  if (!/^[A-Za-z0-9._/^-]+$/.test(ref)) {
    throw new GitError(`Invalid ref: ${ref}`)
  }
  const git = await gitFor(dir)
  try {
    const out = await git.raw(['diff', '--name-only', `${ref}..HEAD`])
    return out.split('\n').map((l) => l.trim()).filter(Boolean)
  } catch (error) {
    throw new GitError(`git diff failed: ${gitMessage(error)}`)
  }
}

export async function pushWorkspace(
  dir: string,
  remote = 'origin',
  branch?: string
): Promise<string> {
  const git = await gitFor(dir)
  try {
    const current = branch ?? (await git.branch()).current
    const result = await git.push(remote, current)
    return result.pushed?.map((p) => `${p.branch}`).join(', ') ?? 'pushed'
  } catch (error) {
    throw new GitError(`git push failed: ${gitMessage(error)}`)
  }
}

export async function pullWorkspace(
  dir: string,
  remote = 'origin',
  branch?: string
): Promise<string> {
  const git = await gitFor(dir)
  try {
    const current = branch ?? (await git.branch()).current
    const result = await git.pull(remote, current)
    return result.summary.changes > 0 ? `${result.summary.changes} changed` : 'up to date'
  } catch (error) {
    throw new GitError(`git pull failed: ${gitMessage(error)}`)
  }
}
