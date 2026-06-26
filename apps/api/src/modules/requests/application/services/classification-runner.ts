import type { Clock } from '../../../../shared/application/clock.js';
import type { IdGenerator } from '../../../../shared/application/id-generator.js';
import { Classification } from '../../domain/entities/classification.js';
import type { SupportRequest } from '../../domain/entities/support-request.js';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.js';
import type { ClassificationEventSnapshot } from '../../domain/events/request-events.js';
import {
  ClassifierError,
  type ClassificationResult,
  type RequestClassifier,
} from '../ports/request-classifier.js';
import type { StoredAnalysis } from '../ports/repositories.js';
import type { UnitOfWork } from '../ports/unit-of-work.js';
import type { AuditTrailRecorder } from './audit-trail-recorder.js';

/**
 * Shared engine for running a classification attempt. Used by both the initial
 * classify and the retry use cases. The request must already have been
 * transitioned into ANALYSING by the caller (via start/retry).
 *
 * The external classifier call happens OUTSIDE the transaction; only the final
 * outcome (AWAITING_REVIEW + analysis, or CLASSIFICATION_FAILED) is persisted.
 * The request is therefore never left stuck in ANALYSING in the database.
 */
export class ClassificationRunner {
  constructor(
    private readonly classifier: RequestClassifier,
    private readonly unitOfWork: UnitOfWork,
    private readonly auditTrail: AuditTrailRecorder,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async run(request: SupportRequest, actorId: string): Promise<void> {
    const now = this.clock.now();

    let classification: Classification;
    try {
      const result = await this.classifier.classify({
        subject: request.subject,
        description: request.description,
        requesterName: request.requesterName,
      });
      classification = this.toClassification(result, now);
    } catch (error) {
      request.failClassification(this.failureReason(error), actorId, now);
      await this.persist(request, null);
      return;
    }

    request.completeClassification(this.snapshot(classification), actorId, now);
    await this.persist(request, {
      id: this.ids.next(),
      requestId: request.id,
      classification,
    });
  }

  private async persist(request: SupportRequest, analysis: StoredAnalysis | null): Promise<void> {
    await this.unitOfWork.run(async (repos) => {
      await repos.requests.save(request);
      if (analysis) {
        await repos.analyses.save(analysis);
      }
      await this.auditTrail.recordAll(request.pullDomainEvents(), repos.audit);
    });
  }

  private toClassification(result: ClassificationResult, now: Date): Classification {
    return Classification.create({
      category: result.category,
      priority: result.priority,
      department: result.department,
      summary: result.summary,
      suggestedResponse: result.suggestedResponse,
      confidenceScore: ConfidenceScore.of(result.confidenceScore),
      provider: result.provider,
      model: result.model,
      createdAt: now,
    });
  }

  private snapshot(classification: Classification): ClassificationEventSnapshot {
    return {
      category: classification.category,
      priority: classification.priority,
      department: classification.department,
      confidenceScore: classification.confidenceScore.value,
    };
  }

  private failureReason(error: unknown): string {
    if (error instanceof ClassifierError) {
      return error.message;
    }
    return 'Unexpected error during classification';
  }
}
