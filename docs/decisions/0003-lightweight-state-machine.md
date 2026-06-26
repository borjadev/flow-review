# ADR 0003 — Lightweight state machine over class-per-state

- Status: Accepted
- Date: 2026-06-25

## Context

A `SupportRequest` moves through a small, well-defined lifecycle:

```text
SUBMITTED -> ANALYSING -> AWAITING_REVIEW -> APPROVED
                       -> CLASSIFICATION_FAILED
AWAITING_REVIEW -> REJECTED
REJECTED | CLASSIFICATION_FAILED -> ANALYSING
APPROVED -> (terminal)
```

We need to guarantee that only valid transitions happen, and that invalid ones
raise an explicit domain error.

## Decision

Model the workflow with a **lightweight state machine**: an explicit transition
table plus a `canTransition(from, to)` guard, enforced by the aggregate's private
`transitionTo` method. Each public business method (`startClassification`,
`completeClassification`, `failClassification`, `approve`, `reject`,
`retryClassification`) checks the transition and raises an
`InvalidStateTransitionError` when it is not allowed.

We deliberately **do not** implement a class-per-state (State pattern).

## Rationale

The State pattern shines when each state carries substantially different
**behaviour** that benefits from polymorphism. Here, the states differ almost
entirely in their **allowed transitions**, not in rich behaviour. A class per
state would add six classes and indirection to express what a single, readable
transition table already expresses — accidental complexity with no payoff.

The transition table is the single source of truth and is directly unit-tested
(every allowed transition, and representative forbidden ones, including the
terminal `APPROVED` state).

## Consequences

- Adding or changing a transition is a one-line edit in the table.
- If, in the future, states grow genuinely distinct behaviour, revisiting the
  State pattern would be justified — it is not today.
- This is an explicit example of the project's guiding principle: **knowing a
  pattern does not mean using it when the problem does not call for it.**
