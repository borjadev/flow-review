import type { Prisma, AuditEvent as PrismaAuditEvent } from '@prisma/client';
import type { PrismaDb } from '../../../shared/infrastructure/prisma/prisma-client.js';
import type { AuditLog } from '../application/audit-log.js';
import { AuditEvent } from '../domain/audit-event.js';

function toDomain(row: PrismaAuditEvent): AuditEvent {
  return AuditEvent.create({
    id: row.id,
    requestId: row.requestId,
    eventType: row.eventType,
    actorId: row.actorId,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    occurredAt: row.occurredAt,
  });
}

export class PrismaAuditLog implements AuditLog {
  constructor(private readonly db: PrismaDb) {}

  async record(event: AuditEvent): Promise<void> {
    await this.db.auditEvent.create({
      data: {
        id: event.id,
        requestId: event.requestId,
        eventType: event.eventType,
        actorId: event.actorId,
        payload: event.payload as Prisma.InputJsonValue,
        occurredAt: event.occurredAt,
      },
    });
  }

  async listByRequestId(requestId: string): Promise<AuditEvent[]> {
    const rows = await this.db.auditEvent.findMany({
      where: { requestId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map(toDomain);
  }
}
