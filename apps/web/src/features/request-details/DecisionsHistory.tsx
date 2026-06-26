import type { ReviewDecisionDto } from '@flow-review/contracts';
import { formatDateTime } from '../../shared/utils/formatDate';

interface DecisionsHistoryProps {
  decisions: ReviewDecisionDto[];
}

export function DecisionsHistory({ decisions }: DecisionsHistoryProps) {
  return (
    <div className="panel">
      <h2 className="panel__title">Decisions history</h2>
      {decisions.length === 0 ? (
        <p className="panel__empty">No review decisions yet.</p>
      ) : (
        <ul className="history-list">
          {decisions.map((decision) => (
            <li key={decision.id} className="history-list__item">
              <div className="history-list__header">
                <span
                  className={`badge ${
                    decision.decision === 'APPROVED' ? 'badge--success' : 'badge--danger'
                  }`}
                >
                  {decision.decision === 'APPROVED' ? 'Approved' : 'Rejected'}
                </span>
                <span>{formatDateTime(decision.createdAt)}</span>
              </div>
              <p className="history-list__meta">Reviewer: {decision.reviewerId}</p>
              {decision.comment !== null && (
                <p className="history-list__summary">{decision.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
