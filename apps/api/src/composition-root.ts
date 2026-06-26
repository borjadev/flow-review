import type { PrismaClient } from '@prisma/client';
import type { AppConfig } from './config/config.js';
import type { AppContainer } from './container.js';
import { createLogger, type Logger } from './shared/infrastructure/logger.js';
import { createPrismaClient } from './shared/infrastructure/prisma/prisma-client.js';
import { SystemClock } from './shared/infrastructure/system-clock.js';
import { UuidIdGenerator } from './shared/infrastructure/uuid-id-generator.js';
import { ConfidenceAwareRoutingStrategy } from './modules/requests/application/services/routing-strategy.js';
import { AuditTrailRecorder } from './modules/requests/application/services/audit-trail-recorder.js';
import { ClassificationRunner } from './modules/requests/application/services/classification-runner.js';
import { RequestDetailsAssembler } from './modules/requests/application/services/request-details-assembler.js';
import { CreateRequestUseCase } from './modules/requests/application/use-cases/create-request.use-case.js';
import { ListRequestsUseCase } from './modules/requests/application/use-cases/list-requests.use-case.js';
import { GetRequestDetailsUseCase } from './modules/requests/application/use-cases/get-request-details.use-case.js';
import { ClassifyRequestUseCase } from './modules/requests/application/use-cases/classify-request.use-case.js';
import { RetryRequestClassificationUseCase } from './modules/requests/application/use-cases/retry-request-classification.use-case.js';
import { ReviewRequestClassificationUseCase } from './modules/requests/application/use-cases/review-request-classification.use-case.js';
import { GetRequestAuditLogUseCase } from './modules/requests/application/use-cases/get-request-audit-log.use-case.js';
import { ListDemoUsersUseCase } from './modules/users/application/list-demo-users.use-case.js';
import { createRequestClassifier } from './modules/requests/infrastructure/ai/classifier-factory.js';
import { PrismaRequestRepository } from './modules/requests/infrastructure/persistence/prisma/prisma-request.repository.js';
import { PrismaAnalysisRepository } from './modules/requests/infrastructure/persistence/prisma/prisma-analysis.repository.js';
import { PrismaReviewRepository } from './modules/requests/infrastructure/persistence/prisma/prisma-review.repository.js';
import { PrismaUnitOfWork } from './modules/requests/infrastructure/persistence/prisma/prisma-unit-of-work.js';
import { PrismaAuditLog } from './modules/audit/infrastructure/prisma-audit-log.js';
import { PrismaUserRepository } from './modules/users/infrastructure/prisma-user.repository.js';

export interface Composition {
  container: AppContainer;
  prisma: PrismaClient;
  logger: Logger;
}

/**
 * The composition root: the single place where concrete infrastructure is
 * constructed and wired to the application. Dependency injection is manual and
 * explicit — no DI container is used.
 */
export function buildComposition(config: AppConfig): Composition {
  const logger = createLogger(config);
  const prisma = createPrismaClient(config.databaseUrl);

  const clock = new SystemClock();
  const ids = new UuidIdGenerator();
  const classifier = createRequestClassifier({ config, logger });

  // Read-side repositories use the root client (no surrounding transaction).
  const requests = new PrismaRequestRepository(prisma);
  const analyses = new PrismaAnalysisRepository(prisma);
  const reviews = new PrismaReviewRepository(prisma);
  const audit = new PrismaAuditLog(prisma);
  const users = new PrismaUserRepository(prisma);

  const unitOfWork = new PrismaUnitOfWork(prisma);
  const routing = new ConfidenceAwareRoutingStrategy(config.routingConfidenceThreshold);
  const auditTrail = new AuditTrailRecorder(ids);
  const assembler = new RequestDetailsAssembler(requests, analyses, reviews, routing);
  const runner = new ClassificationRunner(classifier, unitOfWork, auditTrail, clock, ids);

  const container: AppContainer = {
    createRequest: new CreateRequestUseCase(unitOfWork, auditTrail, assembler, clock, ids),
    listRequests: new ListRequestsUseCase(requests),
    getRequestDetails: new GetRequestDetailsUseCase(assembler),
    classifyRequest: new ClassifyRequestUseCase(requests, runner, assembler, clock),
    retryRequestClassification: new RetryRequestClassificationUseCase(
      requests,
      runner,
      assembler,
      clock,
    ),
    reviewRequestClassification: new ReviewRequestClassificationUseCase(
      requests,
      analyses,
      unitOfWork,
      auditTrail,
      assembler,
      clock,
      ids,
    ),
    getRequestAuditLog: new GetRequestAuditLogUseCase(requests, audit),
    listDemoUsers: new ListDemoUsersUseCase(users),
  };

  return { container, prisma, logger };
}
