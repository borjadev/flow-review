import type { Category, Department, Priority } from '../../domain/value-objects/enums.js';
import type { RequestStatus } from '../../domain/value-objects/request-status.js';
import type { ReviewDecisionType } from '../../domain/entities/review-decision.js';
import type { AuditEventType } from '../../../audit/domain/audit-event.js';

/**
 * Stable output DTOs ("views") returned by use cases. They use domain enum
 * types (identical literals to the HTTP contract) so the application layer
 * stays free of the contracts package and of Zod. Dates are ISO strings.
 */

export interface ClassificationView {
  category: Category;
  priority: Priority;
  department: Department;
  summary: string;
  suggestedResponse: string;
  confidenceScore: number;
  provider: string;
  model: string;
  createdAt: string;
}

export interface RoutingView {
  department: Department;
  flaggedForPriorityReview: boolean;
  reason: string;
}

export interface ReviewDecisionView {
  id: string;
  reviewerId: string;
  decision: ReviewDecisionType;
  comment: string | null;
  originalClassification: ClassificationView | null;
  finalClassification: ClassificationView | null;
  createdAt: string;
}

export interface RequestSummaryView {
  id: string;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  status: RequestStatus;
  category: Category | null;
  priority: Priority | null;
  department: Department | null;
  createdAt: string;
}

export interface RequestDetailsView {
  id: string;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  description: string;
  status: RequestStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  latestClassification: ClassificationView | null;
  routing: RoutingView | null;
  analyses: ClassificationView[];
  decisions: ReviewDecisionView[];
}

export interface UserView {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditEventView {
  id: string;
  eventType: AuditEventType;
  actorId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface PaginatedView<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
