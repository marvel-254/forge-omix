import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from '../types';

/**
 * Creates a standardized API response
 * @param c - Hono context
 * @param data - Data to include in the response
 * @param status - HTTP status code
 * @returns JSON response
 */
export function createApiResponse<T>(c: Context, data: T, status: ContentfulStatusCode = 200): Response {
  return c.json(
    {
      success: true,
      data,
    } satisfies ApiResponse<T>,
    status
  );
}

/**
 * Creates an error API response
 * @param c - Hono context
 * @param code - Error code
 * @param message - Error message
 * @param details - Additional error details OR a numeric HTTP status shorthand
 * @param status - HTTP status code (defaults to 400, or the shorthand value)
 */
export function createErrorResponse(
  c: Context,
  code: string,
  message: string,
  details?: unknown,
  status?: ContentfulStatusCode
): Response {
  // Support the common shorthand: createErrorResponse(c, 'NOT_FOUND', '...', 404)
  const resolvedStatus: ContentfulStatusCode =
    status ?? (typeof details === 'number' ? (details as ContentfulStatusCode) : 400);

  return c.json(
    {
      success: false,
      error: {
        code,
        message,
        details: typeof details === 'number' ? undefined : details,
      },
    } satisfies ApiResponse<never>,
    resolvedStatus
  );
}
