import { z } from 'zod';
import type { ZodError } from 'zod';
import type { ApiResponse } from '../../types';

/**
 * Validates data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws ZodError
 */
export function validateSchema<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

/**
 * Validates data safely against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success status and either data or error
 */
export function validateSchemaSafe<T extends z.ZodTypeAny>(schema: T, data: unknown): {
  success: boolean;
  data?: z.infer<T>;
  error?: ZodError;
} {
  const result = schema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error
  };
}

/**
 * Creates a validation middleware for API routes
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function createValidationMiddleware<T extends z.ZodTypeAny>(schema: T) {
  return (req: any, res: any, next: any) => {
    const result = validateSchemaSafe(schema, req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.error?.issues
        }
      } as ApiResponse<never>);
    }
    req.validatedData = result.data;
    next();
  };
}

/**
 * Validates and transforms data
 * @param schema - Zod schema to validate against
 * @param data - Data to validate and transform
 * @param transform - Transformation function
 * @returns Transformed data or throws ZodError
 */
export function validateAndTransform<T extends z.ZodTypeAny, U>(schema: T, data: unknown, transform: (data: z.infer<T>) => U): U {
  const validatedData = validateSchema(schema, data);
  return transform(validatedData);
}
