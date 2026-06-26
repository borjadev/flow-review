import type { Department } from '../../domain/value-objects/enums.js';
import type { ClassificationResult } from '../ports/request-classifier.js';

export interface RoutingDecision {
  department: Department;
  /** True when the request should be surfaced prominently to reviewers. */
  flaggedForPriorityReview: boolean;
  reason: string;
}

/**
 * Strategy encapsulating the post-classification routing policy. Kept separate
 * from the classifier so the "where does this go" decision can evolve
 * independently from the "what is this" decision.
 */
export interface RoutingStrategy {
  decide(classification: ClassificationResult): RoutingDecision;
}

/**
 * Default routing policy:
 *  - Low confidence  -> fall back to GENERAL_SUPPORT (a human picks the queue).
 *  - Otherwise       -> respect the proposed department.
 *  - URGENT priority -> always flag for prominent review.
 */
export class ConfidenceAwareRoutingStrategy implements RoutingStrategy {
  constructor(private readonly confidenceThreshold: number) {}

  decide(classification: ClassificationResult): RoutingDecision {
    const flaggedForPriorityReview = classification.priority === 'URGENT';

    if (classification.confidenceScore < this.confidenceThreshold) {
      return {
        department: 'GENERAL_SUPPORT',
        flaggedForPriorityReview,
        reason: `Confidence ${classification.confidenceScore.toFixed(
          2,
        )} is below the ${this.confidenceThreshold} threshold; routed to general support for triage.`,
      };
    }

    return {
      department: classification.department,
      flaggedForPriorityReview,
      reason: flaggedForPriorityReview
        ? 'Confident classification; flagged for priority review due to URGENT priority.'
        : 'Confident classification; routed to the proposed department.',
    };
  }
}
