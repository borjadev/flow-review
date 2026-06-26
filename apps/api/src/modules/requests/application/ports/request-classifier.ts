import { ApplicationError } from '../../../../shared/application/application-error.js';
import type { Category, Department, Priority } from '../../domain/value-objects/enums.js';

export interface ClassificationInput {
  subject: string;
  description: string;
  requesterName: string;
}

export interface ClassificationResult {
  category: Category;
  priority: Priority;
  department: Department;
  summary: string;
  suggestedResponse: string;
  /** Raw confidence in [0, 1]; validated into a ConfidenceScore by the use case. */
  confidenceScore: number;
  provider: string;
  model: string;
}

/**
 * Output port for AI classification. Concrete adapters (fake, OpenAI) live in
 * infrastructure and are wrapped with decorators. Use cases depend only on this.
 */
export interface RequestClassifier {
  classify(input: ClassificationInput): Promise<ClassificationResult>;
}

// --- Classifier error taxonomy ---------------------------------------------
// The retry decorator MUST only retry transient errors. Validation and
// permanent errors must surface immediately.

export abstract class ClassifierError extends ApplicationError {
  /** Whether a retry could plausibly succeed. */
  abstract readonly retryable: boolean;
}

/** A temporary failure (timeout, rate limit, 5xx). Safe to retry. */
export class TransientClassifierError extends ClassifierError {
  readonly code = 'CLASSIFIER_TRANSIENT_ERROR';
  readonly retryable = true;
}

/** A non-recoverable failure (auth, 4xx other than rate limit). Do not retry. */
export class PermanentClassifierError extends ClassifierError {
  readonly code = 'CLASSIFIER_PERMANENT_ERROR';
  readonly retryable = false;
}

/** The provider returned a response that failed schema validation. Do not retry. */
export class InvalidClassifierResponseError extends ClassifierError {
  readonly code = 'CLASSIFIER_INVALID_RESPONSE';
  readonly retryable = false;
}
