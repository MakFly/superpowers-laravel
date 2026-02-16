---
name: laravel:eloquent-relations
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Model and optimize Laravel Eloquent relationships with correct cardinality, constraints, eager loading, and query performance.
---

# Eloquent Relations (Laravel)

## Use when
- Designing new model relationships.
- Fixing N+1 issues or incorrect relation semantics.

## Default workflow
1. Define cardinality and ownership (`hasOne`, `hasMany`, `belongsTo`, `morph*`).
2. Encode FK constraints and cascading rules in migrations.
3. Implement relation methods with explicit keys where non-standard.
4. Optimize query paths with eager loading and constrained loads.
5. Add tests validating relation integrity and serialization behavior.

## Guardrails
- Avoid hidden lazy loads in loops/resources.
- Keep relation naming consistent and domain-meaningful.
- Ensure DB constraints match model intent.

## Output contract
- Relations and schema changes.
- Performance considerations applied.
- Tests for integrity and query behavior.

## References
- `reference.md`
- `docs/complexity-tiers.md`
