import type { Request } from 'express';
import { HttpError } from './http-error.js';

/**
 * Extracts the acting user id from the `X-User-Id` header.
 *
 * NOTE: this is a DEMO mechanism only — it identifies "who is acting" for audit
 * purposes. It is NOT authentication and provides no security guarantees.
 */
export function requireActor(req: Request): string {
  const actorId = req.header('x-user-id');
  if (!actorId || actorId.trim().length === 0) {
    throw new HttpError(400, 'ACTOR_REQUIRED', 'The X-User-Id header is required');
  }
  return actorId.trim();
}
