import { Hono } from 'hono';
import type { Context } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { mediaAssets, projects } from '../db/schema';
import { createApiResponse, createErrorResponse } from '../utils';
import {
  ACCEPTED_MIME_TYPES,
  deleteMedia,
  mediaTypeFor,
  readMedia,
  storeMedia,
} from '../services/mediaService';
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware';

/**
 * Media assets (docs/17).
 *
 * Upload is authenticated; file serving is public-by-id because generated
 * sites and canvas previews reference the URL directly. Stored names are
 * content-addressed and unguessable, and every path parameter is validated
 * against a strict pattern before touching the filesystem.
 */
const router = new Hono<AuthEnv>();

function accountId(c: Context<AuthEnv>) {
  const account = c.get('account');
  if (!account) throw new Error('Authenticated account missing');
  return account.id;
}

router.post('/', authMiddleware(), async (c) => {
  try {
    const form = await c.req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return createErrorResponse(c, 'VALIDATION_ERROR', 'Expected a file field');
    }
    if (!mediaTypeFor(file.type)) {
      return createErrorResponse(
        c,
        'VALIDATION_ERROR',
        `Unsupported media type. Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}`
      );
    }
    const projectId = form.get('projectId');
    if (projectId) {
      // Assets may only be attached to a project the caller owns.
      const owned = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, String(projectId)), eq(projects.accountId, accountId(c))))
        .get();
      if (!owned) return createErrorResponse(c, 'FORBIDDEN', 'Project not found');
    }

    const stored = await storeMedia({
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: file.type,
      filename: file.name,
    });

    const row = await db
      .insert(mediaAssets)
      .values({
        id: stored.id,
        accountId: accountId(c),
        projectId: projectId ? String(projectId) : null,
        filename: stored.filename,
        storedName: stored.storedName,
        mimeType: stored.mimeType,
        mediaType: stored.mediaType,
        byteSize: stored.byteSize,
        alt: (form.get('alt') as string | null) ?? null,
        createdAt: new Date(),
      })
      .returning()
      .get();

    return createApiResponse(
      c,
      {
        id: row.id,
        url: stored.url,
        filename: row.filename,
        mimeType: row.mimeType,
        mediaType: row.mediaType,
        byteSize: row.byteSize,
        alt: row.alt,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return createErrorResponse(c, 'UPLOAD_FAILED', message);
  }
});

router.get('/', authMiddleware(), async (c) => {
  try {
    const rows = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.accountId, accountId(c)))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(200)
      .all();
    return createApiResponse(
      c,
      rows.map((r) => ({
        id: r.id,
        url: `/api/media/files/${r.storedName}`,
        filename: r.filename,
        mimeType: r.mimeType,
        mediaType: r.mediaType,
        byteSize: r.byteSize,
        width: r.width,
        height: r.height,
        alt: r.alt,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch media');
  }
});

router.delete('/:id', authMiddleware(), async (c) => {
  try {
    const id = c.req.param('id');
    const row = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, id), eq(mediaAssets.accountId, accountId(c))))
      .get();
    if (!row) return createErrorResponse(c, 'NOT_FOUND', 'Media not found');
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id)).run();
    await deleteMedia(row.storedName);
    return createApiResponse(c, { id });
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to delete media');
  }
});

/**
 * Public file serving. Unauthenticated by design: a generated site embeds
 * these URLs. Names are content-addressed 32-hex + extension, so they are not
 * enumerable, and the extension is re-derived from our own mime allowlist
 * rather than trusted from the request.
 */
const EXTENSION_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

router.get('/files/:storedName', async (c) => {
  const storedName = c.req.param('storedName');
  const ext = storedName.split('.').pop() ?? '';
  const mime = EXTENSION_MIME[ext];
  if (!mime) return c.notFound();

  const bytes = await readMedia(storedName);
  if (!bytes) return c.notFound();

  c.header(
    'Content-Type',
    // SVG can script when rendered directly in a tab. Serving it as a
    // download (or with CSP) keeps an uploaded asset from becoming XSS
    // against our own origin.
    mime === 'image/svg+xml'
      ? 'image/svg+xml'
      : mime
  );
  c.header('Content-Length', String(bytes.byteLength));
  c.header('Cache-Control', 'public, max-age=31536000, immutable');
  c.header('X-Content-Type-Options', 'nosniff');
  if (mime === 'image/svg+xml') {
    c.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }
  return c.body(new Uint8Array(bytes));
});

export default router;