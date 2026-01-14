---
name: /laravel-tdd-phpunit
description: Start TDD workflow with PHPUnit
---

# TDD Workflow with PHPUnit

I'll help you implement Test-Driven Development with PHPUnit for your Laravel application.

## Quick Start

```bash
# Run all tests
php artisan test

# Run specific test class
php artisan test --testsuite=Feature

# Run with coverage
php artisan test --coverage

# Stop on first failure
php artisan test --stop-on-failure
```

## The TDD Cycle

1. **Write a failing test** (RED)
2. **Make it pass** (GREEN)
3. **Refactor** (REFACTOR)

## Example Feature Test

```php
// tests/Feature/VehicleSearchTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Vehicle;

class VehicleSearchTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_filters_vehicles_by_make()
    {
        Vehicle::factory()->create(['make' => 'Tesla']);
        Vehicle::factory()->create(['make' => 'Renault']);

        $response = $this->getJson('/api/vehicles?make=Tesla');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.make', 'Tesla');
    }
}
```

## Example Unit Test

```php
// tests/Unit/PriceCalculatorTest.php
namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PriceCalculator;

class PriceCalculatorTest extends TestCase
{
    /** @test */
    public function it_calculates_price_with_tax()
    {
        $calculator = new PriceCalculator(taxRate: 0.2);

        $price = $calculator->calculate(100);

        $this->assertEquals(120.0, $price);
    }
}
```

## Common Test Patterns

### API Testing
```php
/** @test */
public function it_creates_a_vehicle()
{
    $data = Vehicle::factory()->raw();

    $response = $this->actingAs(User::factory()->create())
        ->postJson('/api/vehicles', $data);

    $response->assertStatus(201)
        ->assertJsonFragment($data);
}
```

### Database Testing
```php
/** @test */
public function it_persists_vehicle_to_database()
{
    $vehicle = Vehicle::factory()->create();

    $this->assertTrue($vehicle->exists);
    $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id]);
}
```

### Testing Jobs
```php
/** @test */
public function it_queues_the_job()
{
    Queue::fake();

    dispatch(new ProcessPayment($order));

    Queue::assertPushed(ProcessPaymentJob::class);
}
```

Would you like me to help you with:
1. Writing a specific test?
2. Setting up PHPUnit configuration?
3. Testing existing code?
4. Something else?
