import './config/load-env.js';
import { loadConfig } from './config/config.js';
import { buildComposition } from './composition-root.js';
import { createApp } from './app.js';

function main(): void {
  const config = loadConfig();
  const { container, prisma, logger } = buildComposition(config);
  const app = createApp({ container, config, logger });

  const server = app.listen(config.apiPort, () => {
    logger.info(`FlowReview API listening on port ${config.apiPort} (AI provider: ${config.aiProvider})`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
