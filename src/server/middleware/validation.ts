import { Context, Next } from 'hono';
import { z } from 'zod';
import { validateSchemaSafe } from '../../lib/validations/utils';
import type { ApiResponse } from '../../types';

/**
 * Creates validation middleware for Hono routes
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 */
export function createValidationMiddleware<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: Next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body is not valid JSON',
          },
        } as ApiResponse<never>,
        400
      );
    }

    const result = validateSchemaSafe(schema, body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: result.error?.issues,
          },
        } as ApiResponse<never>,
        400
      );
    }

    c.set('validatedData' as never, result.data as never);
    await next();
  };
}

/**
 * Creates a validation middleware for query parameters
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 */
export function createQueryValidationMiddleware<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: Next) => {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(c.req.queries())) {
      if (value.length > 0) query[key] = value[0];
    }
    const result = validateSchemaSafe(schema, query);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query validation failed',
            details: result.error?.issues,
          },
        } as ApiResponse<never>,
        400
      );
    }

    c.set('validatedQuery' as never, result.data as never);
    await next();
  };
}

/**
 * Creates a validation middleware for route parameters
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 */
export function createParamsValidationMiddleware<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: Next) => {
    const params: Record<string, string> = { ...c.req.param() };
    const result = validateSchemaSafe(schema, params);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Params validation failed',
            details: result.error?.issues,
          },
        } as ApiResponse<never>,
        400
      );
    }

    c.set('validatedParams' as never, result.data as never);
    await next();
  };
}
