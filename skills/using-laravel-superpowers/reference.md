# Using Laravel Superpowers Reference (Laravel)

Use this reference for implementation details and review criteria specific to `using-laravel-superpowers`.


## Skill Operating Checklist

### Design checklist
- Confirm scope boundaries before editing.
- Preserve backward compatibility unless task says otherwise.
- Validate negative paths, not only happy path.

### Validation commands
- rg --files
- composer validate
- ./vendor/bin/pest --filter=...

### Failure modes to test
- Invalid input or unauthorized actor.
- Partial failure / retry scenario (if async or multi-step).
- Boundary values and empty-state behavior.

