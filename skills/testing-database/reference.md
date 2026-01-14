# Reference

---
name: laravel:testing-database
description: Database testing with transactions, refresh, and factories in Laravel
---

# Database Testing in Laravel

## Database Migrations in Tests

```php
// tests/TestCase.php (base test class)
namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
}
```

## RefreshDatabase Trait

```php
// tests/Feature/VehicleTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

class VehicleTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_a_vehicle()
    {
        $vehicle = Vehicle::factory()->create([
            'make' => 'Tesla',
            'model' => 'Model 3',
        ]);

        $this->assertDatabaseHas('vehicles', [
            'make' => 'Tesla',
            'model' => 'Model 3',
        ]);
    }
}
```

## DatabaseTransactions Trait

```php
use Illuminate\Foundation\Testing\DatabaseTransactions;

class VehicleTest extends TestCase
{
    use DatabaseTransactions;

    /** @test */
    public function it_creates_a_vehicle()
    {
        // Wraps test in transaction and rolls back
        $vehicle = Vehicle::factory()->create();

        $this->assertDatabaseHas('vehicles', [
            'id' => $vehicle->id,
        ]);
    }
}
```

## Difference: RefreshDatabase vs DatabaseTransactions

| Trait | Behavior | Use Case |
|-------|----------|----------|
| `RefreshDatabase` | Migrates fresh for each test class | Slower, cleaner isolation |
| `DatabaseTransactions` | Wraps each test in transaction | Faster, good for unit tests |

## Factories in Tests

```php
use App\Models\User;
use App\Models\Vehicle;

/** @test */
public function it_displays_user_vehicles()
{
    $user = User::factory()->create();
    $vehicles = Vehicle::factory()->count(3)->for($user)->create();

    $response = $this->actingAs($user)
        ->get('/vehicles');

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data');
}
```

## Asserting Database State

```php
// Assert record exists
$this->assertDatabaseHas('vehicles', [
    'make' => 'Tesla',
    'model' => 'Model 3',
]);

// Assert record missing
$this->assertDatabaseMissing('vehicles', [
    'id' => 999,
]);

// Assert table empty
$this->assertDatabaseEmpty('vehicles');

// Assert table count
$this->assertDatabaseCount('vehicles', 5);

// Assert record exists by ID
$this->assertDatabaseHas('vehicles', [
    'id' => $vehicle->id,
]);
```

## Accessing Database in Tests

```php
use Illuminate\Support\Facades\DB;

/** @test */
public function it_updates_vehicle_status()
{
    $vehicle = Vehicle::factory()->create(['status' => 'active']);

    $this->put("/vehicles/{$vehicle->id}", ['status' => 'sold']);

    // Direct DB query
    $dbVehicle = DB::table('vehicles')->where('id', $vehicle->id)->first();
    $this->assertEquals('sold', $dbVehicle->status);
}
```

## Testing Relationships

```php
/** @test */
public function user_has_many_vehicles()
{
    $user = User::factory()->hasVehicles(3)->create();

    $this->assertCount(3, $user->vehicles);
    $this->assertInstanceOf(Vehicle::class, $user->vehicles->first());
}

/** @test */
public function vehicle_belongs_to_user()
{
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->for($user)->create();

    $this->assertEquals($user->id, $vehicle->user_id);
    $this->assertInstanceOf(User::class, $vehicle->user);
}
```

## Testing Soft Deletes

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class VehicleTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_soft_deletes_vehicle()
    {
        $vehicle = Vehicle::factory()->create();

        $this->delete("/vehicles/{$vehicle->id}")
            ->assertStatus(204);

        $this->assertSoftDeleted('vehicles', [
            'id' => $vehicle->id,
        ]);

        // Still in DB with deleted_at
        $this->assertDatabaseHas('vehicles', [
            'id' => $vehicle->id,
            'deleted_at' => now(),
        ]);
    }
}
```

## In-Memory SQLite (Fastest)

```php
// phpunit.xml
<php>
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE" value=":memory:"/>
</php>

// Or in test
/** @test */
public function it_tests_with_sqlite()
{
    config(['database.default' => 'sqlite']);
    config(['database.connections.sqlite.database' => ':memory:']);

    $this->artisan('migrate');

    Vehicle::factory()->create();

    $this->assertDatabaseHas('vehicles', ['id' => 1]);
}
```

## Testing Migrations

```php
use Illuminate\Support\Facades\Schema;

/** @test */
public function vehicles_table_has_expected_columns()
{
    $this->assertTrue(Schema::hasTable('vehicles'));

    $this->assertTrue(Schema::hasColumns('vehicles', [
        'id', 'make', 'model', 'year', 'price', 'created_at', 'updated_at'
    ]));

    // Check column types
    $this->assertTrue(Schema::hasColumn('vehicles', 'make'));
}
```

## Seeding in Tests

```php
/** @test */
public function it_lists_vehicles_from_seeder()
{
    $this->seed(VehicleSeeder::class);
    // Or
    $this->seed();

    $response = $this->get('/vehicles');
    $response->assertStatus(200);
}
```

## Testing with Multiple Connections

```php
/** @test */
public function it_crosses_database_connections()
{
    config(['database.default' => 'mysql']);

    $vehicle = Vehicle::factory()->create();

    config(['database.default' => 'sqlite']);

    $this->assertDatabaseHas('vehicles', [
        'id' => $vehicle->id,
    ], 'mysql');
}
```

## Testing Factories

```php
/** @test */
public function vehicle_factory_creates_valid_vehicle()
{
    $vehicle = Vehicle::factory()->create();

    $this->assertDatabaseHas('vehicles', [
        'make' => $vehicle->make,
        'model' => $vehicle->model,
    ]);

    $this->assertNotEmpty($vehicle->make);
    $this->assertGreaterThanOrEqual(1900, $vehicle->year);
}
```

## Testing Events

```php
use Illuminate\Support\Facades\Event;

/** @test */
public function it_dispatches_event_on_vehicle_creation()
{
    Event::fake([VehicleCreated::class]);

    Vehicle::factory()->create();

    Event::assertDispatched(VehicleCreated::class);
}
```

## Testing Jobs

```php
use Illuminate\Support\Facades\Queue;
use App\Jobs\ProcessVehicle;

/** @test */
public function it_queues_vehicle_processing()
{
    Queue::fake();

    $vehicle = Vehicle::factory()->create();

    ProcessVehicle::dispatch($vehicle);

    Queue::assertPushed(ProcessVehicle::class);
}
```

## Testing Database Transactions

```php
use Illuminate\Support\Facades\DB;

/** @test */
public function it_rolls_back_on_error()
{
    DB::beginTransaction();

    try {
        Vehicle::factory()->create();
        throw new \Exception('Test error');
    } catch (\Exception $e) {
        DB::rollBack();
    }

    $this->assertDatabaseMissing('vehicles', ['id' => 1]);
}
```

## Testing Query Scopes

```php
/** @test */
public function active_scope_filters_active_vehicles()
{
    Vehicle::factory()->create(['status' => 'active']);
    Vehicle::factory()->create(['status' => 'sold']);
    Vehicle::factory()->create(['status' => 'pending']);

    $activeVehicles = Vehicle::active()->get();

    $this->assertCount(1, $activeVehicles);
    $this->assertEquals('active', $activeVehicles->first()->status);
}
```

## Testing Accessors & Mutators

```php
/** @test */
public function price_accessor_formats_correctly()
{
    $vehicle = Vehicle::factory()->create(['price' => 15000]);

    // Assuming accessor converts to formatted string
    $this->assertEquals('15 000,00 €', $vehicle->formatted_price);
}

/** @test */
public function slug_mutator_creates_slug()
{
    $vehicle = Vehicle::factory()->create([
        'make' => 'Tesla',
        'model' => 'Model 3',
    ]);

    $this->assertEquals('tesla-model-3', $vehicle->slug);
}
```

## Testing Casts

```php
/** @test */
public function json_cast_works_correctly()
{
    $vehicle = Vehicle::factory()->create([
        'metadata' => ['color' => 'red', 'year' => 2024]
    ]);

    $this->assertIsArray($vehicle->metadata);
    $this->assertEquals('red', $vehicle->metadata['color']);
}
```

## Best Practices

1. **Use RefreshDatabase**: For feature tests
2. **Use DatabaseTransactions**: For fast unit tests
3. **Use SQLite**: For fastest tests
4. **Test relationships**: Verify foreign keys work
5. **Test constraints**: Validate database rules
6. **Clean up**: Use traits to handle cleanup
7. **Avoid external services**: Mock or fake them
8. **Test migrations**: Ensure schema is correct
9. **Use factories**: Don't manually create data
10. **Isolate tests**: Each test should be independent

## Common Patterns

### Custom RefreshDatabase

```php
trait RefreshDatabaseWithSeeders
{
    use RefreshDatabase;

    protected function refreshDatabase()
    {
        $this->artisan('migrate:fresh', [
            '--seed' => true,
        ]);
    }
}
```

### Test Database States

```php
trait WithVehicles
{
    protected function setupVehicles($count = 3)
    {
        return Vehicle::factory()->count($count)->create();
    }
}
```

### Assert Model Events

```php
$this->expectsEvents([VehicleCreated::class]);

Vehicle::factory()->create();
```

### Disable Foreign Key Checks

```php
Schema::disableForeignKeyConstraints();

// Run tests

Schema::enableForeignKeyConstraints();
```

### Test Specific Database

```php
config(['database.connections.testing.database' => 'test_db']);

$this->artisan('migrate:fresh');

// Run tests
```
