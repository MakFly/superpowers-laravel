# Reference

---
name: laravel:factories-seeders
description: Test data generation with factories and seeders
---

# Factories and Seeders

## Creating Factories

```bash
# Create factory for model
php artisan make:factory VehicleFactory
```

## Basic Factory

```php
// database/factories/VehicleFactory.php
namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        return [
            'make' => fake()->randomElement(['Renault', 'Peugeot', 'Citroën', 'Tesla']),
            'model' => fake()->words(2, true),
            'year' => fake()->numberBetween(2015, 2024),
            'price' => fake()->randomFloat(2, 5000, 100000),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['active', 'sold', 'pending']),
            'user_id' => User::factory(),
        ];
    }
}
```

## Fake Data Providers

```php
// Personal info
fake()->name()
fake()->firstName()
fake()->lastName()
fake()->email()
fake()->phoneNumber()
fake()->address()
fake()->city()
fake()->postcode()
fake()->country()

// Numbers
fake()->randomNumber()
fake()->numberBetween(1, 100)
fake()->randomFloat(2, 0, 1000)

// Text
fake()->word()
fake()->words(3)
fake()->sentence()
fake()->paragraph()
fake()->text()

// Internet
fake()->url()
fake()->domainName()
fake()->userName()
fake()->password()

// Dates
fake()->date()
fake()->dateTime()
fake()->dateTimeBetween('-1 year', 'now')

// Localization (French)
fake('fr_FR')->name()
fake('fr_FR')->address()
fake('fr_FR')->phoneNumber()

// Custom locale in config
// config/app.php
'faker_locale' => 'fr_FR',
```

## Factory Relationships

```php
// BelongsTo (creates related record)
return [
    'user_id' => User::factory(),
];

// HasMany (creates parent with multiple children)
User::factory()
    ->has(Vehicle::factory()->count(3))
    ->create();

// ManyToMany
User::factory()
    ->has(Role::factory()->count(3))
    ->create();

// With pivot data
User::factory()
    ->hasAttached(
        Role::factory()->count(3),
        ['expires' => now()->addDays(30)]
    )
    ->create();
```

## Factory States

```php
// database/factories/VehicleFactory.php
class VehicleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'make' => fake()->randomElement(['Renault', 'Peugeot']),
            'model' => fake()->word(),
            'year' => fake()->numberBetween(2015, 2024),
            'price' => fake()->randomFloat(2, 5000, 100000),
            'status' => 'active',
        ];
    }

    // State: Sold vehicle
    public function sold(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sold',
        ]);
    }

    // State: Expensive vehicle
    public function expensive(): static
    {
        return $this->state(fn (array $attributes) => [
            'price' => fake()->randomFloat(2, 50000, 100000),
        ]);
    }

    // State: Tesla
    public function tesla(): static
    {
        return $this->state(fn (array $attributes) => [
            'make' => 'Tesla',
            'model' => fake()->randomElement(['Model 3', 'Model Y', 'Model S']),
        ]);
    }
}

// Usage
Vehicle::factory()->sold()->create();
Vehicle::factory()->expensive()->count(5)->create();
Vehicle::factory()->tesla()->count(10)->create();
```

## Factory Callbacks

```php
// After creating
public function configure(): static
{
    return $this->afterMaking(function (Vehicle $vehicle) {
        // After making (not saving)
    })->afterCreating(function (Vehicle $vehicle) {
        // After creating (saved)
        $vehicle->images()->create([
            'url' => fake()->imageUrl(),
        ]);
    });
}
```

## Using Factories

```php
// Create single (inserts in DB)
$vehicle = Vehicle::factory()->create();

// Create multiple
$vehicles = Vehicle::factory()->count(10)->create();

// Make only (no DB insert)
$vehicle = Vehicle::factory()->make();

// Raw array (no model)
$data = Vehicle::factory()->raw();

// With overrides
$vehicle = Vehicle::factory()->create([
    'make' => 'Tesla',
    'price' => 50000,
]);

// With states
Vehicle::factory()->sold()->count(5)->create();

// With relationships
User::factory()
    ->has(Vehicle::factory()->count(3))
    ->create();
```

## Seeders

```bash
# Create seeder
php artisan make:seeder VehicleSeeder
```

```php
// database/seeders/VehicleSeeder.php
namespace Database\Seeders;

use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        // Create users with vehicles
        User::factory()
            ->count(10)
            ->has(Vehicle::factory()->count(3))
            ->create();

        // Or using relationship
        Vehicle::factory()->count(30)->create();
    }
}
```

## Main DatabaseSeeder

```php
// database/seeders/DatabaseSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            VehicleSeeder::class,
            RoleSeeder::class,
        ]);
    }
}
```

## Running Seeders

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=VehicleSeeder

# Run migrations and seed
php artisan migrate:fresh --seed

# Force seed in production
php artisan db:seed --force
```

## Seeder with Conditions

```php
// database/seeders/DatabaseSeeder.php
public function run(): void
{
    // Only run if table is empty
    if (User::count() === 0) {
        User::factory()->count(10)->create();
    }

    // Or use firstOrCreate
    User::firstOrCreate(
        ['email' => 'admin@example.com'],
        ['name' => 'Admin', 'password' => bcrypt('password')]
    );
}
```

## Production Data

```php
// database/seeders/ProductionSeeder.php
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        // Don't use fake data in production
        User::create([
            'name' => env('ADMIN_NAME'),
            'email' => env('ADMIN_EMAIL'),
            'password' => bcrypt(env('ADMIN_PASSWORD')),
        ]);
    }
}

// Run only in production
// php artisan db:seed --class=ProductionSeeder
```

## Best Practices

1. **Use factories**: Never create test data manually
2. **Use states**: Reuse factory variations
3. **Test with factories**: Make them deterministic
4. **Separate environments**: Different seeders for dev/staging/prod
5. **Use transactions**: Wrap seeders in transactions for rollback
6. **Clean up**: Use migrate:fresh to reset
7. **Seed what you need**: Don't over-seed

## Common Patterns

### Development Seeder

```php
// database/seeders/DevelopmentSeeder.php
class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::factory()->admin()->create([
            'email' => 'admin@example.com',
        ]);

        // Test users
        User::factory()->count(10)->create();

        // Vehicles
        Vehicle::factory()->tesla()->count(5)->create();
        Vehicle::factory()->sold()->count(10)->create();
        Vehicle::factory()->count(50)->create();
    }
}
```

### Testing with Factories

```php
// tests/Feature/VehicleTest.php
use App\Models\Vehicle;

it('displays vehicles', function () {
    Vehicle::factory()->count(3)->create();

    get('/vehicles')
        ->assertStatus(200)
        ->assertJsonCount(3);
});

it('filters by make', function () {
    Vehicle::factory()->tesla()->create();
    Vehicle::factory()->create(['make' => 'Renault']);

    get('/vehicles?make=Tesla')
        ->assertJsonCount(1)
        ->assertJsonPath('data.0.make', 'Tesla');
});
```

### Related Data Creation

```php
// Create user with profile
User::factory()
    ->has(Profile::factory())
    ->create();

// Create post with comments
Post::factory()
    ->has(Comment::factory()->count(3))
    ->create();

// Create user with posts and comments on posts
User::factory()
    ->has(
        Post::factory()
            ->has(Comment::factory()->count(3))
            ->count(5)
    )
    ->create();
```
