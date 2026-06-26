import type { PrismaDb } from '../../../../../shared/infrastructure/prisma/prisma-client.js';
import type { ReviewDecision } from '../../../domain/entities/review-decision.js';
import type { ReviewRepository } from '../../../application/ports/repositories.js';
import { reviewToCreateData, reviewToDomain } from './mappers.js';

export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly db: PrismaDb) {}

  async save(decision: ReviewDecision): Promise<void> {
    await this.db.reviewDecision.create({ data: reviewToCreateData(decision) });
  }

  async listByRequestId(requestId: string): Promise<ReviewDecision[]> {
    const rows = await this.db.reviewDecision.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(reviewToDomain);
  }
}
