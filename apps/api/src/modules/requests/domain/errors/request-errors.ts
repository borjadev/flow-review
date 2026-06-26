import { DomainError } from '../../../../shared/domain/domain-error.js';

export class RejectionRequiresCommentError extends DomainError {
  readonly code = 'REJECTION_REQUIRES_COMMENT';

  constructor() {
    super('A rejection must include an explanatory comment');
  }
}

export class MissingClassificationError extends DomainError {
  readonly code = 'MISSING_CLASSIFICATION';

  constructor() {
    super('Cannot complete classification without a classification result');
  }
}
