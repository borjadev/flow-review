# FlowReview — Implementation Plan

> Living document. Tasks are checked off as they are completed and verified.
> The guiding principle is **proportionality**: build a clear, decoupled, testable
> solution that matches the problem — not a showcase of every pattern.

## Goal

A small business platform that classifies incoming support requests with AI and lets a
human reviewer correct, approve or reject the proposal. The human decision always wins.

## Architectural decisions (locked)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Backend architecture | Modular hexagonal + Clean Architecture dependency rule | Domain/application stay framework-free; adapters are swappable |
| Dependency injection | Manual, in `composition-root.ts` | No DI container needed at this size; explicit wiring is clearer |
| Default AI provider | `FakeRequestClassifier` (deterministic) | Runs with no key, no cost, deterministic tests (ADR-0002) |
| State control | Lightweight state machine (transition table) | States differ in allowed transitions, not polymorphic behavior (ADR-0003) |
| Audit | Explicit action log, NOT event sourcing | Aggregate is the source of truth; audit is a side history |
| Domain events | In-memory synchronous dispatcher | Decouples audit side effects without an enterprise event bus |
| Shared package | `contracts` = Zod schemas + HTTP types only | No domain entities leak into the shared package |
| Env template | `env.example` (no leading dot) | Harness blocks `.env*` paths; documented in README |

## Tech stack

- **Monorepo**: pnpm workspaces (no Nx/Turbo/Lerna)
- **Backend**: Node + TS strict, Express, Prisma, PostgreSQL, Zod, Vitest, Supertest
- **Frontend**: React, Vite, React Router, TanStack Query, React Hook Form, Zod, Vitest, RTL
- **Infra**: Docker, Docker Compose, GitHub Actions

## Phases & tasks

### Phase 0 — Foundation
- [x] git init, monorepo root (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`)
- [x] `.gitignore`, `env.example`, `LICENSE`, prettier config
- [x] `docs/implementation-plan.md`

### Phase 1 — Shared contracts package — DONE
- [x] `packages/contracts`: Zod schemas + inferred HTTP DTO types + enums (+ tests)
- [x] `packages/eslint-config`: shared ESLint flat config (node + react)

### Phase 2 — Backend domain (no frameworks) — DONE (42 tests green)
- [x] Shared kernel: `DomainError`, `DomainEvent`, `Clock`, `IdGenerator`
- [x] Value objects: `EmailAddress`, `ConfidenceScore`, enums (Category, Priority, Department)
- [x] State machine: `RequestStatus` + transition table + `InvalidStateTransitionError`
- [x] `SupportRequest` aggregate root with explicit business methods + domain events
- [x] `Classification`, `ReviewDecision`, `AuditEvent` entities/value objects
- [x] Domain unit tests (transitions, approve/reject, confidence range, immutability)

### Phase 3 — Backend application — DONE (56 tests green, typecheck clean)
- [x] Ports: repositories, classifier (+error taxonomy), AuditLog, UserRepository, Clock, IdGenerator, UnitOfWork
- [x] Routing Strategy: `RoutingStrategy` + `ConfidenceAwareRoutingStrategy`
- [x] Use cases: Create, List, GetDetails, Classify, Review, Retry, GetAuditLog, ListDemoUsers
- [x] DTOs (views) + mappers (domain → DTO)
- [x] In-memory adapters (test doubles) + test context
- [x] Application unit tests (success, failure, persistence, audit, not-found)

### Phase 4 — Backend infrastructure — DONE (verified vs real Postgres)
- [x] Prisma schema + init migration + mappers (Prisma ↔ domain)
- [x] Prisma repositories + Prisma-based UnitOfWork (`$transaction`)
- [x] `FakeRequestClassifier` (keyword rules, deterministic, varied)
- [x] `OpenAIRequestClassifier` (SDK isolated, Zod-validated output, error mapping)
- [x] Decorators: `LoggingRequestClassifierDecorator`, `RetryingRequestClassifierDecorator`
- [x] Factory: `createRequestClassifier(config)`
- [x] Structured logger (pino), config loader (Zod-validated env)
- [x] Infrastructure tests + integration tests (3 green vs real Postgres)

### Phase 5 — Backend presentation (HTTP) — DONE
- [x] Express app, Helmet, CORS, request-id middleware, centralized error handler
- [x] Controllers (thin) + routers for all endpoints
- [x] `composition-root.ts`, `app.ts`, `server.ts`
- [x] HTTP tests (Supertest): create, classify, approve, reject, validation, 404, 409

### Phase 6 — Frontend (delegated; in progress)
- [ ] App shell: router, providers (Query + demo user), layout
- [ ] API client + entities/request types from contracts
- [ ] Features: request-list (+filters), request-creation, request-details, request-review
- [ ] Demo user selector → `X-User-Id`
- [ ] CSS (clean B2B), status/priority badges, audit timeline
- [ ] Frontend tests (RTL): list, create, loading/error, review approve-with-changes, reject-without-comment, state-based actions

### Phase 7 — Infra, seed, CI
- [x] Seed (3 users, 8 requests across categories/states/confidence) — verified vs Postgres
- [x] Dockerfiles (api, web) + `docker-compose.yml` (db + api + web, migrate + seed, volume)
- [x] GitHub Actions CI (install, lint, typecheck, unit, integration w/ postgres service, build)

### Phase 8 — Docs & review
- [x] `docs/architecture.md` (boundaries, ports, flows, Mermaid)
- [x] ADR 0001 (hexagonal), 0002 (fake default), 0003 (lightweight state machine)
- [x] `README.md` (full: problem, flow, stack, patterns table, trade-offs, limitations)
- [x] Final: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — ALL PASS
- [x] `docker compose up --build` verified: db + api (migrate+seed) + web all boot and serve

## Risks

| Risk | Mitigation |
| --- | --- |
| Scope is very large | Build inside-out by layer; verify each layer before moving on |
| Prisma/Postgres needed for integration tests | Use docker-compose service in CI; unit tests use in-memory adapters |
| OpenAI optional path untested without key | Mock the SDK in tests; fake provider is the default path |
| Circular deps domain↔infra | Enforce via dependency rule + import discipline; lint check |

## Completion criteria

All boxes above checked, and `lint + typecheck + test + build` pass for real
(outputs pasted into the final report). All acceptance-criteria items from the brief satisfied.
