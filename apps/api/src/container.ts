import type { CreateRequestUseCase } from './modules/requests/application/use-cases/create-request.use-case.js';
import type { ListRequestsUseCase } from './modules/requests/application/use-cases/list-requests.use-case.js';
import type { GetRequestDetailsUseCase } from './modules/requests/application/use-cases/get-request-details.use-case.js';
import type { ClassifyRequestUseCase } from './modules/requests/application/use-cases/classify-request.use-case.js';
import type { RetryRequestClassificationUseCase } from './modules/requests/application/use-cases/retry-request-classification.use-case.js';
import type { ReviewRequestClassificationUseCase } from './modules/requests/application/use-cases/review-request-classification.use-case.js';
import type { GetRequestAuditLogUseCase } from './modules/requests/application/use-cases/get-request-audit-log.use-case.js';
import type { ListDemoUsersUseCase } from './modules/users/application/list-demo-users.use-case.js';

/**
 * The set of use cases the HTTP layer depends on. Both the production
 * composition root (Prisma-backed) and the test harness (in-memory) build one of
 * these, so controllers are agnostic to how it was wired.
 */
export interface AppContainer {
  createRequest: CreateRequestUseCase;
  listRequests: ListRequestsUseCase;
  getRequestDetails: GetRequestDetailsUseCase;
  classifyRequest: ClassifyRequestUseCase;
  retryRequestClassification: RetryRequestClassificationUseCase;
  reviewRequestClassification: ReviewRequestClassificationUseCase;
  getRequestAuditLog: GetRequestAuditLogUseCase;
  listDemoUsers: ListDemoUsersUseCase;
}
