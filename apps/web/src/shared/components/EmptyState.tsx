import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {description !== undefined && <p className="empty-state__description">{description}</p>}
      {action !== undefined && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
