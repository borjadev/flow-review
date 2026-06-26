import type { ClassificationDto } from '@flow-review/contracts';
import { categoryLabel, departmentLabel, priorityLabel } from '../../entities/request/labels';
import { formatConfidence, formatDateTime } from '../../shared/utils/formatDate';

interface ClassificationPanelProps {
  classification: ClassificationDto;
}

export function ClassificationPanel({ classification }: ClassificationPanelProps) {
  return (
    <div className="panel panel--analysis">
      <div className="panel__header">
        <h2 className="panel__title">Latest classification</h2>
        <span className="panel__confidence">
          Confidence: {formatConfidence(classification.confidenceScore)}
        </span>
      </div>
      <dl className="definition-grid">
        <div>
          <dt>Category</dt>
          <dd>{categoryLabel(classification.category)}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{priorityLabel(classification.priority)}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>{departmentLabel(classification.department)}</dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>
            {classification.provider} / {classification.model}
          </dd>
        </div>
      </dl>
      <div className="panel__section">
        <h3 className="panel__subtitle">Summary</h3>
        <p>{classification.summary}</p>
      </div>
      <div className="panel__section">
        <h3 className="panel__subtitle">Suggested response</h3>
        <p>{classification.suggestedResponse}</p>
      </div>
      <p className="panel__meta">Generated {formatDateTime(classification.createdAt)}</p>
    </div>
  );
}
