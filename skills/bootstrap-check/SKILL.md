---

name: laravel:bootstrap-check
allowed-tools:
  - Read
  - Glob
  - Grep
description: Apply production-grade Laravel architecture and execution discipline for focused, low-risk delivery. Use for bootstrap check tasks.
---

# Bootstrap Check (Laravel)

## Use when
- Refining project structure, services/providers, or execution strategy.
- Planning/executing medium-to-complex implementation steps.

## Default workflow
1. Map current boundaries and constraints before edits.
2. Design smallest coherent architectural adjustment.
2. Implement in vertical slices with checkpoint validation.
2. Summarize tradeoffs and follow-up actions.

## Guardrails
- Prefer project conventions over novel abstractions.
- Avoid scope creep outside requested objective.
- Keep orchestration deterministic and reviewable.

## Progressive disclosure
- Start with this file for execution posture and constraints.
- Load references only for deep implementation detail or edge cases.

## Output contract
- Boundary/structure updates.
- Checkpoint commands and outcomes.
- Tradeoffs and residual risks.

## References
- `reference.md`
- `docs/complexity-tiers.md`
