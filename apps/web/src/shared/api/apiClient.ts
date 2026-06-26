import { errorResponseSchema, type ErrorResponse } from '@flow-review/contracts';

const DEFAULT_BASE_URL = 'http://localhost:4000/api';

function baseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL;
}

type ErrorDetails = NonNullable<ErrorResponse['error']['details']>;

/** Error thrown when the API responds with a non-2xx status. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: ErrorDetails;

  constructor(message: string, status: number, code: string, details?: ErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** Demo user id sent as the X-User-Id header on acting requests. */
  userId?: string | null;
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  let code = 'UNKNOWN_ERROR';
  let details: ErrorDetails | undefined;

  try {
    const json: unknown = await response.json();
    const parsed = errorResponseSchema.safeParse(json);
    if (parsed.success) {
      message = parsed.data.error.message;
      code = parsed.data.error.code;
      details = parsed.data.error.details;
    }
  } catch {
    // Body was not JSON; keep the default message.
  }

  return new ApiError(message, response.status, code, details);
}

/** Typed fetch wrapper: injects base URL + X-User-Id, parses JSON, throws on !ok. */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.userId) {
    headers['X-User-Id'] = options.userId;
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
