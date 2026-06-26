import { SupportRequest } from '../../modules/requests/domain/entities/support-request.js';
import type { ClassificationEventSnapshot } from '../../modules/requests/domain/events/request-events.js';

const DEFAULT_SNAPSHOT: ClassificationEventSnapshot = {
  category: 'BILLING',
  priority: 'HIGH',
  department: 'FINANCE',
  confidenceScore: 0.9,
};

/**
 * Test Data Builder for SupportRequest. Keeps tests readable by hiding the
 * mechanics of driving the aggregate through its lifecycle. Test-only — it is
 * deliberately kept out of the production source tree.
 */
export class SupportRequestBuilder {
  private id = 'req-1';
  private actor = 'agent-1';
  private now = new Date('2026-01-01T00:00:00.000Z');
  private input = {
    requesterName: 'Jane Doe',
    requesterEmail: 'jane@example.com',
    subject: 'Unexpected invoice charge',
    description: 'We were charged twice for the same subscription.',
    createdBy: 'agent-1',
  };

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withActor(actor: string): this {
    this.actor = actor;
    this.input.createdBy = actor;
    return this;
  }

  withSubject(subject: string): this {
    this.input.subject = subject;
    return this;
  }

  withEmail(email: string): this {
    this.input.requesterEmail = email;
    return this;
  }

  at(now: Date): this {
    this.now = now;
    return this;
  }

  build(): SupportRequest {
    return SupportRequest.create(this.input, this.id, this.now);
  }

  /** SUBMITTED → ANALYSING */
  buildAnalysing(): SupportRequest {
    const request = this.build();
    request.startClassification(this.actor, this.now);
    return request;
  }

  /** SUBMITTED → ANALYSING → AWAITING_REVIEW */
  buildAwaitingReview(snapshot: ClassificationEventSnapshot = DEFAULT_SNAPSHOT): SupportRequest {
    const request = this.buildAnalysing();
    request.completeClassification(snapshot, this.actor, this.now);
    return request;
  }

  /** ... → AWAITING_REVIEW → REJECTED */
  buildRejected(comment = 'Wrong department'): SupportRequest {
    const request = this.buildAwaitingReview();
    request.reject('reviewer-1', comment, this.now);
    return request;
  }

  /** SUBMITTED → ANALYSING → CLASSIFICATION_FAILED */
  buildFailed(reason = 'transient provider error'): SupportRequest {
    const request = this.buildAnalysing();
    request.failClassification(reason, this.actor, this.now);
    return request;
  }
}
