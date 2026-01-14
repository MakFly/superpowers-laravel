---
name: /laravel-migration
description: Generate and run migration
---

# Laravel Migration Generator

I'll help you create and run database migrations.

## Usage

```bash
# Create migration
php artisan make:migration create_vehicles_table

# Create migration with model
php artisan make:model Vehicle -m

# Run migration
php artisan migrate

# Rollback migration
php artisan migrate:rollback

# Fresh migration (drop all tables)
php artisan migrate:fresh
```

## Example Migration

```php
// database/migrations/2024_01_15_000000_create_vehicles_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('make');
            $table->string('model');
            $table->integer('year');
            $table->decimal('price', 10, 2);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'sold', 'pending'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['make', 'model']);
            $table->index('year');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
```

## Column Types Reference

| Type | Description |
|------|-------------|
| `$table->id()` | Primary key |
| `$table->foreignId('user_id')` | Foreign key |
| `$table->string('name')` | VARCHAR |
| `$table->text('body')` | TEXT |
| `$table->integer('count')` | INTEGER |
| `$table->decimal('price', 10, 2)` | DECIMAL |
| `$table->boolean('is_active')` | BOOLEAN |
| `$table->date('birthday')` | DATE |
| `$table->dateTime('published_at')` | DATETIME |
| `$table->enum('status', ['a', 'b'])` | ENUM |
| `$table->json('settings')` | JSON |
| `$table->timestamp('expires_at')` | TIMESTAMP |

## Modifiers

```php
$table->string('email')->unique();
$table->string('name')->nullable();
$table->string('country')->default('FR');
$table->string('slug')->index();
```

What migration would you like to create?
1. Tell me the table name
2. Describe the columns and relationships
3. I'll generate the migration code
