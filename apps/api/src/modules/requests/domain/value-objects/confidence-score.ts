import { DomainError } from '../../../../shared/domain/domain-error.js';

export class InvalidConfidenceScoreError extends DomainError {
  readonly code = 'INVALID_CONFIDENCE_SCORE';

  constructor(value: number) {
    super(`Confidence score must be between 0 and 1, received ${value}`);
  }
}

/**
 * Value object enforcing the domain invariant that a confidence score is a
 * real number within the inclusive range [0, 1].
 */
export class ConfidenceScore {
  private constructor(public readonly value: number) {}

  static of(value: number): ConfidenceScore {
    if (Number.isNaN(value) || !Number.isFinite(value) || value < 0 || value > 1) {
      throw new InvalidConfidenceScoreError(value);
    }
    return new ConfidenceScore(value);
  }

  isBelow(threshold: number): boolean {
    return this.value < threshold;
  }

  equals(other: ConfidenceScore): boolean {
    return this.value === other.value;
  }
}
