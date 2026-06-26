import type { Classification } from '../../domain/entities/classification.js';
import type { ReviewDecision } from '../../domain/entities/review-decision.js';
import type { SupportRequest } from '../../domain/entities/support-request.js';
import type { AuditEvent } from '../../../audit/domain/audit-event.js';
import type { User } from '../../../users/domain/user.js';
import type { RoutingDecision } from '../services/routing-strategy.js';
import type { RequestListItem } from '../ports/repositories.js';
import type {
  AuditEventView,
  ClassificationView,
  RequestDetailsView,
  RequestSummaryView,
  ReviewDecisionView,
  RoutingView,
  UserView,
} from '../dto/views.js';

export function toClassificationView(classification: Classification): ClassificationView {
  return {
    category: classification.category,
    priority: classification.priority,
    department: classification.department,
    summary: classification.summary,
    suggestedResponse: classification.suggestedResponse,
    confidenceScore: classification.confidenceScore.value,
    provider: classification.provider,
    model: classification.model,
    createdAt: classification.createdAt.toISOString(),
  };
}

export function toRoutingView(routing: RoutingDecision): RoutingView {
  return {
    department: routing.department,
    flaggedForPriorityReview: routing.flaggedForPriorityReview,
    reason: routing.reason,
  };
}

export function toReviewDecisionView(decision: ReviewDecision): ReviewDecisionView {
  return {
    id: decision.id,
    reviewerId: decision.reviewerId,
    decision: decision.decision,
    comment: decision.comment,
    originalClassification: decision.originalClassification
      ? toClassificationView(decision.originalClassification)
      : null,
    finalClassification: decision.finalClassification
      ? toClassificationView(decision.finalClassification)
      : null,
    createdAt: decision.createdAt.toISOString(),
  };
}

export function toRequestSummaryView(item: RequestListItem): RequestSummaryView {
  const { request, latestClassification } = item;
  return {
    id: request.id,
    subject: request.subject,
    requesterName: request.requesterName,
    requesterEmail: request.requesterEmail.value,
    status: request.status,
    category: latestClassification?.category ?? null,
    priority: latestClassification?.priority ?? null,
    department: latestClassification?.department ?? null,
    createdAt: request.createdAt.toISOString(),
  };
}

export function toRequestDetailsView(params: {
  request: SupportRequest;
  analyses: Classification[];
  latestClassification: Classification | null;
  routing: RoutingDecision | null;
  decisions: ReviewDecision[];
}): RequestDetailsView {
  return {
    id: params.request.id,
    requesterName: params.request.requesterName,
    requesterEmail: params.request.requesterEmail.value,
    subject: params.request.subject,
    description: params.request.description,
    status: params.request.status,
    createdBy: params.request.createdBy,
    createdAt: params.request.createdAt.toISOString(),
    updatedAt: params.request.updatedAt.toISOString(),
    latestClassification: params.latestClassification
      ? toClassificationView(params.latestClassification)
      : null,
    routing: params.routing ? toRoutingView(params.routing) : null,
    analyses: params.analyses.map(toClassificationView),
    decisions: params.decisions.map(toReviewDecisionView),
  };
}

export function toAuditEventView(event: AuditEvent): AuditEventView {
  return {
    id: event.id,
    eventType: event.eventType,
    actorId: event.actorId,
    payload: event.payload,
    occurredAt: event.occurredAt.toISOString(),
  };
}

export function toUserView(user: User): UserView {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
