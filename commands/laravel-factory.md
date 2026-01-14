---
name: /laravel-factory
description: Generate factory for model
---

# Laravel Factory Generator

I'll help you create a factory for generating test data.

## Usage

```bash
# Generate factory
php artisan make:factory VehicleFactory

# Generate factory with model
php artisan make:factory VehicleFactory --model=Vehicle
```

## Example Factory

```php
// database/factories/VehicleFactory.php
namespace Database\Factories;

use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'make' => fake()->randomElement(['Renault', 'Peugeot', 'Citroën', 'Tesla']),
            'model' => fake()->words(2, true),
            'year' => fake()->numberBetween(2015, 2024),
            'price' => fake()->randomFloat(2, 5000, 100000),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['active', 'sold', 'pending']),
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
```

## Using Factories

```php
// Create single (inserts in DB)
$vehicle = Vehicle::factory()->create();

// Create multiple
$vehicles = Vehicle::factory()->count(10)->create();

// Make only (no DB insert)
$vehicle = Vehicle::factory()->make();

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

## Fake Data Providers

```php
// Personal info
fake()->name()
fake()->email()
fake()->phoneNumber()
fake()->address()
fake()->city()

// Numbers
fake()->numberBetween(1, 100)
fake()->randomFloat(2, 0, 1000)

// Text
fake()->word()
fake()->sentence()
fake()->paragraph()

// French localization
fake('fr_FR')->name()
fake('fr_FR')->address()
```

What factory would you like to create?
1. Tell me the model name
2. Describe the fields and relationships
3. I'll generate the factory code
