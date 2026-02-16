---
name: laravel:policies-gates
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Implement Laravel authorization with policies and gates that enforce domain ownership and role-based constraints consistently.
---

# Policies and Gates (Laravel)

## Use when
- Securing CRUD or workflow transitions.
- Centralizing authorization logic currently spread across controllers.

## Default workflow
1. Map actors, resources, and actions (`view`, `create`, `update`, `delete`, domain actions).
2. Implement policy methods with explicit deny reasons when useful.
3. Wire controller/resource authorization via `authorize`, middleware, or `can`.
4. Add policy tests for owner/non-owner/admin edge cases.
5. Confirm unauthorized paths return expected status and payload.

## Guardrails
- Never rely on front-end-only access control.
- Keep authorization separate from validation/business logic.
- Check both resource ownership and action eligibility state.

## Output contract
- Policies/gates added or updated.
- Entry points enforcing authorization.
- Test matrix and uncovered edges.

## References
- `reference.md`
- `docs/complexity-tiers.md`
