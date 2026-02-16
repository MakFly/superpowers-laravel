---
name: laravel:migrations
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Create safe Laravel database migrations with backward-compatible rollout strategy, data integrity protections, and rollback awareness.
---

# Migrations (Laravel)

## Use when
- Adding/changing schema in active environments.
- Planning rollout-safe DB changes with minimal downtime.

## Default workflow
1. Define migration objective and backward-compatibility constraints.
2. Split risky changes into additive -> backfill -> switch -> cleanup phases.
3. Add indexes/constraints intentionally with naming discipline.
4. Validate rollback feasibility and data-loss implications.
5. Test migration up/down in local or CI DB.

## Guardrails
- Avoid destructive one-step migrations in production paths.
- Never assume instant lock-free schema changes on large tables.
- Pair schema changes with code rollout order.

## Output contract
- Migration plan and sequencing.
- Commands run and outcomes.
- Rollback and operational risk notes.

## References
- `reference.md`
- `docs/complexity-tiers.md`
