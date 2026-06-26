import { NotFoundError } from '../../../../shared/application/application-error.js';
import type {
  AnalysisRepository,
  RequestRepository,
  ReviewRepository,
} from '../ports/repositories.js';
import type { RoutingStrategy } from './routing-strategy.js';
import { toRequestDetailsView } from '../mappers/view-mapper.js';
import type { RequestDetailsView } from '../dto/views.js';

/**
 * Builds the full request detail view from its parts. Routing is derived on read
 * from the latest classification (it is not persisted separately — a deliberate
 * trade-off documented in the architecture notes).
 */
export class RequestDetailsAssembler {
  constructor(
    private readonly requests: RequestRepository,
    private readonly analyses: AnalysisRepository,
    private readonly reviews: ReviewRepository,
    private readonly routing: RoutingStrategy,
  ) {}

  async assemble(requestId: string): Promise<RequestDetailsView> {
    const request = await this.requests.findById(requestId);
    if (!request) {
      throw new NotFoundError('SupportRequest', requestId);
    }

    const [analyses, latest, decisions] = await Promise.all([
      this.analyses.listByRequestId(requestId),
      this.analyses.findLatestByRequestId(requestId),
      this.reviews.listByRequestId(requestId),
    ]);

    const routing = latest
      ? this.routing.decide({
          category: latest.category,
          priority: latest.priority,
          department: latest.department,
          summary: latest.summary,
          suggestedResponse: latest.suggestedResponse,
          confidenceScore: latest.confidenceScore.value,
          provider: latest.provider,
          model: latest.model,
        })
      : null;

    return toRequestDetailsView({
      request,
      analyses,
      latestClassification: latest,
      routing,
      decisions,
    });
  }
}
