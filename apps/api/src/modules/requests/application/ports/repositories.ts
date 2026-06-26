import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import type { Classification } from '../../domain/entities/classification.js';
import type { ReviewDecision } from '../../domain/entities/review-decision.js';
import type { SupportRequest } from '../../domain/entities/support-request.js';
import type { Category, Priority } from '../../domain/value-objects/enums.js';
import type { RequestStatus } from '../../domain/value-objects/request-status.js';

export interface RequestListFilters {
  status?: RequestStatus;
  category?: Category;
  priority?: Priority;
  page: number;
  pageSize: number;
}

/** Read model for the list view: a request plus its latest classification. */
export interface RequestListItem {
  request: SupportRequest;
  latestClassification: Classification | null;
}

export interface RequestRepository {
  save(request: SupportRequest): Promise<void>;
  findById(id: string): Promise<SupportRequest | null>;
  list(filters: RequestListFilters): Promise<PaginatedResult<RequestListItem>>;
}

/** A classification persisted together with the request it belongs to. */
export interface StoredAnalysis {
  id: string;
  requestId: string;
  classification: Classification;
}

export interface AnalysisRepository {
  /** Persists an analysis and updates the request's "latest analysis" pointer. */
  save(analysis: StoredAnalysis): Promise<void>;
  findLatestByRequestId(requestId: string): Promise<Classification | null>;
  listByRequestId(requestId: string): Promise<Classification[]>;
}

export interface ReviewRepository {
  save(decision: ReviewDecision): Promise<void>;
  listByRequestId(requestId: string): Promise<ReviewDecision[]>;
}
