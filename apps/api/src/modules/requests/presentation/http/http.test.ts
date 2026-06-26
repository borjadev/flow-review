import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../../../app.js';
import { createLogger } from '../../../../shared/infrastructure/logger.js';
import type { AppConfig } from '../../../../config/config.js';
import {
  buildRequestsTestContext,
  type RequestsTestContext,
} from '../../../../shared/testing/requests-test-context.js';

const TEST_CONFIG: AppConfig = {
  nodeEnv: 'test',
  isProduction: false,
  apiPort: 4000,
  corsOrigins: ['http://localhost:5173'],
  logVerbosePayloads: false,
  databaseUrl: 'postgresql://localhost/test',
  aiProvider: 'fake',
  openaiApiKey: undefined,
  openaiModel: 'gpt-4o-mini',
  classifierMaxRetries: 2,
  routingConfidenceThreshold: 0.55,
};

const AGENT = 'agent-1';
const REVIEWER = 'reviewer-1';

let ctx: RequestsTestContext;
let app: Express;

beforeEach(() => {
  ctx = buildRequestsTestContext();
  app = createApp({ container: ctx.container, config: TEST_CONFIG, logger: createLogger(TEST_CONFIG) });
});

const validBody = {
  requesterName: 'Jane Doe',
  requesterEmail: 'jane@example.com',
  subject: 'Unexpected invoice charge',
  description: 'We were charged twice for the same subscription.',
};

async function createRequest(): Promise<string> {
  const res = await request(app).post('/api/requests').set('X-User-Id', AGENT).send(validBody);
  return res.body.id as string;
}

describe('health & users', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/users lists demo users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.map((u: { id: string }) => u.id)).toContain(REVIEWER);
  });
});

describe('POST /api/requests', () => {
  it('creates a request (201) with a valid actor', async () => {
    const res = await request(app).post('/api/requests').set('X-User-Id', AGENT).send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('rejects a missing X-User-Id with 400', async () => {
    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ACTOR_REQUIRED');
  });

  it('rejects an invalid body with 400 and validation details', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('X-User-Id', AGENT)
      .send({ requesterName: '', requesterEmail: 'bad', subject: '', description: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});

describe('classification and review flow', () => {
  it('classify -> approve happy path', async () => {
    const id = await createRequest();

    const classified = await request(app)
      .post(`/api/requests/${id}/classify`)
      .set('X-User-Id', AGENT);
    expect(classified.status).toBe(200);
    expect(classified.body.status).toBe('AWAITING_REVIEW');
    expect(classified.body.latestClassification.category).toBe('BILLING');

    const approved = await request(app)
      .post(`/api/requests/${id}/review`)
      .set('X-User-Id', REVIEWER)
      .send({ decision: 'APPROVED', comment: 'Looks right.' });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe('APPROVED');

    const audit = await request(app).get(`/api/requests/${id}/audit-log`);
    expect(audit.body.map((e: { eventType: string }) => e.eventType)).toEqual([
      'REQUEST_CREATED',
      'CLASSIFICATION_STARTED',
      'CLASSIFICATION_COMPLETED',
      'CLASSIFICATION_APPROVED',
    ]);
  });

  it('returns 409 when classifying a request that is not SUBMITTED', async () => {
    const id = await createRequest();
    await request(app).post(`/api/requests/${id}/classify`).set('X-User-Id', AGENT);
    const second = await request(app).post(`/api/requests/${id}/classify`).set('X-User-Id', AGENT);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('rejects a REJECTED review without a comment (400 validation)', async () => {
    const id = await createRequest();
    await request(app).post(`/api/requests/${id}/classify`).set('X-User-Id', AGENT);
    const res = await request(app)
      .post(`/api/requests/${id}/review`)
      .set('X-User-Id', REVIEWER)
      .send({ decision: 'REJECTED' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects with a comment and exposes the decision in details', async () => {
    const id = await createRequest();
    await request(app).post(`/api/requests/${id}/classify`).set('X-User-Id', AGENT);
    const res = await request(app)
      .post(`/api/requests/${id}/review`)
      .set('X-User-Id', REVIEWER)
      .send({ decision: 'REJECTED', comment: 'Wrong department.' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.decisions[0].comment).toBe('Wrong department.');
  });
});

describe('not found', () => {
  it('returns 404 for an unknown request', async () => {
    const res = await request(app).get('/api/requests/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
