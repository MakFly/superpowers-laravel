# Laravel API Resources Reference

## Resource checklist
- dedicated resource class per API contract
- deterministic key naming
- explicit date/number formatting
- relation blocks via `whenLoaded`

## Anti-patterns
- returning Eloquent models directly
- relation access without eager-loading
- polymorphic response shape without versioning

## Recommended tests
- `assertJsonStructure`
- snapshot/shape assertions for critical endpoints
- tests for absent optional relations
