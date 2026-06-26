import type { Prisma } from '@prisma/client';
import type { PaginatedResult } from '../../../../../shared/application/pagination.js';
import type { PrismaDb } from '../../../../../shared/infrastructure/prisma/prisma-client.js';
import type { SupportRequest } from '../../../domain/entities/support-request.js';
import type {
  RequestListFilters,
  RequestListItem,
  RequestRepository,
} from '../../../application/ports/repositories.js';
import { analysisToDomain, requestToCreateData, requestToDomain, requestToUpdateData } from './mappers.js';

export class PrismaRequestRepository implements RequestRepository {
  constructor(private readonly db: PrismaDb) {}

  async save(request: SupportRequest): Promise<void> {
    await this.db.supportRequest.upsert({
      where: { id: request.id },
      create: requestToCreateData(request),
      update: requestToUpdateData(request),
    });
  }

  async findById(id: string): Promise<SupportRequest | null> {
    const row = await this.db.supportRequest.findUnique({ where: { id } });
    return row ? requestToDomain(row) : null;
  }

  async list(filters: RequestListFilters): Promise<PaginatedResult<RequestListItem>> {
    const where: Prisma.SupportRequestWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.category || filters.priority) {
      const latest: Prisma.AIAnalysisWhereInput = {};
      if (filters.category) latest.category = filters.category;
      if (filters.priority) latest.priority = filters.priority;
      where.latestAnalysis = { is: latest };
    }

    const skip = (filters.page - 1) * filters.pageSize;
    const [rows, total] = await Promise.all([
      this.db.supportRequest.findMany({
        where,
        include: { latestAnalysis: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.pageSize,
      }),
      this.db.supportRequest.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        request: requestToDomain(row),
        latestClassification: row.latestAnalysis ? analysisToDomain(row.latestAnalysis) : null,
      })),
      page: filters.page,
      pageSize: filters.pageSize,
      total,
    };
  }
}
