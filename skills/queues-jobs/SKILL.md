---
name: laravel:queues-jobs
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Build reliable Laravel queued jobs and async workflows with idempotency, retries, failure handling, and observability.
---

# Queues and Jobs (Laravel)

## Use when
- Offloading slow work (notifications, integrations, media, heavy compute).
- Fixing retry/failure behavior in async pipelines.

## Default workflow
1. Define async boundary and payload contract.
2. Ensure job idempotency (dedupe key or safe re-run semantics).
3. Configure queue connection, retries, backoff, timeout, and failure hooks.
4. Handle partial failures with explicit compensating behavior.
5. Add tests for dispatch, handler behavior, and failure paths.

## Guardrails
- Never pass huge mutable models; pass IDs/immutable payload.
- Keep side effects explicit and retry-safe.
- Instrument failures and dead-letter handling.

## Output contract
- Job/queue config changes.
- Retry/backoff/idempotency decisions.
- Validation commands and async test outcomes.

## References
- `reference.md`
- `docs/complexity-tiers.md`
