import type {
  ClassificationDto,
  RequestDetailsDto,
  RequestStatus,
  RequestSummaryDto,
  UserDto,
} from '@flow-review/contracts';

export const sampleUser: UserDto = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'Reviewer',
};

export const sampleSummary: RequestSummaryDto = {
  id: 'req-1',
  subject: 'Cannot access billing portal',
  requesterName: 'Grace Hopper',
  requesterEmail: 'grace@example.com',
  status: 'AWAITING_REVIEW',
  category: 'BILLING',
  priority: 'HIGH',
  department: 'FINANCE',
  createdAt: '2026-06-20T10:00:00.000Z',
};

export const sampleClassification: ClassificationDto = {
  category: 'BILLING',
  priority: 'HIGH',
  department: 'FINANCE',
  summary: 'Customer cannot reach the billing portal.',
  suggestedResponse: 'Reset the portal session and confirm access.',
  confidenceScore: 0.82,
  provider: 'openai',
  model: 'gpt-4o-mini',
  createdAt: '2026-06-20T10:05:00.000Z',
};

export function buildDetails(overrides: Partial<RequestDetailsDto> = {}): RequestDetailsDto {
  return {
    id: 'req-1',
    requesterName: 'Grace Hopper',
    requesterEmail: 'grace@example.com',
    subject: 'Cannot access billing portal',
    description: 'I keep getting a 403 when opening the billing portal.',
    status: 'AWAITING_REVIEW',
    createdBy: 'user-1',
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:05:00.000Z',
    latestClassification: sampleClassification,
    routing: {
      department: 'FINANCE',
      flaggedForPriorityReview: true,
      reason: 'High priority billing issue.',
    },
    analyses: [sampleClassification],
    decisions: [],
    ...overrides,
  };
}

export function detailsWithStatus(status: RequestStatus): RequestDetailsDto {
  const hasClassification = status === 'AWAITING_REVIEW' || status === 'APPROVED';
  return buildDetails({
    status,
    latestClassification: hasClassification ? sampleClassification : null,
    routing: hasClassification
      ? {
          department: 'FINANCE',
          flaggedForPriorityReview: false,
          reason: 'Routed to finance.',
        }
      : null,
    analyses: hasClassification ? [sampleClassification] : [],
  });
}
