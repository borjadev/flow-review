import { describe, expect, it } from 'vitest';
import { canTransition, REQUEST_STATUSES } from './request-status.js';

describe('request status transition table', () => {
  const valid: ReadonlyArray<[string, string]> = [
    ['SUBMITTED', 'ANALYSING'],
    ['ANALYSING', 'AWAITING_REVIEW'],
    ['ANALYSING', 'CLASSIFICATION_FAILED'],
    ['AWAITING_REVIEW', 'APPROVED'],
    ['AWAITING_REVIEW', 'REJECTED'],
    ['REJECTED', 'ANALYSING'],
    ['CLASSIFICATION_FAILED', 'ANALYSING'],
  ];

  it.each(valid)('allows %s -> %s', (from, to) => {
    expect(canTransition(from as never, to as never)).toBe(true);
  });

  it('forbids any transition out of APPROVED (terminal state)', () => {
    for (const to of REQUEST_STATUSES) {
      expect(canTransition('APPROVED', to)).toBe(false);
    }
  });

  it('forbids skipping review (SUBMITTED -> APPROVED)', () => {
    expect(canTransition('SUBMITTED', 'APPROVED')).toBe(false);
  });

  it('forbids re-analysing while already awaiting review', () => {
    expect(canTransition('AWAITING_REVIEW', 'ANALYSING')).toBe(false);
  });
});
