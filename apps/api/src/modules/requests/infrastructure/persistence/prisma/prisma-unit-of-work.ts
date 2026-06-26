import type { PrismaClient } from '@prisma/client';
import { PrismaAuditLog } from '../../../../audit/infrastructure/prisma-audit-log.js';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../../application/ports/unit-of-work.js';
import { PrismaAnalysisRepository } from './prisma-analysis.repository.js';
import { PrismaRequestRepository } from './prisma-request.repository.js';
import { PrismaReviewRepository } from './prisma-review.repository.js';

/**
 * Runs a unit of work inside a real database transaction. The repositories
 * handed to the callback are all bound to the same transaction client, so the
 * request, its analysis, the review decision and audit events commit atomically.
 */
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) =>
      work({
        requests: new PrismaRequestRepository(tx),
        analyses: new PrismaAnalysisRepository(tx),
        reviews: new PrismaReviewRepository(tx),
        audit: new PrismaAuditLog(tx),
      }),
    );
  }
}
