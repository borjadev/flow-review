import type { Category, Priority, RequestStatus } from '@flow-review/contracts';

export interface RequestListFilters {
  status?: RequestStatus;
  category?: Category;
  priority?: Priority;
  page: number;
  pageSize: number;
}

export const queryKeys = {
  users: ['users'] as const,
  requests: (filters: RequestListFilters) => ['requests', 'list', filters] as const,
  requestDetails: (id: string) => ['requests', 'details', id] as const,
  auditLog: (id: string) => ['requests', 'details', id, 'audit-log'] as const,
};
