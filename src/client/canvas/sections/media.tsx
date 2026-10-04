import type { CSSProperties } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { resolveTokenRefs } from '../ComponentRenderer'
import { useSchemaStore } from '../../store/schemaStore'
import { useInstancePresentation } from '../presentation'

/**
 * Media canvas component (docs/17) — one component for images, animated GIFs
 * and video, rendered with native HTML5 elements and no media framework.
 *
 * The prop shape is the canonical schema shape: `edit` carries the image edit
 * state (crop / rotate / flip / filters) and is `null` until the image has been
 * edited, `videoOptions` carries playback configuration.
 *
 * Two rules shape everything below:
 *
 *  - **Merge defensively.** The editor white-screens when a component is handed
 *    a partial prop set, so no nested object is ever dereferenced. Every one of
 *    `edit`, `edit.flip`, `edit.filters`, `edit.crop` and `videoOptions` is
 *    read through a normaliser that fills in the documented default, and every
 *    numeric prop is clamped to its schema range.
 *  - **Static Tailwind strings.** Class names that vary live in lookup maps so
 *    Tailwind can extract them; nothing is interpolated into a `className`.
 *
 * Puck 0.20 addresses fields by flat prop key (`props[fieldName]`), so the
 * nested `edit` and `videoOptions` objects are edited through custom fields
 * rather than through dot-path field keys, which would land as flat props the
 * render never reads.
 */

/** Shared render props: Puck injects `id` and `puck` into every render. */
interface BaseRenderProps extends Record<string, unknown> {
  id: string
  puck: unknown
}

/** Props Puck injects into custom-field renders (Label is Puck's styled label). */
interface CustomFieldParams<Value> {
  value?: Value
  onChange: (value: Value) => void
  Label?: React.ComponentType<{ label?: React.ReactNode; children?: React.ReactNode }>
  label?: string
}

function useResolved<P extends Record<string, unknown>>(props: P): P {
  const tokens = useSchemaStore((s) => s.project?.designTokens)
  return resolveTokenRefs(props, tokens)
}

/** Read a string prop defensively — a non-string reads as absent. */
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// --- Canonical prop shape (docs/17 §17.2) ---

type MediaKind = 'image' | 'gif' | 'video'
type MediaFit = 'cover' | 'contain' | 'fill' | 'none'

interface MediaFilters {
  brightness: number
  contrast: number
  saturate: number
  blur: number
  grayscale: number
}

interface MediaFlip {
  horizontal: boolean
  vertical: boolean
}

interface MediaCrop {
  scale: number
}

interface MediaEditState {
  rotation: number
  flip: MediaFlip
  filters: MediaFilters
  crop: MediaCrop
}

interface MediaVideoOptions {
  autoplay: boolean
  loop: boolean
  muted: boolean
  controls: boolean
  poster: string | null
}

interface MediaRenderProps extends BaseRenderProps {
  src?: string
  mediaType?: MediaKind
  alt?: string
  fit?: MediaFit
  edit?: MediaEditState | null
  videoOptions?: MediaVideoOptions
  caption?: string
}

/** A real asset so a fresh drop and the library preview both look right. */
const DEFAULT_MEDIA_SRC =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'

/** Tailwind fit utilities, keyed by the `fit` prop. Literal strings only. */
const FIT_CLASS: Record<MediaFit, string> = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  none: 'object-none',
}

/** The four rotation steps the schema supports. */
const ROTATION_STEPS = [0, 90, 180, 270]

/**
 * Filter sliders as data so the panel editor and the `filter` string builder
 * cannot drift apart. Units mirror the CSS filter functions they feed.
 */
const FILTER_SPECS = [
  { key: 'brightness', label: 'Brightness', unit: '%', min: 0, max: 200, step: 1 },
  { key: 'contrast', label: 'Contrast', unit: '%', min: 0, max: 200, step: 1 },
  { key: 'saturate', label: 'Saturate', unit: '%', min: 0, max: 200, step: 1 },
  { key: 'blur', label: 'Blur', unit: 'px', min: 0, max: 10, step: 0.5 },
  { key: 'grayscale', label: 'Grayscale', unit: '%', min: 0, max: 100, step: 1 },
] as const

// --- Defensive readers ---

/** Clamp a numeric prop into its schema range; missing or non-numeric → fallback. */
function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

/** Snap any stored rotation to the nearest of the four schema steps. */
function readRotation(value: unknown): number {
  const raw =
    typeof value === 'number' && Number.isFinite(value) ? ((value % 360) + 360) % 360 : 0
  let nearest = ROTATION_STEPS[0]
  for (const step of ROTATION_STEPS) {
    if (Math.abs(step - raw) < Math.abs(nearest - raw)) nearest = step
  }
  return nearest
}

function readFilters(value: unknown): MediaFilters {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<MediaFilters>
  return {
    brightness: clampNumber(raw.brightness, 100, 0, 200),
    contrast: clampNumber(raw.contrast, 100, 0, 200),
    saturate: clampNumber(raw.saturate, 100, 0, 200),
    blur: clampNumber(raw.blur, 0, 0, 10),
    grayscale: clampNumber(raw.grayscale, 0, 0, 100),
  }
}

/** Expand a partial `edit` object into a complete edit state. */
function readEdit(value: unknown): MediaEditState {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<MediaEditState>
  const flip = (raw.flip && typeof raw.flip === 'object' ? raw.flip : {}) as Partial<MediaFlip>
  const crop = (raw.crop && typeof raw.crop === 'object' ? raw.crop : {}) as Partial<MediaCrop>
  return {
    rotation: readRotation(raw.rotation),
    flip: { horizontal: flip.horizontal === true, vertical: flip.vertical === true },
    filters: readFilters(raw.filters),
    crop: { scale: clampNumber(crop.scale, 1, 1, 5) },
  }
}

/** Expand a partial `videoOptions` object into complete playback options. */
function readVideoOptions(value: unknown): MediaVideoOptions {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<MediaVideoOptions>
  return {
    autoplay: raw.autoplay === true,
    loop: raw.loop === true,
    muted: raw.muted === true,
    controls: raw.controls === true,
    poster: text(raw.poster) || null,
  }
}

function readMediaType(value: unknown): MediaKind {
  return value === 'video' || value === 'gif' ? value : 'image'
}

function readFit(value: unknown): MediaFit {
  return value === 'contain' || value === 'fill' || value === 'none' ? value : 'cover'
}

// --- Style builders ---

/** CSS `filter` for the edited values only — an untouched image gets none. */
function filterValue(filters: MediaFilters): string | undefined {
  const parts: string[] = []
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`)
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`)
  if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`)
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`)
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`)
  return parts.length > 0 ? parts.join(' ') : undefined
}

/** Rotate / flip / crop-scale composed into one transform so they don't overwrite. */
function transformValue(edit: MediaEditState): string | undefined {
  const parts: string[] = []
  if (edit.rotation !== 0) parts.push(`rotate(${edit.rotation}deg)`)
  if (edit.flip.horizontal) parts.push('scaleX(-1)')
  if (edit.flip.vertical) parts.push('scaleY(-1)')
  if (edit.crop.scale !== 1) parts.push(`scale(${edit.crop.scale})`)
  return parts.length > 0 ? parts.join(' ') : undefined
}

// --- Panel controls ---
// Label-wrapped so each control is associated without generating ids that
// would collide across component instances.

const FIELD_CLASS =
  'w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <select
        className={FIELD_CLASS}
        value={value ? 'yes' : 'no'}
        onChange={(e) => onChange(e.target.value === 'yes')}
      >
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>
    </label>
  )
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (next: number) => void
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        className={FIELD_CLASS}
        type="number"
        min={min}
        max={max}
        step={step}
        value={String(value)}
        onChange={(e) => {
          const next = Number(e.target.value)
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)))
        }}
      />
    </label>
  )
}

function TextControl({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (next: string) => void
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        className={FIELD_CLASS}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/**
 * Editor for the whole `edit` object: rotation, flips, crop zoom and the five
 * CSS filters. Reads through `readEdit`, so a `null` or half-written edit state
 * renders as untouched rather than throwing.
 */
function EditStateField({ value, onChange, Label, label }: CustomFieldParams<MediaEditState>) {
  const edit = readEdit(value)
  const patch = (next: Partial<MediaEditState>) => onChange({ ...edit, ...next })
  return (
    <div className="space-y-3" data-testid="media-edit-field">
      {Label ? <Label label={label} /> : null}
      <label className="block space-y-1">
        <span className="block text-xs font-medium text-muted-foreground">Rotation</span>
        <select
          className={FIELD_CLASS}
          value={String(edit.rotation)}
          onChange={(e) => patch({ rotation: readRotation(Number(e.target.value)) })}
        >
          {ROTATION_STEPS.map((step) => (
            <option key={step} value={step}>
              {step}°
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <YesNo
          label="Flip horizontal"
          value={edit.flip.horizontal}
          onChange={(horizontal) => patch({ flip: { ...edit.flip, horizontal } })}
        />
        <YesNo
          label="Flip vertical"
          value={edit.flip.vertical}
          onChange={(vertical) => patch({ flip: { ...edit.flip, vertical } })}
        />
      </div>
      <NumberControl
        label="Crop scale"
        value={edit.crop.scale}
        min={1}
        max={5}
        step={0.05}
        onChange={(scale) => patch({ crop: { scale } })}
      />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filters
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FILTER_SPECS.map((spec) => (
            <NumberControl
              key={spec.key}
              label={`${spec.label} (${spec.unit})`}
              value={edit.filters[spec.key]}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              onChange={(amount) => patch({ filters: { ...edit.filters, [spec.key]: amount } })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Editor for `videoOptions`. Puck 0.20 has no boolean field, so each flag is a
 * Yes/No select; the poster is a plain URL/text input.
 */
function VideoOptionsField({
  value,
  onChange,
  Label,
  label,
}: CustomFieldParams<MediaVideoOptions>) {
  const options = readVideoOptions(value)
  const patch = (next: Partial<MediaVideoOptions>) => onChange({ ...options, ...next })
  return (
    <div className="space-y-3" data-testid="media-video-options-field">
      {Label ? <Label label={label} /> : null}
      <div className="grid grid-cols-2 gap-2">
        <YesNo
          label="Autoplay"
          value={options.autoplay}
          onChange={(autoplay) => patch({ autoplay })}
        />
        <YesNo label="Loop" value={options.loop} onChange={(loop) => patch({ loop })} />
        <YesNo label="Muted" value={options.muted} onChange={(muted) => patch({ muted })} />
        <YesNo
          label="Controls"
          value={options.controls}
          onChange={(controls) => patch({ controls })}
        />
      </div>
      <TextControl
        label="Poster URL"
        value={options.poster ?? ''}
        placeholder="/api/media/files/thumbnail.webp"
        onChange={(poster) => patch({ poster: text(poster) || null })}
      />
    </div>
  )
}

// --- Config ---

export const MediaConfig: ComponentConfig = {
  fields: {
    src: { type: 'text', label: 'Source URL' },
    mediaType: {
      type: 'select',
      label: 'Media type',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Animated GIF', value: 'gif' },
        { label: 'Video', value: 'video' },
      ],
    },
    alt: { type: 'text', label: 'Alt text' },
    fit: {
      type: 'select',
      label: 'Fit',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
        { label: 'Fill', value: 'fill' },
        { label: 'None', value: 'none' },
      ],
    },
    caption: { type: 'text', label: 'Caption' },
    edit: {
      type: 'custom',
      label: 'Image edit',
      render: (params: CustomFieldParams<MediaEditState>) => <EditStateField {...params} />,
    },
    videoOptions: {
      type: 'custom',
      label: 'Video options',
      render: (params: CustomFieldParams<MediaVideoOptions>) => <VideoOptionsField {...params} />,
    },
  },
  defaultProps: {
    src: DEFAULT_MEDIA_SRC,
    mediaType: 'image',
    alt: 'Product analytics dashboard on a laptop screen',
    fit: 'cover',
    edit: null,
    videoOptions: {
      autoplay: false,
      loop: false,
      muted: true,
      controls: true,
      poster: null,
    },
    caption: 'Every project, every page, in one place.',
  },
  render: (props: MediaRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const src = text(resolved.src)
    const alt = text(resolved.alt)
    const caption = text(resolved.caption)
    const mediaType = readMediaType(resolved.mediaType)
    const edit = readEdit(resolved.edit)
    const options = readVideoOptions(resolved.videoOptions)
    // Accessibility floor: an autoplaying video must be muted, and a video that
    // neither autoplays nor exposes controls could never be started.
    const autoplay = options.autoplay
    const muted = autoplay || options.muted
    const controls = autoplay ? options.controls : true
    const mediaClass = `h-full w-full ${FIT_CLASS[readFit(resolved.fit)]}`
    const mediaStyle: CSSProperties = {}
    const filter = filterValue(edit.filters)
    if (filter) mediaStyle.filter = filter
    const transform = transformValue(edit)
    if (transform) mediaStyle.transform = transform

    return (
      <figure
        className="w-full overflow-hidden rounded-xl border border-border bg-card"
        style={pres?.style}
        {...(pres?.a11y ?? {})}
      >
        {src ? (
          mediaType === 'video' ? (
            <video
              className={mediaClass}
              style={mediaStyle}
              poster={options.poster ?? undefined}
              controls={controls}
              muted={muted}
              loop={options.loop}
              autoPlay={autoplay}
              playsInline
              preload="metadata"
            >
              <source src={src} />
            </video>
          ) : (
            // No `loading="lazy"`: a Media block is used once or twice per page
            // and is frequently the LCP element, which lazy loading defers.
            <img src={src} alt={alt} className={mediaClass} style={mediaStyle} />
          )
        ) : (
          <div className="flex h-48 w-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            No media selected — upload a file from the media library or paste a URL.
          </div>
        )}
        {caption ? (
          <figcaption className="px-4 py-3 text-sm text-muted-foreground">{caption}</figcaption>
        ) : null}
      </figure>
    )
  },
}