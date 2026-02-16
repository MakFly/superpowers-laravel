# Laravel Quality Checks Reference

## Preferred gate order
1. `composer validate`
2. static analysis (`phpstan`/project script)
3. tests (`pest` or `php artisan test`)
4. style (`pint --test` or fixer dry-run)

## Reporting format
- command
- status
- key failing file/test
- suggested first fix

## Typical blockers
- stale snapshots/fixtures
- env-dependent tests
- static analysis baseline drift
