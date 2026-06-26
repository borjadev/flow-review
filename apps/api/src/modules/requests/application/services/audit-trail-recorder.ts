import type { IdGenerator } from '../../../../shared/application/id-generator.js';
import type { AuditLog } from '../../../audit/application/audit-log.js';
import { AuditEvent, type AuditEventType } from '../../../audit/domain/audit-event.js';
import type { RequestDomainEvent } from '../../domain/events/request-events.js';

/**
 * Translates domain events emitted by the SupportRequest aggregate into audit
 * records. This is the seam that decouples the audit side-effect from the
 * aggregate: the aggregate only declares *what happened*; this recorder decides
 * how it is written to the trail. Invoked inside the same transaction as the
 * state change, so the trail can never drift from the aggregate.
 */
export class AuditTrailRecorder {
  constructor(private readonly ids: IdGenerator) {}

  async recordAll(events: RequestDomainEvent[], audit: AuditLog): Promise<void> {
    for (const event of events) {
      await audit.record(this.toAuditEvent(event));
    }
  }

  private toAuditEvent(event: RequestDomainEvent): AuditEvent {
    const { eventType, payload } = this.describe(event);
    return AuditEvent.create({
      id: this.ids.next(),
      requestId: event.aggregateId,
      eventType,
      actorId: event.actorId,
      payload,
      occurredAt: event.occurredAt,
    });
  }

  private describe(event: RequestDomainEvent): {
    eventType: AuditEventType;
    payload: Record<string, unknown>;
  } {
    switch (event.name) {
      case 'RequestCreated':
        return { eventType: 'REQUEST_CREATED', payload: { subject: event.subject } };
      case 'ClassificationStarted':
        return { eventType: 'CLASSIFICATION_STARTED', payload: {} };
      case 'ClassificationRetried':
        return { eventType: 'CLASSIFICATION_RETRIED', payload: {} };
      case 'ClassificationCompleted':
        return {
          eventType: 'CLASSIFICATION_COMPLETED',
          payload: {
            category: event.classification.category,
            priority: event.classification.priority,
            department: event.classification.department,
            confidenceScore: event.classification.confidenceScore,
          },
        };
      case 'ClassificationFailed':
        return { eventType: 'CLASSIFICATION_FAILED', payload: { reason: event.reason } };
      case 'RequestApproved':
        return {
          eventType: event.withChanges
            ? 'CLASSIFICATION_APPROVED_WITH_CHANGES'
            : 'CLASSIFICATION_APPROVED',
          payload: {},
        };
      case 'RequestRejected':
        return { eventType: 'CLASSIFICATION_REJECTED', payload: { comment: event.comment } };
    }
  }
}
