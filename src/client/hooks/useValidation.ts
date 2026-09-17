import { useState, useCallback } from 'react';
import { z } from 'zod';
import type { ZodError } from 'zod';

/**
 * Custom hook for form validation using Zod schemas
 * @param schema - Zod schema to validate against
 * @returns Object with validation state and functions
 */
export function useValidation<T extends z.ZodTypeAny>(schema: T) {
  const [errors, setErrors] = useState<ZodError | null>(null);
  const [isValid, setIsValid] = useState(false);

  /**
   * Validates data against the provided schema
   * @param data - Data to validate
   * @returns Validated data or undefined if validation fails
   */
  const validate = useCallback((data: unknown): z.infer<T> | undefined => {
    const result = schema.safeParse(data);
    setErrors(result.success ? null : result.error);
    setIsValid(result.success);
    return result.success ? result.data : undefined;
  }, [schema]);

  /**
   * Resets the validation state
   */
  const reset = useCallback(() => {
    setErrors(null);
    setIsValid(false);
  }, []);

  return {
    errors,
    isValid,
    validate,
    reset
  };
}

/**
 * Custom hook for real-time validation in form fields
 * @param schema - Zod schema to validate against
 * @param initialValue - Initial value for the field
 * @returns Object with field state and validation functions
 */
export function useFieldValidation<T extends z.ZodTypeAny>(schema: T, initialValue: z.infer<T>) {
  const [value, setValue] = useState<z.infer<T>>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  /**
   * Handles field value change
   * @param newValue - New value for the field
   */
  const handleChange = useCallback((newValue: z.infer<T>) => {
    setValue(newValue);
    if (isTouched) {
      validateField(newValue);
    }
  }, [isTouched]);

  /**
   * Validates the field value
   * @param val - Value to validate (defaults to current value)
   */
  const validateField = useCallback((val: z.infer<T> = value) => {
    const result = schema.safeParse(val);
    setError(result.success ? null : result.error.errors[0]?.message || 'Invalid value');
    return result.success;
  }, [schema, value]);

  /**
   * Handles field blur event
   */
  const handleBlur = useCallback(() => {
    setIsTouched(true);
    validateField();
  }, [validateField]);

  return {
    value,
    error,
    isTouched,
    handleChange,
    handleBlur,
    validateField
  };
}
