import { NotFoundError } from '../../../../shared/application/application-error.js';
import type { Clock } from '../../../../shared/application/clock.js';
import type { IdGenerator } from '../../../../shared/application/id-generator.js';
import { ReviewDecision } from '../../domain/entities/review-decision.js';
import type { ClassificationCorrections } from '../../domain/entities/classification.js';
import type { SupportRequest } from '../../domain/entities/support-request.js';
import type { RequestDetailsView } from '../dto/views.js';
import type { AnalysisRepository, RequestRepository } from '../ports/repositories.js';
import type { UnitOfWork } from '../ports/unit-of-work.js';
import type { AuditTrailRecorder } from '../services/audit-trail-recorder.js';
import type { RequestDetailsAssembler } from '../services/request-details-assembler.js';

export type ReviewRequestCommand =
  | {
      requestId: string;
      reviewerId: string;
      decision: 'APPROVED';
      comment?: string;
      corrections?: ClassificationCorrections;
    }
  | {
      requestId: string;
      reviewerId: string;
      decision: 'REJECTED';
      comment: string;
    };

/**
 * Applies a human review decision. The human decision always wins: on approval
 * the reviewer may correct any proposed field; on rejection a comment is
 * mandatory. Invalid state transitions surface as 409 via the aggregate.
 */
export class ReviewRequestClassificationUseCase {
  constructor(
    private readonly requests: RequestRepository,
    private readonly analyses: AnalysisRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly auditTrail: AuditTrailRecorder,
    private readonly assembler: RequestDetailsAssembler,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(command: ReviewRequestCommand): Promise<RequestDetailsView> {
    const request = await this.requests.findById(command.requestId);
    if (!request) {
      throw new NotFoundError('SupportRequest', command.requestId);
    }

    const original = await this.analyses.findLatestByRequestId(command.requestId);
    const now = this.clock.now();

    if (command.decision === 'APPROVED') {
      // Validate the state transition first so an out-of-state review surfaces
      // as 409, taking precedence over the (defensive) missing-analysis check.
      const withChanges =
        command.corrections && original ? original.differsFrom(command.corrections) : false;
      request.approve(command.reviewerId, withChanges, now);

      if (!original) {
        throw new NotFoundError('Classification', command.requestId);
      }
      const finalClassification = command.corrections
        ? original.withCorrections(command.corrections)
        : original;

      const decision = ReviewDecision.approve({
        id: this.ids.next(),
        requestId: command.requestId,
        reviewerId: command.reviewerId,
        originalClassification: original,
        finalClassification,
        comment: command.comment ?? null,
        createdAt: now,
      });

      await this.commit(request, decision);
    } else {
      request.reject(command.reviewerId, command.comment, now);

      const decision = ReviewDecision.reject({
        id: this.ids.next(),
        requestId: command.requestId,
        reviewerId: command.reviewerId,
        originalClassification: original,
        comment: command.comment,
        createdAt: now,
      });

      await this.commit(request, decision);
    }

    return this.assembler.assemble(command.requestId);
  }

  private async commit(request: SupportRequest, decision: ReviewDecision): Promise<void> {
    await this.unitOfWork.run(async (repos) => {
      await repos.requests.save(request);
      await repos.reviews.save(decision);
      await this.auditTrail.recordAll(request.pullDomainEvents(), repos.audit);
    });
  }
}
