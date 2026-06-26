import type { Category, Priority } from '../../domain/value-objects/enums.js';
import type { RequestStatus } from '../../domain/value-objects/request-status.js';
import type { PaginatedView, RequestSummaryView } from '../dto/views.js';
import { toRequestSummaryView } from '../mappers/view-mapper.js';
import type { RequestRepository } from '../ports/repositories.js';

export interface ListRequestsQuery {
  status?: RequestStatus;
  category?: Category;
  priority?: Priority;
  page: number;
  pageSize: number;
}

export class ListRequestsUseCase {
  constructor(private readonly requests: RequestRepository) {}

  async execute(query: ListRequestsQuery): Promise<PaginatedView<RequestSummaryView>> {
    const result = await this.requests.list({
      status: query.status,
      category: query.category,
      priority: query.priority,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items: result.items.map(toRequestSummaryView),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
  }
}
