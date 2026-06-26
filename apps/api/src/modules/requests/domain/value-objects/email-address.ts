import { DomainError } from '../../../../shared/domain/domain-error.js';

export class InvalidEmailError extends DomainError {
  readonly code = 'INVALID_EMAIL';

  constructor(value: string) {
    super(`"${value}" is not a valid email address`);
  }
}

/**
 * Value object guaranteeing a syntactically valid, normalized email address.
 * Equality is by value, not identity.
 */
export class EmailAddress {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(public readonly value: string) {}

  static of(raw: string): EmailAddress {
    const normalized = raw.trim().toLowerCase();
    if (!EmailAddress.PATTERN.test(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new EmailAddress(normalized);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
