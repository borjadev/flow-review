import type { AuditLog } from '../../../audit/application/audit-log.js';
import type {
  AnalysisRepository,
  RequestRepository,
  ReviewRepository,
} from './repositories.js';

/**
 * The set of repositories that participate in a single atomic write. They are
 * handed to the unit of work's callback already bound to the same transaction.
 */
export interface TransactionalRepositories {
  requests: RequestRepository;
  analyses: AnalysisRepository;
  reviews: ReviewRepository;
  audit: AuditLog;
}

/**
 * Minimal transaction boundary. Deliberately NOT a generic Unit of Work
 * framework: it exposes exactly the repositories these use cases need to commit
 * a request, its analysis, a review decision and audit events atomically.
 */
export interface UnitOfWork {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
