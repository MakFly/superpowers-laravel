# Eloquent Relations Reference (Laravel)

Use this reference for implementation details and review criteria specific to `eloquent-relations`.


## Skill Operating Checklist

### Design checklist
- Confirm scope boundaries before editing.
- Preserve backward compatibility unless task says otherwise.
- Validate negative paths, not only happy path.

### Validation commands
- php artisan migrate
- php artisan migrate:rollback --step=1
- ./vendor/bin/pest tests/Feature

### Failure modes to test
- Invalid input or unauthorized actor.
- Partial failure / retry scenario (if async or multi-step).
- Boundary values and empty-state behavior.

