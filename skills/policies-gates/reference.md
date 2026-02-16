# Policies Gates Reference (Laravel)

Use this reference for implementation details and review criteria specific to `policies-gates`.


## Skill Operating Checklist

### Design checklist
- Confirm scope boundaries before editing.
- Preserve backward compatibility unless task says otherwise.
- Validate negative paths, not only happy path.

### Validation commands
- php artisan route:list
- ./vendor/bin/pest tests/Feature --filter=auth
- php artisan test --filter=policy

### Failure modes to test
- Invalid input or unauthorized actor.
- Partial failure / retry scenario (if async or multi-step).
- Boundary values and empty-state behavior.

