import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Correlation id assigned per request (set by pino-http / request-id middleware). */
      id?: string;
    }
  }
}
