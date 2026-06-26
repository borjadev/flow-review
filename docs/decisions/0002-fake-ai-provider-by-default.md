# ADR 0002 — Fake AI provider by default

- Status: Accepted
- Date: 2026-06-25

## Context

The product classifies support requests using an AI provider (e.g. OpenAI).
Depending on a live, paid, non-deterministic external service for the application
to run would make local development, demos, automated tests and CI slow, costly
and flaky. At the same time, we must keep the door open to a real provider.

## Decision

The default classifier is a **deterministic, rule-based `FakeRequestClassifier`**.
It is selected unless `AI_PROVIDER=openai` AND a valid `OPENAI_API_KEY` is present.
If `openai` is requested without a key, the factory logs a warning and falls back
to the fake provider, so the application always boots.

Both providers implement the same `RequestClassifier` port (Adapter pattern) and
are built by `createRequestClassifier(config)` (Factory), which also wraps them
with retry and logging decorators.

## Rationale

- **Runs with zero cost and zero setup** — `docker compose up` and the test suite
  work offline, with no API key.
- **Deterministic tests** — the fake classifier maps keywords to a fixed result,
  so application and HTTP tests assert exact outcomes.
- **Reproducible demos** — seed data produces the same classifications every time.
- **Isolation of the real provider** — the OpenAI SDK lives entirely inside one
  infrastructure adapter; its errors are translated into the application's
  classifier error taxonomy and never leak outward.

## Consequences

- The fake classifier must be *realistic enough* (varied categories, priorities
  and confidences driven by content) to make demos meaningful. It is, by design,
  not a real model.
- The OpenAI path is covered by unit tests using a fake client (valid response,
  invalid JSON, schema mismatch, 4xx/5xx mapping), but is not exercised against
  the live API in CI.
