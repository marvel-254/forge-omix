# 17 — Media Handling (Images, Video, GIF, WebP)

## 17.1 Overview

The canvas must support inserting and manipulating media assets: images (PNG, JPG, WebP, SVG), animated GIFs, and video files (MP4, WebM). Media must be resizable directly on the canvas, and images must be editable (crop, rotate, flip) within the properties panel.

### Core Principle

> **Native HTML5 media, zero heavy dependencies.** Browsers already handle video playback, GIF animation, and WebP rendering natively. We don't need Video.js or heavy media frameworks for a builder. We need a solid **image editor** (crop/resize/rotate) and proper **schema types**.

## 17.2 Media Component Schema

A new top-level component type: `Media` — unified for images, GIFs, and video.

```json
{
  "id": "comp_media_01H...",
  "type": "Media",
  "name": "Hero Image",
  "props": {
    "src": { "$ref": "assets.hero_bg_01H" },
    "mediaType": "image",           // "image" | "gif" | "video"
    "alt": "Product hero shot",
    "fit": "cover",                 // "contain" | "cover" | "fill" | "none"
    "position": { "x": 0.5, "y": 0.5 },
    
    // Image edit state (null if unedited)
    "edit": {
      "crop": { "x": 0, "y": 0, "width": 800, "height": 600, "unit": "px" },
      "rotation": 0,                // 0, 90, 180, 270
      "flip": { "horizontal": false, "vertical": false },
      "filters": {
        "brightness": 100,          // 0-200
        "contrast": 100,
        "saturate": 100,
        "blur": 0,                  // px
        "grayscale": 0              // 0-100
      }
    },
    
    // Video-specific
    "videoOptions": {
      "autoplay": false,
      "loop": false,
      "muted": true,
      "controls": true,
      "poster": null                // thumbnail asset ID
    }
  },
  "styles": {
    "base": {
      "width": "100%",
      "height": { "$ref": "designTokens.spacing.auto" },
      "borderRadius": { "$ref": "designTokens.radius.lg" }
    }
  },
  "accessibility": {
    "role": "img",
    "alt": "Product hero shot"
  }
}
```

## 17.3 Supported Formats

| Format | Type | Browser Support | Handling |
|--------|------|-----------------|----------|
| **PNG** | Image | Universal | Native `<img>` |
| **JPG/JPEG** | Image | Universal | Native `<img>` |
| **WebP** | Image | 97%+ browsers | Native `<img>` with `<picture>` fallback |
| **SVG** | Image | Universal | Sanitized inline or `<img>` |
| **GIF** | Animated | Universal | Native `<img>` (toggle play/pause optional) |
| **AVIF** | Image | 90%+ browsers | Native `<img>` with `<picture>` fallback |
| **MP4** | Video | Universal | Native `<video>` |
| **WebM** | Video | 95%+ browsers | Native `<video>` |
| **MOV** | Video | Limited | Convert to MP4 on upload |

### Format Strategy

**For images:** Use `<picture>` element with fallbacks:
```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="...">
</picture>
```

**For video:** Provide multiple sources:
```html
<video controls poster="thumb.jpg">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
</video>
```

## 17.4 Image Editor (Crop, Resize, Rotate, Flip)

### Library Selection

| Library | Size | License | Pros | Cons |
|---------|------|---------|------|------|
| **react-image-crop** | ~10KB | MIT | Simple, popular, React-native | No built-in filters |
| **cropperjs** | ~25KB | MIT | Feature-rich, mature | jQuery-era API |
| **Custom Canvas** | 0KB | — | Zero deps, full control | More code to write |

**Decision:** `react-image-crop` — smallest, MIT, React-native, does crop/resize/rotate. Add custom Canvas-based filters if needed.

### Image Edit Component

```tsx
// src/client/panels/ImageEditPanel.tsx
import ReactImageCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditPanelProps {
  src: string;
  edit: MediaEditState;
  onChange: (edit: MediaEditState) => void;
}

export function ImageEditPanel({ src, edit, onChange }: ImageEditPanelProps) {
  const [crop, setCrop] = useState(edit.crop);
  const [rotation, setRotation] = useState(edit.rotation);
  const [flip, setFlip] = useState(edit.flip);
  const [filters, setFilters] = useState(edit.filters);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live preview via CSS filters
  const previewStyle = {
    filter: `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturate}%)
      blur(${filters.blur}px)
      grayscale(${filters.grayscale}%)
    `,
    transform: `
      rotate(${rotation}deg)
      scaleX(${flip.horizontal ? -1 : 1})
      scaleY(${flip.vertical ? -1 : 1})
    `,
  };

  // Apply crop to canvas for export
  function applyCrop() {
    if (!imgRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    // Apply rotation
    if (rotation === 90 || rotation === 270) {
      canvas.width = crop.height;
      canvas.height = crop.width;
    } else {
      canvas.width = crop.width;
      canvas.height = crop.height;
    }

    ctx.filter = previewStyle.filter;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      -crop.width / 2, -crop.height / 2,
      crop.width, crop.height
    );

    // Return edited image as blob
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.92);
    });
  }

  return (
    <div className="space-y-4">
      {/* Crop preview */}
      <ReactCrop
        crop={crop}
        onChange={(c) => { setCrop(c); onChange({ ...edit, crop: c }); }}
        aspect={undefined}  // Free crop
      >
        <img
          ref={imgRef}
          src={src}
          alt="Editing"
          style={previewStyle}
          className="max-w-full"
        />
      </ReactCrop>

      {/* Crop aspect presets */}
      <div className="flex gap-2">
        {['Free', '1:1', '4:3', '16:9', '3:2'].map((ratio) => (
          <button
            key={ratio}
            onClick={() => setAspect(ratio)}
            className="text-xs px-2 py-1 rounded border"
          >
            {ratio}
          </button>
        ))}
      </div>

      {/* Rotation & Flip */}
      <div className="flex gap-2">
        <button onClick={() => setRotation((r) => (r + 90) % 360)}>↻ 90°</button>
        <button onClick={() => setRotation((r) => (r - 90 + 360) % 360)}>↺ 90°</button>
        <button onClick={() => setFlip((f) => ({ ...f, horizontal: !f.horizontal }))}>↔ Flip H</button>
        <button onClick={() => setFlip((f) => ({ ...f, vertical: !f.vertical }))}>↕ Flip V</button>
      </div>

      {/* Filters (optional, lightweight) */}
      <details>
        <summary>Filters</summary>
        <FilterSlider label="Brightness" value={filters.brightness} onChange={(v) => setFilters({ ...filters, brightness: v })} min={0} max={200} />
        <FilterSlider label="Contrast" value={filters.contrast} onChange={(v) => setFilters({ ...filters, contrast: v })} min={0} max={200} />
        <FilterSlider label="Saturation" value={filters.saturate} onChange={(v) => setFilters({ ...filters, saturate: v })} min={0} max={200} />
        <FilterSlider label="Blur" value={filters.blur} onChange={(v) => setFilters({ ...filters, blur: v })} min={0} max={10} />
        <FilterSlider label="Grayscale" value={filters.grayscale} onChange={(v) => setFilters({ ...filters, grayscale: v })} min={0} max={100} />
      </details>

      <button onClick={applyCrop}>Apply Edit</button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
```

## 17.5 Media Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MEDIA UPLOAD FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Upload  │ →  │   Validate   │ →  │   Store Asset    │  │
│  │          │    │              │    │                  │  │
│  │ - Drag   │    │ - Type check │    │ - Save to fs     │  │
│  │ - Paste  │    │ - Size check │    │ - Create thumbs  │  │
│  │ - Click  │    │ - Sanitize   │    │ - DB metadata    │  │
│  │ - URL    │    │ - EXIF strip │    │ - Update schema  │  │
│  └──────────┘    └──────────────┘    └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  ASSET REGISTRY                       │   │
│  │  - id: UUIDv7                                        │   │
│  │  - originalPath: /data/projects/<pid>/assets/<id>.ext │   │
│  │  - thumbnailPath: /data/projects/<pid>/assets/<id>_thumb.webp │
│  │  - width, height, format, size, duration (video)     │   │
│  │  - alt, caption, metadata                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Upload Validation

```typescript
const MEDIA_CONSTRAINTS = {
  image: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    formats: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
    maxWidth: 8000,
    maxHeight: 8000,
  },
  gif: {
    maxSize: 25 * 1024 * 1024,  // 25MB (GIFs are large)
    formats: ['image/gif'],
    maxWidth: 4000,
    maxHeight: 4000,
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    formats: ['video/mp4', 'video/webm', 'video/ogg'],
    maxDuration: 300, // 5 minutes
  },
};

function validateMedia(file: File): ValidationResult {
  const category = file.type.startsWith('video/') ? 'video' : 
                   file.type === 'image/gif' ? 'gif' : 'image';
  const constraints = MEDIA_CONSTRAINTS[category];
  
  if (!constraints.formats.includes(file.type)) {
    return { valid: false, error: `Unsupported format: ${file.type}` };
  }
  
  if (file.size > constraints.maxSize) {
    return { valid: false, error: `File too large: ${formatBytes(file.size)} (max ${formatBytes(constraints.maxSize)})` };
  }
  
  return { valid: true };
}
```

### SVG Sanitization

All SVG uploads must be sanitized to prevent XSS:

```typescript
import DOMPurify from 'dompurify';

function sanitizeSvg(svgString: string): string {
  return DOMPurify.sanitize(svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use', 'feDropShadow', 'foreignObject'],
  });
}
```

## 17.6 GIF Handling

Browsers render GIFs natively as `<img>`. For performance:

### Option A: Native GIF (Simplest)
```tsx
<img src={gifUrl} alt={alt} />
```
- Pros: Zero dependencies, works everywhere
- Cons: No playback control, CPU-heavy for large GIFs

### Option B: GIF as Video (Performance)
Convert GIF → MP4/WebM on upload for 90% file size reduction:
```bash
# Server-side conversion (if ffmpeg available)
ffmpeg -i input.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" output.mp4
```

```tsx
<video autoPlay loop muted playsInline poster={stillFrame}>
  <source src={mp4Url} type="video/mp4" />
</video>
```

**Decision:** Upload native GIFs. Optionally transcode to video in background. Show video player for large GIFs (> 5MB) with play/pause toggle.

## 17.7 Video Handling

### Native HTML5 (Default)
Zero dependencies, works everywhere:

```tsx
<video
  src={videoUrl}
  poster={posterUrl}
  controls={controls}
  autoPlay={autoplay}
  loop={loop}
  muted={muted}
  playsInline
  className="w-full h-full object-cover"
/>
```

### Video Component in Properties Panel

```json
{
  "id": "comp_video_01H...",
  "type": "Media",
  "name": "Promo Video",
  "props": {
    "src": { "$ref": "assets.promo_vid_01H" },
    "mediaType": "video",
    "fit": "cover",
    "videoOptions": {
      "autoplay": false,
      "loop": false,
      "muted": true,
      "controls": true,
      "poster": { "$ref": "assets.poster_01H" }
    }
  }
}
```

### Video Processing (Optional, Server-Side)

For advanced video handling (thumbnails, transcoding), integrate `ffmpeg.wasm` (lazy-loaded, ~30MB) only when user requests:

```typescript
// Lazy-loaded only when needed
async function generateVideoThumbnail(file: File): Promise<Blob> {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile } = await import('@ffmpeg/util');
  
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  await ffmpeg.writeFile('input.mp4', await fetchFile(file));
  await ffmpeg.exec(['-i', 'input.mp4', '-ss', '00:00:01', '-vframes', '1', 'thumb.jpg']);
  const data = await ffmpeg.readFile('thumb.jpg');
  return new Blob([data], { type: 'image/jpeg' });
}
```

**Decision:** Defer ffmpeg.wasm to Phase 4+. Use client-side Canvas for thumbnails initially.

## 17.8 WebP Support

WebP is handled natively by modern browsers. The builder should:

1. **Accept WebP uploads** — no conversion needed
2. **Generate WebP thumbnails** — smaller previews
3. **Export with fallbacks** — `<picture>` element with JPEG fallback

### WebP Thumbnail Generation

```typescript
async function generateWebPThumbnail(file: File, maxWidth = 400): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const scale = maxWidth / img.width;
  canvas.width = maxWidth;
  canvas.height = img.height * scale;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.85);
  });
}
```

## 17.9 Media Library

A panel in the builder showing all project assets:

```
┌─────────────────────────────────────────────────────────┐
│  📁 Media Library                        [+ Upload]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │ IMG  │  │ GIF  │  │ VID  │  │ SVG  │               │
│  │ 📸   │  │ 🎞️   │  │ 🎬   │  │ 📐   │               │
│  └──────┘  └──────┘  └──────┘  └──────┘               │
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ [img1]  │  │ [img2]  │  │ [img3]  │                 │
│  │ hero.jpg│  │ logo.svg│  │ team.png│                 │
│  │ 2.4MB   │  │ 12KB    │  │ 800KB   │                 │
│  └─────────┘  └─────────┘  └─────────┘                 │
│                                                          │
│  ┌─────────┐  ┌─────────┐                               │
│  │ ▶ vid1  │  │ 🎞️ gif1 │                               │
│  │ promo   │  │ loading │                               │
│  │ 15.2MB  │  │ 8.1MB   │                               │
│  └─────────┘  └─────────┘                               │
└─────────────────────────────────────────────────────────┘
```

### Media Library Features

- Drag assets directly onto canvas
- Preview on hover
- Sort by name, date, type, size
- Search/filter by type
- Bulk delete unused assets
- Show dimensions, file size, format

## 17.10 Media Component Rendering

### In the Canvas (Editing)

```tsx
function MediaComponent({ media }: { media: MediaProps }) {
  const asset = useAsset(media.src);
  
  if (media.mediaType === 'video') {
    return (
      <video
        src={asset.url}
        poster={asset.posterUrl}
        controls={media.videoOptions.controls}
        autoPlay={media.videoOptions.autoplay}
        loop={media.videoOptions.loop}
        muted={media.videoOptions.muted}
        className="w-full h-full"
        style={{ objectFit: media.fit }}
      />
    );
  }
  
  // Image or GIF
  return (
    <img
      src={asset.url}
      alt={media.alt}
      className="w-full h-full"
      style={{
        objectFit: media.fit,
        objectPosition: `${media.position.x * 100}% ${media.position.y * 100}%`,
        ...applyEditStyles(media.edit),
      }}
    />
  );
}
```

### In Generated Code

```tsx
// Generated component (React + Vite)
export function HeroImage() {
  return (
    <picture>
      <source srcSet="/assets/hero_400w.avif" type="image/avif" media="(max-width: 768px)" />
      <source srcSet="/assets/hero_800w.avif" type="image/avif" media="(max-width: 1200px)" />
      <source srcSet="/assets/hero_1200w.avif" type="image/avif" />
      <source srcSet="/assets/hero_400w.webp" type="image/webp" media="(max-width: 768px)" />
      <source srcSet="/assets/hero_800w.webp" type="image/webp" media="(max-width: 1200px)" />
      <source srcSet="/assets/hero_1200w.webp" type="image/webp" />
      <img
        src="/assets/hero_1200w.jpg"
        alt="Product hero shot"
        loading="lazy"
        decoding="async"
        className="w-full h-auto object-cover rounded-lg"
      />
    </picture>
  );
}
```

## 17.11 Asset Optimization Pipeline

### On Upload

1. **Validate** (type, size, dimensions)
2. **Sanitize** (SVG, strip EXIF from images)
3. **Generate thumbnails** (WebP, multiple sizes)
4. **Store** (filesystem + DB metadata)
5. **Update schema** (asset reference added)

### Generated Responsive Sizes

```typescript
const RESPONSIVE_SIZES = [
  { width: 400, suffix: '_sm' },
  { width: 800, suffix: '_md' },
  { width: 1200, suffix: '_lg' },
  { width: 1920, suffix: '_xl' },
];

async function generateResponsiveImages(file: File): Promise<AssetVariants> {
  const img = await createImageBitmap(file);
  const variants: AssetVariants = { original: file, thumbnails: {} };
  
  // Always generate a thumbnail
  variants.thumbnails.thumb = await resizeToWebP(img, 400);
  
  // Generate responsive sizes only if image > 1200px wide
  if (img.width > 1200) {
    for (const size of RESPONSIVE_SIZES) {
      if (size.width < img.width) {
        variants.thumbnails[size.suffix] = await resizeToWebP(img, size.width);
      }
    }
  }
  
  return variants;
}
```

## 17.12 Dependencies Added

| Dependency | Size | License | Purpose |
|------------|------|---------|---------|
| `react-image-crop` | ~10KB | MIT | Image crop/resize/rotate |
| `dompurify` | ~15KB | MIT | SVG sanitization |
| **Total** | **~25KB** | | |

**Not added (by design):**
- Video.js — native `<video>` is sufficient
- GIF.js — native `<img>` handles GIFs
- FFmpeg.wasm — deferred, lazy-loaded on demand

## 17.13 UI Integration

### Toolbar Addition

New media insertion buttons in the toolbar:

```
[🖼️ Image] [🎞️ GIF] [🎬 Video] [📐 SVG]
```

Clicking opens file picker (or drag-drop zone). URL input available in properties panel.

### Canvas Drop Zone

Drag file from OS → drops on canvas → auto-detects type → creates Media component.

### Properties Panel (when Media selected)

```
┌─────────────────────────────────────────┐
│ 🖼️ Hero Image                           │
├─────────────────────────────────────────┤
│ Source: [hero.jpg] [Change]             │
│ Alt text: [Product hero shot    ]       │
│ Fit: [Cover ▼]                          │
│                                         │
│ ┌─────────────────────────────────┐     │
│ │     [Image Preview]             │     │
│ │     ┌─────────────┐             │     │
│ │     │ Crop region │             │     │
│ │     └─────────────┘             │     │
│ └─────────────────────────────────┘     │
│                                         │
│ [Edit Image →] — opens ImageEditPanel   │
│                                         │
│ Size: 1200 × 800 px                     │
│ File size: 240 KB                       │
│ Format: WebP                            │
└─────────────────────────────────────────┘
```

## 17.14 Phase Placement

| Phase | Media Feature |
|-------|---------------|
| Phase 3 (Canvas Core) | Basic image insert, drag-resize, native video/GIF |
| Phase 4 (Components) | Media Library panel, thumbnail generation |
| Phase 6 (Templates) | Template media assets included in export |
| Phase 7 (Codegen) | Responsive `<picture>` generation, lazy loading |
| Phase 4+ (Advanced) | Image editor (crop/rotate/filters), ffmpeg.wasm |
