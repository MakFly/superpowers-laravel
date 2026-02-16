# Laravel Migrations Reference

## Safe rollout pattern
1. Add nullable/new columns
2. Deploy code writing both old/new
3. Backfill existing rows in chunks
4. Switch reads to new column
5. Drop legacy column in later release

## Command set
- `php artisan make:migration ...`
- `php artisan migrate`
- `php artisan migrate:rollback --step=1`
- `php artisan schema:dump` (if adopted)

## Review checklist
- indexes for new query paths
- FK names explicit on critical tables
- down() behavior documented when irreversible
