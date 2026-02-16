# Laravel Policies Reference

## Decision model
- actor: who performs action
- resource: target entity
- action: allowed transition
- context: tenant/team/state constraints

## Integration points
- controller: `$this->authorize('update', $post)`
- middleware: `can:update,post`
- blade/api checks: `Gate::allows(...)`

## Test cases
- owner allowed
- outsider denied
- admin override (if applicable)
- invalid state denied
