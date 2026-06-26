import type { AuditEventDto, AuditEventType } from '@flow-review/contracts';
import { Spinner } from '../../shared/components/Spinner';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { formatDateTime } from '../../shared/utils/formatDate';

const EVENT_LABELS: Record<AuditEventType, string> = {
  REQUEST_CREATED: 'Request created',
  CLASSIFICATION_STARTED: 'Classification started',
  CLASSIFICATION_COMPLETED: 'Classification completed',
  CLASSIFICATION_FAILED: 'Classification failed',
  CLASSIFICATION_APPROVED: 'Classification approved',
  CLASSIFICATION_APPROVED_WITH_CHANGES: 'Approved with changes',
  CLASSIFICATION_REJECTED: 'Classification rejected',
  CLASSIFICATION_RETRIED: 'Classification retried',
};

interface AuditTimelineProps {
  events: AuditEventDto[] | undefined;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

export function AuditTimeline({
  events,
  isPending,
  isError,
  errorMessage,
  onRetry,
}: AuditTimelineProps) {
  return (
    <div className="panel">
      <h2 className="panel__title">Audit timeline</h2>
      {isPending && <Spinner label="Loading audit log…" />}
      {isError && <ErrorMessage message={errorMessage ?? 'Failed to load audit log.'} onRetry={onRetry} />}
      {!isPending && !isError && events && events.length === 0 && (
        <p className="panel__empty">No audit events recorded.</p>
      )}
      {!isPending && !isError && events && events.length > 0 && (
        <ol className="timeline">
          {events.map((event) => (
            <li key={event.id} className="timeline__item">
              <span className="timeline__marker" aria-hidden="true" />
              <div className="timeline__content">
                <p className="timeline__title">{EVENT_LABELS[event.eventType]}</p>
                <p className="timeline__meta">
                  {formatDateTime(event.occurredAt)}
                  {event.actorId !== null && ` · ${event.actorId}`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
