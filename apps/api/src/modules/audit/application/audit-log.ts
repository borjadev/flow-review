import type { AuditEvent } from '../domain/audit-event.js';

/**
 * Output port for the append-only audit trail. Reads return events ordered by
 * occurrence (oldest first).
 */
export interface AuditLog {
  record(event: AuditEvent): Promise<void>;
  listByRequestId(requestId: string): Promise<AuditEvent[]>;
}
