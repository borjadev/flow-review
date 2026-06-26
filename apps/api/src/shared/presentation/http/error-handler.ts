import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { Logger } from '../../infrastructure/logger.js';
import { ApplicationError, NotFoundError } from '../../application/application-error.js';
import { DomainError } from '../../domain/domain-error.js';
import { InvalidStateTransitionError } from '../../../modules/requests/domain/value-objects/request-status.js';
import { HttpError } from './http-error.js';

interface ErrorBody {
  status: number;
  code: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
}

function classify(error: unknown): ErrorBody {
  if (error instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  if (error instanceof HttpError) {
    return { status: error.status, code: error.code, message: error.message, details: error.details };
  }
  if (error instanceof InvalidStateTransitionError) {
    return { status: 409, code: error.code, message: error.message };
  }
  if (error instanceof NotFoundError) {
    return { status: 404, code: error.code, message: error.message };
  }
  if (error instanceof DomainError) {
    // Other broken business invariants are unprocessable client requests.
    return { status: 422, code: error.code, message: error.message };
  }
  if (error instanceof ApplicationError) {
    return { status: 500, code: error.code, message: error.message };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
}

/**
 * Centralized error handler producing the stable error envelope. Stack traces
 * are never sent to clients; 5xx errors are logged with full detail.
 */
export function createErrorHandler(logger: Logger, isProduction: boolean): ErrorRequestHandler {
  // Express identifies error handlers by their 4-arg arity; `next` must stay.
  return (error, req, res, _next) => {
    const body = classify(error);

    if (body.status >= 500) {
      logger.error({ err: error, requestId: req.id, path: req.path }, 'request failed');
    } else {
      logger.warn({ code: body.code, requestId: req.id, path: req.path }, 'request rejected');
    }

    const payload: ErrorBody = isProduction && body.status >= 500
      ? { status: body.status, code: body.code, message: 'Internal server error' }
      : body;

    res.status(body.status).json({
      error: { code: payload.code, message: payload.message, ...(payload.details ? { details: payload.details } : {}) },
    });
  };
}
