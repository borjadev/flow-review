import { describe, expect, it } from 'vitest';
import { SupportRequestBuilder } from '../../../../shared/testing/support-request.builder.js';
import { InvalidStateTransitionError } from '../value-objects/request-status.js';
import type { ClassificationEventSnapshot } from '../events/request-events.js';

const NOW = new Date('2026-01-01T10:00:00.000Z');
const SNAPSHOT: ClassificationEventSnapshot = {
  category: 'BILLING',
  priority: 'HIGH',
  department: 'FINANCE',
  confidenceScore: 0.92,
};

describe('SupportRequest creation', () => {
  it('starts in SUBMITTED and records a RequestCreated event', () => {
    const request = new SupportRequestBuilder().build();
    expect(request.status).toBe('SUBMITTED');

    const events = request.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe('RequestCreated');
    expect(events[0]?.actorId).toBe('agent-1');
  });

  it('normalizes the requester email through the value object', () => {
    const request = new SupportRequestBuilder().withEmail('  JOHN@Doe.IO ').build();
    expect(request.requesterEmail.value).toBe('john@doe.io');
  });

  it('pulling events clears them (events are consumed once)', () => {
    const request = new SupportRequestBuilder().build();
    request.pullDomainEvents();
    expect(request.pullDomainEvents()).toHaveLength(0);
  });
});

describe('SupportRequest happy-path lifecycle', () => {
  it('SUBMITTED -> ANALYSING -> AWAITING_REVIEW -> APPROVED', () => {
    const request = new SupportRequestBuilder().build();
    request.pullDomainEvents();

    request.startClassification('agent-1', NOW);
    expect(request.status).toBe('ANALYSING');

    request.completeClassification(SNAPSHOT, 'agent-1', NOW);
    expect(request.status).toBe('AWAITING_REVIEW');

    request.approve('reviewer-1', false, NOW);
    expect(request.status).toBe('APPROVED');

    const names = request.pullDomainEvents().map((e) => e.name);
    expect(names).toEqual(['ClassificationStarted', 'ClassificationCompleted', 'RequestApproved']);
  });

  it('records whether an approval carried changes', () => {
    const request = new SupportRequestBuilder().buildAwaitingReview();
    request.pullDomainEvents();
    request.approve('reviewer-1', true, NOW);
    const event = request.pullDomainEvents()[0];
    expect(event?.name).toBe('RequestApproved');
    expect(event).toMatchObject({ withChanges: true });
  });
});

describe('SupportRequest invalid transitions', () => {
  it('cannot classify a request that is not SUBMITTED', () => {
    const request = new SupportRequestBuilder().buildAwaitingReview();
    expect(() => request.startClassification('agent-1', NOW)).toThrow(InvalidStateTransitionError);
  });

  it('cannot complete classification unless ANALYSING', () => {
    const request = new SupportRequestBuilder().build();
    expect(() => request.completeClassification(SNAPSHOT, 'agent-1', NOW)).toThrow(
      InvalidStateTransitionError,
    );
  });

  it('cannot approve a request that is not AWAITING_REVIEW', () => {
    const request = new SupportRequestBuilder().buildAnalysing();
    expect(() => request.approve('reviewer-1', false, NOW)).toThrow(InvalidStateTransitionError);
  });

  it('cannot modify an APPROVED request (terminal state)', () => {
    const request = new SupportRequestBuilder().buildAwaitingReview();
    request.approve('reviewer-1', false, NOW);
    expect(() => request.reject('reviewer-1', 'changed my mind', NOW)).toThrow(
      InvalidStateTransitionError,
    );
    expect(() => request.startClassification('agent-1', NOW)).toThrow(InvalidStateTransitionError);
    expect(() => request.retryClassification('agent-1', NOW)).toThrow(InvalidStateTransitionError);
  });
});

describe('SupportRequest rejection and retry', () => {
  it('rejects from AWAITING_REVIEW and can then retry classification', () => {
    const request = new SupportRequestBuilder().buildAwaitingReview();
    request.pullDomainEvents();

    request.reject('reviewer-1', 'Wrong department', NOW);
    expect(request.status).toBe('REJECTED');

    request.retryClassification('agent-1', NOW);
    expect(request.status).toBe('ANALYSING');

    const names = request.pullDomainEvents().map((e) => e.name);
    expect(names).toEqual(['RequestRejected', 'ClassificationRetried']);
  });

  it('fails classification from ANALYSING and never gets stuck', () => {
    const request = new SupportRequestBuilder().buildAnalysing();
    request.failClassification('provider timeout', 'agent-1', NOW);
    expect(request.status).toBe('CLASSIFICATION_FAILED');

    request.retryClassification('agent-1', NOW);
    expect(request.status).toBe('ANALYSING');
  });

  it('cannot retry from SUBMITTED (must use startClassification)', () => {
    const request = new SupportRequestBuilder().build();
    expect(() => request.retryClassification('agent-1', NOW)).toThrow(InvalidStateTransitionError);
  });
});
