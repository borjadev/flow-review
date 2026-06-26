import { z } from 'zod';

/**
 * Canonical string values shared across the HTTP contract.
 *
 * These mirror the domain enums by value. The duplication is intentional: the
 * domain layer must not depend on Zod or on this shared package, so the literal
 * values live in both places and the HTTP layer maps between them.
 */

export const CATEGORY_VALUES = [
  'BILLING',
  'TECHNICAL_SUPPORT',
  'ACCOUNT',
  'SALES',
  'LEGAL',
  'GENERAL',
] as const;

export const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const DEPARTMENT_VALUES = [
  'FINANCE',
  'TECHNICAL_SUPPORT',
  'CUSTOMER_SUCCESS',
  'SALES',
  'LEGAL_OPERATIONS',
  'GENERAL_SUPPORT',
] as const;

export const REQUEST_STATUS_VALUES = [
  'SUBMITTED',
  'ANALYSING',
  'AWAITING_REVIEW',
  'APPROVED',
  'REJECTED',
  'CLASSIFICATION_FAILED',
] as const;

export const REVIEW_DECISION_VALUES = ['APPROVED', 'REJECTED'] as const;

export const AUDIT_EVENT_TYPE_VALUES = [
  'REQUEST_CREATED',
  'CLASSIFICATION_STARTED',
  'CLASSIFICATION_COMPLETED',
  'CLASSIFICATION_FAILED',
  'CLASSIFICATION_APPROVED',
  'CLASSIFICATION_APPROVED_WITH_CHANGES',
  'CLASSIFICATION_REJECTED',
  'CLASSIFICATION_RETRIED',
] as const;

export const categorySchema = z.enum(CATEGORY_VALUES);
export const prioritySchema = z.enum(PRIORITY_VALUES);
export const departmentSchema = z.enum(DEPARTMENT_VALUES);
export const requestStatusSchema = z.enum(REQUEST_STATUS_VALUES);
export const reviewDecisionSchema = z.enum(REVIEW_DECISION_VALUES);
export const auditEventTypeSchema = z.enum(AUDIT_EVENT_TYPE_VALUES);

export type Category = (typeof CATEGORY_VALUES)[number];
export type Priority = (typeof PRIORITY_VALUES)[number];
export type Department = (typeof DEPARTMENT_VALUES)[number];
export type RequestStatus = (typeof REQUEST_STATUS_VALUES)[number];
export type ReviewDecisionType = (typeof REVIEW_DECISION_VALUES)[number];
export type AuditEventType = (typeof AUDIT_EVENT_TYPE_VALUES)[number];
