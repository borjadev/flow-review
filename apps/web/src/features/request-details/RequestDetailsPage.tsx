import { Link, useParams } from 'react-router-dom';
import type { ReviewRequestBody } from '@flow-review/contracts';
import {
  useAuditLog,
  useClassify,
  useRequestDetails,
  useRetry,
  useReview,
} from '../../shared/api/hooks';
import { Spinner } from '../../shared/components/Spinner';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatDateTime } from '../../shared/utils/formatDate';
import { ClassificationPanel } from './ClassificationPanel';
import { RoutingPanel } from './RoutingPanel';
import { AnalysesHistory } from './AnalysesHistory';
import { DecisionsHistory } from './DecisionsHistory';
import { AuditTimeline } from './AuditTimeline';
import { RequestActions } from './RequestActions';

export function RequestDetailsPage() {
  const { requestId = '' } = useParams<{ requestId: string }>();
  const detailsQuery = useRequestDetails(requestId);
  const auditQuery = useAuditLog(requestId);

  const classify = useClassify();
  const retry = useRetry();
  const review = useReview();

  const isActing = classify.isPending || retry.isPending || review.isPending;
  const actionError =
    (classify.isError ? classify.error.message : undefined) ??
    (retry.isError ? retry.error.message : undefined) ??
    (review.isError ? review.error.message : undefined);

  if (detailsQuery.isPending) {
    return (
      <section className="page">
        <Spinner label="Loading request…" />
      </section>
    );
  }

  if (detailsQuery.isError) {
    return (
      <section className="page">
        <ErrorMessage
          message={detailsQuery.error.message}
          onRetry={() => {
            void detailsQuery.refetch();
          }}
        />
      </section>
    );
  }

  const request = detailsQuery.data;

  const handleReview = (body: ReviewRequestBody) => {
    review.mutate({ id: request.id, body });
  };

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <Link className="page__back" to="/requests">
            ← Back to requests
          </Link>
          <h1 className="page__title">{request.subject}</h1>
          <p className="page__subtitle">
            {request.requesterName} · {request.requesterEmail}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <div className="details-grid">
        <div className="details-grid__main">
          <div className="panel panel--request">
            <h2 className="panel__title">Original request</h2>
            <p className="panel__meta">Submitted {formatDateTime(request.createdAt)}</p>
            <p className="panel__body">{request.description}</p>
          </div>

          {request.latestClassification !== null && (
            <ClassificationPanel classification={request.latestClassification} />
          )}

          {request.routing !== null && <RoutingPanel routing={request.routing} />}

          <AnalysesHistory analyses={request.analyses} />
          <DecisionsHistory decisions={request.decisions} />
        </div>

        <aside className="details-grid__side">
          <RequestActions
            request={request}
            onClassify={() => {
              classify.mutate(request.id);
            }}
            onRetry={() => {
              retry.mutate(request.id);
            }}
            onReview={handleReview}
            isActing={isActing}
            actionError={actionError}
          />

          <AuditTimeline
            events={auditQuery.data}
            isPending={auditQuery.isPending}
            isError={auditQuery.isError}
            errorMessage={auditQuery.isError ? auditQuery.error.message : undefined}
            onRetry={() => {
              void auditQuery.refetch();
            }}
          />
        </aside>
      </div>
    </section>
  );
}
