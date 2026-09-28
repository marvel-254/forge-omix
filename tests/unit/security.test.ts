import { describe, it, expect } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/**
 * Phase 12 static security guards (docs/11 threat model): no executable-HTML
 * sinks, no dynamic code execution, no committed secrets in shipped code.
 * String literals are stripped first so detection tables (e.g. the AI
 * response validator's blocklist) don't trip the guard.
 */

async function sourceFiles(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') await sourceFiles(full, out)
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

function stripStrings(source: string): string {
  return source
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
}

describe('static security guards', () => {
  it('has no executable-HTML or dynamic-code sinks', async () => {
    const root = resolve('src')
    const violations: string[] = []
    for (const file of await sourceFiles(root)) {
      const code = stripStrings(await readFile(file, 'utf-8'))
      for (const pattern of [
        'dangerouslySetInnerHTML',
        /[^a-zA-Z0-9_$]eval\s*\(/,
        'new Function(',
      ]) {
        const found =
          typeof pattern === 'string' ? code.includes(pattern) : pattern.test(code)
        if (found) violations.push(`${file}: ${String(pattern)}`)
      }
    }
    expect(violations).toEqual([])
  })

  it('has no committed secrets in shipped code', async () => {
    const root = resolve('src')
    const violations: string[] = []
    const secret = /(sk-or-[A-Za-z0-9_-]{8,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/
    for (const file of await sourceFiles(root)) {
      const code = await readFile(file, 'utf-8')
      if (secret.test(code)) violations.push(file)
    }
    expect(violations).toEqual([])
  })
})
