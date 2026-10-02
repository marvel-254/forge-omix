/**
 * Emit a sample generated site to disk (utility / smoke test).
 *
 *   pnpm tsx scripts/generate-sample.ts /tmp/omix-sample-site
 *
 * Then `cd` into the target and run `pnpm install && pnpm build` to prove the
 * generated site builds with Vite.
 */
import { generateProject } from '../src/lib/codegen'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Project } from '../src/server/types/schema'

const sample = {
  name: 'Smoke Landing',
  pages: [
    {
      id: 'home',
      path: '/',
      title: 'Home',
      components: [{ id: 'hero', type: 'section', props: { text: 'Your site, generated' } }],
    },
    { id: 'about', path: '/about', title: 'About', components: [] },
  ],
  designTokens: { colors: { primary: '#4f46e5' } },
} as unknown as Project

const out = process.argv[2] ?? '/tmp/omix-sample-site'
await rm(out, { recursive: true, force: true })
const files = generateProject(sample)
for (const f of files) {
  await mkdir(dirname(join(out, f.path)), { recursive: true })
  await writeFile(join(out, f.path), f.content)
}
console.log(`Emitted ${files.length} files to ${out}`)
console.log(files.map((f) => f.path).join('\n'))
