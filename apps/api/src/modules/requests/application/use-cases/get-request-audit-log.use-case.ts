import { NotFoundError } from '../../../../shared/application/application-error.js';
import type { AuditLog } from '../../../audit/application/audit-log.js';
import type { AuditEventView } from '../dto/views.js';
import { toAuditEventView } from '../mappers/view-mapper.js';
import type { RequestRepository } from '../ports/repositories.js';

export interface GetRequestAuditLogQuery {
  requestId: string;
}

export class GetRequestAuditLogUseCase {
  constructor(
    private readonly requests: RequestRepository,
    private readonly auditLog: AuditLog,
  ) {}

  async execute(query: GetRequestAuditLogQuery): Promise<AuditEventView[]> {
    const request = await this.requests.findById(query.requestId);
    if (!request) {
      throw new NotFoundError('SupportRequest', query.requestId);
    }
    const events = await this.auditLog.listByRequestId(query.requestId);
    return events.map(toAuditEventView);
  }
}
