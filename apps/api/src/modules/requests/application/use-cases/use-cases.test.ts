import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildRequestsTestContext,
  type RequestsTestContext,
} from '../../../../shared/testing/requests-test-context.js';
import { NotFoundError } from '../../../../shared/application/application-error.js';
import { RejectionRequiresCommentError } from '../../domain/errors/request-errors.js';
import { InvalidStateTransitionError } from '../../domain/value-objects/request-status.js';
import {
  TransientClassifierError,
} from '../ports/request-classifier.js';

let ctx: RequestsTestContext;

beforeEach(() => {
  ctx = buildRequestsTestContext();
});

async function createRequest(overrides: Partial<{ subject: string; description: string }> = {}) {
  return ctx.useCases.create.execute({
    requesterName: 'Jane Doe',
    requesterEmail: 'jane@example.com',
    subject: overrides.subject ?? 'Unexpected invoice charge',
    description: overrides.description ?? 'We were charged twice.',
    actorId: 'agent-1',
  });
}

describe('CreateRequest', () => {
  it('creates a SUBMITTED request and writes a REQUEST_CREATED audit event', async () => {
    const view = await createRequest();
    expect(view.status).toBe('SUBMITTED');
    expect(view.latestClassification).toBeNull();

    const audit = await ctx.useCases.auditLog.execute({ requestId: view.id });
    expect(audit.map((e) => e.eventType)).toEqual(['REQUEST_CREATED']);
  });

  it('rejects an invalid requester email at the domain boundary', async () => {
    await expect(
      ctx.useCases.create.execute({
        requesterName: 'Jane',
        requesterEmail: 'not-an-email',
        subject: 'Hi',
        description: 'Body',
        actorId: 'agent-1',
      }),
    ).rejects.toThrow();
  });
});

describe('ClassifyRequest', () => {
  it('classifies a request, persists the analysis and awaits review', async () => {
    const created = await createRequest();
    ctx.classifier.returns({ category: 'BILLING', priority: 'URGENT', confidenceScore: 0.95 });

    const view = await ctx.useCases.classify.execute({
      requestId: created.id,
      actorId: 'agent-1',
    });

    expect(view.status).toBe('AWAITING_REVIEW');
    expect(view.latestClassification?.category).toBe('BILLING');
    expect(view.analyses).toHaveLength(1);
    expect(view.routing?.flaggedForPriorityReview).toBe(true);

    const audit = await ctx.useCases.auditLog.execute({ requestId: created.id });
    expect(audit.map((e) => e.eventType)).toEqual([
      'REQUEST_CREATED',
      'CLASSIFICATION_STARTED',
      'CLASSIFICATION_COMPLETED',
    ]);
  });

  it('routes low-confidence classifications to GENERAL_SUPPORT', async () => {
    const created = await createRequest();
    ctx.classifier.returns({ department: 'FINANCE', confidenceScore: 0.2 });

    const view = await ctx.useCases.classify.execute({
      requestId: created.id,
      actorId: 'agent-1',
    });

    expect(view.routing?.department).toBe('GENERAL_SUPPORT');
  });

  it('moves to CLASSIFICATION_FAILED when the classifier throws, never stuck in ANALYSING', async () => {
    const created = await createRequest();
    ctx.classifier.failWith(new TransientClassifierError('provider timeout'));

    const view = await ctx.useCases.classify.execute({
      requestId: created.id,
      actorId: 'agent-1',
    });

    expect(view.status).toBe('CLASSIFICATION_FAILED');
    expect(view.analyses).toHaveLength(0);

    const audit = await ctx.useCases.auditLog.execute({ requestId: created.id });
    expect(audit.map((e) => e.eventType)).toEqual([
      'REQUEST_CREATED',
      'CLASSIFICATION_STARTED',
      'CLASSIFICATION_FAILED',
    ]);
  });

  it('rejects classifying a request that is not SUBMITTED (409 via domain)', async () => {
    const created = await createRequest();
    await ctx.useCases.classify.execute({ requestId: created.id, actorId: 'agent-1' });

    await expect(
      ctx.useCases.classify.execute({ requestId: created.id, actorId: 'agent-1' }),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });

  it('throws NotFoundError for a missing request', async () => {
    await expect(
      ctx.useCases.classify.execute({ requestId: 'nope', actorId: 'agent-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ReviewRequestClassification', () => {
  async function awaitingReview() {
    const created = await createRequest();
    ctx.classifier.returns({ category: 'BILLING', priority: 'HIGH', department: 'FINANCE' });
    await ctx.useCases.classify.execute({ requestId: created.id, actorId: 'agent-1' });
    return created.id;
  }

  it('approves without changes', async () => {
    const id = await awaitingReview();
    const view = await ctx.useCases.review.execute({
      requestId: id,
      reviewerId: 'reviewer-1',
      decision: 'APPROVED',
      comment: 'Looks correct.',
    });

    expect(view.status).toBe('APPROVED');
    expect(view.decisions).toHaveLength(1);
    const audit = await ctx.useCases.auditLog.execute({ requestId: id });
    expect(audit.at(-1)?.eventType).toBe('CLASSIFICATION_APPROVED');
  });

  it('approves with corrections and records APPROVED_WITH_CHANGES', async () => {
    const id = await awaitingReview();
    const view = await ctx.useCases.review.execute({
      requestId: id,
      reviewerId: 'reviewer-1',
      decision: 'APPROVED',
      corrections: {
        category: 'TECHNICAL_SUPPORT',
        priority: 'URGENT',
        department: 'TECHNICAL_SUPPORT',
        summary: 'Reclassified as a technical incident.',
        suggestedResponse: 'Our engineers are investigating.',
      },
    });

    expect(view.status).toBe('APPROVED');
    const decision = view.decisions[0];
    expect(decision?.originalClassification?.category).toBe('BILLING');
    expect(decision?.finalClassification?.category).toBe('TECHNICAL_SUPPORT');

    const audit = await ctx.useCases.auditLog.execute({ requestId: id });
    expect(audit.at(-1)?.eventType).toBe('CLASSIFICATION_APPROVED_WITH_CHANGES');
  });

  it('rejects with a comment and allows retry afterwards', async () => {
    const id = await awaitingReview();
    const rejected = await ctx.useCases.review.execute({
      requestId: id,
      reviewerId: 'reviewer-1',
      decision: 'REJECTED',
      comment: 'Wrong department.',
    });
    expect(rejected.status).toBe('REJECTED');

    const retried = await ctx.useCases.retry.execute({ requestId: id, actorId: 'agent-1' });
    expect(retried.status).toBe('AWAITING_REVIEW');
    // The previous analysis is preserved alongside the new one.
    expect(retried.analyses).toHaveLength(2);
  });

  it('refuses a rejection with a blank comment', async () => {
    const id = await awaitingReview();
    await expect(
      ctx.useCases.review.execute({
        requestId: id,
        reviewerId: 'reviewer-1',
        decision: 'REJECTED',
        comment: '   ',
      }),
    ).rejects.toBeInstanceOf(RejectionRequiresCommentError);
  });

  it('refuses to review a request that is not awaiting review', async () => {
    const created = await createRequest();
    await expect(
      ctx.useCases.review.execute({
        requestId: created.id,
        reviewerId: 'reviewer-1',
        decision: 'APPROVED',
        comment: 'too early',
      }),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });
});

describe('ListRequests', () => {
  it('filters by status and paginates', async () => {
    const a = await createRequest({ subject: 'A' });
    await createRequest({ subject: 'B' });
    await ctx.useCases.classify.execute({ requestId: a.id, actorId: 'agent-1' });

    const submitted = await ctx.useCases.list.execute({ page: 1, pageSize: 10, status: 'SUBMITTED' });
    expect(submitted.total).toBe(1);
    expect(submitted.items[0]?.subject).toBe('B');

    const awaiting = await ctx.useCases.list.execute({
      page: 1,
      pageSize: 10,
      status: 'AWAITING_REVIEW',
    });
    expect(awaiting.total).toBe(1);
    expect(awaiting.items[0]?.category).toBe('BILLING');
  });
});

describe('ListDemoUsers', () => {
  it('returns the seeded demo users', async () => {
    const users = await ctx.useCases.listUsers.execute();
    expect(users.map((u) => u.id)).toContain('reviewer-1');
  });
});
