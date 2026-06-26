import type {
  ClassificationInput,
  ClassificationResult,
  RequestClassifier,
} from '../../modules/requests/application/ports/request-classifier.js';

const DEFAULT_RESULT: ClassificationResult = {
  category: 'BILLING',
  priority: 'HIGH',
  department: 'FINANCE',
  summary: 'Customer reports a billing issue.',
  suggestedResponse: 'We are looking into your billing issue.',
  confidenceScore: 0.9,
  provider: 'stub',
  model: 'stub-v1',
};

/**
 * Configurable classifier test double. Records calls and can be told to return
 * a specific result, fail a number of times, or always fail.
 */
export class StubClassifier implements RequestClassifier {
  private result: ClassificationResult = DEFAULT_RESULT;
  private errorQueue: Error[] = [];
  public calls = 0;
  public lastInput: ClassificationInput | null = null;

  returns(result: Partial<ClassificationResult>): this {
    this.result = { ...this.result, ...result };
    return this;
  }

  failWith(...errors: Error[]): this {
    this.errorQueue = errors;
    return this;
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    this.calls += 1;
    this.lastInput = input;
    const error = this.errorQueue.shift();
    if (error) {
      throw error;
    }
    return this.result;
  }
}
