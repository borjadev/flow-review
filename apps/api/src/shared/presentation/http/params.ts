import type { Request } from 'express';
import { HttpError } from './http-error.js';

/** Reads a required route parameter, narrowing it to a non-empty string. */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new HttpError(400, 'VALIDATION_ERROR', `Missing route parameter: ${name}`);
  }
  return value;
}
