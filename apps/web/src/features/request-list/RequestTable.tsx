import { Link } from 'react-router-dom';
import type { RequestSummaryDto } from '@flow-review/contracts';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { PriorityBadge } from '../../shared/components/PriorityBadge';
import { categoryLabel, departmentLabel } from '../../entities/request/labels';
import { formatDateTime } from '../../shared/utils/formatDate';

interface RequestTableProps {
  requests: RequestSummaryDto[];
}

export function RequestTable({ requests }: RequestTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Subject</th>
          <th scope="col">Requester</th>
          <th scope="col">Status</th>
          <th scope="col">Category</th>
          <th scope="col">Priority</th>
          <th scope="col">Department</th>
          <th scope="col">Created</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id}>
            <td>
              <Link className="data-table__link" to={`/requests/${request.id}`}>
                {request.subject}
              </Link>
            </td>
            <td>
              <span className="data-table__requester-name">{request.requesterName}</span>
              <span className="data-table__requester-email">{request.requesterEmail}</span>
            </td>
            <td>
              <StatusBadge status={request.status} />
            </td>
            <td>{categoryLabel(request.category)}</td>
            <td>
              <PriorityBadge priority={request.priority} />
            </td>
            <td>{departmentLabel(request.department)}</td>
            <td>{formatDateTime(request.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
