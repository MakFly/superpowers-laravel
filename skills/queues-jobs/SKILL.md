---
name: laravel:queues-jobs
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Implement reliable Laravel async workflows (queues/events/cache) with idempotency and failure handling. Use for queues jobs tasks.
---

# Queues Jobs (Laravel)

## Use when
- Offloading heavy work to queues/events/cache workflows.
- Stabilizing retries, idempotency, and failure handling.

## Default workflow
1. Define async payload contract and idempotency strategy.
2. Implement handler/job with explicit retry/backoff behavior.
2. Configure observability and failure handling.
2. Verify dispatch + execution + failure paths with tests.

## Guardrails
- Do not pass oversized mutable payloads.
- Assume at-least-once delivery and code for safe retries.
- Instrument failures and dead-letter handling.

## Progressive disclosure
- Start with this file for execution posture and constraints.
- Load references only for deep implementation detail or edge cases.

## Output contract
- Async components changed and queue/cache strategy.
- Retry/backoff/failure decisions.
- Validation evidence for success and failure paths.

## References
- `reference.md`
- `docs/complexity-tiers.md`
