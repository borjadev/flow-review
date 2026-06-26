import { describe, expect, it } from 'vitest';
import { Classification } from './classification.js';
import { ReviewDecision } from './review-decision.js';
import { RejectionRequiresCommentError } from '../errors/request-errors.js';
import { ConfidenceScore } from '../value-objects/confidence-score.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function aClassification(): Classification {
  return Classification.create({
    category: 'BILLING',
    priority: 'HIGH',
    department: 'FINANCE',
    summary: 'Duplicate charge',
    suggestedResponse: 'We are looking into it.',
    confidenceScore: ConfidenceScore.of(0.9),
    provider: 'fake',
    model: 'rules-v1',
    createdAt: NOW,
  });
}

describe('ReviewDecision', () => {
  it('approves with a final classification equal to the original when unchanged', () => {
    const original = aClassification();
    const decision = ReviewDecision.approve({
      id: 'rev-1',
      requestId: 'req-1',
      reviewerId: 'reviewer-1',
      originalClassification: original,
      finalClassification: original,
      comment: null,
      createdAt: NOW,
    });
    expect(decision.decision).toBe('APPROVED');
    expect(decision.finalClassification).toBe(original);
  });

  it('rejects with a mandatory comment', () => {
    const decision = ReviewDecision.reject({
      id: 'rev-2',
      requestId: 'req-1',
      reviewerId: 'reviewer-1',
      originalClassification: aClassification(),
      comment: 'Wrong category',
      createdAt: NOW,
    });
    expect(decision.decision).toBe('REJECTED');
    expect(decision.finalClassification).toBeNull();
  });

  it('refuses to reject without a comment', () => {
    expect(() =>
      ReviewDecision.reject({
        id: 'rev-3',
        requestId: 'req-1',
        reviewerId: 'reviewer-1',
        originalClassification: null,
        comment: '   ',
        createdAt: NOW,
      }),
    ).toThrow(RejectionRequiresCommentError);
  });
});

describe('Classification corrections', () => {
  it('detects whether corrections differ from the original', () => {
    const original = aClassification();
    expect(
      original.differsFrom({
        category: 'BILLING',
        priority: 'HIGH',
        department: 'FINANCE',
        summary: 'Duplicate charge',
        suggestedResponse: 'We are looking into it.',
      }),
    ).toBe(false);

    expect(
      original.differsFrom({
        category: 'TECHNICAL_SUPPORT',
        priority: 'HIGH',
        department: 'FINANCE',
        summary: 'Duplicate charge',
        suggestedResponse: 'We are looking into it.',
      }),
    ).toBe(true);
  });

  it('retains provenance fields when applying corrections', () => {
    const original = aClassification();
    const corrected = original.withCorrections({
      category: 'TECHNICAL_SUPPORT',
      priority: 'URGENT',
      department: 'TECHNICAL_SUPPORT',
      summary: 'New summary',
      suggestedResponse: 'New response',
    });
    expect(corrected.category).toBe('TECHNICAL_SUPPORT');
    expect(corrected.confidenceScore.value).toBe(0.9);
    expect(corrected.provider).toBe('fake');
    expect(corrected.model).toBe('rules-v1');
  });
});
