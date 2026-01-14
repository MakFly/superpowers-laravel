---
name: /laravel-test
description: Generate test with Pest or PHPUnit
---

# Laravel Test Generator

I'll help you create a test for your Laravel application.

## Usage

```bash
# Pest PHP test
php artisan pest:test VehicleTest

# PHPUnit Feature test
php artisan make:test VehicleTest

# PHPUnit Unit test
php artisan make:test PriceCalculatorTest --unit
```

## Feature Test Example (Pest)

```php
// tests/Feature/VehicleTest.php
use App\Models\User;
use App\Models\Vehicle;

uses()->group('vehicles')->in(__DIR__);

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('displays vehicles list', function () {
    Vehicle::factory()->count(3)->create();

    actingAs($this->user)
        ->get('/vehicles')
        ->assertStatus(200)
        ->assertJsonCount(3);
});

it('creates a new vehicle', function () {
    $data = Vehicle::factory()->raw();

    actingAs($this->user)
        ->postJson('/vehicles', $data)
        ->assertStatus(201)
        ->assertJsonFragment($data);
});

it('validates required fields', function () {
    actingAs($this->user)
        ->postJson('/vehicles', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['make', 'model']);
});
```

## Feature Test Example (PHPUnit)

```php
// tests/Feature/VehicleControllerTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

class VehicleControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function it_displays_vehicles_list()
    {
        Vehicle::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get('/vehicles');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    /** @test */
    public function it_creates_a_new_vehicle()
    {
        $data = Vehicle::factory()->raw();

        $response = $this->actingAs($this->user)
            ->postJson('/vehicles', $data);

        $response->assertStatus(201)
            ->assertJsonFragment($data);

        $this->assertDatabaseHas('vehicles', $data);
    }
}
```

## Unit Test Example

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

    /** @test */
    public function it_calculates_discount()
    {
        $calculator = new PriceCalculator(taxRate: 0.2);

        $price = $calculator->withDiscount(100, 10);

        $this->assertEquals(108.0, $price);
    }
}
```

## Testing Patterns

### API Endpoint
```php
it('returns paginated results', function () {
    Vehicle::factory()->count(25)->create();

    get('/api/vehicles')
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['*' => ['id', 'make', 'model']],
            'links',
            'meta',
        ]);
});
```

### Authentication
```php
it('requires authentication', function () {
    postJson('/vehicles', [])
        ->assertStatus(401);
});
```

### Authorization
```php
it('forbids unauthorized access', function () {
    $vehicle = Vehicle::factory()->for(User::factory()->create())->create();

    actingAs(User::factory()->create())
        ->deleteJson("/vehicles/{$vehicle->id}")
        ->assertStatus(403);
});
```

What test would you like me to create?
1. Tell me what you want to test (model, controller, service)
2. Describe the test scenario
3. Choose Pest or PHPUnit
4. I'll generate the test code
