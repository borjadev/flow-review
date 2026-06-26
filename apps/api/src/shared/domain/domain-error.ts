/**
 * Base class for every domain-level error. Domain errors are part of the
 * ubiquitous language: they express broken business invariants, not technical
 * failures. Each one carries a stable machine-readable `code`.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Restore prototype chain when targeting ES5-ish transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
