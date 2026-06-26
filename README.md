# FlowReview

> AI-assisted classification of incoming support requests, with a human always in
> the loop. The AI proposes; a person reviews, corrects, approves or rejects. The
> human decision always wins, and every action is auditable.

FlowReview is a small but production-shaped portfolio project. Its goal is not to
show the largest number of features or patterns, but to demonstrate a **clear,
decoupled, testable and proportionate** solution to a real business process.

---

## 1. The problem

A company receives support requests through forms, email and other channels. Each
request has a `subject`, `description`, `requesterName` and `requesterEmail`.
Triaging them by hand is slow and inconsistent.

FlowReview analyses each request and proposes a **category, priority, target
department, summary, suggested response and confidence score**. A human reviewer
then validates the proposal — correcting any field, approving, or rejecting with a
mandatory comment. Failed or rejected classifications can be retried. Every step is
written to an audit trail.

## 2. Screenshots

> _Placeholder — add screenshots/GIFs here._
>
> - `docs/images/request-list.png` — request list with filters and status badges
> - `docs/images/request-details.png` — original request + AI proposal + routing
> - `docs/images/review-panel.png` — review panel showing proposed vs corrected
> - `docs/images/audit-timeline.png` — audit timeline

## 3. Demo flow

1. Pick a demo user in the header (Agent / Reviewer / Operations Manager).
2. Create a request, or open a seeded one.
3. **Classify** it — the AI proposes a category, priority, department, summary,
   suggested response and a confidence score; routing is derived from confidence.
4. As a reviewer, **approve** (optionally correcting fields) or **reject** (with a
   comment).
5. **Retry** rejected or failed classifications.
6. Inspect the full **audit log** of everything that happened.

## 4. Features

- Create, list and filter requests (by status, category, priority).
- Launch classification; view the proposal and confidence.
- Approve as-is, approve with corrections, or reject with a mandatory comment.
- Retry rejected/failed classifications.
- Full per-request audit log; previous analyses and decisions are preserved.
- Switch between demo users from the UI.
- Runs **fully offline** with a deterministic fake classifier; optionally uses
  OpenAI when configured.

## 5. Stack

- **Monorepo:** pnpm workspaces (no Nx/Turbo/Lerna)
- **Backend:** Node.js, TypeScript (`strict`), Express, Prisma, PostgreSQL, Zod,
  Vitest, Supertest, pino
- **Frontend:** React, Vite, React Router, TanStack Query, React Hook Form, Zod,
  Vitest, React Testing Library
- **Infra:** Docker, Docker Compose, GitHub Actions

## 6. Architecture

Modular **hexagonal architecture** applying Clean Architecture's **dependency
rule**. Domain and application code are independent from frameworks, persistence
and AI providers. See [`docs/architecture.md`](docs/architecture.md) for diagrams
and [`docs/decisions/`](docs/decisions) for the ADRs.

```mermaid
flowchart LR
  subgraph Web[apps/web · React]
  end
  subgraph API[apps/api · Express]
    P[Presentation] --> A[Application<br/>use cases + ports]
    I[Infrastructure<br/>Prisma · AI] --> A
    A --> D[Domain]
  end
  Web -->|HTTP /api| P
  I --> DB[(PostgreSQL)]
  I --> AI[[Fake / OpenAI classifier]]
```

Dependency rule:

```text
presentation   -> application -> domain
infrastructure -> application -> domain
domain         -> (no framework)
```

## 7. Repository structure

```text
flow-review/
├── apps/
│   ├── api/   # backend (hexagonal: domain / application / infrastructure / presentation)
│   └── web/   # frontend (feature-based React)
├── packages/
│   ├── contracts/      # shared HTTP contract: Zod schemas + inferred types ONLY
│   └── eslint-config/  # shared ESLint flat config
├── docs/
│   ├── architecture.md
│   ├── implementation-plan.md
│   └── decisions/  # ADR 0001 / 0002 / 0003
├── docker/         # api + web Dockerfiles, nginx config
├── docker-compose.yml
├── .github/workflows/ci.yml
└── env.example
```

## 8. Running the project

### With Docker (recommended)

```bash
docker compose up --build
```

This starts PostgreSQL, the API (runs migrations + seeds demo data), and the web
client:

- Web: <http://localhost:8090>
- API: <http://localhost:4000/api/health>

> Host ports: the web is published on `8090` and PostgreSQL on `5433` (instead of
> the usual `8080`/`5432`) to avoid clashing with services commonly already running
> locally. Inter-container traffic is unaffected.

### Locally (Node + pnpm)

```bash
pnpm install
cp env.example .env            # at the REPOSITORY ROOT — see note below

# start a Postgres (any way you like) and point DATABASE_URL (in .env) at it, e.g.:
docker run -d --name flowreview-db -e POSTGRES_USER=flowreview \
  -e POSTGRES_PASSWORD=flowreview -e POSTGRES_DB=flowreview \
  -p 5433:5432 postgres:16-alpine
# then set in .env: DATABASE_URL=postgresql://flowreview:flowreview@localhost:5433/flowreview?schema=public

pnpm db:migrate                # apply migrations
pnpm db:seed                   # load demo users + requests
pnpm dev                       # run api (:4000) and web (:5173) together
```

The root `.env` is loaded automatically by both the API (via `dotenv`) and the
Prisma CLI (via `prisma.config.ts`) — you do not need to export variables manually.

> **Note on `env.example`:** the template is named `env.example` (without a leading
> dot) instead of the more usual `.env.example` because the sandbox used to build
> this project blocks writing any `.env*` path for safety. Copy it to `.env` with
> `cp env.example .env`.

### Useful commands

```bash
pnpm dev          # api + web in watch mode
pnpm test         # unit tests (domain, application, infra, http, frontend)
pnpm lint         # ESLint across the workspace
pnpm typecheck    # tsc --noEmit across the workspace
pnpm build        # build all packages
pnpm db:migrate   # prisma migrate deploy (api)
pnpm db:seed      # reproducible demo data (api)

pnpm --filter @flow-review/api test:integration   # Prisma tests (needs Postgres)
```

## 9. Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime mode |
| `API_PORT` | `4000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed web origin(s), comma-separated |
| `DATABASE_URL` | — | PostgreSQL connection string (required) |
| `AI_PROVIDER` | `fake` | `fake` or `openai` |
| `OPENAI_API_KEY` | — | Only used when `AI_PROVIDER=openai` |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model |
| `CLASSIFIER_MAX_RETRIES` | `2` | Retry attempts for transient classifier errors |
| `ROUTING_CONFIDENCE_THRESHOLD` | `0.55` | Below this, routing falls back to general support |
| `LOG_VERBOSE_PAYLOADS` | `false` | Dev-only: include request content in logs |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Web → API base URL |

## 10. Fake AI provider

By default FlowReview uses `FakeRequestClassifier`: a deterministic, rule-based
classifier that maps keywords to a category/department, detects priority, and
produces a content-derived confidence score. It needs no API key, makes no network
calls, and returns the same output for the same input — ideal for offline demos and
reproducible tests. See [ADR 0002](docs/decisions/0002-fake-ai-provider-by-default.md).

## 11. OpenAI adapter

When `AI_PROVIDER=openai` and a valid `OPENAI_API_KEY` is set, `OpenAIRequestClassifier`
is used instead. It:

- isolates the OpenAI SDK entirely within one infrastructure adapter;
- requests a structured (JSON) response and validates it with Zod;
- translates external failures into the application's classifier error taxonomy
  (`Transient` / `Permanent` / `InvalidResponse`) without leaking SDK details;
- never logs the API key or unnecessary sensitive data.

If `openai` is selected without a key, the factory logs a warning and falls back to
the fake provider so the app always boots.

## 12. Testing

- **Domain** — transitions (valid/invalid), approve, approve-with-changes, reject
  (with/without comment), retry, confidence-range, immutability of approved requests.
- **Application** — create, classify success/failure, analysis persistence, audit
  recording, approve/approve-with-changes/reject, retry, not-found — all with
  in-memory adapters (no Prisma).
- **Infrastructure** — fake classifier, classifier factory, retry & logging
  decorators, OpenAI adapter (fake client), Prisma ↔ domain mappers.
- **Integration** — real Prisma repositories + unit of work against PostgreSQL.
- **HTTP** — Supertest covering create, classify, approve, reject, validation, 404
  and 409.
- **Frontend** — list rendering, create form, loading/error states, review panel
  (approve-with-corrections, reject-without-comment), state-based actions.

Coverage thresholds are enforced for the `domain` and `application` layers.

## 13. Design patterns

| Pattern | Problem solved |
| --- | --- |
| Adapter | Isolates external AI providers (`Fake` / `OpenAI`) behind `RequestClassifier` |
| Strategy | Encapsulates the post-classification routing policy (`ConfidenceAwareRoutingStrategy`) |
| Decorator | Adds retries and logging around the classifier, transparently |
| Factory | Builds the configured classifier + its decorators (`createRequestClassifier`) |
| Lightweight state machine | Protects workflow transitions with an explicit table |
| Domain events | Decouples the audit side-effect from the aggregate |
| Test Data Builder | Improves readability of domain/application tests |

## 14. Patterns intentionally not used

Knowing a pattern does not mean using it when the problem does not call for it.

- **Singleton** — dependencies are created once in the composition root and injected;
  a global single-instance enforcer adds nothing here.
- **Prototype** — there is no expensive object graph to clone.
- **Bridge** — there is no two-dimensional abstraction/implementation matrix to vary
  independently.
- **Composite** — the domain has no recursive part-whole tree.
- **Abstract Factory** — there is no *family* of related products to build together;
  a single factory function for the classifier is sufficient.
- **Class-per-state (State)** — states differ in allowed transitions, not in rich
  behaviour (see [ADR 0003](docs/decisions/0003-lightweight-state-machine.md)).
- **Generic `Repository<T>` / Unit-of-Work framework** — small, purpose-specific
  ports are clearer than a generic abstraction.

## 15. Trade-offs

- **Routing is derived on read**, not persisted, to avoid duplicated state. If
  routing history mattered, it would deserve its own record.
- **Explicit mappers** (Prisma ↔ domain ↔ DTO) cost some boilerplate; we accept it
  to keep the domain pure and the boundaries honest.
- **Synchronous classification** keeps the design simple and avoids a queue. A
  request never lingers in `ANALYSING`: only the final outcome is persisted.
- **`exactOptionalPropertyTypes` is off** while every other `strict` flag is on;
  the extra flag added friction disproportionate to its value for this codebase.
- **Audit is an explicit action log, not event sourcing** — the aggregate remains
  the source of truth.

## 16. Decisions intentionally avoided

No real authentication, OAuth, queues/brokers, microservices, Kubernetes, event
sourcing/CQRS, WebSockets, file uploads, a generic workflow/rules engine, or
speculative abstractions. The demo user selector is a **simulation for review
purposes only** — it is not a secure authentication mechanism.

## 17. Limitations

- The fake classifier is keyword-based, not a real model.
- The OpenAI path is unit-tested with a fake client but not against the live API in CI.
- Demo "users" carry no permissions or security; `X-User-Id` is trusted as-is.
- Seeding clears and recreates data; it is meant for demos, not production.

## 18. Possible next steps

- Real authentication/authorization and per-role permissions.
- Asynchronous classification via a queue for higher throughput.
- Persisted routing decisions and SLA timers.
- Richer analytics over the audit trail.
- Live OpenAI contract tests behind a guarded CI job.

---

## License

MIT — see [LICENSE](LICENSE).
