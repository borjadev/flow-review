# ADR 0001 — Modular hexagonal architecture with Clean Architecture's dependency rule

- Status: Accepted
- Date: 2026-06-25

## Context

FlowReview models a real business process (classify → human review → decision) with
several external concerns: a relational database, an AI provider, and an HTTP API.
We want the business rules to be expressed clearly, tested without infrastructure,
and protected from churn in frameworks and external services. The codebase should
also read as a set of business capabilities, not a stack of technical layers.

## Decision

The backend follows a **modular hexagonal architecture** and applies **Clean
Architecture's dependency rule**. Domain and application code remain independent
from frameworks, persistence mechanisms and external AI providers.

Concretely:

- Code is organised by **module** (`requests`, `audit`, `users`), and inside each
  module by **layer**: `domain`, `application`, `infrastructure`, `presentation`.
- Dependencies only ever point inward:

  ```text
  presentation   -> application -> domain
  infrastructure -> application -> domain
  domain         -> (nothing external)
  ```

- The **domain** contains entities, value objects, domain events and domain
  errors. It imports no framework — no Express, Prisma, Zod, OpenAI SDK, logging
  library or environment access.
- The **application** layer defines **ports** (interfaces) and **use cases**. It
  depends on the domain only. It never references Express, Prisma, concrete
  infrastructure classes or AI SDKs.
- The **infrastructure** layer implements the ports (Prisma repositories, the
  fake/OpenAI classifiers, logger, clock, id generator).
- The **presentation** layer (Express controllers/routers) is thin: validate
  input, build a command, run a use case, map the result to HTTP.
- A single **composition root** (`composition-root.ts`) constructs the concrete
  implementations and wires them with **manual dependency injection** — no DI
  container.

## Why not a globally layered architecture?

A classic "global layers" approach (`/controllers`, `/services`, `/repositories`
at the top level) tends to:

- scatter a single business capability across many distant folders;
- encourage anaemic "service" classes that leak persistence concerns;
- make the dependency direction implicit and easy to violate.

Organising by module first keeps each capability cohesive ("screaming
architecture"), and the per-module layering makes the dependency rule explicit and
locally enforceable.

## Consequences

- The domain and application layers are unit-tested with in-memory test doubles —
  no database or network. This is fast and deterministic.
- Swapping infrastructure (e.g. fake ↔ OpenAI classifier, or Postgres ↔ another
  store) is a composition-root change, not a domain change.
- There is a small, deliberate cost: explicit mappers between Prisma models,
  domain objects and HTTP DTOs. We accept this as the price of decoupling.
- The shared `contracts` package holds only the HTTP contract (Zod schemas +
  inferred types). No domain entity lives there.
