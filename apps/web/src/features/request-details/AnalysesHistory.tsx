import type { ClassificationDto } from '@flow-review/contracts';
import { categoryLabel, departmentLabel, priorityLabel } from '../../entities/request/labels';
import { formatConfidence, formatDateTime } from '../../shared/utils/formatDate';

interface AnalysesHistoryProps {
  analyses: ClassificationDto[];
}

export function AnalysesHistory({ analyses }: AnalysesHistoryProps) {
  return (
    <div className="panel">
      <h2 className="panel__title">Analyses history</h2>
      {analyses.length === 0 ? (
        <p className="panel__empty">No analyses have been run yet.</p>
      ) : (
        <ul className="history-list">
          {analyses.map((analysis, index) => (
            <li key={`${analysis.createdAt}-${index}`} className="history-list__item">
              <div className="history-list__header">
                <span>{categoryLabel(analysis.category)}</span>
                <span>{formatConfidence(analysis.confidenceScore)}</span>
              </div>
              <p className="history-list__meta">
                {priorityLabel(analysis.priority)} · {departmentLabel(analysis.department)} ·{' '}
                {formatDateTime(analysis.createdAt)}
              </p>
              <p className="history-list__summary">{analysis.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
