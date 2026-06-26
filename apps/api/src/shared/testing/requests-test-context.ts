import { User } from '../../modules/users/domain/user.js';
import { ConfidenceAwareRoutingStrategy } from '../../modules/requests/application/services/routing-strategy.js';
import { AuditTrailRecorder } from '../../modules/requests/application/services/audit-trail-recorder.js';
import { ClassificationRunner } from '../../modules/requests/application/services/classification-runner.js';
import { RequestDetailsAssembler } from '../../modules/requests/application/services/request-details-assembler.js';
import { CreateRequestUseCase } from '../../modules/requests/application/use-cases/create-request.use-case.js';
import { ListRequestsUseCase } from '../../modules/requests/application/use-cases/list-requests.use-case.js';
import { GetRequestDetailsUseCase } from '../../modules/requests/application/use-cases/get-request-details.use-case.js';
import { ClassifyRequestUseCase } from '../../modules/requests/application/use-cases/classify-request.use-case.js';
import { RetryRequestClassificationUseCase } from '../../modules/requests/application/use-cases/retry-request-classification.use-case.js';
import { ReviewRequestClassificationUseCase } from '../../modules/requests/application/use-cases/review-request-classification.use-case.js';
import { GetRequestAuditLogUseCase } from '../../modules/requests/application/use-cases/get-request-audit-log.use-case.js';
import { ListDemoUsersUseCase } from '../../modules/users/application/list-demo-users.use-case.js';
import type { AppContainer } from '../../container.js';
import {
  FixedClock,
  InMemoryAnalysisRepository,
  InMemoryAuditLog,
  InMemoryDatabase,
  InMemoryRequestRepository,
  InMemoryReviewRepository,
  InMemoryUnitOfWork,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from './in-memory-adapters.js';
import { StubClassifier } from './stub-classifier.js';

const DEMO_USERS = [
  User.fromPersistence({ id: 'agent-1', name: 'Alex Morgan', email: 'alex@flow.dev', role: 'Request Agent' }),
  User.fromPersistence({ id: 'reviewer-1', name: 'Taylor Kim', email: 'taylor@flow.dev', role: 'Reviewer' }),
];

/**
 * Wires the full requests slice with in-memory adapters. Mirrors the production
 * composition root but with deterministic doubles, so application use cases can
 * be exercised end-to-end without any framework or database.
 */
export function buildRequestsTestContext(options: { confidenceThreshold?: number } = {}) {
  const db = new InMemoryDatabase();
  const clock = new FixedClock();
  const ids = new SequentialIdGenerator();
  const classifier = new StubClassifier();

  const requests = new InMemoryRequestRepository(db);
  const analyses = new InMemoryAnalysisRepository(db);
  const reviews = new InMemoryReviewRepository(db);
  const audit = new InMemoryAuditLog(db);
  const users = new InMemoryUserRepository(DEMO_USERS);

  const unitOfWork = new InMemoryUnitOfWork({ requests, analyses, reviews, audit });
  const routing = new ConfidenceAwareRoutingStrategy(options.confidenceThreshold ?? 0.55);
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

  return {
    db,
    clock,
    ids,
    classifier,
    container,
    useCases: {
      create: container.createRequest,
      list: container.listRequests,
      details: container.getRequestDetails,
      classify: container.classifyRequest,
      retry: container.retryRequestClassification,
      review: container.reviewRequestClassification,
      auditLog: container.getRequestAuditLog,
      listUsers: container.listDemoUsers,
    },
  };
}

export type RequestsTestContext = ReturnType<typeof buildRequestsTestContext>;
