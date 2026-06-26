/**
 * Output port providing the current time. Injecting the clock keeps use cases
 * and the domain deterministic and trivially testable.
 */
export interface Clock {
  now(): Date;
}
