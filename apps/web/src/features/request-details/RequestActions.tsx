import type { ReviewRequestBody, RequestDetailsDto } from '@flow-review/contracts';
import { Button } from '../../shared/components/Button';
import { ReviewPanel } from '../request-review/ReviewPanel';

interface RequestActionsProps {
  request: RequestDetailsDto;
  onClassify: () => void;
  onRetry: () => void;
  onReview: (body: ReviewRequestBody) => void;
  isActing: boolean;
  actionError?: string;
}

export function RequestActions({
  request,
  onClassify,
  onRetry,
  onReview,
  isActing,
  actionError,
}: RequestActionsProps) {
  switch (request.status) {
    case 'SUBMITTED':
      return (
        <div className="panel panel--actions">
          <h2 className="panel__title">Actions</h2>
          <p className="panel__empty">Run AI classification to propose a category and routing.</p>
          {actionError !== undefined && (
            <p className="form__error" role="alert">
              {actionError}
            </p>
          )}
          <Button disabled={isActing} onClick={onClassify}>
            {isActing ? 'Classifying…' : 'Classify'}
          </Button>
        </div>
      );
    case 'ANALYSING':
      return (
        <div className="panel panel--actions">
          <h2 className="panel__title">Actions</h2>
          <p className="panel__empty" role="status">
            Classification in progress…
          </p>
          <Button disabled>Analysing…</Button>
        </div>
      );
    case 'CLASSIFICATION_FAILED':
      return (
        <div className="panel panel--actions">
          <h2 className="panel__title">Actions</h2>
          <p className="panel__empty">Classification failed. Retry to run it again.</p>
          {actionError !== undefined && (
            <p className="form__error" role="alert">
              {actionError}
            </p>
          )}
          <Button disabled={isActing} onClick={onRetry}>
            {isActing ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      );
    case 'REJECTED':
      return (
        <div className="panel panel--actions">
          <h2 className="panel__title">Actions</h2>
          <p className="panel__empty">This classification was rejected.</p>
          {actionError !== undefined && (
            <p className="form__error" role="alert">
              {actionError}
            </p>
          )}
          <Button disabled={isActing} onClick={onRetry}>
            {isActing ? 'Retrying…' : 'Retry classification'}
          </Button>
        </div>
      );
    case 'AWAITING_REVIEW':
      if (request.latestClassification === null) {
        return (
          <div className="panel panel--actions">
            <h2 className="panel__title">Actions</h2>
            <p className="panel__empty">Awaiting review, but no classification is available.</p>
          </div>
        );
      }
      return (
        <ReviewPanel
          proposed={request.latestClassification}
          onSubmit={onReview}
          isSubmitting={isActing}
          submitError={actionError}
        />
      );
    case 'APPROVED':
      return (
        <div className="banner banner--success" role="status">
          This request has been approved. The classification is final and read-only.
        </div>
      );
    default:
      return null;
  }
}
