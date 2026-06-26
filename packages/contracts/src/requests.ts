import { z } from 'zod';
import {
  auditEventTypeSchema,
  categorySchema,
  departmentSchema,
  prioritySchema,
  requestStatusSchema,
  reviewDecisionSchema,
} from './enums.js';

// --- Inbound: create a request ---------------------------------------------

export const createRequestSchema = z.object({
  requesterName: z.string().trim().min(1).max(200),
  requesterEmail: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(10_000),
});
export type CreateRequestBody = z.infer<typeof createRequestSchema>;

// --- Inbound: list filters (query string) ----------------------------------

export const listRequestsQuerySchema = z.object({
  status: requestStatusSchema.optional(),
  category: categorySchema.optional(),
  priority: prioritySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;

// --- Inbound: review a classification --------------------------------------

/** Fields a reviewer may correct on approval. confidenceScore is AI-owned. */
export const classificationCorrectionSchema = z.object({
  category: categorySchema,
  priority: prioritySchema,
  department: departmentSchema,
  summary: z.string().trim().min(1).max(2_000),
  suggestedResponse: z.string().trim().min(1).max(5_000),
});
export type ClassificationCorrection = z.infer<typeof classificationCorrectionSchema>;

export const reviewRequestSchema = z
  .discriminatedUnion('decision', [
    z.object({
      decision: z.literal('APPROVED'),
      comment: z.string().trim().max(2_000).optional(),
      classification: classificationCorrectionSchema.optional(),
    }),
    z.object({
      decision: z.literal('REJECTED'),
      // A rejection MUST carry an explanatory comment.
      comment: z.string().trim().min(1).max(2_000),
    }),
  ])
  .describe('Review decision payload');
export type ReviewRequestBody = z.infer<typeof reviewRequestSchema>;

// --- Outbound DTOs ----------------------------------------------------------

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
});
export type UserDto = z.infer<typeof userSchema>;

export const classificationSchema = z.object({
  category: categorySchema,
  priority: prioritySchema,
  department: departmentSchema,
  summary: z.string(),
  suggestedResponse: z.string(),
  confidenceScore: z.number().min(0).max(1),
  provider: z.string(),
  model: z.string(),
  createdAt: z.string(),
});
export type ClassificationDto = z.infer<typeof classificationSchema>;

export const routingSchema = z.object({
  department: departmentSchema,
  flaggedForPriorityReview: z.boolean(),
  reason: z.string(),
});
export type RoutingDto = z.infer<typeof routingSchema>;

export const reviewDecisionDtoSchema = z.object({
  id: z.string(),
  reviewerId: z.string(),
  decision: reviewDecisionSchema,
  comment: z.string().nullable(),
  originalClassification: classificationSchema.nullable(),
  finalClassification: classificationSchema.nullable(),
  createdAt: z.string(),
});
export type ReviewDecisionDto = z.infer<typeof reviewDecisionDtoSchema>;

export const auditEventSchema = z.object({
  id: z.string(),
  eventType: auditEventTypeSchema,
  actorId: z.string().nullable(),
  payload: z.record(z.unknown()),
  occurredAt: z.string(),
});
export type AuditEventDto = z.infer<typeof auditEventSchema>;

export const requestSummarySchema = z.object({
  id: z.string(),
  subject: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string(),
  status: requestStatusSchema,
  category: categorySchema.nullable(),
  priority: prioritySchema.nullable(),
  department: departmentSchema.nullable(),
  createdAt: z.string(),
});
export type RequestSummaryDto = z.infer<typeof requestSummarySchema>;

export const requestDetailsSchema = z.object({
  id: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string(),
  subject: z.string(),
  description: z.string(),
  status: requestStatusSchema,
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  latestClassification: classificationSchema.nullable(),
  routing: routingSchema.nullable(),
  analyses: z.array(classificationSchema),
  decisions: z.array(reviewDecisionDtoSchema),
});
export type RequestDetailsDto = z.infer<typeof requestDetailsSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  });
}

export const paginatedRequestsSchema = paginatedSchema(requestSummarySchema);
export type PaginatedRequestsDto = z.infer<typeof paginatedRequestsSchema>;

export const auditLogSchema = z.array(auditEventSchema);
export type AuditLogDto = z.infer<typeof auditLogSchema>;
