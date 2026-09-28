import { Hono } from 'hono';
import { z } from 'zod';
import { createApiResponse, createErrorResponse } from '../utils';
import { createValidationMiddleware } from '../middleware/validation';
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
  workspaceStatus,
} from '../services/gitService';
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware';

/**
 * Git workspace routes (Phase 10). All operations are sandboxed to the
 * server workspace root — see gitService. Responses use the standard
 * envelope; GitError codes map to 400/404.
 */

const router = new Hono<AuthEnv>();
router.use('*', authMiddleware());

const workspaceSchema = z.object({ dir: z.string().min(1).max(200) }).passthrough();
const commitSchema = z
  .object({
    dir: z.string().min(1).max(200),
    message: z.string().min(1).max(500),
    author: z.object({ name: z.string().min(1).max(100), email: z.string().email().max(200) }).optional(),
  })
  .passthrough();
const checkoutSchema = z
  .object({
    dir: z.string().min(1).max(200),
    branch: z.string().min(1).max(200),
    create: z.boolean().optional(),
  })
  .passthrough();
const refSchema = z
  .object({
    dir: z.string().min(1).max(200),
    ref: z.string().min(1).max(200),
  })
  .passthrough();
const fileSchema = z
  .object({
    dir: z.string().min(1).max(200),
    file: z.string().min(1).max(500),
  })
  .passthrough();
const remoteSchema = z
  .object({
    dir: z.string().min(1).max(200),
    remote: z.string().min(1).max(100).optional(),
    branch: z.string().min(1).max(200).optional(),
  })
  .passthrough();

function gitErrorResponse(c: Parameters<typeof createErrorResponse>[0], error: unknown) {
  if (error instanceof GitError) {
    const status = error.code === 'NOT_A_REPO' ? 404 : 400;
    return createErrorResponse(c, error.code, error.message, undefined, status);
  }
  return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'Git operation failed', undefined, 500);
}

// Initialize (or confirm) a workspace repo.
router.post(
  '/init',
  createValidationMiddleware(workspaceSchema),
  async (c) => {
    try {
      const { dir } = c.get('validatedData') as { dir: string };
      return createApiResponse(c, await initWorkspace(dir), 201);
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

// Working-tree status.
router.post(
  '/status',
  createValidationMiddleware(workspaceSchema),
  async (c) => {
    try {
      const { dir } = c.get('validatedData') as { dir: string };
      return createApiResponse(c, await workspaceStatus(dir));
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

// Stage-all + commit.
router.post(
  '/commit',
  createValidationMiddleware(commitSchema),
  async (c) => {
    try {
      const { dir, message, author } = c.get('validatedData') as {
        dir: string;
        message: string;
        author?: { name: string; email: string };
      };
      return createApiResponse(c, await commitAll(dir, message, author), 201);
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

// Branch list / checkout.
router.post(
  '/branches',
  createValidationMiddleware(workspaceSchema),
  async (c) => {
    try {
      const { dir } = c.get('validatedData') as { dir: string };
      return createApiResponse(c, await listBranches(dir));
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

router.post(
  '/checkout',
  createValidationMiddleware(checkoutSchema),
  async (c) => {
    try {
      const { dir, branch, create } = c.get('validatedData') as {
        dir: string;
        branch: string;
        create?: boolean;
      };
      return createApiResponse(c, await checkoutBranch(dir, branch, create));
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

// Recent commits.
router.post(
  '/log',
  createValidationMiddleware(workspaceSchema),
  async (c) => {
    try {
      const { dir } = c.get('validatedData') as { dir: string };
      return createApiResponse(c, await recentCommits(dir));
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

// Unified diff for one file.
router.post(
  '/diff',
  createValidationMiddleware(fileSchema),
  async (c) => {
    try {
      const { dir, file } = c.get('validatedData') as { dir: string; file: string };
      return createApiResponse(c, { file, diff: await diffFile(dir, file) });
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

// Files changed since a ref (sync-back detection, docs/08 §8.4).
router.post(
  '/changed-since',
  createValidationMiddleware(refSchema),
  async (c) => {
    try {
      const { dir, ref } = c.get('validatedData') as { dir: string; ref: string };
      return createApiResponse(c, { ref, files: await changedSince(dir, ref) });
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

// Push / pull against the configured remote.
router.post(
  '/push',
  createValidationMiddleware(remoteSchema),
  async (c) => {
    try {
      const { dir, remote, branch } = c.get('validatedData') as {
        dir: string;
        remote?: string;
        branch?: string;
      };
      return createApiResponse(c, { result: await pushWorkspace(dir, remote, branch) });
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

router.post(
  '/pull',
  createValidationMiddleware(remoteSchema),
  async (c) => {
    try {
      const { dir, remote, branch } = c.get('validatedData') as {
        dir: string;
        remote?: string;
        branch?: string;
      };
      return createApiResponse(c, { result: await pullWorkspace(dir, remote, branch) });
    } catch (error) {
      return gitErrorResponse(c, error);
    }
  }
);

export default router;
