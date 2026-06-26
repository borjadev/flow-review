import type { PaginatedResult } from '../application/pagination.js';
import type { Clock } from '../application/clock.js';
import type { IdGenerator } from '../application/id-generator.js';
import type { Classification } from '../../modules/requests/domain/entities/classification.js';
import type { ReviewDecision } from '../../modules/requests/domain/entities/review-decision.js';
import type { SupportRequest } from '../../modules/requests/domain/entities/support-request.js';
import type {
  AnalysisRepository,
  RequestListFilters,
  RequestListItem,
  RequestRepository,
  ReviewRepository,
  StoredAnalysis,
} from '../../modules/requests/application/ports/repositories.js';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../modules/requests/application/ports/unit-of-work.js';
import type { AuditLog } from '../../modules/audit/application/audit-log.js';
import type { AuditEvent } from '../../modules/audit/domain/audit-event.js';
import type { UserRepository } from '../../modules/users/application/user-repository.js';
import type { User } from '../../modules/users/domain/user.js';

/**
 * Shared in-memory store backing the test doubles. All repositories read and
 * write the same instance so cross-aggregate data stays consistent within a test.
 */
export class InMemoryDatabase {
  readonly requests = new Map<string, SupportRequest>();
  readonly analyses: StoredAnalysis[] = [];
  readonly reviews: ReviewDecision[] = [];
  readonly audit: AuditEvent[] = [];
}

export class InMemoryRequestRepository implements RequestRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async save(request: SupportRequest): Promise<void> {
    this.db.requests.set(request.id, request);
  }

  async findById(id: string): Promise<SupportRequest | null> {
    return this.db.requests.get(id) ?? null;
  }

  async list(filters: RequestListFilters): Promise<PaginatedResult<RequestListItem>> {
    const all = [...this.db.requests.values()].map((request) => ({
      request,
      latestClassification: this.latestFor(request.id),
    }));

    const filtered = all.filter(({ request, latestClassification }) => {
      if (filters.status && request.status !== filters.status) return false;
      if (filters.category && latestClassification?.category !== filters.category) return false;
      if (filters.priority && latestClassification?.priority !== filters.priority) return false;
      return true;
    });

    filtered.sort((a, b) => b.request.createdAt.getTime() - a.request.createdAt.getTime());

    const start = (filters.page - 1) * filters.pageSize;
    return {
      items: filtered.slice(start, start + filters.pageSize),
      page: filters.page,
      pageSize: filters.pageSize,
      total: filtered.length,
    };
  }

  private latestFor(requestId: string): Classification | null {
    const matches = this.db.analyses.filter((a) => a.requestId === requestId);
    return matches.length > 0 ? (matches[matches.length - 1]?.classification ?? null) : null;
  }
}

export class InMemoryAnalysisRepository implements AnalysisRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async save(analysis: StoredAnalysis): Promise<void> {
    this.db.analyses.push(analysis);
  }

  async findLatestByRequestId(requestId: string): Promise<Classification | null> {
    const matches = this.db.analyses.filter((a) => a.requestId === requestId);
    return matches.length > 0 ? (matches[matches.length - 1]?.classification ?? null) : null;
  }

  async listByRequestId(requestId: string): Promise<Classification[]> {
    return this.db.analyses
      .filter((a) => a.requestId === requestId)
      .map((a) => a.classification);
  }
}

export class InMemoryReviewRepository implements ReviewRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async save(decision: ReviewDecision): Promise<void> {
    this.db.reviews.push(decision);
  }

  async listByRequestId(requestId: string): Promise<ReviewDecision[]> {
    return this.db.reviews.filter((d) => d.requestId === requestId);
  }
}

export class InMemoryAuditLog implements AuditLog {
  constructor(private readonly db: InMemoryDatabase) {}

  async record(event: AuditEvent): Promise<void> {
    this.db.audit.push(event);
  }

  async listByRequestId(requestId: string): Promise<AuditEvent[]> {
    return this.db.audit
      .filter((e) => e.requestId === requestId)
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  }
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  constructor(seed: User[] = []) {
    for (const user of seed) {
      this.users.set(user.id, user);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async list(): Promise<User[]> {
    return [...this.users.values()];
  }
}

/** In-memory unit of work — runs the work against the shared repositories. */
export class InMemoryUnitOfWork implements UnitOfWork {
  constructor(private readonly repos: TransactionalRepositories) {}

  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return work(this.repos);
  }
}

export class FixedClock implements Clock {
  constructor(private current: Date = new Date('2026-01-01T00:00:00.000Z')) {}

  now(): Date {
    return this.current;
  }

  set(date: Date): void {
    this.current = date;
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'id') {}

  next(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
