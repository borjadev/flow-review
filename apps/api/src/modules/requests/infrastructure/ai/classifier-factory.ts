import OpenAI from 'openai';
import type { AppConfig } from '../../../../config/config.js';
import type { Logger } from '../../../../shared/infrastructure/logger.js';
import type { RequestClassifier } from '../../application/ports/request-classifier.js';
import { FakeRequestClassifier } from './fake-request-classifier.js';
import { OpenAIRequestClassifier, type OpenAIChatClient } from './openai-request-classifier.js';
import { LoggingRequestClassifierDecorator } from './logging-request-classifier.decorator.js';
import { RetryingRequestClassifierDecorator } from './retrying-request-classifier.decorator.js';

export interface ClassifierFactoryDeps {
  config: AppConfig;
  logger: Logger;
}

/**
 * Builds the configured classifier and wraps it with the retry + logging
 * decorators. The fake provider is the default; OpenAI is only used when
 * explicitly selected AND a key is present — otherwise we fall back to fake so
 * the application always boots.
 */
export function createRequestClassifier(deps: ClassifierFactoryDeps): RequestClassifier {
  const base = buildBaseClassifier(deps);
  const retrying = new RetryingRequestClassifierDecorator(base, deps.config.classifierMaxRetries);
  return new LoggingRequestClassifierDecorator(retrying, deps.logger);
}

function buildBaseClassifier({ config, logger }: ClassifierFactoryDeps): RequestClassifier {
  if (config.aiProvider === 'openai') {
    if (config.openaiApiKey) {
      // Bridge the broad SDK client to our minimal, isolated interface.
      const client = new OpenAI({ apiKey: config.openaiApiKey }) as unknown as OpenAIChatClient;
      return new OpenAIRequestClassifier(client, config.openaiModel);
    }
    logger.warn(
      'AI_PROVIDER=openai but OPENAI_API_KEY is not set; falling back to the fake classifier',
    );
  }
  return new FakeRequestClassifier();
}
