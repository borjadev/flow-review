import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../../../../../config/config.js';
import { buildComposition, type Composition } from '../../../../../composition-root.js';

/**
 * Integration tests exercising the real Prisma repositories + unit of work
 * against a PostgreSQL database. Requires DATABASE_URL to point at a reachable
 * Postgres with migrations applied (see CI / docker-compose). Excluded from the
 * unit suite (`*.int.test.ts`).
 */
let composition: Composition;

const AGENT = 'user-alex';
const REVIEWER = 'user-taylor';

async function reset(): Promise<void> {
  const { prisma } = composition;
  await prisma.auditEvent.deleteMany();
  await prisma.reviewDecision.deleteMany();
  await prisma.supportRequest.updateMany({ data: { latestAnalysisId: null } });
  await prisma.aIAnalysis.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.create({ data: { id: AGENT, name: 'Alex', email: 'alex@flow.dev', role: 'Agent' } });
  await prisma.user.create({ data: { id: REVIEWER, name: 'Taylor', email: 'taylor@flow.dev', role: 'Reviewer' } });
}

beforeAll(() => {
  composition = buildComposition(loadConfig());
});

afterAll(async () => {
  await composition.prisma.$disconnect();
});

beforeEach(async () => {
  await reset();
});

function newRequest() {
  return composition.container.createRequest.execute({
    requesterName: 'Emma Watson',
    requesterEmail: 'emma@acme.com',
    subject: 'Unexpected invoice charge',
    description: 'We were charged twice for the same subscription payment.',
    actorId: AGENT,
  });
}

describe('Prisma repositories (integration)', () => {
  it('persists a full create -> classify -> approve cycle with audit trail', async () => {
    const { container } = composition;
    const created = await newRequest();

    const classified = await container.classifyRequest.execute({ requestId: created.id, actorId: AGENT });
    expect(classified.status).toBe('AWAITING_REVIEW');
    expect(classified.latestClassification?.category).toBe('BILLING');

    const approved = await container.reviewRequestClassification.execute({
      requestId: created.id,
      reviewerId: REVIEWER,
      decision: 'APPROVED',
      comment: 'Looks correct.',
    });
    expect(approved.status).toBe('APPROVED');

    const details = await container.getRequestDetails.execute({ requestId: created.id });
    expect(details.analyses).toHaveLength(1);
    expect(details.decisions).toHaveLength(1);

    const audit = await container.getRequestAuditLog.execute({ requestId: created.id });
    expect(audit.map((e) => e.eventType)).toEqual([
      'REQUEST_CREATED',
      'CLASSIFICATION_STARTED',
      'CLASSIFICATION_COMPLETED',
      'CLASSIFICATION_APPROVED',
    ]);
  });

  it('preserves previous analyses across a reject + retry', async () => {
    const { container } = composition;
    const created = await newRequest();
    await container.classifyRequest.execute({ requestId: created.id, actorId: AGENT });
    await container.reviewRequestClassification.execute({
      requestId: created.id,
      reviewerId: REVIEWER,
      decision: 'REJECTED',
      comment: 'Re-run please.',
    });
    const retried = await container.retryRequestClassification.execute({ requestId: created.id, actorId: AGENT });

    expect(retried.status).toBe('AWAITING_REVIEW');
    expect(retried.analyses).toHaveLength(2);
  });

  it('lists and filters by status', async () => {
    const { container } = composition;
    await newRequest();
    const second = await newRequest();
    await container.classifyRequest.execute({ requestId: second.id, actorId: AGENT });

    const awaiting = await container.listRequests.execute({ page: 1, pageSize: 10, status: 'AWAITING_REVIEW' });
    expect(awaiting.total).toBe(1);
    expect(awaiting.items[0]?.id).toBe(second.id);
  });
});
