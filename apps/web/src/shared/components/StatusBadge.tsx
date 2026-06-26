import type { RequestStatus } from '@flow-review/contracts';
import { statusLabel } from '../../entities/request/labels';

interface StatusBadgeProps {
  status: RequestStatus;
}

const STATUS_TONE: Record<RequestStatus, string> = {
  SUBMITTED: 'neutral',
  ANALYSING: 'info',
  AWAITING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CLASSIFICATION_FAILED: 'danger',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge--${STATUS_TONE[status]}`} data-testid="status-badge">
      {statusLabel(status)}
    </span>
  );
}
