/**
 * Marker interface for domain events. Events describe something that already
 * happened in the domain, expressed in past tense. They are collected by an
 * aggregate and dispatched synchronously, in-memory, after the aggregate is
 * persisted. They are NOT an event-sourcing log — the aggregate state is the
 * source of truth.
 */
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly actorId: string | null;
}
