export const AUDIT_EVENT_TYPES = [
  'REQUEST_CREATED',
  'CLASSIFICATION_STARTED',
  'CLASSIFICATION_COMPLETED',
  'CLASSIFICATION_FAILED',
  'CLASSIFICATION_APPROVED',
  'CLASSIFICATION_APPROVED_WITH_CHANGES',
  'CLASSIFICATION_REJECTED',
  'CLASSIFICATION_RETRIED',
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export interface AuditEventProps {
  id: string;
  requestId: string;
  eventType: AuditEventType;
  actorId: string | null;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

/**
 * An explicit, append-only record of an action taken on a support request.
 * This is a history of actions for auditability — NOT the source of truth of
 * the aggregate (that remains the SupportRequest itself).
 */
export class AuditEvent {
  private constructor(private readonly props: AuditEventProps) {}

  static create(props: AuditEventProps): AuditEvent {
    return new AuditEvent({ ...props, payload: { ...props.payload } });
  }

  get id(): string {
    return this.props.id;
  }

  get requestId(): string {
    return this.props.requestId;
  }

  get eventType(): AuditEventType {
    return this.props.eventType;
  }

  get actorId(): string | null {
    return this.props.actorId;
  }

  get payload(): Record<string, unknown> {
    return this.props.payload;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }
}
