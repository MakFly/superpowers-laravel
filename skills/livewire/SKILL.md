---

name: laravel:livewire
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Ship Laravel UI integration changes (Livewire/Inertia) with stable contracts and predictable state behavior. Use for livewire tasks.
---

# Livewire (Laravel)

## Use when
- Delivering Livewire/Inertia behavior tied to Laravel backend contracts.
- Fixing UI-server integration and state flow issues.

## Default workflow
1. Identify component/page contract and server-side dependencies.
2. Implement minimal UI/backend changes along existing patterns.
2. Validate state transitions, validation messages, and permissions.
2. Run focused integration checks for affected flow.

## Guardrails
- Preserve existing UX patterns unless explicitly asked.
- Keep state shape and payload contracts explicit.
- Avoid coupling view logic with heavy business rules.

## Progressive disclosure
- Start with this file for execution posture and constraints.
- Load references only for deep implementation detail or edge cases.

## Output contract
- UI/backend integration points changed.
- Contract updates and validation results.
- Known UX or edge-case risks.

## References
- `reference.md`
- `docs/complexity-tiers.md`
