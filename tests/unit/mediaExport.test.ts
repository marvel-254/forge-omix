import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ASSET_DIR,
  assetUrl,
  collectMediaUrls,
  rewriteMediaUrls,
  storedNameOf,
} from '../../src/lib/codegen/mediaAssets'

/**
 * Uploaded media must survive an export: an `/api/media/files/...` URL only
 * resolves against a running server, so a generated site needs the asset
 * bundled under `public/assets/` and referenced by its site-root path.
 */

const PNG = 'c414cd0e204de974f73753c7e28d7638.png'
const MP4 = 'a1b2c3d4e5f60718293a4b5c6d7e8f90.mp4'

describe('media asset URL helpers', () => {
  it('serves public/ from the site root, so the URL drops the public/ prefix', () => {
    expect(assetUrl(`${ASSET_DIR}/${PNG}`)).toBe(`/assets/${PNG}`)
    // An asset outside public/ keeps its full path rather than being guessed at.
    expect(assetUrl('src/logo.png')).toBe('/src/logo.png')
  })

  it('extracts the stored name only from a media URL', () => {
    expect(storedNameOf(`/api/media/files/${PNG}`)).toBe(PNG)
    expect(storedNameOf('/assets/x.png')).toBeNull()
    expect(storedNameOf('https://cdn.example.com/a.png')).toBeNull()
    expect(storedNameOf('')).toBeNull()
  })

  it('finds media URLs nested anywhere in the payload, once each', () => {
    const project = {
      pages: [
        {
          components: [
            { type: 'Media', props: { src: `/api/media/files/${PNG}` } },
            { type: 'Gallery', props: { images: [{ src: `/api/media/files/${PNG}` }, { src: 'https://x/y.png' }] } },
            { type: 'Media', props: { src: `/api/media/files/${MP4}`, videoOptions: { poster: `/api/media/files/${PNG}` } } },
          ],
        },
      ],
    }
    // Deduplicated across src, poster, and gallery entries.
    expect(collectMediaUrls(project)).toEqual([`/api/media/files/${PNG}`, `/api/media/files/${MP4}`])
  })

  it('rewrites every nested occurrence and leaves other URLs alone', () => {
    const project = {
      pages: [
        {
          components: [
            { props: { src: `/api/media/files/${PNG}`, alt: 'keep' } },
            { props: { images: [{ src: `/api/media/files/${MP4}` }, { src: 'https://cdn/x.png' }] } },
          ],
        },
      ],
    }
    const { project: out, resolved } = rewriteMediaUrls(project, (name) => `/assets/${name}`)

    expect(resolved).toEqual([PNG, MP4])
    const json = JSON.stringify(out)
    expect(json).not.toContain('/api/media/files/')
    expect(json).toContain(`/assets/${PNG}`)
    expect(json).toContain('/assets/' + MP4)
    // Non-media URLs and unrelated strings survive.
    expect(json).toContain('https://cdn/x.png')
    expect(json).toContain('keep')
  })

  it('leaves a reference untouched when the resolver declines it', () => {
    // The download path uses this to avoid emitting /assets/<name> for an
    // asset it failed to fetch — that would be a dangling reference.
    const project = { props: { src: `/api/media/files/${PNG}` } }
    const { project: out } = rewriteMediaUrls(project, () => null)
    expect(out.props.src).toBe(`/api/media/files/${PNG}`)
  })

  it('does not mutate the input payload', () => {
    const project = { props: { src: `/api/media/files/${PNG}` } }
    rewriteMediaUrls(project, (name) => `/assets/${name}`)
    expect(project.props.src).toBe(`/api/media/files/${PNG}`)
  })
})

describe('bundleMedia', () => {
  let root: string
  let previousDir: string | undefined

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-media-export-'))
    await mkdir(root, { recursive: true })
    await writeFile(join(root, PNG), Buffer.from('89504e47', 'hex'))
    previousDir = process.env.MEDIA_DIR
    process.env.MEDIA_DIR = root
  })

  afterEach(async () => {
    if (previousDir === undefined) delete process.env.MEDIA_DIR
    else process.env.MEDIA_DIR = previousDir
    await rm(root, { recursive: true, force: true })
  })

  it('bundles asset bytes and rewrites the reference to the site-root path', async () => {
    const { bundleMedia } = await import('../../src/server/services/mediaExport')
    const { project, files } = await bundleMedia({
      pages: [{ components: [{ type: 'Media', props: { src: `/api/media/files/${PNG}` } }] }],
    })

    expect(JSON.stringify(project)).not.toContain('/api/media/files/')
    expect(JSON.stringify(project)).toContain(`/assets/${PNG}`)

    expect(files).toHaveLength(1)
    expect(files[0].path).toBe(`${ASSET_DIR}/${PNG}`)
    expect(Buffer.from(files[0].bytes!).toString('hex')).toBe('89504e47')
  })

  it('keeps the original URL when the asset is gone from disk', async () => {
    const { bundleMedia } = await import('../../src/server/services/mediaExport')
    const missing = 'deadbeefdeadbeefdeadbeefdeadbeef.png'
    const { project, files } = await bundleMedia({ props: { src: `/api/media/files/${missing}` } })

    // No file to bundle, so the reference must not claim otherwise.
    expect(files).toHaveLength(0)
    expect(project.props.src).toBe(`/api/media/files/${missing}`)
  })

  it('bundles a shared asset once even when referenced repeatedly', async () => {
    const { bundleMedia } = await import('../../src/server/services/mediaExport')
    const { files } = await bundleMedia({
      a: { src: `/api/media/files/${PNG}` },
      b: { src: `/api/media/files/${PNG}` },
    })
    expect(files).toHaveLength(1)
  })
})