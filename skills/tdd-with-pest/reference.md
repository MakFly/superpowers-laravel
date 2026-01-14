# Reference

---
name: laravel:tdd-with-pest
description: Test-Driven Development workflow with Pest PHP for Laravel applications
---

# TDD with Pest for Laravel

## The RED-GREEN-REFACTOR Cycle

### 1. RED: Write a failing test

```php
// tests/Feature/UserServiceTest.php
use function Pest\Laravel\get;
use App\Models\User;

it('can get a user by id', function () {
    $user = User::factory()->create();

    get("/api/users/{$user->id}")
        ->assertStatus(200)
        ->assertJson([
            'id' => $user->id,
            'name' => $user->name,
        ]);
});
```

### 2. GREEN: Make it pass (minimal implementation)

```php
// routes/api.php
Route::get('/users/{id}', function ($id) {
    return User::findOrFail($id);
});
```

### 3. REFACTOR: Improve the code

```php
// app/Http/Controllers/UserController.php
class UserController extends Controller
{
    public function show($id)
    {
        return new UserResource(User::findOrFail($id));
    }
}
```

## Pest Testing Patterns

### Unit Tests

```php
// tests/Unit/PriceCalculatorTest.php
use App\Services\PriceCalculator;

it('calculates price with tax', function () {
    $calculator = new PriceCalculator(taxRate: 0.2);

    $price = $calculator->calculate(100);

    expect($price)->toBe(120.0);
});
```

### Feature Tests

```php
// tests/Feature/CreateOrderTest.php
use App\Models\User;
use Illuminate\Auth\AuthenticationException;

it('creates an order', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->post('/orders', [
            'product_id' => $product->id,
            'quantity' => 2,
        ])
        ->assertStatus(201)
        ->assertJsonFragment(['total' => 200]);
});

it('requires authentication', function () {
    post('/orders', [
        'product_id' => $product->id,
        'quantity' => 2,
    ])->assertStatus(401);
});
```

### Data Providers

```php
// tests/Unit/ValidatorTest.php
use App\Rules\FrenchLicensePlate;

it('validates french license plates', function (string $plate, bool $valid) {
    $rule = new FrenchLicensePlate();

    expect($rule->passes('plate', $plate))->toBe($valid);
})->with([
    ['AA-123-BB', true],
    ['AB-123-CD', true],
    ['123-456-789', false],
    ['AB-123', false],
]);
```

### Testing JSON APIs

```php
// tests/Feature/Api/VehicleIndexTest.php
it('paginates vehicles', function () {
    Vehicle::factory()->count(25)->create();

    get('/api/vehicles')
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'make', 'model', 'price']
            ],
            'links',
            'meta',
        ]);
});

it('filters vehicles by make', function () {
    Vehicle::factory()->create(['make' => 'Renault']);
    Vehicle::factory()->create(['make' => 'Peugeot']);

    get('/api/vehicles?make=Renault')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.make', 'Renault');
});
```

### Testing Database

```php
// tests/Feature/UserModelTest.php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('has many posts', function () {
    $user = User::factory()
        ->has(Post::factory()->count(3))
        ->create();

    expect($user->posts)->toHaveCount(3);
});
```

### Testing Jobs

```php
// tests/Unit/Jobs/SendWelcomeEmailJobTest.php
use App\Jobs\SendWelcomeEmailJob;
use Illuminate\Support\Facades\Queue;
use App\Models\User;

it('queues the job', function () {
    Queue::fake();

    $user = User::factory()->create();
    dispatch(new SendWelcomeEmailJob($user));

    Queue::assertPushed(SendWelcomeEmailJob::class);
});

it('sends the email', function () {
    Mail::fake();

    $user = User::factory()->create();
    dispatch_sync(new SendWelcomeEmailJob($user));

    Mail::assertSent(WelcomeEmail::class);
});
```

### Testing Events

```php
// tests/Unit/Listeners/SendNotificationListenerTest.php
use App\Events\OrderCreated;
use App\Listeners\SendNotificationListener;
use Illuminate\Support\Facades\Event;

it('listens to order created event', function () {
    Event::fake();

    Event::assertListening(
        OrderCreated::class,
        SendNotificationListener::class
    );
});
```

## Best Practices

1. **One assertion per test**: Keep tests focused
2. **Use factories**: Don't create data manually
3. **Test behavior, not implementation**: Focus on what, not how
4. **Use descriptive names**: `it_creates_order` instead of `it_works`
5. **Arrange-Act-Assert**: Structure tests clearly
6. **Mock external services**: Don't hit real APIs in tests
7. **Use `expect()` over `$this->assertTrue()`**: Pest's assertion API is more readable

## Running Tests

```bash
# Run all tests
php artisan test

# Run specific file
php artisan test --filter UserServiceTest

# Run with coverage
php artisan test --coverage

# Run only failing tests from last run
php artisan test --repeat

# Parallel testing (requires parallel package)
php artisan test --parallel
```
