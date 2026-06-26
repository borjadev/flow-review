import {
  ClassifierError,
  type ClassificationInput,
  type ClassificationResult,
  type RequestClassifier,
} from '../../application/ports/request-classifier.js';

/**
 * Decorator adding bounded retries around a classifier. ONLY errors flagged as
 * retryable (transient) are retried; validation and permanent errors propagate
 * immediately. No artificial delay is used, keeping it fast and deterministic to
 * test.
 */
export class RetryingRequestClassifierDecorator implements RequestClassifier {
  constructor(
    private readonly inner: RequestClassifier,
    private readonly maxRetries: number,
  ) {}

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    let attempt = 0;
    for (;;) {
      try {
        return await this.inner.classify(input);
      } catch (error) {
        const isRetryable = error instanceof ClassifierError && error.retryable;
        if (!isRetryable || attempt >= this.maxRetries) {
          throw error;
        }
        attempt += 1;
      }
    }
  }
}
