---

name: laravel:eloquent-casts-accessors
allowed-tools:
  - Read
  - Glob
  - Grep
description: Model and evolve Laravel data structures safely with integrity, performance, and rollout-aware migrations. Use for eloquent casts accessors tasks.
---

# Eloquent Casts Accessors (Laravel)

## Use when
- Designing schema/relations or data lifecycle changes.
- Improving query performance and integrity guarantees.

## Default workflow
1. Define domain ownership/cardinality and compatibility constraints.
2. Apply additive-safe schema/relationship changes first.
2. Update query loading/index strategy for affected paths.
2. Validate migration/relation behavior and rollback posture.

## Guardrails
- Preserve data integrity with constraints and transactions where needed.
- Avoid destructive one-step production migrations.
- Eliminate hidden N+1 in hot paths.

## Progressive disclosure
- Start with this file for execution posture and constraints.
- Load references only for deep implementation detail or edge cases.

## Output contract
- Schema/model/relation changes.
- Migration sequencing and rollback notes.
- Validation commands and observed outcomes.

## References
- `reference.md`
- `docs/complexity-tiers.md`
