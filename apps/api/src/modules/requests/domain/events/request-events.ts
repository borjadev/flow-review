import type { DomainEvent } from '../../../../shared/domain/domain-event.js';
import type { Category, Department, Priority } from '../value-objects/enums.js';

/**
 * Compact snapshot of a classification carried inside completion events so the
 * audit trail can record what was proposed without reaching back into storage.
 */
export interface ClassificationEventSnapshot {
  readonly category: Category;
  readonly priority: Priority;
  readonly department: Department;
  readonly confidenceScore: number;
}

interface BaseRequestEvent extends DomainEvent {
  readonly aggregateId: string;
  readonly actorId: string | null;
  readonly occurredAt: Date;
}

export interface RequestCreated extends BaseRequestEvent {
  readonly name: 'RequestCreated';
  readonly subject: string;
}

export interface ClassificationStarted extends BaseRequestEvent {
  readonly name: 'ClassificationStarted';
}

export interface ClassificationRetried extends BaseRequestEvent {
  readonly name: 'ClassificationRetried';
}

export interface ClassificationCompleted extends BaseRequestEvent {
  readonly name: 'ClassificationCompleted';
  readonly classification: ClassificationEventSnapshot;
}

export interface ClassificationFailed extends BaseRequestEvent {
  readonly name: 'ClassificationFailed';
  readonly reason: string;
}

export interface RequestApproved extends BaseRequestEvent {
  readonly name: 'RequestApproved';
  readonly withChanges: boolean;
}

export interface RequestRejected extends BaseRequestEvent {
  readonly name: 'RequestRejected';
  readonly comment: string;
}

export type RequestDomainEvent =
  | RequestCreated
  | ClassificationStarted
  | ClassificationRetried
  | ClassificationCompleted
  | ClassificationFailed
  | RequestApproved
  | RequestRejected;
