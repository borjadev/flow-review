import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  AuditEventDto,
  CreateRequestBody,
  PaginatedRequestsDto,
  RequestDetailsDto,
  ReviewRequestBody,
  UserDto,
} from '@flow-review/contracts';
import { apiFetch, ApiError } from './apiClient';
import { queryKeys, type RequestListFilters } from './queryKeys';
import { useDemoUser } from '../hooks/demo-user-context';

function buildRequestsQuery(filters: RequestListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.priority) {
    params.set('priority', filters.priority);
  }
  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));
  return params.toString();
}

function requireUserId(userId: string | null): string {
  if (!userId) {
    throw new ApiError('Select a demo user before performing this action.', 400, 'NO_DEMO_USER');
  }
  return userId;
}

export function useUsers(): UseQueryResult<UserDto[], Error> {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => apiFetch<UserDto[]>('/users'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequests(
  filters: RequestListFilters,
): UseQueryResult<PaginatedRequestsDto, Error> {
  return useQuery({
    queryKey: queryKeys.requests(filters),
    queryFn: () => apiFetch<PaginatedRequestsDto>(`/requests?${buildRequestsQuery(filters)}`),
  });
}

export function useRequestDetails(id: string): UseQueryResult<RequestDetailsDto, Error> {
  return useQuery({
    queryKey: queryKeys.requestDetails(id),
    queryFn: () => apiFetch<RequestDetailsDto>(`/requests/${id}`),
    enabled: id.length > 0,
  });
}

export function useAuditLog(id: string): UseQueryResult<AuditEventDto[], Error> {
  return useQuery({
    queryKey: queryKeys.auditLog(id),
    queryFn: () => apiFetch<AuditEventDto[]>(`/requests/${id}/audit-log`),
    enabled: id.length > 0,
  });
}

export function useCreateRequest(): UseMutationResult<RequestDetailsDto, Error, CreateRequestBody> {
  const queryClient = useQueryClient();
  const { selectedUserId } = useDemoUser();

  return useMutation({
    mutationFn: (body: CreateRequestBody) =>
      apiFetch<RequestDetailsDto>('/requests', {
        method: 'POST',
        body,
        userId: requireUserId(selectedUserId),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useClassify(): UseMutationResult<RequestDetailsDto, Error, string> {
  const queryClient = useQueryClient();
  const { selectedUserId } = useDemoUser();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<RequestDetailsDto>(`/requests/${id}/classify`, {
        method: 'POST',
        userId: requireUserId(selectedUserId),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.requestDetails(data.id), data);
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useRetry(): UseMutationResult<RequestDetailsDto, Error, string> {
  const queryClient = useQueryClient();
  const { selectedUserId } = useDemoUser();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<RequestDetailsDto>(`/requests/${id}/retry`, {
        method: 'POST',
        userId: requireUserId(selectedUserId),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.requestDetails(data.id), data);
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export interface ReviewVariables {
  id: string;
  body: ReviewRequestBody;
}

export function useReview(): UseMutationResult<RequestDetailsDto, Error, ReviewVariables> {
  const queryClient = useQueryClient();
  const { selectedUserId } = useDemoUser();

  return useMutation({
    mutationFn: ({ id, body }: ReviewVariables) =>
      apiFetch<RequestDetailsDto>(`/requests/${id}/review`, {
        method: 'POST',
        body,
        userId: requireUserId(selectedUserId),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.requestDetails(data.id), data);
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
