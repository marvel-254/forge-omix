import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import {
  ACCEPTED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MEDIA_ACCEPT_ATTRIBUTE,
  MediaApiError,
  mediaApi,
  type MediaAsset,
  type MediaType,
} from '@client/lib/mediaApi'
import { cn } from '@client/lib/utils'
import { Button } from '../ui/Button'

/**
 * Media library panel (docs/17).
 *
 * Browses the account's stored assets, uploads new ones, and hands the
 * chosen asset to the caller. Self-contained: it reads nothing from the
 * schema store, so the lead can mount it from the library sidebar, the
 * properties panel, or a modal without this component knowing the difference.
 */

interface MediaLibraryPanelProps {
  /** Called with the asset the user picked. */
  onSelect?: (asset: MediaAsset) => void
  /** Attach uploads to this project (the server verifies ownership). */
  projectId?: string
}

/** Badge classes per media type — static strings so Tailwind can extract them. */
const MEDIA_TYPE_BADGE_CLASS: Record<MediaType, string> = {
  image: 'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100',
  gif: 'bg-accent text-accent-foreground',
  video: 'bg-secondary text-secondary-foreground',
}

const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  image: 'Image',
  gif: 'GIF',
  video: 'Video',
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

/** Client-side pre-flight so an unsupported or oversized file fails without a round trip. */
function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported format. Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}`
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`
  }
  return null
}

function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof MediaApiError ? caught.message : fallback
}

export function MediaLibraryPanel({ onSelect, projectId }: MediaLibraryPanelProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await mediaApi.list()
      setAssets(Array.isArray(result) ? result : [])
      setError(null)
    } catch (caught) {
      setAssets([])
      setError(errorMessage(caught, 'Could not load media — the server may be unreachable.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target
      const file = input.files?.[0]
      // Clear immediately so picking the same file again still fires onChange.
      input.value = ''
      if (!file) return

      const invalid = validateFile(file)
      if (invalid) {
        setError(invalid)
        return
      }

      setUploading(true)
      setError(null)
      try {
        await mediaApi.upload({ file, projectId })
        await refresh()
      } catch (caught) {
        setError(errorMessage(caught, `Upload of "${file.name}" failed.`))
      } finally {
        setUploading(false)
      }
    },
    [projectId, refresh]
  )

  const select = useCallback(
    (asset: MediaAsset) => {
      setSelectedId(asset.id)
      setPendingDeleteId(null)
      setError(null)
      onSelect?.(asset)
    },
    [onSelect]
  )

  const deleteAsset = useCallback(
    async (asset: MediaAsset) => {
      setPendingDeleteId(null)
      setDeletingId(asset.id)
      setError(null)
      try {
        await mediaApi.remove(asset.id)
        setSelectedId((current) => (current === asset.id ? null : current))
        await refresh()
      } catch (caught) {
        setError(errorMessage(caught, `Could not delete "${asset.filename}".`))
      } finally {
        setDeletingId(null)
      }
    },
    [refresh]
  )

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Media library">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Media
        </h2>
        <div className="flex items-center gap-1">
          <label className={cn('inline-block', uploading && 'pointer-events-none opacity-50')}>
            <span className="sr-only">Upload a media file</span>
            <input
              type="file"
              accept={MEDIA_ACCEPT_ATTRIBUTE}
              className="hidden"
              disabled={uploading}
              onChange={(event) => void handleFileChange(event)}
            />
            <span className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              {uploading ? 'Uploading…' : 'Upload'}
            </span>
          </label>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Refresh media library"
            disabled={loading}
            onClick={() => void refresh()}
          >
            ↻
          </Button>
        </div>
      </header>

      {uploading && (
        <div
          className="h-1 w-full overflow-hidden bg-muted"
          role="progressbar"
          aria-label="Uploading media"
        >
          {/* fetch exposes no upload progress, so this is honestly indeterminate. */}
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {error && (
          <p
            role="alert"
            className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs text-destructive"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="px-1 py-3 text-xs text-muted-foreground" role="status">
            Loading media…
          </p>
        ) : assets.length === 0 ? (
          <div className="px-1 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No media yet</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Upload an image, GIF, or video to use it on the canvas. Files up to{' '}
              {formatBytes(MAX_UPLOAD_BYTES)} are accepted.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {assets.map((asset) => {
              // The server types this as MediaType, but the value arrives over
              // the wire; an unknown kind must not become an undefined lookup.
              const mediaType: MediaType =
                asset.mediaType === 'video' || asset.mediaType === 'gif' ? asset.mediaType : 'image'
              const isSelected = selectedId === asset.id
              const isDeleting = deletingId === asset.id
              const isPendingDelete = pendingDeleteId === asset.id

              return (
                <li
                  key={asset.id}
                  className={cn(
                    'group rounded-md border border-transparent transition-colors',
                    isSelected ? 'border-border bg-accent' : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2 p-1">
                    <button
                      type="button"
                      onClick={() => select(asset)}
                      aria-pressed={isSelected}
                      aria-label={`Select ${asset.filename}`}
                      disabled={isDeleting}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded text-left disabled:opacity-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                        {mediaType === 'video' ? (
                          // A static glyph, not a <video>: the library can hold
                          // 200 assets, and one metadata-fetching decoder per
                          // video is a real cost in a sidebar. The filename and
                          // badge carry the meaning, so this stays decorative.
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-5 w-5 fill-current text-muted-foreground"
                          >
                            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                          </svg>
                        ) : (
                          // Decorative: the filename beside it is the label.
                          <img
                            src={asset.url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {asset.filename}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={cn(
                              'rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                              MEDIA_TYPE_BADGE_CLASS[mediaType]
                            )}
                          >
                            {MEDIA_TYPE_LABEL[mediaType]}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {formatBytes(asset.byteSize)}
                          </span>
                        </span>
                      </span>
                    </button>

                    {isPendingDelete ? (
                      <span className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          aria-label={`Confirm delete ${asset.filename}`}
                          disabled={isDeleting}
                          onClick={() => void deleteAsset(asset)}
                        >
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Cancel delete ${asset.filename}`}
                          disabled={isDeleting}
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${asset.filename}`}
                        disabled={isDeleting || uploading}
                        className="shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                        onClick={() => setPendingDeleteId(asset.id)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

export default MediaLibraryPanel