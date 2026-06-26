import { describe, expect, it } from 'vitest';
import { ConfidenceScore, InvalidConfidenceScoreError } from './confidence-score.js';

describe('ConfidenceScore', () => {
  it.each([0, 0.5, 1])('accepts in-range value %s', (value) => {
    expect(ConfidenceScore.of(value).value).toBe(value);
  });

  it.each([-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects out-of-range value %s',
    (value) => {
      expect(() => ConfidenceScore.of(value)).toThrow(InvalidConfidenceScoreError);
    },
  );

  it('reports whether it is below a threshold', () => {
    expect(ConfidenceScore.of(0.4).isBelow(0.55)).toBe(true);
    expect(ConfidenceScore.of(0.8).isBelow(0.55)).toBe(false);
  });
});
