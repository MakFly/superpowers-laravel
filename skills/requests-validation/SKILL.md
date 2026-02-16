---
name: laravel:requests-validation
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Build robust Laravel request validation using FormRequest classes, custom rules, and clear domain-safe error contracts.
---

# Requests Validation (Laravel)

## Use when
- Adding or modifying input validation on create/update/search endpoints.
- Migrating controller-inline validation to FormRequest.

## Default workflow
1. Introduce/extend `FormRequest` class per endpoint intent.
2. Encode rules, normalization, and authorization gate in one place.
3. Add custom rule objects for reusable domain constraints.
4. Standardize validation error payload shape.
5. Cover valid/invalid payload permutations with feature tests.

## Guardrails
- Do not duplicate rules across controllers/services.
- Prefer explicit whitelisting over permissive arrays.
- Keep cross-field constraints in custom rules or after hooks.

## Output contract
- FormRequest and rule changes.
- Error contract behavior.
- Test coverage and failures prevented.

## References
- `reference.md`
- `docs/complexity-tiers.md`
