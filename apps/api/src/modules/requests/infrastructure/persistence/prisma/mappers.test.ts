import { describe, expect, it } from 'vitest';
import type {
  AIAnalysis as PrismaAIAnalysis,
  SupportRequest as PrismaSupportRequest,
} from '@prisma/client';
import { analysisToDomain, requestToCreateData, requestToDomain } from './mappers.js';
import {
  classificationToSnapshot,
  snapshotToClassification,
} from './classification-snapshot.js';
import { Classification } from '../../../domain/entities/classification.js';
import { ConfidenceScore } from '../../../domain/value-objects/confidence-score.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const prismaRequest: PrismaSupportRequest = {
  id: 'req-1',
  requesterName: 'Jane Doe',
  requesterEmail: 'jane@example.com',
  subject: 'Invoice issue',
  description: 'Charged twice.',
  status: 'AWAITING_REVIEW',
  createdById: 'agent-1',
  createdAt: NOW,
  updatedAt: NOW,
  latestAnalysisId: 'an-1',
};

const prismaAnalysis: PrismaAIAnalysis = {
  id: 'an-1',
  requestId: 'req-1',
  category: 'BILLING',
  priority: 'HIGH',
  department: 'FINANCE',
  summary: 'Duplicate charge',
  suggestedResponse: 'We are looking into it.',
  confidenceScore: 0.91,
  provider: 'fake',
  model: 'rules-v1',
  createdAt: NOW,
};

describe('Prisma <-> domain mappers', () => {
  it('maps a SupportRequest row to a domain aggregate (email value object included)', () => {
    const domain = requestToDomain(prismaRequest);
    expect(domain.id).toBe('req-1');
    expect(domain.status).toBe('AWAITING_REVIEW');
    expect(domain.requesterEmail.value).toBe('jane@example.com');
  });

  it('maps a domain aggregate back to create data', () => {
    const domain = requestToDomain(prismaRequest);
    const data = requestToCreateData(domain);
    expect(data).toMatchObject({
      id: 'req-1',
      requesterEmail: 'jane@example.com',
      status: 'AWAITING_REVIEW',
      createdById: 'agent-1',
    });
  });

  it('maps an AIAnalysis row into a Classification with a ConfidenceScore VO', () => {
    const classification = analysisToDomain(prismaAnalysis);
    expect(classification.category).toBe('BILLING');
    expect(classification.confidenceScore.value).toBe(0.91);
  });

  it('round-trips a classification through its JSON snapshot', () => {
    const original = Classification.create({
      category: 'TECHNICAL_SUPPORT',
      priority: 'URGENT',
      department: 'TECHNICAL_SUPPORT',
      summary: 'Outage',
      suggestedResponse: 'Investigating',
      confidenceScore: ConfidenceScore.of(0.77),
      provider: 'openai',
      model: 'gpt-4o-mini',
      createdAt: NOW,
    });

    const restored = snapshotToClassification(classificationToSnapshot(original));
    expect(restored.category).toBe('TECHNICAL_SUPPORT');
    expect(restored.confidenceScore.value).toBe(0.77);
    expect(restored.createdAt.toISOString()).toBe(NOW.toISOString());
  });
});
