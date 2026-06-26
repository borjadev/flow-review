import { z } from 'zod';
import {
  InvalidClassifierResponseError,
  PermanentClassifierError,
  TransientClassifierError,
  type ClassificationInput,
  type ClassificationResult,
  type RequestClassifier,
} from '../../application/ports/request-classifier.js';
import {
  CATEGORIES,
  DEPARTMENTS,
  PRIORITIES,
  type Category,
  type Department,
  type Priority,
} from '../../domain/value-objects/enums.js';

/**
 * Minimal structural contract of the OpenAI client we depend on. Declaring it
 * here (instead of importing SDK types broadly) keeps the SDK isolated and makes
 * the adapter unit-testable with a fake client.
 */
export interface OpenAIChatClient {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: Array<{ role: 'system' | 'user'; content: string }>;
        response_format: { type: 'json_object' };
        temperature?: number;
      }): Promise<{ choices: Array<{ message: { content: string | null } }> }>;
    };
  };
}

const responseSchema = z.object({
  category: z.enum([...CATEGORIES] as [Category, ...Category[]]),
  priority: z.enum([...PRIORITIES] as [Priority, ...Priority[]]),
  department: z.enum([...DEPARTMENTS] as [Department, ...Department[]]),
  summary: z.string().min(1),
  suggestedResponse: z.string().min(1),
  confidenceScore: z.number().min(0).max(1),
});

const SYSTEM_PROMPT = `You are a support request classifier. Respond ONLY with a JSON object with these exact keys:
- category: one of ${CATEGORIES.join(', ')}
- priority: one of ${PRIORITIES.join(', ')}
- department: one of ${DEPARTMENTS.join(', ')}
- summary: a concise one-sentence summary
- suggestedResponse: a short, professional initial reply to the customer
- confidenceScore: a number between 0 and 1 indicating your confidence`;

/**
 * Adapter implementing RequestClassifier against the OpenAI API. Used only when
 * AI_PROVIDER=openai and a key is configured (see the classifier factory).
 * External errors are translated into the application's classifier error
 * taxonomy; SDK details never leak outward.
 */
export class OpenAIRequestClassifier implements RequestClassifier {
  static readonly PROVIDER = 'openai';

  constructor(
    private readonly client: OpenAIChatClient,
    private readonly model: string,
  ) {}

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const content = await this.requestCompletion(input);
    const parsed = this.parse(content);

    return {
      ...parsed,
      provider: OpenAIRequestClassifier.PROVIDER,
      model: this.model,
    };
  }

  private async requestCompletion(input: ClassificationInput): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Subject: ${input.subject}\nFrom: ${input.requesterName}\n\n${input.description}`,
          },
        ],
      });
      const message = completion.choices[0]?.message.content;
      if (!message) {
        throw new InvalidClassifierResponseError('OpenAI returned an empty response');
      }
      return message;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private parse(content: string): z.infer<typeof responseSchema> {
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      throw new InvalidClassifierResponseError('OpenAI response was not valid JSON');
    }
    const result = responseSchema.safeParse(json);
    if (!result.success) {
      throw new InvalidClassifierResponseError('OpenAI response did not match the expected schema');
    }
    return result.data;
  }

  private mapError(error: unknown): Error {
    if (
      error instanceof InvalidClassifierResponseError ||
      error instanceof TransientClassifierError ||
      error instanceof PermanentClassifierError
    ) {
      return error;
    }

    const status = (error as { status?: number }).status;
    if (status === 429 || (typeof status === 'number' && status >= 500)) {
      return new TransientClassifierError(`OpenAI transient error (status ${status})`);
    }
    if (typeof status === 'number') {
      return new PermanentClassifierError(`OpenAI permanent error (status ${status})`);
    }
    // No status → most likely a network/connection error: treat as transient.
    return new TransientClassifierError('OpenAI connection error');
  }
}
