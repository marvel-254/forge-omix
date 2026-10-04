import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  ACCEPTED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  deleteMedia,
  isSvg,
  mediaTypeFor,
  readMedia,
  sanitizeSvg,
  storeMedia,
} from '@server/services/mediaService'

/**
 * Media storage and upload validation.
 *
 * The sanitizer is the security-relevant part: an uploaded SVG is an XML
 * document that can execute script in our own origin. These tests pin that
 * it cannot, and that the filesystem path is never taken from the client.
 */

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'forge-media-test-'))
  process.env.MEDIA_DIR = dir
})

afterAll(async () => {
  delete process.env.MEDIA_DIR
})

describe('mime allowlist', () => {
  it('accepts the formats the spec lists', () => {
    expect(mediaTypeFor('image/png')).toBe('image')
    expect(mediaTypeFor('image/jpeg')).toBe('image')
    expect(mediaTypeFor('image/webp')).toBe('image')
    expect(mediaTypeFor('image/gif')).toBe('gif')
    expect(mediaTypeFor('image/svg+xml')).toBe('image')
    expect(mediaTypeFor('video/mp4')).toBe('video')
    expect(mediaTypeFor('video/webm')).toBe('video')
  })

  it('rejects anything not on the list', () => {
    for (const mime of ['text/html', 'application/javascript', 'image/x-icon', '']) {
      expect(mediaTypeFor(mime), mime).toBeNull()
    }
  })

  it('never accepts a type that can execute', () => {
    for (const mime of ACCEPTED_MIME_TYPES) {
      expect(mime.startsWith('image/') || mime.startsWith('video/')).toBe(true)
    }
  })
})

describe('sanitizeSvg', () => {
  it('removes script elements and their contents', () => {
    const out = sanitizeSvg('<svg><script>alert(1)</script><rect/></svg>')
    expect(out).not.toContain('script')
    expect(out).not.toContain('alert')
    expect(out).toContain('<rect')
  })

  it('removes self-closing script tags', () => {
    expect(sanitizeSvg('<svg><script src="//evil.com"/></svg>')).not.toContain('script')
  })

  it('strips inline event handlers', () => {
    const out = sanitizeSvg('<svg><rect onload="alert(1)" onclick=\'x()\' width="10"/></svg>')
    expect(out).not.toMatch(/\son[a-z]+\s*=/i)
    expect(out).toContain('width="10"')
  })

  it('strips javascript: and data: urls', () => {
    const out = sanitizeSvg(
      '<svg><a href="javascript:alert(1)"><text>x</text></a><image xlink:href="data:text/html;base64,PHN2Zz4="/></svg>'
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('data:text/html')
  })

  it('removes foreignObject, which can re-enter HTML', () => {
    const out = sanitizeSvg('<svg><foreignObject><body onload="x()"/></foreignObject></svg>')
    expect(out.toLowerCase()).not.toContain('foreignobject')
  })

  it('keeps the drawing content an SVG needs', () => {
    const src =
      '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L10 10" stroke="red" fill="none"/></svg>'
    expect(sanitizeSvg(src)).toBe(src)
  })
})

describe('storeMedia', () => {
  it('rejects an unsupported type', async () => {
    await expect(
      storeMedia({ bytes: new Uint8Array([1]), mimeType: 'text/html', filename: 'a.html' })
    ).rejects.toThrow(/Unsupported media type/)
  })

  it('rejects an empty upload', async () => {
    await expect(
      storeMedia({ bytes: new Uint8Array(), mimeType: 'image/png', filename: 'a.png' })
    ).rejects.toThrow(/Empty upload/)
  })

  it('rejects an oversized upload', async () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1)
    await expect(
      storeMedia({ bytes: big, mimeType: 'image/png', filename: 'a.png' })
    ).rejects.toThrow(/exceeds/)
  })

  it('names the stored file from the mime type, not the client filename', async () => {
    const stored = await storeMedia({
      bytes: new Uint8Array([1, 2, 3, 4]),
      mimeType: 'image/png',
      filename: '../../../etc/passwd.png',
    })
    expect(stored.storedName).toMatch(/^[a-f0-9]{32}\.png$/)
    expect(stored.filename).not.toContain('..')
  })

  it('round-trips the bytes', async () => {
    const bytes = new Uint8Array([9, 8, 7, 6, 5])
    const stored = await storeMedia({ bytes, mimeType: 'image/png', filename: 'a.png' })
    const read = await readMedia(stored.storedName)
    expect(read).not.toBeNull()
    expect([...(read as Buffer)]).toEqual([...bytes])
  })

  it('sanitizes on the way in, so the stored SVG is already clean', async () => {
    const dirty = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect/></svg>'
    const stored = await storeMedia({
      bytes: new TextEncoder().encode(dirty),
      mimeType: 'image/svg+xml',
      filename: 'x.svg',
    })
    const read = (await readMedia(stored.storedName))?.toString('utf8') ?? ''
    expect(read).not.toContain('script')
    expect(read).toContain('<rect')
  })

  it('collapses identical uploads to one stored file', async () => {
    const bytes = new Uint8Array([1, 1, 2, 3])
    const a = await storeMedia({ bytes, mimeType: 'image/png', filename: 'a.png' })
    const b = await storeMedia({ bytes, mimeType: 'image/png', filename: 'b.png' })
    expect(a.storedName).toBe(b.storedName)
  })
})

describe('readMedia path safety', () => {
  it('refuses traversal and anything not matching the generated name shape', async () => {
    for (const bad of [
      '../secret',
      '../../etc/passwd',
      'abc.png',
      'a'.repeat(32) + '/../../etc/passwd',
      '',
    ]) {
      expect(await readMedia(bad), bad).toBeNull()
    }
  })

  it('delete is a no-op for an invalid name', async () => {
    await expect(deleteMedia('../nope')).resolves.toBeUndefined()
  })
})

describe('isSvg', () => {
  it('identifies only the dangerous type', () => {
    expect(isSvg('image/svg+xml')).toBe(true)
    expect(isSvg('image/png')).toBe(false)
  })
})