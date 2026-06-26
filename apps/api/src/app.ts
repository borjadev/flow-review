import { randomUUID } from 'node:crypto';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { AppConfig } from './config/config.js';
import type { AppContainer } from './container.js';
import type { Logger } from './shared/infrastructure/logger.js';
import { createErrorHandler } from './shared/presentation/http/error-handler.js';
import { createRequestRouter } from './modules/requests/presentation/http/request.routes.js';
import { createUserRouter } from './modules/users/presentation/http/user.routes.js';

export interface CreateAppOptions {
  container: AppContainer;
  config: AppConfig;
  logger: Logger;
}

/**
 * Builds the Express application from an already-wired container. Knows nothing
 * about Prisma or how the use cases were constructed — that is the composition
 * root's job.
 */
export function createApp({ container, config, logger }: CreateAppOptions): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      allowedHeaders: ['Content-Type', 'X-User-Id', 'X-Request-Id'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id'];
        const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', provider: config.aiProvider });
  });
  app.use('/api/users', createUserRouter(container));
  app.use('/api/requests', createRequestRouter(container));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
  app.use(createErrorHandler(logger, config.isProduction));

  return app;
}
