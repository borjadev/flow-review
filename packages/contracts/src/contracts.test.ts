import { describe, expect, it } from 'vitest';
import { createRequestSchema } from './requests.js';
import { reviewRequestSchema } from './requests.js';

describe('createRequestSchema', () => {
  it('accepts a valid body and trims strings', () => {
    const result = createRequestSchema.parse({
      requesterName: '  Jane Doe  ',
      requesterEmail: 'jane@example.com',
      subject: 'Subject',
      description: 'Description',
    });
    expect(result.requesterName).toBe('Jane Doe');
  });

  it('rejects an invalid email and empty subject', () => {
    const result = createRequestSchema.safeParse({
      requesterName: 'Jane',
      requesterEmail: 'nope',
      subject: '',
      description: 'x',
    });
    expect(result.success).toBe(false);
  });
});

describe('reviewRequestSchema', () => {
  it('requires a comment when rejecting', () => {
    const result = reviewRequestSchema.safeParse({ decision: 'REJECTED' });
    expect(result.success).toBe(false);
  });

  it('allows an approval without a comment', () => {
    const result = reviewRequestSchema.safeParse({ decision: 'APPROVED' });
    expect(result.success).toBe(true);
  });
});
