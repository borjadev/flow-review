/** Presentation-level error carrying an explicit HTTP status and stable code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
