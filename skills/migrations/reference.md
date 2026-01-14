# Reference

---
name: laravel:migrations
description: Database schema versioning with migrations
---

# Database Migrations

## Creating Migrations

```bash
# Create migration
php artisan make:migration create_vehicles_table

# Create migration with model
php artisan make:model Vehicle -m

# Create specific table
php artisan make:migration add_price_to_vehicles_table --table=vehicles
```

## Migration Structure

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
            $table->string('make');
            $table->string('model');
            $table->integer('year');
            $table->decimal('price', 10, 2);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'sold', 'pending'])->default('active');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
```

## Column Types

```php
// Basic types
$table->id();                       // bigint unsigned PK
$table->foreignId('user_id');       // FK reference
$table->string('name', 100);        // varchar(100)
$table->text('description');        // text
$table->integer('count');           // int
$table->bigInteger('views');        // bigint
$table->decimal('price', 10, 2);    // decimal(10,2)
$table->boolean('is_active');       // boolean
$table->date('birthday');           // date
$table->dateTime('published_at');   // datetime
$table->timestamp('expires_at');    // timestamp

// JSON types
$table->json('settings');           // json
$table->jsonb('metadata');          // jsonb (PostgreSQL)

// Special types
$table->uuid('uuid');               // uuid
$table->ipAddress('visitor');       // IP address
$table->macAddress('device');       // MAC address
$table->enum('status', ['active', 'inactive']);

// Modifiers
$table->string('email')->unique();
$table->string('name')->nullable();
$table->string('country')->default('FR');
$table->string('slug')->index();
$table->string('code')->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
```

## Indexes

```php
// Single column
$table->string('email')->unique();

// Composite index
$table->index(['make', 'model']);

// Named index
$table->index(['make', 'year'], 'vehicles_make_year_index');

// Foreign key with index
$table->foreignId('user_id')
    ->constrained()
    ->cascadeOnDelete()
    ->cascadeOnUpdate();
```

## Foreign Keys

```php
// Basic foreign key
$table->foreignId('user_id')->constrained();

// Custom table and column
$table->foreignId('author_id')
    ->constrained('users', 'id');

// On delete/update actions
$table->foreignId('user_id')
    ->constrained()
    ->cascadeOnDelete();        // CASCADE
    // ->restrictOnDelete();      // RESTRICT
    // ->nullOnDelete();          // SET NULL
    // ->noActionOnDelete();      // NO ACTION

// Raw foreign key
$table->foreign('category_id')
    ->references('id')
    ->on('categories')
    ->onDelete('cascade');
```

## Modifying Tables

```php
// Add column
Schema::table('vehicles', function (Blueprint $table) {
    $table->string('color')->after('model');
});

// Modify column (requires dbal)
composer require doctrine/dbal

Schema::table('vehicles', function (Blueprint $table) {
    $table->string('make', 100)->change();
});

// Rename column
Schema::table('vehicles', function (Blueprint $table) {
    $table->renameColumn('price', 'price_eur');
});

// Drop column
Schema::table('vehicles', function (Blueprint $table) {
    $table->dropColumn(['color', 'description']);
});
```

## Database Commands

```bash
# Run all pending migrations
php artisan migrate

# Run migrations and fresh (drop all tables first)
php artisan migrate:fresh

# Run migrations with seeding
php artisan migrate --seed

# Rollback last migration
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset

# Rollback and migrate again
php artisan migrate:refresh

# Rollback, migrate, and seed
php artisan migrate:refresh --seed

# Show migration status
php artisan migrate:status

# Create migration dump (for production)
php artisan schema:dump
```

## Soft Deletes

```php
// Add soft deletes column
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes();
});

// Or in create
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->softDeletes();
    $table->timestamps();
});

// Model must use SoftDeletes trait
// app/Models/User.php
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model
{
    use SoftDeletes;
}
```

## Timestamps

```php
// Default timestamps
$table->timestamps();

// Custom timestamps
$table->timestamp('created_at')->nullable();
$table->timestamp('updated_at')->nullable();

// No timestamps
Schema::create('cache', function (Blueprint $table) {
    $table->id();
    $table->string('key');
    $table->text('value');
    // No timestamps()
});

// Model: disable timestamps
class Cache extends Model
{
    public $timestamps = false;
}
```

## Working with Multiple Connections

```php
Schema::connection('tenant')->create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
});
```

## Best Practices

1. **Schema first**: Design before coding
2. **Use foreign keys**: Enforce referential integrity
3. **Add indexes**: Improve query performance
4. **Use appropriate types**: Don't over-size columns
5. **Use enums wisely**: For fixed values
6. **Soft delete**: Use soft deletes instead of hard deletes
7. **Document**: Add comments in migrations for team
8. **Test migrations**: Run migrate:fresh before deploying

## Common Patterns

### Auditing Columns

```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->decimal('total', 10, 2);

    // Audit columns
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->foreignId('updated_by')->nullable()->constrained('users');
    $table->timestamp('deleted_at')->nullable();

    $table->timestamps();
});
```

### Multi-Tenancy

```php
Schema::create('tenants', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('domain')->unique();
    $table->timestamps();
});

Schema::table('users', function (Blueprint $table) {
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->unique(['tenant_id', 'email']); // Unique per tenant
});
```

### Polymorphic Relations

```php
Schema::create('images', function (Blueprint $table) {
    $table->id();
    $table->string('url');
    $table->unsignedBigInteger('imageable_id');
    $table->string('imageable_type');
    $table->timestamps();

    $table->index(['imageable_id', 'imageable_type']);
});
```
