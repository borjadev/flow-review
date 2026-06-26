/**
 * Base class for application-level errors. These represent failures in the
 * orchestration layer (not broken domain invariants and not raw technical
 * failures). They carry a stable `code` consumed by the HTTP error handler.
 */
export abstract class ApplicationError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends ApplicationError {
  readonly code = 'NOT_FOUND';

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`);
  }
}
