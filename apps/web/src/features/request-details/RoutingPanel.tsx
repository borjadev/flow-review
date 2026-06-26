import type { RoutingDto } from '@flow-review/contracts';
import { departmentLabel } from '../../entities/request/labels';

interface RoutingPanelProps {
  routing: RoutingDto;
}

export function RoutingPanel({ routing }: RoutingPanelProps) {
  return (
    <div className="panel panel--routing">
      <h2 className="panel__title">Routing</h2>
      <dl className="definition-grid">
        <div>
          <dt>Department</dt>
          <dd>{departmentLabel(routing.department)}</dd>
        </div>
        <div>
          <dt>Priority review</dt>
          <dd>{routing.flaggedForPriorityReview ? 'Flagged' : 'Not flagged'}</dd>
        </div>
      </dl>
      <div className="panel__section">
        <h3 className="panel__subtitle">Reason</h3>
        <p>{routing.reason}</p>
      </div>
    </div>
  );
}
