---
name: laravel:quality-checks
allowed-tools:
  - Read
  - Glob
  - Grep
description: Run Laravel quality gates (lint/static analysis/tests) with fast-fail strategy and remediation-priority reporting.
---

# Quality Checks (Laravel)

## Use when
- Before merge/release.
- After refactors touching multiple layers.

## Default workflow
1. Detect project-native check scripts first.
2. Run syntax/static checks before full tests.
3. Execute targeted tests then full suite when needed.
4. Classify failures: code defect vs env/tooling flake.
5. Report prioritized fix order with exact failing artifacts.

## Guardrails
- Prefer repository-native commands over ad-hoc alternates.
- Preserve failing logs/snippets for traceability.
- Do not mask flaky failures; label them explicitly.

## Output contract
- Commands executed in order.
- Pass/fail per gate.
- Blocking findings ranked by severity.

## References
- `reference.md`
- `docs/complexity-tiers.md`
