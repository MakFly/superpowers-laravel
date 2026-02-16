---
name: laravel:tdd-with-pest
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Drive Laravel feature development with Pest using strict RED-GREEN-REFACTOR loops and high-signal test design.
---

# TDD with Pest (Laravel)

## Use when
- Implementing new behavior where regressions are costly.
- Fixing bugs with reproducible failing tests.

## Default workflow
1. Write a failing Pest test that captures expected behavior and edge case.
2. Implement minimal code to make the test pass.
3. Refactor for readability/design without changing behavior.
4. Expand test coverage for boundary cases and authorization/validation paths.
5. Run targeted then broader suite.

## Guardrails
- No implementation before a failing test (except setup scaffolding).
- Keep tests deterministic and isolated.
- Avoid asserting implementation details over behavior.

## Output contract
- RED test introduced.
- GREEN implementation summary.
- REFACTOR changes and final validation results.

## References
- `reference.md`
- `docs/complexity-tiers.md`
