---
name: /laravel-tdd-pest
description: Start TDD workflow with Pest PHP
---

# TDD Workflow with Pest PHP

I'll help you implement Test-Driven Development with Pest PHP for your Laravel application.

## Quick Start

```bash
# Install Pest
composer require pestphp/pest --dev
php artisan pest:install

# Run tests
php artisan test

# Run specific test
php artisan test --testsuite=Feature --filter=VehicleTest
```

## The TDD Cycle

1. **Write a failing test** (RED)
2. **Make it pass** (GREEN)
3. **Refactor** (REFACTOR)

## Example Feature Test

```php
// tests/Feature/VehicleSearchTest.php
use App\Models\Vehicle;

it('filters vehicles by make', function () {
    Vehicle::factory()->create(['make' => 'Tesla']);
    Vehicle::factory()->create(['make' => 'Renault']);

    get('/api/vehicles?make=Tesla')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.make', 'Tesla');
});
```

## Example Unit Test

```php
// tests/Unit/PriceCalculatorTest.php
use App\Services\PriceCalculator;

it('calculates price with tax', function () {
    $calculator = new PriceCalculator(taxRate: 0.2);

    $price = $calculator->calculate(100);

    expect($price)->toBe(120.0);
});
```

## Common Test Patterns

### API Testing
```php
it('creates a vehicle', function () {
    $data = Vehicle::factory()->raw();

    actingAs(User::factory()->create())
        ->postJson('/api/vehicles', $data)
        ->assertStatus(201)
        ->assertJsonFragment($data);
});
```

### Database Testing
```php
it('persists vehicle to database', function () {
    $vehicle = Vehicle::factory()->create();

    expect($vehicle->exists)->toBeTrue();
    $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id]);
});
```

### Testing Jobs
```php
it('queues the job', function () {
    Queue::fake();

    dispatch(new ProcessPayment($order));

    Queue::assertPushed(ProcessPaymentJob::class);
});
```

Would you like me to help you with:
1. Writing a specific test?
2. Setting up Pest configuration?
3. Testing existing code?
4. Something else?
