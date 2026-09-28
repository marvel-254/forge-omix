import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { simpleGit } from 'simple-git'
import {
  changedSince,
  checkoutBranch,
  commitAll,
  diffFile,
  GitError,
  initWorkspace,
  listBranches,
  pullWorkspace,
  pushWorkspace,
  recentCommits,
  resolveWorkspace,
  workspaceStatus,
} from '@server/services/gitService'

/**
 * Phase 10 git service tests — real git binary in temp workspaces
 * (GIT_WORKSPACES is scoped per file so parallel suites can't collide).
 */

let root = ''

async function write(dir: string, name: string, content: string): Promise<void> {
  await writeFile(join(await resolveWorkspace(dir), name), content)
}

describe('gitService sandbox', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-git-'))
    process.env.GIT_WORKSPACES = root
  })

  afterAll(async () => {
    delete process.env.GIT_WORKSPACES
    await rm(root, { recursive: true, force: true })
  })

  it('rejects workspace escapes', async () => {
    await expect(resolveWorkspace('..')).rejects.toMatchObject({ code: 'OUTSIDE_WORKSPACE' })
    await expect(resolveWorkspace('../..')).rejects.toMatchObject({ code: 'OUTSIDE_WORKSPACE' })
    await expect(diffFile('proj1', '../../etc/passwd')).rejects.toMatchObject({
      code: 'OUTSIDE_WORKSPACE',
    })
  })

  it('rejects non-repos and bad input', async () => {
    await expect(workspaceStatus('missing')).rejects.toMatchObject({ code: 'NOT_A_REPO' })
    await expect(commitAll('missing', 'x')).rejects.toMatchObject({ code: 'NOT_A_REPO' })
    await expect(checkoutBranch('missing', 'main')).rejects.toMatchObject({ code: 'NOT_A_REPO' })
    await initWorkspace('proj1')
    await expect(commitAll('proj1', '   ')).rejects.toThrow('must not be empty')
    await expect(checkoutBranch('proj1', 'bad;branch')).rejects.toThrow('Invalid branch name')
  })
})

describe('gitService workflows', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-git-flow-'))
    process.env.GIT_WORKSPACES = root
  })

  afterAll(async () => {
    delete process.env.GIT_WORKSPACES
    await rm(root, { recursive: true, force: true })
  })

  it('inits, tracks, commits, and reports clean status', async () => {
    const first = await initWorkspace('app')
    expect(first.initialized).toBe(true)
    expect((await initWorkspace('app')).initialized).toBe(false)

    await write('app', 'README.md', '# App\n')
    const dirty = await workspaceStatus('app')
    expect(dirty.untracked).toContain('README.md')
    expect(dirty.clean).toBe(false)

    const commit = await commitAll('app', 'feat: initial commit')
    expect(commit.commit).toMatch(/^[0-9a-f]{4,}$/)
    const clean = await workspaceStatus('app')
    expect(clean.clean).toBe(true)
    expect(clean.branch).toBe('main')
  })

  it('diffs untracked files in repos without any commit', async () => {
    await initWorkspace('fresh')
    await write('fresh', 'NOTE.md', 'brand new\n')
    const diff = await diffFile('fresh', 'NOTE.md')
    expect(diff).toContain('brand new')
  })

  it('logs, branches, and diffs', async () => {
    await write('app', 'README.md', '# App\n\nMore.\n')
    await commitAll('app', 'docs: expand readme')
    const log = await recentCommits('app', 5)
    expect(log.length).toBe(2)
    expect(log[0].message).toBe('docs: expand readme')

    await checkoutBranch('app', 'feature/x', true)
    const branches = await listBranches('app')
    expect(branches.current).toBe('feature/x')
    expect(branches.all).toContain('feature/x')
    await checkoutBranch('app', 'main')
    expect((await listBranches('app')).current).toBe('main')

    await write('app', 'NEW.md', 'hello\n')
    const diff = await diffFile('app', 'NEW.md')
    expect(diff).toContain('hello')
  })

  it('detects files changed since a ref', async () => {
    const log = await recentCommits('app', 10)
    const base = log[log.length - 1].hash
    await write('app', 'CHANGED.md', 'v1\n')
    await commitAll('app', 'feat: add changed file')
    expect(await changedSince('app', base)).toContain('CHANGED.md')
    expect(await changedSince('app', 'HEAD')).toEqual([])
    await expect(changedSince('app', 'bad ref;')).rejects.toThrow('Invalid ref')
  })

  it('pushes to and pulls from a local bare remote', async () => {
    const bare = join(root, 'remote.git')
    const git = simpleGit(root)
    await git.raw(['init', '--bare', bare])

    const remote = simpleGit(await resolveWorkspace('app'))
    await remote.addRemote('origin', bare)
    const pushed = await pushWorkspace('app', 'origin', 'main')
    expect(typeof pushed).toBe('string')

    // Advance the remote from a second clone, then pull it back.
    const cloneDir = join(root, 'clone')
    await simpleGit(root).clone(bare, cloneDir)
    const clone = simpleGit(cloneDir)
    await clone.checkout('main')
    await writeFile(join(cloneDir, 'REMOTE.md'), 'from remote\n')
    await clone.add('.')
    await clone.commit('feat: remote change', undefined, {
      '--author': 'tester <tester@localhost>',
    })
    await clone.push('origin', 'main')

    const pulled = await pullWorkspace('app', 'origin', 'main')
    expect(typeof pulled).toBe('string')
    const status = await workspaceStatus('app')
    expect(status.clean).toBe(true)
  })
})
