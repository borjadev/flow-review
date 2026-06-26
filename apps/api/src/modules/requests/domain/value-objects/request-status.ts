import { DomainError } from '../../../../shared/domain/domain-error.js';

export const REQUEST_STATUSES = [
  'SUBMITTED',
  'ANALYSING',
  'AWAITING_REVIEW',
  'APPROVED',
  'REJECTED',
  'CLASSIFICATION_FAILED',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/**
 * Single source of truth for the workflow's allowed transitions. The lightweight
 * state machine lives here as an explicit table rather than a class-per-state,
 * because states differ in their *allowed transitions*, not in large
 * polymorphic behavior (see ADR-0003).
 */
const ALLOWED_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  SUBMITTED: ['ANALYSING'],
  ANALYSING: ['AWAITING_REVIEW', 'CLASSIFICATION_FAILED'],
  AWAITING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: ['ANALYSING'],
  CLASSIFICATION_FAILED: ['ANALYSING'],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export class InvalidStateTransitionError extends DomainError {
  readonly code = 'INVALID_STATE_TRANSITION';

  constructor(
    public readonly from: RequestStatus,
    public readonly to: RequestStatus,
  ) {
    super(`Cannot transition support request from ${from} to ${to}`);
  }
}
