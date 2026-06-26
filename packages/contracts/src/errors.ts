import { z } from 'zod';

/** Stable error envelope returned by every failing endpoint. */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    /** Optional field-level validation issues. */
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  CLASSIFICATION_FAILED: 'CLASSIFICATION_FAILED',
  INTERNAL: 'INTERNAL_ERROR',
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
