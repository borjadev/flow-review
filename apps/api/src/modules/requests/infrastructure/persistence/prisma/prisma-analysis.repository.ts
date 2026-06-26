import type { PrismaDb } from '../../../../../shared/infrastructure/prisma/prisma-client.js';
import type { Classification } from '../../../domain/entities/classification.js';
import type { AnalysisRepository, StoredAnalysis } from '../../../application/ports/repositories.js';
import { analysisToCreateData, analysisToDomain } from './mappers.js';

export class PrismaAnalysisRepository implements AnalysisRepository {
  constructor(private readonly db: PrismaDb) {}

  async save(analysis: StoredAnalysis): Promise<void> {
    await this.db.aIAnalysis.create({ data: analysisToCreateData(analysis) });
    // Maintain the denormalized "latest analysis" pointer for fast list/detail reads.
    await this.db.supportRequest.update({
      where: { id: analysis.requestId },
      data: { latestAnalysisId: analysis.id },
    });
  }

  async findLatestByRequestId(requestId: string): Promise<Classification | null> {
    const row = await this.db.supportRequest.findUnique({
      where: { id: requestId },
      include: { latestAnalysis: true },
    });
    return row?.latestAnalysis ? analysisToDomain(row.latestAnalysis) : null;
  }

  async listByRequestId(requestId: string): Promise<Classification[]> {
    const rows = await this.db.aIAnalysis.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(analysisToDomain);
  }
}
