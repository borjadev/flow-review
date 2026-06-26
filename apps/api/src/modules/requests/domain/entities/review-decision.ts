import { RejectionRequiresCommentError } from '../errors/request-errors.js';
import type { Classification } from './classification.js';

export type ReviewDecisionType = 'APPROVED' | 'REJECTED';

export interface ReviewDecisionProps {
  id: string;
  requestId: string;
  reviewerId: string;
  decision: ReviewDecisionType;
  originalClassification: Classification | null;
  finalClassification: Classification | null;
  comment: string | null;
  createdAt: Date;
}

/**
 * Records a single human review action over a request's classification. A
 * rejection always carries a mandatory comment; an approval may carry optional
 * corrections (reflected in {@link finalClassification}).
 */
export class ReviewDecision {
  private constructor(private readonly props: ReviewDecisionProps) {}

  static approve(params: {
    id: string;
    requestId: string;
    reviewerId: string;
    originalClassification: Classification;
    finalClassification: Classification;
    comment: string | null;
    createdAt: Date;
  }): ReviewDecision {
    return new ReviewDecision({
      id: params.id,
      requestId: params.requestId,
      reviewerId: params.reviewerId,
      decision: 'APPROVED',
      originalClassification: params.originalClassification,
      finalClassification: params.finalClassification,
      comment: params.comment,
      createdAt: params.createdAt,
    });
  }

  static reject(params: {
    id: string;
    requestId: string;
    reviewerId: string;
    originalClassification: Classification | null;
    comment: string;
    createdAt: Date;
  }): ReviewDecision {
    if (params.comment.trim().length === 0) {
      throw new RejectionRequiresCommentError();
    }
    return new ReviewDecision({
      id: params.id,
      requestId: params.requestId,
      reviewerId: params.reviewerId,
      decision: 'REJECTED',
      originalClassification: params.originalClassification,
      finalClassification: null,
      comment: params.comment,
      createdAt: params.createdAt,
    });
  }

  static fromPersistence(props: ReviewDecisionProps): ReviewDecision {
    return new ReviewDecision(props);
  }

  get id(): string {
    return this.props.id;
  }

  get requestId(): string {
    return this.props.requestId;
  }

  get reviewerId(): string {
    return this.props.reviewerId;
  }

  get decision(): ReviewDecisionType {
    return this.props.decision;
  }

  get originalClassification(): Classification | null {
    return this.props.originalClassification;
  }

  get finalClassification(): Classification | null {
    return this.props.finalClassification;
  }

  get comment(): string | null {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
