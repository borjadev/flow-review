/**
 * Output port producing unique identifiers. Abstracted so the domain never
 * depends on a concrete id strategy (UUID, ULID, ...).
 */
export interface IdGenerator {
  next(): string;
}
