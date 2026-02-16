# Laravel Queues Reference

## Reliability checklist
- `tries`, `timeout`, `backoff`
- `ShouldQueue` + queue name assignment
- idempotent `handle()` behavior
- `failed()` hook behavior

## Typical patterns
- dispatch after commit for DB consistency
- chunked jobs for large datasets
- job chaining/batching where ordering matters

## Tests
- `Queue::fake()` dispatch assertions
- job handler unit tests
- failure branch test for retryable/non-retryable errors
