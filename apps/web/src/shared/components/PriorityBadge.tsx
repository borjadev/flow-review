import type { Priority } from '@flow-review/contracts';
import { priorityLabel } from '../../entities/request/labels';

interface PriorityBadgeProps {
  priority: Priority | null;
}

const PRIORITY_TONE: Record<Priority, string> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (priority === null) {
    return <span className="badge badge--muted">—</span>;
  }
  return (
    <span className={`badge badge--${PRIORITY_TONE[priority]}`}>{priorityLabel(priority)}</span>
  );
}
