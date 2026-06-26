import { Prisma } from '@prisma/client';
import type {
  AIAnalysis as PrismaAIAnalysis,
  ReviewDecision as PrismaReviewDecision,
  SupportRequest as PrismaSupportRequest,
} from '@prisma/client';
import { Classification } from '../../../domain/entities/classification.js';
import { ReviewDecision } from '../../../domain/entities/review-decision.js';
import { SupportRequest } from '../../../domain/entities/support-request.js';
import { ConfidenceScore } from '../../../domain/value-objects/confidence-score.js';
import { EmailAddress } from '../../../domain/value-objects/email-address.js';
import type { StoredAnalysis } from '../../../application/ports/repositories.js';
import {
  classificationToSnapshot,
  snapshotToClassification,
  type ClassificationSnapshot,
} from './classification-snapshot.js';

// --- SupportRequest ---------------------------------------------------------

export function requestToDomain(row: PrismaSupportRequest): SupportRequest {
  return SupportRequest.fromPersistence({
    id: row.id,
    requesterName: row.requesterName,
    requesterEmail: EmailAddress.of(row.requesterEmail),
    subject: row.subject,
    description: row.description,
    status: row.status,
    createdBy: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function requestToCreateData(request: SupportRequest): Prisma.SupportRequestUncheckedCreateInput {
  return {
    id: request.id,
    requesterName: request.requesterName,
    requesterEmail: request.requesterEmail.value,
    subject: request.subject,
    description: request.description,
    status: request.status,
    createdById: request.createdBy,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export function requestToUpdateData(request: SupportRequest): Prisma.SupportRequestUncheckedUpdateInput {
  return {
    status: request.status,
    updatedAt: request.updatedAt,
  };
}

// --- Classification / AIAnalysis -------------------------------------------

export function analysisToDomain(row: PrismaAIAnalysis): Classification {
  return Classification.create({
    category: row.category,
    priority: row.priority,
    department: row.department,
    summary: row.summary,
    suggestedResponse: row.suggestedResponse,
    confidenceScore: ConfidenceScore.of(row.confidenceScore),
    provider: row.provider,
    model: row.model,
    createdAt: row.createdAt,
  });
}

export function analysisToCreateData(analysis: StoredAnalysis): Prisma.AIAnalysisUncheckedCreateInput {
  const c = analysis.classification;
  return {
    id: analysis.id,
    requestId: analysis.requestId,
    category: c.category,
    priority: c.priority,
    department: c.department,
    summary: c.summary,
    suggestedResponse: c.suggestedResponse,
    confidenceScore: c.confidenceScore.value,
    provider: c.provider,
    model: c.model,
    createdAt: c.createdAt,
  };
}

// --- ReviewDecision ---------------------------------------------------------

export function reviewToDomain(row: PrismaReviewDecision): ReviewDecision {
  const original = row.originalClassification
    ? snapshotToClassification(row.originalClassification as unknown as ClassificationSnapshot)
    : null;
  const final = row.finalClassification
    ? snapshotToClassification(row.finalClassification as unknown as ClassificationSnapshot)
    : null;

  return ReviewDecision.fromPersistence({
    id: row.id,
    requestId: row.requestId,
    reviewerId: row.reviewerId,
    decision: row.decision,
    originalClassification: original,
    finalClassification: final,
    comment: row.comment,
    createdAt: row.createdAt,
  });
}

export function reviewToCreateData(
  decision: ReviewDecision,
): Prisma.ReviewDecisionUncheckedCreateInput {
  return {
    id: decision.id,
    requestId: decision.requestId,
    reviewerId: decision.reviewerId,
    decision: decision.decision,
    comment: decision.comment,
    originalClassification: decision.originalClassification
      ? (classificationToSnapshot(decision.originalClassification) as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    finalClassification: decision.finalClassification
      ? (classificationToSnapshot(decision.finalClassification) as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    createdAt: decision.createdAt,
  };
}
