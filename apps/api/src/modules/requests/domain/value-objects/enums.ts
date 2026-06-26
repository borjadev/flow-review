/**
 * Domain enums. Defined as plain TypeScript so the domain stays free of Zod
 * and of the shared contracts package. The HTTP layer maps between these and
 * the contract schemas (the literal values are intentionally identical).
 */

export const CATEGORIES = [
  'BILLING',
  'TECHNICAL_SUPPORT',
  'ACCOUNT',
  'SALES',
  'LEGAL',
  'GENERAL',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DEPARTMENTS = [
  'FINANCE',
  'TECHNICAL_SUPPORT',
  'CUSTOMER_SUCCESS',
  'SALES',
  'LEGAL_OPERATIONS',
  'GENERAL_SUPPORT',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}

export function isDepartment(value: string): value is Department {
  return (DEPARTMENTS as readonly string[]).includes(value);
}
