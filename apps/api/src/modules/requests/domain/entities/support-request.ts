import { EmailAddress } from '../value-objects/email-address.js';
import {
  canTransition,
  InvalidStateTransitionError,
  type RequestStatus,
} from '../value-objects/request-status.js';
import type {
  ClassificationEventSnapshot,
  RequestDomainEvent,
} from '../events/request-events.js';

export interface SupportRequestProps {
  id: string;
  requesterName: string;
  requesterEmail: EmailAddress;
  subject: string;
  description: string;
  status: RequestStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupportRequestInput {
  requesterName: string;
  requesterEmail: string;
  subject: string;
  description: string;
  createdBy: string;
}

/**
 * Aggregate root of the requests module. It owns the lifecycle of a support
 * request and is the ONLY place where status transitions are decided. All
 * mutations go through explicit business methods — there are no public setters.
 * Each method validates the transition against the state machine and records a
 * domain event describing what happened.
 */
export class SupportRequest {
  private _status: RequestStatus;
  private _updatedAt: Date;
  private readonly _events: RequestDomainEvent[] = [];

  private constructor(private readonly props: SupportRequestProps) {
    this._status = props.status;
    this._updatedAt = props.updatedAt;
  }

  static create(input: CreateSupportRequestInput, id: string, now: Date): SupportRequest {
    const email = EmailAddress.of(input.requesterEmail);
    const request = new SupportRequest({
      id,
      requesterName: input.requesterName.trim(),
      requesterEmail: email,
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: 'SUBMITTED',
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    request.record({
      name: 'RequestCreated',
      aggregateId: id,
      actorId: input.createdBy,
      occurredAt: now,
      subject: request.props.subject,
    });
    return request;
  }

  static fromPersistence(props: SupportRequestProps): SupportRequest {
    return new SupportRequest(props);
  }

  // --- Business methods (state transitions) --------------------------------

  /** First classification attempt. Allowed only from SUBMITTED. */
  startClassification(actorId: string, now: Date): void {
    if (this._status !== 'SUBMITTED') {
      throw new InvalidStateTransitionError(this._status, 'ANALYSING');
    }
    this.transitionTo('ANALYSING', now);
    this.record({
      name: 'ClassificationStarted',
      aggregateId: this.props.id,
      actorId,
      occurredAt: now,
    });
  }

  /** Re-run classification after a rejection or a failure. */
  retryClassification(actorId: string, now: Date): void {
    if (this._status !== 'REJECTED' && this._status !== 'CLASSIFICATION_FAILED') {
      throw new InvalidStateTransitionError(this._status, 'ANALYSING');
    }
    this.transitionTo('ANALYSING', now);
    this.record({
      name: 'ClassificationRetried',
      aggregateId: this.props.id,
      actorId,
      occurredAt: now,
    });
  }

  /** Classification produced a proposal; awaiting human review. */
  completeClassification(
    snapshot: ClassificationEventSnapshot,
    actorId: string | null,
    now: Date,
  ): void {
    this.transitionTo('AWAITING_REVIEW', now);
    this.record({
      name: 'ClassificationCompleted',
      aggregateId: this.props.id,
      actorId,
      occurredAt: now,
      classification: snapshot,
    });
  }

  /** Classification failed (transient or permanent). Never leaves the request stuck. */
  failClassification(reason: string, actorId: string | null, now: Date): void {
    this.transitionTo('CLASSIFICATION_FAILED', now);
    this.record({
      name: 'ClassificationFailed',
      aggregateId: this.props.id,
      actorId,
      occurredAt: now,
      reason,
    });
  }

  /** Reviewer approves the (possibly corrected) classification. */
  approve(reviewerId: string, withChanges: boolean, now: Date): void {
    this.transitionTo('APPROVED', now);
    this.record({
      name: 'RequestApproved',
      aggregateId: this.props.id,
      actorId: reviewerId,
      occurredAt: now,
      withChanges,
    });
  }

  /** Reviewer rejects the classification with a mandatory comment. */
  reject(reviewerId: string, comment: string, now: Date): void {
    this.transitionTo('REJECTED', now);
    this.record({
      name: 'RequestRejected',
      aggregateId: this.props.id,
      actorId: reviewerId,
      occurredAt: now,
      comment,
    });
  }

  // --- Domain events --------------------------------------------------------

  pullDomainEvents(): RequestDomainEvent[] {
    const events = [...this._events];
    this._events.length = 0;
    return events;
  }

  private record(event: RequestDomainEvent): void {
    this._events.push(event);
  }

  private transitionTo(next: RequestStatus, now: Date): void {
    if (!canTransition(this._status, next)) {
      throw new InvalidStateTransitionError(this._status, next);
    }
    this._status = next;
    this._updatedAt = now;
  }

  // --- Accessors ------------------------------------------------------------

  get id(): string {
    return this.props.id;
  }

  get requesterName(): string {
    return this.props.requesterName;
  }

  get requesterEmail(): EmailAddress {
    return this.props.requesterEmail;
  }

  get subject(): string {
    return this.props.subject;
  }

  get description(): string {
    return this.props.description;
  }

  get status(): RequestStatus {
    return this._status;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
