import type { Logger } from '../../../../shared/infrastructure/logger.js';
import type {
  ClassificationInput,
  ClassificationResult,
  RequestClassifier,
} from '../../application/ports/request-classifier.js';

/**
 * Decorator that records structured observability around a classification:
 * provider, model, resulting category/confidence and duration. The request
 * content is never logged (it may contain personal data).
 */
export class LoggingRequestClassifierDecorator implements RequestClassifier {
  constructor(
    private readonly inner: RequestClassifier,
    private readonly logger: Logger,
  ) {}

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const startedAt = Date.now();
    try {
      const result = await this.inner.classify(input);
      this.logger.info(
        {
          provider: result.provider,
          model: result.model,
          category: result.category,
          confidence: result.confidenceScore,
          durationMs: Date.now() - startedAt,
        },
        'request classified',
      );
      return result;
    } catch (error) {
      this.logger.warn(
        {
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.name : 'UnknownError',
        },
        'classification failed',
      );
      throw error;
    }
  }
}
