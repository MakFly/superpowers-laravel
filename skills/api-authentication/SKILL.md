---
name: laravel:api-authentication
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: Implement secure Laravel API authentication flows (token/session, refresh, revocation) with explicit threat-aware validation and tests.
---

# API Authentication (Laravel)

## Use when
- Building or fixing login/register/logout/refresh endpoints.
- Hardening token lifecycle, guards, or auth middleware behavior.

## Default workflow
1. Identify active auth stack (Sanctum, Passport, JWT, session) from config and routes.
2. Define auth contract: login input, issued token/session shape, expiration, revocation.
3. Enforce validation + throttling + lockout behavior.
4. Implement guard-safe flows (web/api separation) and standardized auth errors.
5. Add feature tests for success, invalid creds, expired/revoked token, unauthorized access.

## Guardrails
- Never leak whether email/username exists.
- Rotate refresh credentials where supported.
- Revoke tokens on logout/password reset events.
- Apply rate limiting on auth endpoints.

## Output contract
- Auth scheme detected and chosen behavior.
- Endpoints/middleware changed.
- Tests added/updated and command results.
- Remaining risk (session fixation, replay windows, etc.).

## References
- `reference.md`
- `docs/complexity-tiers.md`
