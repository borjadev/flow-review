import { randomUUID } from 'node:crypto';
import '../src/config/load-env.js';
import { loadConfig } from '../src/config/config.js';
import { buildComposition } from '../src/composition-root.js';

/**
 * Reproducible seed. It clears the database and recreates a realistic dataset
 * by driving the REAL use cases (with the deterministic fake classifier), so the
 * analyses, review decisions and audit trails are generated exactly as they
 * would be in production. Demo users are inserted directly (there is no
 * "create user" use case — users are a demo concept, not authentication).
 */
const USERS = [
  { id: 'user-alex', name: 'Alex Morgan', email: 'alex.morgan@flowreview.dev', role: 'Request Agent' },
  { id: 'user-taylor', name: 'Taylor Kim', email: 'taylor.kim@flowreview.dev', role: 'Reviewer' },
  { id: 'user-jordan', name: 'Jordan Lee', email: 'jordan.lee@flowreview.dev', role: 'Operations Manager' },
];

const AGENT = 'user-alex';
const REVIEWER = 'user-taylor';

async function main(): Promise<void> {
  const config = loadConfig();
  const { container, prisma, logger } = buildComposition(config);

  // --- Reset (FK-safe order) ---
  await prisma.auditEvent.deleteMany();
  await prisma.reviewDecision.deleteMany();
  await prisma.supportRequest.updateMany({ data: { latestAnalysisId: null } });
  await prisma.aIAnalysis.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.user.deleteMany();

  // --- Demo users ---
  for (const user of USERS) {
    await prisma.user.create({ data: user });
  }

  // 1. Billing — awaiting review
  await container.createRequest.execute({
    requesterName: 'Emma Watson',
    requesterEmail: 'emma@acme.com',
    subject: 'Unexpected invoice charge',
    description: 'We were charged twice for the same subscription payment. Please refund the duplicate charge.',
    actorId: AGENT,
  }).then((r) => container.classifyRequest.execute({ requestId: r.id, actorId: AGENT }));

  // 2. Technical — approved with corrections
  const technical = await container.createRequest.execute({
    requesterName: 'Liam Smith',
    requesterEmail: 'liam@beta.io',
    subject: 'Application crash after the latest update',
    description: 'The app throws an error and is unavailable after the update. This is a bug.',
    actorId: AGENT,
  });
  await container.classifyRequest.execute({ requestId: technical.id, actorId: AGENT });
  await container.reviewRequestClassification.execute({
    requestId: technical.id,
    reviewerId: REVIEWER,
    decision: 'APPROVED',
    comment: 'Confirmed as a technical incident; raising the priority.',
    corrections: {
      category: 'TECHNICAL_SUPPORT',
      priority: 'URGENT',
      department: 'TECHNICAL_SUPPORT',
      summary: 'Customer reports the application crashing after the latest update.',
      suggestedResponse: 'Our engineering team is actively investigating the crash. We will update you shortly.',
    },
  });

  // 3. Account — submitted (not yet classified)
  await container.createRequest.execute({
    requesterName: 'Olivia Brown',
    requesterEmail: 'olivia@gamma.net',
    subject: 'Cannot reset my password',
    description: 'I am locked out of my account and cannot sign in. The password reset email never arrives.',
    actorId: AGENT,
  });

  // 4. Sales — awaiting review
  await container.createRequest.execute({
    requesterName: 'Noah Davis',
    requesterEmail: 'noah@delta.co',
    subject: 'Request a pricing quote',
    description: 'We would like a demo and pricing for the enterprise plan and intend to purchase soon.',
    actorId: AGENT,
  }).then((r) => container.classifyRequest.execute({ requestId: r.id, actorId: AGENT }));

  // 5. Legal — rejected (will be retryable)
  const legal = await container.createRequest.execute({
    requesterName: 'Ava Wilson',
    requesterEmail: 'ava@epsilon.org',
    subject: 'Question about a contract clause',
    description: 'We need a legal review of a specific clause in our agreement terms before renewal.',
    actorId: AGENT,
  });
  await container.classifyRequest.execute({ requestId: legal.id, actorId: AGENT });
  await container.reviewRequestClassification.execute({
    requestId: legal.id,
    reviewerId: REVIEWER,
    decision: 'REJECTED',
    comment: 'Summary is too vague; please re-run the classification with more context.',
  });

  // 6. General — low-confidence, awaiting review (routed to general support)
  await container.createRequest.execute({
    requesterName: 'Sophia Miller',
    requesterEmail: 'sophia@zeta.com',
    subject: 'Hello team',
    description: 'Just wanted to say hello and share some general feedback about your service.',
    actorId: AGENT,
  }).then((r) => container.classifyRequest.execute({ requestId: r.id, actorId: AGENT }));

  // 7. Urgent technical — awaiting review (flagged for priority review)
  await container.createRequest.execute({
    requesterName: 'Mason Garcia',
    requesterEmail: 'mason@eta.dev',
    subject: 'Production is down',
    description: 'Urgent: production is down and we are blocked. Please help immediately, this is a crash in production.',
    actorId: AGENT,
  }).then((r) => container.classifyRequest.execute({ requestId: r.id, actorId: AGENT }));

  // 8. Ambiguous — classification "failed" (seed-only direct write to demo the retry path)
  const failed = await container.createRequest.execute({
    requesterName: 'Isabella Martinez',
    requesterEmail: 'isabella@theta.io',
    subject: 'Need some assistance',
    description: 'Something is not working as expected and I am not sure who to contact.',
    actorId: AGENT,
  });
  await prisma.supportRequest.update({
    where: { id: failed.id },
    data: { status: 'CLASSIFICATION_FAILED', updatedAt: new Date() },
  });
  await prisma.auditEvent.createMany({
    data: [
      { id: randomUUID(), requestId: failed.id, eventType: 'CLASSIFICATION_STARTED', actorId: AGENT, payload: {}, occurredAt: new Date() },
      { id: randomUUID(), requestId: failed.id, eventType: 'CLASSIFICATION_FAILED', actorId: AGENT, payload: { reason: 'Simulated provider outage' }, occurredAt: new Date() },
    ],
  });

  const total = await prisma.supportRequest.count();
  logger.info(`Seed complete: ${USERS.length} users and ${total} support requests.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
