import type { GeneratedFile } from '../../lib/codegen'
import {
  ASSET_DIR,
  assetUrl,
  collectMediaUrls,
  rewriteMediaUrls,
  storedNameOf,
} from '../../lib/codegen/mediaAssets'
import { readMedia } from './mediaService'

/**
 * Uploaded media in an exported site (docs/17).
 *
 * Rewrites `/api/media/files/<storedName>` URLs to `public/assets/` paths and
 * carries the real bytes into the archive, so the export stands alone on a
 * foreign host. The URL rewriting itself lives in codegen/mediaAssets so the
 * editor's in-browser export can share it; only reading bytes is server-side.
 */

/**
 * Bundle every uploaded asset a project references into the file list.
 *
 * Bytes are read before any URL is rewritten, so an asset that no longer
 * exists on disk keeps its original URL rather than being repointed at a
 * bundled copy that was never written.
 */
export async function bundleMedia<T>(project: T): Promise<{ project: T; files: GeneratedFile[] }> {
  const wanted = collectMediaUrls(project)
  const bytesByStoredName = new Map<string, Uint8Array>()

  await Promise.all(
    wanted.map(async (url) => {
      const storedName = storedNameOf(url)
      if (!storedName) return
      const bytes = await readMedia(storedName)
      if (bytes) bytesByStoredName.set(storedName, new Uint8Array(bytes))
    })
  )

  const rewritten = rewriteMediaUrls(project, (storedName) =>
    bytesByStoredName.has(storedName) ? assetUrl(`${ASSET_DIR}/${storedName}`) : null
  )

  const files: GeneratedFile[] = [...bytesByStoredName].map(([storedName, bytes]) => ({
    path: `${ASSET_DIR}/${storedName}`,
    bytes,
  }))

  return { project: rewritten.project, files }
}