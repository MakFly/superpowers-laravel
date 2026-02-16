# Queues Jobs Reference (Laravel)

Use this reference for implementation details and review criteria specific to `queues-jobs`.


## Skill Operating Checklist

### Design checklist
- Confirm scope boundaries before editing.
- Preserve backward compatibility unless task says otherwise.
- Validate negative paths, not only happy path.

### Validation commands
- php artisan queue:work --once
- php artisan queue:failed
- ./vendor/bin/pest --filter=queue

### Failure modes to test
- Invalid input or unauthorized actor.
- Partial failure / retry scenario (if async or multi-step).
- Boundary values and empty-state behavior.

