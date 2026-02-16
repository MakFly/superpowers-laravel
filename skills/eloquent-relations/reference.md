# Eloquent Relations Reference

## Design checklist
- cardinality correctness
- nullable vs required FK
- cascade delete/update policy
- inverse relation present

## Performance checklist
- use `with()` / `loadMissing()` intentionally
- avoid eager-loading unused heavy relations
- add indexes for join/filter columns

## Tests
- relation attach/detach/sync scenarios
- deletion behavior under FK constraints
- serialization shape with loaded relations
