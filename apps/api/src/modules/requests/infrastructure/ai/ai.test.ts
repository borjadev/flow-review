import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '../../../../shared/infrastructure/logger.js';
import type { AppConfig } from '../../../../config/config.js';
import {
  InvalidClassifierResponseError,
  PermanentClassifierError,
  TransientClassifierError,
  type ClassificationInput,
  type ClassificationResult,
  type RequestClassifier,
} from '../../application/ports/request-classifier.js';
import { FakeRequestClassifier } from './fake-request-classifier.js';
import { RetryingRequestClassifierDecorator } from './retrying-request-classifier.decorator.js';
import { LoggingRequestClassifierDecorator } from './logging-request-classifier.decorator.js';
import { createRequestClassifier } from './classifier-factory.js';
import { OpenAIRequestClassifier, type OpenAIChatClient } from './openai-request-classifier.js';

const INPUT: ClassificationInput = {
  subject: 'Unexpected invoice charge',
  description: 'We were charged twice for the same subscription payment.',
  requesterName: 'Jane Doe',
};

function fakeLogger(): Logger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as Logger;
}

function baseConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
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
    ...overrides,
  };
}

describe('FakeRequestClassifier', () => {
  const classifier = new FakeRequestClassifier();

  it('classifies billing keywords into BILLING / FINANCE', async () => {
    const result = await classifier.classify(INPUT);
    expect(result.category).toBe('BILLING');
    expect(result.department).toBe('FINANCE');
    expect(result.provider).toBe('fake');
  });

  it('classifies technical keywords into TECHNICAL_SUPPORT', async () => {
    const result = await classifier.classify({
      ...INPUT,
      subject: 'Application crash',
      description: 'The app throws an error and is unavailable.',
    });
    expect(result.category).toBe('TECHNICAL_SUPPORT');
  });

  it('detects URGENT priority from keywords', async () => {
    const result = await classifier.classify({
      ...INPUT,
      description: 'Production is down, we are blocked, please help immediately.',
    });
    expect(result.priority).toBe('URGENT');
  });

  it('is deterministic for the same input', async () => {
    const a = await classifier.classify(INPUT);
    const b = await classifier.classify(INPUT);
    expect(a).toEqual(b);
  });

  it('falls back to GENERAL with low confidence when nothing matches', async () => {
    const result = await classifier.classify({
      subject: 'Hello there',
      description: 'Just saying hi to the team.',
      requesterName: 'Sam',
    });
    expect(result.category).toBe('GENERAL');
    expect(result.confidenceScore).toBeLessThan(0.55);
  });
});

describe('RetryingRequestClassifierDecorator', () => {
  function classifierThatFails(times: number, error: Error): RequestClassifier {
    let calls = 0;
    return {
      classify: vi.fn(async (): Promise<ClassificationResult> => {
        calls += 1;
        if (calls <= times) throw error;
        return { ...(await new FakeRequestClassifier().classify(INPUT)) };
      }),
    };
  }

  it('retries transient errors up to the limit then succeeds', async () => {
    const inner = classifierThatFails(2, new TransientClassifierError('timeout'));
    const decorated = new RetryingRequestClassifierDecorator(inner, 2);
    const result = await decorated.classify(INPUT);
    expect(result.category).toBe('BILLING');
    expect(inner.classify).toHaveBeenCalledTimes(3);
  });

  it('gives up after exceeding the retry limit', async () => {
    const inner = classifierThatFails(5, new TransientClassifierError('timeout'));
    const decorated = new RetryingRequestClassifierDecorator(inner, 2);
    await expect(decorated.classify(INPUT)).rejects.toBeInstanceOf(TransientClassifierError);
    expect(inner.classify).toHaveBeenCalledTimes(3);
  });

  it('never retries non-retryable errors', async () => {
    const inner = classifierThatFails(5, new InvalidClassifierResponseError('bad'));
    const decorated = new RetryingRequestClassifierDecorator(inner, 3);
    await expect(decorated.classify(INPUT)).rejects.toBeInstanceOf(InvalidClassifierResponseError);
    expect(inner.classify).toHaveBeenCalledTimes(1);
  });
});

describe('LoggingRequestClassifierDecorator', () => {
  it('logs a success and returns the result unchanged', async () => {
    const logger = fakeLogger();
    const decorated = new LoggingRequestClassifierDecorator(new FakeRequestClassifier(), logger);
    const result = await decorated.classify(INPUT);
    expect(result.category).toBe('BILLING');
    expect(logger.info).toHaveBeenCalledOnce();
  });

  it('logs a warning and rethrows on failure', async () => {
    const logger = fakeLogger();
    const failing: RequestClassifier = {
      classify: async () => {
        throw new TransientClassifierError('boom');
      },
    };
    const decorated = new LoggingRequestClassifierDecorator(failing, logger);
    await expect(decorated.classify(INPUT)).rejects.toThrow();
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});

describe('createRequestClassifier factory', () => {
  it('builds a working fake classifier by default', async () => {
    const classifier = createRequestClassifier({ config: baseConfig(), logger: fakeLogger() });
    const result = await classifier.classify(INPUT);
    expect(result.provider).toBe('fake');
  });

  it('falls back to fake when openai is selected without a key', async () => {
    const logger = fakeLogger();
    const classifier = createRequestClassifier({
      config: baseConfig({ aiProvider: 'openai', openaiApiKey: undefined }),
      logger,
    });
    const result = await classifier.classify(INPUT);
    expect(result.provider).toBe('fake');
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('OpenAIRequestClassifier', () => {
  function clientReturning(content: string): OpenAIChatClient {
    return {
      chat: {
        completions: {
          create: async () => ({ choices: [{ message: { content } }] }),
        },
      },
    };
  }

  function clientThrowing(error: unknown): OpenAIChatClient {
    return {
      chat: {
        completions: {
          create: async () => {
            throw error;
          },
        },
      },
    };
  }

  it('parses a valid structured response', async () => {
    const client = clientReturning(
      JSON.stringify({
        category: 'TECHNICAL_SUPPORT',
        priority: 'HIGH',
        department: 'TECHNICAL_SUPPORT',
        summary: 'A bug report',
        suggestedResponse: 'We are on it',
        confidenceScore: 0.8,
      }),
    );
    const classifier = new OpenAIRequestClassifier(client, 'gpt-4o-mini');
    const result = await classifier.classify(INPUT);
    expect(result.category).toBe('TECHNICAL_SUPPORT');
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o-mini');
  });

  it('maps invalid JSON to InvalidClassifierResponseError', async () => {
    const classifier = new OpenAIRequestClassifier(clientReturning('not json'), 'gpt-4o-mini');
    await expect(classifier.classify(INPUT)).rejects.toBeInstanceOf(InvalidClassifierResponseError);
  });

  it('maps a schema mismatch to InvalidClassifierResponseError', async () => {
    const classifier = new OpenAIRequestClassifier(
      clientReturning(JSON.stringify({ category: 'NONSENSE' })),
      'gpt-4o-mini',
    );
    await expect(classifier.classify(INPUT)).rejects.toBeInstanceOf(InvalidClassifierResponseError);
  });

  it('maps 5xx to a transient error and 4xx to a permanent error', async () => {
    const transient = new OpenAIRequestClassifier(clientThrowing({ status: 503 }), 'gpt-4o-mini');
    await expect(transient.classify(INPUT)).rejects.toBeInstanceOf(TransientClassifierError);

    const permanent = new OpenAIRequestClassifier(clientThrowing({ status: 400 }), 'gpt-4o-mini');
    await expect(permanent.classify(INPUT)).rejects.toBeInstanceOf(PermanentClassifierError);
  });
});
