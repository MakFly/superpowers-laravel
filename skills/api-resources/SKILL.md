---
name: laravel:api-resources
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Design and implement Laravel API Resources as stable response contracts with predictable shape, conditional fields, and relationship loading discipline.
---

# API Resources (Laravel)

## Use when
- Creating or changing JSON response contracts.
- Replacing ad-hoc controller arrays with consistent resource classes.

## Default workflow
1. Define response contract first (required fields, nullable fields, relationship blocks).
2. Implement `JsonResource`/`ResourceCollection` for each contract boundary.
3. Use `whenLoaded`, `when`, `mergeWhen` for conditional fields.
4. Ensure controller/query layer eager-loads exactly what resource requires.
5. Add feature tests that assert JSON structure and key invariants.

## Guardrails
- Avoid leaking internal DB fields.
- Keep formatting logic in resources, not controllers.
- Avoid triggering lazy loads inside resources.

## Output contract
- Resource classes introduced/updated.
- Controller/query changes for loading strategy.
- JSON contract tests and outcomes.

## References
- `reference.md`
- `docs/complexity-tiers.md`
