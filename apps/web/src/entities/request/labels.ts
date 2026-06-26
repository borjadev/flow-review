import type { Category, Department, Priority, RequestStatus } from '@flow-review/contracts';

/**
 * Human-readable labels and presentation helpers derived from the shared
 * contract enums. Keeping these here means UI components never hardcode enum
 * strings and stay in sync with the backend contract.
 */

const STATUS_LABELS: Record<RequestStatus, string> = {
  SUBMITTED: 'Submitted',
  ANALYSING: 'Analysing',
  AWAITING_REVIEW: 'Awaiting review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CLASSIFICATION_FAILED: 'Classification failed',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const CATEGORY_LABELS: Record<Category, string> = {
  BILLING: 'Billing',
  TECHNICAL_SUPPORT: 'Technical support',
  ACCOUNT: 'Account',
  SALES: 'Sales',
  LEGAL: 'Legal',
  GENERAL: 'General',
};

const DEPARTMENT_LABELS: Record<Department, string> = {
  FINANCE: 'Finance',
  TECHNICAL_SUPPORT: 'Technical support',
  CUSTOMER_SUCCESS: 'Customer success',
  SALES: 'Sales',
  LEGAL_OPERATIONS: 'Legal operations',
  GENERAL_SUPPORT: 'General support',
};

export function statusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status];
}

export function priorityLabel(priority: Priority | null): string {
  return priority === null ? '—' : PRIORITY_LABELS[priority];
}

export function categoryLabel(category: Category | null): string {
  return category === null ? '—' : CATEGORY_LABELS[category];
}

export function departmentLabel(department: Department | null): string {
  return department === null ? '—' : DEPARTMENT_LABELS[department];
}
